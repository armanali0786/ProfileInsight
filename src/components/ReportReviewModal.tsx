import React from 'react';

const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'fake', label: 'Fake review' },
  { value: 'spam', label: 'Spam' },
  { value: 'conflict_of_interest', label: 'Conflict of interest' },
  { value: 'other', label: 'Other' },
];

const ReportReviewModal = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-64">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Report this review</h2>
        <div className="flex flex-col gap-2 mb-6">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason.value}
              className="text-left bg-LinkedInBlue-tint text-LinkedInBlue px-4 py-2 rounded-md hover:bg-LinkedInBlue hover:text-white duration-300"
              onClick={() => onSubmit(reason.value)}
            >
              {reason.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            className="text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 duration-300"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportReviewModal;
