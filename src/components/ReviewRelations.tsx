import React, { useState, useEffect } from "react";
import ReviewRelations1 from "../assets/images/review-relations1.png";
import ReviewRelations2 from "../assets/images/review-relations2.png";
import ReviewRelations3 from "../assets/images/review-relations3.png";
import Stars from "../assets/images/stars.png";
import AlertTriangle from "../assets/images/alert-triangle.png";


export default function ReviewRelations({  reviewerTotalReviewCount}) {
  const [warnMessage, setWarningMessage] = useState(null);

  // Define images based on the number of reviews
  const getImagesToShow = (reviewsCount) => {
    switch (reviewsCount) {
      case 0:
        return [ReviewRelations3, ReviewRelations2, ReviewRelations1];
      case 1:
        return [ReviewRelations2, ReviewRelations1];
      case 2:
        return [ReviewRelations1];
      default:
        return [];
    }
  };

  // Display the message when user tries to add a review
  const handlePoupAddReviewMessage = () => {
    setWarningMessage("Navigate on LinkedIn page to add review");
  };

  // Calculate how many reviews are needed to unlock the account
  const remainingReviews = 3 - reviewerTotalReviewCount;
  const imagesToShow = getImagesToShow(reviewerTotalReviewCount);

  return (
    <>
      {/* Verify Your Email start */}
      <div className="ScrollableContent border-t border-BorderColor-15">
        <div className="flex flex-col gap-[30px] my-auto">
          <div className="MultiProfile">
            {imagesToShow.map((img, index) => (
              <a className="MultiProfileItrms" key={index}>
                <img src={img} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
          <div className="flex flex-col items-center gap-[15px]">
            <img src={Stars} className="w-8" />
            <div className="flex flex-col gap-[8px]">
              <div className="text-BlackColor text-[20px] font-semibold text-center">
                Review {remainingReviews} relations to unlock <br />
                your account
              </div>
            </div>
            <div className="text-light-blue text-xs text-center leading-[1.5]">
              Review any relationship to activate your <br />
              account
            </div>
          </div>
        </div>
        {warnMessage && (
          <div className="bg-[#FEF9C3] border border-[#FEF08A] rounded-[5px] text-[#854D0E] text-[13px] font-medium flex gap-[10px] p-[15px] mt-[30px]">
            <img src={AlertTriangle} className={`h-5 w-5`} />
            <span className="break-words w-0 flex-grow">{warnMessage}</span>
          </div>
        )}
      </div>
      <div className="Footer">
        <button
          title="Add New"
          className="btn sign-in-btn flex items-center justify-center gap-2"
          onClick={handlePoupAddReviewMessage}
        >
          <img src={Stars} className="w-5" />
          <span>Add review</span>
        </button>
      </div>
      {/* Verify Your Email end */}
    </>
  );
}
