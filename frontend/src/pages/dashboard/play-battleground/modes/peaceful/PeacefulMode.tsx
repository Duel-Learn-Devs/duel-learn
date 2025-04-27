import React, { useState, useEffect, useRef } from "react";
import { useGameLogic } from "../../hooks/useGameLogic";
import FlashCard from "../../components/common/FlashCard";
import Header from "../../components/common/Header";
import Timer from "../../components/common/Timer";
import axios from "axios";
import { useAudio } from "../../../../../contexts/AudioContext";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { nanoid } from "nanoid";
import { useUser } from "../../../../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import GeneralLoadingScreen from "../../../../../components/LoadingScreen";
import DocumentHead from "../../../../../components/DocumentHead";

interface PeacefulModeProps {
  mode: string;
  material: any;
  selectedTypes: string[];
}

// Add interface for API response
interface SessionReportResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  error?: string;
}

// Add interface for session data
interface SessionData {
  correctCount: number;
  incorrectCount: number;
  highestStreak: number;
  earnedXP: number;
  timeSpent: string;
}

// Add interface for session payload
interface SessionPayload {
  session_id: string;
  study_material_id: string;
  title: string;
  summary: string;
  session_by_user_id: string;
  session_by_username: string;
  status: string;
  ends_at: string;
  exp_gained: number;
  coins_gained: number | null;
  game_mode: string | null;
  total_time: string;
  mastered: number;
  unmastered: number;
}

