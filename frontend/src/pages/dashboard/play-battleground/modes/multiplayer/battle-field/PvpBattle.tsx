import { useState, useEffect, useReducer, useCallback, useRef } from "react";
import { Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Question } from "../../../types";
import { BattleRoundResponse, BattleScoresResponse, BattleSessionResponse, BattleStatusResponse } from '../../../types/battle';
import { socket } from '../../../../../../socket';

// Character animations
import playerCharacter from "/characterinLobby/playerCharacter.gif"; // Regular idle animation for player
import enemyCharacter from "/characterinLobby/playerCharacter.gif"; // Regular idle animation for enemy
import PvpBattleBG from "/GameBattle/PvpBattleBG.png"; // Battle background image
import correctAnswerAnimation from "/GameBattle/correctAnswerAnimationCharacter.gif"; // Correct answer animation
import PvpBattleBGNotOverlayed from "/GameBattle/PvpBattleBGNotOverlayed.png"; // Not overlayed battle background image
import beenAttackedAnimation from "/GameBattle/BeenAttacked.gif"; // Been attacked animation

// Import components
import PlayerInfo from "./components/PlayerInfo";
import Character from "./components/Character";
import CardSelection from "./components/CardSelection";

// Import consolidated components
import { useBattle } from "./hooks/useBattle";
import { WaitingOverlay, LoadingOverlay } from "./overlays/BattleOverlays";
import { VictoryModal } from "./modals/BattleModals";
import CharacterAnimationManager from "./components/CharacterAnimationManager";
import GameStartAnimation from "./components/GameStartAnimation";
import GuestWaitingForRandomization from "./components/GuestWaitingForRandomization";
import QuestionModal from "./components/QuestionModal";
import PvpSessionReport from "./screens/PvpSessionReport";

// Import utils directly
import TurnRandomizer from "./utils/TurnRandomizer";
import { getCharacterImage } from "./utils/getCharacterImage";
import QuestionTimer from "./utils/QuestionTimer";
import { calculateBattleRewards } from "./utils/rewardCalculator";

// Import shared BattleState interface
import { BattleState } from "./BattleState";

// Types
interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
}

interface StudyMaterialResponse {
  success: boolean;
  data: StudyMaterial[];
}

interface StudyMaterialInfoResponse {
  success: boolean;
  data: {
    total_items: number;
  };
}

interface WinStreakResponse {
  success: boolean;
  data: {
    win_streak: number;
  };
}

// Add interface for session report response
interface SessionReportResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Add reducer type
interface QuestionGenerationState {
  isGenerating: boolean;
  questions: Question[];
  error: string | null;
}

// Add reducer action types
type QuestionGenerationAction =
  | { type: 'START_GENERATION' }
  | { type: 'GENERATION_SUCCESS'; questions: Question[] }
  | { type: 'GENERATION_ERROR'; error: string }
  | { type: 'RESET' };

// Add reducer function
function questionGenerationReducer(state: QuestionGenerationState, action: QuestionGenerationAction): QuestionGenerationState {
  switch (action.type) {
    case 'START_GENERATION':
      return { ...state, isGenerating: true, error: null };
    case 'GENERATION_SUCCESS':
      return { isGenerating: false, questions: action.questions, error: null };
    case 'GENERATION_ERROR':
      return { ...state, isGenerating: false, error: action.error };
    case 'RESET':
      return { isGenerating: false, questions: [], error: null };
    default:
      return state;
  }
}

interface GenerateQuestionsResponse {
  success: boolean;
  data: Question[];
}

interface AnswerResponse {
  is_correct: boolean;
  message?: string;
}

interface AnswerResult {
  isCorrect: boolean;
  explanation: string;
}

// Add this interface near the top of the file with other interfaces
export interface BattleRoundData {
  question_ids_done?: string | string[] | null;
  question_count_total?: number;
  [key: string]: any;
}

interface UpdateRoundResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * PvpBattle component - Main battle screen for player vs player mode
 */
