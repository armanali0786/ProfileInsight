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
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Profile', profileSchema);
