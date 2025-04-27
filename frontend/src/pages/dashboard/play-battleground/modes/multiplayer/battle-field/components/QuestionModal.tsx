import React, { useState, useEffect, useRef } from "react";
import BattleFlashCard from "./BattleFlashCard";
import axios from "axios";
import { Question } from "../../../../types";
import { BattleState } from "../BattleState";
import { BattleRoundData } from "../PvpBattle";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TIME MANIPULATION VISUAL INDICATORS:
 *
 * When a player receives the Time Manipulation card effect, they will see:
 *
 * 1. INITIAL ANIMATION (lines ~352-384):
 *    - A fullscreen popup showing "Time Manipulation!" with original vs reduced time
 *    - This appears immediately when the question modal opens
 *    - Automatically disappears after 2.5 seconds
 *
 * 2. TIMER DISPLAY (lines ~387-416):
 *    - Located at top-left corner
 *    - Purple background with animated pulse effect
 *    - Shows remaining time in yellow (instead of white)
 *    - Displays "reduced -30%" label
 *
 * 3. NOTIFICATION BADGE (lines ~419-436):
 *    - Located at top-right corner
 *    - Purple background with "Time Manipulation Active!" text
 *    - Shows reduction percentage
 *
 * 4. PROGRESS BAR (lines ~535-544):
 *    - Progress bar at bottom of screen changes to purple color
 *    - Normally shows white, but turns purple when time is reduced
 */

// Card effect interface
interface CardEffect {
  type: string;
  effect: string;
  target: string;
  applied_at: string;
  used: boolean;
  reduction_percent?: number;
  min_time?: number;
}

interface BattleRoundResponse {
  question_ids_done?: string;
  [key: string]: any;
}

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnswerSubmit: (isCorrect: boolean) => Promise<void>;
  onAnswerSubmitRound?: (
    isCorrect: boolean,
    questionId: string
  ) => Promise<void>;
  difficultyMode: string | null;
  questionTypes: string[];
  selectedCardId: string | null;
  aiQuestions: Question[];
  isGeneratingAI: boolean;
  onGameEnd?: () => void;
  shownQuestionIds: Set<string>;
  currentQuestionNumber: number;
  totalQuestions: number;
  playCorrectSound?: () => void;
  playIncorrectSound?: () => void;
  soundEffectsVolume?: number;
  battleState?: { session_uuid?: string };
  isHost?: boolean;
  masterVolume?: number;
  timeManipulationEffectSoundRef?: React.RefObject<HTMLAudioElement>;
}

