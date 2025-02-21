import React, { useState, useEffect } from "react";
import { Button, Fab, Box } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import PersonalizationBG from "../../assets/UserOnboarding/PersonalizationBG.png";
import PurpleGem from "../../assets/General/PurpleGem.png";
import { useNavigate } from "react-router-dom";
import { topics } from "./data/topics";
import PageTransition from "../../styles/PageTransition";

const Personalization: React.FC = () => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [visibleIndices, setVisibleIndices] = useState(
    topics.map(() => 0)
  );
  const navigate = useNavigate();
  const subjectsPerView = 5; // Number of subjects to display at once

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

  const handleClickDone = () => {
    alert(`Selected topics: ${selectedSubjects.join(", ")}`);
    navigate("/dashboard/tutorial/step-two");
  };

  const handleSubjectClick = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleScroll = (topicIndex: number, direction: "left" | "right") => {
    setVisibleIndices((prev) => {
      const newIndices = [...prev];
      const totalSubjects = topics[topicIndex].subjects.length;
      const maxIndex = Math.max(0, totalSubjects - 5);

      if (direction === "left" && newIndices[topicIndex] > 0) {
        newIndices[topicIndex] -= 1;
      }
      if (direction === "right" && newIndices[topicIndex] < maxIndex) {
        newIndices[topicIndex] += 1;
      }

      return newIndices;
    });
  };

  if (!isLoaded) {
    return (
      <PageTransition>
        <div className="flex justify-center items-center h-screen w-full bg-[#080511]">
          <div className="border-8 border-white border-opacity-20 border-t-white rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </PageTransition>
    );
  };

  const handleScrollAnimated = (topicIndex: number, direction: "left" | "right") => {
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
      <div className="min-h-screen overflow-hidden text-white p-6 flex flex-col items-center relative">
        {/* Background Image */}
        <img
          src={imageLoaded ? PersonalizationBG : ""}
          alt="Personalization Background"
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-auto z-[-1]"
        />
        {/* Purple Gem Icon */}
        <img
          src={PurpleGem}
          alt="Purple Gem"
          className="absolute top-[110px] left-1/2 transform -translate-x-1/2 w-[100px] h-[100px]"
        />
        {/* Skip and Done Buttons */}
        <div className="mt-8 mr-20 flex justify-end w-full gap-4">
          <Button
            sx={{
              textTransform: "capitalize",
              color: "#7F6F8B",
              padding: "10px 20px",
              "&:hover": { color: "white" },
            }}
            onClick={() => {
              setSelectedSubjects([]);
              navigate("/dashboard/tutorial/step-two");
            }}
          >
            Skip
          </Button>
          {selectedSubjects.length > 0 && (
            <Button
              sx={{
                textTransform: "capitalize",
                backgroundColor: "#4D18E8",
                color: "white",
                "&:hover": { backgroundColor: "#7B3FFF", color: "white" },
              }}
              variant="contained"
              onClick={handleClickDone}
            >
              Done
            </Button>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-5 mt-36">Your Magical Journey Starts Here!</h1>
        <p className="text-lg mb-20 text-center text-[#786d99]">
          Select topics to open the gates to a world of personalized discovery.
        </p>

        {/* Categories and Subjects */}
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
          {topics.map((category, topicIndex) => {
            const totalSubjects = category.subjects.length;
            const startIdx = visibleIndices[topicIndex];
            const maxIndex = Math.max(0, totalSubjects - subjectsPerView);
            const canScrollRight = startIdx < maxIndex;
  
            return (
              <div key={topicIndex} className="mb-16 relative group w-full">
                <h2 className="text-lg font-semibold mb-7">{category.topic}</h2>
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
                      onClick={() => handleScrollAnimated(topicIndex, "left")}
                      sx={{
                        position: "absolute",
                        left: "1rem",
                        zIndex: 1,
                        backgroundColor: "transparent",
                        "& .MuiSvgIcon-root": { color: "#3B354D" },
                        "&:hover": { backgroundColor: "#3B354D", "& .MuiSvgIcon-root": { color: "#E2DDF3" } },
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
                      transform: `translateX(-${startIdx * 20}%)`, // 5 cards -> 20% each
                      width: `${totalSubjects * 20}%`, // Dynamic width based on number of subjects
                    }}
                  >
                    {category.subjects.map((subject, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          flex: "0 0 20%",
                          padding: "0 0.5rem",
                        }}
                      >
                        <button
                          className={`p-4 border rounded-lg transition-all h-[204px] w-full ${
                            selectedSubjects.includes(subject.name)
                              ? "bg-[#A28CE2] border-indigo-400 font-bold text-[#322168]"
                              : "bg-white text-[#322168] font-bold hover:bg-gray-200"
                          }`}
                          onClick={() => handleSubjectClick(subject.name)}
                        >
                          <div className="flex flex-col items-center">
                            {subject.icon}
                            <span className="mt-2">{subject.name}</span>
                          </div>
                        </button>
                      </Box>
                    ))}
                  </Box>
  
                  {canScrollRight && (
                    <Fab
                      onClick={() => handleScrollAnimated(topicIndex, "right")}
                      sx={{
                        position: "absolute",
                        right: "1rem",
                        zIndex: 1,
                        backgroundColor: "transparent",
                        "& .MuiSvgIcon-root": { color: "#3B354D" },
                        "&:hover": { backgroundColor: "#3B354D", "& .MuiSvgIcon-root": { color: "#E2DDF3" } },
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
      </div>
    </PageTransition>
  );
  
};

export default Personalization;