const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    linkedin_sub: { type: String, unique: true, sparse: true },
    email: { type: String },
    firstname: { type: String, default: '' },
    lastname: { type: String, default: '' },
    given_name: { type: String, default: '' },
    family_name: { type: String, default: '' },
    locale: { type: String, default: '' },
    email_verified: { type: Boolean, default: false },
    picture: { type: String, default: '' },
    profile_image: { type: String, default: null },
    account_status: { type: Number, default: 1 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Contact', contactSchema);
