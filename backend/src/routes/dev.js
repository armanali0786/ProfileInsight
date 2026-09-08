const express = require('express');
const Contact = require('../models/Contact');
const { contactDTO } = require('../utils/dto');

const router = express.Router();

// Dev-only: create a Contact directly, bypassing the real LinkedIn OAuth exchange.
// Lets you test reviews/comments/claim flows locally without a LinkedIn client secret.
router.post('/seed-contact', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).end();
  }

  const { email = `dev-${Date.now()}@example.com`, firstname = 'Dev', lastname = 'User' } = req.body || {};
  const contact = await Contact.create({
    linkedin_sub: `dev-${Date.now()}`,
    email,
    firstname,
    lastname,
    given_name: firstname,
    family_name: lastname,
    email_verified: true,
  });

  res.status(201).json({ data: contactDTO(contact) });
});

module.exports = router;
