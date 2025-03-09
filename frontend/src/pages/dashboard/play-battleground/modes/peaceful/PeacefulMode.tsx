import React, { useState, useEffect, useRef } from "react";
import { useGameLogic } from "../../hooks/useGameLogic";
import FlashCard from "../../components/common/FlashCard";
import Header from "../../components/common/Header";
import { GameState } from "../../types";
import Timer from "../../components/common/Timer";

const PeacefulMode: React.FC<GameState> = ({
  mode,
  material,
  selectedTypes,
}) => {
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
  } = useGameLogic({ mode, material, selectedTypes });

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
    let isAnswerCorrect = false;
    
    if (currentQuestion?.questionType === 'identification') {
      isAnswerCorrect = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    } else {
      isAnswerCorrect = answer.toLowerCase() === currentQuestion?.correctAnswer.toLowerCase();
    }
    
    // Play appropriate sound
    if (isAnswerCorrect) {
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

  return (
    <div className="min-h-screen relative">
      <Header
        material={material}
        mode={mode}
        correct={0}
        incorrect={0}
        startTime={startTime}
        highestStreak={0}
        masteredCount={masteredCount}
        unmasteredCount={unmasteredCount}
      />
      <main className="pt-24 px-4">
        <div className="mx-auto max-w-[1200px] flex flex-col items-center gap-8 h-[calc(100vh-96px)] justify-center">
          <FlashCard
            question={currentQuestion?.question || ""}
            correctAnswer={currentQuestion?.correctAnswer || ""}
            isFlipped={isFlipped}
            onFlip={handleFlip}
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
          {showResult && isCorrect === false && (
            <button
              onClick={handleNextQuestion}
              className="mt-6 px-8 py-3 bg-[#4D18E8] text-white rounded-lg hover:bg-[#3A12B0] transition-colors"
            >
              Next Question
            </button>
          )}
          {showResult && isCorrect === true && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8 mb-6">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-1 h-24 bg-gray-800 absolute left-0"></div>{" "}
                  {/* Flagpole */}
                  <div
                    className="bg-[#FF3B3F] text-white rounded-lg p-4 text-3xl animate-waving-flag cursor-pointer"
                    onClick={handleUnmastered}
                  >
                    <span>Unmastered</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-1 h-24 bg-gray-800 absolute right-0"></div>{" "}
                  {/* Flagpole */}
                  <div
                    className="bg-[#52A647] text-white rounded-lg p-4 text-3xl animate-waving-flag cursor-pointer"
                    onClick={handleMastered}
                  >
                    <span>Mastered</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PeacefulMode;