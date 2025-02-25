import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Snackbar } from "@mui/material"; // Import Snackbar and Alert from MUI
import "./styles/setupques.css";
import ManaIcon from "../../../assets/ManaIcon.png";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PageTransition from "../../../styles/PageTransition";

const SetUpQuestionType: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, material } = location.state || {};
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [questionTypes] = useState([
    {
      display: "Identification",
      value: "identification"
    },
    {
      display: "Multiple Choice",
      value: "multiple-choice"
    },
    {
      display: "True or False",
      value: "true-false"
    }
  ]);
  const [openAlert, setOpenAlert] = useState(false); // State to control alert visibility
  const [manaPoints, setManaPoints] = useState(10); // State for dynamic mana points
  const [openManaAlert, setOpenManaAlert] = useState(false); // State for the mana alert

  console.log(
    "Mode:",
    mode,
    "Material:",
    material,
    "Selected Types:",
    selectedTypes
  );

  const toggleSelection = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const backToHome = () => {
    navigate("/dashboard/home");
  };

  const handleStartLearning = () => {
    // If no question type is selected, show the alert
    if (selectedTypes.length === 0) {
      setOpenAlert(true);
    }
    // If manaPoints are below 10 and mode is not "Time Pressured", show the mana alert
    else if (mode !== "Time Pressured" && manaPoints < 10) {
      setOpenManaAlert(true);
    }
    // If mode is "Time Pressured", navigate to Timer Setup
    else if (mode === "Time Pressured") {
      navigate("/dashboard/setup/timer", {
        state: {
          mode,
          material,
          selectedTypes,
        },
      });
    }
    // If the mode is "Peaceful", navigate to LoadingScreen
    else if (mode === "Peaceful") {
      navigate("/dashboard/loading-screen", {
        state: {
          mode,
          material,
          selectedTypes,
          timeLimit: null
        },
      });
    }
    // If the mode is not "Time Pressured" and not "Peaceful Mode", navigate to PvP Lobby
    else if (mode !== "Time Pressured" && mode !== "Peaceful Mode") {
      navigate("/dashboard/pvp-lobby", {
        state: {
          mode,
          material,
          selectedTypes,
        },
      });
    }
    // Default fallback logic
    else {
      console.log("Normal mode selected, staying on current flow.");
    }
  };

  const handleCloseAlert = () => {
    setOpenAlert(false); // Close the alert when the user acknowledges
  };

  const handleCloseManaAlert = () => {
    setOpenManaAlert(false); // Close the mana alert
  };

  return (
    <PageTransition>
      <div className="relative h-screen text-white px-6 py-8 overflow-hidden overflow-y-hidden">
        {/* Full-Width Fixed Header */}
        <div className="absolute top-0 left-0 w-full sm:px-8 md:px-16 lg:px-32 px-12 mt-5 py-12 flex justify-between items-center">
          {/* Left Side: Back Button + Title + Subtitle */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            <IconButton
              className="text-gray-300"
              onClick={backToHome}
              style={{
                border: "2px solid #6F658D",
                borderRadius: "50%",
                padding: "4px",
                color: "#6F658D",
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            <div>
              <h2 className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] font-semibold mb-1 uppercase">
                {mode} Mode
              </h2>
              <p className="text-[12px] sm:text-[14px] text-gray-400">
                Chosen Study Material:{" "}
                <span className="font-bold text-white">{material?.title}</span>
              </p>
            </div>
          </div>

          {/* Right Side: Points + Animated Settings Icon */}
          <div className="flex items-center gap-1 sm:gap-2">
            <img
              src={ManaIcon}
              alt="Mana"
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1"
            />
            <span className="text-[14px] sm:text-[16px] text-gray-300 mr-2 sm:mr-3">
              {manaPoints}
            </span>{" "}
            {/* Dynamic mana points */}
            <span className="animate-spin text-[14px] sm:text-[16px] text-purple-400">
              ⚙️
            </span>
          </div>
        </div>

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

        {/* Mana Points Alert */}
        <Snackbar
          open={openManaAlert} // Show the mana alert if openManaAlert is true
          autoHideDuration={6000}
          onClose={handleCloseManaAlert}
        >
          <Alert
            onClose={handleCloseManaAlert}
            severity="error"
            sx={{ width: "100%" }}
          >
            Your Mana points are running low. Please recharge to continue.
          </Alert>
        </Snackbar>

        {/* Centered Paper Container */}
        <div className="flex justify-center items-center h-full overflow-x-hidden overflow-y-hidden">
          <div className="paper-container flex flex-col items-center justify-center max-h-full overflow-y-hidden w-full">
            {/* Top Scroll Bar */}
            <div className="scroll-wrapper">
              <div className="scroll-holder"></div>
              <div className="scroll-bar"></div>
              <div className="scroll-holder"></div>
            </div>

            {/* Paper Content (Perfectly Centered) */}
            <div className="paper flex justify-center items-center p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md">
              <div className="w-full text-center">
                <h3 className="text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] font-bold text-black">
                  Choose your question types
                </h3>
                <p className="text-[12px] sm:text-[14px] w-[200px] sm:w-[250px] md:w-[300px] mx-auto text-gray-700">
                  Tailor your study flow and focus on what suits you best!
                </p>

                {/* Question Type Selection */}
                <div className="mt-5 space-y-2">
                  {questionTypes.map((type) => (
                    <div
                      key={type.value}
                      className="flex justify-between items-center text-black py-2 sm:py-3 px-8 sm:px-10 md:px-14"
                    >
                      <span className="font-bold text-[14px] sm:text-[16px]">
                        {type.display}
                      </span>

                      {/* Toggle Button */}
                      <div
                        onClick={() => toggleSelection(type.value)}
                        className={`relative w-12 sm:w-14 md:w-16 h-7 sm:h-8 md:h-9 flex items-center justify-between px-[4px] sm:px-[5px] md:px-[6px] rounded-md cursor-pointer transition-all ${selectedTypes.includes(type.value) ? "bg-black" : "bg-black"
                          }`}
                      >
                        {/* Check Icon */}
                        <div
                          className={`w-5 sm:w-6 h-5 sm:h-6 flex items-center justify-center rounded-md transition-all ${selectedTypes.includes(type.value)
                            ? "bg-black text-[#461ABD]"
                            : "bg-white text-[#461ABD]"
                            } `}
                        >
                          <CloseIcon />
                        </div>

                        {/* Uncheck Icon */}
                        <div
                          className={`w-5 sm:w-6 h-5 sm:h-6 flex items-center justify-center rounded transition-all ${selectedTypes.includes(type.value)
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

                {/* Start Learning Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleStartLearning}
                    className="mt-8 w-[240px] sm:w-[280px] md:w-[320px] py-2 sm:py-3 border-2 border-black text-black rounded-lg text-md sm:text-lg shadow-lg hover:bg-purple-700 hover:text-white hover:border-transparent flex items-center justify-center"
                  >
                    {mode === "Time Pressured" ? (
                      "Continue" // This will not check mana points
                    ) : (
                      <>
                        START LEARNING! -0
                        <img
                          src={ManaIcon}
                          alt="Mana"
                          className="w-3 h-3 sm:w-4 sm:h-4 ml-2"
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Scroll Bar */}
            <div className="scroll-wrapper">
              <div className="scroll-holder"></div>
              <div className="scroll-bar"></div>
              <div className="scroll-holder"></div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default SetUpQuestionType;
