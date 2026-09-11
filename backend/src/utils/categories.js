// Shared vocabulary for structured reviews (Phase 1: structured ratings + reputation dashboard).
// Mirrored on the frontend in src/constants/reputation.ts -- keep both in sync.

const CATEGORY_KEYS = [
  'communication',
  'reliability',
  'technical',
  'leadership',
  'collaboration',
  'problem_solving',
  'professionalism',
];

const RELATIONSHIP_TYPES = [
  'worked_together',
  'managed_them',
  'they_managed_me',
  'client',
  'classmate',
  'interviewed',
  'other',
];

const RELATIONSHIP_DURATIONS = ['lt_3m', '3_6m', '6_12m', '1_2y', '2y_plus'];

// Parses a `category_ratings` FormData field (a JSON string of {communication: 4, ...})
// into a clamped {categories, average} pair. Returns null if nothing usable was sent.
// Shared by routes/reviews.js (review ratings) and routes/references.js (reference ratings).
function parseCategoryRatings(raw) {
  if (!raw) return null;
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const categories = {};
  let sum = 0;
  let count = 0;
  for (const key of CATEGORY_KEYS) {
    const value = Number(parsed[key]);
    if (Number.isFinite(value) && value >= 1 && value <= 5) {
      categories[key] = value;
      sum += value;
      count += 1;
    }
  }
  if (count === 0) return null;
  return { categories, average: Math.round((sum / count) * 10) / 10 };
}

module.exports = { CATEGORY_KEYS, RELATIONSHIP_TYPES, RELATIONSHIP_DURATIONS, parseCategoryRatings };
