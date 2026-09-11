const express = require('express');
const Profile = require('../models/Profile');
const { extractProfileFromHtml } = require('../utils/groq');
const { profileDTO } = require('../utils/dto');

const router = express.Router();

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // refresh once per day (effectively "every morning" for a daily LinkedIn user)

// POST /admin/api/profile/sync
// Called by the content script (via background.js) with the current LinkedIn top-card HTML.
// Only re-parses through Groq when the stored profile is missing or older than SYNC_INTERVAL_MS,
// so a profile visited multiple times a day only costs one Groq call.
router.post('/sync', async (req, res) => {
  const { profile_id, html } = req.body;
  if (!profile_id) return res.status(400).json({ message: 'profile_id is required.' });

  const existing = await Profile.findOne({ profile_id });
  const isStale =
    !existing?.last_synced_at || Date.now() - new Date(existing.last_synced_at).getTime() > SYNC_INTERVAL_MS;

  if (existing && !isStale) {
    return res.status(200).json({ data: profileDTO(existing), synced: false, message: 'Profile is already up to date.' });
  }

  if (!html) return res.status(400).json({ message: 'html is required to sync a new or stale profile.' });

  let extracted;
  try {
    extracted = await extractProfileFromHtml(html);
  } catch (err) {
    console.error('Groq extraction failed:', err.message);
    return res.status(502).json({ message: 'Failed to parse profile via Groq.' });
  }

  const profile = await Profile.findOneAndUpdate(
    { profile_id },
    {
      $set: {
        profile_name: extracted.name || existing?.profile_name || '',
        headline: extracted.headline,
        location: extracted.location,
        company: extracted.company,
        profile_image: extracted.profile_image,
        last_synced_at: new Date(),
      },
      $setOnInsert: { profile_id },
    },
    { upsert: true, new: true }
  );

  res.status(200).json({ data: profileDTO(profile), synced: true, message: 'Profile synced.' });
});

module.exports = router;
