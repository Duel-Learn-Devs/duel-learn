import React, { useState, useEffect, useRef } from "react";
import { useGameLogic } from "../../hooks/useGameLogic";
import FlashCard from "../../components/common/FlashCard";
import Header from "../../components/common/Header";
import Timer from "../../components/common/Timer";
import { GameState } from "../../types";
import "./../../styles/setupques.css";

const TimePressuredMode: React.FC<GameState> = ({
  mode,
  material,
  selectedTypes,
  timeLimit,
}) => {
  const {
    currentQuestion,
    isFlipped,
    handleFlip,
    handleAnswerSubmit: originalHandleAnswerSubmit,
    correctCount,
    incorrectCount,
    showResult,
    showNextButton,
    handleNextQuestion,
    getButtonStyle,
    inputAnswer,
    setInputAnswer,
    questionTimer,
    timerProgress,
    currentStreak,
    highestStreak,
    masteredCount,
    unmasteredCount,
  } = useGameLogic({ mode, material, selectedTypes, timeLimit });

  const [startTime] = useState(new Date());
  
  // Audio references
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const incorrectSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    correctSoundRef.current = new Audio('/sounds-sfx/right_answer.wav');
    incorrectSoundRef.current = new Audio('/sounds-sfx/wronganswer.mp3');
  }, []);

  // Custom answer submit handler with sound effects
  const handleAnswerSubmit = (answer: string) => {
    let isCorrect = false;
    
    if (currentQuestion?.questionType === 'identification') {
      isCorrect = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    } else {
      isCorrect = answer.toLowerCase() === currentQuestion?.correctAnswer.toLowerCase();
    }
    
    // Play appropriate sound
    if (isCorrect) {
      if (correctSoundRef.current) {
        correctSoundRef.current.currentTime = 0;
        correctSoundRef.current.play();
      }
    } else {
      if (incorrectSoundRef.current) {
        incorrectSoundRef.current.currentTime = 0;
        incorrectSoundRef.current.play();
      }
    }
    
    // Call the original handler
    originalHandleAnswerSubmit(answer);
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.questionType) {
      case "multiple-choice":
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-[1000px] mx-auto">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSubmit(option)}
                disabled={showResult}
                className={`h-[100px] w-full bg-transparent 
                                    ${getButtonStyle(option)}
                                    rounded-lg text-white hover:bg-gray-800/20 transition-colors
                                    disabled:cursor-not-allowed px-4 text-center`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case "identification":
        return (
          <div className="w-full max-w-[500px] mt-3 mx-auto">
            <input
              type="text"
              value={inputAnswer}
              onChange={(e) => setInputAnswer(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !showResult) {
                  handleAnswerSubmit(inputAnswer);
                }
              }}
              disabled={showResult}
              className={`w-full p-4 rounded-lg bg-transparent py-10 px-10 border-2 text-center
                                ${
                                  showResult
                                    ? inputAnswer.toLowerCase() ===
                                      currentQuestion.correctAnswer.toLowerCase()
                                      ? "border-[#52A647]"
                                      : "border-[#FF3B3F]"
                                    : "border-gray-600"
                                }
                                text-white focus:outline-none placeholder:text-[#6F658D]`}
              placeholder="Type your answer here..."
            />
          </div>
        );

      case "true-false":
        return (
          <div className="flex gap-4 justify-center">
            {["true", "false"].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSubmit(option)}
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
        );
    }
  };

  const getHeartbeatClass = () => {
    if (questionTimer === null || questionTimer === 0) return "";
    if (questionTimer <= 1) return "animate-heartbeat-1";
    if (questionTimer <= 2) return "animate-heartbeat-2";
    if (questionTimer <= 3) return "animate-heartbeat-3";
    return "";
  };

  const getBorderClass = () => {
    if (questionTimer === null) return "";
    if (questionTimer <= (timeLimit ?? 30) / 2) {
      return "animate-danger-pulse rounded-lg backdrop-blur-sm";
    }
    return "";
  };

  const getLowHealthEffects = () => {
    if (questionTimer === null || questionTimer === 0) return "";
    if (questionTimer <= (timeLimit ?? 30) / 2) {
      return "animate-screen-shake";
    }
    return "";
  };

  const renderVignette = () => {
    if (questionTimer === null || questionTimer > (timeLimit ?? 30) / 2)
      return null;
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-red-500/20 to-red-500/70 animate-pulse-vignette" />
      </div>
    );
  };

  return (
    <div className={`min-h-screen relative ${getBorderClass()}`}>
      {renderVignette()}
      <div className={`relative ${getLowHealthEffects()}`}>
        <Header
          material={material}
          mode={mode}
          correct={correctCount}
          incorrect={incorrectCount}
          startTime={startTime}
          highestStreak={highestStreak}
          masteredCount={masteredCount}
          unmasteredCount={unmasteredCount}
        />
        <main className="pt-24 px-4">
          <div className="mx-auto max-w-[1200px] flex flex-col items-center gap-8 h-[calc(100vh-96px)] justify-center">
            <div
              className={`w-[1200px] flex flex-col items-center gap-8 ${getHeartbeatClass()}`}
            >
              <FlashCard
                question={currentQuestion?.question || ""}
                correctAnswer={currentQuestion?.correctAnswer || ""}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                timeRemaining={questionTimer}
              />
            </div>
            {renderQuestionContent()}
            {showNextButton && (
              <button
                onClick={handleNextQuestion}
                className="mt-6 px-8 py-3 bg-[#4D18E8] text-white rounded-lg hover:bg-[#3A12B0] transition-colors"
              >
                Next Question
              </button>
            )}
          </div>
        </main>
        <Timer
          timeRemaining={questionTimer}
          progress={timerProgress}
          timeLimit={timeLimit ?? 30}
          currentStreak={currentStreak}
          highestStreak={highestStreak}
        />
      </div>
    </div>
  );
};

export default TimePressuredMode;