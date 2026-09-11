// Mirrors backend/src/utils/categories.js -- keep both in sync.

export const CATEGORY_FIELDS = [
  { key: "communication", label: "Communication" },
  { key: "reliability", label: "Reliability" },
  { key: "technical", label: "Technical / functional skills" },
  { key: "leadership", label: "Leadership" },
  { key: "collaboration", label: "Collaboration" },
  { key: "problem_solving", label: "Problem solving" },
  { key: "professionalism", label: "Professionalism" },
];

export const RELATIONSHIP_TYPES = [
  { value: "worked_together", label: "Worked together" },
  { value: "managed_them", label: "Managed them" },
  { value: "they_managed_me", label: "They managed me" },
  { value: "client", label: "Client / customer" },
  { value: "classmate", label: "Classmate" },
  { value: "interviewed", label: "Interviewed with them" },
  { value: "other", label: "Other" },
];

export const RELATIONSHIP_DURATIONS = [
  { value: "lt_3m", label: "< 3 months" },
  { value: "3_6m", label: "3-6 months" },
  { value: "6_12m", label: "6-12 months" },
  { value: "1_2y", label: "1-2 years" },
  { value: "2y_plus", label: "2+ years" },
];

export const defaultCategoryRatings = () =>
  Object.fromEntries(CATEGORY_FIELDS.map((field) => [field.key, 0]));

export const relationshipTypeLabel = (value) =>
  RELATIONSHIP_TYPES.find((item) => item.value === value)?.label || "Other";

export const relationshipDurationLabel = (value) =>
  RELATIONSHIP_DURATIONS.find((item) => item.value === value)?.label || "";
