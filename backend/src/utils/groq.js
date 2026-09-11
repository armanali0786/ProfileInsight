const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
// The content script now widens its capture net (up to the whole page as a last resort,
// see getTopCardRoot/getTopCardHtml) so a selector miss on LinkedIn's side doesn't mean an
// empty fragment. Attribute-stripping on the client keeps that affordable at this size.
const MAX_HTML_LENGTH = 20000;

function sanitizeHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .slice(0, MAX_HTML_LENGTH);
}

// Parses a raw LinkedIn profile "top card" HTML fragment into structured fields via Groq,
// so extraction survives LinkedIn's frequently-regenerated CSS class names instead of
// relying solely on brittle selectors (see contentScript's getTopCardRoot/findProfilePicElement).
async function extractProfileFromHtml(html) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const cleaned = sanitizeHtml(html);
  if (!cleaned) {
    return { name: '', headline: '', location: '', company: '', profile_image: '' };
  }

  const { data } = await axios.post(
    GROQ_API_URL,
    {
      model: DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You extract structured profile data from a raw HTML fragment of a LinkedIn profile page. ' +
            'The fragment may contain only the profile top-card, or the entire page including sidebar ' +
            'widgets like "People also viewed", "Promoted" job ads, "Who your viewers also viewed", or a ' +
            'messaging panel. Identify ONLY the primary profile the page belongs to -- normally the first ' +
            'name/headline/photo near the top of the document -- and ignore any other person mentioned in ' +
            'sidebar/suggestion/ad sections. ' +
            'Return ONLY a JSON object with these exact keys: "name" (string), "headline" (string), ' +
            '"location" (string), "company" (string), "profile_image" (string, the highest-resolution ' +
            'profile photo URL you can find for that primary profile). Use an empty string for any field ' +
            'you cannot confidently find. Do not invent data that is not in the HTML.',
        },
        { role: 'user', content: cleaned },
      ],
    },
    {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      timeout: 15000,
    }
  );

  const raw = data?.choices?.[0]?.message?.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  return {
    name: parsed.name || '',
    headline: parsed.headline || '',
    location: parsed.location || '',
    company: parsed.company || '',
    profile_image: parsed.profile_image || '',
  };
}

module.exports = { extractProfileFromHtml };
