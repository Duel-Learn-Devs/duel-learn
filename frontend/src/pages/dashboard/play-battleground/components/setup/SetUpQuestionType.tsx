import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Snackbar } from "@mui/material"; // Import Snackbar and Alert from MUI
import "./../../styles/setupques.css";
import ManaIcon from "../../../../../assets/ManaIcon.png";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PageTransition from "../../../../../styles/PageTransition";

interface UpdateItem {
  term: string;
  definition: string;
  item_number: number;
  image: string | null;
}

const SetUpQuestionType: React.FC = () => {
  // Move all hooks to the top before any conditional logic
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, material, fromWelcome } = location.state || {};
  const [isComponentReady, setIsComponentReady] = useState(false);
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
  const [snackbarMessage, setSnackbarMessage] = useState(""); // State for snackbar message

  // Signal when component is fully ready
  useEffect(() => {
    const prepareComponent = async () => {
      try {
        // Add any necessary initialization here
        setIsComponentReady(true);
      } catch (error) {
        console.error('Error preparing component:', error);
      }
    };

    prepareComponent();
  }, []);

  // Redirect if not coming from welcome
  useEffect(() => {
    if (!fromWelcome) {
      navigate("/dashboard/welcome", {
        state: { mode, material },
        replace: true
      });
    }
  }, [fromWelcome, navigate, mode, material]);

  // Show nothing until everything is ready
  if (!isComponentReady || !fromWelcome) {
    return null;
  }

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

  const handleStartLearning = async () => {
    console.log("Starting learning process...");
    console.log("Selected Types:", selectedTypes);
    console.log("Mode:", mode);
    console.log("Material:", material);
    console.log("Mana Points:", manaPoints);
  
    if (selectedTypes.length === 0) {
      setSnackbarMessage("Please select at least one question type.");
      setOpenAlert(true);
      return;
    }
  
    if (mode !== "Time Pressured" && manaPoints < 10) {
      setOpenManaAlert(true);
      return;
    }
  
    try {
      const items = material?.items || [];
      console.log("Processing items:", items);
      const generatedQuestions: { question: string; answer: string }[] = [];
    
      for (const item of items) {
        console.log("Processing item:", item);
        const payload = {
          term: item.term,
          definition: item.definition,
          selectedQuestionTypes: selectedTypes,
          numberOfItems: 1
        };
        console.log("Sending payload to AI:", payload);
        
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/generate-questions`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("AI API Error Response:", errorData);
          throw new Error(errorData.error || `AI Server error: ${response.status}`);
        }

        const questions = await response.json();
        console.log("Received AI generated questions:", questions);
        generatedQuestions.push(...questions);
      }

      console.log("All generated questions:", generatedQuestions);

      // Create a deep copy of the material to transform
      const transformedMaterial = JSON.parse(JSON.stringify(material));
      
      // Transform each item with the generated questions
      transformedMaterial.items = transformedMaterial.items.map((item: any, index: number) => {
        const generatedQuestion = generatedQuestions[index];
        console.log(`Transforming item ${index}:`, { item, generatedQuestion });
        
        if (generatedQuestion?.question && generatedQuestion?.answer) {
          return {
            ...item,
            item_number: index + 1,
            originalTerm: item.term,
            originalDefinition: item.definition,
            term: generatedQuestion.answer,
            definition: generatedQuestion.question,
            isTransformed: true
          };
        }
        return {
          ...item,
          item_number: index + 1
        };
      });

      console.log("Transformed material with questions:", transformedMaterial);

      // Update the material in the database
      try {
        const updateUrl = `${import.meta.env.VITE_BACKEND_URL}/api/study-material/update/${material.study_material_id}`;
        console.log('Sending update request to:', updateUrl);

        const updateItems: UpdateItem[] = transformedMaterial.items.map((item: any) => ({
          term: item.term,
          definition: item.definition,
          item_number: item.item_number,
          image: item.image || null
        }));

        console.log('Prepared update items:', JSON.stringify(updateItems, null, 2));

        const updateResponse = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ items: updateItems })
        });

        console.log('Update response status:', updateResponse.status);
        const responseText = await updateResponse.text();
        console.log('Raw response:', responseText);

        if (!updateResponse.ok) {
          console.error('Update failed with status:', updateResponse.status);
          console.error('Error response:', responseText);
          throw new Error(`Update failed: ${updateResponse.status} - ${responseText}`);
        }

        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('Parsed response data:', responseData);
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          throw new Error('Failed to parse server response');
        }

        if (!responseData.items || !Array.isArray(responseData.items)) {
          console.error('Invalid response format:', responseData);
          throw new Error('Invalid response format from server');
        }

        console.log('Successfully updated study material:', responseData);
        transformedMaterial.items = responseData.items;

        // Navigation logic
        const navigationState = {
          mode,
          material: transformedMaterial,
          selectedTypes,
          questions: generatedQuestions,
          timeLimit: mode === "Time Pressured" ? undefined : null
        };

        console.log("Navigation state:", navigationState);

        if (mode === "Peaceful") {
          navigate("/dashboard/loading-screen", { state: navigationState });
        } else if (mode === "Time Pressured") {
          navigate("/dashboard/setup/timer", { state: navigationState });
        } else {
          navigate("/dashboard/pvp-lobby", { state: navigationState });
        }

      } catch (error: unknown) {
        console.error("Error in update process:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update study material';
        setSnackbarMessage(errorMessage);
        setOpenAlert(true);
      }
    } catch (error: unknown) {
      console.error("Error in handleStartLearning:", error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing';
      setSnackbarMessage(errorMessage);
      setOpenAlert(true);
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
            {snackbarMessage}
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
                        START LEARNING!
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
