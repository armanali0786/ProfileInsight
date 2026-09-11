import React, { useEffect, useRef, useState } from "react";
import { addReview, updateReview } from "../../indexedDB";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { AuthData, API_BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";
import DownArrorIcon from "../../assets/images/down-arror.png";
import {
  CATEGORY_FIELDS,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_DURATIONS,
} from "../../constants/reputation";

// Native <select> popups don't reliably open inside a Chrome extension side panel,
// so this mirrors the app's existing custom-dropdown pattern (.Dropdown/.DropdownItems,
// used elsewhere for the review action menu) instead of relying on the browser's own popup.
function SelectDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = options.find((item) => item.value === value);

  return (
    <div className="flex flex-col gap-[6px] min-w-0">
      <label className="text-[11px] font-medium uppercase tracking-wide text-BlackColor-60">
        {label}
      </label>
      <div className="DropDownMain" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`bg-TextareaBg rounded-[5px] py-[10px] px-[15px] w-full min-w-0 max-w-full flex items-center justify-between gap-2 text-left text-base font-light border duration-200 ${
            open
              ? "border-LinkedInBlue"
              : "border-transparent hover:border-BorderColor-15"
          }`}
        >
          <span className="truncate text-BlackColor">{selected ? selected.label : "Select"}</span>
          <img
            src={DownArrorIcon}
            className={`h-[10px] w-[10px] shrink-0 duration-300 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <ul className="Dropdown shadow-md !left-0 !right-auto !w-full !min-w-0 max-h-[220px] overflow-y-auto">
            {options.map((item) => (
              <li key={item.value} className="DropdownItems">
                <a
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <div className={item.value === value ? "text-LinkedInBlue font-medium" : ""}>
                    {item.label}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CategoryStarRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-BlackColor flex-1">{label}</span>
      <div className="flex items-center gap-[4px]">
        {Array.from({ length: 5 }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onChange(index + 1)}
            className="outline-none duration-150 hover:scale-110"
            aria-label={`${label}: ${index + 1} star`}
          >
            <svg width="20" height="20" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21.6772 4.62395L25.3976 13.4902C25.4877 13.7054 25.6347 13.8919 25.823 14.0296C26.0112 14.1673 26.2335 14.2511 26.4659 14.2718L35.9887 15.095C36.2414 15.1153 36.4824 15.2101 36.6812 15.3674C36.8799 15.5247 37.0276 15.7374 37.1054 15.9786C37.1833 16.2199 37.1878 16.4788 37.1185 16.7226C37.0491 16.9664 36.909 17.1842 36.7159 17.3484L29.4912 23.6505C29.3156 23.8048 29.1851 24.0037 29.1134 24.2262C29.0418 24.4487 29.0318 24.6864 29.0844 24.9141L31.2497 34.2897C31.3069 34.5346 31.2908 34.7909 31.2034 35.0266C31.116 35.2624 30.9611 35.4673 30.7581 35.6157C30.5551 35.764 30.3129 35.8494 30.0617 35.8611C29.8105 35.8728 29.5614 35.8103 29.3455 35.6814L21.1615 30.7166C20.9626 30.5957 20.7344 30.5317 20.5016 30.5317C20.2689 30.5317 20.0407 30.5957 19.8418 30.7166L11.6578 35.6814C11.4419 35.8103 11.1928 35.8728 10.9416 35.8611C10.6904 35.8494 10.4482 35.764 10.2452 35.6157C10.0421 35.4673 9.88727 35.2624 9.79986 35.0266C9.71244 34.7909 9.69634 34.5346 9.75356 34.2897L11.9189 24.9141C11.9715 24.6864 11.9615 24.4487 11.8898 24.2262C11.8182 24.0037 11.6877 23.8048 11.5121 23.6505L4.28743 17.3484C4.09428 17.1842 3.95416 16.9664 3.88482 16.7226C3.81547 16.4788 3.82 16.2199 3.89784 15.9786C3.97569 15.7374 4.12334 15.5247 4.32211 15.3674C4.52089 15.2101 4.76186 15.1153 5.01454 15.095L14.5374 14.2718C14.7698 14.2511 14.992 14.1673 15.1803 14.0296C15.3685 13.8919 15.5156 13.7054 15.6057 13.4902L19.3261 4.62395C19.4255 4.39472 19.5897 4.19954 19.7986 4.06244C20.0074 3.92534 20.2518 3.85229 20.5016 3.85229C20.7515 3.85229 20.9959 3.92534 21.2047 4.06244C21.4136 4.19954 21.5778 4.39472 21.6772 4.62395Z"
                stroke="#0A66C2"
                strokeWidth="2.50709"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={index < value ? "#0A66C2" : "none"}
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children, right = null }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-[8px]">
        <span className="w-[3px] h-[14px] rounded-full bg-LinkedInBlue" />
        <span className="text-sm font-semibold text-BlackColor">{children}</span>
      </div>
      {right}
    </div>
  );
}

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
