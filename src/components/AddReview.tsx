import React, { useState } from "react";
import AddToReview from "../assets/images/add-review.png";
import closeIcon from "../assets/images/close.png";
import AddUser from "../assets/images/add-uesr.png";
import UserProfile from "../assets/images/user-profile.png";
import OneRetingStar from "../assets/images/one-star.png";
import HalfRetingStar from "../assets/images/half-star.png";
import blankRetingStar from "../assets/images/blank-star.png";
import toast, { Toaster } from 'react-hot-toast';
import { addReview, getReviewsByUserId, updateReview } from "../indexedDB";
import Upload from "../assets/images/upload.png"
import UploadImg from "../assets/images/upload-Img.png"

export default function AddReview({
  handleCancel,
  editIndex,
  linkedInUserName,
  linkedInUserId,
  reviews,
  setShowReviewForm,
  setEditIndex,
  newReview,
  setNewReview,
  setReviews,
  setActionDropdownOpen
}) {
  const [hoveredStar, setHoveredStar] = useState(null);


  /*------------------  Add Review  ----------------------*/

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    const userId = localStorage.getItem("logInUserId");
    if (newReview.text.trim()) {
      const reviewToSubmit = {
        ...newReview,
        linkedInUserId,
        name: linkedInUserName,
        userId, 
        createdAt: new Date().toISOString(),
      };
      try {
        if (editIndex !== null) {
          // if user Edit Review
          const updatedReview = {
            ...reviewToSubmit,
            name: newReview.name,
            linkedInUserId: newReview.linkedInUserId,
            // id: reviews[editIndex].id,
          };
          await updateReview(
            reviews[editIndex].reviewId,
            updatedReview,
            setReviews
          );
          setShowReviewForm(false);
          setActionDropdownOpen(false);
          setEditIndex(null);
        } else {
          await addReview(userId, reviewToSubmit, setReviews);
          setShowReviewForm(false);
          // localStorage.setItem("reviewMessage", "Review added successfully!");
          toast.success("Review added successfully!");
        }
        setNewReview({ name: "", text: "", rating: 1, linkedInUserId: "" });
        const updatedReviews = await getReviewsByUserId(userId);
        setReviews(updatedReviews);
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
      <form  onSubmit={handleSubmitReview}>
        <div className=" flex flex-col absolute bottom-0 w-full rounded-t-[15px] min-h-screen bg-WhiteColor shadow-add-review-shadow">
          <div className=" flex items-center justify-between px-[20px] py-[15px] border-b border-BorderColor-15">
            <div className=" flex items-center gap-[10px]">
              <img src={AddToReview} className="h18w18" />
              <div className=" text-base">
                {" "}
                {editIndex !== null ? "Edit Review" : "Add Review"}
              </div>
            </div>
            <button>
              <img onClick={handleCancel} src={closeIcon} className="h18w18" />
            </button>
          </div>
          <div className="ScrollableContent">
            <div className="p-[15px] flex flex-col gap-[15px] mx-[-20px] flex-grow pb-0">
              <div className=" flex items-center gap-[15px] justify-between">
                <div className="flex gap-[15px]">
                  <div className=" rounded-full h-12 w-12">
                    <img
                      src={UserProfile}
                      className=" object-cover h-full w-full"
                    />
                  </div>
                  <div className=" flex flex-col">
                    <div className="text-[20px] font-semibold">
                      {editIndex !== null ? newReview.name : linkedInUserName}
                    </div>
                    {/* <div className=" flex items-center gap-1">
                      <div className=" flex items-center gap-1">
                        <img src={OneRetingStar} className="h-4 w-4" />
                        <img src={OneRetingStar} className="h-4 w-4" />
                        <img src={OneRetingStar} className="h-4 w-4" />
                        <img src={OneRetingStar} className="h-4 w-4" />
                        <img src={HalfRetingStar} className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-base">4.5</span>
                        <span className="text-xs text-BlackColor-60">
                          (50k reviews)
                        </span>
                    </div> */}
                  </div>
                </div>
                <button className="h-[40px] w-[40px] rounded-md bg-YellowLight flex">
                  <img src={AddUser} className="m-auto h18w18" />
                </button>
              </div>
              <div className="flex flex-col gap-[10px] mb-[10px]">
                <div className="text-xs text-BlackColor-60">Rating</div>
                <div className="w-full border border-BorderColor-15 rounded-[5px] p-[15px] flex items-center justify-center gap-[15px]">
                  {Array.from({ length: 5 }, (_, index) => (
                    <button
                      key={index}
                      onMouseEnter={() => setHoveredStar(index)}
                      onMouseLeave={() => setHoveredStar(null)}
                      onClick={(event) => handleStarClick(event, index)}
                      className="outline-none"
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_188_1909)">
                          <path
                            d="M19.4435 11.9685L19.677 12.5551L20.307 12.5965L29.4681 13.1988L22.4322 19.1645L21.9556 19.5686L22.1099 20.1741L24.4129 29.214L16.5279 24.2299L15.9936 23.8922L15.4593 24.2299L7.57439 29.2139L9.87742 20.1741L10.0316 19.5691L9.55563 19.1649L2.52921 13.1988L11.6804 12.5965L12.3103 12.555L12.5438 11.9685L15.9936 3.30162L19.4435 11.9685Z"
                            stroke="#0A66C2"
                            strokeWidth="2"
                            fill={
                              index <=
                              (hoveredStar !== null
                                ? hoveredStar
                                : newReview.rating - 1)
                                ? "#0A66C2"
                                : "none"
                            }
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_188_1909">
                            <rect width="32" height="32" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className=" flex flex-col gap-[10px] flex-grow">
                <div className=" text-xs text-BlackColor-60">Share your Experience</div>
                <textarea
                  id="w3review"
                  name="w3review"
                  rows={6}
                  value={newReview.text}
                  onChange={(e) =>
                    setNewReview({ ...newReview, text: e.target.value })
                  }
                  // onKeyDown={handleTextareaKeyDown}
                  className="FromInput !border !border-BorderColor-15 !rounded-[5px] flex-grow !px-[15px]"
                ></textarea>
              </div>
              {/* <div className="flex flex-col gap-[10px] mb-[10px]">
                <div className="text-xs text-BlackColor-60">Upload</div>
                <div className=" flex items-center gap-[10px]">
                  <div className="h54w54 border border-dashed border-BorderColor-15 rounded-[5px] flex justify-center items-center relative">
                    <img src={Upload} className="w-[24px] h-[24px] m-auto" />
                    <input type="file" className=" absolute top-0 left-0 right-0 bottom-0 h-full w-full opacity-0 cursor-pointer" />
                  </div>
                  <div className="h54w54 flex justify-center items-center relative">
                    <a className=" cursor-pointer rounded-[5px] h-full w-full overflow-hidden">
                      <img src={UploadImg} className=" object-cover h-full w-full" />
                    </a>
                    <a className=" cursor-pointer h-[20px] w-[20px] rounded-full border-2 border-WhiteColor flex justify-center items-center absolute top-[-10px] right-[-10px] bg-BlackColor">
                      <img src={closeIcon} className="h-[14px] w-[14px] invert" />
                    </a>
                  </div>
                </div>
              </div> */}

            </div>
          </div>
          <div className="Footer">
            <button type="submit" className="btn sign-in-btn">
            {editIndex !== null ? "UPDATE REVIEW" : "SUBMIT"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
