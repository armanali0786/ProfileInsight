import React, { useState } from "react";
import { addReview, updateReview } from "../../indexedDB";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { AuthData } from "../../config";
import { useNavigate } from "react-router-dom";
export default function ReviewForm({
  setHoveredStar,
  hoveredStar,
  newReview,
  setNewReview,
  editIndex,
  reviews,
  setReviews,
  setActionDropdownOpen,
  setEditIndex,
  linkedInUserId,
  setShowReviewForm,
  linkedInUserDetails,
  setLinkedInIdReviews,
  fetchAllLinkedInUserReviews,
  fetchAllReviews,
  reviewerTotalReviewCount,
  fetchTotalReviewCount,
  setReviewerTotalReviewCount,
  setExtraData,
  setLoadingApiResponse,
}) {
  const navigate = useNavigate();
  const [isAnonymous, setIsAnonymous] = useState(false);

  /*------------------  Submit new Review  ----------------------*/
  const submitReview = async (
    contactId,
    profileId,
    description,
    isAnon,
    rating
  ) => {
    const formData = new FormData();
    formData.append("task", "1");
    formData.append("contact_id", contactId);
    formData.append("profile_id", profileId);
    formData.append("description", description);
    formData.append("is_anon", isAnon);
    formData.append("rating", rating);
    formData.append("profile_name", linkedInUserDetails.name);
    setLoadingApiResponse(true);
    try {
      const userInfo = localStorage.getItem("LoginUserData");
      const parsedInfo = JSON.parse(userInfo);
      const response = await axios.post(
        "https://app.revil.app/admin/reviews/submit_review",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );

      if (response.status == 200) {
        const newReview = response.data.data;
        console.log("newReview", newReview);
        setShowReviewForm(false);
        toast.success(response.data.message);
        setLoadingApiResponse(false);
        const reviewResponseData = {
          contactId,
          ...newReview,
        };
        await addReview(reviewResponseData, setReviews);
        setLinkedInIdReviews((prevReviews) => [newReview, ...prevReviews]);
        const formData = new FormData();
        formData.append("contact_id", contactId);
        const AccountStatus = parsedInfo.account_status;
        let updatedAccountStatus = AccountStatus;
        if (AccountStatus > 2) {
          const accountStatusResponse = await axios.post(
            "https://app.revil.app/admin/api/contacts/update_account_status",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                authtoken: AuthData.token,
              },
            }
          );
          if (accountStatusResponse.status === 200) {
            const extrasData = response.data.extra;
            setExtraData({
              profile_avg_rating: extrasData.profile_avg_rating || "",
              profile_total_ratings: extrasData.profile_total_ratings || "",
              show_claim_button: extrasData.show_claim_button || "",
              show_code_input: extrasData.show_code_input || "",
              request_id: extrasData.request_id || ''
            });
            updatedAccountStatus = AccountStatus - 1;
            parsedInfo.account_status = updatedAccountStatus;
            localStorage.setItem("LoginUserData", JSON.stringify(parsedInfo));
          }
        }
        if (reviewerTotalReviewCount <= 3) {
          fetchTotalReviewCount();
        } else {
          setReviewerTotalReviewCount(Number(reviewerTotalReviewCount) + 1);
        }
      } else if (response.status === 409) {
        setShowReviewForm(false);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error submitting review:", error.status);
      if (error.status === 409) {
        handleApiError(error.response.data);
        // toast.error(error.response.data.message);
      }
    }
  };

  const handleApiError = (response) => {
    toast.error(response.message || "Something went wrong.");
  };

  /*------------------  Update Review  ----------------------*/
  const updateReviewData = async (updatedReview) => {
    setLoadingApiResponse(true);
    try {
      const userInfo = localStorage.getItem("LoginUserData");
      const parsedInfo = JSON.parse(userInfo);
      const contactId = parsedInfo.contact_id;

      const formData = new FormData();
      formData.append("contact_id", contactId);
      formData.append("review_id", updatedReview.reviewId);
      formData.append("profile_id", linkedInUserId);
      formData.append("description", updatedReview.description);
      formData.append("rating", updatedReview.rating);
      formData.append("is_anon", updatedReview.is_anon);
      formData.append("created_at", updatedReview.createdAt);
      formData.append("updated_at", new Date().toISOString());
      const response = await axios.post(
        "https://app.revil.app/admin/reviews/update_review",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      if (response.status == 200) {
        const updatedReviewData  =  response.data.data;
        const extrasData = response.data.extra;
        toast.success(response.data.message);
        setLoadingApiResponse(false);
        setLinkedInIdReviews((prevReviews) => 
          prevReviews.map((review) => 
            review.review_id === updatedReview.reviewId 
              ? { ...review, ...updatedReviewData }  // Replace the old review with the updated one
              : review
          )
        );
        setExtraData({
          profile_avg_rating: extrasData.profile_avg_rating || "",
          profile_total_ratings: extrasData.profile_total_ratings || "",
          show_claim_button: extrasData.show_claim_button || "",
          show_code_input: extrasData.show_code_input || "",
          request_id: extrasData.request_id || ''
        });
        return response.data;
      } else {
        throw new Error(response.data.message || "Error updating review.");
      }
    } catch (error) {
      console.error("Error during review update:", error);
      handleApiError(error.response.data);
      throw error;
    }
  };

  /*------------------  Submit Review  ----------------------*/

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    const userInfo = localStorage.getItem("LoginUserData");
    const parsedInfo = JSON.parse(userInfo);
    const contactId = parsedInfo.contact_id;

    const trimmedDescription = newReview.description.trim();
    if (trimmedDescription === "") {
      toast.error("Review description cannot be empty.");
      // setLoadingApiResponse(false);
      return;
    }
    if (trimmedDescription.length < 5) {
      toast.error("Review description must be at least 5 characters long.");
      // setLoadingApiResponse(false);
      return;
    }
    if (newReview) {
      try {
        if (editIndex !== null || editIndex === -1) {
          const updatedReview = {
            ...reviews[editIndex],
            description: newReview.description,
            reviewId: newReview.reviewId,
            rating: newReview.rating,
            is_anon: newReview.is_anon,
            createdAt: new Date().toISOString(),
          };

          const response = await updateReviewData(updatedReview);
          if (response.status == true) {
            updateReview(
              updatedReview.reviewId,
              response.data,
              setLinkedInIdReviews
            );
          }
          setActionDropdownOpen(false);
          
          setShowReviewForm(false);
          setEditIndex(null);
        } else {
          await submitReview(
            contactId,
            linkedInUserId,
            newReview.description,
            newReview.is_anon ? "1" : "0",
            newReview.rating
          );
        }
        setNewReview({ description: "", rating: 1, linkedInUserId: "" });
        // await fetchAllLinkedInUserReviews();
        fetchAllReviews();
        const reviewFormData = JSON.parse(
          localStorage.getItem("reviewFormData")
        );
        if (reviewFormData) {
          reviewFormData.status = "completed";
          reviewFormData.text = newReview.text;
          localStorage.setItem(
            "reviewFormData",
            JSON.stringify(reviewFormData)
          );
        }
      } catch (error) {
        toast.error("Error saving review. Please try again.");
      }
    }
  };

  /*------------------  Add Star Rating  ----------------------*/
  const handleStarClick = (event, index) => {
    event.preventDefault();
    setNewReview({ ...newReview, rating: index + 1 });
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
         <form className=" pt-30px pb-10px" onSubmit={handleSubmitReview}>
        {/* label check start  */}
        <div className="flex justify-between items-center relative CheckBoxMain">
          <label
            htmlFor="anonymous"
            className=" w-[calc(100%-25px)] truncate text-base"
          >
            write a review as a anonymous
          </label>
          <input
            type="checkbox"
            id="anonymous"
            name="anonymous"
            checked={newReview.is_anon === "1"}
            onChange={(e) =>
              setNewReview({
                ...newReview,
                is_anon: e.target.checked ? "1" : "0",
              })
            }
            // onChange={() => setIsAnonymous(!isAnonymous)}
            value="Bike"
            className="custom-Check-box z-[2]"
          />
          <div className="CheckBox"></div>
        </div>
        {/* label check end  */}
        {/* reting section start  */}
        <div className="w-full py-20px flex items-center justify-between gap-[15px]">
          {Array.from({ length: 5 }, (_, index) => (
            <button
              key={index}
              onMouseEnter={() => setHoveredStar(index)}
              onMouseLeave={() => setHoveredStar(null)}
              onClick={(event) => handleStarClick(event, index)}
              className="outline-none"
            >
              <svg
                width="41"
                height="41"
                viewBox="0 0 41 41"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_627_3648)">
                  <path
                    d="M21.6772 4.62395L25.3976 13.4902C25.4877 13.7054 25.6347 13.8919 25.823 14.0296C26.0112 14.1673 26.2335 14.2511 26.4659 14.2718L35.9887 15.095C36.2414 15.1153 36.4824 15.2101 36.6812 15.3674C36.8799 15.5247 37.0276 15.7374 37.1054 15.9786C37.1833 16.2199 37.1878 16.4788 37.1185 16.7226C37.0491 16.9664 36.909 17.1842 36.7159 17.3484L29.4912 23.6505C29.3156 23.8048 29.1851 24.0037 29.1134 24.2262C29.0418 24.4487 29.0318 24.6864 29.0844 24.9141L31.2497 34.2897C31.3069 34.5346 31.2908 34.7909 31.2034 35.0266C31.116 35.2624 30.9611 35.4673 30.7581 35.6157C30.5551 35.764 30.3129 35.8494 30.0617 35.8611C29.8105 35.8728 29.5614 35.8103 29.3455 35.6814L21.1615 30.7166C20.9626 30.5957 20.7344 30.5317 20.5016 30.5317C20.2689 30.5317 20.0407 30.5957 19.8418 30.7166L11.6578 35.6814C11.4419 35.8103 11.1928 35.8728 10.9416 35.8611C10.6904 35.8494 10.4482 35.764 10.2452 35.6157C10.0421 35.4673 9.88727 35.2624 9.79986 35.0266C9.71244 34.7909 9.69634 34.5346 9.75356 34.2897L11.9189 24.9141C11.9715 24.6864 11.9615 24.4487 11.8898 24.2262C11.8182 24.0037 11.6877 23.8048 11.5121 23.6505L4.28743 17.3484C4.09428 17.1842 3.95416 16.9664 3.88482 16.7226C3.81547 16.4788 3.82 16.2199 3.89784 15.9786C3.97569 15.7374 4.12334 15.5247 4.32211 15.3674C4.52089 15.2101 4.76186 15.1153 5.01454 15.095L14.5374 14.2718C14.7698 14.2511 14.992 14.1673 15.1803 14.0296C15.3685 13.8919 15.5156 13.7054 15.6057 13.4902L19.3261 4.62395C19.4255 4.39472 19.5897 4.19954 19.7986 4.06244C20.0074 3.92534 20.2518 3.85229 20.5016 3.85229C20.7515 3.85229 20.9959 3.92534 21.2047 4.06244C21.4136 4.19954 21.5778 4.39472 21.6772 4.62395Z"
                    stroke="#F5D5A3"
                    stroke-width="2.50709"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill={
                      index <=
                      (hoveredStar !== null
                        ? hoveredStar
                        : newReview.rating - 1)
                        ? "#F5D5A3"
                        : "none"
                    }
                  />
                </g>
                <defs>
                  <clipPath id="clip0_627_3648">
                    <rect width="41" height="41" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </button>
          ))}
        </div>
        <div className=" flex flex-col gap-30px flex-grow">
          <textarea
            id="w3review"
            name="w3review"
            rows={6}
            value={newReview.description}
            onChange={(e) =>
              setNewReview({ ...newReview, description: e.target.value })
            }
            className="FromInput"
            placeholder="Describe your experience with the agent..."
          ></textarea>
          <div className="">
            <button type="submit" className="btn sign-in-btn">
              {editIndex !== null ? "UPDATE REVIEW" : "SUBMIT"}
            </button>
           
          </div>
        </div>
        {/* reting section end  */}
        </form>
    </>
  );
}
