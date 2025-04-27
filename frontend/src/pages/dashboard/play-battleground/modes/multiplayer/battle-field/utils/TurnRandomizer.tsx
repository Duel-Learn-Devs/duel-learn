import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { BattleState } from "../BattleState";

interface TurnRandomizerProps {
  isHost: boolean;
  lobbyCode: string;
  hostUsername: string;
  guestUsername: string;
  hostId: string;
  guestId: string;
  showRandomizer: boolean;
  currentDisplayName?: string;
  playerPickingIntroComplete: boolean;
  enemyPickingIntroComplete: boolean;
  battleState: BattleState | null;
  setRandomizationDone: (value: boolean) => void;
  setShowRandomizer: (value: boolean) => void;
  setShowGameStart: (value: boolean) => void;
  setGameStartText: (text: string) => void;
  setGameStarted: (value: boolean) => void;
  setIsMyTurn: (value: boolean) => void;
  setPlayerAnimationState: (state: string) => void;
  setPlayerPickingIntroComplete: (value: boolean) => void;
  setEnemyAnimationState: (state: string) => void;
  setEnemyPickingIntroComplete: (value: boolean) => void;
  setShowCards: (value: boolean) => void;
}

export default function TurnRandomizer({
  isHost,
  lobbyCode,
  hostUsername,
  guestUsername,
  hostId,
  guestId,
  showRandomizer,
  playerPickingIntroComplete,
  enemyPickingIntroComplete,
  battleState,
  setRandomizationDone,
  setShowRandomizer,
  setShowGameStart,
  setGameStartText,
  setGameStarted,
  setIsMyTurn,
  setPlayerAnimationState,
  setPlayerPickingIntroComplete,
  setEnemyAnimationState,
  setEnemyPickingIntroComplete,
  setShowCards,
}: TurnRandomizerProps) {
  // State for randomization process
  const [randomizing, setRandomizing] = useState(false);
  // Local state to track current displayed name during randomization
  const [currentDisplayName, setCurrentDisplayName] = useState("");
  // Add ref for randomizing sound
  const randomizingSoundRef = useRef<HTMLAudioElement | null>(null);

  // Effect to play/stop the randomizing sound
  useEffect(() => {
    if (randomizing && randomizingSoundRef.current) {
      randomizingSoundRef.current.volume = 0.6;
      randomizingSoundRef.current.play().catch(err =>
        console.error("Error playing randomizing sound:", err)
      );
    } else if (!randomizing && randomizingSoundRef.current) {
      randomizingSoundRef.current.pause();
      randomizingSoundRef.current.currentTime = 0;
    }

    // Cleanup function
    return () => {
      if (randomizingSoundRef.current) {
        randomizingSoundRef.current.pause();
        randomizingSoundRef.current.currentTime = 0;
      }
    };
  }, [randomizing]);

  // Start guest randomization immediately when component mounts
  useEffect(() => {
    if (!isHost && !randomizing && showRandomizer) {
      pollForTurnSelection();
    }
  }, [isHost, randomizing, showRandomizer]);

  // Function to poll for turn selection when guest is waiting
  const pollForTurnSelection = async () => {
    if (!isHost && !randomizing) {
      setRandomizing(true);

      // Start the randomization animation for the guest
      let toggleInterval = 100; // Start fast (100ms)

      // Start with a random player
      let currentTurn = Math.random() < 0.5 ? hostUsername : guestUsername;

      // Set initial game start text and local display state
      setCurrentDisplayName(`${currentTurn} will go first!`);

      // Create an interval to show the alternating names
      const turnInterval = setInterval(() => {
        // Toggle between host and guest
        currentTurn = currentTurn === hostUsername ? guestUsername : hostUsername;

        // Update UI to show current selection
        const text = `${currentTurn} will go first!`;
        setCurrentDisplayName(text);

        // Check for the actual turn selection from the database
        checkForTurnSelection(turnInterval);
      }, toggleInterval);
    }
  };

  // Function to check the database for the actual turn selection
  const checkForTurnSelection = async (intervalToClear: NodeJS.Timeout): Promise<boolean> => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/session-state/${lobbyCode}`
      );

      if (response.data.success && response.data.data) {
        const sessionData = response.data.data;

        // Check if a turn has been set (randomization done by host)
        if (sessionData.current_turn) {
          clearInterval(intervalToClear);

          // Determine who goes first based on the ID
          const selectedPlayer = sessionData.current_turn === hostId ? hostUsername : guestUsername;
          const finalText = `${selectedPlayer} will go first!`;

          // Update UI
          setCurrentDisplayName(finalText);
          setGameStartText(finalText);

          // Update game state
          setRandomizationDone(true);
          setShowRandomizer(false);
          setShowGameStart(true);

          // Update turn state for guest
          const isPlayerFirst = sessionData.current_turn === (isHost ? hostId : guestId);
          setGameStarted(true);
          setIsMyTurn(isPlayerFirst);

          // Set initial animations
          if (isPlayerFirst) {
            setPlayerAnimationState("picking");
            setPlayerPickingIntroComplete(true);
            setEnemyAnimationState("idle");
          } else {
            setEnemyAnimationState("picking");
            setEnemyPickingIntroComplete(true);
            setPlayerAnimationState("idle");
          }

          // Show battle start animation for exactly 2 seconds
          setTimeout(() => {
            setShowGameStart(false);
            setShowCards(true);
          }, 2000);

          setRandomizing(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking turn selection:", error);
      return false;
    }
  };

  // Function to handle the randomizer button click
  const handleRandomizeTurn = async () => {
    if (randomizing) return;

    setRandomizing(true);

    // Visual randomization effect (alternating between host and guest)
    let duration = 3000; // 3 seconds of animation
    let toggleInterval = 100; // Start fast (100ms)
    let currentTime = 0;

    // Start with a random player
    let currentTurn = Math.random() < 0.5 ? hostUsername : guestUsername;

    // Set initial game start text and local display state
    setGameStartText(`${currentTurn} will go first!`);
    setCurrentDisplayName(`${currentTurn} will go first!`);

    // Create a div to show the alternating names
    const turnInterval = setInterval(() => {
      currentTime += toggleInterval;

      // Slow down the toggle as we approach the end
      if (currentTime > duration / 2) {
        toggleInterval = 200; // Slow down midway
      }
      if (currentTime > duration * 0.75) {
        toggleInterval = 300; // Slow down further
      }

      // Toggle between host and guest
      currentTurn = currentTurn === hostUsername ? guestUsername : hostUsername;

      // Update UI to show current selection
      const text = `${currentTurn} will go first!`;
      setGameStartText(text);
      setCurrentDisplayName(text);

      // End the animation after duration
      if (currentTime >= duration) {
        clearInterval(turnInterval);

        // Make a final decision - this ensures we don't get stuck on a rapidly changing value
        const finalSelection = currentTurn;
        const finalText = `${finalSelection} will go first!`;
        setGameStartText(finalText);
        setCurrentDisplayName(finalText);

        finalizeRandomization(finalSelection);
      }
    }, toggleInterval);
  };

  // Function to finalize the random selection
  const finalizeRandomization = async (selectedPlayer: string) => {
    try {
      // Use the ID instead of username
      const selectedPlayerId =
        selectedPlayer === hostUsername ? hostId : guestId;

      console.log(
        `Finalizing turn randomization: selected ${selectedPlayer} (ID: ${selectedPlayerId})`
      );

      // Set randomizationDone immediately to prevent further randomization attempts
      setRandomizationDone(true);

      // Hide the randomizer UI immediately, don't wait for the polling
      setShowRandomizer(false);

      // Show the final selection in the game start text
      setShowGameStart(true);

      // Update turn with player ID in battle_sessions
      const sessionResponse = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL
        }/api/gameplay/battle/update-session`,
        {
          lobby_code: lobbyCode,
          current_turn: selectedPlayerId, // Use ID instead of username
        }
      );

      // Get study material info and initialize rounds
      try {
        const battleSessionResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/session-with-material/${lobbyCode}`
        );

        if (
          battleSessionResponse.data.success &&
          battleSessionResponse.data.data &&
          battleSessionResponse.data.data.study_material_id
        ) {
          const studyMaterialId =
            battleSessionResponse.data.data.study_material_id;

          const studyMaterialResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL
            }/api/study-material/info/${studyMaterialId}`
          );

          if (
            studyMaterialResponse.data.success &&
            studyMaterialResponse.data.data &&
            studyMaterialResponse.data.data.total_items &&
            battleState?.session_uuid
          ) {
            const totalItems = studyMaterialResponse.data.data.total_items;

            // Initialize entry in battle_rounds table with session UUID from battleState
            await axios.post(
              `${import.meta.env.VITE_BACKEND_URL
              }/api/gameplay/battle/initialize-rounds`,
              {
                session_uuid: battleState.session_uuid,
                round_number: totalItems,
              }
            );

            console.log(
              `Initialized battle rounds with total_items: ${totalItems}`
            );

            // Initialize battle scores with session UUID from battleState
            await axios.post(
              `${import.meta.env.VITE_BACKEND_URL
              }/api/gameplay/battle/initialize-scores`,
              {
                session_uuid: battleState.session_uuid,
                host_health: 100,
                guest_health: 100,
              }
            );

            console.log(`Initialized battle scores with default health values`);
          }
        }
      } catch (error) {
        console.error("Error setting up battle rounds:", error);
      }

      // Optionally, we could extend our state to include who was selected to go first
      // This would let us start rendering things even before the polling catches up
      if (isHost) {
        const isPlayerFirst = selectedPlayer === hostUsername;
        // Setup initial game state based on who goes first
        setGameStarted(true);
        setIsMyTurn(isPlayerFirst);

        // Set initial animations
        if (isPlayerFirst) {
          setPlayerAnimationState("picking");
          setPlayerPickingIntroComplete(true);
          setEnemyAnimationState("idle");
        } else {
          setEnemyAnimationState("picking");
          setEnemyPickingIntroComplete(true);
          setPlayerAnimationState("idle");
        }

        // Show battle start animation for exactly 2 seconds
        setTimeout(() => {
          setShowGameStart(false);
          setShowCards(true);
        }, 2000);
      }

      setRandomizing(false);

      // The next polling cycle will detect the turn is set and proceed with the game
    } catch (error) {
      console.error("Error setting turn:", error);
      setRandomizing(false);
      // If there's an error, allow retrying
      setRandomizationDone(false);
    }
  };

  // If not showing the randomizer, return null
  if (!showRandomizer) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex flex-col items-center justify-center">
      {/* Audio for randomization sound */}
      <audio
        ref={randomizingSoundRef}
        src="/GameBattle/randomizing.mp3"
        preload="auto"
        loop
      />

      <div className="text-center">
        <h2 className="text-purple-300 text-4xl font-bold mb-8">
          Ready to Battle!
        </h2>

        {isHost ? (
          <p className="text-white text-xl mb-12">
            Both players have joined. Who will go first?
          </p>
        ) : (
          <p className="text-white text-xl mb-12">
            Host is determining who goes first...
          </p>
        )}

        {randomizing ? (
          <div className="mb-8">
            <div className="text-white text-3xl font-bold animate-pulse mb-4">
              Randomizing...
            </div>
            <div className="text-white text-4xl font-bold">
              {/* Display the current name during randomization */}
              {currentDisplayName}
            </div>
          </div>
        ) : isHost ? (
          <button
            onClick={handleRandomizeTurn}
            className="px-8 py-4 bg-purple-700 hover:bg-purple-600 text-white text-xl font-bold rounded-lg transition-colors"
          >
            Randomize First Turn
          </button>
        ) : (
          <div className="flex space-x-4 justify-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
