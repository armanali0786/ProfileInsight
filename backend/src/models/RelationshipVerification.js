const mongoose = require('mongoose');

// Created automatically when a review is submitted for a profile that has already been
// claimed (see routes/reviews.js#submit_review) -- lets the claimed profile owner confirm
// or deny that the reviewer actually had the relationship they described, which is what
// flips Review.verification_status from 'pending' to 'verified' (or back to 'unverified').
const relationshipVerificationSchema = new mongoose.Schema(
  {
    review_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    profile_id: { type: String, required: true },
    reviewee_contact_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
    reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'denied'], default: 'pending' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('RelationshipVerification', relationshipVerificationSchema);
