import React, { useState } from "react";
import { addReview, updateReview } from "../../indexedDB";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { AuthData, API_BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";
import {
  CATEGORY_FIELDS,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_DURATIONS,
} from "../../constants/reputation";
import { SelectDropdown, CategoryStarRow, SectionTitle } from "./FormControls";

export default function ReviewForm({
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

  const setCategoryRating = (key, value) => {
    setNewReview({
      ...newReview,
      category_ratings: { ...newReview.category_ratings, [key]: value },
    });
  };

  const categoryAverage = () => {
    const values = CATEGORY_FIELDS.map((field) => Number(newReview.category_ratings?.[field.key]) || 0);
    const rated = values.filter((v) => v > 0);
    if (rated.length === 0) return 0;
    return Math.round((rated.reduce((sum, v) => sum + v, 0) / rated.length) * 10) / 10;
  };

  /*------------------  Submit new Review  ----------------------*/
  const submitReview = async (contactId, profileId, reviewData) => {
    const formData = new FormData();
    formData.append("task", "1");
    formData.append("contact_id", contactId);
    formData.append("profile_id", profileId);
    formData.append("description", reviewData.description);
    formData.append("is_anon", reviewData.is_anon);
    formData.append("rating", String(categoryAverage()));
    formData.append("category_ratings", JSON.stringify(reviewData.category_ratings));
    formData.append("relationship_type", reviewData.relationship_type);
    formData.append("relationship_duration", reviewData.relationship_duration);
    formData.append("would_work_again", reviewData.would_work_again ? "1" : "0");
    formData.append("standout_strength", reviewData.standout_strength || "");
    formData.append("profile_name", linkedInUserDetails.name);
    setLoadingApiResponse(true);
    try {
      const userInfo = localStorage.getItem("LoginUserData");
      const parsedInfo = JSON.parse(userInfo);
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/submit_review`,
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
            const extrasData = response.data.extra;
            setExtraData((prev) => ({ ...prev, ...extrasData }));
            updatedAccountStatus = AccountStatus - 1;
            parsedInfo.account_status = updatedAccountStatus;
            localStorage.setItem("LoginUserData", JSON.stringify(parsedInfo));
          }
        } else {
          setExtraData((prev) => ({ ...prev, ...response.data.extra }));
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
      formData.append("rating", String(categoryAverage()));
      formData.append("category_ratings", JSON.stringify(updatedReview.category_ratings));
      formData.append("relationship_type", updatedReview.relationship_type);
      formData.append("relationship_duration", updatedReview.relationship_duration);
      formData.append("would_work_again", updatedReview.would_work_again ? "1" : "0");
      formData.append("standout_strength", updatedReview.standout_strength || "");
      formData.append("is_anon", updatedReview.is_anon);
      formData.append("created_at", updatedReview.createdAt);
      formData.append("updated_at", new Date().toISOString());
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/update_review`,
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
              ? { ...review, ...updatedReviewData }
              : review
          )
        );
        setExtraData((prev) => ({ ...prev, ...extrasData }));
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

  const emptyReview = () => ({
    description: "",
    rating: 1,
    linkedInUserId: "",
    reviewId: "",
    is_anon: false,
    category_ratings: Object.fromEntries(CATEGORY_FIELDS.map((f) => [f.key, 0])),
    relationship_type: "worked_together",
    relationship_duration: "6_12m",
    would_work_again: true,
    standout_strength: "",
  });

  /*------------------  Submit Review  ----------------------*/

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    const userInfo = localStorage.getItem("LoginUserData");
    const parsedInfo = JSON.parse(userInfo);
    const contactId = parsedInfo.contact_id;

    const trimmedDescription = newReview.description.trim();
    if (trimmedDescription === "") {
      toast.error("Review description cannot be empty.");
      return;
    }
    if (trimmedDescription.length < 5) {
      toast.error("Review description must be at least 5 characters long.");
      return;
    }
    const unratedCategory = CATEGORY_FIELDS.find(
      (field) => !newReview.category_ratings?.[field.key]
    );
    if (unratedCategory) {
      toast.error(`Please rate "${unratedCategory.label}".`);
      return;
    }
    if (newReview.would_work_again === null || newReview.would_work_again === undefined) {
      toast.error("Please let us know if you'd work with them again.");
      return;
    }
    if (newReview) {
      try {
        if (editIndex !== null || editIndex === -1) {
          const updatedReview = {
            ...reviews[editIndex],
            description: newReview.description,
            reviewId: newReview.reviewId,
            rating: categoryAverage(),
            category_ratings: newReview.category_ratings,
            relationship_type: newReview.relationship_type,
            relationship_duration: newReview.relationship_duration,
            would_work_again: newReview.would_work_again,
            standout_strength: newReview.standout_strength,
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
          await submitReview(contactId, linkedInUserId, newReview);
        }
        setNewReview(emptyReview());
        await fetchAllLinkedInUserReviews();
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
         <form className=" pt-20px pb-10px flex flex-col gap-[15px]" onSubmit={handleSubmitReview}>
        {/* label check start  */}
        <div className="flex justify-between items-center relative CheckBoxMain border border-BorderColor-15 rounded-[5px] px-[15px] py-[12px] bg-TextareaBg">
          <label
            htmlFor="anonymous"
            className=" w-[calc(100%-25px)] truncate text-sm text-BlackColor"
          >
            Post this review anonymously
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
            value="Bike"
            className="custom-Check-box z-[2]"
          />
          <div className="CheckBox"></div>
        </div>
        {/* label check end  */}

        {/* structured rating card start */}
        <div className="flex flex-col gap-[18px] p-[16px] border border-BorderColor-15 rounded-[8px]">
          {/* relationship section start */}
          <div className="flex flex-col gap-[12px]">
            <SectionTitle>Your relationship</SectionTitle>
            <div className="flex flex-col gap-[12px]">
              <SelectDropdown
                label="How do you know this person?"
                value={newReview.relationship_type}
                options={RELATIONSHIP_TYPES}
                onChange={(value) => setNewReview({ ...newReview, relationship_type: value })}
              />
              <SelectDropdown
                label="How long did you work together?"
                value={newReview.relationship_duration}
                options={RELATIONSHIP_DURATIONS}
                onChange={(value) => setNewReview({ ...newReview, relationship_duration: value })}
              />
            </div>
          </div>
          {/* relationship section end */}

          {/* category ratings section start */}
          <div className="flex flex-col gap-[12px] pt-[18px] border-t border-BorderColor-15">
            <SectionTitle
              right={
                categoryAverage() > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-LinkedInBlue bg-LinkedInBlue-tint px-[8px] py-[2px] rounded-full">
                    {categoryAverage().toFixed(1)} ★
                  </span>
                )
              }
            >
              Rate them on
            </SectionTitle>
            <div className="flex flex-col gap-[8px]">
              {CATEGORY_FIELDS.map((field) => (
                <CategoryStarRow
                  key={field.key}
                  label={field.label}
                  value={Number(newReview.category_ratings?.[field.key]) || 0}
                  onChange={(value) => setCategoryRating(field.key, value)}
                />
              ))}
            </div>
          </div>
          {/* category ratings section end */}

          {/* would work again start */}
          <div className="flex flex-col gap-[12px] pt-[18px] border-t border-BorderColor-15">
            <SectionTitle>Would you work with this person again?</SectionTitle>
            <div className="grid grid-cols-2 gap-[10px]">
              <button
                type="button"
                onClick={() => setNewReview({ ...newReview, would_work_again: true })}
                className={`btn btn-sm !font-normal !shadow-none ${
                  newReview.would_work_again === true ? "sign-in-btn" : "premium-btn"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setNewReview({ ...newReview, would_work_again: false })}
                className={`btn btn-sm !font-normal !shadow-none ${
                  newReview.would_work_again === false ? "sign-in-btn" : "premium-btn"
                }`}
              >
                No
              </button>
            </div>
          </div>
          {/* would work again end */}

          <div className="flex flex-col gap-[6px] pt-[18px] border-t border-BorderColor-15">
            <label className="text-[11px] font-medium uppercase tracking-wide text-BlackColor-60">
              What is one thing this person does exceptionally well?{" "}
              <span className="normal-case font-normal text-BlackColor-40">(optional)</span>
            </label>
            <input
              type="text"
              className="FromInput !border !border-BorderColor-15"
              value={newReview.standout_strength}
              maxLength={140}
              onChange={(e) => setNewReview({ ...newReview, standout_strength: e.target.value })}
              placeholder="e.g. Communicates clearly under pressure"
            />
            <div className="text-right text-[11px] text-BlackColor-40">
              {(newReview.standout_strength || "").length}/140
            </div>
          </div>
        </div>
        {/* structured rating card end */}

        <div className="flex flex-col gap-[20px] flex-grow">
          <div className="flex flex-col gap-[8px]">
            <span className="text-sm font-semibold text-BlackColor">Your review</span>
            <textarea
              id="w3review"
              name="w3review"
              rows={6}
              value={newReview.description}
              onChange={(e) =>
                setNewReview({ ...newReview, description: e.target.value })
              }
              className="FromInput"
              placeholder="Describe your experience with this person..."
            ></textarea>
          </div>
          <div className="">
            <button type="submit" className="btn sign-in-btn">
              {editIndex !== null ? "UPDATE REVIEW" : "SUBMIT"}
            </button>
          </div>
        </div>
        </form>
    </>
  );
}
