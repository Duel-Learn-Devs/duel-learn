import React, { useState, useEffect, useMemo } from "react";
import { Button, Fab, Box, Typography } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import PersonalizationBG from "/UserOnboarding/PersonalizationBG.png";
import PurpleGem from "/General/PurpleGem.png";
import { useNavigate } from "react-router-dom";
import { topics } from "./data/topics";
import PageTransition from "../../styles/PageTransition";
import { useAudio } from "../../contexts/AudioContext";
import { useUser } from "../../contexts/UserContext";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import DocumentHead from "../../components/DocumentHead";

const MIN_SUBJECTS = 3;
const MAX_SUBJECTS = 5;

// Star colors array
const starColors = [
  "bg-gradient-to-br from-[#A38CE6] to-[#4D18E8]", // Purple gradient
  "bg-gradient-to-br from-[#7B3FFF] to-[#4D18E8]", // Brighter purple gradient
  "bg-gradient-to-br from-[#E2DDF3] to-[#A38CE6]", // Light purple gradient
  "bg-white", // Some white stars for contrast
];

// Star sizes array with corresponding classes
const starSizes = [
  "w-0.5 h-0.5", // Tiny (was w-1 h-1)
  "w-1.5 h-1.5", // Small (was w-2 h-2)
  "w-2 h-2", // Medium (was w-3 h-3)
  "w-3 h-3", // Large (was w-4 h-4)
];

// Enhanced Star component with size and color
interface StarProps {
  delay: number;
  left: string;
  top: string;
  size: string;
  color: string;
}

