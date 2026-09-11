import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import UserIcon from "../assets/images/user.png";
import closeIcon from "../assets/images/close.png";
import UserProfile from "../assets/images/user-profile.png";
import OneRetingStar from "../assets/images/one-star.png";
import { AuthData, API_BASE_URL } from "../config";
import { relationshipTypeLabel, relationshipDurationLabel } from "../constants/reputation";

type PendingVerification = {
  verification_id: string;
  profile_id: string;
  reviewer_fullname: string;
  reviewer_profile_img: string | null;
  relationship_type: string;
  relationship_duration: string | null;
  rating: number;
  description: string;
  created_at: string;
};

export default function VerificationRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchPendingVerifications = async () => {
    try {
      const userInfo = localStorage.getItem("LoginUserData");
      if (!userInfo) return;
      const parsedInfo = JSON.parse(userInfo);
      const contactId = parsedInfo.contact_id;

      const formData = new FormData();
      formData.append("contact_id", contactId);
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/verifications/pending`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      setRequests(response.data.data || []);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      toast.error("Could not load verification requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const respond = async (verificationId: string, action: "confirm" | "deny") => {
    const userInfo = localStorage.getItem("LoginUserData");
    if (!userInfo) return;
    const parsedInfo = JSON.parse(userInfo);
    const contactId = parsedInfo.contact_id;

    setRespondingId(verificationId);
    try {
      const formData = new FormData();
      formData.append("contact_id", contactId);
      formData.append("verification_id", verificationId);
      formData.append("action", action);
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/verifications/respond`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      toast.success(response.data.message);
      setRequests((prev) => prev.filter((r) => r.verification_id !== verificationId));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong.");
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }} />
      <div className="flex flex-col absolute bottom-0 w-full rounded-t-[15px] min-h-screen bg-WhiteColor shadow-add-review-shadow">
        <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-BorderColor-15">
          <div className="flex items-center gap-[10px]">
            <img src={UserIcon} className="h18w18" />
            <div className="text-base">Verification Requests</div>
          </div>
          <button onClick={() => navigate("/profile")}>
            <img src={closeIcon} className="h18w18" />
          </button>
        </div>
        <div className="ScrollableContent">
          {loading ? (
            <div className="text-center text-sm text-light-blue py-[30px]">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-sm text-light-blue py-[30px]">
              No pending relationship requests. When someone reviews your claimed profile,
              you'll be asked to confirm the relationship here.
            </div>
          ) : (
            <div className="RetingCardMain">
              {requests.map((request) => (
                <div key={request.verification_id} className="RetingCard">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-[15px] justify-between">
                      <div className="flex gap-2 w-[calc(100%-45px)] items-center">
                        <div className="overflow-hidden rounded-full h-7 w-7">
                          <img
                            src={
                              request.reviewer_profile_img
                                ? `${API_BASE_URL}/uploads/profile/${request.reviewer_profile_img}`
                                : UserProfile
                            }
                            className="object-cover h-full w-full"
                          />
                        </div>
                        <span className="text-sm font-semibold truncate max-w-full leading-[1] capitalize">
                          {request.reviewer_fullname}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-[6px] flex-wrap">
                      <span className="text-[10px] px-[6px] py-[1px] rounded-[4px] bg-GrayBg text-BlackColor-60">
                        {relationshipTypeLabel(request.relationship_type)}
                        {request.relationship_duration
                          ? ` · ${relationshipDurationLabel(request.relationship_duration)}`
                          : ""}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(Math.round(request.rating || 0))].map((_, i) => (
                          <img key={i} src={OneRetingStar} className="h-[12px] w-[12px]" alt="Star" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-[13px] font-light text-BlackColor line-clamp-3">
                    {request.description}
                  </div>
                  <div className="flex items-center gap-[10px] pt-1">
                    <button
                      type="button"
                      disabled={respondingId === request.verification_id}
                      onClick={() => respond(request.verification_id, "confirm")}
                      className="btn premium-btn btn-sm !font-normal !shadow-none flex-1"
                    >
                      Confirm relationship
                    </button>
                    <button
                      type="button"
                      disabled={respondingId === request.verification_id}
                      onClick={() => respond(request.verification_id, "deny")}
                      className="btn sign-in-btn btn-sm !font-normal !shadow-none flex-1"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