export default function PvpBattle() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hostUsername, guestUsername, isHost, lobbyCode, hostId, guestId } =
    location.state || {};

  // Game state
  const [timeLeft, setTimeLeft] = useState(25);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [totalItems, setTotalItems] = useState(30); // Default value, will be updated from study material
  const [waitingForPlayer, setWaitingForPlayer] = useState(true);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [difficultyMode, setDifficultyMode] = useState<string | null>(null);
  const [studyMaterialId, setStudyMaterialId] = useState<string | null>(null);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);

  // Turn-based gameplay state
  const [gameStarted, setGameStarted] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showGameStart, setShowGameStart] = useState(false);
  const [gameStartText, setGameStartText] = useState("");
  const [showCardsAfterDelay, setShowCardsAfterDelay] = useState(false);

  // Player info
  const playerName = isHost ? hostUsername || "Host" : guestUsername || "Guest";
  const opponentName = isHost
    ? guestUsername || "Guest"
    : hostUsername || "Host";
  const currentUserId = isHost ? hostId : guestId;
  const opponentId = isHost ? guestId : hostId;
  const maxHealth = 100;

  // Animation state for player and enemy
  const [enemyAnimationState, setEnemyAnimationState] = useState("idle");
  const [playerAnimationState, setPlayerAnimationState] = useState("idle");
  const [enemyPickingIntroComplete, setEnemyPickingIntroComplete] =
    useState(false);
  const [playerPickingIntroComplete, setPlayerPickingIntroComplete] =
    useState(false);

  // Attack animation states
  const [showAttackAnimation, setShowAttackAnimation] = useState(false);
  const [isAttacker, setIsAttacker] = useState(false);
  const [lastHealthUpdate, setLastHealthUpdate] = useState({ player: 100, opponent: 100 });

  // Turn randomizer states
  const [showRandomizer, setShowRandomizer] = useState(false);
  const [randomizationDone, setRandomizationDone] = useState(false);

  // Victory modal states
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryMessage, setVictoryMessage] = useState("");

  // Question modal states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Add a state to track current turn number for poison effects
  const [currentTurnNumber, setCurrentTurnNumber] = useState(0);
  const [poisonEffectActive, setPoisonEffectActive] = useState(false);
  const [poisonTurnsRemaining, setPoisonTurnsRemaining] = useState(0);

  // Battle statistics tracking
  const [battleStats, setBattleStats] = useState({
    correctAnswers: 0,
    incorrectAnswers: 0,
    currentStreak: 0,
    highestStreak: 0,
    totalQuestions: 0,
  });

  // Win streak across games
  const [winStreak, setWinStreak] = useState(0);

  // Battle statistics for session report
  const [battleStartTime, setBattleStartTime] = useState<Date | null>(null);
  const [showSessionReport, setShowSessionReport] = useState(false);
  const [sessionReportSaved, setSessionReportSaved] = useState(false);

  // Replace individual states with reducer
  const [questionGenState, dispatchQuestionGen] = useReducer(questionGenerationReducer, {
    isGenerating: false,
    questions: [],
    error: null
  });

  // Update the shownQuestionIds state to store strings instead of numbers
  const [shownQuestionIds, setShownQuestionIds] = useState<Set<string>>(new Set());
  const [totalQuestionsShown, setTotalQuestionsShown] = useState(0);

  // Add state for correct answer animation
  const [showCorrectAnswerAnimation, setShowCorrectAnswerAnimation] = useState(false);

  // Add state for background image
  const [currentBackground, setCurrentBackground] = useState(PvpBattleBG);

  // Use the Battle hooks
  const { handleLeaveBattle, isEndingBattle, setIsEndingBattle } = useBattle({
    lobbyCode,
    hostId,
    guestId,
    isHost,
    battleState,
    currentUserId,
    opponentName,
    gameStarted,
    randomizationDone,
    showVictoryModal,
    showGameStart,
    isMyTurn,
    setWaitingForPlayer,
    setShowRandomizer,
    setBattleState,
    setGameStarted,
    setShowGameStart,
    setGameStartText,
    setIsMyTurn,
    setPlayerAnimationState,
    setPlayerPickingIntroComplete,
    setEnemyAnimationState,
    setEnemyPickingIntroComplete,
    setShowCards,
    setShowVictoryModal,
    setVictoryMessage,
    setRandomizationDone,
  });

  // Update the isGuestWaitingForRandomization function to show waiting message for guest
  const isGuestWaitingForRandomization = useCallback(() => {
    return !isHost &&
      !waitingForPlayer &&
      battleState?.battle_started &&
      !randomizationDone &&
      !showVictoryModal &&
      !showRandomizer;
  }, [isHost, waitingForPlayer, battleState?.battle_started, randomizationDone, showVictoryModal, showRandomizer]);

  // Show randomizer for both host and guest after delay for guest
  useEffect(() => {
    if (isHost && !waitingForPlayer && battleState?.battle_started && !randomizationDone && !showVictoryModal) {
      // Host sees randomizer immediately
      setShowRandomizer(true);
    } else if (!isHost && !waitingForPlayer && battleState?.battle_started && !randomizationDone && !showVictoryModal) {
      // Guest sees waiting message first, then randomizer after 2 seconds
      const timer = setTimeout(() => {
        setShowRandomizer(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setShowRandomizer(false);
    }
  }, [isHost, waitingForPlayer, battleState?.battle_started, randomizationDone, showVictoryModal]);

  // Add a new function to determine if we should show the main battle interface
  const shouldShowBattleInterface = useCallback(() => {
    if (isHost) {
      return gameStarted && !waitingForPlayer;
    } else {
      // For guest, show battle interface when battle has started and randomization is done
      return battleState?.battle_started && randomizationDone && !waitingForPlayer;
    }
  }, [isHost, gameStarted, waitingForPlayer, battleState?.battle_started, randomizationDone]);

  // Effect to handle delayed card display after game start
  useEffect(() => {
    if (gameStarted && !showCardsAfterDelay) {
      const timer = setTimeout(() => {
        setShowCardsAfterDelay(true);
      }, 2000); // 2 second delay
      return () => clearTimeout(timer);
    }
  }, [gameStarted]);

  // Handle card selection
  const handleCardSelected = async (cardId: string) => {
    // Store the selected card ID
    setSelectedCardId(cardId);

    // Show the question modal
    setShowQuestionModal(true);

    // Change player animation state to card_selected instead of idle
    setPlayerAnimationState("card_selected");
    setPlayerPickingIntroComplete(false);
  };

  // Handle game end based on questions
  const handleGameEnd = useCallback(() => {
    console.log("Game ending due to all questions being shown", {
      playerHealth,
      opponentHealth,
      currentQuestionNumber,
      totalItems
    });

    // Determine winner based on health
    const isPlayerWinner = playerHealth > opponentHealth;
    setVictoryMessage(isPlayerWinner ? "You Won!" : "You Lost!");
    setShowVictoryModal(true);
    setShowCards(false);
    setGameStarted(false);

    // Clear card selection data from sessionStorage
    sessionStorage.removeItem("battle_cards");
    sessionStorage.removeItem("battle_last_selected_index");
    sessionStorage.removeItem("battle_turn_count");
    sessionStorage.removeItem("battle_is_first_turn");
  }, [playerHealth, opponentHealth]);

  // Update handleAnswerSubmit to use string IDs
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [showAnswerResult, setShowAnswerResult] = useState(false);

  const handleAnswerSubmit = useCallback(async (answer: string | boolean) => {
    if (!currentQuestion) {
      console.error('No current question');
      return;
    }

    try {
      const response = await axios.post<AnswerResponse>('/api/battle/submit-answer', {
        session_uuid: battleState?.session_uuid,
        question_id: currentQuestion.id || '',
        selected_answer: answer,
        player_type: isHost ? 'host' : 'guest',
      });

      const explanation = currentQuestion.explanation ||
        (currentQuestion.itemInfo && currentQuestion.itemInfo.definition) ||
        'No explanation available';

      setAnswerResult({
        isCorrect: response.data.is_correct,
        explanation: explanation
      });

      if (response.data.is_correct) {
        setBattleStats((prev) => {
          const newStreak = prev.currentStreak + 1;
          return {
            ...prev,
            correctAnswers: prev.correctAnswers + 1,
            currentStreak: newStreak,
            highestStreak: Math.max(prev.highestStreak, newStreak),
            totalQuestions: prev.totalQuestions + 1,
          };
        });
      }

      setShowAnswerResult(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  }, [battleState?.session_uuid, currentQuestion, isHost]);

  // Add audio ref
  const attackSoundRef = useRef<HTMLAudioElement | null>(null);

  // Update the updateQuestionIdsDone function
  const updateQuestionIdsDone = async (questionId: string) => {
    if (!battleState?.session_uuid) return;

    console.log('Updating question IDs:', {
      questionId,
      sessionUuid: battleState.session_uuid,
      timestamp: new Date().toISOString()
    });

    try {
      // Get current question IDs from localStorage
      const storedIds = localStorage.getItem(`question_ids_${battleState.session_uuid}`);
      let currentQuestionIds: string[] = storedIds ? JSON.parse(storedIds) : [];

      // Add the new question ID if it's not already in the array
      if (!currentQuestionIds.includes(questionId)) {
        currentQuestionIds.push(questionId);
        
        // Update localStorage
        localStorage.setItem(`question_ids_${battleState.session_uuid}`, JSON.stringify(currentQuestionIds));
        
        // Update round data in the database using the update-round endpoint
        const response = await axios.put<UpdateRoundResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/update-round`,
          {
            session_uuid: battleState.session_uuid,
            player_type: isHost ? 'host' : 'guest',
            card_id: 'no-card-selected',
            is_correct: true,
            lobby_code: lobbyCode,
            question_ids_done: JSON.stringify(currentQuestionIds)
          }
        );
        
        if (response.data.success) {
          console.log('Successfully updated question IDs in round data:', currentQuestionIds);
        } else {
          console.error('Failed to update question IDs:', response.data.message);
        }
      } else {
        console.log('Question ID already exists:', questionId);
      }
    } catch (error) {
      console.error('Error updating question IDs:', error);
    }
  };

  const handleAnswerSubmitRound = async (isCorrect: boolean, questionId: string) => {
    if (!selectedCardId) return;

    console.log('handleAnswerSubmitRound called:', {
      isCorrect,
      selectedCardId,
      questionId,
      timestamp: new Date().toISOString()
    });

    // Update question IDs done if we have a question ID
    if (questionId) {
      console.log('Attempting to update question IDs for:', questionId);
      await updateQuestionIdsDone(questionId);
    } else {
      console.log('No question ID to update');
    }

    try {
      const playerType = isHost ? "host" : "guest";

      // Update battle stats first
      setBattleStats((prev) => {
        const newStreak = isCorrect ? prev.currentStreak + 1 : 0;
        const newStats = {
          ...prev,
          correctAnswers: isCorrect
            ? prev.correctAnswers + 1
            : prev.correctAnswers,
          incorrectAnswers: !isCorrect
            ? prev.incorrectAnswers + 1
            : prev.incorrectAnswers,
          currentStreak: newStreak,
          highestStreak: Math.max(prev.highestStreak, newStreak),
          totalQuestions: prev.totalQuestions + 1,
        };
        
        // Debug logging for question count update
        console.log("Updating battle stats:", {
          oldQuestionCount: prev.totalQuestions,
          newQuestionCount: newStats.totalQuestions,
          currentQuestionNumber,
          totalItems
        });
        
        return newStats;
      });

      // Increment question count only when an answer is submitted
      setCurrentQuestionNumber(prev => prev + 1);

      // Show correct answer animation if answer is correct
      if (isCorrect) {
        // Show the character animation first
        setShowCorrectAnswerAnimation(true);

        // Change player animation state to correct_answer
        setPlayerAnimationState("correct_answer");

        // Change background to non-overlayed version
        setCurrentBackground(PvpBattleBG);

        // After 1 second, also show the attack animation overlay and update enemy animation
        setTimeout(() => {
          setShowAttackAnimation(true);
          setIsAttacker(true);  // Always the attacker when correct

          // Set enemy to "been attacked" animation state
          setEnemyAnimationState("been_attacked");

          // Play attack sound
          if (attackSoundRef.current) {
            attackSoundRef.current.currentTime = 0;
            attackSoundRef.current.volume = 0.5; // Set volume to 50%
            attackSoundRef.current.play().catch(err => console.error("Error playing sound:", err));
          }
        }, 1000);

        // Wait 3 seconds total before proceeding with the turn switch
        setTimeout(async () => {
          setShowAttackAnimation(false);
          setShowCorrectAnswerAnimation(false);

          // Reset player animation state to idle
          setPlayerAnimationState("idle");

          // Reset enemy animation state to idle as well
          setEnemyAnimationState("idle");

          // Reset background to normal overlayed version
          setCurrentBackground(PvpBattleBG);

          // Continue with updating the battle round after animation
          try {
            // First update the round data
            const response = await axios.put(
              `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/update-round`,
              {
                session_uuid: battleState?.session_uuid,
                player_type: playerType,
                card_id: selectedCardId,
                is_correct: isCorrect,
                lobby_code: lobbyCode,
                battle_stats: battleStats,
              }
            );

            if (response.data.success) {
              console.log(
                `Card ${selectedCardId} selection and answer submission successful, turn switched`
              );

              // Then update the session to switch turns
              const turnResponse = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/update-session`,
                {
                  lobby_code: lobbyCode,
                  current_turn: isHost ? guestId : hostId, // Switch to the other player
                }
              );

              if (turnResponse.data.success) {
                console.log('Turn successfully switched to opponent');
              } else {
                console.error('Failed to switch turn:', turnResponse.data.message);
              }

              // Check if a card effect was applied
              if (response.data.data.card_effect) {
                if (response.data.data.card_effect.type === "normal-2" && isCorrect) {
                  // Show notification for Quick Draw card effect
                  const messageElement = document.createElement("div");
                  messageElement.className =
                    "fixed inset-0 flex items-center justify-center z-50";
                  messageElement.innerHTML = `
                    <div class="bg-purple-900/80 text-white py-4 px-8 rounded-lg text-xl font-bold shadow-lg border-2 border-purple-500/50">
                      Quick Draw Card: You get another turn!
                    </div>
                  `;
                  document.body.appendChild(messageElement);

                  // Remove the message after 2 seconds
                  setTimeout(() => {
                    document.body.removeChild(messageElement);
                  }, 2000);
                } else if (
                  response.data.data.card_effect.type === "normal-1" &&
                  isCorrect
                ) {
                  // Show notification for Time Manipulation card effect
                  const messageElement = document.createElement("div");
                  messageElement.className =
                    "fixed inset-0 flex items-center justify-center z-50";
                  const reductionPercent =
                    response.data.data.card_effect.reduction_percent || 30;
                  messageElement.innerHTML = `
                    <div class="bg-purple-900/80 text-white py-4 px-8 rounded-lg text-xl font-bold shadow-lg border-2 border-purple-500/50">
                      Time Manipulation Card: Opponent's time will be reduced by ${reductionPercent}%!
                    </div>
                  `;
                  document.body.appendChild(messageElement);

                  // Remove the message after 2 seconds
                  setTimeout(() => {
                    document.body.removeChild(messageElement);
                  }, 2000);
                }
              }
            } else {
              console.error(
                "Failed to update battle round:",
                response?.data?.message || "Unknown error"
              );
            }
          } catch (error) {
            console.error("Error updating battle round:", error);
          }
        }, 3000);
      } else {
        // If incorrect, display incorrect answer animation for 1.5 seconds
        setPlayerAnimationState("incorrect_answer");

        // Keep the original background
        // No need to change background for incorrect answers

        // Wait 1.5 seconds before proceeding normally without attack animation
        setTimeout(async () => {
          // Reset player animation state to idle
          setPlayerAnimationState("idle");

          // No need to reset background as it wasn't changed

          try {
            // First update the round data
          const response = await axios.put(
            `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/update-round`,
            {
              session_uuid: battleState?.session_uuid,
              player_type: playerType,
              card_id: selectedCardId,
              is_correct: isCorrect,
              lobby_code: lobbyCode,
                battle_stats: battleStats,
            }
          );

          if (response.data.success) {
            console.log(
              `Card ${selectedCardId} selection and answer submission successful, turn switched`
            );

              // Then update the session to switch turns
              const turnResponse = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/update-session`,
                {
                  lobby_code: lobbyCode,
                  current_turn: isHost ? guestId : hostId, // Switch to the other player
                }
              );

              if (turnResponse.data.success) {
                console.log('Turn successfully switched to opponent');
              } else {
                console.error('Failed to switch turn:', turnResponse.data.message);
              }
          } else {
            console.error(
              "Failed to update battle round:",
              response?.data?.message || "Unknown error"
            );
          }
          } catch (error) {
            console.error("Error updating battle round:", error);
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating battle round:", error);
    }
  };

  // Handle question modal close
  const handleQuestionModalClose = () => {
    // Close the question modal and clear selected card ID
    setShowQuestionModal(false);
    setSelectedCardId(null);
    // Note: We don't reset the animation state here
    // The animation state (card_selected) will remain until handleAnswerSubmitRound
    // changes it based on whether the answer was correct or incorrect
  };

  // Remove the useEffect that shows attack animation for defender when health decreases
  // and replace with a simpler effect to just track health changes
  useEffect(() => {
    // Update last health values without showing an attack animation
    setLastHealthUpdate({
      player: playerHealth,
      opponent: opponentHealth
    });
  }, [playerHealth, opponentHealth]);

  // Handle poison effects and health updates
  useEffect(() => {
    const checkAndApplyPoisonEffects = async () => {
      if (!battleState?.session_uuid) return;

      try {
        // Get battle scores
        const scoresResponse = await axios.get<{data: BattleScoresResponse}>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/scores/${battleState.session_uuid}`
        );

        // Get round data
        const roundResponse = await axios.get<{data: BattleRoundData}>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/round/${battleState.session_uuid}`
        );

        const battleScores = scoresResponse.data.data;
        const roundData = roundResponse.data.data;

        // Debug logging for question IDs
        console.log('Question IDs state:', {
          localStorage: localStorage.getItem(`question_ids_${battleState.session_uuid}`),
          roundData: roundData.question_ids_done,
          timestamp: new Date().toISOString()
        });

        // Check and initialize question_ids_done in localStorage if needed
        const storedIds = localStorage.getItem(`question_ids_${battleState.session_uuid}`);
        if (!storedIds) {
          console.log('Initializing question_ids_done array in localStorage');
          localStorage.setItem(`question_ids_${battleState.session_uuid}`, JSON.stringify([]));
        }

        // If round data has question IDs but localStorage doesn't, sync them
        if (roundData.question_ids_done && !storedIds) {
          try {
            const parsedIds = typeof roundData.question_ids_done === 'string' 
              ? JSON.parse(roundData.question_ids_done)
              : roundData.question_ids_done;
            localStorage.setItem(`question_ids_${battleState.session_uuid}`, JSON.stringify(parsedIds));
            console.log('Synced question IDs from round data to localStorage:', parsedIds);
          } catch (e) {
            console.error('Error syncing question IDs from round data:', e);
          }
        }

        if (battleScores.success && battleScores.data) {
          const scores = battleScores.data;

          // Debug logging for question count and IDs
          console.log("Battle scores and round data update:", {
            scores_question_count: scores.question_count_total,
            round_question_count: roundData.question_count_total,
            question_ids_done: roundData.question_ids_done,
            current_state: {
              currentQuestionNumber,
              totalItems
            }
          });

          // Update question count from round data if available
          if (roundData.question_count_total) {
            setCurrentQuestionNumber(roundData.question_count_total);
          }
          // Fallback to scores data if round data is not available
          else if (scores.question_count_total) {
            setCurrentQuestionNumber(scores.question_count_total);
          }

          // Set health based on whether player is host or guest
          if (isHost) {
            setPlayerHealth(scores.host_health);
            setOpponentHealth(scores.guest_health);

            // Check for victory/defeat conditions
            if (scores.host_health <= 0) {
              console.log("Host health <= 0, showing defeat modal");
              setVictoryMessage("You Lost!");
              setShowVictoryModal(true);
              setShowCards(false); // Hide cards when game ends
              // Clear card selection data from sessionStorage
              sessionStorage.removeItem("battle_cards");
              sessionStorage.removeItem("battle_last_selected_index");
              sessionStorage.removeItem("battle_turn_count");
              sessionStorage.removeItem("battle_is_first_turn");
            } else if (scores.guest_health <= 0) {
              console.log("Guest health <= 0, showing victory modal for host");
              setVictoryMessage("You Won!");
              setShowVictoryModal(true);
              setShowCards(false); // Hide cards when game ends
              // Clear card selection data from sessionStorage
              sessionStorage.removeItem("battle_cards");
              sessionStorage.removeItem("battle_last_selected_index");
              sessionStorage.removeItem("battle_turn_count");
              sessionStorage.removeItem("battle_is_first_turn");
            }
          } else {
            setPlayerHealth(scores.guest_health);
            setOpponentHealth(scores.host_health);

            // Check for victory/defeat conditions
            if (scores.guest_health <= 0) {
              console.log("Guest health <= 0, showing defeat modal");
              setVictoryMessage("You Lost!");
              setShowVictoryModal(true);
              setShowCards(false); // Hide cards when game ends
              // Clear card selection data from sessionStorage
              sessionStorage.removeItem("battle_cards");
              sessionStorage.removeItem("battle_last_selected_index");
              sessionStorage.removeItem("battle_turn_count");
              sessionStorage.removeItem("battle_is_first_turn");
            } else if (scores.host_health <= 0) {
              console.log("Host health <= 0, showing victory modal for guest");
              setVictoryMessage("You Won!");
              setShowVictoryModal(true);
              setShowCards(false); // Hide cards when game ends
              // Clear card selection data from sessionStorage
              sessionStorage.removeItem("battle_cards");
              sessionStorage.removeItem("battle_last_selected_index");
              sessionStorage.removeItem("battle_turn_count");
              sessionStorage.removeItem("battle_is_first_turn");
            }
          }

          // Log health status for debugging
          console.log("Health status update:", {
            isHost,
            hostHealth: scores.host_health,
            guestHealth: scores.guest_health,
            playerHealth: isHost ? scores.host_health : scores.guest_health,
            opponentHealth: isHost ? scores.guest_health : scores.host_health,
            showingVictoryModal: showVictoryModal
          });
        }
      } catch (error) {
        console.error("Error fetching battle scores:", error);
      }
    };

    // Poll for battle scores more frequently
    const scoresPollInterval = setInterval(checkAndApplyPoisonEffects, 1000);
    checkAndApplyPoisonEffects(); // Initial fetch

    return () => clearInterval(scoresPollInterval);
  }, [battleState?.session_uuid, isHost]);

  // Add a separate effect to ensure victory modal stays visible
  useEffect(() => {
    if (playerHealth <= 0 || opponentHealth <= 0) {
      const isPlayerWinner = playerHealth > 0 && opponentHealth <= 0;
      setVictoryMessage(isPlayerWinner ? "You Won!" : "You Lost!");
      setShowVictoryModal(true);
      setShowCards(false);

      // Clear card selection data from sessionStorage
      sessionStorage.removeItem("battle_cards");
      sessionStorage.removeItem("battle_last_selected_index");
      sessionStorage.removeItem("battle_turn_count");
      sessionStorage.removeItem("battle_is_first_turn");
    }
  }, [playerHealth, opponentHealth]);

  // Add polling for turn updates
  useEffect(() => {
    // Skip if game hasn't started or we're waiting for players
    if (!gameStarted || waitingForPlayer || !battleState?.session_uuid) return;

    // Function to check if it's our turn
    const checkTurn = async () => {
      try {
        // Get the latest session state
        const { data } = await axios.get<BattleSessionResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/session-state/${lobbyCode}`
        );

        if (data.success && data.data) {
          const sessionData = data.data;

          // Update local battle state with proper type safety
          setBattleState((prevState) => {
            // If prevState is null, we can't update it properly
            if (!prevState) return null;

            return {
              ...prevState,
              current_turn: sessionData.current_turn,
              // Only set cards if they exist in the session data
              ...(sessionData.host_card && {
                host_card: sessionData.host_card,
              }),
              ...(sessionData.guest_card && {
                guest_card: sessionData.guest_card,
              }),
            };
          });

          // Check if it's this player's turn
          const isCurrentPlayerTurn = sessionData.current_turn === currentUserId;

          // If turn has changed
          if (isCurrentPlayerTurn !== isMyTurn) {
            console.log(`Turn changed: ${isMyTurn} → ${isCurrentPlayerTurn}`);

            // Update UI accordingly
            setIsMyTurn(isCurrentPlayerTurn);

            if (isCurrentPlayerTurn) {
              // My turn now - update animations
              setPlayerAnimationState("picking");
              setPlayerPickingIntroComplete(false);
              setEnemyAnimationState("idle");
              setEnemyPickingIntroComplete(false);
            } else {
              // Opponent's turn - update animations
              setPlayerAnimationState("idle");
              setPlayerPickingIntroComplete(false);
              setEnemyAnimationState("picking");
              setEnemyPickingIntroComplete(false);
            }

            // Always show cards UI regardless of whose turn it is
            setShowCards(true);
          }
        }
      } catch (error) {
        console.error("Error checking turn status:", error);
      }
    };

    // Set up polling for turn updates (every 2 seconds)
    const turnCheckInterval = setInterval(checkTurn, 2000);

    // Initial check
    checkTurn();

    return () => clearInterval(turnCheckInterval);
  }, [gameStarted, waitingForPlayer, battleState?.session_uuid, lobbyCode, currentUserId, isMyTurn]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 || waitingForPlayer) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, waitingForPlayer]);

  // Handle victory confirmation
  const handleVictoryConfirm = () => {
    // Remove all event listeners to prevent confirmation dialog
    window.onbeforeunload = null;

    // Clear card selection data from sessionStorage
    sessionStorage.removeItem("battle_cards");
    sessionStorage.removeItem("battle_last_selected_index");
    sessionStorage.removeItem("battle_turn_count");
    sessionStorage.removeItem("battle_is_first_turn");

    // Navigate directly to dashboard without creating a history entry
    window.location.replace("/dashboard/home");
  };

  // Handle viewing session report
  const handleViewSessionReport = async () => {
    // Clear card selection data from sessionStorage
    sessionStorage.removeItem("battle_cards");
    sessionStorage.removeItem("battle_last_selected_index");
    sessionStorage.removeItem("battle_turn_count");
    sessionStorage.removeItem("battle_is_first_turn");

    // Calculate time spent
    const endTime = new Date();
    const startTime = battleStartTime || new Date();
    const timeDiffMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(timeDiffMs / 60000);
    const seconds = Math.floor((timeDiffMs % 60000) / 1000);
    const timeSpent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    // Determine if player is winner
    const isWinner = playerHealth > 0 && opponentHealth <= 0;

    try {
      // Get current win streak for winner
      const winnerId = isHost
        ? isWinner
          ? hostId
          : guestId
        : isWinner
          ? guestId
          : hostId;
      const loserId = isHost
        ? isWinner
          ? guestId
          : hostId
        : isWinner
          ? hostId
          : guestId;

      // First update win streaks in the database
      const [winnerUpdate, loserUpdate] = await Promise.all([
        // Update winner's streak
        axios.put<WinStreakResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/win-streak`,
          {
            firebase_uid: winnerId,
            is_winner: true,
          }
        ),
        // Reset loser's streak
        axios.put<WinStreakResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/win-streak`,
          {
            firebase_uid: loserId,
            is_winner: false,
          }
        ),
      ]);

      // Get the updated win streak for reward calculation
      const updatedWinStreak = winnerUpdate.data.success
        ? winnerUpdate.data.data.win_streak
        : 0;

      // Calculate rewards using the updated win streak from the database
      const hostRewards = calculateBattleRewards(
        isHost ? isWinner : !isWinner,
        isHost ? playerHealth : opponentHealth,
        isHost ? opponentHealth : playerHealth,
        isHost
          ? isWinner
            ? updatedWinStreak
            : 0
          : !isWinner
            ? updatedWinStreak
            : 0,
        false // TODO: Get premium status from user context
      );

      const guestRewards = calculateBattleRewards(
        !isHost ? isWinner : !isWinner,
        !isHost ? playerHealth : opponentHealth,
        !isHost ? opponentHealth : playerHealth,
        !isHost
          ? isWinner
            ? updatedWinStreak
            : 0
          : !isWinner
            ? updatedWinStreak
            : 0,
        false // TODO: Get premium status from user context
      );

      // Save session report to database
      if (battleState?.session_uuid) {
        try {
          const sessionReportPayload = {
            session_uuid: battleState.session_uuid,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            material_id: studyMaterialId,
            host_id: hostId,
            host_health: playerHealth,
            host_correct_count: battleStats.correctAnswers,
            host_incorrect_count: battleStats.incorrectAnswers,
            host_highest_streak: battleStats.highestStreak,
            host_xp_earned: hostRewards.xp,
            host_coins_earned: hostRewards.coins,
            guest_id: guestId,
            guest_health: opponentHealth,
            guest_correct_count: battleStats.correctAnswers,
            guest_incorrect_count: battleStats.incorrectAnswers,
            guest_highest_streak: battleStats.highestStreak,
            guest_xp_earned: guestRewards.xp,
            guest_coins_earned: guestRewards.coins,
            winner_id: playerHealth > 0 ? hostId : guestId,
            defeated_id: playerHealth > 0 ? guestId : hostId,
            battle_duration: Math.floor(timeDiffMs / 1000),
            early_end: false,
          };

          const { data } = await axios.post<SessionReportResponse>(
            `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/save-session-report`,
            sessionReportPayload
          );

          if (data.success) {
            console.log("Session report saved successfully");
          } else {
            console.error("Failed to save session report:", data.message);
          }
        } catch (error) {
          console.error("Error saving session report:", error);
        }
      }

      // Navigate to session report with battle data
      navigate("/dashboard/pvp-battle/session-report", {
        state: {
          timeSpent,
          correctCount: battleStats.correctAnswers,
          incorrectCount: battleStats.incorrectAnswers,
          mode: "pvp",
          material: { study_material_id: studyMaterialId },
          earlyEnd: false,
          startTime: battleStartTime,
          highestStreak: battleStats.highestStreak,
          playerHealth,
          opponentHealth,
          playerName,
          opponentName,
          isWinner,
          sessionUuid: battleState?.session_uuid,
          hostId,
          guestId,
          isHost,
          earnedXP: isHost ? hostRewards.xp : guestRewards.xp,
          earnedCoins: isHost ? hostRewards.coins : guestRewards.coins,
        },
      });
      console.log("Host Rewards:", hostRewards);
      console.log("Guest Rewards:", guestRewards);
    } catch (error) {
      console.error("Error handling session report:", error);
    }
  };

  // Handle settings button click
  const handleSettingsClick = async () => {
    // Prevent multiple calls
    if (isEndingBattle) return;

    // Show confirmation dialog
    const confirmLeave = window.confirm(
      "Are you sure you want to leave the battle? Your progress will be lost, the battle will end, and you may be penalized for leaving early."
    );

    if (confirmLeave) {
      try {
        // Call handleLeaveBattle with the current user's ID
        await handleLeaveBattle("Left The Game", currentUserId);
      } catch (error) {
        console.error("Error leaving battle:", error);
        // Force navigation anyway on error
        window.location.replace("/dashboard/home");
      }
    }
  };

  // Effect to fetch battle session data
  useEffect(() => {
    const fetchBattleSessionData = async () => {
      if (!lobbyCode) return;

      try {
        const { data } = await axios.get<BattleSessionResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/session-with-material/${lobbyCode}`
        );

        if (data.success && data.data) {
          setDifficultyMode(data.data.difficulty_mode);

          // Set question types from battle session
          if (data.data.question_types) {
            setQuestionTypes(data.data.question_types);
          }

          // Get the study material id
          if (data.data.study_material_id) {
            setStudyMaterialId(data.data.study_material_id);

            // Fetch study material info to get total items
            try {
              const { data: studyMaterialData } = await axios.get<StudyMaterialInfoResponse>(
                `${import.meta.env.VITE_BACKEND_URL}/api/study-material/info/${data.data.study_material_id}`
              );

              if (studyMaterialData.success && studyMaterialData.data.total_items) {
                console.log('Setting totalItems from study material:', {
                  total_items: studyMaterialData.data.total_items,
                  study_material_id: data.data.study_material_id
                });
                setTotalItems(studyMaterialData.data.total_items);
              }
            } catch (error) {
              console.error("Error fetching study material info:", error);
            }
          }

          // Store session UUID and player role in sessionStorage for card effects
          if (data.data.session_uuid) {
            sessionStorage.setItem("battle_session_uuid", data.data.session_uuid);
            sessionStorage.setItem("is_host", isHost.toString());

            // Clear card stats at the start of a new battle
            sessionStorage.removeItem("battle_card_stats");
          }
        }
      } catch (error) {
        console.error("Error fetching battle session data:", error);
      }
    };

    fetchBattleSessionData();
  }, [lobbyCode, isHost]);

  // Set battle start time when game starts
  useEffect(() => {
    if (gameStarted && !battleStartTime) {
      setBattleStartTime(new Date());

      // Clear card stats when game starts
      sessionStorage.removeItem("battle_card_stats");
    }
  }, [gameStarted, battleStartTime]);

  // Update effect to use proper types
  useEffect(() => {
    const generateQuestions = async () => {
      if (battleState?.battle_started && !questionGenState.isGenerating && questionGenState.questions.length === 0) {
        try {
          dispatchQuestionGen({ type: 'START_GENERATION' });

          const { data } = await axios.post<GenerateQuestionsResponse>(
            `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/generate-questions`,
            {
              session_uuid: battleState.session_uuid,
              study_material_id: studyMaterialId,
              difficulty_mode: difficultyMode,
              question_types: questionTypes,
              player_type: isHost ? 'host' : 'guest'
            }
          );

          if (data?.success && data.data) {
            dispatchQuestionGen({
              type: 'GENERATION_SUCCESS',
              questions: data.data
            });
          }
        } catch (error) {
          console.error('Error generating questions:', error);
          dispatchQuestionGen({
            type: 'GENERATION_ERROR',
            error: 'Failed to generate questions. Please try again.'
          });
          toast.error('Failed to generate questions. Please try again.');
        }
      }
    };

    generateQuestions();
  }, [battleState?.battle_started, battleState?.session_uuid, studyMaterialId, difficultyMode, questionTypes, isHost, questionGenState.isGenerating, questionGenState.questions.length]);

  // Add useEffect for game state changes
  useEffect(() => {
    if (gameStarted && !waitingForPlayer) {
      // Emit player entered game with inGame field
      socket.emit('player_entered_game', {
        playerId: currentUserId,
        mode: 'pvp-battle',
        inGame: true
      });

      // Also emit user game status change
      socket.emit('userGameStatusChanged', {
        userId: currentUserId,
        mode: 'pvp-battle',
        inGame: true
      });
    } else {
      // When game ends or player is waiting, set inGame to false
      socket.emit('player_entered_game', {
        playerId: currentUserId,
        mode: 'pvp-battle',
        inGame: false
      });

      socket.emit('userGameStatusChanged', {
        userId: currentUserId,
        mode: 'pvp-battle',
        inGame: false
      });
    }

    // Cleanup function to handle component unmount
    return () => {
      // Clean up any session storage related to card selection
      sessionStorage.removeItem("battle_cards");
      sessionStorage.removeItem("battle_last_selected_index");
      sessionStorage.removeItem("battle_turn_count");
      sessionStorage.removeItem("battle_is_first_turn");

      socket.emit('player_exited_game', {
        playerId: currentUserId,
        inGame: false
      });

      socket.emit('userGameStatusChanged', {
        userId: currentUserId,
        mode: 'pvp-battle',
        inGame: false
      });
    };
  }, [gameStarted, waitingForPlayer, currentUserId]);

  // Monitor question count changes
  useEffect(() => {
    console.log('Question count state changed:', {
      currentQuestionNumber,
      totalItems,
      timestamp: new Date().toISOString()
    });
  }, [currentQuestionNumber, totalItems]);

  // Monitor battle round data for question count updates
  useEffect(() => {
    if (battleState?.session_uuid) {
      const fetchRoundData = async () => {
        try {
          const response = await axios.get<BattleRoundResponse>(
            `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/round/${battleState.session_uuid}`
          );

          if (response.data?.question_count_total) {
            console.log('Question count update from round data:', {
              new_count: response.data.question_count_total,
              current_count: currentQuestionNumber,
              total_questions: totalItems,
              timestamp: new Date().toISOString()
            });

            // Check if we've reached or exceeded the total questions
            if (response.data.question_count_total >= totalItems) {
              console.log('Question limit reached, ending game');
              // Determine winner based on health
              const isPlayerWinner = playerHealth > opponentHealth;
              setVictoryMessage(isPlayerWinner ? "You Won!" : "You Lost!");
              setShowVictoryModal(true);
              setShowCards(false);
              setGameStarted(false);
              return;
            }

            setCurrentQuestionNumber(response.data.question_count_total);
          }
        } catch (error) {
          console.error('Error fetching round data:', error);
        }
      };

      // Poll for round data every second
      const interval = setInterval(fetchRoundData, 1000);
      fetchRoundData(); // Initial fetch

      return () => clearInterval(interval);
    }
  }, [battleState?.session_uuid, totalItems, playerHealth, opponentHealth]);

  return (
    <div
      className="w-full h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${currentBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Audio element for attack sound */}
      <audio
        ref={attackSoundRef}
        src="/GameBattle/magical-twinkle-242245.mp3"
        preload="auto"
      />

      {/* Character animation manager */}
      <CharacterAnimationManager
        playerAnimationState={playerAnimationState}
        enemyAnimationState={enemyAnimationState}
        setPlayerPickingIntroComplete={setPlayerPickingIntroComplete}
        setEnemyPickingIntroComplete={setEnemyPickingIntroComplete}
        playerPickingIntroComplete={playerPickingIntroComplete}
        enemyPickingIntroComplete={enemyPickingIntroComplete}
      />

      {/* Attack Animation Overlay */}
      {showAttackAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <img
            src="/GameBattle/AttackAndAttacked.png"
            alt="Attack Animation"
            className="max-w-full max-h-full"
            style={{
              animation: "fadeInPulse 1s ease-out",
            }}
          />
        </div>
      )}

      <style>
        {`
        @keyframes fadeInPulse {
          0% { opacity: 0; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        `}
      </style>

      {/* Only show the top UI bar when the battle interface should be shown */}
      {shouldShowBattleInterface() && (
        <div className="w-full py-4 px-4 sm:px-8 md:px-16 lg:px-32 xl:px-80 mt-4 lg:mt-12 flex items-center justify-between">
          <PlayerInfo
            name={playerName}
            health={playerHealth}
            maxHealth={maxHealth}
            userId={currentUserId}
            poisonEffectActive={poisonEffectActive}
          />

          <QuestionTimer
            timeLeft={timeLeft}
            currentQuestion={currentQuestionNumber}
            totalQuestions={totalItems}
            difficultyMode={difficultyMode}
            randomizationDone={randomizationDone}
            sessionUuid={battleState?.session_uuid}
          />

          <PlayerInfo
            name={opponentName}
            health={opponentHealth}
            maxHealth={maxHealth}
            isRightAligned
            userId={opponentId}
            poisonEffectActive={false}
          />

          {/* Settings button */}
          <button
            className="absolute right-2 sm:right-4 top-2 sm:top-4 text-white"
            onClick={handleSettingsClick}
          >
            <Settings size={16} className="sm:w-[20px] sm:h-[20px]" />
          </button>
        </div>
      )}

      {/* Main Battle Area */}
      <div className="flex-1 relative">
        {/* Characters */}
        {shouldShowBattleInterface() && (
          <>
            <Character
              imageSrc={getCharacterImage(
                playerCharacter,
                playerAnimationState,
                playerPickingIntroComplete
              )}
              alt="Player Character"
            />

            <Character
              imageSrc={getCharacterImage(
                enemyCharacter,
                enemyAnimationState,
                enemyPickingIntroComplete
              )}
              alt="Enemy Character"
              isRight
            />
          </>
        )}

        {/* Turn Randomizer (shown to both host and guest) */}
        {showRandomizer && (
          <TurnRandomizer
            isHost={isHost}
            lobbyCode={lobbyCode}
            hostUsername={hostUsername}
            guestUsername={guestUsername}
            hostId={hostId}
            guestId={guestId}
            showRandomizer={showRandomizer}
            playerPickingIntroComplete={playerPickingIntroComplete}
            enemyPickingIntroComplete={enemyPickingIntroComplete}
            battleState={battleState}
            setRandomizationDone={setRandomizationDone}
            setShowRandomizer={setShowRandomizer}
            setShowGameStart={setShowGameStart}
            setGameStartText={setGameStartText}
            setGameStarted={setGameStarted}
            setIsMyTurn={setIsMyTurn}
            setPlayerAnimationState={setPlayerAnimationState}
            setPlayerPickingIntroComplete={setPlayerPickingIntroComplete}
            setEnemyAnimationState={setEnemyAnimationState}
            setEnemyPickingIntroComplete={setEnemyPickingIntroComplete}
            setShowCards={setShowCards}
          />
        )}

        {/* Waiting for host to randomize (shown to guest for 2 seconds) */}
        {isGuestWaitingForRandomization() && (
          <GuestWaitingForRandomization waitingForRandomization={true} />
        )}

        {/* Game Start Animation */}
        {showGameStart && (
          <GameStartAnimation
            showGameStart={showGameStart}
            gameStartText={gameStartText}
          />
        )}

        {/* Card Selection UI - Show after the waiting screen and delay */}
        {shouldShowBattleInterface() &&
          showCards &&
          showCardsAfterDelay &&
          !showVictoryModal && (
            <div className="fixed inset-0 bg-black/20 z-10">
              <CardSelection
                isMyTurn={isMyTurn}
                opponentName={opponentName}
                playerName={playerName}
                onCardSelected={handleCardSelected}
                difficultyMode={difficultyMode}
              />
            </div>
          )}

        {/* Waiting overlay - now checks only if either player isn't in battle yet */}
        {waitingForPlayer && !showVictoryModal && (
          <WaitingOverlay
            isVisible={true}
            message="Waiting for your opponent to connect..."
          />
        )}

        {/* Loading overlay when ending battle */}
        <LoadingOverlay isVisible={isEndingBattle} />

        {/* Victory Modal */}
        <VictoryModal
          isOpen={showVictoryModal}
          onClose={handleVictoryConfirm}
          onViewReport={handleViewSessionReport}
          isVictory={victoryMessage.includes('Won')}
          currentUserId={currentUserId}
          sessionUuid={battleState?.session_uuid}
          playerHealth={playerHealth}
          opponentHealth={opponentHealth}
        />

        {/* Question Modal */}
        {!showVictoryModal && shouldShowBattleInterface() && (
          <QuestionModal
            isOpen={showQuestionModal}
            onClose={handleQuestionModalClose}
            onAnswerSubmit={handleAnswerSubmit}
            onAnswerSubmitRound={handleAnswerSubmitRound}
            difficultyMode={difficultyMode}
            questionTypes={questionTypes}
            selectedCardId={selectedCardId}
            aiQuestions={questionGenState.questions}
            isGeneratingAI={questionGenState.isGenerating}
            currentQuestionNumber={currentQuestionNumber}
            totalQuestions={totalItems}
            onGameEnd={handleGameEnd}
            shownQuestionIds={shownQuestionIds}
            battleState={battleState}
          />
        )}

        {/* Session Report */}
        {showSessionReport && <PvpSessionReport />}

        {/* Poison effect indicator */}
        {poisonEffectActive && !showVictoryModal && shouldShowBattleInterface() && (
          <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
            <div className="absolute inset-0 bg-green-500/20 animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}