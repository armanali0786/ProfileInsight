import React, { useState } from "react";
import axios from "axios";
import { AuthData, API_BASE_URL } from "../../config";
import { toast } from "react-toastify";
import {
  addCommentToReview,
  updateCommentInReview
} from "../../indexedDB";
export default function AddComment({
  profileId,
  reviewId,
  contactId,
  reviewerId,
  newReply,
  setNewReply,
  setShowAddReply,
  setEditReplyIndex,
  editReplyIndex,
  setLinkedInIdReviews,
  fetchAllLinkedInUserReviews
}) {

  /*-------------- Submit the review reply ---------------*/
  const handleSubmit = async () => {

    const formData = new FormData();
    formData.append("task_id", "1");
    formData.append("task_review_id", reviewId);
    formData.append("task_reviewer_id", reviewerId);
    formData.append("contact_id", contactId);
    formData.append("profile_id", profileId);
    formData.append("description", newReply.description);
    formData.append("is_anon", "0");
    formData.append("rel_type", "review");

    if(editReplyIndex){
      formData.append("comment_id", editReplyIndex);
    }

    const apiUrl = editReplyIndex
      ? `${API_BASE_URL}/admin/reviews/comments/update_comment`
      : `${API_BASE_URL}/admin/reviews/comments/save_comment`;

    try {
      const response = await axios.post(apiUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          authtoken: AuthData.token,
        },
      });
      if (response.status == 200) {
        fetchAllLinkedInUserReviews()
        const updatedComment = {
          comment_id: response.data.data.comment_id,
          task_id: response.data.data.task_id,
          task_review_id: response.data.data.task_review_id,
          description: response.data.data.description,
          is_anon: response.data.data.is_anon,
          profile_id: response.data.data.profile_id,
          rel_type: response.data.data.rel_type,
        };
        
         if (editReplyIndex) {
           await updateCommentInReview(reviewId, updatedComment.comment_id ,updatedComment )
         }else{
           await addCommentToReview(reviewId, updatedComment);
         }
        //  toast.success(response.data.message, {
        //   position: "top-center",
        //   autoClose: 2000,
        //   hideProgressBar: false,
        //   closeOnClick: true,
        //   pauseOnHover: true,
        //   draggable: true,
        //   progress: undefined,
        //   theme: "light",
        // });
        // console.log("Updated Comment",updatedComment)
        // setLinkedInIdReviews((prevReviews) => {
        //   return prevReviews.map((review) => {
        //     if (review.review_id === reviewId) {
        //       const updatedComments = review.comments ? [...review.comments] : [];
              
        //       if (editReplyIndex !== null) {
        //         // Edit an existing comment
        //         return {
        //           ...review,
        //           comments: updatedComments.map((comment) =>
        //             comment.comment_id === editReplyIndex
        //               ? { ...comment, ...updatedComment }
        //               : comment
        //           ),
        //         };
        //       } else {
        //         // Add a new comment
        //         updatedComments.push(updatedComment);
        //         return { ...review, comments: updatedComments };
        //       }
        //     }
        //     return review;
        //   });
        // });
        setShowAddReply((prevState) => ({
          ...prevState,
          [reviewId]: false, 
        }));
        setEditReplyIndex(null);
        setNewReply({ description: "" });
      }
    } catch (err) {
      if (err.response) {
        handleApiError(err.response.data)
      } 
    }
  };
  
/*-------------- Handle Api Error ----------------*/
  const handleApiError = (response) => {
    toast.error(response.message || "Something went wrong.");
    setNewReply({ description: "" });
  };


  return (
    <>
      <div className="flex items-center mt-4">
        <input
          type="text"
          placeholder="Add a comment..."
          className="flex-1 p-2 border border-border rounded-lg bg-input text-foreground"
          // value={comment}
          value={newReply.description}
          onChange={(e) =>
            setNewReply({ ...newReply, description: e.target.value })
          }
          // onChange={handleCommentChange}
        />
        <button
          className="ml-2 bg-black text-white p-2 rounded-md"
          onClick={handleSubmit}
        >
          {editReplyIndex ? "update" : "submit"}
        </button>
      </div>
    </>
  );
}
