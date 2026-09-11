const mongoose = require('mongoose');

// blocker_id has blocked blocked_id: the blocked contact can no longer submit reviews about
// any profile blocker_id has claimed, and their existing reviews are hidden from that profile's
// review list (see routes/reviews.js#submit_review / #get_reviews).
const blockSchema = new mongoose.Schema(
  {
    blocker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
    blocked_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

blockSchema.index({ blocker_id: 1, blocked_id: 1 }, { unique: true });

module.exports = mongoose.model('Block', blockSchema);
