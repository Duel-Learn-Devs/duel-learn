import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// Character animations
import playerCharacter from "/characterinLobby/playerCharacter.gif"; // Regular idle animation for player
import enemyCharacter from "/characterinLobby/playerCharacter.gif"; // Regular idle animation for enemy
import PvpBattleBG from "/GameBattle/PvpBattleBG.png"; // Battle background image

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

// Import shared BattleState interface
import { BattleState } from "./BattleState";

// Create a shared battle rewards calculation function
const calculateBattleRewards = (
  isWinner: boolean,
  myHealth: number,
  opponentHealth: number,
  winStreak: number,
  isPremium: boolean = false
) => {
  // Base rewards
  const baseXP = 100;
  const baseCoins = 10;

  // Calculate HP difference for bonus/penalty
  const hpDifference = Math.abs(myHealth - opponentHealth);
  const hpModifier = Math.floor(hpDifference * 0.25); // 25% of HP difference

  // Calculate win streak bonus (10 points per win, max 50)
  const winStreakBonus = Math.min(winStreak * 10, 50);

  // Initialize rewards
  let xpReward = baseXP;
  let coinReward = baseCoins;

  if (isWinner) {
    // Winner gets base + HP bonus + win streak bonus
    xpReward = baseXP + hpModifier + winStreakBonus;
    coinReward = baseCoins + hpModifier + winStreakBonus;
  } else {
    // Loser gets base - HP penalty
    xpReward = Math.max(0, baseXP - hpModifier);
    coinReward = Math.max(0, baseCoins - hpModifier);
  }

  // Apply premium multiplier if applicable
  if (isPremium) {
    xpReward *= 2;
    coinReward *= 2;
  }

  return {
    xp: Math.floor(xpReward),
    coins: Math.floor(coinReward),
  };
};

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
  const [currentQuestion, setCurrentQuestion] = useState(1);
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
  });

  // Function to determine if guest is waiting for randomization
  const isGuestWaitingForRandomization =
    !isHost &&
    !waitingForPlayer &&
    battleState?.battle_started &&
    !battleState?.current_turn &&
    !randomizationDone;

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

    // Reset player animations to idle
    setPlayerAnimationState("idle");
    setPlayerPickingIntroComplete(false);
  };

  // Handle answer submission
  const handleAnswerSubmit = async (isCorrect: boolean) => {
    if (!selectedCardId) return;

    try {
      const playerType = isHost ? "host" : "guest";

      // Update battle stats first
      setBattleStats((prev) => {
        const newStreak = isCorrect ? prev.currentStreak + 1 : 0;
        return {
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
      });

      // Update the battle round
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/update-round`,
        {
          session_uuid: battleState?.session_uuid,
          player_type: playerType,
          card_id: selectedCardId,
          is_correct: isCorrect,
          lobby_code: lobbyCode,
          battle_stats: battleStats, // Send current stats to backend
        }
      );

      if (response.data.success) {
        console.log(
          `Card ${selectedCardId} selection and answer submission successful, turn switched`
        );

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
          } else if (
            response.data.data.card_effect.type === "epic-1" &&
            isCorrect
          ) {
            // Show notification for Answer Shield card effect
            const messageElement = document.createElement("div");
            messageElement.className =
              "fixed inset-0 flex items-center justify-center z-50";
            messageElement.innerHTML = `
              <div class="bg-purple-900/80 text-white py-4 px-8 rounded-lg text-xl font-bold shadow-lg border-2 border-purple-500/50">
                Answer Shield Card: Opponent's next card selection will be blocked!
              </div>
            `;
            document.body.appendChild(messageElement);

            // Remove the message after 2 seconds
            setTimeout(() => {
              document.body.removeChild(messageElement);
            }, 2000);
          } else if (
            response.data.data.card_effect.type === "epic-2" &&
            isCorrect
          ) {
            // Show notification for Regeneration card effect
            const messageElement = document.createElement("div");
            messageElement.className =
              "fixed inset-0 flex items-center justify-center z-50";
            const healthAmount =
              response.data.data.card_effect.health_amount || 10;
            messageElement.innerHTML = `
              <div class="bg-purple-900/80 text-white py-4 px-8 rounded-lg text-xl font-bold shadow-lg border-2 border-purple-500/50">
                Regeneration Card: Your health increased by ${healthAmount} HP!
              </div>
            `;
            document.body.appendChild(messageElement);

            // Update health locally if we can
            if (isHost) {
              setPlayerHealth((prev) => Math.min(prev + healthAmount, 100));
            } else {
              setPlayerHealth((prev) => Math.min(prev + healthAmount, 100));
            }

            // Remove the message after 2 seconds
            setTimeout(() => {
              document.body.removeChild(messageElement);
            }, 2000);
          } else if (
            response.data.data.card_effect.type === "rare-2" &&
            isCorrect
          ) {
            // Show notification for Poison Type card effect
            const messageElement = document.createElement("div");
            messageElement.className =
              "fixed inset-0 flex items-center justify-center z-50";
            messageElement.innerHTML = `
              <div class="bg-purple-900/80 text-white py-4 px-8 rounded-lg text-xl font-bold shadow-lg border-2 border-purple-500/50">
                Poison Type Card: Opponent takes 10 initial damage plus 5 damage for 3 turns!
              </div>
            `;
            document.body.appendChild(messageElement);

            // Remove the message after 2 seconds
            setTimeout(() => {
              document.body.removeChild(messageElement);
            }, 2000);
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
  };

  // Handle question modal close
  const handleQuestionModalClose = () => {
    setShowQuestionModal(false);
    setSelectedCardId(null);
  };

  // Add polling for turn updates
  useEffect(() => {
    // Skip if game hasn't started or we're waiting for players
    if (!gameStarted || waitingForPlayer || !battleState?.session_uuid) return;

    // Function to check if it's our turn
    const checkTurn = async () => {
      try {
        // Get the latest session state
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/session-state/${lobbyCode}`
        );

        if (
          response &&
          response.data &&
          response.data.success &&
          response.data.data
        ) {
          const sessionData = response.data.data;

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
  }, [
    gameStarted,
    waitingForPlayer,
    battleState?.session_uuid,
    lobbyCode,
    currentUserId,
    isMyTurn,
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

    // Navigate directly to dashboard without creating a history entry
    window.location.replace("/dashboard/home");
  };

  // Handle viewing session report
  const handleViewSessionReport = async () => {
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
        axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/win-streak`,
          {
            firebase_uid: winnerId,
            is_winner: true,
          }
        ),
        // Reset loser's streak
        axios.put(
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

          const response = await axios.post(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/gameplay/battle/save-session-report`,
            sessionReportPayload
          );

          if (response.data.success) {
            console.log("Session report saved successfully");
          } else {
            console.error(
              "Failed to save session report:",
              response.data.message
            );
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
        await handleLeaveBattle('Left The Game', currentUserId);
      } catch (error) {
        console.error("Error leaving battle:", error);
        // Force navigation anyway on error
        window.location.replace("/dashboard/home");
      }
    }
  };

  // Effect to fetch battle session data to get difficulty mode and study material id
  useEffect(() => {
    const fetchBattleSessionData = async () => {
      if (!lobbyCode) return;

      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/session-with-material/${lobbyCode}`
        );

        if (
          response &&
          response.data &&
          response.data.success &&
          response.data.data
        ) {
          setDifficultyMode(response.data.data.difficulty_mode);

          // Set question types from battle session
          if (response.data.data.question_types) {
            setQuestionTypes(response.data.data.question_types);
          }

          // Get the study material id
          if (response.data.data.study_material_id) {
            setStudyMaterialId(response.data.data.study_material_id);

            // Fetch study material info to get total items
            try {
              const studyMaterialResponse = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/study-material/info/${
                  response.data.data.study_material_id
                }`
              );

              if (
                studyMaterialResponse &&
                studyMaterialResponse.data &&
                studyMaterialResponse.data.success &&
                studyMaterialResponse.data.data &&
                studyMaterialResponse.data.data.total_items
              ) {
                setTotalItems(studyMaterialResponse.data.data.total_items);
              }
            } catch (error) {
              console.error("Error fetching study material info:", error);
            }
          }

          // Store session UUID and player role in sessionStorage for card effects
          if (response.data.data.session_uuid) {
            sessionStorage.setItem(
              "battle_session_uuid",
              response.data.data.session_uuid
            );
            sessionStorage.setItem("is_host", isHost.toString());
          }
        }
      } catch (error) {
        console.error("Error fetching battle session data:", error);
      }
    };

    fetchBattleSessionData();

    // Set up polling for battle session data
    const pollInterval = setInterval(fetchBattleSessionData, 2000);

    return () => {
      clearInterval(pollInterval);
      // Clean up session storage when component unmounts
      sessionStorage.removeItem("battle_session_uuid");
      sessionStorage.removeItem("is_host");
    };
  }, [lobbyCode, isHost]);

  // Effect to fetch battle scores
  useEffect(() => {
    const fetchBattleScores = async () => {
      if (!battleState?.session_uuid) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/scores/${
            battleState.session_uuid
          }`
        );

        if (
          response &&
          response.data &&
          response.data.success &&
          response.data.data
        ) {
          const scores = response.data.data;
          // Set health based on whether player is host or guest
          if (isHost) {
            setPlayerHealth(scores.host_health);
            setOpponentHealth(scores.guest_health);

            // Check for victory/defeat conditions
            if (scores.host_health <= 0) {
              setVictoryMessage("You Lost!");
              setShowVictoryModal(true);
            } else if (scores.guest_health <= 0) {
              setVictoryMessage("You Won!");
              setShowVictoryModal(true);
            }
          } else {
            setPlayerHealth(scores.guest_health);
            setOpponentHealth(scores.host_health);

            // Check for victory/defeat conditions
            if (scores.guest_health <= 0) {
              setVictoryMessage("You Lost!");
              setShowVictoryModal(true);
            } else if (scores.host_health <= 0) {
              setVictoryMessage("You Won!");
              setShowVictoryModal(true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching battle scores:", error);
      }
    };

    // Poll for battle scores every 1.5 seconds
    const scoresPollInterval = setInterval(fetchBattleScores, 1500);
    fetchBattleScores(); // Initial fetch

    return () => clearInterval(scoresPollInterval);
  }, [battleState?.session_uuid, isHost]);

  // Check for poison effects and apply damage when the turn changes
  useEffect(() => {
    const checkAndApplyPoisonEffects = async () => {
      if (!battleState?.session_uuid) return;

      try {
        // Apply poison effects to the current player at the start of their turn
        const playerType = isHost ? "host" : "guest";

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
            `Applied ${response.data.data.poison_damage_applied} poison damage`
          );

          // Update local health state from the response data
          if (response.data.data.updated_scores) {
            if (isHost) {
              setPlayerHealth(response.data.data.updated_scores.host_health);
            } else {
              setPlayerHealth(response.data.data.updated_scores.guest_health);
            }
          }

          // Check active poison effects
          interface PoisonEffect {
            turns_remaining: number;
            effect: string;
            type: string;
            target: string;
          }

          const activePoisonEffects = response.data.data.active_poison_effects as PoisonEffect[] || [];
          if (activePoisonEffects.length > 0) {
            // Get the max turns remaining from all active poison effects
            const maxTurnsRemaining = Math.max(...activePoisonEffects.map(effect => effect.turns_remaining));
            setPoisonTurnsRemaining(maxTurnsRemaining);

            // Set poison effect as active if any turns remain
            setPoisonEffectActive(maxTurnsRemaining > 0);
          } else {
            // No more active poison effects
            setPoisonTurnsRemaining(0);
            setPoisonEffectActive(false);
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

          // Remove only the message after 2 seconds, but keep the poison effect indicator
          setTimeout(() => {
            document.body.removeChild(messageElement);
          }, 2000);
        } else {
          // Check if poison effect has ended
          if (poisonTurnsRemaining <= 0) {
            setPoisonEffectActive(false);
          }
        }
      } catch (error) {
        console.error("Error applying poison effects:", error);
      }
    };

    // Only check when it's this player's turn and the turn has changed
    if (isMyTurn && currentTurnNumber > 0) {
      checkAndApplyPoisonEffects();
    }
  }, [isMyTurn, currentTurnNumber, battleState?.session_uuid, isHost, poisonTurnsRemaining]);

  // Set battle start time when game starts
  useEffect(() => {
    if (gameStarted && !battleStartTime) {
      setBattleStartTime(new Date());
    }
  }, [gameStarted, battleStartTime]);

  // Effect to sync battle stats with backend periodically

  return (
    <div
      className="w-full h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${PvpBattleBG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Character animation manager */}
      <CharacterAnimationManager
        playerAnimationState={playerAnimationState}
        enemyAnimationState={enemyAnimationState}
        setPlayerPickingIntroComplete={setPlayerPickingIntroComplete}
        setEnemyPickingIntroComplete={setEnemyPickingIntroComplete}
        playerPickingIntroComplete={playerPickingIntroComplete}
        enemyPickingIntroComplete={enemyPickingIntroComplete}
      />

      {/* Top UI Bar */}
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
          currentQuestion={currentQuestion}
          totalQuestions={totalItems}
          difficultyMode={difficultyMode}
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

      {/* Main Battle Area */}
      <div className="flex-1 relative">
        {/* Characters */}
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

        {/* Turn Randomizer (only shown to host) */}
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

        {/* Waiting for host to randomize (shown to guest) */}
        <GuestWaitingForRandomization
          waitingForRandomization={isGuestWaitingForRandomization}
        />

        {/* Game Start Animation */}
        <GameStartAnimation
          showGameStart={showGameStart}
          gameStartText={gameStartText}
        />

        {/* Card Selection UI - Show after the waiting screen and delay */}
        {gameStarted &&
          showCards &&
          !waitingForPlayer &&
          showCardsAfterDelay && (
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
        <WaitingOverlay
          isVisible={waitingForPlayer}
          message="Waiting for your opponent to connect..."
        />

        {/* Loading overlay when ending battle */}
        <LoadingOverlay isVisible={isEndingBattle} />

        {/* Victory Modal */}
        <VictoryModal
          showVictoryModal={showVictoryModal}
          victoryMessage={victoryMessage}
          onConfirm={handleVictoryConfirm}
          onViewSessionReport={handleViewSessionReport}
        />

        {/* Question Modal */}
        <QuestionModal
          isOpen={showQuestionModal}
          onClose={handleQuestionModalClose}
          onAnswerSubmit={handleAnswerSubmit}
          difficultyMode={difficultyMode}
          questionTypes={questionTypes}
          selectedCardId={selectedCardId}
        />

        {/* Session Report */}
        {showSessionReport && <PvpSessionReport />}

        {/* Poison effect indicator */}
        {poisonEffectActive && (
          <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
            <div className="absolute inset-0 bg-green-500/20 animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}
