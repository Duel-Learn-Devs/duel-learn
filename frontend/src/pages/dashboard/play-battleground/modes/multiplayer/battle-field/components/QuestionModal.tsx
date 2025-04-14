import React, { useState, useEffect } from "react";
import BattleFlashCard from "./BattleFlashCard";
import { questionsData } from "../../../../data/questions";
import axios from "axios";

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

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnswerSubmit: (isCorrect: boolean) => void;
  difficultyMode: string | null;
  questionTypes: string[];
  selectedCardId?: string | null;
}

const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  onAnswerSubmit,
  difficultyMode,
  questionTypes,
  selectedCardId,
}) => {
  const [hasAnswered, setHasAnswered] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [questionHistory, setQuestionHistory] = useState<
    Array<{
      question: string;
      answer: string;
      wasCorrect: boolean;
    }>
  >([]);
  // Card effect states
  const [cardEffects, setCardEffects] = useState<CardEffect[]>([]);
  const [timeReductionEffect, setTimeReductionEffect] =
    useState<CardEffect | null>(null);
  // Timer states
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerProgress, setTimerProgress] = useState(100);

  // Get time limit based on difficulty and active card effects
  const getTimeLimit = (): number => {
    const difficultyNormalized =
      difficultyMode?.toLowerCase().trim() || "average";

    // Base time limits
    let timeLimit = 15; // average difficulty default
    if (difficultyNormalized.includes("easy")) timeLimit = 20;
    if (difficultyNormalized.includes("hard")) timeLimit = 10;

    // Apply time reduction effect if active
    if (timeReductionEffect) {
      // Store original time for logging
      const originalTime = timeLimit;

      // Get reduction percentage and minimum time from effect
      const reductionPercent = timeReductionEffect.reduction_percent || 30;
      const minTime = timeReductionEffect.min_time || 5;

      // Calculate reduced time
      const reductionFactor = (100 - reductionPercent) / 100;
      const reducedTime = Math.floor(timeLimit * reductionFactor);

      // Ensure minimum time
      timeLimit = Math.max(reducedTime, minTime);

      console.log(
        `Time manipulation effect applied: ${timeLimit}s from original ${originalTime}s`
      );
      console.log(`Reduction: ${reductionPercent}%, Minimum: ${minTime}s`);

      // Mark the effect as consumed after applying it
      consumeCardEffect(timeReductionEffect.type);
    }

    return timeLimit;
  };

  // Function to fetch active card effects
  const fetchCardEffects = async () => {
    try {
      // Get the session uuid and player type from URL or session storage
      const urlParams = new URLSearchParams(window.location.search);
      const sessionUuid = sessionStorage.getItem("battle_session_uuid");
      const isHost = sessionStorage.getItem("is_host") === "true";

      // FIXED: Get effects targeting the current player correctly
      // The player who receives the effect is the current player, not the opponent
      // So if you're the host, you should check for effects targeting 'host', not 'guest'
      const playerType = isHost ? "host" : "guest";

      console.log(
        `Checking for card effects targeting ${playerType} (isHost: ${isHost})`
      );

      if (!sessionUuid) {
        console.error("No session UUID found for card effects");
        return;
      }

      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/gameplay/battle/card-effects/${sessionUuid}/${playerType}`
      );

      console.log("Card effects response:", response.data);

      if (response.data.success && response.data.data.effects) {
        setCardEffects(response.data.data.effects);
        console.log(
          `Found ${response.data.data.effects.length} card effects targeting ${playerType}`
        );

        // Check if there's a time reduction effect
        const timeEffect = response.data.data.effects.find(
          (effect: CardEffect) =>
            effect.type === "normal-1" && effect.effect === "reduce_time"
        );

        if (timeEffect) {
          console.log("Time manipulation effect found:", timeEffect);
          setTimeReductionEffect(timeEffect);
        } else {
          console.log("No time manipulation effect found");
        }
      } else {
        console.log(`No card effects found targeting ${playerType}`);
      }
    } catch (error) {
      console.error("Error fetching card effects:", error);
    }
  };

  // Function to mark card effect as consumed
  const consumeCardEffect = async (effectType: string) => {
    try {
      const sessionUuid = sessionStorage.getItem("battle_session_uuid");
      const isHost = sessionStorage.getItem("is_host") === "true";

      // FIXED: Use the correct player type (same as in fetchCardEffects)
      const playerType = isHost ? "host" : "guest";
      console.log(`Consuming ${effectType} card effect for ${playerType}`);

      if (!sessionUuid) {
        console.error("No session UUID found for consuming card effect");
        return;
      }

      const response = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/gameplay/battle/consume-card-effect`,
        {
          session_uuid: sessionUuid,
          player_type: playerType,
          effect_type: effectType,
        }
      );

      console.log("Card effect consumption response:", response.data);

      // Clear the effect from local state
      if (effectType === "normal-1") {
        setTimeReductionEffect(null);
      }

      // Update card effects list
      setCardEffects((prevEffects) =>
        prevEffects.filter(
          (effect) => !(effect.type === effectType && !effect.used)
        )
      );
    } catch (error) {
      console.error("Error consuming card effect:", error);
    }
  };

  // Fetch card effects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCardEffects();
    }
  }, [isOpen]);

  // Initialize timer when question is shown
  useEffect(() => {
    if (isOpen && !hasAnswered) {
      const timeLimit = getTimeLimit();
      setTimeRemaining(timeLimit);

      // Start the timer countdown
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null) return null;
          if (prev <= 0) return 0;
          return prev - 0.1;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [isOpen, hasAnswered, difficultyMode, timeReductionEffect]);

  // Update timer progress
  useEffect(() => {
    if (timeRemaining !== null) {
      const timeLimit = getTimeLimit();
      setTimerProgress((timeRemaining / timeLimit) * 100);

      // If time runs out and user hasn't answered
      if (timeRemaining <= 0 && !hasAnswered && currentQuestion) {
        // Automatically mark as incorrect
        setHasAnswered(true);
        setIsCorrect(false);
        setShowResult(true);

        // Wait for result overlay before closing
        setTimeout(() => {
          onAnswerSubmit(false);
          onClose();
        }, 1500);
      }
    }
  }, [timeRemaining, hasAnswered, currentQuestion, onAnswerSubmit, onClose]);

  // Filter questions based on difficulty and question types
  const getFilteredQuestions = () => {
    return questionsData.filter((q) => {
      // Check if question type is in allowed types
      const typeMatches =
        questionTypes.length === 0 || questionTypes.includes(q.questionType);

      return typeMatches;
    });
  };

  // Function to get a random unused question
  const getRandomUnusedQuestion = () => {
    const filteredQuestions = getFilteredQuestions();

    if (filteredQuestions.length === 0) {
      console.error("No questions available for current difficulty and types");
      return null;
    }

    if (usedQuestionIndices.length === filteredQuestions.length) {
      console.log("All questions have been used, resetting...");
      setUsedQuestionIndices([]);
      return filteredQuestions[0];
    }

    const availableIndices = filteredQuestions
      .map((_, index) => index)
      .filter((index) => !usedQuestionIndices.includes(index));

    const randomIndex =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];
    setUsedQuestionIndices((prev) => [...prev, randomIndex]);

    return filteredQuestions[randomIndex];
  };

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasAnswered(false);
      setShowResult(false);
      setCurrentQuestion(null);
      setSelectedAnswer("");
      setTimeRemaining(null);
    }
  }, [isOpen]);

  // Select a new question when the modal opens
  useEffect(() => {
    if (isOpen && !currentQuestion) {
      const newQuestion = getRandomUnusedQuestion();
      if (newQuestion) {
        setCurrentQuestion(newQuestion);
      } else {
        console.error("Could not get a valid question");
        onClose();
      }
    }
  }, [isOpen]);

  const handleAnswerSubmit = (answer: string) => {
    if (!currentQuestion || hasAnswered) return;

    setSelectedAnswer(answer);
    const answerCorrect =
      answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    setIsCorrect(answerCorrect);
    setHasAnswered(true);
    setShowResult(true);

    setQuestionHistory((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        answer: answer,
        wasCorrect: answerCorrect,
      },
    ]);

    // Wait for 1.5 seconds to show the result overlay
    setTimeout(() => {
      onAnswerSubmit(answerCorrect);
      onClose();
    }, 1500);
  };

  const getButtonStyle = (option: string) => {
    if (!hasAnswered) {
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

  // Functions for visual effects based on timer
  const isCriticalTime =
    timeRemaining !== null && timeRemaining <= getTimeLimit() / 2;
  const isNearZero = timeRemaining !== null && timeRemaining <= 3;
  const isZero = timeRemaining !== null && timeRemaining <= 0;

  // Remove all animation effects
  const getHeartbeatClass = () => {
    return "";
  };

  const getBorderClass = () => {
    return "";
  };

  const getLowHealthEffects = () => {
    return "";
  };

  const getProgressBarWidth = () => {
    if (isZero) return "2%";
    return `${timerProgress}%`;
  };

  const getProgressBarClass = () => {
    if (isZero) {
      return "h-full bg-red-600 opacity-80";
    }
    if (isNearZero) {
      return "h-full bg-red-500 opacity-90";
    }
    if (isCriticalTime) {
      return "h-full bg-red-500";
    }
    // If time has been reduced by card effect, show purple progress bar
    if (timeReductionEffect) {
      return "h-full bg-purple-600";
    }
    return "h-full bg-[#fff]";
  };

  // Add this function to show a prominent animation when time is reduced
  const showTimeReductionAnimation = () => {
    if (!timeReductionEffect || !isOpen) return null;

    // Only show this animation once when the modal first opens
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold text-red-500 animate-bounce mb-2">
            Time Reduced!
          </div>
          <div className="text-2xl font-bold text-white bg-purple-800 px-4 py-2 rounded-lg">
            -{timeReductionEffect.reduction_percent || 30}% Time
          </div>
        </div>
      </div>
    );
  };

  // Add a useEffect to show time reduction animation briefly when modal opens
  useEffect(() => {
    if (isOpen && timeReductionEffect) {
      const reductionElement = document.createElement("div");
      reductionElement.className =
        "fixed inset-0 flex items-center justify-center z-[999] bg-black/40";

      const reductionPercent = timeReductionEffect.reduction_percent || 30;
      const originalTime = difficultyMode?.toLowerCase().includes("easy")
        ? 20
        : difficultyMode?.toLowerCase().includes("hard")
        ? 10
        : 15;

      // Calculate new time
      const reducedTime = Math.max(
        Math.floor(originalTime * (1 - reductionPercent / 100)),
        5
      );

      reductionElement.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 bg-purple-900/90 rounded-lg shadow-xl border-2 border-purple-500 transform scale-110 animate-pulse">
                    <div class="text-4xl font-bold text-white mb-4">Time Manipulation!</div>
                    <div class="text-3xl text-white mb-6">Your time was reduced</div>
                    <div class="flex items-center space-x-4 text-2xl text-white mb-2">
                        <span class="font-normal">Original time:</span>
                        <span class="font-bold line-through">${originalTime}s</span>
                    </div>
                    <div class="flex items-center space-x-4 text-2xl text-white">
                        <span class="font-normal">New time:</span>
                        <span class="font-bold text-red-400">${reducedTime}s</span>
                    </div>
                </div>
            `;

      document.body.appendChild(reductionElement);

      // Remove the element after 2.5 seconds
      setTimeout(() => {
        document.body.removeChild(reductionElement);
      }, 2500);
    }
  }, [isOpen, timeReductionEffect, difficultyMode]);

  // Modify the timer display to make time reduction more obvious
  const renderTimerDisplay = () => {
    if (timeRemaining === null) return null;

    return (
      <div
        className={`absolute top-4 left-4 px-4 py-2 rounded-md shadow-lg ${
          timeReductionEffect
            ? "bg-purple-800 border-2 border-purple-400 animate-pulse"
            : "bg-gray-800"
        }`}
      >
        <div className="flex items-center">
          <span className="text-white font-bold mr-2">Time:</span>
          <span
            className={`${
              isNearZero
                ? "text-red-400 font-bold"
                : timeReductionEffect
                ? "text-yellow-300 font-bold"
                : "text-white"
            }`}
          >
            {Math.ceil(timeRemaining)}s
          </span>
          {timeReductionEffect && (
            <div className="ml-2 flex items-center">
              <span className="text-purple-300 text-xs animate-pulse mr-1">
                (reduced
              </span>
              <span className="text-red-400 text-xs font-bold">
                -{timeReductionEffect.reduction_percent || 30}%
              </span>
              <span className="text-purple-300 text-xs animate-pulse ml-1">
                )
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Update the renderCardEffectNotification function to be more prominent
  const renderCardEffectNotification = () => {
    if (timeReductionEffect) {
      const reductionPercent = timeReductionEffect.reduction_percent || 30;

      return (
        <div className="absolute top-4 right-4 bg-purple-800 text-white px-4 py-2 rounded-md shadow-lg border-2 border-purple-400">
          <div className="flex flex-col items-center">
            <span className="font-bold text-yellow-300 animate-pulse">
              Time Manipulation Active!
            </span>
            <span className="text-sm mt-1">
              Time reduced by{" "}
              <span className="font-bold text-red-400">
                {reductionPercent}%
              </span>
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isOpen || !currentQuestion) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="p-8 rounded-lg max-w-4xl w-full mx-4 mt-10 relative flex flex-col items-center">
        {/* Timer display */}
        {renderTimerDisplay()}

        {/* Card effect notification */}
        {renderCardEffectNotification()}

        {/* Time reduction animation (only shown briefly) */}
        {showTimeReductionAnimation()}

        {/* Question Counter */}
        <div className="mb-4 text-sm text-white">
          Question {usedQuestionIndices.length} of{" "}
          {getFilteredQuestions().length}
        </div>

        <div className="w-full flex justify-center">
          <BattleFlashCard
            question={currentQuestion.question}
            correctAnswer={currentQuestion.correctAnswer}
            type={currentQuestion.questionType}
            disabled={hasAnswered}
          />
        </div>

        {/* Answer Section */}
        <div className="mt-9 w-full">
          {currentQuestion.questionType === "multiple-choice" && (
            <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
              {currentQuestion.options.map((option: string, index: number) => (
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
              ))}
            </div>
          )}

          {currentQuestion.questionType === "true-false" && (
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

          {currentQuestion.questionType === "identification" && (
            <div className="max-w-xl mx-auto">
              <div className="relative">
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
                />
                {hasAnswered && !isCorrect && (
                  <div className="mt-2 text-green-500 text-center">
                    Correct answer: {currentQuestion.correctAnswer}
                  </div>
                )}
              </div>
              {!hasAnswered && (
                <button
                  onClick={(e) =>
                    handleAnswerSubmit(
                      (
                        e.currentTarget.previousElementSibling?.querySelector(
                          "input"
                        ) as HTMLInputElement
                      ).value
                    )
                  }
                  className="mt-7 w-full px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-lg font-medium"
                >
                  Submit Answer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full h-1.5 bg-gray-700/50 overflow-hidden z-[9999]">
        <div
          className={getProgressBarClass()}
          style={{
            width: getProgressBarWidth(),
            height: "100%",
            transition: "all 0.1s linear",
          }}
        />
      </div>

      {/* Result Overlay */}
      {showResult && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div
            className={`text-6xl font-bold ${
              isCorrect ? "text-green-500" : "text-red-500"
            } animate-bounce`}
          >
            {isCorrect ? "CORRECT!!!" : "WRONG!!!"}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionModal;
