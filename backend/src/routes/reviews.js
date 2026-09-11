const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Review = require('../models/Review');
const Comment = require('../models/Comment');
const Profile = require('../models/Profile');
const ClaimRequest = require('../models/ClaimRequest');
const Contact = require('../models/Contact');
const RelationshipVerification = require('../models/RelationshipVerification');
const ReferenceRequest = require('../models/ReferenceRequest');
const Block = require('../models/Block');
const ReviewReport = require('../models/ReviewReport');
const { REPORT_REASONS } = require('../models/ReviewReport');
const { reviewDTO, verificationDTO } = require('../utils/dto');
const { computeExtras, computeSummaryConfidence } = require('../utils/extras');
const { CATEGORY_KEYS, RELATIONSHIP_TYPES, RELATIONSHIP_DURATIONS, parseCategoryRatings } = require('../utils/categories');
const { summarizeReputation } = require('../utils/groq');

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const isTruthy = (value) => value === '1' || value === 1 || value === true || value === 'true';
const MIN_REVIEWS_FOR_AI_SUMMARY = 3;
const AI_SUMMARY_TTL_MS = 24 * 60 * 60 * 1000; // re-check a summary at most once a day even if the review count hasn't moved
const REVIEW_RATE_LIMIT = 10; // max reviews a single contact can submit within RATE_LIMIT_WINDOW_MS
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour -- blunt but enough to stop review-bombing scripts
const AUTO_HIDE_REPORT_THRESHOLD = 3; // reports before a review is auto-hidden pending manual review

// Phase 5: reviews from someone the profile owner has blocked disappear from the list for
// everyone, and a moderation-hidden review (see /report) is hidden from everyone but its author.
async function filterModeratedReviews(reviews, profileId, viewerContactId) {
  const profile = await Profile.findOne({ profile_id: profileId }).select('claimed_by');
  let blockedReviewerIds = new Set();
  if (profile?.claimed_by) {
    const blocks = await Block.find({ blocker_id: profile.claimed_by }).select('blocked_id');
    blockedReviewerIds = new Set(blocks.map((b) => String(b.blocked_id)));
  }

  return reviews.filter((review) => {
    const reviewerId = String(review.reviewer_id?._id || review.reviewer_id);
    if (blockedReviewerIds.has(reviewerId)) return false;
    if (review.is_hidden && (!viewerContactId || reviewerId !== String(viewerContactId))) return false;
    return true;
  });
}

// Phase 4 "My Reputation" privacy control: a claimed profile's owner can restrict who sees
// reviews about them. The owner always sees everything about their own profile.
// Known gap: for the 'verified' tier this filters the review list a non-owner sees, but
// computeExtras()'s aggregate stats (avg rating/count) still run against all reviews in the
// DB, so the summary numbers can include unverified reviews even though their text is hidden.
// Fully fixing that means threading a verification filter through computeExtras' aggregation.
async function applyReviewVisibility(reviews, profileId, viewerContactId) {
  const profile = await Profile.findOne({ profile_id: profileId });
  if (!profile || !profile.claimed_by) return { reviews, restricted: false };
  if (viewerContactId && String(profile.claimed_by) === String(viewerContactId)) {
    return { reviews, restricted: false };
  }

  const owner = await Contact.findById(profile.claimed_by).select('review_visibility');
  const visibility = owner?.review_visibility || 'everyone';

  if (visibility === 'private') {
    return { reviews: [], restricted: true };
  }
  if (visibility === 'verified') {
    return { reviews: reviews.filter((r) => r.verification_status === 'verified'), restricted: false };
  }
  return { reviews, restricted: false };
}

