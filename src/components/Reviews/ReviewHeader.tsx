import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import OneRetingStar from "../../assets/images/one-star.png";
import HalfRetingStar from "../../assets/images/half-star.png";
import EmptyRatingStar from "../../assets/images/empty-star.png";
import UserProfileImage from "../../assets/images/user-profile-image.png";
import Review from "../Review";
import { CATEGORY_FIELDS } from "../../constants/reputation";
import { AuthData, API_BASE_URL } from "../../config";

type AiReputationSummary = {
  summary: string;
  strengths: string[];
  concerns: string[];
  confidence: "low" | "medium" | "high";
  based_on: number;
  verified_relationships: number;
};

interface ReviewHeaderProps {
  profileId: string;
  linkedInUserDetails: {
    name: string;
    location: string;
    headline: string;
    profilePic: string;
    profileUrl: string;
  };
  handleShowAddReview: () => void;
  hideReviewBtn: boolean;
  showClaimButton: boolean;  // Make sure this prop exists in the type definition
  handleClaimProfile: () => void;
  claimProfileInput: boolean;
  handleCancelClaim: () => void;
  handleSubmitClaim: (code: string) => void;
  isClaimButtonDisabled: boolean;
  extraData: {
    profile_avg_rating: number;
    profile_total_ratings: number;
    show_claim_button: number;
    show_code_input: number;
    request_id: number;
    reputation?: {
      category_averages: Record<string, number | null>;
      would_work_again_pct: number | null;
      verified_count: number;
      unverified_count: number;
      total_reviews: number;
    };
  };
}

