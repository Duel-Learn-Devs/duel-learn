import React from 'react';
import PageTransition from '../styles/PageTransition';

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  pictures: string[];
  selectedPicture: string;
  onPictureSelect: (picture: string) => void;
  onSave: () => void;
  isEditing: boolean;
}

const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  isOpen,
  onClose,
  pictures,
  selectedPicture,
  onPictureSelect,
  onSave,
  isEditing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <PageTransition>
        <div className="w-full max-w-2xl bg-[#1a1625] rounded-lg p-8 shadow-md">
          <h2 className="text-[18px] text-center text-[#9F9BAE] mb-8">
            Choose your new profile picture
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-8 justify-items-center">
            {pictures.map((picture, index) => (
              <div
                key={index}
                className={`rounded-lg p-2 transition-all flex items-center justify-center w-[150px] h-[150px] ${
                  selectedPicture === picture
                    ? 'border-4 border-[#4D18E8]'
                    : 'border-2 border-gray-200 hover:border-[#6931E0]'
                } ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                onClick={() => isEditing && onPictureSelect(picture)}
              >
                <img
                  src={picture}
                  alt={`Profile ${index + 1}`}
                  className="w-[120px] h-[120px] object-cover rounded"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors w-[182.45px]"
              disabled={!isEditing}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-6 py-3 bg-[#4D18E8] text-white rounded-lg hover:bg-[#6931E0] transition-colors w-[182.45px]"
              disabled={!isEditing}
            >
              Save
            </button>
          </div>
        </div>
      </PageTransition>
    </div>
  );
};

export default ProfilePictureModal; 