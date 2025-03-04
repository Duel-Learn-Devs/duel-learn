import React from 'react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1625] rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-semibold mb-4 text-white">Delete Account</h2>
        <p className="text-[#9F9BAE] mb-6">
          Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
        </p>
        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#2a2435] text-[#6F658D] rounded-lg hover:bg-[#3b354d] transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-[#FF3B3F] text-white rounded-lg hover:bg-red-800 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal; 