import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import UserIcon from "../assets/images/user.png";
import closeIcon from "../assets/images/close.png";
import OneRetingStar from "../assets/images/one-star.png";
import HalfRetingStar from "../assets/images/half-star.png";
import { AuthData, API_BASE_URL } from "../config";

type MyReview = {
  review_id: string;
  profile_id: string;
  profile_name: string;
  review_description: string;
  rating: number;
  created_at: string;
};

/*-------------- Format Review Date ---------------*/
const formatDate = (dateString: string) => {
  return new Date(dateString)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/\./g, "");
};

export default function MyReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);

  /*-------------- Fetch Reviews Given By The Logged-in User ----------------*/
  const fetchMyReviews = async () => {
    try {
      const userInfo = localStorage.getItem("LoginUserData");
      if (!userInfo) return;
      const parsedInfo = JSON.parse(userInfo);
      const contactId = parsedInfo.contact_id;

      const formData = new FormData();
      formData.append("contact_id", contactId);
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/my_reviews`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      setReviews(response.data.data || []);
    } catch (error) {
      console.error("Error fetching my reviews:", error);
      toast.error("Could not load your reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReviews();
  }, []);

  /*-------------- Open The Reviewed Profile In The Active Tab ----------------*/
  const handleViewReview = async (profileId: string) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.update(tab.id, {
          url: `https://www.linkedin.com/in/${profileId}/`,
        });
      }
    } catch (error) {
      console.error("Error opening profile tab:", error);
    }
    navigate("/reviews");
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }} />
      <div className="flex flex-col absolute bottom-0 w-full rounded-t-[15px] min-h-screen bg-WhiteColor shadow-add-review-shadow">
        <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-BorderColor-15">
          <div className="flex items-center gap-[10px]">
            <img src={UserIcon} className="h18w18" />
            <div className="text-base">My Reviews</div>
          </div>
          <button onClick={() => navigate("/profile")}>
            <img src={closeIcon} className="h18w18" />
          </button>
        </div>
        <div className="ScrollableContent">
          {loading ? (
            <div className="text-center text-sm text-light-blue py-[30px]">Loading...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center text-sm text-light-blue py-[30px]">
              You haven't reviewed any profiles yet.
            </div>
          ) : (
            <div className="RetingCardMain">
              {reviews.map((review) => (
                <a
                  key={review.review_id}
                  className="RetingCard cursor-pointer"
                  onClick={() => handleViewReview(review.profile_id)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate max-w-full leading-[1] capitalize">
                        {review.profile_name || review.profile_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-[6px]">
                      <div className="flex items-center gap-1">
                        {[...Array(Math.floor(review.rating))].map((_, i) => (
                          <img key={i} src={OneRetingStar} className="h-[13px] w-[13px]" alt="Star" />
                        ))}
                        {review.rating % 1 !== 0 && (
                          <img src={HalfRetingStar} className="h-[13px] w-[13px]" alt="Half Star" />
                        )}
                      </div>
                      <span className="text-[11px] text-BlackColor-60">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[13px] font-light text-BlackColor line-clamp-2">
                    {review.review_description}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