const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  onAnswerSubmit,
  onAnswerSubmitRound,
  difficultyMode,
  questionTypes,
  selectedCardId,
  aiQuestions,
  isGeneratingAI,
  onGameEnd,
  shownQuestionIds,
  currentQuestionNumber,
  totalQuestions,
  playCorrectSound,
  playIncorrectSound,
  soundEffectsVolume = 0.7,
  battleState,
  isHost,
  masterVolume = 100,
  timeManipulationEffectSoundRef,
}) => {
  const [hasAnswered, setHasAnswered] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerProgress, setTimerProgress] = useState(100);
  const [shownQuestionIdsState, setShownQuestionIds] = useState<Set<string>>(
    new Set()
  );
  const [hasTimeManipulation, setHasTimeManipulation] = useState(false);
  const [timeManipulationEffect, setTimeManipulationEffect] =
    useState<CardEffect | null>(null);
  const [showTimeEffect, setShowTimeEffect] = useState(false);

  // Add reference for the identification input
  const identificationInputRef = useRef<HTMLInputElement>(null);

  // Add ref for Time Manipulation effect sound
  const timeManipulationEffectSoundRefInternal =
    useRef<HTMLAudioElement | null>(null);

  // Initialize shownQuestionIds from round data when component mounts
  useEffect(() => {
    if (!battleState?.session_uuid) return;

    const fetchShownQuestionIds = async () => {
      try {
        const response = await axios.get<{ data: BattleRoundData }>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/round/${
            battleState.session_uuid
          }`
        );

        if (response.data.data.question_ids_done) {
          try {
            const questionIdsDone = response.data.data.question_ids_done;
            const shownIds = Array.isArray(questionIdsDone)
              ? questionIdsDone
              : JSON.parse(questionIdsDone as string);

            if (Array.isArray(shownIds)) {
              const newSet = new Set(shownIds);
              if (
                newSet.size !== shownQuestionIdsState.size ||
                !Array.from(newSet).every((id) => shownQuestionIdsState.has(id))
              ) {
                console.log("Updating shownQuestionIds from round data:", {
                  oldIds: Array.from(shownQuestionIdsState),
                  newIds: shownIds,
                });
                setShownQuestionIds(newSet);
              }
            }
          } catch (error) {
            console.error(
              "Error parsing question_ids_done from round data:",
              error
            );
          }
        }
      } catch (error) {
        console.error(
          "Error fetching shown question IDs from round data:",
          error
        );
      }
    };

    // Poll for shown question IDs every second
    const interval = setInterval(fetchShownQuestionIds, 1000);
    fetchShownQuestionIds(); // Initial fetch

    return () => clearInterval(interval);
  }, [battleState?.session_uuid, shownQuestionIdsState]);

  // Reset states when modal closes
  useEffect(() => {
    console.log("QuestionModal open state changed:", { isOpen });
    if (!isOpen) {
      console.log("Resetting modal states");
      setHasAnswered(false);
      setShowResult(false);
      setCurrentQuestion(null);
      setSelectedAnswer("");
      setTimeRemaining(null);
    }
  }, [isOpen]);

  // Add a function to update the enemy answering question text
  const updateEnemyAnsweringQuestion = async (questionText: string) => {
    if (!battleState?.session_uuid) return;

    try {
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/gameplay/battle/update-enemy-question`,
        {
          session_uuid: battleState.session_uuid,
          player_type: isHost ? "host" : "guest",
          question_text: questionText,
          is_on_flashcard: questionText !== "", // Set to true when question is shown, false when empty
        }
      );
      console.log("Updated enemy answering question text:", questionText);
    } catch (error) {
      console.error("Error updating enemy answering question:", error);
    }
  };

  // Update effect to send the current question text when a question is selected
  useEffect(() => {
    console.log("Question selection effect triggered:", {
      isOpen,
      hasCurrentQuestion: !!currentQuestion,
      isGeneratingAI,
      aiQuestionsCount: aiQuestions?.length ?? 0,
      currentQuestionNumber,
      totalQuestions,
      shownQuestionIds: Array.from(shownQuestionIdsState),
    });

    if (
      isOpen &&
      !currentQuestion &&
      !isGeneratingAI &&
      aiQuestions?.length > 0
    ) {
      // Filter out questions that have already been shown
      const availableQuestions = aiQuestions.filter(
        (q) => !shownQuestionIdsState.has(q.id)
      );

      console.log("Available questions:", {
        total: aiQuestions.length,
        available: availableQuestions.length,
        shownIds: Array.from(shownQuestionIdsState),
        currentQuestionNumber,
        totalQuestions,
      });

      if (
        availableQuestions.length > 0 &&
        currentQuestionNumber < totalQuestions
      ) {
        // Select a random question from available questions
        const randomIndex = Math.floor(
          Math.random() * availableQuestions.length
        );
        const selectedQuestion = availableQuestions[randomIndex];
        // Double check that the selected question hasn't been shown
        if (!shownQuestionIdsState.has(selectedQuestion.id)) {
          console.log("Selected new question:", {
            id: selectedQuestion.id,
            question: selectedQuestion.question,
          });
          setCurrentQuestion(selectedQuestion);

          // Send the question text to the backend so the opponent can see what question is being answered
          updateEnemyAnsweringQuestion(selectedQuestion.question);
        } else {
          console.log("Selected question was already shown, trying again");
          // If the selected question was already shown, try again
          setCurrentQuestion(null);
        }
      } else {
        console.log(
          "No more questions available or reached total, ending game"
        );
        onClose();
        onGameEnd?.();
      }
    }
  }, [
    isOpen,
    aiQuestions,
    isGeneratingAI,
    currentQuestion,
    shownQuestionIds,
    battleState?.session_uuid,
    isHost,
  ]);

  // Add effect to clear question when modal closes
  useEffect(() => {
    if (!isOpen && battleState?.session_uuid) {
      // Clear the enemy answering question text when the modal closes
      updateEnemyAnsweringQuestion("");
    }
  }, [isOpen, battleState?.session_uuid]);

  // Timer logic
  useEffect(() => {
    if (!isOpen || hasAnswered || isGeneratingAI) return;

    const timeLimit = getTimeLimit();
    setTimeRemaining(timeLimit);
    console.log("Starting timer with limit:", timeLimit);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 0) return 0;
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isOpen, hasAnswered, difficultyMode, isGeneratingAI]);

  // Update timer progress
  useEffect(() => {
    if (timeRemaining !== null) {
      const timeLimit = getTimeLimit();
      setTimerProgress((timeRemaining / timeLimit) * 100);

      if (timeRemaining <= 0 && !hasAnswered && currentQuestion) {
        console.log("Time ran out - submitting incorrect answer");
        setHasAnswered(true);
        setIsCorrect(false);
        setShowResult(true);

        setTimeout(() => {
          if (onAnswerSubmitRound) {
            onAnswerSubmitRound(false, currentQuestion.id);
          } else {
            onAnswerSubmit(false);
          }
          onClose();
        }, 1500);
      }
    }
  }, [
    timeRemaining,
    hasAnswered,
    currentQuestion,
    onAnswerSubmit,
    onAnswerSubmitRound,
    onClose,
  ]);

  // Add effect to check for time manipulation when modal opens
  useEffect(() => {
    if (isOpen && battleState?.session_uuid) {
      const checkForTimeManipulation = async () => {
        try {
          // Get player type based on isHost
          const playerType = isHost ? "host" : "guest";

          // Check for active card effects
          const response = await axios.get(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/gameplay/battle/card-effects/${
              battleState.session_uuid
            }/${playerType}`
          );

          if (response.data.success) {
            // Find any time manipulation effects
            const timeEffects = response.data.data.effects.filter(
              (effect: CardEffect) =>
                effect.effect === "reduce_time" && !effect.used
            );

            if (timeEffects.length > 0) {
              const effect = timeEffects[0];
              setHasTimeManipulation(true);
              setTimeManipulationEffect(effect);

              // Show the visual effect instead of text notification
              setShowTimeEffect(true);
              setTimeout(() => {
                setShowTimeEffect(false);
              }, 3000);

              // Play Time Manipulation effect sound
              if (timeManipulationEffectSoundRef) {
                // Calculate volume based on sound settings
                const calculatedVolume =
                  (soundEffectsVolume / 100) * (masterVolume / 100);
                timeManipulationEffectSoundRef.current!.volume =
                  calculatedVolume;
                timeManipulationEffectSoundRef.current!.currentTime = 0;
                timeManipulationEffectSoundRef
                  .current!.play()
                  .catch((err) =>
                    console.error(
                      "Error playing time manipulation effect sound:",
                      err
                    )
                  );
              }

              // Mark the effect as used
              await axios.post(
                `${
                  import.meta.env.VITE_BACKEND_URL
                }/api/gameplay/battle/consume-card-effect`,
                {
                  session_uuid: battleState.session_uuid,
                  player_type: playerType,
                  effect_type: effect.type,
                }
              );

              console.log(
                `Time manipulation effect consumed, time reduced by ${
                  effect.reduction_percent || 30
                }%`
              );
            } else {
              setHasTimeManipulation(false);
              setTimeManipulationEffect(null);
            }
          }
        } catch (error) {
          console.error("Error checking for time manipulation effects:", error);
        }
      };

      checkForTimeManipulation();
    }
  }, [
    isOpen,
    battleState?.session_uuid,
    isHost,
    soundEffectsVolume,
    masterVolume,
  ]);

  // Modify the getTimeLimit function to apply time reduction
  const getTimeLimit = () => {
    const difficultyNormalized =
      difficultyMode?.toLowerCase().trim() || "average";
    let timeLimit = 15;
    if (difficultyNormalized.includes("easy")) timeLimit = 20;
    if (difficultyNormalized.includes("hard")) timeLimit = 10;

    // Apply time manipulation effect if active
    if (hasTimeManipulation && timeManipulationEffect) {
      const reductionPercent = timeManipulationEffect.reduction_percent || 30;
      const minTime = timeManipulationEffect.min_time || 5;
      timeLimit = Math.max(minTime, timeLimit * (1 - reductionPercent / 100));
      console.log(
        `Time limit reduced by ${reductionPercent}% to ${timeLimit}s (min: ${minTime}s)`
      );
    }

    console.log("Calculated time limit:", {
      difficultyMode,
      timeLimit,
      hasTimeManipulation,
    });
    return timeLimit;
  };

  const handleAnswerSubmit = async (answer: string) => {
    console.log("Answer submitted:", {
      answer,
      hasCurrentQuestion: !!currentQuestion,
      hasAnswered,
      currentQuestionNumber,
      totalQuestions,
      currentQuestionId: currentQuestion?.id,
    });

    if (!currentQuestion || hasAnswered) return;

    let correctAnswer = currentQuestion.correctAnswer;

    // For identification questions, the correctAnswer is already properly set
    // from the backend (term is used as correctAnswer)
    const answerString = String(answer || "")
      .toLowerCase()
      .trim();
    const correctAnswerString = String(correctAnswer).toLowerCase().trim();
    const isAnswerCorrect = answerString === correctAnswerString;

    console.log("Answer evaluation:", {
      submitted: answerString,
      correct: correctAnswerString,
      isCorrect: isAnswerCorrect,
    });

    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    setHasAnswered(true);
    setSelectedAnswer(answer);
    setIsFlipped(true);

    // Play the appropriate sound effect based on the answer correctness
    if (isAnswerCorrect && playCorrectSound) {
      playCorrectSound();
    } else if (!isAnswerCorrect && playIncorrectSound) {
      playIncorrectSound();
    }

    // Check if this was the last question
    if (currentQuestionNumber >= totalQuestions - 1) {
      console.log("Last question answered, ending game after delay");
      setTimeout(() => {
        if (onAnswerSubmitRound) {
          onAnswerSubmitRound(isAnswerCorrect, currentQuestion.id);
        } else {
          onAnswerSubmit(isAnswerCorrect);
        }
        onClose();
        onGameEnd?.();
      }, 1500);
    } else {
      setTimeout(() => {
        if (onAnswerSubmitRound) {
          onAnswerSubmitRound(isAnswerCorrect, currentQuestion.id);
        } else {
          onAnswerSubmit(isAnswerCorrect);
        }
        onClose();
      }, 1500);
    }
  };

  const getButtonStyle = (option: string) => {
    if (!showResult) {
      return "text-white border-2 border-white-400 hover:border-green-300 transition-colors";
    }

    const isSelected = selectedAnswer.toLowerCase() === option.toLowerCase();
    const isCorrectAnswer =
      option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

    if (isCorrectAnswer) {
      return "bg-green-500 text-white border-2 border-green-600";
    }
    if (isSelected && !isCorrectAnswer) {
      return "bg-red-500 text-white border-2 border-red-600";
    }
    return "text-white border-2 border-gray-300 opacity-50";
  };

  // Add a function to format options
  const formatOptions = (
    options: string[] | { [key: string]: string } | undefined
  ): string[] => {
    if (!options) return [];
    if (Array.isArray(options)) return options;
    return Object.values(options);
  };

  if (!isOpen || !currentQuestion) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 question-modal">
      {/* Add Time Manipulation effect sound */}
      <audio
        ref={timeManipulationEffectSoundRefInternal}
        src="/GameBattle/TimeManipulationEffectSfx.mp3"
        preload="auto"
      />

      {isGeneratingAI ? (
        <div className="bg-black/50 p-8 rounded-lg text-white text-center game-overlay">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Generating questions...</p>
        </div>
      ) : currentQuestion ? (
        <div className="p-8 rounded-lg max-w-4xl w-full mx-4 mt-10 relative flex flex-col items-center">
          {/* Question Counter */}
          <div className="mb-4 text-sm text-white">
            Question {currentQuestionNumber} of {totalQuestions}
          </div>

          <div className="w-full flex justify-center">
            <BattleFlashCard
              question={currentQuestion.question}
              correctAnswer={
                currentQuestion.correctAnswer || currentQuestion.answer
              }
              type={
                currentQuestion.type as
                  | "multiple-choice"
                  | "true-false"
                  | "identification"
              }
              disabled={hasAnswered}
            />
          </div>

          {/* Answer Section */}
          <div className="mt-9 w-full">
            {currentQuestion.type === "multiple-choice" && (
              <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
                {formatOptions(currentQuestion.options).map(
                  (option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSubmit(option)}
                      disabled={hasAnswered}
                      className={`h-[100px] px-6 py-4 rounded-lg text-lg font-medium transition-colors whitespace-normal flex items-center justify-center ${getButtonStyle(
                        option
                      )}`}
                    >
                      {option}
                    </button>
                  )
                )}
              </div>
            )}

            {currentQuestion.type === "true-false" && (
              <div className="flex justify-center gap-6">
                {["True", "False"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSubmit(option)}
                    disabled={hasAnswered}
                    className={`w-[200px] h-[93.33px] px-6 py-4 rounded-lg text-lg font-medium transition-colors flex items-center justify-center ${getButtonStyle(
                      option
                    )}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === "identification" && (
              <div className="max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder="Type your answer here ..."
                  className={`w-full h-[90px] px-6 text-lg rounded-lg border-2 bg-[#0f0f0f00] text-white placeholder-gray-400 ${
                    hasAnswered
                      ? isCorrect
                        ? "border-green-500 bg-green-500/10"
                        : "border-red-500 bg-red-500/10"
                      : "border-[#2C2C2C]"
                  } outline-none`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !hasAnswered) {
                      handleAnswerSubmit((e.target as HTMLInputElement).value);
                    }
                  }}
                  disabled={hasAnswered}
                  ref={identificationInputRef}
                />
                {hasAnswered && !isCorrect && (
                  <div className="mt-2 text-green-500 text-center">
                    Correct answer:{" "}
                    {currentQuestion.correctAnswer || currentQuestion.answer}
                  </div>
                )}
                {!hasAnswered && (
                  <button
                    onClick={() => {
                      if (identificationInputRef.current) {
                        handleAnswerSubmit(
                          identificationInputRef.current.value
                        );
                      }
                    }}
                    className="mt-7 w-full px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-lg font-medium"
                  >
                    Submit Answer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-black/50 p-8 rounded-lg text-white text-center game-overlay">
          <p>Waiting for questions...</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full h-1.5 bg-gray-700/50 overflow-hidden z-[9999] game-overlay">
        <div
          className={`h-full ${
            hasTimeManipulation
              ? "bg-red-500"
              : timeRemaining && timeRemaining <= 3
              ? "bg-red-500"
              : "bg-white"
          }`}
          style={{
            width: `${timerProgress}%`,
            transition: "all 0.1s linear",
          }}
        />
      </div>

      {/* Time Manipulation Effect Animation */}
      <AnimatePresence>
        {showTimeEffect && (
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none animation-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background overlay with clock-themed effect */}
            <div className="absolute inset-0 bg-indigo-900/30 backdrop-blur-[2px]"></div>

            {/* Central clock effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Clock face */}
              <motion.div
                className="w-52 h-52 rounded-full border-4 border-red-400/80 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, ease: "linear" }}
              >
                {/* Clock hands */}
                <motion.div
                  className="absolute h-20 w-1.5 bg-red-300 origin-bottom"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 1080 }}
                  transition={{ duration: 3 }}
                ></motion.div>
                <motion.div
                  className="absolute h-14 w-1.5 bg-red-100 origin-bottom"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1 }}
                ></motion.div>
              </motion.div>

              {/* Radiating warning circles */}
              <motion.div
                className="absolute w-72 h-72 rounded-full border-2 border-red-300/50"
                animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                transition={{ duration: 2, repeat: 1, repeatType: "loop" }}
              ></motion.div>
              <motion.div
                className="absolute w-96 h-96 rounded-full border border-red-500/20"
                animate={{ scale: [1, 2], opacity: [1, 0] }}
                transition={{ duration: 3, repeat: 1, repeatType: "loop" }}
              ></motion.div>
            </div>

            {/* Minimal indicator */}
            <div className="absolute top-20 left-0 right-0 flex justify-center">
              <motion.div
                className="bg-red-900/60 px-5 py-2 rounded-full flex items-center gap-2 border border-red-500"
                animate={{ y: [0, -10, 0], opacity: [0, 1, 1] }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <svg
                  className="w-6 h-6 text-red-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <motion.span
                  className="text-red-200 font-bold"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: 1 }}
                >
                  TIME REDUCED!
                </motion.span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replace the text-heavy Time Manipulation indicators with a subtle visual indicator */}
      {hasTimeManipulation && (
        <>
          {/* Cleaner timer display with time manipulation indicator */}
          <motion.div
            className="fixed top-4 left-4 bg-purple-900/70 text-yellow-300 py-2 px-4 rounded-lg shadow-lg border border-purple-500/50 game-overlay"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xl font-bold">
                {timeRemaining?.toFixed(1)}s
              </span>
            </div>
            <motion.div
              className="h-1 w-full bg-red-500/50 mt-1 rounded-full overflow-hidden"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.div
                className="h-full bg-red-500"
                style={{ width: `${(timeRemaining / getTimeLimit()) * 100}%` }}
              ></motion.div>
            </motion.div>
          </motion.div>
        </>
      )}

      {/* Result Overlay */}
      {showResult && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] animation-overlay">
          <div
            className={`flex flex-col items-center justify-center ${
              isCorrect
                ? "text-green-400 animate-result-appear"
                : "text-red-400 animate-result-appear"
            }`}
          >
            <div
              className={`rounded-full p-6 mb-4 ${
                isCorrect ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              {isCorrect ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-16 h-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-16 h-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <div
              className={`text-6xl font-bold ${
                isCorrect ? "text-green-400" : "text-red-400"
              } animate-bounce-gentle`}
            >
              {isCorrect ? "CORRECT!" : "WRONG!"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionModal;
