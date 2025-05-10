import React, { useEffect, useState } from "react";
import { Modal, Box } from "@mui/material";
import ManaIcon from "../../../../../../../public/ManaIcon.png";
import { useUser } from "../../../../../../contexts/UserContext";
import axios from "axios";

interface ManaAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMana: number;
  requiredMana: number;
}

interface ManaDetails {
  current: number;
  maximum: number;
  percentageFilled: number;
  lastUpdated: string;
  replenishRate: {
    perMinute: number;
    perHour: number;
  };
  timeToFull: {
    minutes: number;
    formattedTime: string;
  };
  isFull: boolean;
}

const ManaAlertModal: React.FC<ManaAlertModalProps> = ({
  isOpen,
  onClose,
  currentMana,
  requiredMana,
}) => {
  const { user } = useUser();
  const [manaDetails, setManaDetails] = useState<ManaDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentManaValue, setCurrentManaValue] = useState<number>(currentMana);
  
  // Timer to update mana value in real-time
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timeToNextMana, setTimeToNextMana] = useState<number>(0);
  const [timeToRequiredMana, setTimeToRequiredMana] = useState<number>(0);
  const [secondsToNextMana, setSecondsToNextMana] = useState<number>(0);
  
  // Fetch mana details when modal opens
  useEffect(() => {
    if (isOpen && user?.firebase_uid) {
      fetchManaDetails();
    }
    
    return () => {
      // Clean up any timers or resources when modal closes
    };
  }, [isOpen, user?.firebase_uid]);
  
  // Update mana in real-time based on replenishment rate
  useEffect(() => {
    if (!isOpen || !manaDetails) return;
    
    // Only start the timer if we're not at max mana
    if (manaDetails.isFull) return;
    
    // Update time to full
    setTimeLeft(manaDetails.timeToFull.minutes);
    
    // Calculate time to next mana point
    const fractionalPart = currentManaValue % 1;
    const timeForOneMana = 1 / manaDetails.replenishRate.perMinute; // minutes per mana point
    const timeToNextPoint = timeForOneMana * (1 - fractionalPart);
    setTimeToNextMana(timeToNextPoint);
    
    // Calculate seconds to next mana point for countdown
    setSecondsToNextMana(Math.ceil(timeToNextPoint * 60));
    
    // Calculate time to required mana
    const manaNeeded = Math.max(0, requiredMana - currentManaValue);
    const timeToRequired = manaNeeded / manaDetails.replenishRate.perMinute;
    setTimeToRequiredMana(timeToRequired);
    
    // Create a timer to update mana every second
    const timer = setInterval(() => {
      setCurrentManaValue(prev => {
        // Calculate how much mana should be added every second
        const manaPerSecond = manaDetails.replenishRate.perMinute / 60;
        const newValue = Math.min(prev + manaPerSecond, manaDetails.maximum);
        return newValue;
      });
      
      // Update time left
      setTimeLeft(prev => Math.max(0, prev - (1/60)));
      
      // Update time to next mana point
      setSecondsToNextMana(prev => {
        const newValue = prev - 1;
        // Reset when we reach zero (gained a mana point)
        if (newValue <= 0) {
          // Calculate time for the next point
          const timeForOneMana = 60 / (manaDetails.replenishRate.perMinute * 60); // seconds per mana
          return Math.ceil(timeForOneMana * 60);
        }
        return newValue;
      });
      
      // Update time to required mana
      setTimeToRequiredMana(prev => Math.max(0, prev - (1/60)));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, manaDetails, currentManaValue, requiredMana]);
  
  const fetchManaDetails = async () => {
    if (!user?.firebase_uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/mana/details/${user.firebase_uid}`
      );
      
      if (response.data && response.data.success) {
        setManaDetails(response.data.mana);
        setCurrentManaValue(response.data.mana.current);
        
        // Initial calculation of time to next mana point
        const fractionalPart = response.data.mana.current % 1;
        const timeForOneMana = 1 / response.data.mana.replenishRate.perMinute; // minutes per mana point
        const timeToNextPoint = timeForOneMana * (1 - fractionalPart);
        setTimeToNextMana(timeToNextPoint);
        setSecondsToNextMana(Math.ceil(timeToNextPoint * 60));
        
        // Initial calculation of time to required mana
        const manaNeeded = Math.max(0, requiredMana - response.data.mana.current);
        const timeToRequired = manaNeeded / response.data.mana.replenishRate.perMinute;
        setTimeToRequiredMana(timeToRequired);
      } else {
        setError("Failed to load mana details");
      }
    } catch (err) {
      console.error("Error fetching mana details:", err);
      setError("Error loading mana information. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Format time display helper
  const formatTimeLeft = () => {
    if (!timeLeft) return "0m";
    
    const hours = Math.floor(timeLeft / 60);
    const minutes = Math.ceil(timeLeft % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  // Format time to required mana
  const formatTimeToRequired = () => {
    if (currentManaValue >= requiredMana) return "You have enough mana!";
    if (!timeToRequiredMana) return "Calculating...";
    
    const hours = Math.floor(timeToRequiredMana / 60);
    const minutes = Math.floor(timeToRequiredMana % 60);
    const seconds = Math.ceil((timeToRequiredMana % 1) * 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="insufficient-mana-modal"
      aria-describedby="modal-to-inform-about-insufficient-mana"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          bgcolor: "#080511",
          boxShadow: 24,
          borderColor: "#3B354D",
          borderWidth: "1px",
          borderRadius: "16px",
          p: 4,
          textAlign: "center",
          color: "white",
        }}
      >
        <h2 className="text-2xl font-bold mb-2">Insufficient Mana</h2>
        <p className="mb-4 text-sm text-[#8d80b3]">
          You don't have enough mana to perform this action.
        </p>
        
        <div className="flex flex-col items-center my-6">
          <img
            src={ManaIcon}
            alt="Mana"
            className="w-20 h-20 object-contain animate-pulse"
          />
          
          <div className="mt-4 text-center">
            <p className="text-lg font-bold text-white mb-1">
              Current Mana: <span className="text-blue-400">{Math.floor(currentManaValue)}</span>
              <span className="text-xs text-gray-400 ml-1">
                ({currentManaValue.toFixed(2)})
              </span>
            </p>
            <p className="text-lg font-bold text-white mb-3">
              Required Mana: <span className="text-purple-400">{requiredMana}</span>
            </p>
            
            {manaDetails && (
              <div className="bg-[#1A142B] p-3 rounded-lg mt-2 mb-3">
                <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${(currentManaValue / manaDetails.maximum) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>{manaDetails.maximum}</span>
                </div>
                
                {/* Next mana point countdown */}
                <div className="mt-3 p-2 bg-[#120F1D] rounded-md">
                  <p className="text-sm text-green-300 font-semibold">
                    Next mana point in: <span className="text-white">{secondsToNextMana}s</span>
                  </p>
                </div>
                
                {/* Time to required mana */}
                {currentManaValue < requiredMana && (
                  <div className="mt-2 p-2 bg-[#120F1D] rounded-md">
                    <p className="text-sm text-yellow-300 font-semibold">
                      Required mana in: <span className="text-white">{formatTimeToRequired()}</span>
                    </p>
                  </div>
                )}
                
                <p className="text-sm mt-3 text-indigo-300">
                  {manaDetails.isFull 
                    ? "Mana fully replenished!" 
                    : `Full mana in: ${formatTimeLeft()}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Replenishes at {manaDetails.replenishRate.perHour.toFixed(1)} mana/hour
                  <span className="ml-2">({(manaDetails.replenishRate.perMinute * 60).toFixed(1)}/minute)</span>
                </p>
              </div>
            )}
            
            {loading && <p className="text-sm text-gray-400">Loading mana details...</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <button
            className="bg-[#4B17CD] text-white px-5 py-2 rounded-lg font-bold w-full flex justify-center items-center hover:bg-[#3b13a3] transition-all duration-200"
            onClick={onClose}
          >
            Got it
          </button>
          
          <button
            className="mt-2 text-gray-400 hover:text-white transition-all duration-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default ManaAlertModal; 