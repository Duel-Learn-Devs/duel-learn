import React, { useState } from "react";
import { Dialog, Snackbar, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";

interface QuestionTypeSelectionModalProps {
  open: boolean;
  onClose: () => void;
  selectedTypes: string[];
  questionTypes: { display: string; value: string }[];
  onConfirm: (selectedTypes: string[]) => void;
  isHost?: boolean; // Add isHost prop to determine if user can edit
}

const QuestionTypeSelectionModal: React.FC<QuestionTypeSelectionModalProps> = ({
  open,
  onClose,
  selectedTypes,
  questionTypes,
  onConfirm,
  isHost = true, // Default to true for backward compatibility
}) => {
  const [openAlert, setOpenAlert] = useState(false); // State to control alert visibility
  const [localSelectedTypes, setLocalSelectedTypes] =
    useState<string[]>(selectedTypes); // State for selected question types

  const handleSaveChanges = () => {
    // If no question type is selected, show the alert
    if (localSelectedTypes.length === 0) {
      setOpenAlert(true);
    } else {
      console.log("Selected Question Types:", localSelectedTypes);
      onConfirm(localSelectedTypes); // Call onConfirm with the selected types
      onClose(); // Close the modal
    }
  };

  const handleCloseAlert = () => {
    setOpenAlert(false); // Close the alert when the user acknowledges
  };

  const toggleSelection = (type: string) => {
    if (!isHost) return; // Only allow hosts to change selection
    
    setLocalSelectedTypes((prev: string[]) =>
      prev.includes(type)
        ? prev.filter((t: string) => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div>
      <Dialog open={open} onClose={onClose} sx={{ borderRadius: "16px" }}>
        <div className="flex justify-center bg-[#080511] px-20 py-14 items-center h-full overflow-x-hidden overflow-y-hidden">
          <div className="paper-container flex flex-col items-center justify-center max-h-full overflow-y-hidden w-full">
            {/* Top Scroll Design */}
            <div className="scroll-wrapper flex justify-center items-center">
              <div className="scroll-holder rounded-t-full bg-gray-700 w-10 h-5"></div>
              <div className="scroll-bar bg-gray-500 w-20 h-2"></div>
              <div className="scroll-holder rounded-t-full bg-gray-700 w-10 h-5"></div>
            </div>

            <div className="paper flex justify-center items-center p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md bg-white shadow-md border border-gray-300 rounded-lg">
              <div className="w-full text-center">
                <h3 className="text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] font-bold text-black">
                  Choose your question types
                </h3>
                <p className="text-[12px] sm:text-[14px] w-[200px] sm:w-[250px] md:w-[300px] mx-auto text-gray-700">
                  {isHost 
                    ? "Tailor your study flow and focus on what suits you best!" 
                    : "These are the question types selected by the host"
                  }
                </p>

                {/* Question Type Selection */}
                <div className="mt-5 space-y-2">
                  {questionTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`flex justify-between items-center text-black py-2 sm:py-3 px-8 sm:px-10 md:px-14 ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                      onClick={() => toggleSelection(type.value)}
                    >
                      <span className="font-bold text-[14px] sm:text-[16px]">
                        {type.display}
                      </span>

                      {/* Toggle Button */}
                      <div
                        className={`relative w-12 sm:w-14 md:w-16 h-7 sm:h-8 md:h-9 flex items-center justify-between px-[4px] sm:px-[5px] md:px-[6px] rounded-md transition-all ${
                          localSelectedTypes.includes(type.value)
                            ? "bg-black"
                            : "bg-black"
                        } ${isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                      >
                        {/* Check Icon */}
                        <div
                          className={`w-5 sm:w-6 h-5 sm:h-6 flex items-center justify-center rounded-md transition-all ${
                            localSelectedTypes.includes(type.value)
                              ? "bg-black text-[#461ABD]"
                              : "bg-white text-[#461ABD]"
                          } `}
                        >
                          <CloseIcon />
                        </div>

                        {/* Uncheck Icon */}
                        <div
                          className={`w-5 sm:w-6 h-5 sm:h-6 flex items-center justify-center rounded transition-all ${
                            localSelectedTypes.includes(type.value)
                              ? "bg-white text-[#461ABD]"
                              : "bg-black text-[#461ABD]"
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
                    disabled={!isHost}
                    className={`mt-8 w-[240px] sm:w-[280px] md:w-[320px] py-2 sm:py-3 border-2 border-black text-black rounded-lg text-md sm:text-lg shadow-lg ${isHost ? 'hover:bg-purple-700 hover:text-white hover:border-transparent' : 'opacity-60 cursor-not-allowed'} flex items-center justify-center`}
                  >
                    {isHost ? "Save Changes" : "Only Host Can Edit"}
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
      </Dialog>
      {/* Top Alert (for question type selection) */}
      <Snackbar
        open={openAlert} // Show the alert if openAlert is true
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="warning"
          sx={{ width: "100%" }}
        >
          Please select a question type before proceeding.
        </Alert>
      </Snackbar>
    </div>
  );
};

export default QuestionTypeSelectionModal;
