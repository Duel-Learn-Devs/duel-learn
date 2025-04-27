import React, { useState, useEffect } from "react";
import axios from "axios";
import CloseIcon from "@mui/icons-material/HighlightOffRounded";
import { useNavigate } from "react-router-dom";

interface BanPvPAccGameProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onBanStatusChange?: (isBanned: boolean) => void;
}

interface BanStatus {
  banUntil: Date | null;
  isBanActive: boolean;
}

const formatTimeLeft = (banUntil: Date): string => {
  const now = new Date();
  const diff = banUntil.getTime() - now.getTime();

  if (diff <= 0) return "Ban expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const formatDateTime = (date: Date): string => {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const BanPvPAccGame: React.FC<BanPvPAccGameProps> = ({
  isOpen,
  onClose,
  userId,
  onBanStatusChange,
}) => {
  const [banStatus, setBanStatus] = useState<BanStatus>({
    banUntil: null,
    isBanActive: false,
  });
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isBanExpired, setIsBanExpired] = useState(false);
  const navigate = useNavigate();

  // Fetch the initial ban status when component mounts
  useEffect(() => {
    if (!userId || !isOpen) return;

    const checkInitialBanStatus = async () => {
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/user/ban-status/${userId}`
        );
        const data = response.data as {
          success: boolean;
          data: { banUntil: string };
        };

        if (data.success && data.data.banUntil) {
          const banUntil = new Date(data.data.banUntil);
          if (isNaN(banUntil.getTime())) {
            console.error(
              "Invalid banUntil date received from API:",
              data.data.banUntil
            );
            return;
          }
          const isBanActive = banUntil > new Date();

          setBanStatus({
            banUntil,
            isBanActive,
          });

          // Notify parent component of ban status
          if (onBanStatusChange) {
            onBanStatusChange(isBanActive);
          }
        }
      } catch (error) {
        console.error("Error checking initial ban status:", error);
      }
    };

    checkInitialBanStatus();
  }, [userId, isOpen, onBanStatusChange]);

  // Update countdown timer
  useEffect(() => {
    if (!banStatus.banUntil) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const diff = banStatus.banUntil!.getTime() - now.getTime();
      const isExpired = diff <= 0;

      setTimeLeft(formatTimeLeft(banStatus.banUntil!));
      setIsBanExpired(isExpired);

      // Update ban active status
      if (isExpired !== !banStatus.isBanActive) {
        setBanStatus((prev) => ({
          ...prev,
          isBanActive: !isExpired,
        }));

        // Notify parent component of ban status change
        if (onBanStatusChange) {
          onBanStatusChange(!isExpired);
        }
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [banStatus.banUntil, onBanStatusChange]);

  // Handle modal close
  const handleCloseModal = () => {
    if (!banStatus.isBanActive) {
      onClose();
    }
  };

  const handleExitModal = () => {
    navigate("/dashboard/home");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#120F1B] p-6 border-2 border-[#3b354d] rounded-[0.8rem] shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[20px] font-bold text-red-600">
            Account Temporarily Banned
          </h2>
          {!isBanExpired && (
            <CloseIcon
              onClick={handleExitModal}
              fontSize="medium"
              className="text-[#6F658D]  cursor-pointer hover:scale-110 transition-all duration-300 ease-in"
            />
          )}
        </div>

        <p className=" mb-4">
          You are temporarily banned from battles due to leaving games early.
        </p>
        <p className="mb-4">
          Ban expires:{" "}
          {banStatus.banUntil
            ? formatDateTime(banStatus.banUntil)
            : "Loading..."}
        </p>
        <p
          className={`${
            isBanExpired ? "text-green-400" : "text-yellow-300"
          } font-semibold mb-6`}
        >
          {isBanExpired ? "Ban has expired!" : `Time remaining: ${timeLeft}`}
        </p>

        {isBanExpired && (
          <button
            onClick={handleCloseModal}
            className="mt-3 sm:mt-4 w-full bg-[#8565E7] hover:bg-[#4D18E8]  text-[14px] sm:text-[16px] py-1.5 sm:py-2 px-4 rounded-[0.6rem] transition-colors duration-300 ease-in-out"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default BanPvPAccGame;
