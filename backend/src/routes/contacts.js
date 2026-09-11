const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Contact = require('../models/Contact');
const { exchangeCodeForToken, fetchUserInfo } = require('../utils/linkedin');
const { contactDTO } = require('../utils/dto');

const router = express.Router();
const PROFILE_UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'profile');

// POST /admin/api/contacts/data -- LinkedIn OAuth login/signup exchange
router.post('/data', async (req, res) => {
  const { code, type } = req.body;

  if (!code) {
    return res.status(404).json({ message: 'Data not found.' });
  }

  let userInfo;
  try {
    const accessToken = await exchangeCodeForToken(code);
    userInfo = await fetchUserInfo(accessToken);
  } catch (err) {
    console.error('LinkedIn exchange failed:', err.response?.data || err.message);
    return res.status(500).json({ message: 'LinkedIn login failed.' });
  }

  let contact = await Contact.findOne({ linkedin_sub: userInfo.sub });

  if (type === 'signup') {
    if (contact) {
      return res.status(409).json({ message: 'You are already Registered.' });
    }
    contact = await Contact.create({
      linkedin_sub: userInfo.sub,
      email: userInfo.email,
      firstname: userInfo.given_name,
      lastname: userInfo.family_name,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      locale: typeof userInfo.locale === 'object' ? userInfo.locale?.country : userInfo.locale,
      email_verified: userInfo.email_verified,
      picture: userInfo.picture,
    });
    return res.status(201).json({ data: contactDTO(contact) });
  }

  if (type === 'signin') {
    if (!contact) {
      return res.status(403).json({ message: 'You are not Registered.' });
    }
    return res.status(200).json({ data: contactDTO(contact) });
  }

  // Fallback: no explicit type -- upsert.
  if (!contact) {
    contact = await Contact.create({
      linkedin_sub: userInfo.sub,
      email: userInfo.email,
      firstname: userInfo.given_name,
      lastname: userInfo.family_name,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      email_verified: userInfo.email_verified,
      picture: userInfo.picture,
    });
    return res.status(201).json({ data: contactDTO(contact) });
  }
  return res.status(200).json({ data: contactDTO(contact) });
});

// GET /admin/api/contacts/data/1/:contactId
router.get('/data/1/:contactId', async (req, res) => {
  const { contactId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return res.status(404).json({ message: 'Data not found.' });
  }

  const contact = await Contact.findById(contactId);
  if (!contact) {
    return res.status(404).json({ message: 'Data not found.' });
  }

  // Flat body -- ProfilePage.tsx reads response.data directly, no `data` wrapper.
  res.status(200).json(contactDTO(contact));
});

// POST /admin/api/contacts/update_account_status
router.post('/update_account_status', async (req, res) => {
  const { contact_id, status } = req.body;
  if (!mongoose.Types.ObjectId.isValid(contact_id)) {
    return res.status(404).json({ message: 'Contact not found.' });
  }

  const update = status !== undefined ? { account_status: status } : {};
  const contact = await Contact.findByIdAndUpdate(contact_id, update, { new: true });
  if (!contact) {
    return res.status(404).json({ message: 'Contact not found.' });
  }

  res.status(200).json({ data: contactDTO(contact), message: 'Account status updated.' });
});

// POST /admin/api/contacts/update_profile
router.post('/update_profile', async (req, res) => {
  const { contact_id, firstname, lastname, email } = req.body;
  if (!mongoose.Types.ObjectId.isValid(contact_id)) {
    return res.status(404).json({ message: 'Contact not found.' });
  }

  const trimmedEmail = typeof email === 'string' ? email.trim() : email;
  if (trimmedEmail !== undefined && trimmedEmail !== '') {
    const emailTaken = await Contact.findOne({ email: trimmedEmail, _id: { $ne: contact_id } });
    if (emailTaken) {
      return res.status(409).json({ message: 'That email is already in use by another account.' });
    }
  }

  const update = {};
  if (firstname !== undefined) update.firstname = firstname;
  if (lastname !== undefined) update.lastname = lastname;
  if (trimmedEmail !== undefined && trimmedEmail !== '') update.email = trimmedEmail;

  const contact = await Contact.findByIdAndUpdate(contact_id, update, { new: true });
  if (!contact) {
    return res.status(404).json({ message: 'Contact not found.' });
  }

  res.status(200).json({ data: contactDTO(contact), message: 'Personal information updated.' });
});

// POST /admin/api/contacts/upload_profile_image (multipart field name: "profile_image", max 1MB)
router.post('/upload_profile_image', async (req, res) => {
  const { contact_id } = req.body;
  if (!mongoose.Types.ObjectId.isValid(contact_id)) {
    return res.status(404).json({ message: 'Contact not found.' });
  }

  const file = (req.files || []).find((f) => f.fieldname === 'profile_image');
  if (!file) {
    return res.status(400).json({ message: 'No image file provided.' });
  }

  const contact = await Contact.findById(contact_id);
  if (!contact) {
    fs.unlink(file.path, () => {});
    return res.status(404).json({ message: 'Contact not found.' });
  }

  // Remove the previously uploaded image, if any, so old files don't pile up.
  if (contact.profile_image) {
    fs.unlink(path.join(PROFILE_UPLOADS_DIR, contact.profile_image), () => {});
  }

  contact.profile_image = file.filename;
  await contact.save();

  res.status(200).json({ data: contactDTO(contact), message: 'Profile image updated.' });
});

// POST /admin/api/contacts/update_review_visibility -- Phase 4 "My Reputation" privacy control.
router.post('/update_review_visibility', async (req, res) => {
  const { contact_id, review_visibility } = req.body;
  if (!mongoose.Types.ObjectId.isValid(contact_id)) {
    return res.status(404).json({ message: 'Contact not found.' });
  }
  if (!['everyone', 'verified', 'private'].includes(review_visibility)) {
    return res.status(400).json({ message: 'A valid review_visibility value is required.' });
  }

  const contact = await Contact.findByIdAndUpdate(contact_id, { review_visibility }, { new: true });
  if (!contact) {
    return res.status(404).json({ message: 'Contact not found.' });
  }

  res.status(200).json({ data: contactDTO(contact), message: 'Privacy setting updated.' });
});

module.exports = router;
