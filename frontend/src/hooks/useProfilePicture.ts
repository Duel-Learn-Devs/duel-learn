import { useState, useEffect } from "react";

const useProfilePicture = (initialPicture: string) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPicture, setSelectedPicture] = useState(initialPicture);
  const [availablePictures, setAvailablePictures] = useState<string[]>([]);

  useEffect(() => {
    // For public folder assets, we should list them explicitly
    // or fetch them from an API endpoint that returns available images
    const profilePictures = [
      "/profile-picture/capybara-default.png",
      "/profile-picture/bunny-default.png",
      "/profile-picture/cat-default.png",
    ];

    setAvailablePictures(profilePictures);
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handlePictureSelect = (picture: string) => {
    setSelectedPicture(picture);
  };

  const handleSave = () => {
    closeModal();
    return selectedPicture;
  };

  return {
    isModalOpen,
    selectedPicture,
    availablePictures,
    openModal,
    closeModal,
    handlePictureSelect,
    handleSave,
  };
};

export default useProfilePicture;
