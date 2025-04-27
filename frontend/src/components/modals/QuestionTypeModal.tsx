import React, { useState, useEffect } from "react";
import { Modal, Backdrop } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";

interface QuestionTypeModalProps {
  open: boolean;
  onClose: () => void;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  isHost?: boolean;
}

const QuestionTypeModal: React.FC<QuestionTypeModalProps> = ({
  open,
  onClose,
  selectedTypes,
  onTypesChange,
  isHost = true,
}) => {
  const [localSelectedTypes, setLocalSelectedTypes] =
    useState<string[]>(selectedTypes);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  // Reset local state when props change or modal opens
  useEffect(() => {
    if (open) {
      setIsClosing(false);
      setLocalSelectedTypes(selectedTypes);
    }
  }, [selectedTypes, open]);

  const questionTypes = [
    {
      display: "Identification",
      value: "identification",
    },
    {
      display: "Multiple Choice",
      value: "multiple-choice",
    },
    {
      display: "True or False",
      value: "true-false",
    },
  ];

  const toggleSelection = (type: string) => {
    if (!isHost) return;

    const newTypes = localSelectedTypes.includes(type)
      ? localSelectedTypes.filter((t) => t !== type)
      : [...localSelectedTypes, type];

    setLocalSelectedTypes(newTypes);
    // Remove the onTypesChange call here - only update local state
  };

  const handleSaveChanges = () => {
    if (isHost) {
      // Check if any types are selected, if not, automatically select identification
      let typesToSave = [...localSelectedTypes];
      if (typesToSave.length === 0) {
        // Show animation first
        setIsAnimating(true);

        // After a brief delay, select identification and save
        setTimeout(() => {
          typesToSave = ["identification"];
          setLocalSelectedTypes(typesToSave);

          // After showing the toggle effect, begin closing animation
          setTimeout(() => {
            onTypesChange(typesToSave);
            // Start closing animation
            setIsClosing(true);

            // Actually close the modal after animation completes
            setTimeout(() => {
              onClose();
              setIsAnimating(false);
              setIsClosing(false);
            }, 400);
          }, 300);
        }, 100);
      } else {
        // If types already selected, just save and begin closing animation
        onTypesChange(typesToSave);
        setIsClosing(true);

        // Actually close the modal after animation completes
        setTimeout(() => {
          onClose();
          setIsClosing(false);
        }, 400);
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        // Discard changes when modal is closed without saving
        setLocalSelectedTypes(selectedTypes);
        onClose();
      }}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <div className="flex justify-center items-center h-full overflow-x-hidden overflow-y-hidden">
        <div
          className={`paper-container flex flex-col items-center justify-center max-h-full overflow-y-hidden w-full transition-all duration-400 ${
            isClosing ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          {/* Top Scroll Design */}
          <div className="scroll-wrapper flex justify-center items-center">
            <div className="scroll-holder rounded-t-full bg-gray-700 w-10 h-5"></div>
            <div className="scroll-bar bg-gray-500 w-20 h-2"></div>
            <div className="scroll-holder rounded-t-full bg-gray-700 w-10 h-5"></div>
          </div>

          {/* Paper Content (Perfectly Centered) */}
          <div className="paper flex justify-center items-center p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md bg-white shadow-md border border-gray-300 rounded-lg">
            <div className="w-full text-center">
              <h3 className="text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] font-bold text-black">
                Choose your question types
              </h3>
              <p className="text-[12px] sm:text-[14px] w-[200px] sm:w-[250px] md:w-[300px] mx-auto text-gray-700">
                {isHost
                  ? "Tailor your study flow and focus on what suits you best!"
                  : "These are the question types selected by the host"}
              </p>

              {/* Question Type Selection */}
              <div className="mt-5 space-y-2">
                {questionTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`flex justify-between items-center text-black py-2 sm:py-3 px-8 sm:px-10 md:px-14 ${
                      !isHost ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <span className="font-bold text-[14px] sm:text-[16px]">
                      {type.display}
                    </span>

                    {/* Toggle Button */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(type.value);
                      }}
                      className={`relative w-12 sm:w-14 md:w-16 h-7 sm:h-8 md:h-9 flex items-center justify-between px-[4px] sm:px-[5px] md:px-[6px] rounded-md transition-all bg-black ${
                        isHost
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-80"
                      } ${
                        isAnimating && type.value === "identification"
                          ? "animate-pulse"
                          : ""
                      }`}
                    >
                      {/* Check Icon */}
                      <div
                        className={`w-5 sm:w-6 h-5 sm:h-6 flex items-center justify-center rounded-md transition-all ${
                          localSelectedTypes.includes(type.value) ||
                          (isAnimating && type.value === "identification")
                            ? "bg-black text-[#461ABD]"
                            : "bg-white text-[#461ABD]"
                        } ${
                          isAnimating && type.value === "identification"
                            ? "transform transition-transform"
                            : ""
                        }`}
                      >
                        <CloseIcon />
                      </div>

                      {/* Uncheck Icon */}
                      <div
                        className={`w-5 sm:w-6 h-5 sm:h-6 flex items-center justify-center rounded transition-all ${
                          localSelectedTypes.includes(type.value) ||
                          (isAnimating && type.value === "identification")
                            ? "bg-white text-[#461ABD]"
                            : "bg-black text-[#461ABD]"
                        } ${
                          isAnimating && type.value === "identification"
                            ? "transform transition-transform"
                            : ""
                        }`}
                      >
                        <CheckIcon />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Changes Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSaveChanges}
                  disabled={!isHost || isAnimating || isClosing}
                  className={`mt-8 w-[240px] sm:w-[280px] md:w-[320px] py-2 sm:py-3 border-2 border-black text-black rounded-lg text-md sm:text-lg shadow-lg ${
                    isHost && !isAnimating && !isClosing
                      ? "hover:bg-purple-700 hover:text-white hover:border-transparent"
                      : "opacity-60 cursor-not-allowed"
                  } flex items-center justify-center`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Scroll Design */}
          <div className="scroll-wrapper flex justify-center items-center">
            <div className="scroll-holder rounded-b-full bg-gray-700 w-10 h-5"></div>
            <div className="scroll-bar bg-gray-500 w-20 h-2"></div>
            <div className="scroll-holder rounded-b-full bg-gray-700 w-10 h-5"></div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuestionTypeModal;
