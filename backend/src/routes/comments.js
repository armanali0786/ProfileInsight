const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Review = require('../models/Review');
const { commentDTO } = require('../utils/dto');

const router = express.Router();
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /admin/reviews/comments/save_comment
router.post('/save_comment', async (req, res) => {
  const { task_review_id, task_reviewer_id, contact_id, profile_id, description, is_anon, rel_type } = req.body;

  if (!isValidId(task_review_id) || !isValidId(contact_id)) {
    return res.status(400).json({ message: 'task_review_id and contact_id are required.' });
  }

  const comment = await Comment.create({
    review_id: task_review_id,
    reviewer_id: isValidId(task_reviewer_id) ? task_reviewer_id : undefined,
    commenter_id: contact_id,
    profile_id,
    description,
    is_anon: is_anon === '1' || is_anon === 1 || is_anon === true,
    rel_type: rel_type || 'review',
  });
  await comment.populate('commenter_id');

  res.status(200).json({ data: commentDTO(comment, contact_id) });
});

// POST /admin/reviews/comments/update_comment
router.post('/update_comment', async (req, res) => {
  const { comment_id, contact_id, description, is_anon } = req.body;

  if (!isValidId(comment_id)) return res.status(404).json({ message: 'Comment not found.' });

  const comment = await Comment.findById(comment_id);
  if (!comment) return res.status(404).json({ message: 'Comment not found.' });
  if (String(comment.commenter_id) !== String(contact_id)) {
    return res.status(403).json({ message: 'You are not authorized to edit this comment.' });
  }

  comment.description = description ?? comment.description;
  if (is_anon !== undefined) comment.is_anon = is_anon === '1' || is_anon === 1 || is_anon === true;
  await comment.save();
  await comment.populate('commenter_id');

  res.status(200).json({ data: commentDTO(comment, contact_id) });
});

// POST /admin/reviews/comments/delete_comment
router.post('/delete_comment', async (req, res) => {
  const { comment_id, contact_id } = req.body;

  if (!isValidId(comment_id)) return res.status(403).json({ message: 'Not authorized.' });

  const comment = await Comment.findById(comment_id);
  if (!comment) return res.status(403).json({ message: 'Not authorized.' });

  const review = await Review.findById(comment.review_id);
  const isAuthorized =
    String(comment.commenter_id) === String(contact_id) ||
    (review && String(review.reviewer_id) === String(contact_id));

  if (!isAuthorized) return res.status(403).json({ message: 'Not authorized.' });

  await comment.deleteOne();
  res.status(200).json({ message: 'Comment deleted.' });
});

// POST /admin/reviews/comments/like_comment
router.post('/like_comment', async (req, res) => {
  const { comment_id, contact_id } = req.body;
  if (!isValidId(comment_id) || !isValidId(contact_id)) {
    return res.status(404).json({ message: 'Comment not found.' });
  }

  const comment = await Comment.findById(comment_id);
  if (!comment) return res.status(404).json({ message: 'Comment not found.' });

  const alreadyLiked = comment.liked_by.some((id) => String(id) === String(contact_id));
  if (alreadyLiked) {
    comment.liked_by = comment.liked_by.filter((id) => String(id) !== String(contact_id));
  } else {
    comment.liked_by.push(contact_id);
  }
  await comment.save();

  res.status(200).json({ data: { is_liked: !alreadyLiked } });
});

module.exports = router;
