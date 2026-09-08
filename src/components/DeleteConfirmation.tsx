import React from 'react';



const DeleteConfirmation = ({ isOpen, onClose, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg  max-w-40">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Confirm Delete</h2>
        <p className="text-gray-600 mb-6">Are you sure you want to delete this item?</p>
        <div className="flex justify-end space-x-4">
          <button
            className="bg-LinkedInBlue-tint text-LinkedInBlue px-4 py-2 rounded-md hover:bg-LinkedInBlue hover:text-white duration-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-Danger text-white px-4 py-2 rounded-md hover:opacity-90 duration-300"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
