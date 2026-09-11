const mongoose = require('mongoose');
const { CATEGORY_KEYS, RELATIONSHIP_TYPES, RELATIONSHIP_DURATIONS } = require('../utils/categories');

const categoryRatingsSchema = new mongoose.Schema(
  Object.fromEntries(CATEGORY_KEYS.map((key) => [key, { type: Number, min: 1, max: 5 }])),
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    profile_id: { type: String, required: true, index: true },
    profile_name: { type: String, default: '' },
    reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    description: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, required: true },
    is_anon: { type: Boolean, default: false },
    liked_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],

    // Structured ratings (Phase 1). `rating` above is kept as the overall score -- derived
    // as the average of category_ratings when they're provided -- so existing sort/display
    // code that only knows about `rating` keeps working unchanged.
    category_ratings: { type: categoryRatingsSchema, default: undefined },
    relationship_type: { type: String, enum: RELATIONSHIP_TYPES, default: 'other' },
    relationship_duration: { type: String, enum: RELATIONSHIP_DURATIONS, default: undefined },
    would_work_again: { type: Boolean, default: undefined },
    standout_strength: { type: String, default: '' },

    // Set to 'pending' when the reviewee has a claimed profile (see submit_review), then
    // 'verified'/'unverified' once they respond via RelationshipVerification.
    verification_status: { type: String, enum: ['unverified', 'pending', 'verified'], default: 'unverified' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Review', reviewSchema);
