import React from "react";
import UserProfile from "../../assets/images/user-profile.png";
import { relationshipTypeLabel } from "../../constants/reputation";

// Phase 6 "Relationship Graph": groups a profile's reviewers by relationship type so a
// recruiter can see who's vouching for someone and how, at a glance, instead of a flat list.
export default function RelationshipGraph({ reviews, profileName }) {
  const groups = new Map();
  for (const review of reviews) {
    const key = review.relationship_type || "other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(review);
  }

  const sortedGroups = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  if (sortedGroups.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-[15px] pt-15px">
      <div className="flex flex-col items-center gap-[6px] pb-[15px] border-b border-BorderColor-15">
        <div className="h-10 w-10 rounded-full overflow-hidden">
          <img src={UserProfile} className="object-cover h-full w-full" />
        </div>
        <div className="text-sm font-semibold text-BlackColor capitalize">
          {profileName || "This profile"}
        </div>
      </div>

      <div className="flex flex-col gap-[18px]">
        {sortedGroups.map(([relationshipType, groupReviews]) => {
          const avg =
            Math.round(
              (groupReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / groupReviews.length) * 10
            ) / 10;

          return (
            <div key={relationshipType} className="relative pl-[15px] border-l-2 border-BorderColor-15">
              <div className="flex items-center justify-between mb-[8px]">
                <span className="text-xs font-semibold text-LinkedInBlue">
                  {relationshipTypeLabel(relationshipType)} ({groupReviews.length})
                </span>
                <span className="text-xs text-BlackColor-60">avg {avg}★</span>
              </div>
              <div className="flex flex-col gap-[8px]">
                {groupReviews.map((review) => (
                  <div key={review.review_id} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-BlackColor truncate capitalize">
                      {review.is_anon ? "Anonymous" : review.reviewer_fullname || "A reviewer"}
                    </span>
                    <span className="text-xs text-BlackColor-60 whitespace-nowrap">
                      {review.rating}★{review.verification_status === "verified" ? " ✓" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