const PeacefulMode: React.FC<PeacefulModeProps> = ({
  mode,
  material,
  selectedTypes,
}) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(true);
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const { playCorrectAnswerSound, playIncorrectAnswerSound, playPeacefulModeAudio, activeAudio } = useAudio();
  const { user } = useUser();
  const navigate = useNavigate();

  // Add state for session ID
  const [sessionId] = useState(nanoid());

  // Add state to track if session has been saved
  const [hasSessionSaved, setHasSessionSaved] = useState(false);

  // Add state to track if game is ended by user
  const [isGameEndedByUser, setIsGameEndedByUser] = useState(false);

  // Add audio refs
  const backgroundMusicRef = useRef<HTMLAudioElement>(null);
  const correctAnswerSoundRef = useRef<HTMLAudioElement>(null);
  const incorrectAnswerSoundRef = useRef<HTMLAudioElement>(null);
  const sessionIncompleteRef = useRef<HTMLAudioElement>(null);
  const sessionCompleteRef = useRef<HTMLAudioElement>(null);

  // Add audio context and gain node refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  const effectsGainNodeRef = useRef<GainNode | null>(null);
  const connectedElementsRef = useRef<Set<HTMLAudioElement>>(new Set());

  // Add state for volume control
  const [masterVolume, setMasterVolume] = useState(() => {
    const savedSettings = localStorage.getItem("duel-learn-audio-settings");
    if (savedSettings) {
      const { master } = JSON.parse(savedSettings);
      return master || 100;
    }
    return 100;
  });

  const [musicVolume, setMusicVolume] = useState(() => {
    const savedSettings = localStorage.getItem("duel-learn-audio-settings");
    if (savedSettings) {
      const { music } = JSON.parse(savedSettings);
      return music || 100;
    }
    return 100;
  });

  const [soundEffectsVolume, setSoundEffectsVolume] = useState(() => {
    const savedSettings = localStorage.getItem("duel-learn-audio-settings");
    if (savedSettings) {
      const { effects } = JSON.parse(savedSettings);
      return effects || 100;
    }
    return 100;
  });

  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  // Initialize audio context and gain nodes
  useEffect(() => {
    console.log("[Audio] Starting audio context initialization");
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      console.log("[Audio] Creating new AudioContext");
      audioContextRef.current = new AudioContext();
    }

    // Create gain nodes if they don't exist
    if (!musicGainNodeRef.current) {
      console.log("[Audio] Creating music gain node");
      musicGainNodeRef.current = audioContextRef.current.createGain();
      musicGainNodeRef.current.connect(audioContextRef.current.destination);
    }
    if (!effectsGainNodeRef.current) {
      console.log("[Audio] Creating effects gain node");
      effectsGainNodeRef.current = audioContextRef.current.createGain();
      effectsGainNodeRef.current.connect(audioContextRef.current.destination);
    }

    // Connect audio elements to gain nodes if not already connected
    const connectAudioElement = (element: HTMLAudioElement | null, gainNode: GainNode) => {
      if (!element || connectedElementsRef.current.has(element)) return;
      
      try {
        console.log("[Audio] Connecting audio element to gain node");
        const source = audioContextRef.current!.createMediaElementSource(element);
        source.connect(gainNode);
        connectedElementsRef.current.add(element);
      } catch (error) {
        console.error("[Audio] Error connecting audio element:", error);
      }
    };

    // Connect background music
    if (backgroundMusicRef.current) {
      console.log("[Audio] Connecting background music");
      connectAudioElement(backgroundMusicRef.current, musicGainNodeRef.current);
    }

    // Connect sound effects
    const soundRefs = [
      correctAnswerSoundRef.current,
      incorrectAnswerSoundRef.current,
      sessionIncompleteRef.current,
      sessionCompleteRef.current
    ].filter(Boolean);

    soundRefs.forEach(ref => {
      if (ref) {
        console.log("[Audio] Connecting sound effect");
        connectAudioElement(ref, effectsGainNodeRef.current!);
      }
    });

    return () => {
      console.log("[Audio] Cleaning up audio context");
      // Cleanup when component unmounts
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      musicGainNodeRef.current = null;
      effectsGainNodeRef.current = null;
      connectedElementsRef.current.clear();
    };
  }, []);

  // Update audio volumes when sliders change
  useEffect(() => {
    if (!audioContextRef.current || !musicGainNodeRef.current || !effectsGainNodeRef.current) {
      console.log("[Audio] Cannot update volumes - audio context or gain nodes not initialized");
      return;
    }

    console.log("[Audio] Updating audio volumes:", {
      master: masterVolume,
      music: musicVolume,
      effects: soundEffectsVolume
    });

    // Calculate actual volumes by applying master volume percentage
    const actualMusicVolume = (musicVolume / 100) * (masterVolume / 100);
    const actualSoundEffectsVolume = (soundEffectsVolume / 100) * (masterVolume / 100);

    // Update gain nodes
    musicGainNodeRef.current.gain.value = actualMusicVolume;
    effectsGainNodeRef.current.gain.value = actualSoundEffectsVolume;

    // Store the current volume settings in localStorage for persistence
    localStorage.setItem('duel-learn-audio-settings', JSON.stringify({
      master: masterVolume,
      music: musicVolume,
      effects: soundEffectsVolume
    }));
  }, [masterVolume, musicVolume, soundEffectsVolume]);

  // Add audio elements to the component
  useEffect(() => {
    // Only initialize audio after questions are loaded
    if (!aiQuestions || aiQuestions.length === 0) {
      console.log("[Audio] Skipping audio initialization - questions not loaded yet");
      return;
    }

    console.log("[Audio] Setting up audio elements");
    // Create and configure audio elements
    if (backgroundMusicRef.current) {
      console.log("[Audio] Setting background music source to peaceful-mode.mp3");
      backgroundMusicRef.current.src = "/sounds-sfx/peaceful-mode.mp3";
      backgroundMusicRef.current.loop = true; // Music should loop

      // Add event listeners for debugging
      backgroundMusicRef.current.addEventListener('loadeddata', () => {
        console.log("[Audio] Background music loaded successfully");
      });
      
      backgroundMusicRef.current.addEventListener('play', () => {
        console.log("[Audio] Background music started playing");
      });
      
      backgroundMusicRef.current.addEventListener('error', (e) => {
        console.error("[Audio] Error with background music:", e);
      });
    }

    const soundEffects = [
      { ref: correctAnswerSoundRef, src: "/sounds-sfx/right-answer.mp3" },
      { ref: incorrectAnswerSoundRef, src: "/sounds-sfx/wrong-answer.mp3" },
      { ref: sessionIncompleteRef, src: "/sounds-sfx/session-incomplete.wav" },
      {
        ref: sessionCompleteRef,
        src: "/sounds-sfx/session_report_completed.mp3",
      },
    ];

    // Configure sound effects
    soundEffects.forEach(({ ref, src }) => {
      if (ref.current) {
        console.log(`[Audio] Setting sound effect source to ${src}`);
        ref.current.src = src;
      }
    });

    // Start playing background music when component mounts
    const startAudioPlayback = async () => {
      if (!backgroundMusicRef.current) return;

      try {
        // Ensure audio context is running
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          console.log("[Audio] Resuming suspended audio context");
          await audioContextRef.current.resume();
        }

        // Set initial volume
        if (musicGainNodeRef.current) {
          const actualMusicVolume = (musicVolume / 100) * (masterVolume / 100);
          musicGainNodeRef.current.gain.value = actualMusicVolume;
        }

        console.log("[Audio] Attempting to play background music");
        await backgroundMusicRef.current.play();
        console.log("[Audio] Background music playback started successfully");
      } catch (error) {
        console.error("[Audio] Error playing background music:", error);
      }
    };

    // Start audio playback
    startAudioPlayback();

    // Cleanup function to stop all sounds when component unmounts
    return () => {
      console.log("[Audio] Cleaning up audio elements");
      const allRefs = [
        backgroundMusicRef,
        correctAnswerSoundRef,
        incorrectAnswerSoundRef,
        sessionIncompleteRef,
        sessionCompleteRef,
      ];

      allRefs.forEach((ref) => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
    };
  }, [aiQuestions, masterVolume, musicVolume]); // Add dependencies to re-run when questions are loaded or volumes change

  // Generate AI questions when component mounts
  useEffect(() => {
    const generateAIQuestions = async () => {
      if (aiQuestions.length > 0) {
        console.log("Questions already exist in state, skipping generation");
        setIsGeneratingAI(false);
        return;
      }

      if (!material?.study_material_id) {
        console.error("No study material ID provided");
        setIsGeneratingAI(false);
        return;
      }

      console.log("Starting AI question generation in PeacefulMode");
      console.log("Study material ID:", material.study_material_id);
      console.log("Selected types:", selectedTypes);

      // Add debugging to inspect the material structure
      console.log("Material structure:", {
        id: material.id,
        study_material_id: material.study_material_id,
        title: material.title,
        itemsCount: material.items?.length || 0,
      });

      // Log the first few items to check for item_id
      if (material.items && material.items.length > 0) {
        console.log("First 3 items raw data:", material.items.slice(0, 3));
      }

      setIsGeneratingAI(true);

      try {
        // Clear existing questions first
        const clearEndpoint = `${
          import.meta.env.VITE_BACKEND_URL
        }/api/openai/clear-questions/${material.study_material_id}`;
        let clearSuccess = false;

        try {
          console.log("Attempting to clear peaceful mode questions...");
          const clearResponse = await axios.delete<{
            success: boolean;
            error?: string;
          }>(clearEndpoint, {
            params: { gameMode: "peaceful" },
          });

          if (!clearResponse.data.success) {
            console.warn(
              "Failed to clear existing questions:",
              clearResponse.data.error
            );
            // We'll continue without clearing
          } else {
            console.log("Successfully cleared peaceful mode questions");
            clearSuccess = true;
          }
        } catch (clearError) {
          console.warn("Error clearing existing questions:", clearError);
          // Continue with question generation despite the error
        }

        // If we couldn't clear questions, we'll use REPLACE INTO in the API endpoints
        if (!clearSuccess) {
          console.log(
            "Will rely on REPLACE INTO statements in API endpoints to handle duplicates"
          );
        }

        // Continue with question generation
        if (!material) {
          console.error("No material provided");
          return;
        }

        if (!Array.isArray(material.items) || material.items.length === 0) {
          console.error("Material has no valid items array:", material);
          return;
        }

        // First, let's add logging to see the original items
        console.log("Original material items:", material.items);

        // Create an array of items with proper IDs and image handling
        const items = [...material.items].map((item, index) => {
          // Use the original item_id if available, otherwise fallback to the sequential ID
          const itemNumber = index + 1;
          const hasImage =
            item.image &&
            item.image !== "NULL" &&
            item.image.startsWith("data:image"); // Check if image is base64 data

          return {
            ...item,
            id: item.item_id || item.id || itemNumber,
            item_id: item.item_id || item.id || itemNumber,
            item_number: itemNumber, // Keep item_number as sequential for display purposes
            term: item.term,
            definition: item.definition,
            // Only include image if it's base64 data
            ...(hasImage
              ? {
                  image: item.image,
                }
              : {
                  image: null,
                }),
          };
        });

        const shuffledItems = items.sort(() => Math.random() - 0.5);

        // Log the first few items to verify the data structure
        console.log(
          "First few items with full data:",
          shuffledItems.slice(0, 3).map((item) => ({
            item_id: item.item_id,
            item_number: item.item_number,
            term: item.term,
            definition: item.definition,
            image: item.image,
          }))
        );

        const totalItems = items.length;
        const typesCount = selectedTypes.length;

        // Validate selected types
        const validTypes = ["identification", "multiple-choice", "true-false"];
        selectedTypes.forEach((type) => {
          if (!validTypes.includes(type)) {
            console.warn(`Warning: Unknown question type "${type}"`);
          }
        });

        // Calculate distribution of questions per type
        const distribution = selectedTypes.reduce((acc, type, index) => {
          if (index === typesCount - 1) {
            acc[type] =
              totalItems -
              Object.values(acc).reduce((sum, val) => sum + val, 0);
          } else {
            acc[type] = Math.max(1, Math.floor(totalItems / typesCount));
          }
          return acc;
        }, {} as Record<string, number>);

        console.log("Question distribution for", totalItems, "items:");
        Object.entries(distribution).forEach(([type, count]) => {
          console.log(`- ${type}: ${count} questions`);
        });

        // Generate questions according to the distribution
        let currentItemIndex = 0;
        const generatedQuestions = [];

        for (const type of selectedTypes) {
          const questionsOfThisType = distribution[type];
          console.log(
            `\nGenerating ${questionsOfThisType} questions of type "${type}":`
          );

          for (let i = 0; i < questionsOfThisType; i++) {
            const item = shuffledItems[currentItemIndex];

            // For identification type, create question directly without AI
            if (type === "identification") {
              const directQuestion = {
                question: item.definition,
                answer: item.term,
                correctAnswer: item.term,
                questionType: "identification",
                type: "identification",
                item_id: item.item_id,
                item_number: item.item_number,
                itemInfo: {
                  term: item.term,
                  definition: item.definition,
                  itemId: item.item_id,
                  itemNumber: item.item_number,
                  studyMaterialId: material.study_material_id,
                  image:
                    item.image && item.image.startsWith("data:image")
                      ? item.image
                      : null,
                },
              };
              generatedQuestions.push(directQuestion);
              console.log(
                `✓ Created direct identification question for "${item.term}"`
              );
              currentItemIndex++;
              continue; // Skip AI generation for identification questions
            }

            console.log("Processing item:", {
              item_id: item.item_id,
              item_number: item.item_number,
              term: item.term,
              definition: item.definition,
              image: item.image,
              originalItemId: material.items[currentItemIndex].item_id,
              materialItemsStructure: typeof material.items[currentItemIndex],
            });

            // Add this logging when processing items
            console.log("Processing item with image:", {
              term: item.term,
              image: item.image,
              fullItem: item,
            });

            const endpoint = `${
              import.meta.env.VITE_BACKEND_URL
            }/api/openai/generate-${type}`;
            const requestPayload = {
              term: item.term,
              definition: item.definition,
              numberOfItems: 1,
              studyMaterialId: material.study_material_id,
              itemId: item.item_id,
              itemNumber: item.item_number,
              gameMode: "peaceful",
              timestamp: new Date().getTime(),
              // Add additional context to help AI generate better questions
              context: {
                termAndDefinition: `${item.term} - ${item.definition}`,
                requireBothTermAndDefinition: true,
                questionGuidelines: {
                  trueOrFalse: [
                    "Create statements that test understanding of both term and its definition",
                    "Include false statements that mix up relationships between terms and definitions",
                    "Ensure statements reference both the term and its meaning",
                  ],
                  multipleChoice: [
                    "Include options that test both term recognition and definition understanding",
                    "Create distractors that relate to both term and definition",
                    "Ensure question text references both the concept and its explanation",
                  ],
                },
              },
            };

            console.log(
              `Generating ${type} question for "${item.term}" with definition "${item.definition}"`
            );

            try {
              console.log(
                `Sending request for ${type} question:`,
                requestPayload
              );
              const response = await axios.post<any[]>(
                endpoint,
                requestPayload
              );

              if (
                response.data &&
                Array.isArray(response.data) &&
                response.data.length > 0
              ) {
                const questionsWithItemInfo = response.data.map((q) => {
                  // First, create the base question with item info
                  const questionWithInfo = {
                    ...q,
                    item_id: item.item_id,
                    item_number: item.item_number,
                    itemInfo: {
                      term: item.term,
                      definition: item.definition,
                      itemId: item.item_id,
                      itemNumber: item.item_number,
                      studyMaterialId: material.study_material_id,
                      // Use base64 image data directly if available
                      image:
                        item.image && item.image.startsWith("data:image")
                          ? item.image
                          : null,
                    },
                  };

                  // Add debug logging for each question
                  console.log("Generated question with image data:", {
                    term: item.term,
                    hasImage: item.image !== "NULL",
                    imageUrl: questionWithInfo.itemInfo.image,
                    itemId: item.item_id,
                    itemNumber: item.item_number,
                    studyMaterialId: material.study_material_id,
                  });

                  return questionWithInfo;
                });

                generatedQuestions.push(...questionsWithItemInfo);
                console.log(
                  `✓ Successfully generated ${type} question for "${item.term}" with item_id: ${item.item_id}`
                );
              } else {
                // Log the full response for debugging
                console.error(
                  `Invalid response for "${item.term}" of type ${type}:`,
                  {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data,
                  }
                );
              }
            } catch (error) {
              // Enhanced error logging
              if (error instanceof Error) {
                const axiosError = error as any;
                console.error(`Error generating ${type} question:`, {
                  message: error.message,
                  response: axiosError.response?.data,
                  status: axiosError.response?.status,
                  term: item.term,
                });
              } else {
                console.error(`Error generating ${type} question:`, error);
              }
            }

            currentItemIndex++;
          }
        }

        console.log("\nQuestion generation summary:");
        console.log(`- Total items: ${totalItems}`);
        console.log(`- Questions generated: ${generatedQuestions.length}`);
        console.log(`- Types distribution:`, distribution);

        // Shuffle the questions for final presentation
        const shuffledQuestions = generatedQuestions.sort(
          () => Math.random() - 0.5
        );
        console.log("Setting AI questions:", shuffledQuestions);

        // When setting the AI questions state
        const finalQuestions = shuffledQuestions.map((q) => {
          // Create a new question object with preserved image data
          const finalQuestion = {
            ...q,
            itemInfo: {
              ...q.itemInfo,
              // Ensure image is preserved from the original question
              image: q.itemInfo?.image || null,
              studyMaterialId: material.study_material_id,
            },
          };

          // Add debug logging for final question
          console.log("Final question image data:", {
            term: finalQuestion.itemInfo?.term,
            hasImage: !!finalQuestion.itemInfo?.image,
            imageUrl: finalQuestion.itemInfo?.image,
          });

          return finalQuestion;
        });

        // Add comprehensive debug logging
        console.log(
          "Final questions with detailed image data:",
          finalQuestions.map((q) => ({
            question: q.question,
            term: q.itemInfo?.term,
            hasImage: !!q.itemInfo?.image,
            imageUrl: q.itemInfo?.image,
            studyMaterialId: q.itemInfo?.studyMaterialId,
            itemNumber: q.itemInfo?.itemNumber,
            fullItemInfo: q.itemInfo,
          }))
        );

        setAiQuestions(finalQuestions);
      } catch (error) {
        console.error("Error in question generation process:", error);
        setAiQuestions([]);
      } finally {
        setIsGeneratingAI(false);
      }
    };

    generateAIQuestions();
  }, [material?.study_material_id, selectedTypes]);

  const {
    currentQuestion,
    isFlipped,
    handleFlip,
    handleAnswerSubmit: originalHandleAnswerSubmit,
    masteredCount,
    unmasteredCount,
    showResult,
    isCorrect,
    inputAnswer,
    setInputAnswer,
    handleUnmastered,
    handleMastered,
    getButtonStyle,
    handleNextQuestion,
    handleRevealAnswer,
    cardDisabled,
    correctCount,
    incorrectCount,
    highestStreak,
    isInRetakeMode,
    retakeQuestionsCount,
    isTransitioning,
  } = useGameLogic({
    mode,
    material,
    selectedTypes,
    aiQuestions,
  });

  const [startTime] = useState(new Date());

  // Update the handleEndGame function
  const handleEndGame = async () => {
    console.log("Handling early game end in peaceful mode...");

    if (hasSessionSaved) {
      console.log("Session already saved, skipping save");
      return;
    }

    // Play session incomplete sound
    if (sessionIncompleteRef.current) {
      sessionIncompleteRef.current.play();
    }

    const timeSpent = calculateTimeSpent(startTime, new Date());
    const navigationState = {
      timeSpent,
      mastered: masteredCount,
      unmastered: retakeQuestionsCount,
      mode,
      material: material?.title || "Unknown Material",
      earlyEnd: true,
      highestStreak,
      masteredCount,
      unmasteredCount: retakeQuestionsCount,
      earnedXP: 0, // Always 0 for early end
    };

    try {
      const sessionData: SessionData = {
        correctCount: masteredCount,
        incorrectCount: retakeQuestionsCount,
        highestStreak,
        earnedXP: 0, // Force 0 XP for early end
        timeSpent,
      };

      await saveSessionReport(sessionData, false);

      setIsGameEndedByUser(true);
      setHasSessionSaved(true);

      // Use navigate instead of window.location
      navigate("/dashboard/study/session-summary", {
        replace: true,
        state: navigationState,
      });
    } catch (error) {
      console.error("Failed to save incomplete session:", error);

      // Still try to navigate even if save fails
      navigate("/dashboard/study/session-summary", {
        replace: true,
        state: navigationState,
      });
    }
  };

  // Add this helper function to calculate XP based on number of items
  const calculateExpGained = (
    isComplete: boolean,
    gameMode: string,
    totalItems: number
  ): number => {
    if (gameMode.toLowerCase() === "peaceful") {
      return isComplete ? 5 : 0; // Peaceful mode: 5 XP if complete, 0 if incomplete
    } else if (gameMode.toLowerCase() === "time-pressured") {
      // Calculate XP based on number of items (5 XP per 10 items)
      return Math.floor(totalItems / 10) * 5;
    }
    return 0; // Default case
  };

  // Update the saveSessionReport function
  const saveSessionReport = async (
    sessionData: SessionData,
    isComplete: boolean = true
  ) => {
    if (hasSessionSaved) {
      console.log("Session already saved, skipping duplicate save");
      return;
    }

    try {
      const endpoint = `${
        import.meta.env.VITE_BACKEND_URL
      }/api/session-report/save`;

      // Get total number of items from material
      const totalItems = material?.items?.length || 0;

      // Calculate XP based on game mode and number of items
      const expGained = calculateExpGained(isComplete, mode, totalItems);

      // Log the values we're about to send
      console.log("Preparing session report with values:", {
        timeSpent: sessionData.timeSpent,
        mastered: sessionData.correctCount,
        unmastered: retakeQuestionsCount,
        isComplete,
        retakeMode: isInRetakeMode,
        retakeQuestionsCount,
      });

      // In retake mode, only save when all questions are mastered
      if (isInRetakeMode && retakeQuestionsCount > 0) {
        console.log(
          "Still in retake mode with questions remaining, skipping save"
        );
        return;
      }

      const payload: SessionPayload = {
        session_id: sessionId,
        study_material_id: material.study_material_id,
        title: material.title || "",
        summary: material.summary || "",
        session_by_user_id: user?.firebase_uid || "",
        session_by_username: user?.username || "",
        status: isComplete ? "completed" : "incomplete",
        ends_at: new Date().toISOString(),
        exp_gained: expGained,
        coins_gained: null,
        game_mode: mode.toLowerCase(),
        total_time: sessionData.timeSpent,
        mastered: isComplete ? totalItems : sessionData.correctCount,
        unmastered: isComplete ? 0 : retakeQuestionsCount,
      };

      console.log("Sending payload to server:", payload);

      const response = await axios.post<SessionReportResponse>(
        endpoint,
        payload
      );

      if (response.data.success) {
        console.log("Session report saved successfully:", response.data);
        setHasSessionSaved(true);

        // Play appropriate sound based on completion status
        if (isComplete && sessionCompleteRef.current) {
          sessionCompleteRef.current.play();
        } else if (!isComplete && sessionIncompleteRef.current) {
          sessionIncompleteRef.current.play();
        }

        return response.data;
      } else {
        console.error("Failed to save session report:", response.data);
        throw new Error(
          response.data.message || "Failed to save session report"
        );
      }
    } catch (error: unknown) {
      console.error("Error in saveSessionReport:", error);
      if (error && typeof error === "object" && "isAxiosError" in error) {
        const axiosError = error as any;
        console.error("Axios error details:", {
          message: axiosError.message,
          status: axiosError.response?.status,
          data: axiosError.response?.data,
        });
      }
      throw error;
    }
  };

  // Update the useEffect for session saving
  useEffect(() => {
    const saveSession = async () => {
      // Only save when all questions are answered AND we're not in retake mode
      // OR we're in retake mode and all questions are mastered
      const shouldSave =
        (correctCount + incorrectCount === aiQuestions.length &&
          !isInRetakeMode) ||
        (isInRetakeMode && retakeQuestionsCount === 0);

      if (shouldSave && aiQuestions.length > 0 && !hasSessionSaved) {
        const sessionData: SessionData = {
          correctCount: isInRetakeMode ? aiQuestions.length : correctCount, // If in retake mode and complete, all questions are correct
          incorrectCount: isInRetakeMode ? 0 : incorrectCount, // If in retake mode and complete, no questions are incorrect
          highestStreak,
          earnedXP: 5,
          timeSpent: calculateTimeSpent(startTime, new Date()),
        };

        try {
          await saveSessionReport(sessionData, true);
        } catch (error) {
          console.error("Failed to save completed session:", error);
        }
      }
    };

    saveSession();
  }, [
    correctCount,
    incorrectCount,
    aiQuestions.length,
    highestStreak,
    hasSessionSaved,
    isInRetakeMode,
    retakeQuestionsCount,
  ]);

  // Helper function to calculate time spent
  const calculateTimeSpent = (start: Date, end: Date) => {
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000); // difference in seconds
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Initialize audio after questions are loaded
  useEffect(() => {
    if (aiQuestions.length > 0 && !isAudioInitialized) {
      const initializeAudio = async () => {
        try {
          await playPeacefulModeAudio();
          setIsAudioInitialized(true);
        } catch (error) {
          console.error("Error initializing peaceful mode audio:", error);
          // Retry after a short delay
          setTimeout(() => {
            setIsAudioInitialized(false);
          }, 1000);
        }
      };
      initializeAudio();
    }
  }, [aiQuestions.length, playPeacefulModeAudio, isAudioInitialized]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      setIsAudioInitialized(false);
    };
  }, []);

  // Show loading screen while generating questions
  if (isGeneratingAI) {
    return (
      <GeneralLoadingScreen
        text="Loading Questions"
        mode="Peaceful Mode"
        isLoading={isGeneratingAI}
      />
    );
  }

  // Show loading screen if we don't have questions yet
  if (aiQuestions.length === 0) {
    return (
      <GeneralLoadingScreen
        text="Preparing Study Session"
        mode="Peaceful Mode"
        isLoading={true}
      />
    );
  }

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    // Common styles for Mastered/Retake buttons with strokes
    const masterButtonStyle =
      "relative h-[100px] w-[200px] bg-[#16251C] rounded-lg text-white hover:opacity-90 transition-colors border-2 border-[#6DBE45] flex items-center justify-center";
    const retakeButtonStyle =
      "relative h-[100px] w-[200px] bg-[#39101B] rounded-lg text-white hover:opacity-90 transition-colors border-2 border-[#FF3B3F] flex items-center justify-center";

    const leftArrowStyle =
      "absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080511] rounded-full w-[25px] h-[25px] flex items-center justify-center border border-[#6DBE45]";
    const rightArrowStyle =
      "absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-[#080511] rounded-full w-[25px] h-[25px] flex items-center justify-center border border-[#FF3B3F]";

    // First, render the answer buttons if we're showing results
    if (showResult && isCorrect) {
      return (
        <div className="w-full flex flex-col items-center">
          <div className="text-sm text-gray-400 whitespace-nowrap opacity-80 mb-2">
            Use ← → arrow keys or click buttons
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={handleMastered} className={masterButtonStyle}>
              <div className={leftArrowStyle}>
                <KeyboardArrowLeftIcon sx={{ fontSize: 20 }} />
              </div>
              Mastered!
            </button>
            <button onClick={handleUnmastered} className={retakeButtonStyle}>
              Retake
              <div className={rightArrowStyle}>
                <KeyboardArrowRightIcon sx={{ fontSize: 20 }} />
              </div>
            </button>
          </div>
          {isInRetakeMode && (
            <div className="mt-4 text-sm text-gray-400">
              {retakeQuestionsCount} questions remaining to master
            </div>
          )}
        </div>
      );
    }

    // If not showing results or answer is incorrect, render the question options
    switch (currentQuestion.questionType) {
      case "multiple-choice":
        return (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full max-w-[1000px] mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {currentQuestion.options &&
                  typeof currentQuestion.options === "object" &&
                  Object.entries(
                    currentQuestion.options as Record<string, string>
                  ).map(([key, value], index) => {
                    const letter = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
                    return (
                      <button
                        key={letter}
                        onClick={() => !showResult && handleAnswerSubmit(value)}
                        disabled={showResult}
                        className={`h-[100px] w-full bg-transparent 
                          ${getButtonStyle(value)}
                          rounded-lg text-white hover:bg-gray-800/20 transition-colors
                          disabled:cursor-not-allowed px-4 text-center`}
                      >
                        <span className="font-bold mr-2">{letter}:</span>{" "}
                        {value}
                      </button>
                    );
                  })}
              </div>
            </div>
            {showResult && !isCorrect && (
              <button
                onClick={handleNextQuestion}
                className="mt-4 px-8 py-3 bg-[#4D18E8] text-white rounded-lg hover:bg-[#3A12B0] transition-colors"
              >
                Next Question
              </button>
            )}
          </div>
        );

      case "identification":
        return (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full max-w-[500px] mt-3 mx-auto">
              <input
                type="text"
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showResult && inputAnswer.trim()) {
                    e.preventDefault(); // Prevent form submission
                    handleAnswerSubmit(inputAnswer);
                  }
                }}
                disabled={showResult}
                className={`w-full p-4 rounded-lg bg-transparent py-10 px-10 border-2 text-center
                  ${
                    showResult
                      ? isCorrect
                        ? "border-[#6DBE45]"
                        : "border-[#FF3B3F]"
                      : "border-gray-600"
                  }
                  text-white focus:outline-none placeholder:text-[#6F658D]`}
                placeholder="Type your answer here..."
                autoFocus // Add autofocus to improve UX
              />
            </div>
            {showResult && !isCorrect && (
              <button
                onClick={handleNextQuestion}
                className="mt-4 px-8 py-3 bg-[#4D18E8] text-white rounded-lg hover:bg-[#3A12B0] transition-colors"
              >
                Next Question
              </button>
            )}
          </div>
        );

      case "true-false":
        return (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full flex justify-center gap-4">
              {["True", "False"].map((option) => (
                <button
                  key={option}
                  onClick={() => !showResult && handleAnswerSubmit(option)}
                  disabled={showResult}
                  className={`h-[100px] w-[200px] bg-transparent 
                    ${getButtonStyle(option)}
                    rounded-lg text-white hover:bg-gray-800/20 transition-colors
                    disabled:cursor-not-allowed`}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
            {showResult && !isCorrect && (
              <button
                onClick={handleNextQuestion}
                className="mt-4 px-8 py-3 bg-[#4D18E8] text-white rounded-lg hover:bg-[#3A12B0] transition-colors"
              >
                Next Question
              </button>
            )}
          </div>
        );
    }
  };

  // Add handleAnswerSubmit function
  const handleAnswerSubmit = (answer: string) => {
    let isAnswerCorrect = false;

    if (!currentQuestion) {
      console.error("Missing question:", currentQuestion);
      return;
    }

    // Get correct answer - with fallbacks
    let correctAnswer = currentQuestion.correctAnswer || currentQuestion.answer;

    // Handle special case for multiple-choice: correctAnswer might be in format "A. term"
    if (
      currentQuestion.questionType === "multiple-choice" &&
      typeof correctAnswer === "string" &&
      correctAnswer.includes(". ")
    ) {
      // Extract just the term part after the letter
      const answerParts = correctAnswer.split(". ");
      if (answerParts.length > 1) {
        correctAnswer = answerParts.slice(1).join(". ").trim();
        console.log(
          `Using extracted multiple-choice answer: "${correctAnswer}"`
        );
      }
    }

    // Multi-stage fallback for correct answer
    if (!correctAnswer && currentQuestion.itemInfo?.term) {
      correctAnswer = currentQuestion.itemInfo.term;
      console.log(`Using term as fallback answer: "${correctAnswer}"`);
    }

    if (!correctAnswer) {
      console.error("No correct answer found for question:", currentQuestion);
      return;
    }

    // Safe string conversion and comparison
    const answerString = String(answer || "")
      .toLowerCase()
      .trim();
    const correctAnswerString = String(correctAnswer || "")
      .toLowerCase()
      .trim();

    console.log(
      `Comparing answer "${answerString}" with correct answer "${correctAnswerString}"`
    );
    isAnswerCorrect = answerString === correctAnswerString;

    // Play appropriate sound using AudioContext functions
    if (isAnswerCorrect) {
      playCorrectAnswerSound();
      // Also play the local sound as a fallback
      if (correctAnswerSoundRef.current) {
        correctAnswerSoundRef.current.play().catch((error) => {
          console.log("Error playing correct answer sound:", error);
        });
      }
    } else {
      playIncorrectAnswerSound();
      // Also play the local sound as a fallback
      if (incorrectAnswerSoundRef.current) {
        incorrectAnswerSoundRef.current.play().catch((error) => {
          console.log("Error playing incorrect answer sound:", error);
        });
      }
    }

    // Call the original handler
    originalHandleAnswerSubmit(answer);
  };

  return (
    <div className="min-h-screen relative">
      {/* Audio elements */}
      <audio ref={backgroundMusicRef} preload="auto" />
      <audio ref={correctAnswerSoundRef} preload="auto" />
      <audio ref={incorrectAnswerSoundRef} preload="auto" />
      <audio ref={sessionIncompleteRef} preload="auto" />
      <audio ref={sessionCompleteRef} preload="auto" />
      <DocumentHead
        title={
          isInRetakeMode
            ? `Retake Mode (${retakeQuestionsCount} remaining) | Duel Learn`
            : ` ${
                material?.title || "Study Session"
              } - Peaceful Mode  | Duel Learn`
        }
      />

      <Header
        material={material}
        mode={mode}
        correct={masteredCount}
        incorrect={retakeQuestionsCount}
        startTime={startTime}
        highestStreak={highestStreak}
        masteredCount={masteredCount}
        unmasteredCount={retakeQuestionsCount}
        onEndGame={handleEndGame}
        backgroundMusicRef={backgroundMusicRef}
        attackSoundRef={null}
        correctAnswerSoundRef={correctAnswerSoundRef}
        incorrectAnswerSoundRef={incorrectAnswerSoundRef}
        correctSfxRef={sessionCompleteRef}
        incorrectSfxRef={sessionIncompleteRef}
        masterVolume={masterVolume}
        musicVolume={musicVolume}
        soundEffectsVolume={soundEffectsVolume}
        setMasterVolume={setMasterVolume}
        setMusicVolume={setMusicVolume}
        setSoundEffectsVolume={setSoundEffectsVolume}
      />
      <main className="pt-24 px-4">
        <div className="mx-auto max-w-[1200px] flex flex-col items-center gap-8 h-[calc(100vh-96px)] justify-center">
          {isInRetakeMode && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-[#39101B] text-white px-6 py-2 rounded-lg border border-[#FF3B3F]">
              Retake Mode: {retakeQuestionsCount} questions remaining
            </div>
          )}
          <FlashCard
            question={currentQuestion?.question || ""}
            correctAnswer={currentQuestion?.correctAnswer || ""}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            onReveal={handleRevealAnswer}
            type={currentQuestion?.type}
            disabled={cardDisabled}
            image={currentQuestion?.itemInfo?.image || null}
            currentQuestion={currentQuestion}
            isTransitioning={isTransitioning}
          />
          {renderQuestionContent()}
          <Timer
            timeRemaining={30}
            progress={100}
            timeLimit={1}
            currentStreak={0}
            highestStreak={0}
            showTimerUI={false}
          />
        </div>
      </main>
    </div>
  );
};

export default PeacefulMode;