async function attachReviewerReviewCounts(reviews) {
  const reviewerIds = [...new Set(reviews.map((r) => String(r.reviewer_id?._id || r.reviewer_id)))];
  const counts = await Review.aggregate([
    { $match: { reviewer_id: { $in: reviewerIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: '$reviewer_id', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return (dto, review) => {
    dto.reviewer_review_count = countMap.get(String(review.reviewer_id?._id || review.reviewer_id)) || 0;
    return dto;
  };
}

// POST /admin/reviews/get_reviews
router.post('/get_reviews', async (req, res) => {
  const { contact_id, profile_id } = req.body;
  if (!profile_id) return res.status(400).json({ message: 'profile_id is required.' });

  const allReviews = await Review.find({ profile_id })
    .populate('reviewer_id')
    .sort({ created_at: -1 });

  const { reviews: visibleReviews, restricted } = await applyReviewVisibility(allReviews, profile_id, contact_id);
  if (restricted) {
    return res.status(200).json({
      data: [],
      restricted: true,
      message: 'This user has made their reviews private.',
      extras: { profile_avg_rating: 0, profile_total_ratings: 0, show_claim_button: 0, show_code_input: 0 },
    });
  }

  const reviews = await filterModeratedReviews(visibleReviews, profile_id, contact_id);

  const comments = await Comment.find({ review_id: { $in: reviews.map((r) => r._id) } })
    .populate('commenter_id');

  const commentsByReview = new Map();
  for (const c of comments) {
    const key = String(c.review_id);
    if (!commentsByReview.has(key)) commentsByReview.set(key, []);
    commentsByReview.get(key).push(c);
  }

  const applyCount = await attachReviewerReviewCounts(reviews);

  const data = reviews.map((review) => {
    const withComments = { ...review.toObject(), comments: commentsByReview.get(String(review._id)) || [] };
    const dto = reviewDTO(withComments, contact_id);
    return applyCount(dto, review);
  });

  const extras = await computeExtras(profile_id, contact_id);
  res.status(200).json({ data, extras });
});

// POST /admin/reviews/my_reviews -- reviews the logged-in contact has written, across all profiles
router.post('/my_reviews', async (req, res) => {
  const { contact_id } = req.body;
  if (!isValidId(contact_id)) return res.status(400).json({ message: 'contact_id is required.' });

  const reviews = await Review.find({ reviewer_id: contact_id })
    .populate('reviewer_id')
    .sort({ created_at: -1 });

  const applyCount = await attachReviewerReviewCounts(reviews);
  const data = reviews.map((review) => {
    const dto = reviewDTO({ ...review.toObject(), comments: [] }, contact_id);
    return applyCount(dto, review);
  });

  res.status(200).json({ data });
});

// POST /admin/reviews/submit_review
router.post('/submit_review', async (req, res) => {
  const {
    contact_id,
    profile_id,
    description,
    is_anon,
    rating,
    profile_name,
    relationship_type,
    relationship_duration,
    category_ratings,
    would_work_again,
    standout_strength,
  } = req.body;

  if (!isValidId(contact_id)) return res.status(400).json({ message: 'contact_id is required.' });

  const existing = await Review.findOne({ profile_id, reviewer_id: contact_id });
  if (existing) {
    return res.status(409).json({ message: 'You have already reviewed this profile.' });
  }

  // Phase 5: a blunt rate limit -- stops a compromised or scripted account from mass-submitting
  // reviews faster than any real person reviewing coworkers could.
  const recentReviewCount = await Review.countDocuments({
    reviewer_id: contact_id,
    created_at: { $gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
  });
  if (recentReviewCount >= REVIEW_RATE_LIMIT) {
    return res.status(429).json({ message: 'You are submitting reviews too quickly. Please try again later.' });
  }

  const profile = await Profile.findOneAndUpdate(
    { profile_id },
    { $setOnInsert: { profile_name: profile_name || '' } },
    { upsert: true, new: true }
  );

  if (profile.claimed_by) {
    const blocked = await Block.findOne({ blocker_id: profile.claimed_by, blocked_id: contact_id });
    if (blocked) {
      return res.status(403).json({ message: 'You are not able to review this profile.' });
    }
  }

  const parsedCategories = parseCategoryRatings(category_ratings);
  const overallRating = parsedCategories ? parsedCategories.average : Number(rating);

  const review = await Review.create({
    profile_id,
    profile_name,
    reviewer_id: contact_id,
    description,
    rating: overallRating,
    is_anon: isTruthy(is_anon),
    category_ratings: parsedCategories ? parsedCategories.categories : undefined,
    relationship_type: RELATIONSHIP_TYPES.includes(relationship_type) ? relationship_type : 'other',
    relationship_duration: RELATIONSHIP_DURATIONS.includes(relationship_duration) ? relationship_duration : undefined,
    would_work_again: would_work_again === undefined ? undefined : isTruthy(would_work_again),
    standout_strength: standout_strength || '',
  });

  // A claimed profile's owner gets a chance to confirm the reviewer's claimed relationship --
  // see verifications/pending and verifications/respond below.
  if (profile.claimed_by && String(profile.claimed_by) !== String(contact_id)) {
    await RelationshipVerification.create({
      review_id: review._id,
      profile_id,
      reviewee_contact_id: profile.claimed_by,
      reviewer_id: contact_id,
      status: 'pending',
    });
    review.verification_status = 'pending';
    await review.save();
  }

  await review.populate('reviewer_id');
  const reviewerCount = await Review.countDocuments({ reviewer_id: contact_id });
  const dto = reviewDTO({ ...review.toObject(), comments: [] }, contact_id);
  dto.reviewer_review_count = reviewerCount;

  const extra = await computeExtras(profile_id, contact_id);
  res.status(200).json({ data: dto, message: 'Review submitted successfully.', extra });
});

// POST /admin/reviews/update_review
router.post('/update_review', async (req, res) => {
  const {
    contact_id,
    review_id,
    description,
    rating,
    is_anon,
    relationship_type,
    relationship_duration,
    category_ratings,
    would_work_again,
    standout_strength,
  } = req.body;

  if (!isValidId(review_id)) return res.status(404).json({ message: 'Review not found.' });

  const review = await Review.findById(review_id);
  if (!review) return res.status(404).json({ message: 'Review not found.' });
  if (String(review.reviewer_id) !== String(contact_id)) {
    return res.status(403).json({ message: 'You are not authorized to edit this review.' });
  }

  const parsedCategories = parseCategoryRatings(category_ratings);

  review.description = description ?? review.description;
  review.rating = parsedCategories ? parsedCategories.average : rating ?? review.rating;
  if (parsedCategories) review.category_ratings = parsedCategories.categories;
  if (is_anon !== undefined) review.is_anon = isTruthy(is_anon);
  if (RELATIONSHIP_TYPES.includes(relationship_type)) review.relationship_type = relationship_type;
  if (RELATIONSHIP_DURATIONS.includes(relationship_duration)) review.relationship_duration = relationship_duration;
  if (would_work_again !== undefined) review.would_work_again = isTruthy(would_work_again);
  if (standout_strength !== undefined) review.standout_strength = standout_strength;
  await review.save();
  await review.populate('reviewer_id');

  const comments = await Comment.find({ review_id: review._id }).populate('commenter_id');
  const reviewerCount = await Review.countDocuments({ reviewer_id: review.reviewer_id });
  const dto = reviewDTO({ ...review.toObject(), comments }, contact_id);
  dto.reviewer_review_count = reviewerCount;

  const extra = await computeExtras(review.profile_id, contact_id);
  res.status(200).json({ data: dto, message: 'Review updated successfully.', extra });
});

// POST /admin/reviews/delete_review
router.post('/delete_review', async (req, res) => {
  const { contact_id, review_id, profile_id } = req.body;

  if (!isValidId(review_id)) {
    return res.status(403).json({ message: 'You are not authorized to delete this review or review does not exist.' });
  }

  const review = await Review.findById(review_id);
  if (!review || String(review.reviewer_id) !== String(contact_id)) {
    return res.status(403).json({ message: 'You are not authorized to delete this review or review does not exist.' });
  }

  await Comment.deleteMany({ review_id: review._id });
  await review.deleteOne();

  const extra = await computeExtras(profile_id || review.profile_id, contact_id);
  res.status(200).json({ extra, message: 'Review deleted successfully.' });
});

// POST /admin/reviews/like_review
router.post('/like_review', async (req, res) => {
  const { review_id, contact_id } = req.body;
  if (!isValidId(review_id) || !isValidId(contact_id)) {
    return res.status(404).json({ message: 'Review not found.' });
  }

  const review = await Review.findById(review_id);
  if (!review) return res.status(404).json({ message: 'Review not found.' });

  const alreadyLiked = review.liked_by.some((id) => String(id) === String(contact_id));
  if (alreadyLiked) {
    review.liked_by = review.liked_by.filter((id) => String(id) !== String(contact_id));
  } else {
    review.liked_by.push(contact_id);
  }
  await review.save();

  res.status(200).json({ data: { is_liked: !alreadyLiked } });
});

// POST /admin/reviews/get_profile_public_data
router.post('/get_profile_public_data', async (req, res) => {
  const { contact_id } = req.body;
  if (!isValidId(contact_id)) {
    return res.status(200).json({ data: { reviewer_total_review_count: 0 } });
  }
  const count = await Review.countDocuments({ reviewer_id: contact_id });
  res.status(200).json({ data: { reviewer_total_review_count: count } });
});

// POST /admin/reviews/claim_profile
router.post('/claim_profile', async (req, res) => {
  const { contact_id, profile_id, profile_name } = req.body;
  if (!isValidId(contact_id)) return res.status(400).json({ message: 'contact_id is required.' });

  const profile = await Profile.findOneAndUpdate(
    { profile_id },
    { $setOnInsert: { profile_name: profile_name || '' } },
    { upsert: true, new: true }
  );

  if (profile.claimed_by) {
    return res.status(409).json({ message: 'This profile has already been claimed.' });
  }

  const code = String(crypto.randomInt(100000, 999999));
  const claimRequest = await ClaimRequest.create({ profile_id, contact_id, code, status: 'pending' });

  // No email/SMS integration locally -- log the code so it can be used to test confirm_claim_request.
  console.log(`[claim_profile] profile_id=${profile_id} contact_id=${contact_id} code=${code}`);

  res.status(200).json({
    message: 'Claim request created. Check your code.',
    data: { request_id: String(claimRequest._id) },
  });
});

// POST /admin/reviews/cancel_claim_request
router.post('/cancel_claim_request', async (req, res) => {
  const { contact_id, profile_id, request_id } = req.body;

  const query = isValidId(request_id)
    ? { _id: request_id }
    : { profile_id, contact_id, status: 'pending' };

  await ClaimRequest.findOneAndUpdate(query, { status: 'cancelled' });
  res.status(200).json({ message: 'Claim request cancelled.' });
});

// POST /admin/reviews/confirm_claim_request
router.post('/confirm_claim_request', async (req, res) => {
  const { contact_id, profile_id, code, request_id } = req.body;

  const query = isValidId(request_id)
    ? { _id: request_id, status: 'pending' }
    : { profile_id, contact_id, status: 'pending' };

  const claimRequest = await ClaimRequest.findOne(query);
  if (!claimRequest) {
    return res.status(404).json({ message: 'Claim request not found.' });
  }
  if (claimRequest.code !== code) {
    return res.status(409).json({ message: 'Invalid claim code.' });
  }

  claimRequest.status = 'confirmed';
  await claimRequest.save();
  await Profile.findOneAndUpdate({ profile_id: claimRequest.profile_id }, { claimed_by: claimRequest.contact_id });

  res.status(200).json({ message: 'Profile claimed successfully.' });
});

// POST /admin/reviews/verifications/pending -- relationship-confirmation requests waiting
// on the logged-in contact, i.e. reviews written about a profile they've claimed as their own.
router.post('/verifications/pending', async (req, res) => {
  const { contact_id } = req.body;
  if (!isValidId(contact_id)) return res.status(400).json({ message: 'contact_id is required.' });

  const verifications = await RelationshipVerification.find({ reviewee_contact_id: contact_id, status: 'pending' })
    .populate({ path: 'review_id', populate: { path: 'reviewer_id' } })
    .sort({ created_at: -1 });

  const data = verifications.filter((v) => v.review_id).map((v) => verificationDTO(v));
  res.status(200).json({ data });
});

// POST /admin/reviews/verifications/respond -- the reviewee confirms or denies that the
// relationship described in a review actually happened, flipping Review.verification_status.
router.post('/verifications/respond', async (req, res) => {
  const { contact_id, verification_id, action } = req.body;
  if (!isValidId(verification_id) || !['confirm', 'deny'].includes(action)) {
    return res.status(400).json({ message: 'A valid verification_id and action are required.' });
  }

  const verification = await RelationshipVerification.findById(verification_id);
  if (!verification || String(verification.reviewee_contact_id) !== String(contact_id)) {
    return res.status(403).json({ message: 'You are not authorized to respond to this verification request.' });
  }
  if (verification.status !== 'pending') {
    return res.status(409).json({ message: 'This verification request has already been resolved.' });
  }

  verification.status = action === 'confirm' ? 'confirmed' : 'denied';
  await verification.save();

  await Review.findByIdAndUpdate(verification.review_id, {
    verification_status: action === 'confirm' ? 'verified' : 'unverified',
  });

  res.status(200).json({
    message: action === 'confirm' ? 'Relationship confirmed.' : 'Verification request denied.',
    data: { verification_id: String(verification._id), status: verification.status },
  });
});

// POST /admin/reviews/reputation_summary -- an AI-compressed reputation summary for a profile
// (Phase 2). Cached on Profile and only regenerated when the review count changes or the
// cache goes stale, so this never triggers a Groq call on every page view. Confidence is
// computed deterministically (see computeSummaryConfidence), not left to the LLM to guess.
router.post('/reputation_summary', async (req, res) => {
  const { profile_id } = req.body;
  if (!profile_id) return res.status(400).json({ message: 'profile_id is required.' });

  const reviews = await Review.find({ profile_id })
    .select('description standout_strength relationship_type verification_status')
    .lean();

  const totalReviews = reviews.length;
  if (totalReviews < MIN_REVIEWS_FOR_AI_SUMMARY) {
    return res.status(200).json({ data: null, message: 'Not enough reviews yet for an AI summary.' });
  }

  const verifiedCount = reviews.filter((r) => r.verification_status === 'verified').length;
  const confidence = computeSummaryConfidence(totalReviews, verifiedCount);

  let profile = await Profile.findOne({ profile_id });
  const isStale =
    !profile?.ai_summary ||
    profile.ai_summary_review_count !== totalReviews ||
    !profile.ai_summary_generated_at ||
    Date.now() - new Date(profile.ai_summary_generated_at).getTime() > AI_SUMMARY_TTL_MS;

  if (isStale) {
    try {
      const { summary, strengths, concerns } = await summarizeReputation(reviews);
      profile = await Profile.findOneAndUpdate(
        { profile_id },
        {
          $set: {
            ai_summary: summary,
            ai_summary_strengths: strengths,
            ai_summary_concerns: concerns,
            ai_summary_confidence: confidence,
            ai_summary_review_count: totalReviews,
            ai_summary_generated_at: new Date(),
          },
          $setOnInsert: { profile_id },
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error('AI reputation summary failed:', err.message);
      if (!profile?.ai_summary) {
        return res.status(502).json({ message: 'Failed to generate AI summary.' });
      }
      // Serve the last good cached summary rather than fail the request outright.
    }
  }

  res.status(200).json({
    data: {
      summary: profile.ai_summary,
      strengths: profile.ai_summary_strengths,
      concerns: profile.ai_summary_concerns,
      confidence: profile.ai_summary_confidence || confidence,
      based_on: totalReviews,
      verified_relationships: verifiedCount,
      generated_at: profile.ai_summary_generated_at,
    },
  });
});

// POST /admin/reviews/dashboard -- the recruiter dashboard's candidate list (Phase 3): every
// profile the logged-in contact has reviewed, with an at-a-glance hiring signal derived from
// rating + verification, not just a raw star average.
router.post('/dashboard', async (req, res) => {
  const { contact_id } = req.body;
  if (!isValidId(contact_id)) return res.status(400).json({ message: 'contact_id is required.' });

  const myProfileIds = await Review.distinct('profile_id', { reviewer_id: contact_id });
  if (myProfileIds.length === 0) return res.status(200).json({ data: [] });

  const [stats, referenceCounts, profiles] = await Promise.all([
    Review.aggregate([
      { $match: { profile_id: { $in: myProfileIds } } },
      {
        $group: {
          _id: '$profile_id',
          avg: { $avg: '$rating' },
          total: { $sum: 1 },
          verified: { $sum: { $cond: [{ $eq: ['$verification_status', 'verified'] }, 1, 0] } },
        },
      },
    ]),
    ReferenceRequest.aggregate([
      { $match: { profile_id: { $in: myProfileIds }, status: 'completed' } },
      { $group: { _id: '$profile_id', count: { $sum: 1 } } },
    ]),
    Profile.find({ profile_id: { $in: myProfileIds } }),
  ]);

  const statsMap = new Map(stats.map((s) => [s._id, s]));
  const referenceMap = new Map(referenceCounts.map((r) => [r._id, r.count]));
  const profileMap = new Map(profiles.map((p) => [p.profile_id, p]));

  const data = myProfileIds.map((profileId) => {
    const stat = statsMap.get(profileId);
    const profile = profileMap.get(profileId);
    const avgRating = stat ? Math.round(stat.avg * 10) / 10 : 0;

    let signal = 'no_data';
    if (stat) {
      if (avgRating >= 4.5) signal = 'strong';
      else if (avgRating >= 3.5) signal = 'good';
      else signal = 'review';
    }

    return {
      profile_id: profileId,
      profile_name: profile?.profile_name || profileId,
      profile_image: profile?.profile_image || '',
      headline: profile?.headline || '',
      avg_rating: avgRating,
      total_reviews: stat ? stat.total : 0,
      verified_count: stat ? stat.verified : 0,
      reference_count: referenceMap.get(profileId) || 0,
      signal,
    };
  });

  data.sort((a, b) => b.avg_rating - a.avg_rating);
  res.status(200).json({ data });
});

// POST /admin/reviews/my_reputation -- Screen 6 "My Reputation": the logged-in contact's own
// reputation snapshot, for whichever LinkedIn profile they've claimed as themselves.
router.post('/my_reputation', async (req, res) => {
  const { contact_id } = req.body;
  if (!isValidId(contact_id)) return res.status(400).json({ message: 'contact_id is required.' });

  const profile = await Profile.findOne({ claimed_by: contact_id });
  if (!profile) {
    return res.status(200).json({ data: null, message: 'Claim your LinkedIn profile to see your reputation.' });
  }

  const extras = await computeExtras(profile.profile_id, contact_id);
  res.status(200).json({
    data: {
      profile_id: profile.profile_id,
      profile_name: profile.profile_name,
      profile_image: profile.profile_image,
      ...extras,
    },
  });
});

// POST /admin/reviews/report -- Phase 5 review quality control. Auto-hides a review once it
// collects AUTO_HIDE_REPORT_THRESHOLD distinct reports, pending manual review.
router.post('/report', async (req, res) => {
  const { contact_id, review_id, reason, note } = req.body;
  if (!isValidId(contact_id) || !isValidId(review_id)) {
    return res.status(400).json({ message: 'contact_id and review_id are required.' });
  }
  if (!REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: 'A valid reason is required.' });
  }

  const review = await Review.findById(review_id);
  if (!review) return res.status(404).json({ message: 'Review not found.' });
  if (String(review.reviewer_id) === String(contact_id)) {
    return res.status(400).json({ message: 'You cannot report your own review.' });
  }

  try {
    await ReviewReport.create({ review_id, reporter_id: contact_id, reason, note: note || '' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already reported this review.' });
    }
    throw err;
  }

  review.report_count = (review.report_count || 0) + 1;
  if (review.report_count >= AUTO_HIDE_REPORT_THRESHOLD) {
    review.is_hidden = true;
  }
  await review.save();

  res.status(200).json({ message: 'Thanks -- this review has been reported for moderation.' });
});

// POST /admin/reviews/respond_to_review -- lets a claimed profile's owner publicly respond to
// a review about them (Screen "Respond" feature from the product brief).
router.post('/respond_to_review', async (req, res) => {
  const { contact_id, review_id, response_text } = req.body;
  if (!isValidId(contact_id) || !isValidId(review_id)) {
    return res.status(400).json({ message: 'contact_id and review_id are required.' });
  }
  const trimmed = String(response_text || '').trim();
  if (!trimmed) {
    return res.status(400).json({ message: 'A response is required.' });
  }

  const review = await Review.findById(review_id);
  if (!review) return res.status(404).json({ message: 'Review not found.' });

  const profile = await Profile.findOne({ profile_id: review.profile_id });
  if (!profile || String(profile.claimed_by) !== String(contact_id)) {
    return res.status(403).json({ message: 'You are not authorized to respond to this review.' });
  }

  review.owner_response = { text: trimmed, responded_at: new Date() };
  await review.save();

  res.status(200).json({
    message: 'Response posted.',
    data: { review_id: String(review._id), owner_response: review.owner_response },
  });
});

module.exports = router;
