import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Snackbar } from "@mui/material"; // Import Snackbar and Alert from MUI
import "./../styles/setupques.css";
import ManaIcon from "../../../../assets/ManaIcon.png";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Slider } from "@mui/material";

const SetUpTimeQuestion: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, material, selectedTypes } = location.state || {};
  console.log(
    "Mode:",
    mode,
    "Material:",
    material,
    "Selected Types:",
    selectedTypes
  );

  const [timeLimit, setTimeLimit] = useState(10);
  const [manaPoints, setManaPoints] = useState(10); // Example starting mana points
  const [openManaAlert, setOpenManaAlert] = useState(false); // State for the mana points alert

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    setTimeLimit(newValue as number);
  };

  // Handle back button click
  const handleBackClick = () => {
    navigate("/dashboard/setup/questions", {
      state: {
        mode, // Pass back the mode
        material, // Pass back the material
      },
    });
  };

  // Handle Start Learning button click
  const handleStartLearning = () => {
    if (manaPoints < 10) {
      setOpenManaAlert(true); // Show the alert if mana points are below 10
    } else {
      console.log("Starting learning with time limit:", timeLimit, "seconds.");
      // Navigate to loading screen with all parameters
      navigate("/dashboard/loading-screen", {
        state: {
          mode: "Time Pressured",
          material,
          selectedTypes,
          timeLimit: timeLimit // Convert seconds to minutes
        },
      });
    }
  };

  const handleCloseManaAlert = () => {
    setOpenManaAlert(false); // Close the mana alert when the user acknowledges it
  };

  return (
    <div className="relative h-screen text-white px-6 py-8 overflow-hidden overflow-y-hidden">
      {/* Full-Width Fixed Header */}
      <div className="absolute top-0 left-0 w-full sm:px-8 md:px-16 lg:px-32 px-12 mt-5 py-12 flex justify-between items-center">
        {/* Left Side: Back Button + Title + Subtitle */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          <IconButton
            className="text-gray-300"
            style={{
              border: "2px solid #6F658D",
              borderRadius: "50%",
              padding: "4px",
              color: "#6F658D",
            }}
            onClick={handleBackClick} // Add onClick to navigate back
          >
            <ArrowBackIcon />
          </IconButton>

          <div>
            <h2 className="text-[16px] uppercase sm:text-[18px] md:text-[20px] lg:text-[22px] font-semibold mb-1">
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
              <h3 className="text-[20px] mt-2 sm:text-[22px] md:text-[24px] lg:text-[29px] font-bold text-black">
                Set Answer Timer
              </h3>
              <p className="text-[12px] mt-1 sm:text-[15px] text-[#000000]">
                Slide to your desired response limit.
              </p>

              {/* Timer Slider */}
              <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mt-4 px-4 sm:px-6 mx-auto">
                <Slider
                  value={timeLimit}
                  onChange={handleSliderChange}
                  min={10}
                  max={60}
                  step={10}
                  sx={{
                    color: "#271D47",
                    height: 20,
                    "& .MuiSlider-thumb": {
                      width: 19,
                      height: 19,
                      backgroundColor: "#6F658D",
                      border: "6px solid #fff",
                    },
                    "& .MuiSlider-track": {
                      border: "none",
                    },
                    "& .MuiSlider-rail": {
                      opacity: 1,
                      backgroundColor: "#271D47",
                    },
                  }}
                />
                <div className="flex justify-between text-xs sm:text-sm md:text-base mb-6 sm:mb-8 mx-2 sm:mx-4 text-slate-700">
                  <span>10</span>
                  <span>20</span>
                  <span>30</span>
                  <span>40</span>
                  <span>50</span>
                  <span>60</span>
                </div>
              </div>

              {/* Timer Info */}
              <p className="text-[14px] w-full lg:w-[353px] mx-auto px-1 text-gray-600">
                You will be given{" "}
                <span className="font-bold text-black">
                  {timeLimit} seconds
                </span>{" "}
                to answer each question.
              </p>

              {/* Start Learning Button */}
              <button
                onClick={handleStartLearning}
                className="mt-8 sm:mt-10 w-full max-w-[250px] mx-auto sm:max-w-[300px] md:max-w-[350px] py-2 sm:py-3 border-2 border-black text-black rounded-lg text-md sm:text-lg shadow-lg hover:bg-purple-700 hover:text-white hover:border-transparent flex items-center justify-center"
              >
                START LEARNING! -0
                <img src={ManaIcon} alt="Mana" className="w-3 sm:w-4 ml-2" />
              </button>
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
  );
};

export default SetUpTimeQuestion;
