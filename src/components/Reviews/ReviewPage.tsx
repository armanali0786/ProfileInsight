import React, { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import LinkedInLoader from "../Loader/LinkedInLoader";
import Loader from "../Loader/Loader";
import ReviewRelations from "../ReviewRelations";
import ReviewForm from "./ReviewForm";
import ReviewsList from "./ReviewsList";
import axios from "axios";
import { AuthData, API_BASE_URL } from "../../config";

import {
  storeReviewsInDB,
  getReviewsByLinkedInId,
  storeLinkedInUsersDetails,
  getUserDetailsByLinkedInId,
} from "../../indexedDB";
import ReviewHeader from "./ReviewHeader";
import AddComment from "./AddComment";
import CommonLoader from "../Loader/CommonLoader";
import { defaultCategoryRatings } from "../../constants/reputation";

export default function ReviewPage({
  reviews,
  setReviews,
  totalReviews,
  fetchAllReviews,
  reviewerTotalReviewCount,
  setReviewerTotalReviewCount,
  fetchTotalReviewCount,
  myProfileImage,
}) {
  const ActionRef = useRef([]);
  const ReplyActionRef = useRef([]);
  const userInfo = localStorage.getItem("LoginUserData");
  const parsedInfo = JSON.parse(userInfo);
  const contactId = parsedInfo.contact_id;

  const [isLinkedIn, setIsLinkedIn] = useState(false);
  const [linkedInUserDetails, setLinkedInUserDetails] = useState({
    name: "",
    location: "",
    headline: "",
    profilePic: "",
    profileUrl: "",
  });
  const [extraData, setExtraData] = useState<{
    profile_avg_rating: number;
    profile_total_ratings: number;
    show_claim_button: number;
    show_code_input: number;
    request_id: number;
    is_owner?: boolean;
    reputation?: {
      category_averages: Record<string, number | null>;
      would_work_again_pct: number | null;
      verified_count: number;
      unverified_count: number;
      total_reviews: number;
    };
  }>({
    profile_avg_rating: 0, // Default to a number
    profile_total_ratings: 0, // Default to a number
    show_claim_button: 0, // Default to a number
    show_code_input: 0, // Default to a number
    request_id: 0, // Default to an empty string
    reputation: {
      category_averages: {},
      would_work_again_pct: null,
      verified_count: 0,
      unverified_count: 0,
      total_reviews: 0,
    },
  });

  const [linkedInIdReviews, setLinkedInIdReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [linkedInUserId, setLinkedInUserId] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(null);
  const [replyActionDropdownOpen, setReplyActionDropdownOpen] = useState(null);
  const [showAddReply, setShowAddReply] = useState({});
  const [expandedReviewText, setExpandedReviewText] = useState({});
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hideReviewBtn, setHideReviewBtn] = useState(false);
  const [loadingApiResponse, setLoadingApiResponse] = useState(false);

  const [newReply, setNewReply] = useState({
    description: "",
  });
  const emptyReview = () => ({
    description: "",
    rating: 1,
    linkedInUserId: "",
    reviewId: "",
    is_anon: false,
    category_ratings: defaultCategoryRatings(),
    relationship_type: "worked_together",
    relationship_duration: "6_12m",
    would_work_again: true,
    standout_strength: "",
  });
  const [newReview, setNewReview] = useState(emptyReview());

  const [searchTerm, setSearchTerm] = useState("");
  const [lastLinkedInUserId, setLastLinkedInUserId] = useState(null);
  const [showClaimButton, setShowClaimButton] = useState(false);
  const [claimProfileInput, setClaimProfileInput] = useState(false);
  const [isClaimButtonDisabled, setIsClaimButtonDisabled] =
    useState<boolean>(false);

  class Review {
    createdAt: string;
  }

  const extractUserIdFromLinkedIn = (url) => {
    const regex = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/;
    const match = url.match(regex);
    return match && match[1] ? match[1] : null;
  };

  // Shared by both the tab-event effect below and the content script's
  // real-time SPA-navigation message handler, so either path can react
  // immediately to a profile change.
  const updateUserInfo = (url) => {
    setLoadingMessage(true);

    if (url && url.match(/^https:\/\/www\.linkedin\.com\/in\/.+/)) {
      setIsLinkedIn(true);
      const linkedInUserId = extractUserIdFromLinkedIn(url);
      if (linkedInUserId) {
        setLinkedInUserId(linkedInUserId);
        if (linkedInUserId !== lastLinkedInUserId) {
          // Reset the form for the new profile
          setShowReviewForm(false);
          setNewReview(emptyReview());
          setEditIndex(null);
        }
        setLastLinkedInUserId(linkedInUserId);
      } else {
        toast.error("Could not extract user ID from LinkedIn profile!");
      }
    } else {
      setIsLinkedIn(false);
    }
    setLoading(false); // Stop loader after checking
  };

  useEffect(() => {
    let timeoutId = null; // Store timeout ID

    // Handle tab activation (tab switch)
    const onTabActivated = (activeInfo) => {
      setLoading(true); // Start loader on tab change
      clearTimeout(timeoutId); // Clear any previous timeout
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
          updateUserInfo(tab.url);
        } else {
          setIsLinkedIn(false);
          setLoading(false);
        }
      });
    };

    // Handle tab update (URL change within the tab)
    const onTabUpdated = (tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete") {
        setLoading(true); // Start loader on URL change
        clearTimeout(timeoutId); // Clear any previous timeout
        if (tab.url) {
          updateUserInfo(tab.url);
        } else {
          setIsLinkedIn(false);
          setLoading(false);
        }
      }
    };

    // Initial call when component mounts
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        updateUserInfo(tabs[0].url);
      }
    });

    // Add listeners
    chrome.tabs.onActivated.addListener(onTabActivated);
    chrome.tabs.onUpdated.addListener(onTabUpdated);

    // Cleanup listeners when component unmounts
    return () => {
      chrome.tabs.onActivated.removeListener(onTabActivated);
      chrome.tabs.onUpdated.removeListener(onTabUpdated);
      // Clear timeout on unmount to prevent memory leaks
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [linkedInUserId]);

  const fetchReviewsFromIndexedDB = async (linkedInUserId) => {
    if (linkedInUserId) {
      try {
        const userReviewsData = await getReviewsByLinkedInId(linkedInUserId);
        return userReviewsData;
      } catch (error) {
        console.error("Failed to fetch reviews from IndexedDB:", error);
        return [];
      }
    }
  };

  function compareAndUpdateUserDetails(savedUserDetails, newUserDetails) {
    let isUpdated = false;

    const updatedDetails = { ...savedUserDetails };
    for (const key in newUserDetails) {
      if (newUserDetails[key] !== savedUserDetails[key]) {
        updatedDetails[key] = newUserDetails[key];
        isUpdated = true;
      }
    }

    return { updatedUserDetails: updatedDetails, isUpdated };
  }

  async function fetchUserDetailsByLinkedInId(linkedInUserId) {
    if (!linkedInUserId) return null;
    try {
      return await getUserDetailsByLinkedInId(linkedInUserId);
    } catch (error) {
      console.error(
        "Failed to fetch UserDetailsByLinkedInId from IndexedDB:",
        error
      );
      return null;
    }
  }

  useEffect(() => {
    const injectContentScript = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url.includes("linkedin.com")) {
          chrome.scripting.executeScript(
            {
              target: { tabId: activeTab.id },
              files: ["contentScript.js"],
            },
            () => {
              console.log("Content script injected into LinkedIn tab");
            }
          );
        }
      });
    };

    const handleChromeMessage = async (request) => {
      // LinkedIn's SPA navigation (profile-to-profile) doesn't reliably fire
      // chrome.tabs.onUpdated's "complete" status, so the content script
      // pushes URL changes directly for an immediate, real-time switch.
      if (request.type === "linkedinUrlChanged" && request.url) {
        updateUserInfo(request.url);
        return;
      }
      try {
        const userLinkedInData = await fetchUserDetailsByLinkedInId(
          linkedInUserId
        );
        // chrome.runtime.onMessage.addListener(async (request) => {
        if (request.userDetails) {
          if (
            userLinkedInData &&
            request.userDetails.profileUrl == userLinkedInData.profileUrl
          ) {
            const savedUserDetails = await getUserDetailsByLinkedInId(
              linkedInUserId
            );
            if (savedUserDetails) {
              const { updatedUserDetails, isUpdated } =
                compareAndUpdateUserDetails(
                  userLinkedInData,
                  request.userDetails
                );
              if (isUpdated) {
                console.log("Updating user details in IndexedDB.");
                setLinkedInUserDetails(updatedUserDetails);
                await storeLinkedInUsersDetails(
                  updatedUserDetails,
                  linkedInUserId
                );
              } else {
                console.log("No updates needed for user details.");
                setLinkedInUserDetails(userLinkedInData);
              }
            } else {
              console.log("Saving new user details in IndexedDB.");
              setLinkedInUserDetails(request.userDetails);
              await storeLinkedInUsersDetails(
                request.userDetails,
                linkedInUserId
              );
            }
          } else {
            console.log("userLinkedInData not found.");
            setLinkedInUserDetails(request.userDetails);
            await storeLinkedInUsersDetails(
              request.userDetails,
              linkedInUserId
            );
          }
          setLoading(false);
        }
        // });
      } catch (error) {
        console.error("Error in getUserDataAndStore:", error);
      }
    };

    injectContentScript();

    chrome.runtime.onMessage.addListener(handleChromeMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleChromeMessage);
    };
  }, [linkedInUserId]);

  const handleCancel = () => {};

  const fetchAllLinkedInUserReviews = async () => {
    if (!linkedInUserId) {
      console.log("linkedInUserId is not yet set.");
      return;
    }
    try {
      const userInfo = localStorage.getItem("LoginUserData");
      if (!userInfo) {
        console.error("No LoginUserData found in localStorage.");
        return;
      }
      const parsedInfo = JSON.parse(userInfo);
      const contactId = parsedInfo.contact_id;
      const formData = new FormData();
      formData.append("contact_id", contactId);
      formData.append("profile_id", linkedInUserId);
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/get_reviews`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      const data = response.data.data;
      // console.log("Now Fetching reviews from Api", data);
      const extrasData = response.data.extras;
      // setShowClaimButton(extrasData?.show_claim_button);
      // setClaimProfileInput(extrasData?.show_code_input);
      setShowClaimButton(extrasData?.show_claim_button == 1); // If it's 1, set true, else set false
      setClaimProfileInput(extrasData?.show_code_input == 1); // If it's 1, set true, else set false
      setExtraData({
        profile_avg_rating: extrasData?.profile_avg_rating || "",
        profile_total_ratings: extrasData?.profile_total_ratings || "",
        show_claim_button: extrasData?.show_claim_button || "",
        show_code_input: extrasData?.show_code_input || "",
        request_id: extrasData?.request_id || "",
        reputation: extrasData?.reputation,
        is_owner: Boolean(extrasData?.is_owner),
      });

      if (response.status == 200) {
        setLinkedInIdReviews(data);
        await storeReviewsInDB(data, linkedInUserId, contactId);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      handleApiError(error.response.data);
    }
  };

  const handleApiError = (response) => {
    toast.error(response.message || "Something went wrong.");
  };

  /*------------------ Handle Review Fetch Flow ----------------------*/
  const handleReviewFetchFlow = async (linkedInUserId) => {
    try {
      // Fetch reviews from IndexedDB
      const indexedDBReviews = await fetchReviewsFromIndexedDB(linkedInUserId);
      // Once IndexedDB fetch is complete, make API call to fetch more reviews
      if (indexedDBReviews && indexedDBReviews.length > 0) {
        setLinkedInIdReviews(indexedDBReviews);
        // Proceed with the API call after IndexedDB fetch
        await fetchAllLinkedInUserReviews();
      } else {
        // If IndexedDB fetch returns no reviews, make API call
        await fetchAllLinkedInUserReviews();
      }
    } catch (error) {
      console.error("Error during review fetch flow:", error);
      toast.error("An error occurred while fetching reviews.");
    }
  };

  useEffect(() => {
    if (linkedInUserId) {
      handleReviewFetchFlow(linkedInUserId);
    }
  }, [linkedInUserId]);

  /*-------------- Expand Review Text based on reviewId ---------------*/
  const ExpandReviewText = (reviewId) => {
    setExpandedReviewText((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  useEffect(() => {
    const userInfo = localStorage.getItem("LoginUserData");
    const parsedInfo = JSON.parse(userInfo);
    const contactId = parsedInfo.contact_id;
    const checkAlreadyReviewedProfile = linkedInIdReviews.some(
      (review) =>
        review.profile_id == linkedInUserId && review.reviewer_id == contactId
    );
    setHideReviewBtn(checkAlreadyReviewedProfile);
  }, [linkedInIdReviews, linkedInUserId]);

  const handleShowAddReview = () => {
    if (hideReviewBtn) {
      return; // Do nothing if already reviewed
    } else {
      // If not reviewed, toggle the review form visibility
      if (showReviewForm && editIndex !== null) {
        setNewReview(emptyReview());
        setEditIndex(null);
      }
      setShowReviewForm(!showReviewForm);
    }
  };

  /*-------------- Edit Review data  ---------------*/
  const handleEditReview = (reviewId) => {
    const reviewToEdit = linkedInIdReviews.find(
      (review) => review.review_id == reviewId
    );
    if (reviewToEdit) {
      setShowReviewForm(true);
      setNewReview({
        description: reviewToEdit.review_description,
        rating: reviewToEdit.rating,
        linkedInUserId: reviewToEdit.profile_id,
        reviewId: reviewToEdit.review_id,
        is_anon: reviewToEdit.is_anon,
        category_ratings: reviewToEdit.category_ratings || defaultCategoryRatings(),
        relationship_type: reviewToEdit.relationship_type || "worked_together",
        relationship_duration: reviewToEdit.relationship_duration || "6_12m",
        would_work_again:
          reviewToEdit.would_work_again === null || reviewToEdit.would_work_again === undefined
            ? true
            : reviewToEdit.would_work_again,
        standout_strength: reviewToEdit.standout_strength || "",
      });

      setEditIndex(reviews.findIndex((review) => review.review_id == reviewId));
      setReplyActionDropdownOpen(false);
    }
  };

  const handleClickOutside = (event) => {
    if (ActionRef.current.every((ref) => ref && !ref.contains(event.target))) {
      setActionDropdownOpen(null);
    }
    if (
      ReplyActionRef.current.every((ref) => ref && !ref.contains(event.target))
    ) {
      setReplyActionDropdownOpen(null);
    }
  };

  useEffect(() => {
    if (actionDropdownOpen || replyActionDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionDropdownOpen, replyActionDropdownOpen]);

  const handleClaimProfile = async () => {
    const loadingToastId = toast.loading("Sending request...");
    const formData = new FormData();
    formData.append("contact_id", contactId);
    formData.append("profile_id", linkedInUserId);
    formData.append("profile_name", linkedInUserDetails.name);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/claim_profile`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      if (response.status == 200) {
        toast.success(response.data.message, { id: loadingToastId });
        setIsClaimButtonDisabled(true);
        setExtraData((prevState) => ({
          ...prevState,
          request_id: response.data.data.request_id,
        }));
        setShowClaimButton(false);
        setClaimProfileInput(true);
      }
    } catch (error) {
      console.error("Error :", error.status);
      if (error.status === 409) {
        handleApiError(error.response.data);
      }
    }
  };

  const handleCancelClaim = async () => {
    const loadingToastId = toast.loading("processing cancel request...");
    const formData = new FormData();
    formData.append("contact_id", contactId);
    formData.append("profile_id", linkedInUserId);
    formData.append("profile_name", linkedInUserDetails.name);
    if (extraData && extraData.request_id !== undefined) {
      formData.append("request_id", extraData.request_id.toString());
    } else {
      console.error("extraData or request_id is undefined");
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/cancel_claim_request`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      if (response.status == 200) {
        toast.success(response.data.message, { id: loadingToastId });
        setIsClaimButtonDisabled(false);
        setShowClaimButton(true);
        setClaimProfileInput(false);
      }
    } catch (error) {
      console.error("Error :", error.status);
      if (error.status === 409) {
        handleApiError(error.response.data);
      }
    }
  };

  const handleSubmitClaim = async (code) => {
    if (!code) {
      toast.error("Please enter the claim code", {});
      return;
    }
    const loadingToastId = toast.loading("processing profile claim request...");
    const formData = new FormData();
    formData.append("contact_id", contactId);
    formData.append("profile_id", linkedInUserId);
    formData.append("code", code);
    if (extraData && extraData.request_id !== undefined) {
      formData.append("request_id", extraData.request_id.toString());
    } else {
      console.error("extraData or request_id is undefined");
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/confirm_claim_request`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      if (response.status == 200) {
        toast.success(response.data.message, { id: loadingToastId });
        setShowClaimButton(false);
        setClaimProfileInput(false);
      }
    } catch (error) {
      console.error("Error :", error.status);
      if (error.status === 409) {
        handleApiError(error.response.data);
      }
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
        }}
      />
      {loading ? (
        <Loader
          existingReview={existingReview}
          errorMessage={errorMessage}
          handleEditReview={handleEditReview}
          handleCancel={handleCancel}
          loadingMessage={loadingMessage}
          isLinkedIn={isLinkedIn}
          actionDropdownOpen={actionDropdownOpen}
          expandedReviewText={expandedReviewText}
          setExpandedReviewText={setExpandedReviewText}
          ExpandReviewText={ExpandReviewText}
          setActionDropdownOpen={setActionDropdownOpen}
        />
      ) : (
        <>
          {isLinkedIn ? (
            <>
              <div className="ScrollableContent border-t border-BorderColor-15 relative !flex-none">
                <ReviewHeader
                  profileId={linkedInUserId}
                  linkedInUserDetails={linkedInUserDetails}
                  handleShowAddReview={handleShowAddReview}
                  hideReviewBtn={hideReviewBtn}
                  showClaimButton={showClaimButton}
                  handleClaimProfile={handleClaimProfile}
                  claimProfileInput={claimProfileInput}
                  handleCancelClaim={handleCancelClaim}
                  handleSubmitClaim={handleSubmitClaim}
                  isClaimButtonDisabled={isClaimButtonDisabled}
                  extraData={extraData}
                />
                {/* {reviews.length > 3 && (
                  <button className="w-1/3 mt-2 bg-[#ffbf72] text-black hover:bg-secondary/80 px-4 py-2 rounded">
                    View review
                  </button>
                )} */}
                {/* {showReviewForm ? ( */}
                {loadingApiResponse ? (
                  <CommonLoader />
                ) : showReviewForm ? (
                  <ReviewForm
                    reviews={reviews}
                    newReview={newReview}
                    setNewReview={setNewReview}
                    editIndex={editIndex}
                    setReviews={setReviews}
                    linkedInUserId={linkedInUserId}
                    setActionDropdownOpen={setActionDropdownOpen}
                    setEditIndex={setEditIndex}
                    setShowReviewForm={setShowReviewForm}
                    linkedInUserDetails={linkedInUserDetails}
                    setLinkedInIdReviews={setLinkedInIdReviews}
                    fetchAllLinkedInUserReviews={fetchAllLinkedInUserReviews}
                    fetchAllReviews={fetchAllReviews}
                    reviewerTotalReviewCount={reviewerTotalReviewCount}
                    fetchTotalReviewCount={fetchTotalReviewCount}
                    setReviewerTotalReviewCount={setReviewerTotalReviewCount}
                    setExtraData={setExtraData}
                    setLoadingApiResponse={setLoadingApiResponse}
                  />
                ) : (
                  <ReviewsList
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    extraData={extraData}
                    profileName={linkedInUserDetails.name}
                    reviews={reviews}
                    setNewReview={setNewReview}
                    setEditIndex={setEditIndex}
                    setReviews={setReviews}
                    setShowReviewForm={setShowReviewForm}
                    handleEditReview={handleEditReview}
                    ActionRef={ActionRef}
                    ReplyActionRef={ReplyActionRef}
                    actionDropdownOpen={actionDropdownOpen}
                    setActionDropdownOpen={setActionDropdownOpen}
                    linkedInUserId={linkedInUserId}
                    setLinkedInIdReviews={setLinkedInIdReviews}
                    linkedInIdReviews={linkedInIdReviews}
                    fetchAllLinkedInUserReviews={fetchAllLinkedInUserReviews}
                    setReplyActionDropdownOpen={setReplyActionDropdownOpen}
                    replyActionDropdownOpen={replyActionDropdownOpen}
                    setShowAddReply={setShowAddReply}
                    showAddReply={showAddReply}
                    newReply={newReply}
                    setNewReply={setNewReply}
                    fetchAllReviews={fetchAllReviews}
                    reviewerTotalReviewCount={reviewerTotalReviewCount}
                    fetchTotalReviewCount={fetchTotalReviewCount}
                    setReviewerTotalReviewCount={setReviewerTotalReviewCount}
                    setExtraData={setExtraData}
                    setLoadingApiResponse={setLoadingApiResponse}
                    myProfileImage={myProfileImage}
                  />
                )}
              </div>
            </>
          ) : !isLinkedIn && reviewerTotalReviewCount < 3 ? (
            <ReviewRelations
              reviewerTotalReviewCount={reviewerTotalReviewCount}
            />
          ) : (
            !isLinkedIn &&
            reviewerTotalReviewCount >= 3 && (
              <div className="flex justify-center items-center h-screen">
                <LinkedInLoader handleCancel={handleCancel} />
              </div>
            )
          )}
        </>
      )}
    </>
  );
}
