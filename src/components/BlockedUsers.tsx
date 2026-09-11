import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import UserIcon from "../assets/images/user.png";
import closeIcon from "../assets/images/close.png";
import UserProfile from "../assets/images/user-profile.png";
import { AuthData, API_BASE_URL } from "../config";

type BlockedUser = {
  blocked_contact_id: string;
  fullname: string;
  profile_image: string | null;
  blocked_at: string;
};

export default function BlockedUsers() {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const getContactId = () => {
    const userInfo = localStorage.getItem("LoginUserData");
    if (!userInfo) return null;
    return JSON.parse(userInfo).contact_id;
  };

  const fetchBlockedUsers = async () => {
    try {
      const contactId = getContactId();
      if (!contactId) return;
      const formData = new FormData();
      formData.append("contact_id", contactId);
      const response = await axios.post(
        `${API_BASE_URL}/admin/api/contacts/blocked_list`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      setBlockedUsers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      toast.error("Could not load blocked users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (blockedContactId: string) => {
    const contactId = getContactId();
    if (!contactId) return;
    try {
      const formData = new FormData();
      formData.append("contact_id", contactId);
      formData.append("blocked_contact_id", blockedContactId);
      const response = await axios.post(
        `${API_BASE_URL}/admin/api/contacts/unblock`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      toast.success(response.data.message);
      setBlockedUsers((prev) => prev.filter((u) => u.blocked_contact_id !== blockedContactId));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }} />
      <div className="flex flex-col absolute bottom-0 w-full rounded-t-[15px] min-h-screen bg-WhiteColor shadow-add-review-shadow">
        <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-BorderColor-15">
          <div className="flex items-center gap-[10px]">
            <img src={UserIcon} className="h18w18" />
            <div className="text-base">Blocked Users</div>
          </div>
          <button onClick={() => navigate("/profile")}>
            <img src={closeIcon} className="h18w18" />
          </button>
        </div>
        <div className="ScrollableContent">
          {loading ? (
            <div className="text-center text-sm text-light-blue py-[30px]">Loading...</div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center text-sm text-light-blue py-[30px]">
              You haven't blocked anyone. Block someone from the three-dot menu on their review.
            </div>
          ) : (
            <div className="RetingCardMain">
              {blockedUsers.map((user) => (
                <div key={user.blocked_contact_id} className="RetingCard">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="overflow-hidden rounded-full h-7 w-7">
                        <img
                          src={
                            user.profile_image
                              ? `${API_BASE_URL}/uploads/profile/${user.profile_image}`
                              : UserProfile
                          }
                          className="object-cover h-full w-full"
                        />
                      </div>
                      <span className="text-sm font-semibold capitalize">{user.fullname}</span>
                    </div>
                    <button
                      type="button"
                      className="btn premium-btn btn-sm !font-normal !shadow-none !w-auto"
                      onClick={() => handleUnblock(user.blocked_contact_id)}
                    >
                      Unblock
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
