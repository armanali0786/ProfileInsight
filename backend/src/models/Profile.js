const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    profile_id: { type: String, unique: true, required: true },
    profile_name: { type: String, default: '' },
    headline: { type: String, default: '' },
    location: { type: String, default: '' },
    company: { type: String, default: '' },
    profile_image: { type: String, default: '' },
    claimed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null },
    last_synced_at: { type: Date, default: null },

    // Cached AI reputation summary (see routes/reviews.js#reputation_summary) -- regenerated
    // when the review count changes or the cache goes stale, not on every page view.
    ai_summary: { type: String, default: '' },
    ai_summary_strengths: { type: [String], default: [] },
    ai_summary_concerns: { type: [String], default: [] },
    ai_summary_confidence: { type: String, enum: ['low', 'medium', 'high'], default: undefined },
    ai_summary_review_count: { type: Number, default: 0 },
    ai_summary_generated_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Profile', profileSchema);
