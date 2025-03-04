import { useState, useEffect } from 'react';

const useProfilePicture = (initialPicture: string) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPicture, setSelectedPicture] = useState(initialPicture);
  const [availablePictures, setAvailablePictures] = useState<string[]>([]);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const imageModules = import.meta.glob('../assets/profile-picture/*.{png,jpg,jpeg,svg}');
        const imageUrls = await Promise.all(
          Object.values(imageModules).map(importFn => importFn())
        );
        setAvailablePictures(imageUrls.map((module: any) => module.default));
      } catch (error) {
        console.error('Error loading profile pictures:', error);
      }
    };

    loadImages();
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