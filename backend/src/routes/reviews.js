const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Review = require('../models/Review');
const Comment = require('../models/Comment');
const Profile = require('../models/Profile');
const ClaimRequest = require('../models/ClaimRequest');
const Contact = require('../models/Contact');
const { reviewDTO } = require('../utils/dto');
const { computeExtras } = require('../utils/extras');

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

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

  const reviews = await Review.find({ profile_id })
    .populate('reviewer_id')
    .sort({ created_at: -1 });

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

// POST /admin/reviews/submit_review
router.post('/submit_review', async (req, res) => {
  const { contact_id, profile_id, description, is_anon, rating, profile_name } = req.body;

  if (!isValidId(contact_id)) return res.status(400).json({ message: 'contact_id is required.' });

  const existing = await Review.findOne({ profile_id, reviewer_id: contact_id });
  if (existing) {
    return res.status(409).json({ message: 'You have already reviewed this profile.' });
  }

  await Profile.findOneAndUpdate(
    { profile_id },
    { $setOnInsert: { profile_name: profile_name || '' } },
    { upsert: true }
  );

  const review = await Review.create({
    profile_id,
    profile_name,
    reviewer_id: contact_id,
    description,
    rating,
    is_anon: is_anon === '1' || is_anon === 1 || is_anon === true,
  });

  await review.populate('reviewer_id');
  const reviewerCount = await Review.countDocuments({ reviewer_id: contact_id });
  const dto = reviewDTO({ ...review.toObject(), comments: [] }, contact_id);
  dto.reviewer_review_count = reviewerCount;

  const extra = await computeExtras(profile_id, contact_id);
  res.status(200).json({ data: dto, message: 'Review submitted successfully.', extra });
});

// POST /admin/reviews/update_review
router.post('/update_review', async (req, res) => {
  const { contact_id, review_id, description, rating, is_anon } = req.body;

  if (!isValidId(review_id)) return res.status(404).json({ message: 'Review not found.' });

  const review = await Review.findById(review_id);
  if (!review) return res.status(404).json({ message: 'Review not found.' });
  if (String(review.reviewer_id) !== String(contact_id)) {
    return res.status(403).json({ message: 'You are not authorized to edit this review.' });
  }

  review.description = description ?? review.description;
  review.rating = rating ?? review.rating;
  if (is_anon !== undefined) review.is_anon = is_anon === '1' || is_anon === 1 || is_anon === true;
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

module.exports = router;