const ReviewHeader: React.FC<ReviewHeaderProps> = ({
  profileId,
  linkedInUserDetails,
  handleShowAddReview,
  hideReviewBtn,
  showClaimButton,  // Prop name should match the one passed from the parent
  handleClaimProfile,
  claimProfileInput,
  handleCancelClaim,
  handleSubmitClaim,
  isClaimButtonDisabled,
  extraData
}) => {

  const [claimProfileInputCode, setClaimProfileInputCode] = useState(null);
  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) {
      setClaimProfileInputCode(value);
    }
  };

  /*------------------  Request Reference (Phase 3)  ----------------------*/
  const [showRequestReferenceForm, setShowRequestReferenceForm] = useState(false);
  const [recipientProfileUrl, setRecipientProfileUrl] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [submittingReferenceRequest, setSubmittingReferenceRequest] = useState(false);

  const handleRequestReference = async () => {
    if (!recipientProfileUrl.trim()) {
      toast.error("Enter the LinkedIn profile URL of the person you're asking.");
      return;
    }
    const userInfo = localStorage.getItem("LoginUserData");
    if (!userInfo) return;
    const parsedInfo = JSON.parse(userInfo);
    const contactId = parsedInfo.contact_id;

    setSubmittingReferenceRequest(true);
    try {
      const formData = new FormData();
      formData.append("contact_id", contactId);
      formData.append("profile_id", profileId);
      formData.append("profile_name", linkedInUserDetails.name);
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
      setShowRequestReferenceForm(false);
      setRecipientProfileUrl("");
      setRecipientName("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmittingReferenceRequest(false);
    }
  };

  /*------------------  AI Reputation Summary (Phase 2)  ----------------------*/
  const [aiSummary, setAiSummary] = useState<AiReputationSummary | null>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const totalReviews = extraData?.reputation?.total_reviews || 0;

  useEffect(() => {
    let cancelled = false;
    if (!profileId || totalReviews < 3) {
      setAiSummary(null);
      return;
    }
    setLoadingAiSummary(true);
    const formData = new FormData();
    formData.append("profile_id", profileId);
    axios
      .post(`${API_BASE_URL}/admin/reviews/reputation_summary`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          authtoken: AuthData.token,
        },
      })
      .then((response) => {
        if (!cancelled) setAiSummary(response.data.data || null);
      })
      .catch(() => {
        if (!cancelled) setAiSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingAiSummary(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId, totalReviews]);

  /*------------------  Completed references for this candidate (Phase 3)  ----------------------*/
  const [references, setReferences] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!profileId) {
      setReferences([]);
      return;
    }
    const formData = new FormData();
    formData.append("profile_id", profileId);
    axios
      .post(`${API_BASE_URL}/admin/references/for_profile`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          authtoken: AuthData.token,
        },
      })
      .then((response) => {
        if (!cancelled) setReferences(response.data.data || []);
      })
      .catch(() => {
        if (!cancelled) setReferences([]);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);
  return (
    <>
      {/* ReviewHeaderMain start */}
      <div className="ReviewHeaderMain">
        <div className="ReviewHeader">
          <div className="ReviewHeaderLeft">
            <img
              className="h90w90 rounded-full"
              src={linkedInUserDetails.profilePic || UserProfileImage}
              alt="Profile picture"
            />
            <div className="flex flex-col gap-1">
              <div className=" text-xl font-semibold truncate">
                {linkedInUserDetails.name}
              </div>
              <div className=" text-BlackColor-60 text-xs">
                {linkedInUserDetails.location}
              </div>
            </div>
          </div>
          <div className="ReviewHeaderRight">
            <div className="grid grid-cols-2 gap-10px ml-[-15px]">
              <button
                className="btn premium-btn  btn-sm !font-normal !shadow-none"
                onClick={handleShowAddReview}
              >
                {hideReviewBtn ? "Reviewed" : "Review"}
              </button>
              <button className="btn sign-in-btn btn-sm !font-normal !shadow-none">
                Follow
              </button>
            </div>
            <div className="flex items-center gap-15px px-10px py-3 border border-BorderColor-15 rounded-[5px]">
              <div className="text-3xl font-semibold">
                {extraData.profile_avg_rating || 0.0}
              </div>
              <div className="bg-BlackColor-15 w-[1px] h-6"></div>
              {/* <div className=" flex flex-col gap-[6px]">
                <div className=" flex items-center gap-[2px]">
                  <img src={OneRetingStar} className="h-[13px] w-[13px]" />
                  <img src={OneRetingStar} className="h-[13px] w-[13px]" />
                  <img src={OneRetingStar} className="h-[13px] w-[13px]" />
                  <img src={OneRetingStar} className="h-[13px] w-[13px]" />
                  <img src={HalfRetingStar} className="h-[13px] w-[13px]" />
                </div>
                <div className="text-BlackColor-60 text-xs text-center">{profileTotalRating|| 0} Ratings</div>
              </div> */}
              <div className=" flex flex-col gap-[6px]">
                <div className="flex items-center gap-[2px]">
                  {
                    // Check if profileTotalRating is invalid (null, undefined, or 0)
                    extraData.profile_avg_rating ? (
                      <>
                        {
                          // Loop to render full stars
                          [...Array(Math.floor(extraData.profile_avg_rating))].map(
                            (_, index) => (
                              <img
                                key={`full-${index}`}
                                src={OneRetingStar}
                                className="h-[13px] w-[13px]"
                              />
                            )
                          )
                        }

                        {
                          // Check if there's a half-star to show
                          extraData.profile_avg_rating % 1 !== 0 &&
                          extraData.profile_avg_rating <= 5 ? (
                            <img
                              src={HalfRetingStar}
                              className="h-[13px] w-[13px]"
                            />
                          ) : null
                        }

                        {
                          // Loop to render empty stars if the rating is less than 5
                          [...Array(5 - Math.ceil(extraData.profile_avg_rating))].map(
                            (_, index) => (
                              <img
                                key={`empty-${index}`}
                                src={EmptyRatingStar}
                                className="h-[13px] w-[13px]"
                              />
                            )
                          )
                        }
                      </>
                    ) : (
                      // If avgProfileRating is invalid or missing, show empty stars
                      [...Array(5)].map((_, index) => (
                        <img
                          key={`empty-${index}`}
                          src={EmptyRatingStar}
                          className="h-[13px] w-[13px]"
                        />
                      ))
                    )
                  }
                </div>
                <div className="text-BlackColor-60 text-xs text-center">
                  {extraData.profile_total_ratings || 0} Ratings
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className=" text-BlackColor text-sm">
          {linkedInUserDetails.headline}
        </div>

        {extraData.reputation && extraData.reputation.total_reviews > 0 && (
          <div className="flex flex-col gap-[10px] mt-[10px] p-[12px] border border-BorderColor-15 rounded-[5px]">
            <div className="text-sm font-semibold text-BlackColor">Professional Reputation</div>
            <div className="flex flex-col gap-[6px]">
              {CATEGORY_FIELDS.map((field) => {
                const value = extraData.reputation.category_averages?.[field.key];
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
            </div>
            {extraData.reputation.would_work_again_pct != null && (
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-center justify-between text-[11px] text-BlackColor-60">
                  <span>Would work with again</span>
                  <span className="font-medium text-BlackColor">
                    {extraData.reputation.would_work_again_pct}%
                  </span>
                </div>
                <div className="h-[6px] bg-BlackColor-15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1D7A3E] rounded-full"
                    style={{ width: `${extraData.reputation.would_work_again_pct}%` }}
                  />
                </div>
              </div>
            )}
            {(aiSummary || loadingAiSummary) && (
              <div className="flex flex-col gap-[8px] pt-[10px] border-t border-BorderColor-15">
                <div className="text-[11px] font-semibold text-BlackColor-60 uppercase tracking-wide">
                  AI Summary
                </div>
                {loadingAiSummary && !aiSummary ? (
                  <div className="text-[11px] text-BlackColor-40">Generating summary...</div>
                ) : (
                  aiSummary && (
                    <>
                      <div className="text-[12px] text-BlackColor leading-[1.4]">{aiSummary.summary}</div>
                      {aiSummary.strengths.length > 0 && (
                        <div className="flex flex-col gap-[4px]">
                          <span className="text-[10px] text-BlackColor-60">Common strengths</span>
                          <div className="flex flex-wrap gap-[6px]">
                            {aiSummary.strengths.map((strength, index) => (
                              <span
                                key={index}
                                className="text-[10px] px-[8px] py-[3px] rounded-full bg-[#EAF1FB] text-LinkedInBlue"
                              >
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {aiSummary.concerns.length > 0 && (
                        <div className="flex flex-col gap-[4px]">
                          <span className="text-[10px] text-BlackColor-60">Potential concerns</span>
                          <div className="flex flex-wrap gap-[6px]">
                            {aiSummary.concerns.map((concern, index) => (
                              <span
                                key={index}
                                className="text-[10px] px-[8px] py-[3px] rounded-full bg-[#FDF3E7] text-[#8A5A00]"
                              >
                                {concern}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-[10px] text-BlackColor-40">
                        Confidence: {aiSummary.confidence?.toUpperCase()} · Based on {aiSummary.based_on} reviews (
                        {aiSummary.verified_relationships} verified)
                      </div>
                    </>
                  )
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-BlackColor-60 pt-[4px] border-t border-BorderColor-15">
              <span>🟢 {extraData.reputation.verified_count} verified</span>
              <span>⚪ {extraData.reputation.unverified_count} unverified</span>
            </div>
          </div>
        )}

        {references.length > 0 && (
          <div className="flex flex-col gap-[10px] p-[12px] border border-BorderColor-15 rounded-[5px]">
            <div className="text-sm font-semibold text-BlackColor">
              Verified References ({references.length})
            </div>
            <div className="flex flex-col gap-[10px]">
              {references.map((reference) => (
                <div
                  key={reference.request_id}
                  className="flex flex-col gap-[4px] pb-[10px] border-b border-BorderColor-15 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-BlackColor capitalize">
                      {reference.respondent_fullname}
                    </span>
                    {reference.would_hire_again === true && (
                      <span className="text-[10px] px-[6px] py-[1px] rounded-[4px] bg-[#EAF1FB] text-LinkedInBlue font-medium">
                        Would hire again
                      </span>
                    )}
                  </div>
                  {reference.strengths_note && (
                    <div className="text-[11px] text-BlackColor-60 italic">
                      "{reference.strengths_note}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-[10px]">
          <button
            className="btn premium-btn btn-sm !font-normal !shadow-none !w-auto"
            onClick={() => setShowRequestReferenceForm((prev) => !prev)}
          >
            Request Reference
          </button>
          {showClaimButton  && (
            <button
              className="btn premium-btn  btn-sm !font-normal !shadow-none !w-auto"
              onClick={handleClaimProfile}
              disabled={isClaimButtonDisabled}
            >
              Claim Profile
            </button>
          )}
          {claimProfileInput && (
            <>
              <div className="w-full flex flex-col gap-4">
                <input
                  type="text"
                  className="FromInput !border !border-BorderColor-15"
                  placeholder="Enter code"
                  value={claimProfileInputCode}
                  maxLength={6}
                  onChange={handleChange}
                  // onChange={(e) => setClaimProfileInputCode(e.target.value)}
                />
                <div className="button-group flex gap-3">
                  <button className="btn premium-btn  btn-sm !font-normal !shadow-none" onClick={handleCancelClaim}>
                    Cancel
                  </button>
                  <button className="btn sign-in-btn btn-sm !font-normal !shadow-none" onClick={() => handleSubmitClaim(claimProfileInputCode)}>
                    Submit
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {showRequestReferenceForm && (
          <div className="w-full flex flex-col gap-[10px] p-[12px] border border-BorderColor-15 rounded-[5px]">
            <div className="text-xs text-BlackColor-60">
              Ask someone who already has a ProfileInsight account for a structured reference
              about {linkedInUserDetails.name || "this person"}. They'll see the request the
              next time they open the extension.
            </div>
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
                onClick={() => setShowRequestReferenceForm(false)}
              >
                Cancel
              </button>
              <button
                className="btn sign-in-btn btn-sm !font-normal !shadow-none flex-1"
                onClick={handleRequestReference}
                disabled={submittingReferenceRequest}
              >
                Send Request
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ReviewHeaderMain end  */}

      {/* 
      <div className="flex items-center py-2 hidden">
        <img
          className="w-16 h-16 rounded-full"
          src={linkedInUserDetails.profilePic || "https://placehold.co/100x100"}
          alt="Profile picture"
        />
        <div className="ml-auto flex">
          <button
            className="bg-[#ffbf72] text-black hover:bg-secondary/80 px-4 py-2 rounded"
            onClick={handleShowAddReview}
          >
            Review
          </button>
          <button className="bg-black text-white hover:bg-zinc-800 px-4 py-2 rounded ml-2">
            Follow
          </button>
        </div>
      </div>
      <div className="flex justify-between hidden">
        <div>
          <h2 className="text-lg font-semibold">{linkedInUserDetails.name}</h2>
          <p className="text-muted">{linkedInUserDetails.location}</p>
        </div>
        <div className="flex items-center">
          <div>
            <span className="text-2xl font-bold">5.0</span>
          </div>
          <div>
            <div className="text-muted ml-2">★★★★★</div>
            <div className="text-muted ml-2">0 Ratings</div>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground mt-2 hidden">
        {linkedInUserDetails.headline}
      </p> */}
    </>
  );
}


export default  ReviewHeader