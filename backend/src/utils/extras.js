const Review = require('../models/Review');
const Profile = require('../models/Profile');
const ClaimRequest = require('../models/ClaimRequest');
const { CATEGORY_KEYS } = require('./categories');

const round1 = (n) => Math.round(n * 10) / 10;

async function computeExtras(profileId, contactId) {
  const [stats] = await Review.aggregate([
    // Phase 5: a review hidden by moderation (see routes/reviews.js#report) shouldn't drag
    // the average rating -- it's excluded from the reputation math entirely, not just the list.
    { $match: { profile_id: profileId, is_hidden: { $ne: true } } },
    {
      $group: {
        _id: null,
        avg: { $avg: '$rating' },
        total: { $sum: 1 },
        would_work_again_yes: { $sum: { $cond: [{ $eq: ['$would_work_again', true] }, 1, 0] } },
        would_work_again_no: { $sum: { $cond: [{ $eq: ['$would_work_again', false] }, 1, 0] } },
        verified_count: { $sum: { $cond: [{ $eq: ['$verification_status', 'verified'] }, 1, 0] } },
        ...Object.fromEntries(
          CATEGORY_KEYS.map((key) => [`avg_${key}`, { $avg: `$category_ratings.${key}` }])
        ),
      },
    },
  ]);

  const profile = await Profile.findOne({ profile_id: profileId });
  const pendingClaim = contactId
    ? await ClaimRequest.findOne({ profile_id: profileId, contact_id: contactId, status: 'pending' })
    : null;

  const totalWouldWorkAgainVotes = stats ? stats.would_work_again_yes + stats.would_work_again_no : 0;
  const totalReviews = stats ? stats.total : 0;
  const verifiedCount = stats ? stats.verified_count : 0;

  return {
    profile_avg_rating: stats ? round1(stats.avg) : 0,
    profile_total_ratings: totalReviews,
    show_claim_button: profile && profile.claimed_by ? 0 : 1,
    show_code_input: pendingClaim ? 1 : 0,
    request_id: pendingClaim ? String(pendingClaim._id) : undefined,
    is_owner: Boolean(profile && contactId && String(profile.claimed_by) === String(contactId)),
    reputation: {
      category_averages: Object.fromEntries(
        CATEGORY_KEYS.map((key) => [
          key,
          stats && stats[`avg_${key}`] != null ? round1(stats[`avg_${key}`]) : null,
        ])
      ),
      would_work_again_pct: totalWouldWorkAgainVotes
        ? Math.round((stats.would_work_again_yes / totalWouldWorkAgainVotes) * 100)
        : null,
      verified_count: verifiedCount,
      unverified_count: totalReviews - verifiedCount,
      total_reviews: totalReviews,
    },
  };
}

// Confidence for the AI reputation summary is deliberately computed here, not guessed by the
// LLM -- it's just "how much signal backs this up", so it stays trustworthy and explainable.
function computeSummaryConfidence(totalReviews, verifiedCount) {
  if (totalReviews < 3) return 'low';
  const verifiedRatio = totalReviews ? verifiedCount / totalReviews : 0;
  if (totalReviews >= 8 && verifiedRatio >= 0.4) return 'high';
  return 'medium';
}

module.exports = { computeExtras, computeSummaryConfidence };
