import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import UserIcon from "../assets/images/user.png";
import closeIcon from "../assets/images/close.png";
import UserProfile from "../assets/images/user-profile.png";
import DownArrorIcon from "../assets/images/down-arror.png";
import { AuthData, API_BASE_URL } from "../config";

type Candidate = {
  profile_id: string;
  profile_name: string;
  profile_image: string;
  headline: string;
  avg_rating: number;
  total_reviews: number;
  verified_count: number;
  reference_count: number;
  signal: "strong" | "good" | "review" | "no_data";
};

type AiSummary = {
  summary: string;
  strengths: string[];
  concerns: string[];
  confidence: "low" | "medium" | "high";
  based_on: number;
  verified_relationships: number;
};

const SIGNAL_META: Record<Candidate["signal"], { label: string; className: string }> = {
  strong: { label: "🟢 Strong", className: "bg-[#E7F3EC] text-[#1D7A3E]" },
  good: { label: "🟢 Good", className: "bg-[#EAF1FB] text-LinkedInBlue" },
  review: { label: "🟡 Review", className: "bg-[#FDF3E7] text-[#8A5A00]" },
  no_data: { label: "⚪ No data", className: "bg-GrayBg text-BlackColor-60" },
};

// Sub-nav for the dashboard, styled after the blue tab bar reference (bold active tab,
// lighter inactive tabs) -- reuses the app's existing LinkedInBlue header color instead of
// introducing a new palette.
function DashboardTabs({ navigate }) {
  const tabs = [
    { key: "candidates", label: "Candidates", active: true },
    { key: "requests", label: "Reference Requests", onClick: () => navigate("/reference-requests") },
    { key: "verifications", label: "Verifications", onClick: () => navigate("/verification-requests") },
  ];

  return (
    <div className="flex items-center gap-[20px] bg-LinkedInBlue px-[20px] h-[44px] mx-[-20px]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={tab.onClick}
          className={`text-sm duration-200 ${
            tab.active ? "text-WhiteColor font-semibold" : "text-WhiteColor/70 font-normal hover:text-WhiteColor"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Screen 5 "Hiring Snapshot" -- only reachable from this recruiter workflow, never surfaced
  // automatically on every profile view, per the compliance note: this is a deliberate,
  // opted-into recruiting action, not a default background judgment shown to casual visitors.
  const [snapshotCandidate, setSnapshotCandidate] = useState<Candidate | null>(null);
  const [snapshotSummary, setSnapshotSummary] = useState<AiSummary | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);

  const fetchDashboard = async () => {
    try {
      const userInfo = localStorage.getItem("LoginUserData");
      if (!userInfo) return;
      const parsedInfo = JSON.parse(userInfo);
      const contactId = parsedInfo.contact_id;

      const formData = new FormData();
      formData.append("contact_id", contactId);
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/dashboard`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      setCandidates(response.data.data || []);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Could not load the dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const openSnapshot = async (candidate: Candidate) => {
    setSnapshotCandidate(candidate);
    setSnapshotSummary(null);
    setLoadingSnapshot(true);
    try {
      const formData = new FormData();
      formData.append("profile_id", candidate.profile_id);
      const response = await axios.post(
        `${API_BASE_URL}/admin/reviews/reputation_summary`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      setSnapshotSummary(response.data.data || null);
    } catch (error) {
      console.error("Error fetching hiring snapshot:", error);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  const openLinkedInProfile = async (profileId: string) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.update(tab.id, { url: `https://www.linkedin.com/in/${profileId}/` });
      }
    } catch (error) {
      console.error("Error opening profile tab:", error);
    }
    navigate("/reviews");
  };

  if (snapshotCandidate) {
    const signal = SIGNAL_META[snapshotCandidate.signal];
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }} />
        <div className="flex flex-col absolute bottom-0 w-full rounded-t-[15px] min-h-screen bg-WhiteColor shadow-add-review-shadow">
          <div className="flex items-center gap-[10px] px-[20px] py-[15px] border-b border-BorderColor-15">
            <button onClick={() => setSnapshotCandidate(null)}>
              <img src={DownArrorIcon} className="h-[15px] w-[15px] rotate-90" />
            </button>
            <div className="text-base">Hiring Snapshot</div>
          </div>
          <div className="ScrollableContent">
            <div className="flex flex-col gap-[15px] pt-15px">
              <div className="flex items-center gap-[10px]">
                <div className="overflow-hidden rounded-full h-[50px] w-[50px] shrink-0">
                  <img
                    src={
                      snapshotCandidate.profile_image
                        ? `${API_BASE_URL}/uploads/profile/${snapshotCandidate.profile_image}`
                        : UserProfile
                    }
                    className="object-cover h-full w-full"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-semibold truncate capitalize">
                    {snapshotCandidate.profile_name || snapshotCandidate.profile_id}
                  </span>
                  <span className={`text-[10px] px-[8px] py-[2px] rounded-full w-fit ${signal.className}`}>
                    {signal.label} signal
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-[2px] p-[16px] border border-BorderColor-15 rounded-[8px]">
                <div className="text-[34px] font-bold leading-none">⭐ {snapshotCandidate.avg_rating || "—"}</div>
                <div className="text-[11px] text-BlackColor-60">Professional reputation</div>
                <div className="text-[11px] text-BlackColor-60 mt-[6px]">
                  Confidence:{" "}
                  <span className="font-semibold text-BlackColor">
                    {loadingSnapshot ? "…" : snapshotSummary?.confidence?.toUpperCase() || "LOW"}
                  </span>
                </div>
              </div>

              {loadingSnapshot ? (
                <div className="text-center text-sm text-light-blue py-[10px]">Loading signals...</div>
              ) : (
                snapshotSummary && (
                  <>
                    {snapshotSummary.strengths.length > 0 && (
                      <div className="flex flex-col gap-[8px] p-[16px] border border-BorderColor-15 rounded-[8px]">
                        <div className="text-sm font-semibold">Top signals</div>
                        <div className="flex flex-col gap-[4px]">
                          {snapshotSummary.strengths.map((strength, index) => (
                            <div key={index} className="text-[12px] text-BlackColor">
                              ✓ {strength}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {snapshotSummary.summary && (
                      <div className="flex flex-col gap-[6px] p-[16px] border border-BorderColor-15 rounded-[8px]">
                        <div className="text-sm font-semibold">Recent feedback</div>
                        <div className="text-[12px] text-BlackColor leading-[1.4] italic">
                          "{snapshotSummary.summary}"
                        </div>
                      </div>
                    )}
                  </>
                )
              )}

              <div className="flex flex-col gap-[4px] p-[16px] border border-BorderColor-15 rounded-[8px]">
                <div className="text-sm font-semibold">Reference coverage</div>
                <div className="text-[12px] text-BlackColor-60">
                  {snapshotCandidate.verified_count} verified relationship
                  {snapshotCandidate.verified_count === 1 ? "" : "s"} · {snapshotCandidate.reference_count} structured
                  reference{snapshotCandidate.reference_count === 1 ? "" : "s"}
                </div>
              </div>

              <button
                type="button"
                className="btn premium-btn btn-sm !font-normal !shadow-none"
                onClick={() => openLinkedInProfile(snapshotCandidate.profile_id)}
              >
                View evidence (all reviews)
              </button>
              <button
                type="button"
                className="btn sign-in-btn btn-sm !font-normal !shadow-none"
                onClick={() => openLinkedInProfile(snapshotCandidate.profile_id)}
              >
                Open LinkedIn Profile
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }} />
      <div className="flex flex-col absolute bottom-0 w-full rounded-t-[15px] min-h-screen bg-WhiteColor shadow-add-review-shadow">
        <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-BorderColor-15">
          <div className="flex items-center gap-[10px]">
            <img src={UserIcon} className="h18w18" />
            <div className="text-base">Recruiter Dashboard</div>
          </div>
          <button onClick={() => navigate("/profile")}>
            <img src={closeIcon} className="h18w18" />
          </button>
        </div>
        <DashboardTabs navigate={navigate} />
        <div className="ScrollableContent">
          {loading ? (
            <div className="text-center text-sm text-light-blue py-[30px]">Loading...</div>
          ) : candidates.length === 0 ? (
            <div className="text-center text-sm text-light-blue py-[30px]">
              Candidates you've reviewed show up here with an at-a-glance hiring signal.
              Review a LinkedIn profile to add it to your dashboard.
            </div>
          ) : (
            <div className="RetingCardMain">
              {candidates.map((candidate) => {
                const signal = SIGNAL_META[candidate.signal];
                return (
                  <a
                    key={candidate.profile_id}
                    className="RetingCard cursor-pointer"
                    onClick={() => openSnapshot(candidate)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 w-[calc(100%-90px)]">
                        <div className="overflow-hidden rounded-full h-8 w-8 shrink-0">
                          <img
                            src={
                              candidate.profile_image
                                ? `${API_BASE_URL}/uploads/profile/${candidate.profile_image}`
                                : UserProfile
                            }
                            className="object-cover h-full w-full"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold truncate capitalize">
                            {candidate.profile_name || candidate.profile_id}
                          </span>
                          {candidate.headline && (
                            <span className="text-[11px] text-BlackColor-60 truncate">
                              {candidate.headline}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] px-[8px] py-[3px] rounded-full whitespace-nowrap ${signal.className}`}>
                        {signal.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-[15px] text-[11px] text-BlackColor-60">
                      <span>⭐ {candidate.avg_rating || "—"}</span>
                      <span>{candidate.total_reviews} reviews</span>
                      <span>🟢 {candidate.verified_count} verified</span>
                      <span>📋 {candidate.reference_count} references</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
