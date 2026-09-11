import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import UserIcon from "../assets/images/user.png";
import closeIcon from "../assets/images/close.png";
import { AuthData, API_BASE_URL } from "../config";
import { CATEGORY_FIELDS } from "../constants/reputation";

type MyReputationData = {
  profile_id: string;
  profile_name: string;
  profile_image: string;
  profile_avg_rating: number;
  profile_total_ratings: number;
  reputation: {
    category_averages: Record<string, number | null>;
    would_work_again_pct: number | null;
    verified_count: number;
    unverified_count: number;
    total_reviews: number;
  };
};

const VISIBILITY_OPTIONS = [
  { value: "everyone", label: "Everyone" },
  { value: "verified", label: "Verified users" },
  { value: "private", label: "Private" },
];

export default function MyReputation() {
  const navigate = useNavigate();
  const [data, setData] = useState<MyReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibility, setVisibility] = useState("everyone");
  const [savingVisibility, setSavingVisibility] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [recipientProfileUrl, setRecipientProfileUrl] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const getContactId = () => {
    const userInfo = localStorage.getItem("LoginUserData");
    if (!userInfo) return null;
    return JSON.parse(userInfo).contact_id;
  };

  const fetchMyReputation = async () => {
    try {
      const contactId = getContactId();
      if (!contactId) return;
      const formData = new FormData();
      formData.append("contact_id", contactId);
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/my_reputation`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      setData(response.data.data || null);
    } catch (error) {
      console.error("Error fetching my reputation:", error);
      toast.error("Could not load your reputation.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentVisibility = async () => {
    const contactId = getContactId();
    if (!contactId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/api/contacts/data/1/${contactId}`, {
        headers: { authtoken: AuthData.token },
      });
      if (response.data?.review_visibility) setVisibility(response.data.review_visibility);
    } catch (error) {
      console.error("Error fetching current privacy setting:", error);
    }
  };

  useEffect(() => {
    fetchMyReputation();
    fetchCurrentVisibility();
  }, []);

  const updateVisibility = async (value: string) => {
    const contactId = getContactId();
    if (!contactId) return;
    setSavingVisibility(true);
    const previous = visibility;
    setVisibility(value);
    try {
      const formData = new FormData();
      formData.append("contact_id", contactId);
      formData.append("review_visibility", value);
      const response = await axios.post(
        `${API_BASE_URL}/admin/api/contacts/update_review_visibility`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      toast.success(response.data.message);
      const userInfo = localStorage.getItem("LoginUserData");
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        parsed.review_visibility = value;
        localStorage.setItem("LoginUserData", JSON.stringify(parsed));
      }
    } catch (error: any) {
      setVisibility(previous);
      toast.error(error?.response?.data?.message || "Could not update privacy setting.");
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleRequestReference = async () => {
    if (!data) return;
    if (!recipientProfileUrl.trim()) {
      toast.error("Enter the LinkedIn profile URL of the person you're asking.");
      return;
    }
    const contactId = getContactId();
    if (!contactId) return;

    setSubmittingRequest(true);
    try {
      const formData = new FormData();
      formData.append("contact_id", contactId);
      formData.append("profile_id", data.profile_id);
      formData.append("profile_name", data.profile_name);
      formData.append("recipient_profile_url", recipientProfileUrl.trim());
      formData.append("recipient_name", recipientName.trim());
      const response = await axios.post(
        `${API_BASE_URL}/admin/references/request`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      toast.success(response.data.message);
      setShowRequestForm(false);
      setRecipientProfileUrl("");
      setRecipientName("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }} />
      <div className="flex flex-col absolute bottom-0 w-full rounded-t-[15px] min-h-screen bg-WhiteColor shadow-add-review-shadow">
        <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-BorderColor-15">
          <div className="flex items-center gap-[10px]">
            <img src={UserIcon} className="h18w18" />
            <div className="text-base">My Reputation</div>
          </div>
          <button onClick={() => navigate("/profile")}>
            <img src={closeIcon} className="h18w18" />
          </button>
        </div>
        <div className="ScrollableContent">
          {loading ? (
            <div className="text-center text-sm text-light-blue py-[30px]">Loading...</div>
          ) : !data ? (
            <div className="text-center text-sm text-light-blue py-[30px]">
              Claim your LinkedIn profile from its review page to see your own reputation here.
            </div>
          ) : (
            <div className="flex flex-col gap-[15px] pt-15px">
              <div className="flex flex-col items-center gap-[2px] p-[16px] border border-BorderColor-15 rounded-[8px]">
                <div className="text-[34px] font-bold leading-none">
                  ⭐ {data.profile_avg_rating || 0}
                </div>
                <div className="text-[11px] text-BlackColor-60">
                  {data.reputation.total_reviews} reviews · {data.reputation.verified_count} verified relationships
                </div>
              </div>

              {data.reputation.total_reviews > 0 && (
                <div className="flex flex-col gap-[6px] p-[16px] border border-BorderColor-15 rounded-[8px]">
                  {CATEGORY_FIELDS.map((field) => {
                    const value = data.reputation.category_averages?.[field.key];
                    if (value == null) return null;
                    return (
                      <div key={field.key} className="flex items-center gap-2">
                        <span className="text-[11px] text-BlackColor-60 w-[130px] shrink-0 truncate">
                          {field.label}
                        </span>
                        <div className="flex-1 h-[6px] bg-BlackColor-15 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-LinkedInBlue rounded-full"
                            style={{ width: `${(value / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-BlackColor font-medium w-[22px] text-right">
                          {value}
                        </span>
                      </div>
                    );
                  })}
                  {data.reputation.would_work_again_pct != null && (
                    <div className="flex flex-col gap-[4px] pt-[10px] mt-[4px] border-t border-BorderColor-15">
                      <div className="flex items-center justify-between text-[11px] text-BlackColor-60">
                        <span>Would work again</span>
                        <span className="font-medium text-BlackColor">
                          {data.reputation.would_work_again_pct}%
                        </span>
                      </div>
                      <div className="h-[6px] bg-BlackColor-15 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1D7A3E] rounded-full"
                          style={{ width: `${data.reputation.would_work_again_pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-[10px] p-[16px] border border-BorderColor-15 rounded-[8px]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Request references</span>
                  <button
                    type="button"
                    className="btn premium-btn btn-sm !font-normal !shadow-none !w-auto"
                    onClick={() => setShowRequestForm((prev) => !prev)}
                  >
                    + Request
                  </button>
                </div>
                {showRequestForm && (
                  <div className="flex flex-col gap-[10px]">
                    <input
                      type="text"
                      className="FromInput !border !border-BorderColor-15"
                      placeholder="Their LinkedIn profile URL"
                      value={recipientProfileUrl}
                      onChange={(e) => setRecipientProfileUrl(e.target.value)}
                    />
                    <input
                      type="text"
                      className="FromInput !border !border-BorderColor-15"
                      placeholder="Their name (optional)"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn sign-in-btn btn-sm !font-normal !shadow-none"
                      onClick={handleRequestReference}
                      disabled={submittingRequest}
                    >
                      Send Request
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-[10px] p-[16px] border border-BorderColor-15 rounded-[8px]">
                <span className="text-sm font-semibold">Who can see my reviews?</span>
                <div className="flex flex-col gap-[8px]">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-[10px] text-sm text-BlackColor cursor-pointer"
                    >
                      <span
                        className={`h-[16px] w-[16px] rounded-full border flex items-center justify-center shrink-0 ${
                          visibility === option.value ? "border-LinkedInBlue" : "border-BorderColor-15"
                        }`}
                      >
                        {visibility === option.value && (
                          <span className="h-[8px] w-[8px] rounded-full bg-LinkedInBlue" />
                        )}
                      </span>
                      <input
                        type="radio"
                        name="review_visibility"
                        value={option.value}
                        checked={visibility === option.value}
                        onChange={() => updateVisibility(option.value)}
                        disabled={savingVisibility}
                        className="hidden"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
