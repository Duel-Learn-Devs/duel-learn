import React, { useState, useEffect } from "react";
import BattleFlashCard from "./BattleFlashCard";
import axios from "axios";
import { Question } from "../../../../types";
import { BattleState } from '../BattleState';
import { BattleRoundData } from '../PvpBattle';

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

// Add this interface after the CardEffect interface
interface BattleRoundResponse {
  question_ids_done?: string;
  [key: string]: any;
}

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnswerSubmit: (isCorrect: boolean) => Promise<void>;
  onAnswerSubmitRound?: (isCorrect: boolean, questionId: string) => Promise<void>;
  difficultyMode: string | null;
  questionTypes: string[];
  selectedCardId: string | null;
  aiQuestions: Question[];
  isGeneratingAI: boolean;
  onGameEnd?: () => void;
  shownQuestionIds: Set<string>;
  currentQuestionNumber: number;
  totalQuestions: number;
  battleState?: { session_uuid?: string };
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
  battleState
}) => {
  const [hasAnswered, setHasAnswered] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerProgress, setTimerProgress] = useState(100);
  const [shownQuestionIdsState, setShownQuestionIds] = useState<Set<string>>(new Set());

  // Initialize shownQuestionIds from round data when component mounts
  useEffect(() => {
    if (!battleState?.session_uuid) return;

    const fetchShownQuestionIds = async () => {
      try {
        const response = await axios.get<{data: BattleRoundData}>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/round/${battleState.session_uuid}`
        );

        if (response.data.data.question_ids_done) {
          try {
            const questionIdsDone = response.data.data.question_ids_done;
            const shownIds = Array.isArray(questionIdsDone) 
              ? questionIdsDone 
              : JSON.parse(questionIdsDone as string);
            
            if (Array.isArray(shownIds)) {
              const newSet = new Set(shownIds);
              if (newSet.size !== shownQuestionIdsState.size || 
                  !Array.from(newSet).every(id => shownQuestionIdsState.has(id))) {
                console.log('Updating shownQuestionIds from round data:', {
                  oldIds: Array.from(shownQuestionIdsState),
                  newIds: shownIds
                });
                setShownQuestionIds(newSet);
              }
            }
          } catch (error) {
            console.error('Error parsing question_ids_done from round data:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching shown question IDs from round data:', error);
      }
    };

    // Poll for shown question IDs every second
    const interval = setInterval(fetchShownQuestionIds, 1000);
    fetchShownQuestionIds(); // Initial fetch

    return () => clearInterval(interval);
  }, [battleState?.session_uuid, shownQuestionIdsState]);

  // Reset states when modal closes
  useEffect(() => {
    console.log('QuestionModal open state changed:', { isOpen });
    if (!isOpen) {
      console.log('Resetting modal states');
      setHasAnswered(false);
      setShowResult(false);
      setCurrentQuestion(null);
      setSelectedAnswer("");
      setTimeRemaining(null);
    }
  }, [isOpen]);

  // Select a question when the modal opens
  useEffect(() => {
    console.log('Question selection effect triggered:', {
      isOpen,
      hasCurrentQuestion: !!currentQuestion,
      isGeneratingAI,
      aiQuestionsCount: aiQuestions?.length ?? 0,
      currentQuestionNumber,
      totalQuestions,
      shownQuestionIds: Array.from(shownQuestionIdsState)
    });

    if (isOpen && !currentQuestion && !isGeneratingAI && aiQuestions?.length > 0) {
      // Filter out questions that have already been shown
      const availableQuestions = aiQuestions.filter(q => !shownQuestionIdsState.has(q.id));

      console.log('Available questions:', {
        total: aiQuestions.length,
        available: availableQuestions.length,
        shownIds: Array.from(shownQuestionIdsState),
        currentQuestionNumber,
        totalQuestions
      });

      if (availableQuestions.length > 0 && currentQuestionNumber < totalQuestions) {
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const selectedQuestion = availableQuestions[randomIndex];
        
        // Double check that the selected question hasn't been shown
        if (!shownQuestionIdsState.has(selectedQuestion.id)) {
          console.log('Selected new question:', {
            id: selectedQuestion.id,
            question: selectedQuestion.question
          });
          setCurrentQuestion(selectedQuestion);
        } else {
          console.log('Selected question was already shown, trying again');
          // If the selected question was already shown, try again
          setCurrentQuestion(null);
        }
      } else {
        console.log('No more questions available or reached total, ending game');
        onClose();
        onGameEnd?.();
      }
    }
  }, [isOpen, aiQuestions, isGeneratingAI, currentQuestion, shownQuestionIdsState, currentQuestionNumber, totalQuestions, onGameEnd, onClose]);

  // Timer logic
  useEffect(() => {
    if (!isOpen || hasAnswered || isGeneratingAI) return;

    const timeLimit = getTimeLimit();
    setTimeRemaining(timeLimit);
    console.log('Starting timer with limit:', timeLimit);

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
        console.log('Time ran out - submitting incorrect answer');
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
  }, [timeRemaining, hasAnswered, currentQuestion, onAnswerSubmit, onAnswerSubmitRound, onClose]);

  const getTimeLimit = () => {
    const difficultyNormalized = difficultyMode?.toLowerCase().trim() || "average";
    let timeLimit = 15;
    if (difficultyNormalized.includes("easy")) timeLimit = 20;
    if (difficultyNormalized.includes("hard")) timeLimit = 10;
    console.log('Calculated time limit:', { difficultyMode, timeLimit });
    return timeLimit;
  };

  const handleAnswerSubmit = async (answer: string) => {
    console.log('Answer submitted:', { 
      answer, 
      hasCurrentQuestion: !!currentQuestion, 
      hasAnswered,
      currentQuestionNumber,
      totalQuestions,
      currentQuestionId: currentQuestion?.id
    });
    
    if (!currentQuestion || hasAnswered) return;

    let correctAnswer = currentQuestion.correctAnswer;
    const answerString = String(answer || "").toLowerCase().trim();
    const correctAnswerString = String(correctAnswer).toLowerCase().trim();
    const isAnswerCorrect = answerString === correctAnswerString;

    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    setHasAnswered(true);
    setSelectedAnswer(answer);
    setIsFlipped(true);

    // Check if this will be the last question
    if (currentQuestionNumber >= totalQuestions - 1) {
      console.log('Last question answered, ending game after delay');
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
    const isCorrectAnswer = option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

    if (isCorrectAnswer) {
      return "bg-green-500 text-white border-2 border-green-600";
    }
    if (isSelected && !isCorrectAnswer) {
      return "bg-red-500 text-white border-2 border-red-600";
    }
    return "text-white border-2 border-gray-300 opacity-50";
  };

  // Add a function to format options
  const formatOptions = (options: string[] | { [key: string]: string } | undefined): string[] => {
    if (!options) return [];
    if (Array.isArray(options)) return options;
    return Object.values(options);
  };

  if (!isOpen || !currentQuestion) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {isGeneratingAI ? (
        <div className="bg-black/50 p-8 rounded-lg text-white text-center">
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
              correctAnswer={currentQuestion.correctAnswer || currentQuestion.answer}
              type={currentQuestion.type as 'multiple-choice' | 'true-false' | 'identification'}
              disabled={hasAnswered}
            />
          </div>

          {/* Answer Section */}
          <div className="mt-9 w-full">
            {currentQuestion.type === "multiple-choice" && (
              <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
                {formatOptions(currentQuestion.options).map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSubmit(option)}
                    disabled={hasAnswered}
                    className={`h-[100px] px-6 py-4 rounded-lg text-lg font-medium transition-colors whitespace-normal flex items-center justify-center ${getButtonStyle(option)}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === "true-false" && (
              <div className="flex justify-center gap-6">
                {["True", "False"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSubmit(option)}
                    disabled={hasAnswered}
                    className={`w-[200px] h-[93.33px] px-6 py-4 rounded-lg text-lg font-medium transition-colors flex items-center justify-center ${getButtonStyle(option)}`}
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
                  className={`w-full h-[90px] px-6 text-lg rounded-lg border-2 bg-[#0f0f0f00] text-white placeholder-gray-400 ${hasAnswered
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
                    Correct answer: {currentQuestion.correctAnswer || currentQuestion.answer}
                  </div>
                )}
                {!hasAnswered && (
                  <button
                    onClick={(e) =>
                      handleAnswerSubmit(
                        (e.currentTarget.previousElementSibling?.querySelector("input") as HTMLInputElement).value
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
      ) : (
        <div className="bg-black/50 p-8 rounded-lg text-white text-center">
          <p>Waiting for questions...</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full h-1.5 bg-gray-700/50 overflow-hidden z-[9999]">
        <div
          className={`h-full ${timeRemaining && timeRemaining <= 3 ? "bg-red-500" : "bg-white"}`}
          style={{
            width: `${timerProgress}%`,
            transition: "all 0.1s linear",
          }}
        />
      </div>

      {/* Result Overlay */}
      {showResult && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div className={`flex flex-col items-center justify-center ${isCorrect
            ? 'text-green-400 animate-result-appear'
            : 'text-red-400 animate-result-appear'
            }`}>
            <div className={`rounded-full p-6 mb-4 ${isCorrect
              ? 'bg-green-500/20'
              : 'bg-red-500/20'
              }`}>
              {isCorrect ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className={`text-6xl font-bold ${isCorrect
              ? 'text-green-400'
              : 'text-red-400'
              } animate-bounce-gentle`}>
              {isCorrect ? "CORRECT!" : "WRONG!"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionModal;
