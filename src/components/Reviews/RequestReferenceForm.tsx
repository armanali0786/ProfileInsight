import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthData, API_BASE_URL } from "../../config";

// Shared by ReviewHeader's "Request Reference" action and ReviewsList's cold-start
// "Ask the Network" prompt (Phase 6) -- same request, two different entry points.
export default function RequestReferenceForm({ profileId, profileName, onCancel, onSent }) {
  const [recipientProfileUrl, setRecipientProfileUrl] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!recipientProfileUrl.trim()) {
      toast.error("Enter the LinkedIn profile URL of the person you're asking.");
      return;
    }
    const userInfo = localStorage.getItem("LoginUserData");
    if (!userInfo) return;
    const parsedInfo = JSON.parse(userInfo);
    const contactId = parsedInfo.contact_id;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("contact_id", contactId);
      formData.append("profile_id", profileId);
      formData.append("profile_name", profileName || "");
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
      setRecipientProfileUrl("");
      setRecipientName("");
      onSent?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-[10px] p-[12px] border border-BorderColor-15 rounded-[5px]">
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
      <div className="flex gap-[10px]">
        <button
          className="btn premium-btn btn-sm !font-normal !shadow-none flex-1"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="btn sign-in-btn btn-sm !font-normal !shadow-none flex-1"
          onClick={handleSubmit}
          disabled={submitting}
        >
          Send Request
        </button>
      </div>
    </div>
  );
}
