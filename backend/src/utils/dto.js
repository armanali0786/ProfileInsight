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
    category_ratings: review.category_ratings || null,
    relationship_type: review.relationship_type || 'other',
    relationship_duration: review.relationship_duration || null,
    would_work_again: review.would_work_again === undefined ? null : review.would_work_again,
    standout_strength: review.standout_strength || '',
    verification_status: review.verification_status || 'unverified',
    comments: (review.comments || []).map((c) => commentDTO(c, viewerContactId)),
  };
}

function verificationDTO(verification) {
  const review = verification.review_id;
  const reviewer = review && review.reviewer_id && review.reviewer_id.firstname !== undefined ? review.reviewer_id : null;

  return {
    verification_id: String(verification._id),
    review_id: review ? String(review._id) : null,
    profile_id: verification.profile_id,
    reviewer_fullname: review && review.is_anon ? 'Anonymous reviewer' : reviewer ? `${reviewer.firstname} ${reviewer.lastname}`.trim() : 'A reviewer',
    reviewer_profile_img: review && review.is_anon ? null : reviewer ? reviewer.profile_image : null,
    relationship_type: review ? review.relationship_type : null,
    relationship_duration: review ? review.relationship_duration : null,
    rating: review ? review.rating : null,
    description: review ? review.description : '',
    status: verification.status,
    created_at: verification.created_at,
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
    company: profile.company,
    profile_image: profile.profile_image,
    claimed_by: profile.claimed_by ? String(profile.claimed_by) : null,
    last_synced_at: profile.last_synced_at,
  };
}

function referenceRequestDTO(request) {
  const requester = request.requested_by && request.requested_by.firstname !== undefined ? request.requested_by : null;

  return {
    request_id: String(request._id),
    profile_id: request.profile_id,
    profile_name: request.profile_name,
    requested_by_fullname: requester ? `${requester.firstname} ${requester.lastname}`.trim() : 'A ProfileInsight user',
    status: request.status,
    created_at: request.created_at,
  };
}

function referenceResponseDTO(request) {
  const recipient =
    request.recipient_contact_id && request.recipient_contact_id.firstname !== undefined
      ? request.recipient_contact_id
      : null;
  const response = request.response || {};

  return {
    request_id: String(request._id),
    profile_id: request.profile_id,
    respondent_fullname: recipient ? `${recipient.firstname} ${recipient.lastname}`.trim() : 'A verified professional',
    respondent_profile_img: recipient ? recipient.profile_image : null,
    category_ratings: response.category_ratings || null,
    relationship_type: response.relationship_type || null,
    relationship_duration: response.relationship_duration || null,
    strengths_note: response.strengths_note || '',
    next_manager_note: response.next_manager_note || '',
    would_hire_again: response.would_hire_again === undefined ? null : response.would_hire_again,
    submitted_at: response.submitted_at,
  };
}

module.exports = {
  contactDTO,
  reviewDTO,
  commentDTO,
  profileDTO,
  verificationDTO,
  referenceRequestDTO,
  referenceResponseDTO,
};
