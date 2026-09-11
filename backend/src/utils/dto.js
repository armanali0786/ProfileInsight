// The extension's frontend was reverse-engineered from two slightly inconsistent legacy call sites
// (get_reviews vs save_comment) that read different field names for the same data
// (e.g. `description` vs `review_description`, `contact_id` vs `reviewer_id` for a comment's author).
// These DTOs include every field name observed in either call site so both code paths work.

function contactDTO(contact) {
  return {
    contact_id: String(contact._id),
    email: contact.email,
    firstname: contact.firstname,
    lastname: contact.lastname,
    name: `${contact.firstname || contact.given_name || ''} ${contact.lastname || contact.family_name || ''}`.trim(),
    given_name: contact.given_name,
    family_name: contact.family_name,
    locale: contact.locale,
    email_verified: contact.email_verified,
    picture: contact.picture,
    profile_image: contact.profile_image,
    account_status: contact.account_status,
  };
}

function reviewDTO(review, viewerContactId) {
  const reviewer = review.reviewer_id && review.reviewer_id.firstname !== undefined ? review.reviewer_id : null;
  const isLiked = viewerContactId
    ? review.liked_by.some((id) => String(id) === String(viewerContactId))
    : false;

  return {
    review_id: String(review._id),
    id: String(review._id),
    profile_id: review.profile_id,
    profile_name: review.profile_name,
    reviewer_id: reviewer ? String(reviewer._id) : String(review.reviewer_id),
    reviewer_fullname: reviewer ? `${reviewer.firstname} ${reviewer.lastname}`.trim() : '',
    reviewer_profile_img: reviewer ? reviewer.profile_image : null,
    reviewer_review_count: undefined, // filled in by the route when needed
    review_description: review.description,
    description: review.description,
    rating: review.rating,
    is_anon: review.is_anon ? 1 : 0,
    is_liked: isLiked,
    created_at: review.created_at,
    updated_at: review.updated_at,
    task_name: null,
    comments: (review.comments || []).map((c) => commentDTO(c, viewerContactId)),
  };
}

function commentDTO(comment, viewerContactId) {
  const commenter = comment.commenter_id && comment.commenter_id.firstname !== undefined ? comment.commenter_id : null;
  const isLiked = viewerContactId
    ? comment.liked_by.some((id) => String(id) === String(viewerContactId))
    : false;

  return {
    comment_id: String(comment._id),
    id: String(comment._id),
    task_id: '1',
    task_review_id: String(comment.review_id),
    task_reviewer_id: comment.reviewer_id ? String(comment.reviewer_id) : undefined,
    reviewer_id: commenter ? String(commenter._id) : String(comment.commenter_id),
    contact_id: commenter ? String(commenter._id) : String(comment.commenter_id),
    commenter_fullname: commenter ? `${commenter.firstname} ${commenter.lastname}`.trim() : '',
    commenter_profile: commenter ? commenter.profile_image : null,
    comment_description: comment.description,
    description: comment.description,
    is_anon: comment.is_anon ? 1 : 0,
    profile_id: comment.profile_id,
    rel_type: comment.rel_type,
    is_liked: isLiked,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
  };
}

function profileDTO(profile) {
  return {
    profile_id: profile.profile_id,
    profile_name: profile.profile_name,
    headline: profile.headline,
    location: profile.location,
    profile_image: profile.profile_image,
    claimed_by: profile.claimed_by ? String(profile.claimed_by) : null,
    last_synced_at: profile.last_synced_at,
  };
}

module.exports = { contactDTO, reviewDTO, commentDTO, profileDTO };
