const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    review_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }, // the review's author (task_reviewer_id)
    commenter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true }, // who wrote the comment
    profile_id: { type: String, default: '' },
    description: { type: String, default: '' },
    is_anon: { type: Boolean, default: false },
    rel_type: { type: String, default: 'review' },
    liked_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Comment', commentSchema);
