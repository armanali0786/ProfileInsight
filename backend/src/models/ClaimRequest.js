const mongoose = require('mongoose');

const claimRequestSchema = new mongoose.Schema(
  {
    profile_id: { type: String, required: true },
    contact_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    code: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('ClaimRequest', claimRequestSchema);
