// Pulls a bare LinkedIn profile id out of a pasted profile URL (or passes through a bare id
// unchanged). Shared by routes/references.js and routes/contacts.js (block flow).
function extractProfileId(value) {
  const match = String(value || '').match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : String(value || '').trim();
}

module.exports = { extractProfileId };
