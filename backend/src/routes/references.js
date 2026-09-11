const express = require('express');
const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const ReferenceRequest = require('../models/ReferenceRequest');
const { referenceRequestDTO, referenceResponseDTO } = require('../utils/dto');
const { RELATIONSHIP_TYPES, RELATIONSHIP_DURATIONS, parseCategoryRatings } = require('../utils/categories');

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const isTruthy = (value) => value === '1' || value === 1 || value === true || value === 'true';

const extractProfileId = (value) => {
  const match = String(value || '').match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : String(value || '').trim();
};

// POST /admin/references/request -- ask another ProfileInsight user for a structured
// reference about a candidate profile. Only works if the recipient has already claimed
// their own profile (there's no real email delivery here, same constraint as claim_profile).
router.post('/request', async (req, res) => {
  const { contact_id, profile_id, profile_name, recipient_profile_url, recipient_name } = req.body;
  if (!isValidId(contact_id)) return res.status(400).json({ message: 'contact_id is required.' });
  if (!profile_id) return res.status(400).json({ message: 'profile_id is required.' });

  const recipientProfileId = extractProfileId(recipient_profile_url);
  if (!recipientProfileId) {
    return res.status(400).json({ message: 'A valid LinkedIn profile URL is required.' });
  }
  if (recipientProfileId === profile_id) {
    return res.status(400).json({ message: "You can't request a reference from the candidate's own profile." });
  }

  const recipientProfile = await Profile.findOne({ profile_id: recipientProfileId });
  if (!recipientProfile || !recipientProfile.claimed_by) {
    return res.status(400).json({
      message: "This person hasn't claimed their ProfileInsight profile yet, so they can't receive the request.",
    });
  }

  const existing = await ReferenceRequest.findOne({
    profile_id,
    recipient_contact_id: recipientProfile.claimed_by,
    status: 'pending',
  });
  if (existing) {
    return res.status(409).json({ message: 'A reference request is already pending with this person.' });
  }

  const request = await ReferenceRequest.create({
    profile_id,
    profile_name: profile_name || '',
    requested_by: contact_id,
    recipient_contact_id: recipientProfile.claimed_by,
    recipient_profile_id: recipientProfileId,
    recipient_name: recipient_name || '',
  });

  res.status(200).json({
    message: 'Reference request sent.',
    data: { request_id: String(request._id) },
  });
});

// POST /admin/references/pending -- reference requests waiting on the logged-in contact to answer.
router.post('/pending', async (req, res) => {
  const { contact_id } = req.body;
  if (!isValidId(contact_id)) return res.status(400).json({ message: 'contact_id is required.' });

  const requests = await ReferenceRequest.find({ recipient_contact_id: contact_id, status: 'pending' })
    .populate('requested_by')
    .sort({ created_at: -1 });

  res.status(200).json({ data: requests.map((r) => referenceRequestDTO(r)) });
});

// POST /admin/references/respond -- the recipient submits (or declines) their structured reference.
router.post('/respond', async (req, res) => {
  const {
    contact_id,
    request_id,
    action,
    category_ratings,
    relationship_type,
    relationship_duration,
    strengths_note,
    next_manager_note,
    would_hire_again,
  } = req.body;

  if (!isValidId(request_id) || !['submit', 'decline'].includes(action)) {
    return res.status(400).json({ message: 'A valid request_id and action are required.' });
  }

  const request = await ReferenceRequest.findById(request_id);
  if (!request || String(request.recipient_contact_id) !== String(contact_id)) {
    return res.status(403).json({ message: 'You are not authorized to respond to this request.' });
  }
  if (request.status !== 'pending') {
    return res.status(409).json({ message: 'This reference request has already been resolved.' });
  }

  if (action === 'decline') {
    request.status = 'declined';
    await request.save();
    return res.status(200).json({ message: 'Reference request declined.' });
  }

  const parsedCategories = parseCategoryRatings(category_ratings);
  if (!parsedCategories) {
    return res.status(400).json({ message: 'Please rate at least one category.' });
  }

  request.response = {
    category_ratings: parsedCategories.categories,
    relationship_type: RELATIONSHIP_TYPES.includes(relationship_type) ? relationship_type : 'other',
    relationship_duration: RELATIONSHIP_DURATIONS.includes(relationship_duration) ? relationship_duration : undefined,
    strengths_note: strengths_note || '',
    next_manager_note: next_manager_note || '',
    would_hire_again: would_hire_again === undefined ? undefined : isTruthy(would_hire_again),
    submitted_at: new Date(),
  };
  request.status = 'completed';
  await request.save();

  res.status(200).json({ message: 'Reference submitted. Thank you!' });
});

// POST /admin/references/for_profile -- completed reference responses for a candidate profile.
router.post('/for_profile', async (req, res) => {
  const { profile_id } = req.body;
  if (!profile_id) return res.status(400).json({ message: 'profile_id is required.' });

  const requests = await ReferenceRequest.find({ profile_id, status: 'completed' })
    .populate('recipient_contact_id')
    .sort({ 'response.submitted_at': -1 });

  res.status(200).json({ data: requests.map((r) => referenceResponseDTO(r.toObject())) });
});

module.exports = router;
