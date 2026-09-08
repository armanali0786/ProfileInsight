const express = require('express');
const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const { exchangeCodeForToken, fetchUserInfo } = require('../utils/linkedin');
const { contactDTO } = require('../utils/dto');

const router = express.Router();

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

module.exports = router;
