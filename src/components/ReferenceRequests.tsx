import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import UserIcon from "../assets/images/user.png";
import closeIcon from "../assets/images/close.png";
import { AuthData, API_BASE_URL } from "../config";
import {
  CATEGORY_FIELDS,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_DURATIONS,
  defaultCategoryRatings,
} from "../constants/reputation";
import { SelectDropdown, CategoryStarRow, SectionTitle } from "./Reviews/FormControls";

type PendingReferenceRequest = {
  request_id: string;
  profile_id: string;
  profile_name: string;
  requested_by_fullname: string;
  status: string;
  created_at: string;
};

type SentReferenceRequest = {
  request_id: string;
  recipient_fullname: string;
  recipient_profile_img: string | null;
  status: "pending" | "completed" | "declined";
  created_at: string;
  last_reminded_at: string | null;
  relationship_type: string | null;
  rating: number | null;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

const emptyResponse = () => ({
  category_ratings: defaultCategoryRatings(),
  relationship_type: "worked_together",
  relationship_duration: "6_12m",
  strengths_note: "",
  next_manager_note: "",
  would_hire_again: true,
});

export default function ReferenceRequests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"to_answer" | "sent">("to_answer");
  const [requests, setRequests] = useState<PendingReferenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, ReturnType<typeof emptyResponse>>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [sentRequests, setSentRequests] = useState<SentReferenceRequest[]>([]);
  const [loadingSent, setLoadingSent] = useState(true);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const getContactId = () => {
    const userInfo = localStorage.getItem("LoginUserData");
    if (!userInfo) return null;
    return JSON.parse(userInfo).contact_id;
  };

  const fetchPendingRequests = async () => {
    try {
      const contactId = getContactId();
      if (!contactId) return;

      const formData = new FormData();
      formData.append("contact_id", contactId);
      const response = await axios.post(
        `${API_BASE_URL}/admin/references/pending`,
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
      console.error("Error fetching pending reference requests:", error);
      toast.error("Could not load reference requests.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const contactId = getContactId();
      if (!contactId) return;

      const formData = new FormData();
      formData.append("contact_id", contactId);
      const response = await axios.post(
        `${API_BASE_URL}/admin/references/sent`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      setSentRequests(response.data.data || []);
    } catch (error) {
      console.error("Error fetching sent reference requests:", error);
      toast.error("Could not load sent requests.");
    } finally {
      setLoadingSent(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchSentRequests();
  }, []);

  const remindRequest = async (requestId: string) => {
    const contactId = getContactId();
    if (!contactId) return;
    setRemindingId(requestId);
    try {
      const formData = new FormData();
      formData.append("contact_id", contactId);
      formData.append("request_id", requestId);
      const response = await axios.post(
        `${API_BASE_URL}/admin/references/remind`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      toast.success(response.data.message);
      setSentRequests((prev) =>
        prev.map((r) => (r.request_id === requestId ? { ...r, last_reminded_at: new Date().toISOString() } : r))
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong.");
    } finally {
      setRemindingId(null);
    }
  };

  const toggleOpen = (requestId: string) => {
    setOpenRequestId((prev) => (prev === requestId ? null : requestId));
    setResponses((prev) => (prev[requestId] ? prev : { ...prev, [requestId]: emptyResponse() }));
  };

  const updateResponse = (requestId: string, patch: Partial<ReturnType<typeof emptyResponse>>) => {
    setResponses((prev) => ({ ...prev, [requestId]: { ...prev[requestId], ...patch } }));
  };

  const setCategoryRating = (requestId: string, key: string, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        category_ratings: { ...prev[requestId].category_ratings, [key]: value },
      },
    }));
  };

  const respond = async (requestId: string, action: "submit" | "decline") => {
    const userInfo = localStorage.getItem("LoginUserData");
    if (!userInfo) return;
    const parsedInfo = JSON.parse(userInfo);
    const contactId = parsedInfo.contact_id;
    const draft = responses[requestId] || emptyResponse();

    if (action === "submit") {
      const unratedCategory = CATEGORY_FIELDS.find((field) => !draft.category_ratings[field.key]);
      if (unratedCategory) {
        toast.error(`Please rate "${unratedCategory.label}".`);
        return;
      }
    }

    setSubmittingId(requestId);
    try {
      const formData = new FormData();
      formData.append("contact_id", contactId);
      formData.append("request_id", requestId);
      formData.append("action", action);
      if (action === "submit") {
        formData.append("category_ratings", JSON.stringify(draft.category_ratings));
        formData.append("relationship_type", draft.relationship_type);
        formData.append("relationship_duration", draft.relationship_duration);
        formData.append("strengths_note", draft.strengths_note);
        formData.append("next_manager_note", draft.next_manager_note);
        formData.append("would_hire_again", draft.would_hire_again ? "1" : "0");
      }
      const response = await axios.post(
        `${API_BASE_URL}/admin/references/respond`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      toast.success(response.data.message);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      setOpenRequestId(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }} />
      <div className="flex flex-col absolute bottom-0 w-full rounded-t-[15px] min-h-screen bg-WhiteColor shadow-add-review-shadow">
        <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-BorderColor-15">
          <div className="flex items-center gap-[10px]">
            <img src={UserIcon} className="h18w18" />
            <div className="text-base">Reference Requests</div>
          </div>
          <button onClick={() => navigate("/profile")}>
            <img src={closeIcon} className="h18w18" />
          </button>
        </div>
        <div className="flex items-center gap-[20px] bg-LinkedInBlue px-[20px] h-[40px]">
          <button
            onClick={() => setActiveTab("to_answer")}
            className={`text-sm duration-200 ${
              activeTab === "to_answer" ? "text-WhiteColor font-semibold" : "text-WhiteColor/70 hover:text-WhiteColor"
            }`}
          >
            To Answer{requests.length > 0 ? ` (${requests.length})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`text-sm duration-200 ${
              activeTab === "sent" ? "text-WhiteColor font-semibold" : "text-WhiteColor/70 hover:text-WhiteColor"
            }`}
          >
            Sent
          </button>
        </div>
        <div className="ScrollableContent">
          {activeTab === "sent" ? (
            loadingSent ? (
              <div className="text-center text-sm text-light-blue py-[30px]">Loading...</div>
            ) : sentRequests.length === 0 ? (
              <div className="text-center text-sm text-light-blue py-[30px]">
                You haven't requested any references yet.
              </div>
            ) : (
              <div className="flex flex-col gap-[20px] pt-15px">
                {["pending", "completed", "declined"].map((statusGroup) => {
                  const items = sentRequests.filter((r) => r.status === statusGroup);
                  if (items.length === 0) return null;
                  return (
                    <div key={statusGroup} className="flex flex-col gap-[10px]">
                      <div className="text-xs font-semibold uppercase tracking-wide text-BlackColor-60">
                        {statusGroup} ({items.length})
                      </div>
                      {items.map((item) => (
                        <div key={item.request_id} className="RetingCard">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold capitalize">{item.recipient_fullname}</span>
                            {item.status === "completed" && (
                              <span className="text-[10px] px-[6px] py-[1px] rounded-[4px] bg-[#E7F3EC] text-[#1D7A3E] font-medium">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-BlackColor-60">
                            <span>
                              {item.status === "pending"
                                ? `Requested ${formatDate(item.created_at)}`
                                : item.rating
                                ? `⭐ ${item.rating}`
                                : ""}
                            </span>
                            {item.status === "pending" && (
                              <button
                                type="button"
                                disabled={remindingId === item.request_id}
                                onClick={() => remindRequest(item.request_id)}
                                className="text-LinkedInBlue font-medium cursor-pointer"
                              >
                                {item.last_reminded_at ? "Remind again" : "Remind"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )
          ) : loading ? (
            <div className="text-center text-sm text-light-blue py-[30px]">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-sm text-light-blue py-[30px]">
              No pending reference requests. When someone asks you for a reference about a
              candidate, it'll show up here.
            </div>
          ) : (
            <div className="RetingCardMain">
              {requests.map((request) => {
                const isOpen = openRequestId === request.request_id;
                const draft = responses[request.request_id] || emptyResponse();
                const isSubmitting = submittingId === request.request_id;
                return (
                  <div key={request.request_id} className="RetingCard">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold truncate max-w-full leading-[1] capitalize">
                        {request.profile_name || request.profile_id}
                      </span>
                      <span className="text-[11px] text-BlackColor-60">
                        Requested by {request.requested_by_fullname}
                      </span>
                    </div>

                    {!isOpen ? (
                      <div className="flex items-center gap-[10px] pt-1">
                        <button
                          type="button"
                          onClick={() => toggleOpen(request.request_id)}
                          className="btn premium-btn btn-sm !font-normal !shadow-none flex-1"
                        >
                          Give reference
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => respond(request.request_id, "decline")}
                          className="btn sign-in-btn btn-sm !font-normal !shadow-none flex-1"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-[15px] p-[12px] border border-BorderColor-15 rounded-[5px]">
                        <div className="flex flex-col gap-[10px]">
                          <SectionTitle>Your relationship</SectionTitle>
                          <SelectDropdown
                            label="How do you know this person?"
                            value={draft.relationship_type}
                            options={RELATIONSHIP_TYPES}
                            onChange={(value) => updateResponse(request.request_id, { relationship_type: value })}
                          />
                          <SelectDropdown
                            label="How long did you work together?"
                            value={draft.relationship_duration}
                            options={RELATIONSHIP_DURATIONS}
                            onChange={(value) =>
                              updateResponse(request.request_id, { relationship_duration: value })
                            }
                          />
                        </div>

                        <div className="flex flex-col gap-[10px] pt-[15px] border-t border-BorderColor-15">
                          <SectionTitle>Rate them on</SectionTitle>
                          {CATEGORY_FIELDS.map((field) => (
                            <CategoryStarRow
                              key={field.key}
                              label={field.label}
                              value={Number(draft.category_ratings[field.key]) || 0}
                              onChange={(value) => setCategoryRating(request.request_id, field.key, value)}
                            />
                          ))}
                        </div>

                        <div className="flex flex-col gap-[10px] pt-[15px] border-t border-BorderColor-15">
                          <SectionTitle>Would you hire or work with them again?</SectionTitle>
                          <div className="grid grid-cols-2 gap-[10px]">
                            <button
                              type="button"
                              onClick={() => updateResponse(request.request_id, { would_hire_again: true })}
                              className={`btn btn-sm !font-normal !shadow-none ${
                                draft.would_hire_again === true ? "sign-in-btn" : "premium-btn"
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => updateResponse(request.request_id, { would_hire_again: false })}
                              className={`btn btn-sm !font-normal !shadow-none ${
                                draft.would_hire_again === false ? "sign-in-btn" : "premium-btn"
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 pt-[15px] border-t border-BorderColor-15">
                          <label className="text-xs text-BlackColor-60">
                            What are their biggest strengths?
                          </label>
                          <textarea
                            className="FromInput !border !border-BorderColor-15"
                            rows={3}
                            maxLength={400}
                            value={draft.strengths_note}
                            onChange={(e) =>
                              updateResponse(request.request_id, { strengths_note: e.target.value })
                            }
                            placeholder="e.g. Consistently owns problems end-to-end and communicates progress clearly."
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-BlackColor-60">
                            What should their next manager know? (optional)
                          </label>
                          <textarea
                            className="FromInput !border !border-BorderColor-15"
                            rows={3}
                            maxLength={400}
                            value={draft.next_manager_note}
                            onChange={(e) =>
                              updateResponse(request.request_id, { next_manager_note: e.target.value })
                            }
                            placeholder="e.g. Does best with clear ownership rather than close oversight."
                          />
                        </div>

                        <div className="flex items-center gap-[10px]">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => respond(request.request_id, "submit")}
                            className="btn sign-in-btn btn-sm !font-normal !shadow-none flex-1"
                          >
                            Submit reference
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setOpenRequestId(null)}
                            className="btn premium-btn btn-sm !font-normal !shadow-none flex-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
