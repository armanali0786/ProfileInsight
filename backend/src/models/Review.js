const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    profile_id: { type: String, required: true, index: true },
    profile_name: { type: String, default: '' },
    reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    description: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, required: true },
    is_anon: { type: Boolean, default: false },
    liked_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Review', reviewSchema);
