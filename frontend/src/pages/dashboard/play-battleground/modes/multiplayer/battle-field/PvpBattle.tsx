import { useState, useEffect, useReducer, useCallback, useRef } from "react";
import { Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Question } from "../../../types";
import {
  BattleRoundResponse,
  BattleScoresResponse,
  BattleSessionResponse,
  BattleStatusResponse,
} from "../../../types/battle";
import { socket } from "../../../../../../socket";

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
import {
  VictoryModal,
  EarlyLeaveModal,
  TieGameModal,
} from "./modals/BattleModals";
import CharacterAnimationManager from "./components/CharacterAnimationManager";
import GameStartAnimation from "./components/GameStartAnimation";
import GuestWaitingForRandomization from "./components/GuestWaitingForRandomization";
import QuestionModal from "./components/QuestionModal";
import PvpSessionReport from "./screens/PvpSessionReport";
import EnemyQuestionDisplay from "./components/EnemyQuestionDisplay";

// Import utils directly
import TurnRandomizer from "./utils/TurnRandomizer";
import { getCharacterImage } from "./utils/getCharacterImage";
import QuestionTimer from "./utils/QuestionTimer";
import {
  calculateBattleRewards,
  earlyEndRewards,
} from "./utils/rewardCalculator";

// Import shared BattleState interface
import { BattleState } from "./BattleState";

// Import the sound settings modal
import SoundSettingsModal from "./components/SoundSettingsModal";
import DocumentHead from "../../../../../../components/DocumentHead";

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
  | { type: "START_GENERATION" }
  | { type: "GENERATION_SUCCESS"; questions: Question[] }
  | { type: "GENERATION_ERROR"; error: string }
  | { type: "RESET" };

