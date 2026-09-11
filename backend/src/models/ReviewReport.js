const mongoose = require('mongoose');

const REPORT_REASONS = ['harassment', 'fake', 'spam', 'conflict_of_interest', 'other'];

const reviewReportSchema = new mongoose.Schema(
  {
    review_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// One report per reporter per review -- prevents a single account from inflating report_count.
reviewReportSchema.index({ review_id: 1, reporter_id: 1 }, { unique: true });

module.exports = mongoose.model('ReviewReport', reviewReportSchema);
module.exports.REPORT_REASONS = REPORT_REASONS;
