import React, { useState, useEffect, useRef } from "react";
import NoDataFoundIcon from "../../assets/images/no-data-found.png";
import UserProfile from "../../assets/images/user-profile.png";
import OneRetingStar from "../../assets/images/one-star.png";
import HalfRetingStar from "../../assets/images/half-star.png";
import ThreeDots from "../../assets/images/three-dots.png";
import LikeIcon from "../../assets/images/like-icon.png";
import LikedIcon from "../../assets/images/liked-icon.png";
import toast, { Toaster } from 'react-hot-toast';
import EditIcon from "../../assets/images/edit.png";
import DeleteIcon from "../../assets/images/delete.png";
import DeleteConfirmation from "../DeleteConfirmation";
import { AuthData, API_BASE_URL } from "../../config";
import DownArror from "../../assets/images/down-arror.png";

import {
  deleteReview,
  getReviewsByLinkedInId,
  getAllUsers,
  deleteCommentFromReview,
} from "../../indexedDB";
import axios from "axios";
import AddComment from "./AddComment";

export default function ReviewsList({
  reviews,
  setNewReview,
  linkedInUserId,
  setEditIndex,
  setReviews,
  searchTerm,
  setSearchTerm,
  setShowReviewForm,
  handleEditReview,
  setActionDropdownOpen,
  actionDropdownOpen,
  ActionRef,
  setLinkedInIdReviews,
  linkedInIdReviews,
  fetchAllLinkedInUserReviews,
  setReplyActionDropdownOpen,
  replyActionDropdownOpen,
  ReplyActionRef,
  showAddReply,
  setShowAddReply,
  newReply,
  setNewReply,
  fetchAllReviews,
  reviewerTotalReviewCount,
  fetchTotalReviewCount,
  setReviewerTotalReviewCount,
  setExtraData,
  setLoadingApiResponse,
  myProfileImage
}) {
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [selectedReplyId, setSelectedReplyId] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isReplyModalOpen, setReplyModalOpen] = useState(false);
  const [expandedReviewText, setExpandedReviewText] = useState({});
  const [expandedReplyText, setExpandedReplyText] = useState({});
  const [sortOption, setSortOption] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [editReplyIndex, setEditReplyIndex] = useState(null);

  /*-------------- Format Review Date ---------------*/
  const formatDate = (dateString) => {
    return new Date(dateString)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/\./g, ""); // Removes any dots if they appear in the month abbreviation
  };

  /*-------------- Handle Multiple Dropdown (Search, Filter, Action) ---------------*/
  const handleActionDropdown = (reviewId) => {
    setActionDropdownOpen((prevId) => (prevId === reviewId ? null : reviewId));
  };

  /*-------------- ReplyActionDropdown ---------------*/
  const handleReplyActionDropdown = (replyId) => {
    setReplyActionDropdownOpen((prevId) =>
      prevId === replyId ? null : replyId
    );
  };

  /*-------------- open Delete ReviewModal ---------------*/
  const openDeleteModal = (reviewId) => {
    setSelectedReviewId(reviewId);
    setModalOpen(true);
  };

  /*-------------- open Delete ReplyModal ---------------*/
  const openDeleteReplyModal = (replyId, reviewId) => {
    setSelectedReplyId(replyId);
    setSelectedReviewId(reviewId);
    setReplyModalOpen(true);
  };

  /*-------------- Delete review ---------------*/
  const handleDeleteReview = async () => {
    setLoadingApiResponse(true);
    const userInfo = localStorage.getItem("LoginUserData");
    const parsedInfo = JSON.parse(userInfo);
    const contactId = parsedInfo.contact_id;

    // Find the review to delete
    const review = linkedInIdReviews.find(
      (rev) => rev.review_id === selectedReviewId
    );
    if (review && review.reviewer_id == contactId) {
      try {
        const formData = new FormData();
        console.log("profile_id", review.profile_id);
        console.log("review", review);
        formData.append("review_id", review.review_id);
        formData.append("contact_id", contactId);
        formData.append("profile_id", review.profile_id);
        const response = await axios.post(
          `${API_BASE_URL}/admin/reviews/delete_review`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              authtoken: AuthData.token,
            },
          }
        );
        if (response.status == 200) {
          const extrasData = response.data.extra;
          setExtraData({
            profile_avg_rating: extrasData?.profile_avg_rating || "",
            profile_total_ratings: extrasData?.profile_total_ratings || "",
            show_claim_button: extrasData?.show_claim_button || "",
            show_code_input: extrasData?.show_code_input || "",
            request_id: extrasData?.request_id || "",
          })
          deleteReview(selectedReviewId, setLinkedInIdReviews);
          toast.success(response.data.message);
          setLoadingApiResponse(false);
          setLinkedInIdReviews((prevReviews) =>
            prevReviews.filter((rev) => rev.review_id != selectedReviewId)
          );
          const userInfo = localStorage.getItem("LoginUserData");
          const parsedInfo = JSON.parse(userInfo);
       
          const AccountStatus = parsedInfo.account_status;
          console.log("Account status", AccountStatus);
          let updatedAccountStatus = AccountStatus;
          console.log("Outside AccountStatus", AccountStatus);
            if(AccountStatus < 5) {
              console.log("Inside AccountStatus", AccountStatus);
              if(reviewerTotalReviewCount == 1){
                updatedAccountStatus = 3;
              }else{
                updatedAccountStatus +=1 ;
              }
              const formData = new FormData();
              formData.append("contact_id", contactId);
              formData.append("status", updatedAccountStatus);
              const accountStatusResponse = await axios.post(
                `${API_BASE_URL}/admin/api/contacts/update_account_status`,
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                    authtoken: AuthData.token,
                  },
                }
              );
              if (accountStatusResponse.status === 200) {
                setLoadingApiResponse(false);
                parsedInfo.account_status = updatedAccountStatus;
                localStorage.setItem("LoginUserData", JSON.stringify(parsedInfo));
              }
              
            }
          if (reviewerTotalReviewCount <= 3) {
            fetchTotalReviewCount();
          } else {
            setReviewerTotalReviewCount(Number(reviewerTotalReviewCount) - 1);
          }
          setModalOpen(false);
        } else if (response.status === 403) {
          const result = response.data;
          toast.error(
            result.message ||
              "You are not authorized to delete this review or review does not exist."
          );
        } else if (response.status === 409) {
          const result = response.data;
          toast.error(
            result.message ||
              "Validation error occurred. Please check the request."
          );
        } else if (response.status === 500) {
          const result = response.data;
          toast.error(
            result.message || "Something went wrong. Please try again later."
          );
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      } catch (error) {
        handleApiError(error.response.data);
        toast.error("An error occurred. Please try again.");
      }
    }
  };

  /*-------------- Delete review Reply ---------------*/
  const handleDeleteReply = async () => {
    const userInfo = localStorage.getItem("LoginUserData");
    const parsedInfo = JSON.parse(userInfo);
    const contactId = parsedInfo.contact_id;

    // Find the review based on the review_id
    const review = linkedInIdReviews.find(
      (rev) => rev.review_id == selectedReviewId
    );

    // Find the comment based on the comment_id
    const comment = review.comments.find(
      (comm) => comm.comment_id == selectedReplyId
    );

    // Check if the current user is allowed to delete the comment
    if (
      comment &&
      (comment.reviewer_id == contactId || review.reviewer_id == contactId)
    ) {
      try {
        const formData = new FormData();
        formData.append("comment_id", selectedReplyId);
        formData.append("contact_id", contactId);

        const response = await axios.post(
          `${API_BASE_URL}/admin/reviews/comments/delete_comment`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              authtoken: AuthData.token,
            },
          }
        );
        if (response.status == 200) {
          const updatedComments = review.comments.filter(
            (comm) => String(comm.comment_id) !== String(selectedReplyId)
          );

          const updatedReview = {
            ...review,
            comments: updatedComments,
          };

          const updatedReviews = linkedInIdReviews.map((rev) =>
            rev.review_id == selectedReviewId ? updatedReview : rev
          );
          await deleteCommentFromReview(selectedReviewId, selectedReplyId);
          // toast.success(response.data.message);
          setLinkedInIdReviews(updatedReviews);
          setReplyModalOpen(false);
        } else if (response.status === 403) {
          toast.error("You are not authorized to delete this comment.");
        } else if (response.status === 409) {
          toast.error("Validation error occurred. Please check the request.");
        } else if (response.status === 500) {
          toast.error("Something went wrong. Please try again later.");
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      } catch (error) {
        console.log(error);
        if (error.response) {
          handleApiError(error.response.data);
        }
      }
    } else {
      toast.error("You do not have permission to delete this comment.");
    }
  };

  const handleApiError = (response) => {
    toast.error(response.message || "Something went wrong.");
    setNewReply({ description: "" });
  };

  /*-------------- Expand Review Text based on reviewId ---------------*/
  const ExpandReviewText = (reviewId) => {
    setExpandedReviewText((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const ExpandReplyText = (reviewId) => {
    setExpandedReplyText((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  /*-------------- Like and Dislike Api Implementation --------------*/
  const handleLike = async (reviewId) => {
    const formData = new FormData();
    formData.append("review_id", reviewId);
    formData.append("contact_id", contactId);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/like_review`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      if (response.status === 200) {
        const updatedReview = response.data.data;

        // Update the local state directly to reflect the new like status
        setLinkedInIdReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.review_id == reviewId
              ? { ...review, is_liked: updatedReview.is_liked }
              : review
          )
        );
        toast.success(response.data.message);
        // setLinkedInIdReviews(response.data.data.is_liked);
      } else {
        console.error("Error liking the review:", response.data.message);
      }
    } catch (error) {
      console.error("Error during the API request:", error.message);
      handleApiError(error.response.data);
    }
  };

  /*-------------- Like and Dislike Api Implementation --------------*/
  const handleReplyLike = async (commentId) => {
    const formData = new FormData();
    formData.append("comment_id", commentId);
    formData.append("contact_id", contactId);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/comments/like_comment`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      if (response.status === 200) {
        const updatedLikeStatus = response.data.data.is_liked;
        setLinkedInIdReviews((prevReviews) =>
          prevReviews.map((review) => {
            const updatedComments = review.comments.map((comment) => {
              if (comment.comment_id === commentId) {
                return {
                  ...comment,
                  is_liked: updatedLikeStatus,
                };
              }
              return comment;
            });

            return { ...review, comment: updatedComments };
          })
        );
        // toast.success(response.data.message);
      } else {
        console.error("Error liking the review:", response.data.message);
      }
    } catch (error) {
      handleApiError(error.response.data);
      console.error("Error during the API request:", error.message);
    }
  };

  /*-------------- Sort the listing Reviews --------------*/
  const sortReviews = (reviews, sortOption) => {
    if (!Array.isArray(reviews)) return [];
    switch (sortOption) {
      case "Highest":
        return reviews.sort((a, b) => Number(b.rating) - Number(a.rating));
      case "Lowest":
        return reviews.sort((a, b) => Number(a.rating) - Number(b.rating));
      case "Newest":
        return reviews.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      default:
        return reviews;
    }
  };

  const sortedReviews = Array.isArray(linkedInIdReviews)
    ? sortReviews([...linkedInIdReviews], sortOption)
    : [];

  // const userId = localStorage.getItem("logInUserId");
  const userInfo = localStorage.getItem("LoginUserData");
  const parsedInfo = JSON.parse(userInfo);
  const contactId = parsedInfo.contact_id;

  /*-------------- Pagination Ellipsis  Handling ---------------*/
  const reviewsPerPage = 3;
  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const ReviewDatas = sortedReviews.slice(
    startIndex,
    startIndex + reviewsPerPage
  );

  /*-------------- Pagination Previous page ---------------*/
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  /*-------------- Pagination Next page ---------------*/
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  /*-------------- Set Current Page ---------------*/
  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  /*-------------- Render Pagination Items Ellipsis ---------------*/
  const renderPaginationItems = () => {
    const items = [];

    // Always show the first page
    items.push(
      <li key={1}>
        <button
          className={`PaginetionItems ${currentPage === 1 ? "active" : ""}`}
          onClick={() => handlePageClick(1)}
        >
          1
        </button>
      </li>
    );

    // If the current page is greater than 2, show an ellipsis
    if (currentPage > 2 && totalPages > 3) {
      items.push(<li key="start-ellipsis">...</li>);
    }

    // Show the current page if it's not the first or last page
    if (currentPage !== 1 && currentPage !== totalPages) {
      items.push(
        <li key={currentPage}>
          <button
            className="PaginetionItems active"
            onClick={() => handlePageClick(currentPage)}
          >
            {currentPage}
          </button>
        </li>
      );
    }

    // If the current page is less than totalPages - 1, show an ellipsis before the last page
    if (currentPage < totalPages - 1 && totalPages > 3) {
      items.push(<li key="end-ellipsis">...</li>);
    }

    // Always show the last page (if there are more than 1 page)
    if (totalPages > 1) {
      items.push(
        <li key={totalPages}>
          <button
            className={`PaginetionItems ${
              currentPage === totalPages ? "active" : ""
            }`}
            onClick={() => handlePageClick(totalPages)}
          >
            {totalPages}
          </button>
        </li>
      );
    }

    return items;
  };

  /*-------------- Handle Edit Reply ----------------*/
  const handleEditReply = (replyId, reviewId) => {
    const replyReviewToEdit = linkedInIdReviews.find((review) =>
      review.comments.some((comment) => comment.comment_id === replyId)
    );
    if (replyReviewToEdit) {
      const commentToEdit = replyReviewToEdit.comments.find(
        (comment) => comment.comment_id === replyId
      );
      setShowAddReply(true);
      setNewReply({
        description: commentToEdit.comment_description,
      });
      setEditReplyIndex(replyId);
      setReplyActionDropdownOpen(false);
      setShowAddReply((prevState) => ({
        ...prevState,
        [reviewId]: true,
      }));
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
      <div className="RetingCardMain">
        <div className="flex flex-col gap-3 pt-15px pb-10px">
          <div className=" text-sm text-BlackColor font-light">Sort by</div>
          <div className="grid grid-cols-3 gap-[5px]">
            <a
              onClick={() => setSortOption("Newest")}
              className="h-7 text-xs flex justify-center items-center border border-BorderColor-15 rounded-[5px] cursor-pointer"
            >
              Newest
            </a>
            <a
              onClick={() => setSortOption("Highest")}
              className="h-7 text-xs flex justify-center items-center border border-BorderColor-15 rounded-[5px] cursor-pointer"
            >
              Highest
            </a>
            <a
              onClick={() => setSortOption("Lowest")}
              className="h-7 text-xs flex justify-center items-center border border-BorderColor-15 rounded-[5px] cursor-pointer"
            >
              Lowest
            </a>
          </div>
        </div>
        {Array.isArray(ReviewDatas) && ReviewDatas.length > 0 ? (
          ReviewDatas.map((review, index) => {
            return (
              <div className="RetingCard">
                <div className="flex flex-col gap-1">
                  <div className=" flex items-center gap-[15px] justify-between">
                    <div className="flex gap-2 w-[calc(100%-45px)]">
                      <div className="overflow-hidden rounded-full h-7 w-7">
                        <img
                          src={
                            review.is_anon == 1
                              ? UserProfile
                              : // Prefer the freshly-known local avatar for the viewer's own
                                // reviews so a just-uploaded photo shows immediately, instead
                                // of waiting on this review's server-cached reviewer_profile_img.
                              contactId == review.reviewer_id && myProfileImage
                              ? `${API_BASE_URL}/uploads/profile/${myProfileImage}`
                              : review.reviewer_profile_img
                              ? `${API_BASE_URL}/uploads/profile/${review.reviewer_profile_img}`
                              : UserProfile
                          }
                          className=" object-cover h-full w-full"
                        />
                      </div>
                      <div className="flex items-center w-[calc(100%-48px)] ">
                        <span className="text-sm font-semibold truncate max-w-full leading-[1] capitalize">
                          {" "}
                          {review.reviewer_fullname}
                        </span>
                        {/* <span className="text-[11px] text-BlackColor-60">
                          {review.reviewer_review_count} review
                        </span> */}
                      </div>
                    </div>
                    <div
                      className="relative flex"
                      ref={(el) => (ActionRef.current[index] = el)}
                    >
                      {/*  <button
                        className="h-[30px] w-[30px] rounded-md flex"
                        // onClick={() => handleLike(review.review_id)}
                      >
                         <img  src={review.is_liked ? LikeIcon : LikedIcon}  className="m-auto"  /> 
                        {review.is_liked == "1" ? (
                          // <LikedIcon />
                          <img src={LikedIcon} className="m-auto" />
                        ) : (
                          <img src={LikeIcon} className="m-auto" />
                        )}
                      </button>*/}
                      <button className="h-[30px] w-[30px] rounded-md flex">
                        <img
                          onClick={() => handleActionDropdown(review.review_id)}
                          src={ThreeDots}
                          className="m-auto"
                        />
                      </button>
                      {actionDropdownOpen == review.review_id &&
                        contactId == review.reviewer_id && (
                          <ul className="Dropdown !top-[30px] !right-[15px]">
                            <li className="DropdownItems">
                              <a
                                onClick={() =>
                                  handleEditReview(review.review_id)
                                }
                              >
                                <div>Edit</div>
                                <img src={EditIcon} className="h18w18" />
                              </a>
                            </li>
                            <li className="DropdownItems">
                              <a
                                onClick={() =>
                                  openDeleteModal(review.review_id)
                                }
                              >
                                <div>Delete</div>
                                <img src={DeleteIcon} className="h18w18" />
                              </a>
                            </li>
                          </ul>
                        )}
                    </div>
                    <DeleteConfirmation
                      isOpen={isModalOpen}
                      onClose={() => setModalOpen(false)}
                      onDelete={handleDeleteReview}
                    />
                  </div>
                  <div className=" flex items-center gap-[6px]">
                    <div className=" flex items-center gap-1">
                      {[...Array(Math.floor(review.rating))].map((_, i) => (
                        <img
                          key={i}
                          src={OneRetingStar}
                          className="h-[13] w-[13px]"
                          alt="Star"
                        />
                      ))}
                      {review.rating % 1 !== 0 && (
                        <img
                          src={HalfRetingStar}
                          className="h-[13] w-[13px]"
                          alt="Half Star"
                        />
                      )}
                    </div>
                    <span className="text-[11px] text-BlackColor-60">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
                <div
                  className={`text-[13px] font-light text-BlackColor relative ${
                    expandedReviewText[review.review_id] ? "" : "line-clamp-3"
                  }`}
                  style={{ overflow: "hidden" }} // To hide overflow content
                >
                  {/* <p>{highlightText(review.description, searchTerm)}</p> */}
                  {/* {review.review_description &&
                    review.review_description
                      .split(/\n\n/)
                      .map((paragraph, i, arr) => (
                        <span
                          key={i}
                          className={` break-words ${
                            i === arr.length - 1 ? "mb-0" : "block mb-2"
                          }`}
                        >
                          {paragraph}
                        </span>
                      ))} */}

                  {review.review_description &&
                    typeof review.review_description === "string" &&
                    review.review_description
                      .split(/\n\n/)
                      .map((paragraph, i, arr) => (
                        <span
                          key={i}
                          className={` break-words ${
                            i === arr.length - 1 ? "mb-0" : "block mb-2"
                          }`}
                        >
                          {paragraph}
                        </span>
                      ))}

                  {!expandedReviewText[review.review_id] &&
                    typeof review.review_description === "string" &&
                    review.review_description.split(" ").length > 20 && (
                      <a
                        className="cursor-pointer text-LinkedInBlue whitespace-nowrap font-medium absolute right-0 bottom-0"
                        onClick={() => ExpandReviewText(review.review_id)}
                        style={{
                          background: "white",
                          paddingLeft: "4px",
                        }}
                      >
                        <span className="mr-1 text-sm text-BlackColor-60">
                          ...
                        </span>
                        <span className="underline">Read more</span>
                      </a>
                    )}
                  {expandedReviewText[review.review_id] && (
                    <a
                      className="cursor-pointer text-LinkedInBlue whitespace-nowrap font-medium"
                      onClick={() => ExpandReviewText(review.review_id)}
                    >
                      <span className="underline !ml-1">Read less</span>
                    </a>
                  )}
                </div>
                {/* Reply & Hide start  */}
                {/* <div className=" flex items-center gap-15px">
                  <a
                    className=" text-BlackColor-60 text-[11px] cursor-pointer"
                    onClick={() => {
                      setShowAddReply((prevState) => ({
                        ...prevState,
                        [review.review_id]: !prevState[review.review_id],
                      }));
                    }}
                  >
                    Reply
                  </a>
                  <a className="text-BlackColor-60 text-[11px]  cursor-pointer">
                    Hide
                  </a>
                </div> */}
                {showAddReply[review.review_id] && (
                  <AddComment
                    profileId={linkedInUserId}
                    reviewId={review.review_id}
                    contactId={contactId}
                    reviewerId={review.reviewer_id}
                    newReply={newReply}
                    setNewReply={setNewReply}
                    setShowAddReply={setShowAddReply}
                    setEditReplyIndex={setEditReplyIndex}
                    editReplyIndex={editReplyIndex}
                    setLinkedInIdReviews={setLinkedInIdReviews}
                    fetchAllLinkedInUserReviews={fetchAllLinkedInUserReviews}
                  />
                )}
                {/* Reply & Hide end  */}
                {/* RetingCardReply start  */}
                {/**  {review.comments && review.comments.length > 0 && ( 
                  <div className="CommentsSection">
                    {review.comments.map((comment, index) => (
                      <div className="RetingCard RetingCardReply !gap-1">
                        <div className=" flex items-center gap-[15px] justify-between">
                          <div className="flex gap-2 w-[calc(100%-45px)] items-center">
                            <div className="overflow-hidden rounded-full h-6 w-6">
                              <img
                               src={`${API_BASE_URL}/uploads/profile/${comment.commenter_profile}`}
                                className=" object-cover h-full w-full"
                              />
                            </div>
                            <div className="flex flex-col w-[calc(100%-48px)] text-xs font-semibold truncate max-w-[calc(100%-90px)] leading-[1] capitalize">
                              {comment.commenter_fullname || "User Name"}
                            </div>
                          </div>
                          <div
                            className="relative flex"
                            ref={(el) => (ReplyActionRef.current[index] = el)}
                          >
                            <button
                              className="h-[30px] w-[30px] rounded-md flex"
                              onClick={() =>
                                handleReplyLike(comment.comment_id)
                              }
                            >
                              {comment.is_liked == "1" ? (
                                <img src={LikedIcon} className="m-auto" />
                              ) : (
                                <img src={LikeIcon} className="m-auto" />
                              )}
                            </button>
                            <button
                              className="h-[30px] w-[30px] rounded-md flex"
                              onClick={() =>
                                handleReplyActionDropdown(comment.comment_id)
                              }
                            >
                              <img src={ThreeDots} className="m-auto" />
                            </button>
                            {replyActionDropdownOpen == comment.comment_id &&
                              contactId == review.reviewer_id && (
                                <ul className="Dropdown !top-[30px] !right-[15px]">
                                  <li className="DropdownItems">
                                    <a
                                      onClick={() =>
                                        handleEditReply(
                                          comment.comment_id,
                                          review.review_id
                                        )
                                      }
                                    >
                                      <div>Edit</div>
                                      <img src={EditIcon} className="h18w18" />
                                    </a>
                                  </li>
                                  <li className="DropdownItems">
                                    <a
                                      onClick={() =>
                                        openDeleteReplyModal(
                                          comment.comment_id,
                                          review.review_id
                                        )
                                      }
                                    >
                                      <div>Delete</div>
                                      <img
                                        src={DeleteIcon}
                                        className="h18w18"
                                      />
                                    </a>
                                  </li>
                                </ul>
                              )}
                          </div>
                        </div>

                        <div
                          className={`text-xs font-light text-BlackColor relative ${
                            expandedReplyText[comment.comment_id] ? "" : "line-clamp-3"
                          }`}
                          style={{ overflow: "hidden" }}
                        >
                          {comment.comment_description &&
                            comment.comment_description
                              .split(/\n\n/)
                              .map((paragraph, i, arr) => (
                                <span
                                  key={i}
                                  className={` break-words ${
                                    i === arr.length - 1 ? "mb-0" : "block mb-2"
                                  }`}
                                >
                                  {paragraph}
                                </span>
                              ))}

                          {!expandedReplyText[comment.comment_id] &&
                            comment.comment_description.split(" ").length > 20 && (
                              <a
                                className="cursor-pointer text-LinkedInBlue whitespace-nowrap font-medium absolute right-0 bottom-0"
                                onClick={() => ExpandReplyText(comment.comment_id)}
                                style={{
                                  background: "white",
                                  paddingLeft: "4px",
                                }}
                              >
                                <span className="mr-1 text-sm text-BlackColor-60">
                                  ...
                                </span>
                                <span className="underline">Read more</span>
                              </a>
                            )}
                          {expandedReplyText[comment.comment_id] && (
                            <a
                              className="cursor-pointer text-LinkedInBlue whitespace-nowrap font-medium"
                              onClick={() => ExpandReplyText(comment.comment_id)}
                            >
                              <span className="underline !ml-1">Read less</span>
                            </a>
                          )}
                        </div>
                        {/* <div className=" flex items-center gap-15px">
                          <a className=" text-BlackColor-60 text-[11px]">
                            Reply
                          </a>
                        </div> 
                      </div>
                    ))}
                  </div>
                )} 
                {/* <DeleteConfirmation
                  isOpen={isReplyModalOpen}
                  onClose={() => setReplyModalOpen(false)}
                  onDelete={handleDeleteReply}
                /> */}
                {/* RetingCardReply end  */}
              </div>
            );
          })
        ) : (
          <div className=" flex-grow my-auto flex justify-center items-center absolute left-1/2 top-[calc(50%+70px)] -translate-x-2/4 -translate-y-2/4">
            {/* <div className="flex flex-col items-center gap-[20px]">
              <img
                src={NoDataFoundIcon}
                className="h-[100px] w-[100px] object-contain"
              />
              <div className=" text-center text-sm text-BlackColor font-semibold">
                No Data Found
              </div>
            </div> */}
          </div>
        )}

        {sortedReviews.length > reviewsPerPage && (
          <div className="bg-WhiteColor flex justify-center mx-[-20px] px-[20px] pt-[15px] mt-auto">
            <nav aria-label="Pagination" className="w-full">
              <ul className="inline-flex items-center space-x-[5px] justify-center w-full">
                <li className="flex items-center">
                  <button
                    className={`PaginetionButton ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <img src={DownArror} className={`rotate-90 h-5 w-5`} />
                  </button>
                </li>

                <li className="flex items-center">
                  <ul className="flex items-center space-x-[5px]">
                    {renderPaginationItems()}
                  </ul>
                </li>

                <li className="flex items-center">
                  <button
                    className={`PaginetionButton ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <img src={DownArror} className={`-rotate-90 h-5 w-5`} />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
