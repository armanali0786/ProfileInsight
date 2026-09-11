const mongoose = require('mongoose');
const { CATEGORY_KEYS, RELATIONSHIP_TYPES, RELATIONSHIP_DURATIONS } = require('../utils/categories');

const categoryRatingsSchema = new mongoose.Schema(
  Object.fromEntries(CATEGORY_KEYS.map((key) => [key, { type: Number, min: 1, max: 5 }])),
  { _id: false }
);

// Phase 3 "reference check" flow: someone (usually the candidate themselves, viewing their
// own claimed profile) requests a structured reference from another ProfileInsight user about
// a candidate's profile. Only claimed profiles can be asked -- there's no real email delivery
// here (matching the existing ClaimRequest pattern), so the recipient must already have an
// account to see and answer the request from their own Reference Requests page.
const referenceRequestSchema = new mongoose.Schema(
  {
    profile_id: { type: String, required: true, index: true }, // the candidate being referenced
    profile_name: { type: String, default: '' },
    requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    recipient_contact_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
    recipient_profile_id: { type: String, required: true },
    recipient_name: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'completed', 'declined'], default: 'pending' },
    last_reminded_at: { type: Date, default: null },

    response: {
      category_ratings: { type: categoryRatingsSchema, default: undefined },
      relationship_type: { type: String, enum: RELATIONSHIP_TYPES, default: undefined },
      relationship_duration: { type: String, enum: RELATIONSHIP_DURATIONS, default: undefined },
      strengths_note: { type: String, default: '' },
      next_manager_note: { type: String, default: '' },
      would_hire_again: { type: Boolean, default: undefined },
      submitted_at: { type: Date, default: undefined },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('ReferenceRequest', referenceRequestSchema);
