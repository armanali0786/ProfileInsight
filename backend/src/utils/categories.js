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

module.exports = { CATEGORY_KEYS, RELATIONSHIP_TYPES, RELATIONSHIP_DURATIONS };
