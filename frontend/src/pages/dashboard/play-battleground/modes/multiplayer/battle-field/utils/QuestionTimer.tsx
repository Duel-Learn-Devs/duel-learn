/**
 * Formats seconds into a MM:SS time format
 * @param seconds - Number of seconds to format
 * @returns Formatted time string in MM:SS format
 */
import { useState, useEffect } from "react";
import axios from "axios";

// Add interface for battle round response
interface BattleRoundResponse {
  id: number;
  session_uuid: string;
  round_number: number;
  host_card: string;
  guest_card: string;
  host_card_effect: string | null;
  guest_card_effect: string | null;
  host_answer_correct: number;
  guest_answer_correct: number;
  question_count_total: number;
  question_ids_done: string[] | null;
}

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

interface QuestionTimerProps {
  timeLeft: number;
  currentQuestion: number;
  totalQuestions: number;
  difficultyMode?: string | null;
  randomizationDone?: boolean;
  sessionUuid?: string;
}

export default function QuestionTimer({
  timeLeft,
  currentQuestion,
  totalQuestions,
  difficultyMode,
  randomizationDone = false,
  sessionUuid
}: QuestionTimerProps) {
  const [matchStartTime, setMatchStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timerStarted, setTimerStarted] = useState(false);

  // Start the match timer when randomization is done
  useEffect(() => {
    if (randomizationDone && !timerStarted) {
      setMatchStartTime(new Date());
      setTimerStarted(true);
    }
  }, [randomizationDone, timerStarted]);

  // Update the current time every second using real clock time
  useEffect(() => {
    if (!timerStarted) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [timerStarted]);

  // Calculate elapsed time in seconds
  const getElapsedSeconds = (): number => {
    if (!matchStartTime) return 0;
    return Math.floor((currentTime.getTime() - matchStartTime.getTime()) / 1000);
  };

  // Format times
  const formattedTimeLeft = formatTime(timeLeft);
  const formattedMatchTime = formatTime(getElapsedSeconds());

  return (
    <div className="flex flex-col items-center">
      <div
        className={`text-white text-xl sm:text-2xl font-bold ${timeLeft <= 10 ? "text-red-500" : ""
          }`}
      >
        {timerStarted ? formattedMatchTime : formattedTimeLeft}
      </div>

      <div className="flex flex-col items-center">
        <div className="text-white/70 text-xs sm:text-sm uppercase tracking-wide mt-1">
          QUESTION {currentQuestion} out of {totalQuestions}
        </div>

        {difficultyMode && (
          <div className="mt-1 px-3 py-0.5 bg-purple-900/70 rounded-full text-white text-xs sm:text-sm font-medium">
            Mode:{" "}
            {difficultyMode.charAt(0).toUpperCase() + difficultyMode.slice(1)}
          </div>
        )}
      </div>
    </div>
  );
}
