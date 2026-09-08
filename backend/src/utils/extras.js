const Review = require('../models/Review');
const Profile = require('../models/Profile');
const ClaimRequest = require('../models/ClaimRequest');

async function computeExtras(profileId, contactId) {
  const [stats] = await Review.aggregate([
    { $match: { profile_id: profileId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, total: { $sum: 1 } } },
  ]);

  const profile = await Profile.findOne({ profile_id: profileId });
  const pendingClaim = contactId
    ? await ClaimRequest.findOne({ profile_id: profileId, contact_id: contactId, status: 'pending' })
    : null;

  return {
    profile_avg_rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    profile_total_ratings: stats ? stats.total : 0,
    show_claim_button: profile && profile.claimed_by ? 0 : 1,
    show_code_input: pendingClaim ? 1 : 0,
    request_id: pendingClaim ? String(pendingClaim._id) : undefined,
  };
}

module.exports = { computeExtras };