// Add reducer function
function questionGenerationReducer(
  state: QuestionGenerationState,
  action: QuestionGenerationAction
): QuestionGenerationState {
  switch (action.type) {
    case "START_GENERATION":
      return { ...state, isGenerating: true, error: null };
    case "GENERATION_SUCCESS":
      return { isGenerating: false, questions: action.questions, error: null };
    case "GENERATION_ERROR":
      return { ...state, isGenerating: false, error: action.error };
    case "RESET":
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

// Add these imports at the top of the file after other imports
import { motion, AnimatePresence } from "framer-motion";

/**
 * PvpBattle component - Main battle screen for player vs player mode
 */
export default function PvpBattle() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hostUsername, guestUsername, isHost, lobbyCode, hostId, guestId } =
    location.state || {};

  // Add a force update reducer
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // Audio refs
  const backgroundMusicRef = useRef<HTMLAudioElement>(null);
  const attackSoundRef = useRef<HTMLAudioElement>(null);
  const correctAnswerSoundRef = useRef<HTMLAudioElement>(null);
  const incorrectAnswerSoundRef = useRef<HTMLAudioElement>(null);
  const correctSfxRef = useRef<HTMLAudioElement>(null);
  const incorrectSfxRef = useRef<HTMLAudioElement>(null);
  const decreaseHealthSoundRef = useRef<HTMLAudioElement>(null);
  const healthAttackSoundRef = useRef<HTMLAudioElement>(null);
  const healRegenSoundRef = useRef<HTMLAudioElement>(null);
  const regenerationSfxRef = useRef<HTMLAudioElement>(null);
  const selectedCardSoundRef = useRef<HTMLAudioElement>(null);
  const noSelectedCardSoundRef = useRef<HTMLAudioElement>(null);
  const answerShieldActivatedSoundRef = useRef<HTMLAudioElement>(null);
  const answerShieldDamagedSoundRef = useRef<HTMLAudioElement>(null);
  const mindControlActivateSoundRef = useRef<HTMLAudioElement>(null);
  const mindControlEffectSoundRef = useRef<HTMLAudioElement>(null);
  const victorySoundRef = useRef<HTMLAudioElement>(null);
  const defeatSoundRef = useRef<HTMLAudioElement>(null);
  const leftGameSoundRef = useRef<HTMLAudioElement>(null);
  const quickDrawUserSoundRef = useRef<HTMLAudioElement | null>(null);
  const quickDrawEnemySoundRef = useRef<HTMLAudioElement | null>(null);

  // Time Manipulation sounds
  const timeManipulationActivateSoundRef = useRef<HTMLAudioElement | null>(
    null
  );
  const timeManipulationEffectSoundRef = useRef<HTMLAudioElement | null>(null);

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

  // Use these state variables for tracking QuickDraw effects
  const [showOpponentQuickDrawMessage, setShowOpponentQuickDrawMessage] =
    useState(false);
  const [currentQuickDrawEffectId, setCurrentQuickDrawEffectId] = useState<
    string | null
  >(null);

  // Add state for visual Quick Draw effect animation
  const [showQuickDrawEffect, setShowQuickDrawEffect] = useState(false);

  // Attack animation states
  const [showAttackAnimation, setShowAttackAnimation] = useState(false);
  const [isAttacker, setIsAttacker] = useState(false);
  const [lastHealthUpdate, setLastHealthUpdate] = useState({
    player: 100,
    opponent: 100,
  });

  // Turn randomizer states
  const [showRandomizer, setShowRandomizer] = useState(false);
  const [randomizationDone, setRandomizationDone] = useState(false);

  // Victory modal states
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryMessage, setVictoryMessage] = useState("");

  // Question modal states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Add state for mind control effect
  const [hasMindControl, setHasMindControl] = useState(false);
  const [mindControlActive, setMindControlActive] = useState(false);

  // State for card blocking effect
  const [hasCardBlocking, setHasCardBlocking] = useState(false);
  const [blockedCardCount, setBlockedCardCount] = useState(0);
  const [visibleCardIndices, setVisibleCardIndices] = useState<number[]>([]);

  // Add a state to track current turn number for poison effects
  const [currentTurnNumber, setCurrentTurnNumber] = useState(0);
  const [poisonEffectActive, setPoisonEffectActive] = useState(false);
  const [opponentPoisonEffectActive, setOpponentPoisonEffectActive] =
    useState(false);
  const [poisonTurnsRemaining, setPoisonTurnsRemaining] = useState(0);
  const [playerEffects, setPlayerEffects] = useState<any[]>([]);
  const [opponentEffects, setOpponentEffects] = useState<any[]>([]);

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
  const [questionGenState, dispatchQuestionGen] = useReducer(
    questionGenerationReducer,
    {
      isGenerating: false,
      questions: [],
      error: null,
    }
  );
  const [rewardMultipliers, setRewardMultipliers] = useState({
    hostMultiplier: 1,
    guestMultiplier: 1,
  });
  // Update the shownQuestionIds state to store strings instead of numbers
  const [shownQuestionIds, setShownQuestionIds] = useState<Set<string>>(
    new Set()
  );
  const [totalQuestionsShown, setTotalQuestionsShown] = useState(0);

  // Add state for correct answer animation
  const [showCorrectAnswerAnimation, setShowCorrectAnswerAnimation] =
    useState(false);

  // Add state for background image
  const [currentBackground, setCurrentBackground] = useState(PvpBattleBG);

  // Add state for the sound settings modal
  const [showSoundSettings, setShowSoundSettings] = useState(false);

  // Add sound volume states near other state definitions
  const [masterVolume, setMasterVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(100);
  const [soundEffectsVolume, setSoundEffectsVolume] = useState(100);
  const [actualSoundEffectsVolume, setActualSoundEffectsVolume] = useState(0.7); // For actual volume level 0-1

  // Add the useState for earlyEnd near the other state declarations
  const [earlyEnd, setEarlyEnd] = useState<boolean>(false);

  // Add a new state for early leave modal near other modal states
  const [showEarlyLeaveModal, setShowEarlyLeaveModal] =
    useState<boolean>(false);

  // Add state for Time Manipulation effect display
  const [showTimeManipulationEffect, setShowTimeManipulationEffect] =
    useState(false);

  // Add this state variable with the other state variables near the top of the component
  const [hasShownOpponentQuickDrawEffect, setHasShownOpponentQuickDrawEffect] =
    useState(false);

  // Add this state declaration at the top of the component with other state variables
  const [processedQuickDrawEffects, setProcessedQuickDrawEffects] = useState<
    Set<string>
  >(new Set());

  // Add this new state variable near the other QuickDraw state variables
  const [
    showOpponentQuickDrawMessageMinimized,
    setShowOpponentQuickDrawMessageMinimized,
  ] = useState(false);
  const [
    opponentQuickDrawMinimizedOpacity,
    setOpponentQuickDrawMinimizedOpacity,
  ] = useState(100);

  // Add a state for tracking the last time poison was applied
  const [lastPoisonApplication, setLastPoisonApplication] = useState(0);

  // Add state for tie game modal
  const [showTieGameModal, setShowTieGameModal] = useState(false);

  // Use the Battle hooks
  const { handleLeaveBattle, isEndingBattle, setIsEndingBattle } = useBattle({
    lobbyCode,
    hostId,
    guestId,
    isHost,
    battleState,
    currentUserId,
    opponentName: opponentName,
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
    setEarlyEnd,
    setShowEarlyLeaveModal,
  });

  // Update the isGuestWaitingForRandomization function to show waiting message for guest
  const isGuestWaitingForRandomization = useCallback(() => {
    return (
      !isHost &&
      !waitingForPlayer &&
      battleState?.battle_started &&
      !randomizationDone &&
      !showVictoryModal &&
      !showRandomizer
    );
  }, [
    isHost,
    waitingForPlayer,
    battleState?.battle_started,
    randomizationDone,
    showVictoryModal,
    showRandomizer,
  ]);

  // Show randomizer for both host and guest after delay for guest
  useEffect(() => {
    if (
      isHost &&
      !waitingForPlayer &&
      battleState?.battle_started &&
      !randomizationDone &&
      !showVictoryModal
    ) {
      // Host sees randomizer immediately
      setShowRandomizer(true);
    } else if (
      !isHost &&
      !waitingForPlayer &&
      battleState?.battle_started &&
      !randomizationDone &&
      !showVictoryModal
    ) {
      // Guest sees waiting message first, then randomizer after 2 seconds
      const timer = setTimeout(() => {
        setShowRandomizer(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setShowRandomizer(false);
    }
  }, [
    isHost,
    waitingForPlayer,
    battleState?.battle_started,
    randomizationDone,
    showVictoryModal,
  ]);

  // Add a new function to determine if we should show the main battle interface
  const shouldShowBattleInterface = useCallback(() => {
    if (isHost) {
      return gameStarted && !waitingForPlayer;
    } else {
      // For guest, show battle interface when battle has started and randomization is done
      return (
        battleState?.battle_started && randomizationDone && !waitingForPlayer
      );
    }
  }, [
    isHost,
    gameStarted,
    waitingForPlayer,
    battleState?.battle_started,
    randomizationDone,
  ]);

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
      totalItems,
    });

    // Check for tie game first when health is equal
    if (playerHealth === opponentHealth) {
      console.log(
        "Tie game detected! Both players have equal health:",
        playerHealth
      );
      setShowTieGameModal(true);
      setShowCards(false);
    }
    // Then check for normal win conditions
    else {
      // Determine winner based on health
      const isPlayerWinner = playerHealth > opponentHealth;
      setVictoryMessage(isPlayerWinner ? "You Won!" : "You Lost!");
      setShowVictoryModal(true);
      setShowCards(false);
    }

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

  // Add useEffect for background music
  useEffect(() => {
    // Function to determine the appropriate music file based on difficulty
    const getMusicFileByDifficulty = () => {
      if (!difficultyMode) return "/GameBattle/PVPBATTLEBGMUSICAVERAGE.mp3"; // Default

      if (difficultyMode.toLowerCase().includes("easy")) {
        return "/GameBattle/PVPBATTLEBGMUSICEASY.mp3";
      } else if (difficultyMode.toLowerCase().includes("hard")) {
        return "/GameBattle/PVPBATTLEBGMUSICHARD.mp3";
      } else {
        return "/GameBattle/PVPBATTLEBGMUSICAVERAGE.mp3"; // Average/default
      }
    };

    // Function to start the background music
    const startBackgroundMusic = () => {
      if (backgroundMusicRef.current) {
        // Set the appropriate music file
        const musicFile = getMusicFileByDifficulty();
        console.log(
          `Starting background music: ${musicFile} for difficulty: ${
            difficultyMode || "unknown"
          }`
        );

        backgroundMusicRef.current.src = musicFile;
        backgroundMusicRef.current.volume = 0.22; // Volume at 25%
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current
          .play()
          .catch((err) =>
            console.error("Error playing background music:", err)
          );
      }
    };

    // Play background music when component mounts
    startBackgroundMusic();

    // Add event listener to restart music if it gets stopped
    const handleMusicEnded = () => {
      console.log("Background music ended or was paused, restarting...");
      startBackgroundMusic();
    };

    // Listen for pause events
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.addEventListener("pause", handleMusicEnded);
      backgroundMusicRef.current.addEventListener("ended", handleMusicEnded);
    }

    // Check every few seconds if music is playing and restart if needed
    const musicCheckInterval = setInterval(() => {
      if (backgroundMusicRef.current && backgroundMusicRef.current.paused) {
        console.log("Background music is paused, attempting to restart...");
        startBackgroundMusic();
      }
    }, 3000); // Check every 3 seconds

    // Clean up function to pause music when component unmounts
    return () => {
      clearInterval(musicCheckInterval);
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.removeEventListener(
          "pause",
          handleMusicEnded
        );
        backgroundMusicRef.current.removeEventListener(
          "ended",
          handleMusicEnded
        );
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.currentTime = 0;
      }
    };
  }, [difficultyMode]);

  // Add a separate effect to change music when difficulty changes after fetching session data
  useEffect(() => {
    // Only run this effect if difficultyMode changes and we have an audio reference
    if (backgroundMusicRef.current && difficultyMode) {
      console.log(
        `Difficulty changed to ${difficultyMode}, updating background music`
      );

      // Function to determine the appropriate music file based on difficulty
      const getMusicFile = () => {
        if (difficultyMode.toLowerCase().includes("easy")) {
          return "/GameBattle/PVPBATTLEBGMUSICEASY.mp3";
        } else if (difficultyMode.toLowerCase().includes("hard")) {
          return "/GameBattle/PVPBATTLEBGMUSICHARD.mp3";
        } else {
          return "/GameBattle/PVPBATTLEBGMUSICAVERAGE.mp3"; // Average/default
        }
      };

      // Only change the music if the source needs to change
      const newMusicFile = getMusicFile();
      if (backgroundMusicRef.current.src !== newMusicFile) {
        // Save current playback position and playing state
        const wasPlaying = !backgroundMusicRef.current.paused;

        // Update the src and restart playback if it was playing
        backgroundMusicRef.current.src = newMusicFile;

        if (wasPlaying) {
          backgroundMusicRef.current
            .play()
            .catch((err) =>
              console.error("Error playing updated background music:", err)
            );
        }
      }
    }
  }, [difficultyMode]);

  const handleAnswerSubmit = useCallback(
    async (answer: string | boolean) => {
      if (!currentQuestion) {
        console.error("No current question");
        return;
      }

      try {
        const response = await axios.post<AnswerResponse>(
          "/api/battle/submit-answer",
          {
            session_uuid: battleState?.session_uuid,
            question_id: currentQuestion.id || "",
            selected_answer: answer,
            player_type: isHost ? "host" : "guest",
          }
        );

        const explanation =
          currentQuestion.explanation ||
          (currentQuestion.itemInfo && currentQuestion.itemInfo.definition) ||
          "No explanation available";

        setAnswerResult({
          isCorrect: response.data.is_correct,
          explanation: explanation,
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
        console.error("Error submitting answer:", error);
      }
    },
    [battleState?.session_uuid, currentQuestion, isHost]
  );

  const handleAnswerSubmitRound = async (
    isCorrect: boolean,
    questionId: string
  ) => {
    if (!selectedCardId) return;

    console.log("handleAnswerSubmitRound called:", {
      isCorrect,
      selectedCardId,
      questionId,
      timestamp: new Date().toISOString(),
    });

    // Get current question IDs from localStorage and add new question ID
    let currentQuestionIds: string[] = [];
    if (questionId && battleState?.session_uuid) {
      const storedIds = localStorage.getItem(
        `question_ids_${battleState.session_uuid}`
      );
      currentQuestionIds = storedIds ? JSON.parse(storedIds) : [];

      // Add the new question ID if it's not already in the array
      if (!currentQuestionIds.includes(questionId)) {
        currentQuestionIds.push(questionId);

        // Update localStorage
        localStorage.setItem(
          `question_ids_${battleState.session_uuid}`,
          JSON.stringify(currentQuestionIds)
        );
        console.log(
          "Updated question IDs in localStorage:",
          currentQuestionIds
        );
      }
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
          totalItems,
        });

        return newStats;
      });

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
          setIsAttacker(true); // Always the attacker when correct

          // Set enemy to "been attacked" animation state
          setEnemyAnimationState("been_attacked");

          // Play attack sound
          if (attackSoundRef.current) {
            attackSoundRef.current.currentTime = 0;
            // Log current volume for debugging
            console.log(
              "Playing attack sound with volume:",
              attackSoundRef.current.volume
            );
            attackSoundRef.current
              .play()
              .catch((err) => console.error("Error playing sound:", err));
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
            const response = await axios.put(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/gameplay/battle/update-round`,
              {
                session_uuid: battleState?.session_uuid,
                player_type: playerType,
                card_id: selectedCardId,
                is_correct: isCorrect,
                lobby_code: lobbyCode,
                battle_stats: battleStats, // Send current stats to backend
                question_ids_done: JSON.stringify(currentQuestionIds), // Include question IDs here too
              }
            );

            // Check if Quick Draw card was used (normal-2)
            const isQuickDrawUsed =
              selectedCardId === "normal-2" &&
              isCorrect &&
              response.data.data.card_effect &&
              response.data.data.card_effect.type === "normal-2";

            // Only switch turns if Quick Draw wasn't used
            if (!isQuickDrawUsed) {
              // Then update the session to switch turns
              const turnResponse = await axios.put(
                `${
                  import.meta.env.VITE_BACKEND_URL
                }/api/gameplay/battle/update-session`,
                {
                  lobby_code: lobbyCode,
                  current_turn: isHost ? guestId : hostId, // Switch to the other player
                }
              );

              if (turnResponse.data.success) {
                console.log("Turn successfully switched to opponent");
              } else {
                console.error(
                  "Failed to switch turn:",
                  turnResponse.data.message
                );
              }
            } else {
              console.log(
                "Quick Draw card used - keeping turn with current player"
              );
            }

            if (response.data.success) {
              console.log(
                `Card ${selectedCardId} selection and answer submission successful, turn switched`
              );

              // Check if a card effect was applied
              if (response.data.data.card_effect) {
                if (
                  response.data.data.card_effect.type === "normal-2" &&
                  isCorrect
                ) {
                  // Show visual effect for Quick Draw instead of text notification
                  setShowQuickDrawEffect(true);

                  // Generate a unique effect ID for this player's Quick Draw with timestamp
                  const timestamp = Date.now().toString();
                  const effectId = `player-quick-draw-${
                    battleState?.session_uuid || "unknown"
                  }`;

                  // Store current effect ID
                  setCurrentQuickDrawEffectId(effectId);

                  // Also track this in our persistent storage
                  markEffectAsShown(effectId, timestamp);

                  // Play QuickDraw user sound effect
                  if (quickDrawUserSoundRef.current) {
                    quickDrawUserSoundRef.current.currentTime = 0;
                    quickDrawUserSoundRef.current.volume =
                      (soundEffectsVolume / 100) * (masterVolume / 100);
                    quickDrawUserSoundRef.current
                      .play()
                      .catch((err) =>
                        console.error(
                          "Error playing QuickDraw user sound:",
                          err
                        )
                      );
                  }

                  // Show the effect
                  setTimeout(() => {
                    setShowQuickDrawEffect(false);
                  }, 2000);
                } else if (
                  response.data.data.card_effect.type === "normal-1" &&
                  isCorrect
                ) {
                  // Replace the text notification with visual effect
                  setShowTimeManipulationEffect(true);

                  // Play Time Manipulation activation sound
                  if (timeManipulationActivateSoundRef.current) {
                    timeManipulationActivateSoundRef.current.volume =
                      (soundEffectsVolume / 100) * (masterVolume / 100);
                    timeManipulationActivateSoundRef.current.currentTime = 0;
                    timeManipulationActivateSoundRef.current
                      .play()
                      .catch((err) =>
                        console.error(
                          "Error playing time manipulation activation sound:",
                          err
                        )
                      );
                  }

                  // Hide the effect after 3 seconds
                  setTimeout(() => {
                    setShowTimeManipulationEffect(false);
                  }, 3000);
                } else if (
                  response.data.data.card_effect.type === "epic-1" &&
                  isCorrect
                ) {
                  // Create container for Answer Shield animation
                  const shieldEffectContainer = document.createElement("div");
                  shieldEffectContainer.className =
                    "fixed inset-0 z-[100] pointer-events-none flex items-center justify-center";

                  // Play Answer Shield activation sound effect
                  if (answerShieldActivatedSoundRef.current) {
                    const calculatedVolume =
                      (soundEffectsVolume / 100) * (masterVolume / 100);
                    answerShieldActivatedSoundRef.current.volume =
                      calculatedVolume;
                    answerShieldActivatedSoundRef.current.currentTime = 0;
                    answerShieldActivatedSoundRef.current
                      .play()
                      .catch((err) =>
                        console.error(
                          "Error playing Answer Shield activation sound:",
                          err
                        )
                      );
                  }

                  // Create advanced shield animation
                  shieldEffectContainer.innerHTML = `
                    <div class="relative">
                      <!-- Fullscreen backdrop gradient -->
                      <div class="fixed inset-0 bg-gradient-to-b from-blue-900/30 to-blue-500/10 backdrop-blur-[2px]"></div>
                      
                      <!-- Shield glow background -->
                      <div class="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse-slow" style="width: 350px; height: 350px; top: 50%; left: 50%; transform: translate(-50%, -50%)"></div>
                      
                      <!-- Shield main element -->
                      <div class="absolute" style="width: 300px; height: 300px; top: 50%; left: 50%; transform: translate(-50%, -50%)">
                        <!-- Shield inner circle with ripple effect -->
                        <div class="absolute inset-0 flex items-center justify-center">
                          <div class="w-60 h-60 rounded-full border-8 border-blue-400/80 bg-gradient-to-br from-blue-500/40 to-blue-600/20 flex items-center justify-center animate-pulse">
                            <img src="/GameBattle/EpicCardAnswerShield.png" alt="Shield" class="w-32 h-32 object-contain animate-bounce-gentle drop-shadow-[0_0_15px_rgba(59,130,246,0.7)]" />
                          </div>
                        </div>
                        
                        <!-- Orbiting particles -->
                        <div class="absolute w-full h-full animate-spin-slow" style="animation-duration: 8s">
                          <div class="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-300 rounded-full blur-[2px]"></div>
                          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-300 rounded-full blur-[2px]"></div>
                        </div>
                        <div class="absolute w-full h-full animate-spin-slow" style="animation-duration: 8s; animation-direction: reverse">
                          <div class="absolute top-1/2 left-0 -translate-y-1/2 w-5 h-5 bg-blue-300 rounded-full blur-[2px]"></div>
                          <div class="absolute top-1/2 right-0 -translate-y-1/2 w-5 h-5 bg-blue-300 rounded-full blur-[2px]"></div>
                        </div>
                        
                        <!-- Diagonal orbiting particles -->
                        <div class="absolute w-full h-full animate-spin-slow" style="animation-duration: 6s; transform: rotate(45deg)">
                          <div class="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-200 rounded-full blur-[1px]"></div>
                          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-200 rounded-full blur-[1px]"></div>
                        </div>
                        
                        <!-- Radiating circles -->
                        <div class="absolute inset-0 flex items-center justify-center">
                          <div class="absolute w-72 h-72 border-4 border-blue-400/40 rounded-full animate-ping" style="animation-duration: 2s"></div>
                          <div class="absolute w-80 h-80 border-2 border-blue-300/30 rounded-full animate-ping" style="animation-duration: 2.5s"></div>
                        </div>
                      </div>
                      
                      <!-- Text indicator -->
                      <div class="absolute top-[68%] left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-900/90 to-blue-700/90 px-8 py-4 rounded-xl border-2 border-blue-400/70 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <p class="text-blue-100 font-bold text-2xl text-center tracking-wider">ANSWER SHIELD ACTIVATED!</p>
                        <p class="text-blue-200 text-center text-sm mt-1">Opponent's next card blocked</p>
                      </div>
                    </div>
                  `;

                  document.body.appendChild(shieldEffectContainer);

                  // Remove the animation after 3 seconds with fade out
                  setTimeout(() => {
                    shieldEffectContainer.style.transition = "opacity 0.5s";
                    shieldEffectContainer.style.opacity = "0";
                    setTimeout(() => {
                      document.body.removeChild(shieldEffectContainer);
                    }, 500);
                  }, 3000);
                } else if (
                  response.data.data.card_effect.type === "epic-2" &&
                  isCorrect
                ) {
                  // Create more visually appealing regeneration animation
                  const regenerationEffectContainer =
                    document.createElement("div");
                  regenerationEffectContainer.className =
                    "fixed inset-0 z-[100] pointer-events-none flex items-center justify-center";

                  // Play heal regeneration sound effect
                  if (healRegenSoundRef.current) {
                    healRegenSoundRef.current.currentTime = 0;
                    healRegenSoundRef.current.volume =
                      (soundEffectsVolume / 100) * (masterVolume / 100);
                    healRegenSoundRef.current
                      .play()
                      .catch((err) =>
                        console.error(
                          "Error playing heal regeneration sound:",
                          err
                        )
                      );
                  }

                  const healthAmount =
                    response.data.data.card_effect.health_amount || 10;

                  // Create more visually appealing regeneration animation
                  regenerationEffectContainer.innerHTML = `
                    <div class="relative w-full h-full">
                      <!-- Simple, subtle healing backdrop with gradient -->
                      <div class="fixed inset-0 bg-gradient-to-t from-green-800/10 via-green-500/5 to-transparent"></div>
                      
                      <!-- Centered healing amount indicator with simple design -->
                      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                        <div class="animate-pop-in" style="animation-duration: 0.5s">
                          <div class="bg-green-900/20 backdrop-blur-sm px-10 py-5 rounded-xl border border-green-400/20 shadow-[0_0_20px_rgba(134,239,172,0.2)]">
                            <div class="text-green-300 text-8xl font-bold flex items-center animate-pulse-slow text-center drop-shadow-[0_0_10px_rgba(134,239,172,0.7)]">
                              <span class="text-8xl mr-2">+</span>${healthAmount}<span class="text-4xl ml-2">HP</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Minimal floating healing particles -->
                      <div class="fixed inset-0 overflow-hidden pointer-events-none">
                        ${Array.from({ length: 10 })
                          .map(
                            (_, i) => `
                          <div class="absolute text-2xl font-bold text-green-300/60 animate-float-up-slow" 
                               style="left: ${
                                 10 + Math.random() * 80
                               }%; bottom: -5%; animation-delay: ${
                              Math.random() * 2
                            }s; animation-duration: ${3 + Math.random() * 2}s;">
                            <span class="drop-shadow-[0_0_3px_rgba(134,239,172,0.5)]">+</span>
                          </div>
                        `
                          )
                          .join("")}
                      </div>
                    </div>
                  `;

                  // Play regeneration sound effect
                  if (regenerationSfxRef.current) {
                    console.log("Attempting to play regeneration sound effect");
                    const calculatedVolume =
                      (soundEffectsVolume / 100) * (masterVolume / 100);
                    regenerationSfxRef.current.volume = calculatedVolume;
                    console.log(
                      "RegenerationSfx volume set to:",
                      calculatedVolume
                    );
                    regenerationSfxRef.current.currentTime = 0;
                    regenerationSfxRef.current
                      .play()
                      .then(() => {
                        console.log("RegenerationSfx playing successfully");
                      })
                      .catch((err) => {
                        console.error(
                          "Error playing regeneration sfx sound:",
                          err
                        );
                      });
                  } else {
                    console.error("RegenerationSfx reference is null");
                  }

                  document.body.appendChild(regenerationEffectContainer);

                  // Update health locally if we can
                  if (isHost) {
                    setPlayerHealth((prev) =>
                      Math.min(prev + healthAmount, 100)
                    );
                  } else {
                    setPlayerHealth((prev) =>
                      Math.min(prev + healthAmount, 100)
                    );
                  }

                  // Store effect data to track for opponent notification
                  try {
                    // Create a unique regeneration effect ID
                    const regenerationEffectId = `regeneration-${
                      battleState?.session_uuid
                    }-${playerType}-${Date.now()}`;
                    const timestamp = Date.now();

                    // Only show notification if this specific effect hasn't been shown before
                    if (!hasEffectBeenShown(regenerationEffectId, timestamp)) {
                      // Mark this effect as shown
                      markEffectAsShown(regenerationEffectId, timestamp);

                      console.log(
                        `Marked regeneration effect as shown: ${regenerationEffectId}`
                      );
                    }
                  } catch (e) {
                    console.error("Error storing regeneration effect data:", e);
                  }

                  // Remove the animation after 3 seconds with fade out
                  setTimeout(() => {
                    regenerationEffectContainer.style.transition =
                      "opacity 0.8s";
                    regenerationEffectContainer.style.opacity = "0";
                    setTimeout(() => {
                      document.body.removeChild(regenerationEffectContainer);
                    }, 800);
                  }, 3000);
                } else if (
                  response.data.data.card_effect.type === "rare-2" &&
                  isCorrect
                ) {
                  // Show notification for Poison Type card effect
                  const messageElement = document.createElement("div");
                  messageElement.className =
                    "fixed inset-0 flex items-center justify-center z-50";
                  messageElement.innerHTML = `
                    <div class="bg-gradient-to-r from-purple-900 to-fuchsia-800 text-white py-4 px-8 rounded-lg shadow-lg border border-purple-400 animate-pulse-slow">
                      <div class="flex items-center space-x-3">
                        <svg class="h-6 w-6 text-fuchsia-300 animate-spin-slow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L20 7L20 17L12 22L4 17L4 7L12 2Z" />
                        </svg>
                        <p class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-200 to-purple-200">
                          <span class="text-fuchsia-300">Witch's Curse:</span> Initial 10 damage plus 5 damage for 3 turns
                        </p>
                        <svg class="h-6 w-6 text-fuchsia-300 animate-spin-slow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L20 7L20 17L12 22L4 17L4 7L12 2Z" />
                        </svg>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(messageElement);

                  // Remove the message after 2 seconds
                  setTimeout(() => {
                    document.body.removeChild(messageElement);
                  }, 2000);
                } else if (
                  response.data.data.card_effect.type === "rare-1" &&
                  isCorrect
                ) {
                  // Create card locking effect for the player who used it
                  const mindControlEffectContainer =
                    document.createElement("div");
                  mindControlEffectContainer.className =
                    "fixed inset-0 z-[100] pointer-events-none flex items-center justify-center";

                  mindControlEffectContainer.innerHTML = `
                    <div class="relative w-full h-full flex items-center justify-center">
                      <!-- Removed backdrop with gradient -->
                      
                      <!-- Main centered content -->
                      <div class="relative flex flex-col items-center z-10">
                        <!-- Enemy avatar at top -->
                        <div class="mb-6">
                          <div class="w-16 h-16 bg-gray-800 rounded-full overflow-hidden border-2 border-purple-500 flex items-center justify-center">
                            <svg class="w-10 h-10 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 14.5C8.66 14.5 6 11.84 6 8.5C6 5.16 8.66 2.5 12 2.5C15.34 2.5 18 5.16 18 8.5C18 11.84 15.34 14.5 12 14.5Z" fill="currentColor" opacity="0.5" />
                              <path d="M20.5 22.5H3.5C2.4 22.5 1.5 21.6 1.5 20.5C1.5 15.8 5.3 12 10 12H14C18.7 12 22.5 15.8 22.5 20.5C22.5 21.6 21.6 22.5 20.5 22.5Z" fill="currentColor" opacity="0.5" />
                            </svg>
                          </div>
                          <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-md">
                            OPPONENT
                          </div>
                        </div>
                        
                        <!-- Cards being locked - centered -->
                        <div class="flex items-center justify-center gap-3 mb-12">
                          ${Array(3)
                            .fill(0)
                            .map(
                              (_, i) => `
                            <div class="relative">
                              <!-- Card -->
                              <div class="w-40 h-56 bg-gradient-to-b from-gray-800 to-gray-700 rounded-lg transform ${
                                i === 0
                                  ? "rotate-[-5deg]"
                                  : i === 1
                                  ? "rotate-[0deg]"
                                  : "rotate-[5deg]"
                              } shadow-xl border border-gray-600">
                    } shadow-xl border border-gray-600">
                                <!-- Card content -->
                                <div class="absolute inset-2 rounded bg-gray-700 flex flex-col items-center justify-center p-2">
                                  <div class="w-full h-24 bg-gray-600 mb-2 rounded-sm"></div>
                                  <div class="w-full h-3 bg-gray-600 rounded-sm mb-1"></div>
                                  <div class="w-3/4 h-3 bg-gray-600 rounded-sm mb-1"></div>
                                  <div class="w-full h-8 bg-gray-600 rounded-sm"></div>
                                </div>
                              </div>
                              
                              <!-- Lock overlay with animation -->
                              <div class="absolute inset-0 bg-purple-900/70 rounded-lg flex items-center justify-center backdrop-blur-[2px] animate-fade-in" style="animation-delay: ${
                                i * 0.2
                              }s;">
                                <svg class="w-16 h-16 text-purple-200 animate-bounce-slow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                                </svg>
                              </div>
                              
                              <!-- Purple energy outline -->
                              <div class="absolute inset-0 rounded-lg border-2 border-purple-500 animate-pulse-border"></div>
                            </div>
                          `
                            )
                            .join("")}
                        </div>
                        
                        <!-- Animated mind control connection -->
                        <div class="w-0.5 h-16 bg-gradient-to-b from-purple-500 to-purple-700 my-3 animate-grow-height"></div>
                        
                        <!-- Player section -->
                        <div class="relative">
                          <!-- Player avatar -->
                          <div class="w-16 h-16 bg-gray-800 rounded-full border-2 border-gray-400 shadow-lg overflow-hidden flex items-center justify-center">
                            <svg class="w-10 h-10 text-gray-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </div>
                          
                          <!-- Radiating energy pulse -->
                          <div class="absolute inset-0 flex items-center justify-center">
                            <div class="w-20 h-20 rounded-full border border-gray-500/60 animate-ping-slow"></div>
                            <div class="w-28 h-28 rounded-full border border-gray-500/40 animate-ping-slow" style="animation-delay: 0.3s"></div>
                          </div>
                          
                          <!-- YOU label -->
                          <div class="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs font-bold px-2 py-0.5 rounded shadow-md">
                            YOU
                          </div>
                        </div>
                        
                        <!-- Success text indicator -->
                        <div class="mt-6 bg-gray-800 px-6 py-3 rounded-lg border border-gray-500 shadow-lg text-center">
                          <p class="text-gray-100 font-bold text-xl">MIND CONTROL ACTIVATED</p>
                          <p class="text-gray-200 text-sm mt-1">Opponent's cards have been locked</p>
                        </div>
                      </div>
                    </div>
                  `;

                  // Add CSS for the additional animations
                  if (
                    !document.getElementById("mind-control-player-animations")
                  ) {
                    const styleElement = document.createElement("style");
                    styleElement.id = "mind-control-player-animations";
                    styleElement.textContent = `
                      @keyframes pulse-border {
                        0%, 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
                        50% { box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.4); }
                      }
                      @keyframes bounce-slow {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-5px); }
                      }
                      @keyframes ping-slow {
                        0% { transform: scale(1); opacity: 1; }
                        75%, 100% { transform: scale(1.5); opacity: 0; }
                      }
                      @keyframes fade-in {
                        from { opacity: 0; }
                        to { opacity: 1; }
                      }
                      @keyframes grow-height {
                        from { height: 0; opacity: 0; }
                        to { height: 16rem; opacity: 1; }
                      }
                      
                      .animate-pulse-border {
                        animation: pulse-border 2s ease-in-out infinite;
                      }
                      .animate-bounce-slow {
                        animation: bounce-slow 2s ease-in-out infinite;
                      }
                      .animate-ping-slow {
                        animation: ping-slow 2s ease-in-out infinite;
                      }
                      .animate-fade-in {
                        animation: fade-in 0.5s ease-in-out forwards;
                        opacity: 0;
                      }
                      .animate-grow-height {
                        animation: grow-height 1s ease-out forwards;
                      }
                    `;
                    document.head.appendChild(styleElement);
                  }

                  document.body.appendChild(mindControlEffectContainer);

                  // Remove the animation after 4 seconds with fade out
                  setTimeout(() => {
                    mindControlEffectContainer.style.transition =
                      "opacity 0.8s";
                    mindControlEffectContainer.style.opacity = "0";
                    setTimeout(() => {
                      document.body.removeChild(mindControlEffectContainer);
                    }, 800);
                  }, 4000);
                }
              }

              // Increment turn number when turn changes
              setCurrentTurnNumber((prev) => prev + 1);

              // Switch turns locally but keep UI visible
              setIsMyTurn(false);

              // Set enemy animation to picking - they get their turn next
              setEnemyAnimationState("picking");
              setEnemyPickingIntroComplete(false);
            } else {
              console.error(
                "Failed to update battle round:",
                response?.data?.message || "Unknown error"
              );
            }
          } catch (error) {
            console.error("Error updating battle round:", error);
          }
        }, 3000); // Changed from 2500 to 3000 (3 seconds total duration)
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
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/gameplay/battle/update-round`,
              {
                session_uuid: battleState?.session_uuid,
                player_type: playerType,
                card_id: selectedCardId,
                is_correct: isCorrect,
                lobby_code: lobbyCode,
                battle_stats: battleStats, // Send current stats to backend
                question_ids_done: JSON.stringify(currentQuestionIds), // Include question IDs here too
              }
            );

            if (response.data.success) {
              console.log(
                `Card ${selectedCardId} selection and answer submission successful, turn switched`
              );

              // Increment turn number when turn changes
              setCurrentTurnNumber((prev) => prev + 1);

              // Switch turns locally but keep UI visible
              setIsMyTurn(false);

              // Set enemy animation to picking - they get their turn next
              setEnemyAnimationState("picking");
              setEnemyPickingIntroComplete(false);

              // Then update the session to switch turns
              const turnResponse = await axios.put(
                `${
                  import.meta.env.VITE_BACKEND_URL
                }/api/gameplay/battle/update-session`,
                {
                  lobby_code: lobbyCode,
                  current_turn: isHost ? guestId : hostId, // Switch to the other player
                }
              );

              if (turnResponse.data.success) {
                console.log("Turn successfully switched to opponent");
              } else {
                console.error(
                  "Failed to switch turn:",
                  turnResponse.data.message
                );
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

  const updateQuestionIdsDone = async (questionId: string) => {
    if (!battleState?.session_uuid) return;

    console.log("Updating question IDs:", {
      questionId,
      sessionUuid: battleState.session_uuid,
      timestamp: new Date().toISOString(),
    });

    try {
      // Get current question IDs from localStorage
      const storedIds = localStorage.getItem(
        `question_ids_${battleState.session_uuid}`
      );
      let currentQuestionIds: string[] = storedIds ? JSON.parse(storedIds) : [];

      // Add the new question ID if it's not already in the array
      if (!currentQuestionIds.includes(questionId)) {
        currentQuestionIds.push(questionId);

        // Update localStorage
        localStorage.setItem(
          `question_ids_${battleState.session_uuid}`,
          JSON.stringify(currentQuestionIds)
        );
        console.log(
          "Updated question IDs in localStorage:",
          currentQuestionIds
        );

        // Send to the dedicated endpoint
        const response = await axios.put(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/update-question-ids`,
          {
            session_uuid: battleState.session_uuid,
            question_ids: currentQuestionIds,
            increment_count: true,
          }
        );

        if (response.data.success) {
          console.log(
            "Successfully updated question IDs in database:",
            response.data
          );
        } else {
          console.error(
            "Failed to update question IDs:",
            response.data.message
          );
        }
        // Update localStorage only
        localStorage.setItem(
          `question_ids_${battleState.session_uuid}`,
          JSON.stringify(currentQuestionIds)
        );
        console.log(
          "Updated question IDs in localStorage:",
          currentQuestionIds
        );
      } else {
        console.log("Question ID already exists:", questionId);
      }
    } catch (error) {
      console.error("Error updating question IDs:", error);
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
    const prevPlayerHealth = lastHealthUpdate.player;
    const prevOpponentHealth = lastHealthUpdate.opponent;

    // Play sound effects when health decreases
    if (playerHealth < prevPlayerHealth) {
      // Player health decreased - play decrease health sound
      if (decreaseHealthSoundRef.current) {
        decreaseHealthSoundRef.current.currentTime = 0;
        console.log(
          "Playing decrease health sound with volume:",
          decreaseHealthSoundRef.current.volume
        );
        decreaseHealthSoundRef.current
          .play()
          .catch((err) => console.error("Error playing sound:", err));
      }
    } else if (playerHealth > prevPlayerHealth) {
      // Player health increased - play heal regen sound
      if (healRegenSoundRef.current) {
        healRegenSoundRef.current.currentTime = 0;
        console.log(
          "Playing heal regen sound with volume:",
          healRegenSoundRef.current.volume
        );
        healRegenSoundRef.current
          .play()
          .catch((err) => console.error("Error playing sound:", err));
      }
    }

    if (opponentHealth < prevOpponentHealth) {
      // Opponent health decreased - play attack sound
      if (healthAttackSoundRef.current) {
        healthAttackSoundRef.current.currentTime = 0;
        console.log(
          "Playing health attack sound with volume:",
          healthAttackSoundRef.current.volume
        );
        healthAttackSoundRef.current
          .play()
          .catch((err) => console.error("Error playing sound:", err));
      }
    } else if (opponentHealth > prevOpponentHealth) {
      // Opponent health increased - also play heal regen sound
      if (healRegenSoundRef.current) {
        healRegenSoundRef.current.currentTime = 0;
        console.log(
          "Playing heal regen sound for opponent with volume:",
          healRegenSoundRef.current.volume
        );
        healRegenSoundRef.current
          .play()
          .catch((err) => console.error("Error playing sound:", err));
      }
    }

    setLastHealthUpdate({
      player: playerHealth,
      opponent: opponentHealth,
    });
  }, [playerHealth, opponentHealth]);

  // Monitor opponent health to show regeneration notification
  useEffect(() => {
    // Check if opponent health increased (regeneration effect)
    if (lastHealthUpdate && opponentHealth > lastHealthUpdate.opponent) {
      console.log(
        "Opponent health increased, showing regeneration notification"
      );

      // Create a sleek notification for opponent's regeneration
      const opponentRegenerationNotification = document.createElement("div");
      opponentRegenerationNotification.className =
        "fixed bottom-5 right-5 z-50 pointer-events-none";

      // Calculate how much health was gained
      const healthGained = opponentHealth - lastHealthUpdate.opponent;

      // Create modern notification design with enhanced visuals
      opponentRegenerationNotification.innerHTML = `
        <div class="animate-slide-in-right" style="animation-duration: 0.5s">
          <div class="bg-gradient-to-r from-green-900/90 to-green-700/90 rounded-lg shadow-xl border-l-4 border-green-400 overflow-hidden max-w-sm w-full">
            <div class="flex p-3">
              <!-- Left side with icon -->
              <div class="mr-3 flex-shrink-0">
                <div class="relative">
                  <div class="w-9 h-9 rounded-full bg-green-800/80 flex items-center justify-center">
                    <div class="absolute w-full h-full rounded-full bg-green-500/30 animate-ping-slow" style="animation-duration: 1.5s"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <!-- Right side with content -->
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <h3 class="text-sm font-bold text-green-300">Regeneration</h3>
                    <div class="ml-2 flex">
                      ${Array.from({ length: 3 })
                        .map(
                          (_, i) => `
                        <div class="text-base text-green-400 font-bold animate-float-up-mini" 
                            style="animation-delay: ${
                              i * 0.2
                            }s; margin-right: -3px;">+</div>
                      `
                        )
                        .join("")}
                    </div>
                  </div>
                  <div class="flex shrink-0 ml-2">
                    <div class="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-green-200 text-xs font-bold">
                      +${healthGained}
                    </div>
                  </div>
                </div>
                
                <!-- Combined health info and heart rate in one row -->
                <div class="flex items-center mt-1">
                  <p class="text-xs text-green-200">
                    <span class="font-medium">Opponent</span> recovered health
                  </p>
                  
                  <!-- Visual heart rate line -->
                  <div class="ml-2 h-2 w-24 relative flex-shrink-0">
                    <svg viewBox="0 0 100 10" class="w-full h-full text-green-500/60">
                      <path d="M0,5 L10,5 C12,5 13,2 15,2 C17,2 18,8 20,8 C22,8 23,5 25,5 L30,5 C32,5 33,1 35,1 C37,1 38,9 40,9 C42,9 43,5 45,5 L50,5 C52,5 53,2 55,2 C57,2 58,8 60,8 C62,8 63,5 65,5 L70,5 C72,5 73,1 75,1 C77,1 78,9 80,9 C82,9 83,5 85,5 L90,5 C92,5 93,2 95,2 C97,2 98,8 100,8" 
                        fill="none" stroke="currentColor" stroke-width="1" class="animate-heart-rate"/>
                    </svg>
                  </div>
                </div>
                
                <!-- Timing indicator bar -->
                <div class="h-1 w-full bg-green-800 mt-1.5 rounded-full overflow-hidden">
                  <div class="h-full bg-green-400 animate-shrink-width" style="animation-duration: 5s;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(opponentRegenerationNotification);

      // Play heal sound effect for opponent regeneration (at lower volume)
      if (healRegenSoundRef.current) {
        healRegenSoundRef.current.currentTime = 0;
        // Play at lower volume for opponent effect
        const lowerVolume =
          (soundEffectsVolume / 100) * (masterVolume / 100) * 0.5;
        healRegenSoundRef.current.volume = lowerVolume;
        healRegenSoundRef.current
          .play()
          .catch((err) =>
            console.error(
              "Error playing opponent heal regeneration sound:",
              err
            )
          );
      }

      // Remove the notification after animation completes
      setTimeout(() => {
        if (
          opponentRegenerationNotification.firstChild instanceof HTMLElement
        ) {
          opponentRegenerationNotification.firstChild.classList.replace(
            "animate-slide-in-right",
            "animate-slide-out-right"
          );
        }
        setTimeout(() => {
          document.body.removeChild(opponentRegenerationNotification);
        }, 500);
      }, 5000);
    }
  }, [opponentHealth, lastHealthUpdate, soundEffectsVolume, masterVolume]);

  // Handle poison effects and health updates
  useEffect(() => {
    const pollHealthAndScores = async () => {
      if (!battleState?.session_uuid) return;

      // Health updates are polled every 1 second for more responsive health bar updates
      try {
        // Get battle scores
        const scoresResponse = await axios.get<BattleScoresResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/scores/${
            battleState.session_uuid
          }`
        );

        // Get round data
        const roundResponse = await axios.get<BattleRoundResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/round/${
            battleState.session_uuid
          }`
        );

        // Check for active poison effects on the player and opponent
        if (battleState.session_uuid) {
          try {
            // Get active effects for the current player
            const playerType = isHost ? "host" : "guest";
            const playerResponse = await axios.get(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/gameplay/battle/card-effects/${
                battleState.session_uuid
              }/${playerType}`
            );

            // Get active effects for the opponent
            const opponentType = isHost ? "guest" : "host";
            const opponentResponse = await axios.get(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/gameplay/battle/card-effects/${
                battleState.session_uuid
              }/${opponentType}`
            );

            // We're using our new implementation instead of this one for poison effects
            // Only keep this code for other card effects if needed in the future
          } catch (error) {
            console.error("Error checking card effects:", error);
          }
        }

        // Add debugging for health data
        console.log("HEALTH DATA:", {
          battleScores: scoresResponse.data,
          timestamp: new Date().toISOString(),
        });

        const battleScores = scoresResponse.data;
        const roundData = roundResponse.data.data;

        // Debug logging for question IDs
        console.log("Question IDs state:", {
          localStorage: localStorage.getItem(
            `question_ids_${battleState.session_uuid}`
          ),
          roundData: roundData.question_ids_done,
          timestamp: new Date().toISOString(),
        });

        // Check and initialize question_ids_done in localStorage if needed
        const storedIds = localStorage.getItem(
          `question_ids_${battleState.session_uuid}`
        );
        if (!storedIds) {
          console.log("Initializing question_ids_done array in localStorage");
          localStorage.setItem(
            `question_ids_${battleState.session_uuid}`,
            JSON.stringify([])
          );
        }

        // If round data has question IDs but localStorage doesn't, sync them
        if (roundData.question_ids_done && !storedIds) {
          try {
            const parsedIds =
              typeof roundData.question_ids_done === "string"
                ? JSON.parse(roundData.question_ids_done)
                : roundData.question_ids_done;
            localStorage.setItem(
              `question_ids_${battleState.session_uuid}`,
              JSON.stringify(parsedIds)
            );
            console.log(
              "Synced question IDs from round data to localStorage:",
              parsedIds
            );
          } catch (e) {
            console.error("Error syncing question IDs from round data:", e);
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
              totalItems,
            },
          });

          // Update question count from round data if available
          if (roundData.question_count_total !== undefined) {
            // Use the value from database, treating null as 0
            setCurrentQuestionNumber(roundData.question_count_total ?? 0);
          }
          // Fallback to scores data if round data is not available
          else if (scores.question_count_total !== undefined) {
            setCurrentQuestionNumber(scores.question_count_total ?? 0);
          }

          // Set health based on whether player is host or guest
          if (isHost) {
            // Debug health updates
            console.log("Setting host health:", {
              playerHealth: scores.host_health,
              opponentHealth: scores.guest_health,
              current: { playerHealth, opponentHealth },
            });

            setPlayerHealth(scores.host_health);
            setOpponentHealth(scores.guest_health);

            // Check for tie game conditions first
            if (
              scores.host_health === scores.guest_health &&
              (scores.host_health <= 0 || scores.guest_health <= 0)
            ) {
              console.log(
                "Tie game detected in health polling. Both players have equal health:",
                scores.host_health
              );
              setShowTieGameModal(true);
              setShowCards(false); // Hide cards when game ends
              // Clear card selection data from sessionStorage
              sessionStorage.removeItem("battle_cards");
              sessionStorage.removeItem("battle_last_selected_index");
              sessionStorage.removeItem("battle_turn_count");
              sessionStorage.removeItem("battle_is_first_turn");
            }
            // Check for victory/defeat conditions
            else if (scores.host_health <= 0) {
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
            // Debug health updates
            console.log("Setting guest health:", {
              playerHealth: scores.guest_health,
              opponentHealth: scores.host_health,
              current: { playerHealth, opponentHealth },
            });

            setPlayerHealth(scores.guest_health);
            setOpponentHealth(scores.host_health);

            // Check for tie game conditions first
            if (
              scores.guest_health === scores.host_health &&
              (scores.guest_health <= 0 || scores.host_health <= 0)
            ) {
              console.log(
                "Tie game detected in health polling. Both players have equal health:",
                scores.guest_health
              );
              setShowTieGameModal(true);
              setShowCards(false); // Hide cards when game ends
              // Clear card selection data from sessionStorage
              sessionStorage.removeItem("battle_cards");
              sessionStorage.removeItem("battle_last_selected_index");
              sessionStorage.removeItem("battle_turn_count");
              sessionStorage.removeItem("battle_is_first_turn");
            }
            // Check for victory/defeat conditions
            else if (scores.guest_health <= 0) {
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
            showingVictoryModal: showVictoryModal,
          });

          // Force a re-render after health updates
          forceUpdate();
        }
      } catch (error) {
        console.error("Error fetching battle scores:", error);
      }
    };

    // Poll for battle scores more frequently (every 1 second instead of 2)
    const scoresPollInterval = setInterval(pollHealthAndScores, 1000);
    pollHealthAndScores(); // Initial fetch

    return () => clearInterval(scoresPollInterval);
  }, [battleState?.session_uuid, isHost]);

  // Add a separate effect to ensure victory modal stays visible
  useEffect(() => {
    // Check for tie game when both players have the same health
    if (
      playerHealth === opponentHealth &&
      (playerHealth <= 0 || opponentHealth <= 0)
    ) {
      console.log(
        "Tie game detected! Both players have equal health:",
        playerHealth
      );
      setShowTieGameModal(true);
      setShowCards(false);

      // Clear card selection data from sessionStorage
      sessionStorage.removeItem("battle_cards");
      sessionStorage.removeItem("battle_last_selected_index");
      sessionStorage.removeItem("battle_turn_count");
      sessionStorage.removeItem("battle_is_first_turn");
    }
    // Check for normal game end conditions
    else if (playerHealth <= 0 || opponentHealth <= 0) {
      const isPlayerWinner = playerHealth > opponentHealth;
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
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/session-state/${lobbyCode}`
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
          const isCurrentPlayerTurn =
            sessionData.current_turn === currentUserId;

          // Check for opponent Quick Draw card
          try {
            const roundResponse = await axios.get<{
              success: boolean;
              data: any;
            }>(
              `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/round/${
                sessionData.session_uuid
              }`
            );

            if (roundResponse.data.success && roundResponse.data.data) {
              const roundData = roundResponse.data.data;

              // Check if opponent used Quick Draw card
              const opponentType = isHost ? "guest" : "host";
              const opponentCardEffect =
                roundData[`${opponentType}_card_effect`];
              const opponentCard = roundData[`${opponentType}_card`];

              if (
                opponentCard === "normal-2" &&
                opponentCardEffect &&
                typeof opponentCardEffect === "string" &&
                !isCurrentPlayerTurn // Only show if it's not my turn (opponent used it)
              ) {
                try {
                  const parsedEffect = JSON.parse(opponentCardEffect);
                  if (
                    parsedEffect &&
                    parsedEffect.type === "normal-2" &&
                    parsedEffect.effect === "double_turn"
                  ) {
                    // Get the applied timestamp - this is crucial for distinguishing different uses
                    const appliedTimestamp =
                      parsedEffect.applied_at || Date.now().toString();

                    // Create a unique effect ID for this effect - including sessionID and player
                    const effectId = `qd-${sessionData.session_uuid}-${opponentType}`;

                    // Check if this specific effect use has been shown before
                    if (
                      !hasEffectBeenShown(effectId, appliedTimestamp) &&
                      !showOpponentQuickDrawMessage
                    ) {
                      console.log(
                        `Showing new QuickDraw effect: ${effectId} at ${appliedTimestamp}`
                      );

                      // Mark this specific effect use as shown immediately
                      markEffectAsShown(effectId, appliedTimestamp);

                      // Play opponent QuickDraw sound effect
                      if (quickDrawEnemySoundRef.current) {
                        quickDrawEnemySoundRef.current.currentTime = 0;
                        quickDrawEnemySoundRef.current.volume =
                          (soundEffectsVolume / 100) * (masterVolume / 100);
                        quickDrawEnemySoundRef.current
                          .play()
                          .catch((err) =>
                            console.error(
                              "Error playing QuickDraw enemy sound:",
                              err
                            )
                          );
                      }

                      // Show the visual effect centered
                      setShowOpponentQuickDrawMessage(true);
                      setShowOpponentQuickDrawMessageMinimized(false);

                      // After 2 seconds, minimize the effect to the bottom instead of hiding it
                      setTimeout(() => {
                        setShowOpponentQuickDrawMessageMinimized(true);
                        setOpponentQuickDrawMinimizedOpacity(100);

                        // After another 2 seconds, fade out the minimized notification
                        setTimeout(() => {
                          setOpponentQuickDrawMinimizedOpacity(0);
                        }, 2000);
                      }, 2000);
                    } else if (
                      showOpponentQuickDrawMessageMinimized &&
                      hasEffectBeenShown(effectId, appliedTimestamp)
                    ) {
                      // If the effect is already minimized and we poll again, keep it visible
                      console.log(
                        `QuickDraw effect already showing minimized: ${effectId} at ${appliedTimestamp}`
                      );
                    } else {
                      console.log(
                        `Skipping already shown QuickDraw effect: ${effectId} at ${appliedTimestamp}`
                      );
                    }
                  }
                } catch (e) {
                  console.error("Error parsing opponent card effect:", e);
                }
              }
            }
          } catch (error) {
            console.error(
              "Error fetching round data for Quick Draw check:",
              error
            );
          }

          // If turn has changed
          if (isCurrentPlayerTurn !== isMyTurn) {
            console.log(`Turn changed: ${isMyTurn} → ${isCurrentPlayerTurn}`);

            // If it's now the player's turn, QuickDraw effect has ended, hide notifications
            if (
              isCurrentPlayerTurn &&
              (showOpponentQuickDrawMessage ||
                showOpponentQuickDrawMessageMinimized)
            ) {
              console.log("Turn changed to player - hiding QuickDraw effect");
              setShowOpponentQuickDrawMessage(false);
              setShowOpponentQuickDrawMessageMinimized(false);
            }

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
  }, [
    gameStarted,
    waitingForPlayer,
    battleState?.session_uuid,
    lobbyCode,
    currentUserId,
    isMyTurn,
    hasShownOpponentQuickDrawEffect,
    processedQuickDrawEffects,
    currentQuickDrawEffectId,
    showOpponentQuickDrawMessage,
    showOpponentQuickDrawMessageMinimized,
  ]);

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

  // Add a function to fetch the user's reward multiplier
  const fetchUserRewardMultiplier = async (userId: string) => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/${userId}/stats`
      );

      // Check if user has an active reward multiplier
      if (
        data.reward_multiplier > 1 &&
        new Date(data.reward_multiplier_expiry) > new Date()
      ) {
        console.log(
          `User ${userId} has an active reward multiplier: ${data.reward_multiplier}x`
        );
        return data.reward_multiplier;
      }

      return 1; // Default multiplier if not active
    } catch (error) {
      console.error("Error fetching reward multiplier:", error);
      return 1; // Default value on error
    }
  };

  // Modify the handleViewSessionReport function to check for active fortune coins
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
    const timeSpent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    // Determine if game is a tie
    const isTie = playerHealth === opponentHealth;
    // Determine if player is winner (only if not a tie)
    const isWinner = !isTie && playerHealth > opponentHealth;

    const [hostMultiplier, guestMultiplier] = await Promise.all([
      fetchUserRewardMultiplier(hostId),
      fetchUserRewardMultiplier(guestId),
    ]);

    // Update state with multipliers (for debugging)
    setRewardMultipliers({
      hostMultiplier,
      guestMultiplier,
    });

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

      // NEW: Check if loser has an active Fortune Coin
      let loserHasActiveFortuneCoin = false;
      let fortuneCoinId = null;

      try {
        const fortuneCoinResponse = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/shop/user-active-items/${loserId}/ITEM004FC`
        );

        if (fortuneCoinResponse.data.active) {
          loserHasActiveFortuneCoin = true;
          fortuneCoinId = fortuneCoinResponse.data.id;
          console.log(
            `Loser (${loserId}) has an active Fortune Coin. Win streak will be protected.`
          );
        }
      } catch (error) {
        console.error("Error checking for active Fortune Coin:", error);
      }

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
        // For loser, only reset streak if they don't have an active Fortune Coin
        axios.put<WinStreakResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/win-streak`,
          {
            firebase_uid: loserId,
            is_winner: loserHasActiveFortuneCoin, // If they have a Fortune Coin, treat them as if they won (keep streak)
            protect_streak: loserHasActiveFortuneCoin, // New flag to indicate Fortune Coin protection
          }
        ),
      ]);

      // NEW: If loser had active Fortune Coin, mark it as used
      if (loserHasActiveFortuneCoin && fortuneCoinId) {
        try {
          await axios.put(
            `${import.meta.env.VITE_BACKEND_URL}/api/shop/use-fortune-coin`,
            {
              firebase_uid: loserId,
              item_id: fortuneCoinId,
            }
          );
          console.log(`Fortune Coin for user ${loserId} marked as used`);
        } catch (error) {
          console.error("Error marking Fortune Coin as used:", error);
        }
      }

      // Get the updated win streak for reward calculation
      const updatedWinStreak = winnerUpdate.data.success
        ? winnerUpdate.data.data.win_streak
        : 0;

      // Calculate rewards using the updated win streak AND reward multipliers
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
        false, // Premium status
        hostMultiplier, // Apply host's reward multiplier
        "host" // Specify player role
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
        false, // Premium status
        guestMultiplier, // Apply guest's reward multiplier
        "guest" // Specify player role
      );

      // Log rewards calculation with multipliers for debugging
      console.log("Host Rewards (with multiplier):", {
        multiplier: hostMultiplier,
        rewards: hostRewards,
      });
      console.log("Guest Rewards (with multiplier):", {
        multiplier: guestMultiplier,
        rewards: guestRewards,
      });

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
            early_end: earlyEnd,
          };

          const { data } = await axios.post<SessionReportResponse>(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/gameplay/battle/save-session-report`,
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
          earlyEnd: earlyEnd,
          startTime: battleStartTime,
          highestStreak: battleStats.highestStreak,
          playerHealth,
          opponentHealth,
          playerName,
          opponentName,
          isWinner,
          isTie, // Add tie game flag
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

  // Update the settings button click handler to open the modal
  const handleSettingsButtonClick = () => {
    setShowSoundSettings(true);
  };

  // Handle leave game functionality
  const handleSettingsClick = async () => {
    // Prevent multiple calls
    if (isEndingBattle) return;

    // Show confirmation dialog - moved to SoundSettingsModal

    try {
      // Set earlyEnd flag to true to indicate this is an early battle end
      setEarlyEnd(true);

      // Call handleLeaveBattle with the current user's ID
      await handleLeaveBattle("Left The Game", currentUserId);
    } catch (error) {
      console.error("Error leaving battle:", error);
      // Force navigation anyway on error
      window.location.replace("/dashboard/home");
    }
  };

  // Effect to fetch battle session data
  useEffect(() => {
    const fetchBattleSessionData = async () => {
      if (!lobbyCode) return;

      try {
        const { data } = await axios.get<BattleSessionResponse>(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/session-with-material/${lobbyCode}`
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
              const { data: studyMaterialData } =
                await axios.get<StudyMaterialInfoResponse>(
                  `${
                    import.meta.env.VITE_BACKEND_URL
                  }/api/study-material/info/${data.data.study_material_id}`
                );

              if (
                studyMaterialData.success &&
                studyMaterialData.data.total_items
              ) {
                console.log("Setting totalItems from study material:", {
                  total_items: studyMaterialData.data.total_items,
                  study_material_id: data.data.study_material_id,
                });
                setTotalItems(studyMaterialData.data.total_items);
              }
            } catch (error) {
              console.error("Error fetching study material info:", error);
            }
          }

          // Store session UUID and player role in sessionStorage for card effects
          if (data.data.session_uuid) {
            sessionStorage.setItem(
              "battle_session_uuid",
              data.data.session_uuid
            );
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
      if (
        battleState?.battle_started &&
        !questionGenState.isGenerating &&
        questionGenState.questions.length === 0
      ) {
        try {
          dispatchQuestionGen({ type: "START_GENERATION" });

          const { data } = await axios.post<GenerateQuestionsResponse>(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/gameplay/battle/generate-questions`,
            {
              session_uuid: battleState.session_uuid,
              study_material_id: studyMaterialId,
              difficulty_mode: difficultyMode,
              question_types: questionTypes,
              player_type: isHost ? "host" : "guest",
            }
          );

          if (data?.success && data.data) {
            dispatchQuestionGen({
              type: "GENERATION_SUCCESS",
              questions: data.data,
            });
          }
        } catch (error) {
          console.error("Error generating questions:", error);
          dispatchQuestionGen({
            type: "GENERATION_ERROR",
            error: "Failed to generate questions. Please try again.",
          });
          toast.error("Failed to generate questions. Please try again.");
        }
      }
    };

    generateQuestions();
  }, [
    battleState?.battle_started,
    battleState?.session_uuid,
    studyMaterialId,
    difficultyMode,
    questionTypes,
    isHost,
    questionGenState.isGenerating,
    questionGenState.questions.length,
  ]);

  // Add useEffect for game state changes
  useEffect(() => {
    if (gameStarted && !waitingForPlayer) {
      // Emit player entered game with inGame field
      socket.emit("player_entered_game", {
        playerId: currentUserId,
        mode: "pvp-battle",
        inGame: true,
      });

      // Also emit user game status change
      socket.emit("userGameStatusChanged", {
        userId: currentUserId,
        mode: "pvp-battle",
        inGame: true,
      });
    } else {
      // When game ends or player is waiting, set inGame to false
      socket.emit("player_entered_game", {
        playerId: currentUserId,
        mode: "pvp-battle",
        inGame: false,
      });

      socket.emit("userGameStatusChanged", {
        userId: currentUserId,
        mode: "pvp-battle",
        inGame: false,
      });
    }

    // Cleanup function to handle component unmount
    return () => {
      // Clean up any session storage related to card selection
      sessionStorage.removeItem("battle_cards");
      sessionStorage.removeItem("battle_last_selected_index");
      sessionStorage.removeItem("battle_turn_count");
      sessionStorage.removeItem("battle_is_first_turn");

      socket.emit("player_exited_game", {
        playerId: currentUserId,
        inGame: false,
      });

      socket.emit("userGameStatusChanged", {
        userId: currentUserId,
        mode: "pvp-battle",
        inGame: false,
      });
    };
  }, [gameStarted, waitingForPlayer, currentUserId]);

  // Monitor question count changes
  useEffect(() => {
    console.log("Question count state changed:", {
      currentQuestionNumber,
      totalItems,
      timestamp: new Date().toISOString(),
    });
  }, [currentQuestionNumber, totalItems]);

  // Monitor battle round data for question count updates
  useEffect(() => {
    if (battleState?.session_uuid) {
      const fetchRoundData = async () => {
        try {
          const response = await axios.get<BattleRoundResponse>(
            `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/round/${
              battleState.session_uuid
            }`
          );

          // Handle null case - if question_count_total is null, treat it as 0
          const questionCountFromDB =
            response.data.data?.question_count_total ?? 0;

          console.log("Question count update from round data:", {
            new_count: questionCountFromDB,
            current_count: currentQuestionNumber,
            total_questions: totalItems,
            timestamp: new Date().toISOString(),
          });

          // Check if we've reached or exceeded the total questions
          if (questionCountFromDB >= totalItems) {
            console.log("Question limit reached, ending game");

            // Check for tie game first when health is equal
            if (playerHealth === opponentHealth) {
              console.log(
                "Tie game detected at question limit! Both players have equal health:",
                playerHealth
              );
              setShowTieGameModal(true);
              setShowCards(false);
            }
            // Then check for normal win conditions
            else {
              // Determine winner based on health
              const isPlayerWinner = playerHealth > opponentHealth;
              setVictoryMessage(isPlayerWinner ? "You Won!" : "You Lost!");
              setShowVictoryModal(true);
              setShowCards(false);
            }

            setGameStarted(false);
            return;
          }

          // Always update with the database value, which could be 0 if null
          setCurrentQuestionNumber(questionCountFromDB);
        } catch (error) {
          console.error("Error fetching round data:", error);
        }
      };

      // Poll for round data every 2 seconds instead of every 1 second
      const interval = setInterval(fetchRoundData, 2000);
      fetchRoundData(); // Initial fetch

      return () => clearInterval(interval);
    }
  }, [battleState?.session_uuid, totalItems, playerHealth, opponentHealth]);

  // Function to play a random correct answer sound
  const playRandomCorrectAnswerSound = () => {
    if (correctAnswerSoundRef.current) {
      // Generate a random number 1-4
      const randomSoundNumber = Math.floor(Math.random() * 4) + 1;

      // Set the correct sound file
      correctAnswerSoundRef.current.src = `/GameBattle/correctSound/correct${randomSoundNumber}.mp3`;

      // Log current volume for debugging
      console.log(
        "Playing correct answer sound with volume:",
        correctAnswerSoundRef.current.volume
      );

      // Play the sound
      correctAnswerSoundRef.current
        .play()
        .catch((err) =>
          console.error(
            `Error playing correct answer sound ${randomSoundNumber}:`,
            err
          )
        );

      console.log(`Playing correct answer sound ${randomSoundNumber}`);

      // Play a second random sound effect after 0.5 seconds
      setTimeout(() => {
        if (correctSfxRef.current) {
          // Generate a different random number 1-4
          const randomSfxNumber = Math.floor(Math.random() * 4) + 1;

          // Set the correct sound effect file
          correctSfxRef.current.src = `/GameBattle/correctSfx/correctSfx${randomSfxNumber}.mp3`;

          // Log current volume for debugging
          console.log(
            "Playing correct SFX with volume:",
            correctSfxRef.current.volume
          );

          // Play the sound effect
          correctSfxRef.current
            .play()
            .catch((err) =>
              console.error(
                `Error playing correct sfx sound ${randomSfxNumber}:`,
                err
              )
            );

          console.log(`Playing correctsfx${randomSfxNumber}.mp3 after delay`);
        }
      }, 500); // 0.5 seconds delay
    }
  };

  // Function to play a random incorrect answer sound
  const playRandomIncorrectAnswerSound = () => {
    if (incorrectAnswerSoundRef.current) {
      // Generate a random number 1-4
      const randomSoundNumber = Math.floor(Math.random() * 4) + 1;

      // Set the incorrect sound file
      incorrectAnswerSoundRef.current.src = `/GameBattle/incorrectSound/incorrect${randomSoundNumber}.mp3`;

      // Log current volume for debugging
      console.log(
        "Playing incorrect answer sound with volume:",
        incorrectAnswerSoundRef.current.volume
      );

      // Play the sound
      incorrectAnswerSoundRef.current
        .play()
        .catch((err) =>
          console.error(
            `Error playing incorrect answer sound ${randomSoundNumber}:`,
            err
          )
        );

      console.log(`Playing incorrect answer sound ${randomSoundNumber}`);

      // Play a second random sound effect after 0.5 seconds
      setTimeout(() => {
        if (incorrectSfxRef.current) {
          // Generate a different random number 1-4
          const randomSfxNumber = Math.floor(Math.random() * 4) + 1;

          // Set the incorrect sound effect file
          incorrectSfxRef.current.src = `/GameBattle/incorrectSfx/incorrectSfx${randomSfxNumber}.mp3`;

          // Log current volume for debugging
          console.log(
            "Playing incorrect SFX with volume:",
            incorrectSfxRef.current.volume
          );

          // Play the sound effect
          incorrectSfxRef.current
            .play()
            .catch((err) =>
              console.error(
                `Error playing incorrect sfx sound ${randomSfxNumber}:`,
                err
              )
            );

          console.log(`Playing incorrectSfx${randomSfxNumber}.mp3 after delay`);
        }
      }, 500); // 0.5 seconds delay
    }
  };

  // Add a useEffect to calculate actual volume values based on sliders
  useEffect(() => {
    // Calculate actual sound effect volume (0-1 scale) based on master and sfx volume percentages
    const calculatedVolume = (soundEffectsVolume / 100) * (masterVolume / 100);
    setActualSoundEffectsVolume(calculatedVolume);

    // Log the calculated volume
    console.log(
      `Calculated sound effects volume: ${calculatedVolume.toFixed(
        2
      )} (from ${soundEffectsVolume}% SFX and ${masterVolume}% master)`
    );
  }, [masterVolume, soundEffectsVolume]);

  // Initialize volume states from localStorage
  useEffect(() => {
    const loadSavedSettings = () => {
      try {
        const savedSettings = localStorage.getItem("duel-learn-audio-settings");
        if (savedSettings) {
          const { master, music, effects } = JSON.parse(savedSettings);
          setMasterVolume(master);
          setMusicVolume(music);
          setSoundEffectsVolume(effects);
          console.log("Loaded saved audio settings on mount:", {
            master,
            music,
            effects,
          });
        }
      } catch (error) {
        console.error("Error loading saved audio settings:", error);
      }
    };

    loadSavedSettings();
  }, []);

  // Add a handler for the early leave modal
  const handleEarlyLeaveConfirm = () => {
    setShowEarlyLeaveModal(false);
    navigate("/dashboard/home");
  };

  // Add a handler for viewing the early leave session report
  const handleViewEarlyLeaveReport = async () => {
    setShowEarlyLeaveModal(false);

    // Calculate time spent
    const endTime = new Date();
    let startTime = battleStartTime || new Date(Date.now() - 60000); // Fallback to 1 minute ago
    const timeDiffMs = endTime.getTime() - startTime.getTime();
    const timeSpent = formatTime(timeDiffMs);

    // Get rewards from earlyEndRewards function
    const earlyRewards = earlyEndRewards(false); // TODO: Get premium status

    navigate("/dashboard/pvp-battle/session-report", {
      state: {
        timeSpent,
        correctCount: battleStats.correctAnswers,
        incorrectCount: battleStats.incorrectAnswers,
        mode: "pvp",
        material: { study_material_id: studyMaterialId },
        earlyEnd: true,
        startTime: startTime,
        highestStreak: battleStats.highestStreak,
        playerHealth: isHost ? playerHealth : opponentHealth,
        opponentHealth: isHost ? opponentHealth : playerHealth,
        playerName: playerName,
        opponentName: opponentName,
        isWinner: true, // Always a winner in early leave case
        sessionUuid: battleState?.session_uuid,
        hostId,
        guestId,
        isHost,
        earnedXP: earlyRewards.xp,
        earnedCoins: earlyRewards.coins,
      },
    });
  };

  // Add a utility function to format time for session report (milliseconds to mm:ss)
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Add a function to determine if we should hide the game UI
  const shouldHideGameUI = () => {
    return showVictoryModal || showEarlyLeaveModal;
  };

  // Add this effect to reset the flag when a new game starts or when effects change significantly
  useEffect(() => {
    // Reset the flag when the effect is no longer showing
    if (!showOpponentQuickDrawMessage) {
      setHasShownOpponentQuickDrawEffect(false);
    }
  }, [showOpponentQuickDrawMessage]); // Only depend on the message visibility

  // Add this useEffect to load processed effects from sessionStorage on component mount
  useEffect(() => {
    const storedEffects = sessionStorage.getItem("shown_quick_draw_effects");
    if (storedEffects) {
      try {
        const parsedEffects = JSON.parse(storedEffects);
        setProcessedQuickDrawEffects(new Set(parsedEffects));
      } catch (e) {
        console.error("Error parsing stored QuickDraw effects:", e);
        // Reset if there's an error
        sessionStorage.removeItem("shown_quick_draw_effects");
      }
    }
    // Return void or a cleanup function
  }, []);

  // Function to check if a QuickDraw effect has already been shown
  const hasEffectBeenShown = (
    effectId: string,
    appliedAt: number | string
  ): boolean => {
    try {
      // Get shown effects from sessionStorage
      const shownEffects = sessionStorage.getItem("shown_quick_draw_effects");
      if (shownEffects) {
        const parsedEffects = JSON.parse(shownEffects) as {
          id: string;
          timestamp: number | string;
        }[];

        // Check if we have this exact effect with same timestamp
        return parsedEffects.some(
          (effect) => effect.id === effectId && effect.timestamp === appliedAt
        );
      }
      return false;
    } catch (e) {
      console.error("Error checking if effect has been shown:", e);
      return false;
    }
  };

  // Function to mark a QuickDraw effect as already shown
  const markEffectAsShown = (
    effectId: string,
    appliedAt: number | string
  ): void => {
    try {
      // Get current shown effects
      const shownEffects = sessionStorage.getItem("shown_quick_draw_effects");
      let parsedEffects: { id: string; timestamp: number | string }[] = [];

      if (shownEffects) {
        parsedEffects = JSON.parse(shownEffects);
      }

      // Add current effect ID with timestamp if not already in the list
      const exists = parsedEffects.some(
        (effect) => effect.id === effectId && effect.timestamp === appliedAt
      );

      if (!exists) {
        parsedEffects.push({
          id: effectId,
          timestamp: appliedAt,
        });
        sessionStorage.setItem(
          "shown_quick_draw_effects",
          JSON.stringify(parsedEffects)
        );
      }
    } catch (e) {
      console.error("Error marking effect as shown:", e);
    }
  };

  // Add this useEffect to initialize the sessionStorage format if needed
  useEffect(() => {
    // Initialize the effects storage with the new format if it doesn't exist
    const shownEffects = sessionStorage.getItem("shown_quick_draw_effects");

    if (!shownEffects) {
      // Create empty array with the new format
      sessionStorage.setItem("shown_quick_draw_effects", JSON.stringify([]));
    } else {
      try {
        // Check if we need to migrate from old format (array of strings)
        const parsed = JSON.parse(shownEffects);

        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          typeof parsed[0] === "string"
        ) {
          // Old format detected, convert to new format
          const newFormat = parsed.map((id: string) => ({
            id,
            timestamp: "migrated",
          }));
          sessionStorage.setItem(
            "shown_quick_draw_effects",
            JSON.stringify(newFormat)
          );
          console.log("Migrated QuickDraw effects to new format", newFormat);
        }
      } catch (e) {
        console.error("Error checking QuickDraw effects format:", e);
        // Reset if there's an error
        sessionStorage.setItem("shown_quick_draw_effects", JSON.stringify([]));
      }
    }
  }, []);

  // Initialize all sound refs once the component mounts
  useEffect(() => {
    // ... existing code ...

    // Initialize Mind Control sounds
    if (mindControlActivateSoundRef.current) {
      mindControlActivateSoundRef.current.src = "/GameBattle/MindControl.wav";
      mindControlActivateSoundRef.current.volume =
        calculateActualVolume(soundEffectsVolume);
      mindControlActivateSoundRef.current.preload = "auto";
    }

    if (mindControlEffectSoundRef.current) {
      mindControlEffectSoundRef.current.src = "/GameBattle/MindControl.wav";
      mindControlEffectSoundRef.current.volume =
        calculateActualVolume(soundEffectsVolume);
      mindControlEffectSoundRef.current.preload = "auto";
    }

    // ... existing code ...
  }, []);

  const checkForMindControl = async () => {
    // ... existing code ...

    // Play Mind Control activation sound
    if (mindControlActivateSoundRef.current) {
      mindControlActivateSoundRef.current.currentTime = 0;
      mindControlActivateSoundRef.current.play().catch((error) => {
        console.error("Error playing mind control activate sound:", error);
      });
    }

    // ... existing code inside your overlay/modal display logic ...

    // Play the ongoing effect sound when the mind control is active
    if (mindControlEffectSoundRef.current) {
      mindControlEffectSoundRef.current.currentTime = 0;
      mindControlEffectSoundRef.current.play().catch((error) => {
        console.error("Error playing mind control effect sound:", error);
      });
    }

    // ... existing code ...

    // Set a duration for the mind control effect (for example, 8 seconds)
    const effectDuration = 8000;

    // Optional: Stop the mind control effect sound when the effect ends
    setTimeout(() => {
      if (mindControlEffectSoundRef.current) {
        mindControlEffectSoundRef.current.pause();
        mindControlEffectSoundRef.current.currentTime = 0;
      }
    }, effectDuration);

    // ... existing code ...
  };

  // Calculate actual volume with master volume applied
  const calculateActualVolume = (specificVolume: number): number => {
    return (specificVolume / 100) * (masterVolume / 100);
  };

  // Inside the checkTurn useEffect: apply poison when turns change
  useEffect(() => {
    const checkTurn = async () => {
      // Skip if session is not available
      if (!battleState?.session_uuid) return;

      try {
        // Get the current battle session
        const response = await axios.get<BattleSessionResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/session/${
            battleState.session_uuid
          }`
        );

        if (response.data.success) {
          const sessionData = response.data.data;

          if (sessionData) {
            // Current user ID from session data
            const currentUserId = isHost ? hostId : guestId;

            // Log current state
            console.log("checkTurn: ", {
              sessionData,
              hostId,
              guestId,
              current_turn: sessionData.current_turn,
              isHost,
              currentUserId,
            });

            // Check if it's the current player's turn
            const isCurrentPlayerTurn =
              sessionData.current_turn === currentUserId;

            // Apply poison effects when a turn change is detected
            if (isCurrentPlayerTurn !== isMyTurn) {
              console.log(`Turn changed: ${isMyTurn} → ${isCurrentPlayerTurn}`);

              // Increment turn counter on EVERY turn change (both players' turns count)
              // This makes the poison effect last for 3 total turns combined
              setCurrentTurnNumber((prev) => prev + 1);
              console.log(
                `Turn number incremented to: ${currentTurnNumber + 1}`
              );

              // Play turn change sounds
              if (isCurrentPlayerTurn) {
                const yourTurnSound = new Audio("/GameBattle/YourTurn.mp3");
                yourTurnSound.volume =
                  calculateActualVolume(soundEffectsVolume);
                yourTurnSound.play();
              }

              // Set state for whose turn it is
              setIsMyTurn(isCurrentPlayerTurn);
            }
          }
        }
      } catch (error) {
        console.error("Error checking turn:", error);
      }
    };

    // Set interval to check turn (every 2 seconds)
    const turnCheckInterval = setInterval(checkTurn, 2000);

    // Initial check
    checkTurn();

    // Clean up interval
    return () => clearInterval(turnCheckInterval);
  }, [battleState, isHost, isMyTurn, soundEffectsVolume, hostId, guestId]);

  // Check for poison effects and apply damage when the turn changes
  useEffect(() => {
    const checkAndApplyPoisonEffects = async () => {
      if (!battleState?.session_uuid) return;

      try {
        // Apply poison effects to the current player regardless of whose turn it is
        const playerType = isHost ? "host" : "guest";

        // First check if the player has an active poison effect (to keep UI visible)
        const effectsResponse = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/card-effects/${
            battleState.session_uuid
          }/${playerType}`
        );

        // Check if player has active poison effects and update UI state
        if (effectsResponse.data.success) {
          const playerEffects = effectsResponse.data.data?.effects || [];
          const hasPlayerPoisonEffect = playerEffects.some(
            (effect) => effect.effect === "poison" && effect.turns_remaining > 0
          );

          // Keep poison effect UI active as long as there's an active poison effect
          setPoisonEffectActive(hasPlayerPoisonEffect);

          // Set player effects for reference (might be used in UI)
          setPlayerEffects(
            playerEffects.filter(
              (e) => e.effect === "poison" && e.turns_remaining > 0
            )
          );

          console.log(
            `Player poison status: ${
              hasPlayerPoisonEffect ? "POISONED" : "NOT POISONED"
            }, ` +
              `remaining turns: ${
                hasPlayerPoisonEffect && playerEffects.length > 0
                  ? playerEffects.find((e) => e.effect === "poison")
                      ?.turns_remaining
                  : "N/A"
              }`
          );
        }

        // Now apply poison damage if there is any
        const response = await axios.post(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/apply-poison-effects`,
          {
            session_uuid: battleState.session_uuid,
            player_type: playerType,
            current_turn_number: currentTurnNumber,
          }
        );

        if (
          response.data.success &&
          response.data.data.poison_damage_applied > 0
        ) {
          console.log(
            `Applied ${response.data.data.poison_damage_applied} poison damage on turn ${currentTurnNumber}`
          );

          // Update local health state from the response data
          if (response.data.data.updated_scores) {
            if (isHost) {
              setPlayerHealth(response.data.data.updated_scores.host_health);
            } else {
              setPlayerHealth(response.data.data.updated_scores.guest_health);
            }
          }

          // Show poison damage notification
          const damage = response.data.data.poison_damage_applied;

          const messageElement = document.createElement("div");
          messageElement.className =
            "fixed inset-0 flex items-center justify-center z-50";
          messageElement.innerHTML = `
            <div class="bg-green-900/80 text-white py-4 px-8 rounded-lg text-xl font-bold shadow-lg border-2 border-green-500/50">
              Poison Effect: You took ${damage} poison damage!
            </div>
          `;
          document.body.appendChild(messageElement);

          // Remove the message after 2 seconds but keep the poison UI active
          setTimeout(() => {
            document.body.removeChild(messageElement);
          }, 2000);
        }
      } catch (error) {
        console.error("Error applying poison effects:", error);
      }
    };

    // Check for poison effects on EVERY turn change (after the first turn)
    if (currentTurnNumber > 0) {
      checkAndApplyPoisonEffects();
    }
  }, [currentTurnNumber, battleState?.session_uuid, isHost]);

  // Add a handler for TieGameModal
  const handleTieGameConfirm = () => {
    // Close tie game modal
    setShowTieGameModal(false);
    // Return to the dashboard
    navigate("/dashboard/home");
  };

  // Add a handler for viewing the tie game session report
  const handleViewTieGameReport = async () => {
    // Calculate time spent
    const endTime = new Date();
    const startTime = battleStartTime || new Date();
    const timeDiffMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(timeDiffMs / 60000);
    const seconds = Math.floor((timeDiffMs % 60000) / 1000);
    const timeSpent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    // Navigate to session report with tie game flag
    navigate("/dashboard/pvp-battle/session-report", {
      state: {
        timeSpent,
        correctCount: battleStats.correctAnswers,
        incorrectCount: battleStats.incorrectAnswers,
        mode: "pvp",
        material: {
          id: studyMaterialId,
          title: "Study Material",
          description: "Study Material Description",
          difficulty: difficultyMode || "Average",
          category: "General",
        },
        highestStreak: battleStats.highestStreak,
        playerHealth,
        opponentHealth,
        playerName,
        opponentName,
        isWinner: false, // Neither player is a winner in a tie
        isTie: true, // New flag for tie games
        sessionUuid: battleState?.session_uuid,
        hostId,
        guestId,
        isHost,
        earnedXP: 30, // Fixed reward for tie games
        earnedCoins: 2, // Fixed reward for tie games
      },
    });
  };

  return (
    <>
      <DocumentHead
        title={
          !gameStarted
            ? "PvP Mode | Duel Learn"
            : isMyTurn
            ? "Your Turn | Duel Learn"
            : `${opponentName}'s Turn | Duel Learn`
        }
      />
      <div
        className="w-full h-screen flex flex-col relative"
        style={{
          backgroundImage: `url(${currentBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Audio elements */}
        <audio
          ref={attackSoundRef}
          src="/GameBattle/magical-twinkle-242245.mp3"
          preload="auto"
        />

        <audio
          ref={healthAttackSoundRef}
          src="/GameBattle/healthSfx/attackHealth.mp3"
          preload="auto"
        />

        <audio
          ref={backgroundMusicRef}
          src="/GameBattle/PVPBATTLEBGMUSICAVERAGE.mp3"
          preload="auto"
          id="pvp-background-music"
        />

        <audio
          ref={correctAnswerSoundRef}
          src="/GameBattle/correct1.mp3"
          preload="auto"
        />

        <audio
          ref={correctSfxRef}
          src="/GameBattle/correctSfx.mp3"
          preload="auto"
        />

        <audio
          ref={incorrectAnswerSoundRef}
          src="/GameBattle/incorrectAnswerSound.mp3"
          preload="auto"
        />

        <audio
          ref={incorrectSfxRef}
          src="/GameBattle/incorrectSfx.mp3"
          preload="auto"
        />

        <audio
          ref={decreaseHealthSoundRef}
          src="/GameBattle/healthSfx/decreaseHealth.mp3"
          preload="auto"
        />

        <audio
          ref={healRegenSoundRef}
          src="/GameBattle/healthSfx/healRegen.mp3"
          preload="auto"
        />

        <audio
          ref={regenerationSfxRef}
          src="/GameBattle/healthSfx/RegenerationSfx.wav"
          preload="auto"
        />

        <audio
          ref={selectedCardSoundRef}
          src="/GameBattle/selectedCard.mp3"
          preload="auto"
        />

        <audio
          ref={noSelectedCardSoundRef}
          src="/GameBattle/noSelectedCard.mp3"
          preload="auto"
        />

        {/* Add QuickDraw specific audio elements */}
        <audio
          ref={quickDrawUserSoundRef}
          src="/GameBattle/QuickDrawCardSfx/QuickDrawUser.mp3"
          preload="auto"
        />
        <audio
          ref={quickDrawEnemySoundRef}
          src="/GameBattle/QuickDrawCardSfx/QuickDrawEnemy.mp3"
          preload="auto"
        />

        {/* Add Time Manipulation audio elements */}
        <audio
          ref={timeManipulationActivateSoundRef}
          src="/GameBattle/TimeManipulationCardSFx/TimeManipulationActivateSfx.mp3"
          preload="auto"
        />
        <audio
          ref={timeManipulationEffectSoundRef}
          src="/GameBattle/TimeManipulationCardSFx/TimeManipulationEffectSfx.mp3"
          preload="auto"
        />

        {/* Add Answer Shield audio elements */}
        <audio
          ref={answerShieldActivatedSoundRef}
          src="/GameBattle/AnswerShieldSfx/AnswerShieldActivatedSfx.mp3"
          preload="auto"
        />
        <audio
          ref={answerShieldDamagedSoundRef}
          src="/GameBattle/AnswerShieldSfx/AnswerShieldDamagedSfx.mp3"
          preload="auto"
        />

        {/* Add Mind Control audio elements */}
        <audio
          ref={mindControlActivateSoundRef}
          src="/GameBattle/MindControl.wav"
          preload="auto"
        />
        <audio
          ref={mindControlEffectSoundRef}
          src="/GameBattle/MindControl.wav"
          preload="auto"
        />

        {/* Character animation manager - Hide when modals are active */}
        {!shouldHideGameUI() && (
          <CharacterAnimationManager
            playerAnimationState={playerAnimationState}
            enemyAnimationState={enemyAnimationState}
            setPlayerPickingIntroComplete={setPlayerPickingIntroComplete}
            setEnemyPickingIntroComplete={setEnemyPickingIntroComplete}
            playerPickingIntroComplete={playerPickingIntroComplete}
            enemyPickingIntroComplete={enemyPickingIntroComplete}
          />
        )}

        {/* Attack Animation Overlay - Hide when modals are active */}
        {!shouldHideGameUI() && showAttackAnimation && (
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

        {/* Only show the top UI bar when the battle interface should be shown and no modals are active */}
        {shouldShowBattleInterface() && !shouldHideGameUI() && (
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
              poisonEffectActive={opponentPoisonEffectActive}
              battleState={battleState}
            />

            {/* Settings button - updated to open modal */}
            <button
              className="absolute right-2 sm:right-4 top-2 sm:top-4 text-white z-50"
              onClick={handleSettingsButtonClick}
            >
              <Settings size={16} className="sm:w-[20px] sm:h-[20px]" />
            </button>
          </div>
        )}

        {/* Main Battle Area */}
        <div className="flex-1 relative">
          {/* Characters - Hide when modals are active */}
          {shouldShowBattleInterface() && !shouldHideGameUI() && (
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

          {/* Turn Randomizer (shown to both host and guest) - Hide when modals are active */}
          {showRandomizer && !shouldHideGameUI() && (
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

          {/* Waiting for host to randomize (shown to guest for 2 seconds) - Hide when modals are active */}
          {isGuestWaitingForRandomization() && !shouldHideGameUI() && (
            <GuestWaitingForRandomization waitingForRandomization={true} />
          )}

          {/* Game Start Animation - Hide when modals are active */}
          {showGameStart && !shouldHideGameUI() && (
            <GameStartAnimation
              showGameStart={showGameStart}
              gameStartText={gameStartText}
            />
          )}

          {/* Card Selection UI - Hide when modals are active */}
          {shouldShowBattleInterface() &&
            showCards &&
            showCardsAfterDelay &&
            !shouldHideGameUI() && (
              <div className="fixed inset-0 bg-black/20 z-10">
                <CardSelection
                  isMyTurn={isMyTurn}
                  opponentName={opponentName}
                  playerName={playerName}
                  onCardSelected={handleCardSelected}
                  difficultyMode={difficultyMode}
                  soundEffectsVolume={
                    (soundEffectsVolume / 100) * (masterVolume / 100)
                  }
                  answerShieldDamagedSoundRef={answerShieldDamagedSoundRef}
                  masterVolume={masterVolume}
                />
              </div>
            )}

          {/* Waiting overlay - Hide when modals are active */}
          {waitingForPlayer && !shouldHideGameUI() && (
            <WaitingOverlay
              isVisible={true}
              message="Waiting for your opponent to connect..."
            />
          )}

          {/* Loading overlay when ending battle - Always show */}
          <LoadingOverlay isVisible={isEndingBattle} />

          {/* Victory Modal - Always show */}
          <VictoryModal
            isOpen={showVictoryModal}
            onClose={handleVictoryConfirm}
            onViewReport={handleViewSessionReport}
            isVictory={victoryMessage.includes("Won")}
            currentUserId={currentUserId}
            sessionUuid={battleState?.session_uuid}
            playerHealth={playerHealth}
            opponentHealth={opponentHealth}
            earlyEnd={earlyEnd}
            soundEffectsVolume={
              (soundEffectsVolume / 100) * (masterVolume / 100)
            }
          />

          {/* Early Leave Modal - Always show */}
          <EarlyLeaveModal
            isOpen={showEarlyLeaveModal}
            onClose={handleEarlyLeaveConfirm}
            onViewReport={handleViewEarlyLeaveReport}
            currentUserId={currentUserId}
            sessionUuid={battleState?.session_uuid}
            opponentName={opponentName || "Opponent"}
            soundEffectsVolume={
              (soundEffectsVolume / 100) * (masterVolume / 100)
            }
          />

          {/* Tie Game Modal - Always show */}
          <TieGameModal
            isOpen={showTieGameModal}
            onClose={handleTieGameConfirm}
            onViewReport={handleViewTieGameReport}
            currentUserId={currentUserId}
            sessionUuid={battleState?.session_uuid}
            playerHealth={playerHealth}
            soundEffectsVolume={
              (soundEffectsVolume / 100) * (masterVolume / 100)
            }
          />

          {/* Question Modal */}
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
            shownQuestionIds={shownQuestionIds}
            currentQuestionNumber={currentQuestionNumber}
            totalQuestions={totalItems}
            onGameEnd={handleGameEnd}
            playCorrectSound={playRandomCorrectAnswerSound}
            playIncorrectSound={playRandomIncorrectAnswerSound}
            soundEffectsVolume={soundEffectsVolume}
            battleState={battleState}
            isHost={isHost}
            masterVolume={masterVolume}
            timeManipulationEffectSoundRef={timeManipulationEffectSoundRef}
          />

          {/* Add Enemy Question Display component - Hide when modals are active */}
          {shouldShowBattleInterface() && !shouldHideGameUI() && (
            <EnemyQuestionDisplay
              sessionUuid={battleState?.session_uuid}
              isHost={isHost}
              isMyTurn={isMyTurn}
              opponentName={opponentName}
            />
          )}

          {/* Session Report */}
          {showSessionReport && <PvpSessionReport />}

          {/* Old poison effect UI elements removed - using the new simple green overlay implementation instead */}

          {/* Sound Settings Modal */}
          <SoundSettingsModal
            isOpen={showSoundSettings}
            onClose={() => setShowSoundSettings(false)}
            onLeaveGame={handleSettingsClick}
            backgroundMusicRef={backgroundMusicRef}
            attackSoundRef={attackSoundRef}
            correctAnswerSoundRef={correctAnswerSoundRef}
            incorrectAnswerSoundRef={incorrectAnswerSoundRef}
            correctSfxRef={correctSfxRef}
            incorrectSfxRef={incorrectSfxRef}
            decreaseHealthSoundRef={decreaseHealthSoundRef}
            healthAttackSoundRef={healthAttackSoundRef}
            healRegenSoundRef={healRegenSoundRef}
            regenerationSfxRef={regenerationSfxRef}
            selectedCardSoundRef={selectedCardSoundRef}
            noSelectedCardSoundRef={noSelectedCardSoundRef}
            timeManipulationActivateSoundRef={timeManipulationActivateSoundRef}
            timeManipulationEffectSoundRef={timeManipulationEffectSoundRef}
            quickDrawUserSoundRef={quickDrawUserSoundRef}
            quickDrawEnemySoundRef={quickDrawEnemySoundRef}
            masterVolume={masterVolume}
            musicVolume={musicVolume}
            soundEffectsVolume={soundEffectsVolume}
            setMasterVolume={setMasterVolume}
            setMusicVolume={setMusicVolume}
            setSoundEffectsVolume={setSoundEffectsVolume}
            answerShieldActivatedSoundRef={answerShieldActivatedSoundRef}
            answerShieldDamagedSoundRef={answerShieldDamagedSoundRef}
            victorySoundRef={victorySoundRef}
            defeatSoundRef={defeatSoundRef}
            leftGameSoundRef={leftGameSoundRef}
            mindControlActivateSoundRef={mindControlActivateSoundRef}
            mindControlEffectSoundRef={mindControlEffectSoundRef}
          />

          {/* Poison effect indicator */}
          {poisonEffectActive &&
            shouldShowBattleInterface() &&
            !shouldHideGameUI() && (
              <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-fuchsia-800/10"></div>

                {/* Floating particles */}
                <div className="particle-container">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-2 h-2 rounded-full bg-fuchsia-400/60 animate-twinkle`}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDuration: `${5 + Math.random() * 10}s`,
                        animationDelay: `${Math.random() * 5}s`,
                        boxShadow: "0 0 8px 2px rgba(255, 105, 180, 0.4)",
                      }}
                    />
                  ))}
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div
                      key={i + 20}
                      className={`absolute w-3 h-3 rotate-45 bg-purple-500/50 animate-float`}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDuration: `${8 + Math.random() * 15}s`,
                        animationDelay: `${Math.random() * 5}s`,
                        boxShadow: "0 0 12px 3px rgba(139, 92, 246, 0.4)",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Poison effect notification */}
          {poisonEffectActive &&
            shouldShowBattleInterface() &&
            !shouldHideGameUI() && (
              <div className="fixed bottom-20 left-0 right-0 flex justify-center pointer-events-none z-40">
                <div className="bg-gradient-to-r from-purple-900 to-fuchsia-800 text-white py-4 px-8 rounded-lg shadow-lg border border-purple-400 animate-pulse-slow">
                  <div className="flex items-center space-x-3">
                    <svg
                      className="h-6 w-6 text-fuchsia-300 animate-spin-slow"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2L20 7L20 17L12 22L4 17L4 7L12 2Z" />
                    </svg>
                    <div className="flex flex-col">
                      <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-200 to-purple-200">
                        <span className="text-fuchsia-300">Witch's Curse:</span>{" "}
                        Dark magic drains 5 health each turn
                      </p>
                      <p className="text-sm text-fuchsia-200">
                        <span className="font-bold">Effect ends in:</span>{" "}
                        <span className="text-yellow-300 font-bold text-md">
                          {playerEffects.length > 0
                            ? playerEffects[0].turns_remaining
                            : 3}{" "}
                          {playerEffects.length > 0 &&
                          playerEffects[0].turns_remaining === 1
                            ? "turn"
                            : "turns"}
                        </span>
                      </p>
                    </div>
                    <svg
                      className="h-6 w-6 text-fuchsia-300 animate-spin-slow"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2L20 7L20 17L12 22L4 17L4 7L12 2Z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Time Manipulation Effect - displays when player activates the card */}
      <AnimatePresence>
        {showTimeManipulationEffect && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background overlay with clock-themed effect */}
            <div className="absolute inset-0 bg-indigo-900/30 backdrop-blur-sm"></div>

            {/* Time slow-down visual effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Central clock face */}
              <motion.div
                className="w-60 h-60 rounded-full border-4 border-purple-400/80 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, ease: "linear" }}
              >
                {/* Clock hands */}
                <motion.div
                  className="absolute h-24 w-1 bg-purple-300 origin-bottom"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 720 }}
                  transition={{ duration: 3 }}
                ></motion.div>
                <motion.div
                  className="absolute h-16 w-1 bg-purple-100 origin-bottom"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3 }}
                ></motion.div>
              </motion.div>

              {/* Radiating circles */}
              <motion.div
                className="absolute w-80 h-80 rounded-full border-2 border-purple-300/50"
                animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                transition={{ duration: 2, repeat: 1, repeatType: "loop" }}
              ></motion.div>
              <motion.div
                className="absolute w-100 h-100 rounded-full border border-purple-500/20"
                animate={{ scale: [1, 2], opacity: [1, 0] }}
                transition={{ duration: 3, repeat: 1, repeatType: "loop" }}
              ></motion.div>
            </div>

            {/* Minimal text indicator */}
            <div className="absolute bottom-20 left-0 right-0 flex justify-center">
              <motion.div
                className="bg-purple-900/80 px-6 py-3 rounded-full border border-purple-500"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className="text-purple-200 font-bold text-lg flex items-center gap-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: 1 }}
                >
                  <svg
                    className="w-6 h-6"
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
                  <span>Time Manipulation Activated</span>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time Manipulation effect */}
      {showTimeManipulationEffect && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <img
            src="/GameBattle/TimeManipulationEffect.png"
            alt="Time Manipulation Effect"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
      )}

      {/* Quick Draw visual effect */}
      {showQuickDrawEffect && (
        <div className="absolute inset-0 flex items-center justify-center z-[100]">
          {/* Magical background with radial gradient */}
          <div className="absolute inset-0 bg-gradient-radial from-amber-500/40 via-amber-600/30 to-transparent backdrop-blur-sm animate-pulse"></div>

          {/* Card display */}
          <div className="relative flex flex-col items-center z-[101]">
            <div className="relative w-64 h-80">
              {/* Card with glow and float animation */}
              <img
                src="/GameBattle/NormalCardQuickDraw.png"
                alt="Quick Draw"
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.7)] animate-float rounded-lg"
              />

              {/* Magic sparkles */}
              <div className="absolute inset-0 bg-[url('/effects/magic-sparkles.png')] bg-contain bg-no-repeat bg-center opacity-70 animate-magic-sparkle"></div>
            </div>

            {/* EXTRA TURN text banner */}
            <div className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-400 px-8 py-3 rounded-xl shadow-lg transform scale-110">
              <h2 className="text-3xl font-extrabold text-white tracking-wider animate-pulse-slow">
                EXTRA TURN!
              </h2>
            </div>

            {/* Energy circles */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-4 border-amber-400/30 animate-ping-slow"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-4 border-amber-500/40 animate-ping-slow delay-300"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-4 border-amber-600/50 animate-ping-slow delay-600"></div>
            </div>
          </div>
        </div>
      )}

      {/* Opponent's Quick Draw notification - centered version */}
      {showOpponentQuickDrawMessage &&
        !showOpponentQuickDrawMessageMinimized && (
          <div className="absolute inset-0 flex items-center justify-center z-[100]">
            {/* Dark/red background to indicate negative effect */}
            <div className="absolute inset-0 bg-gradient-radial from-red-700/50 via-red-900/40 to-black/80 backdrop-blur-sm animate-pulse"></div>

            {/* Card display */}
            <div className="relative flex flex-col items-center z-[101]">
              <div className="relative w-64 h-80">
                {/* Card with normal display (no red tint) */}
                <img
                  src="/GameBattle/NormalCardQuickDraw.png"
                  alt="Quick Draw"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              {/* TURN SKIPPED text banner */}
              <div className="mt-4 bg-gradient-to-r from-red-700 to-red-500 px-8 py-3 rounded-xl shadow-lg transform scale-110">
                <h2 className="text-3xl font-extrabold text-white tracking-wider animate-pulse-slow">
                  TURN SKIPPED!
                </h2>
              </div>

              {/* Restraining circles */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-4 border-red-500/30 animate-ping-slow"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-4 border-red-600/40 animate-ping-slow delay-300"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-4 border-red-700/50 animate-ping-slow delay-600"></div>
              </div>
            </div>
          </div>
        )}

      {/* Opponent's Quick Draw notification - minimized version at bottom */}
      {showOpponentQuickDrawMessage &&
        showOpponentQuickDrawMessageMinimized && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[90] transition-all duration-1000">
            <div
              className="bg-gradient-to-r from-red-700 to-red-500 px-6 py-2 rounded-xl shadow-lg flex items-center gap-3 animate-pulse-slow transition-opacity duration-1000"
              style={{ opacity: opponentQuickDrawMinimizedOpacity / 100 }}
            >
              <img
                src="/GameBattle/NormalCardQuickDraw.png"
                alt="Quick Draw"
                className="w-10 h-10 object-contain rounded"
              />
              <h2 className="text-xl font-bold text-white tracking-wider">
                TURN SKIPPED!
              </h2>
            </div>
          </div>
        )}
    </>
  );
}
