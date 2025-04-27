import { useState, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import axios from 'axios';

/**
 * Custom hook to check if user has sufficient mana points
 * @param requiredMana - The amount of mana points required for an action
 * @returns Object containing:
 * - hasSufficientMana: Function to check if user has enough mana
 * - isManaModalOpen: Boolean state for controlling the modal visibility
 * - setManaModalOpen: Function to manually set modal state
 * - closeManaModal: Function to close the modal
 */
const useManaCheck = (requiredMana: number = 10) => {
  const { user, refreshUserData } = useUser();
  const [isManaModalOpen, setManaModalOpen] = useState<boolean>(false);
  const [isCheckingMana, setIsCheckingMana] = useState<boolean>(false);

  const hasSufficientMana = useCallback(async (): Promise<boolean> => {
    if (!user?.firebase_uid) {
      setManaModalOpen(true);
      return false;
    }
    
    setIsCheckingMana(true);
    
    try {
      // First fetch the latest user data
      if (typeof refreshUserData === 'function') {
        await refreshUserData();
      }
      
      // Get the latest mana value after update
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/mana/${user.firebase_uid}`
      );
      
      if (response.data && response.data.success) {
        const latestMana = response.data.mana;
        
        if (latestMana < requiredMana) {
          setManaModalOpen(true);
          return false;
        }
        
        return true;
      } else {
        // Fall back to user context data if API call fails
        const userMana = user?.mana || 0;
        
        if (userMana < requiredMana) {
          setManaModalOpen(true);
          return false;
        }
        
        return true;
      }
    } catch (error) {
      console.error('Error checking mana:', error);
      
      // Fall back to user context data if API call fails
      const userMana = user?.mana || 0;
      
      if (userMana < requiredMana) {
        setManaModalOpen(true);
        return false;
      }
      
      return true;
    } finally {
      setIsCheckingMana(false);
    }
  }, [user, requiredMana, refreshUserData]);

  const closeManaModal = () => {
    setManaModalOpen(false);
  };

  return {
    hasSufficientMana,
    isManaModalOpen,
    setManaModalOpen,
    closeManaModal,
    currentMana: user?.mana || 0,
    requiredMana,
    isCheckingMana
  };
};

export default useManaCheck; 