const Star: React.FC<StarProps> = ({ delay, left, top, size, color }) => (
  <motion.div
    className={`absolute ${size} ${color} rounded-full shadow-glow`}
    style={{
      left,
      top,
      filter: "blur(0.5px)",
      boxShadow: "0 0 8px rgba(163, 140, 230, 0.5)",
    }}
    animate={{
      scale: [1, 1.8, 1],
      opacity: [0.2, 1, 0.2],
      filter: [
        "blur(0.5px) brightness(1)",
        "blur(1px) brightness(1.5)",
        "blur(0.5px) brightness(1)",
      ],
    }}
    transition={{
      duration: Math.random() * 2 + 2, // Random duration between 2-4 seconds
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Enhanced generate stars function
const generateStars = (count: number, side: "left" | "right") => {
  return Array.from({ length: count }).map((_, i) => {
    const delay = Math.random() * 3; // More varied delays
    const top = `${Math.random() * 100}%`;
    const sidePosition = `${Math.random() * 20}%`; // Wider distribution
    const left =
      side === "left" ? sidePosition : `${100 - parseFloat(sidePosition)}%`;

    // Randomly select size and color with weighted distribution
    const sizeIndex =
      Math.floor(Math.random() * 100) < 70
        ? Math.floor(Math.random() * 2) // 70% chance of smaller stars
        : Math.floor(Math.random() * 2) + 2; // 30% chance of larger stars

    const colorIndex = Math.floor(Math.random() * starColors.length);

    return (
      <Star
        key={`${side}-${i}`}
        delay={delay}
        left={left}
        top={top}
        size={starSizes[sizeIndex]}
        color={starColors[colorIndex]}
      />
    );
  });
};

// Add global styles for the glow effect
const globalStyles = `
  .shadow-glow {
    animation: glow 4s ease-in-out infinite;
  }
  
  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 8px rgba(163, 140, 230, 0.5);
    }
    50% {
      box-shadow: 0 0 16px rgba(163, 140, 230, 0.8);
    }
  }
`;

const Personalization: React.FC = () => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [visibleIndices, setVisibleIndices] = useState(topics.map(() => 0));
  const [isSaving, setIsSaving] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();
  const { playUserOnboardingAudio } = useAudio();
  const { user } = useUser();
  const subjectsPerView = 5;

  // Memoize the stars so they don't regenerate on re-renders
  const leftStars = useMemo(() => generateStars(25, "left"), []);
  const rightStars = useMemo(() => generateStars(25, "right"), []);

  // Load existing personalization data
  useEffect(() => {
    const loadPersonalization = async () => {
      if (user?.firebase_uid) {
        try {
          const response = await axios.get(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/user-info/user-personalization/${user.firebase_uid}`
          );
          if (response.data?.success && Array.isArray(response.data.data)) {
            setSelectedSubjects(response.data.data);
            // If we loaded existing subjects, then we're in edit mode
            if (response.data.data.length > 0) {
              setIsEditMode(true);
            }
          }
        } catch (error) {
          console.error("Error loading personalization:", error);
        }
      }
    };
    loadPersonalization();
  }, [user?.firebase_uid]);

  useEffect(() => {
    const img = new Image();
    img.src = PersonalizationBG;
    img.onload = () => {
      setTimeout(() => {
        setIsLoaded(true);
        setImageLoaded(true);
        document.body.style.overflow = "auto";
      }, 1000);
    };
    img.onerror = () => {
      console.error("Failed to load background image.");
      setTimeout(() => {
        setIsLoaded(true);
        setImageLoaded(true);
        document.body.style.overflow = "auto";
      }, 2000);
    };
    document.body.style.overflow = "hidden";
  }, []);

  // Add global styles once when component mounts
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = globalStyles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const handleClickDone = async () => {
    if (!user?.firebase_uid) {
      console.error("No user ID found");
      return;
    }

    if (selectedSubjects.length < MIN_SUBJECTS) {
      return;
    }

    setIsSaving(true);
    try {
      // Use different endpoint when editing vs initial setup
      const endpoint = isEditMode
        ? "update-personalization"
        : "personalization";

      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/user-info/${endpoint}/${
          user.firebase_uid
        }`,
        {
          selectedSubjects,
        }
      );

      setIsExiting(true);
      await playUserOnboardingAudio();

      // Different navigation path based on edit mode
      setTimeout(() => {
        // If editing, go back to dashboard instead of tutorial
        navigate(
          isEditMode ? "/dashboard/home" : "/dashboard/tutorial/step-two"
        );
      }, 500);
    } catch (error) {
      console.error("Error saving personalization:", error);
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (user?.firebase_uid) {
      try {
        // Save empty preferences when skipping
        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/user-info/personalization/${
            user.firebase_uid
          }`,
          {
            selectedSubjects: [],
          }
        );
      } catch (error) {
        console.error("Error saving empty personalization:", error);
      }
    }

    setSelectedSubjects([]);
    await playUserOnboardingAudio();
    navigate("/dashboard/tutorial/step-two");
  };

  const handleSubjectClick = (subject: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subject)) {
        // Always allow removing subjects
        return prev.filter((s) => s !== subject);
      } else if (prev.length >= MAX_SUBJECTS) {
        // Don't add if maximum is reached
        return prev;
      }
      // Add the new subject
      return [...prev, subject];
    });
  };

  const getButtonText = () => {
    if (isSaving) return "Saving...";
    if (selectedSubjects.length < MIN_SUBJECTS) {
      const remaining = MIN_SUBJECTS - selectedSubjects.length;
      return `Select ${
        remaining === 1 ? "one" : remaining === 2 ? "two" : "three"
      } more`;
    }
    return isEditMode ? "Save Changes" : "Done";
  };

  if (!isLoaded) {
    return (
      <PageTransition>
        <div className="flex justify-center items-center h-screen w-full bg-[#080511]">
          <div className="border-8 border-white border-opacity-20 border-t-white rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </PageTransition>
    );
  }

  const handleScrollAnimated = (
    topicIndex: number,
    direction: "left" | "right"
  ) => {
    setVisibleIndices((prev) => {
      const newIndices = [...prev];
      const totalSubjects = topics[topicIndex].subjects.length;
      const maxIndex = Math.max(0, totalSubjects - subjectsPerView);

      if (direction === "left" && newIndices[topicIndex] > 0) {
        newIndices[topicIndex] = Math.max(newIndices[topicIndex] - 1, 0);
      }
      if (direction === "right" && newIndices[topicIndex] < maxIndex) {
        newIndices[topicIndex] = Math.min(newIndices[topicIndex] + 1, maxIndex);
      }

      return newIndices;
    });
  };

  return (
    <PageTransition>
      <DocumentHead title="Personalization" />
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen overflow-hidden text-white p-6 flex flex-col items-center relative"
          >
            {/* Stars Container */}
            <div className="fixed inset-0 pointer-events-none z-0">
              {leftStars}
              {rightStars}
            </div>

            {/* Purple Gem Icon */}
            <img
              src={PurpleGem}
              alt="Purple Gem"
              className="absolute top-[110px] left-1/2 transform -translate-x-1/2 w-[100px] h-[100px]"
            />

            {/* Done Button */}
            <div className="mt-8 mr-10 flex justify-end w-full z-10 fixed top-0 right-0">
              <Button
                sx={{
                  textTransform: "none",
                  minWidth: "180px",
                  padding: "10px 24px",
                  fontSize: "1rem",
                  borderRadius: "0.8rem",
                  backgroundColor:
                    selectedSubjects.length >= MIN_SUBJECTS
                      ? "#4D18E8"
                      : "#211D2F",
                  color:
                    selectedSubjects.length >= MIN_SUBJECTS
                      ? "white"
                      : "#6F658D",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor:
                      selectedSubjects.length >= MIN_SUBJECTS
                        ? "#7B3FFF"
                        : "#2D1A66",
                    color:
                      selectedSubjects.length >= MIN_SUBJECTS
                        ? "white"
                        : "#6F658D",
                  },
                  "&:disabled": {
                    backgroundColor: "#211D2F",
                    color: "#6F658D",
                    cursor: "not-allowed",
                  },
                }}
                variant="contained"
                onClick={handleClickDone}
                disabled={isSaving || selectedSubjects.length < MIN_SUBJECTS}
              >
                {getButtonText()}
              </Button>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold mb-5 mt-60 z-10">
              Your Magical Journey Starts Here!
            </h1>
            <p className="text-lg mb-20 text-center text-[#786d99] z-10">
              Select up to 5 topics to open the gates to a world of personalized
              discovery.
            </p>

            {/* Categories and Subjects */}
            <div className="w-full max-w-6xl mx-auto flex flex-col items-center relative z-10">
              {topics.map((category, topicIndex) => {
                const totalSubjects = category.subjects.length;
                const startIdx = visibleIndices[topicIndex];
                const maxIndex = Math.max(0, totalSubjects - subjectsPerView);
                const canScrollRight = startIdx < maxIndex;

                return (
                  <div key={topicIndex} className="mb-16 relative group w-full">
                    <h2 className="text-lg font-semibold mb-7">
                      {category.topic}
                    </h2>
                    <Box
                      sx={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        height: "auto",
                        overflow: "hidden",
                      }}
                    >
                      {startIdx > 0 && (
                        <Fab
                          onClick={() =>
                            handleScrollAnimated(topicIndex, "left")
                          }
                          sx={{
                            position: "absolute",
                            left: "1rem",
                            zIndex: 1,
                            backgroundColor: "transparent",
                            "& .MuiSvgIcon-root": { color: "#3B354D" },
                            "&:hover": {
                              backgroundColor: "#3B354D",
                              "& .MuiSvgIcon-root": { color: "#E2DDF3" },
                            },
                          }}
                          color="primary"
                          size="small"
                        >
                          <ArrowBackIos fontSize="small" />
                        </Fab>
                      )}

                      {/* Smooth Scrolling Container */}
                      <Box
                        sx={{
                          display: "flex",
                          transition: "transform 0.4s ease-in-out",
                          transform: `translateX(-${startIdx * 20}%)`,
                          width: `${
                            Math.max(totalSubjects, subjectsPerView) * 20
                          }%`, // Ensure minimum width for small categories
                        }}
                      >
                        {category.subjects.map((subject, idx) => {
                          const isSelected = selectedSubjects.includes(
                            subject.name
                          );
                          const canSelect =
                            selectedSubjects.length < MAX_SUBJECTS ||
                            isSelected;

                          return (
                            <Box
                              key={idx}
                              sx={{
                                flex: `0 0 ${100 / subjectsPerView}%`, // Fixed width based on subjectsPerView
                                paddingY: "0.5rem",
                                paddingRight: "0.5rem",
                              }}
                            >
                              <button
                                className={`p-4 rounded-[0.8rem] transition-all duration-300 ease-in-out h-[204px] w-full ${
                                  isSelected
                                    ? "bg-[#A28CE2] text-[#322168] font-bold -translate-y-2"
                                    : "bg-white text-[#322168] font-bold hover:bg-[#A28CE2] transform ease-in-out hover:-translate-y-2"
                                } ${
                                  !canSelect && !isSelected
                                    ? "opacity-40 hover:bg-white"
                                    : ""
                                }`}
                                onClick={() => handleSubjectClick(subject.name)}
                                disabled={!canSelect && !isSelected}
                              >
                                <div className="flex flex-col items-center">
                                  {subject.icon}
                                  <span className="mt-2">{subject.name}</span>
                                </div>
                              </button>
                            </Box>
                          );
                        })}
                        {/* Add empty boxes to maintain consistent width for smaller categories */}
                        {totalSubjects < subjectsPerView &&
                          Array.from({
                            length: subjectsPerView - totalSubjects,
                          }).map((_, idx) => (
                            <Box
                              key={`empty-${idx}`}
                              sx={{
                                flex: `0 0 ${100 / subjectsPerView}%`,
                                padding: "0 0.5rem",
                              }}
                            >
                              <div className="p-4 border border-transparent rounded-lg h-[204px] w-full" />
                            </Box>
                          ))}
                      </Box>

                      {canScrollRight && (
                        <Fab
                          onClick={() =>
                            handleScrollAnimated(topicIndex, "right")
                          }
                          sx={{
                            position: "absolute",
                            right: "1rem",
                            zIndex: 1,
                            backgroundColor: "transparent",
                            "& .MuiSvgIcon-root": { color: "#3B354D" },
                            "&:hover": {
                              backgroundColor: "#3B354D",
                              "& .MuiSvgIcon-root": { color: "#E2DDF3" },
                            },
                          }}
                          color="primary"
                          size="small"
                        >
                          <ArrowForwardIos fontSize="small" />
                        </Fab>
                      )}
                    </Box>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default Personalization;
