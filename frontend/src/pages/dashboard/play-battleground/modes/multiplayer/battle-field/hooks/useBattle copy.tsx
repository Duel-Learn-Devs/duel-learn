import { useState, useEffect, useRef } from "react";
import axios from "axios";

interface BattleHookProps {
  lobbyCode: string;
  hostId: string;
  guestId: string;
  isHost: boolean;
  battleState: any;
  currentUserId: string;
  opponentName: string;
  gameStarted: boolean;
  randomizationDone: boolean;
  showVictoryModal: boolean;
  showGameStart: boolean;
  setWaitingForPlayer: (value: boolean) => void;
  setShowRandomizer: (value: boolean) => void;
  setBattleState: (state: any) => void;
  setGameStarted: (value: boolean) => void;
  setShowGameStart: (value: boolean) => void;
  setGameStartText: (text: string) => void;
  setIsMyTurn: (value: boolean) => void;
  setPlayerAnimationState: (state: string) => void;
  setPlayerPickingIntroComplete: (value: boolean) => void;
  setEnemyAnimationState: (state: string) => void;
  setEnemyPickingIntroComplete: (value: boolean) => void;
  setShowCards: (value: boolean) => void;
  setShowVictoryModal: (value: boolean) => void;
  setVictoryMessage: (message: string) => void;
}

export function useBattle({
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
}: BattleHookProps) {
  // State to track if we're in the process of ending the battle
  const [isEndingBattle, setIsEndingBattle] = useState<boolean>(false);

  // References for polling intervals
  const pollingIntervalRef = useRef<number | null>(null);
  const battleEndingPollingRef = useRef<number | null>(null);

  // =========== BATTLE LEAVER ============

  // Handle leaving the battle and updating the database
  const handleLeaveBattle = async (
    battle_end_reason: string = "Left The Game",
    early_leaver_id?: string
  ) => {
    // Prevent multiple calls
    if (isEndingBattle) {
      console.log("Already ending battle, ignoring duplicate call");
      return;
    }

    try {
      setIsEndingBattle(true);
      console.log("Ending battle due to user leaving");

      // Flag to skip additional confirmation dialogs
      window.onbeforeunload = null;

      // Debug battle state before sending request
      console.log("Battle state when leaving:", {
        lobbyCode,
        sessionUuid: battleState?.session_uuid,
        sessionId: battleState?.ID,
        hostId,
        guestId,
        isHost,
        winnerId: isHost ? guestId : hostId,
        battle_end_reason,
        early_leaver_id,
      });

      if (!battleState?.session_uuid && !battleState?.ID) {
        console.error(
          "No session identifiers found! Will try using lobby code only."
        );
      }

      // Create the payload with session_uuid and also include session_id as backup
      const payload = {
        lobby_code: lobbyCode,
        winner_id: isHost ? guestId : hostId, // Opponent wins if player leaves
        battle_end_reason,
        session_uuid: battleState?.session_uuid,
        session_id: battleState?.ID, // Include numeric ID as fallback
        early_leaver_id, // Include the ID of the player who left early
      };

      console.log("Sending battle end request with payload:", payload);

      // End the battle with appropriate status
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/end`,
        payload
      );

      console.log("Battle end response:", response.data);

      // Wait for the request to complete with a longer delay to ensure it propagates
      console.log("Waiting to ensure request propagates...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Done waiting, proceeding to navigation");

      // Force navigation to dashboard AFTER the request completes
      // Use replace instead of href to prevent history entry
      window.location.replace("/dashboard/home");
    } catch (error: any) {
      // Add type annotation to fix linter error
      console.error("Error ending battle:", error);
      console.error(
        "Error details:",
        error.response?.data || "No response data"
      );

      // Remove beforeunload handler to prevent additional confirmation
      window.onbeforeunload = null;

      // Try alternative approach if first attempt failed
      try {
        console.log("First attempt failed, trying alternative approach...");

        // Try direct update with lobby_code only if we have it
        if (lobbyCode) {
          console.log("Using lobby_code only approach");

          const fallbackPayload = {
            lobby_code: lobbyCode,
            winner_id: isHost ? guestId : hostId,
            battle_end_reason,
            early_leaver_id,
          };

          const fallbackResponse = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/end`,
            fallbackPayload
          );

          console.log("Fallback battle end response:", fallbackResponse.data);

          // Wait to ensure request processes
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (fallbackError) {
        console.error("Even fallback approach failed:", fallbackError);
      }

      // Add a delay even on error to ensure any partial processing completes
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Still redirect even if error occurs - use replace to prevent history entry
      window.location.replace("/dashboard/home");
    }
  };

  // =========== BATTLE NAVIGATION HANDLER ============

  // Setup event listeners for page navigation and refresh
  useEffect(() => {
    // Don't set up event listeners if victory modal is shown
    if (showVictoryModal) {
      // Remove any existing listeners
      window.onbeforeunload = null;
      return;
    }

    // Flag to track if the user is intentionally leaving
    let isIntentionallyLeaving = false;

    // Handle page reload or tab close
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Only show confirmation dialog if not already intentionally leaving
      // and not already ending battle
      if (!isIntentionallyLeaving && !isEndingBattle) {
        event.preventDefault();
        event.returnValue =
          "Are you sure you want to leave the battle? Your progress will be lost and the battle will end.";

        // Set a flag in sessionStorage to indicate user confirmed reload
        // This will be checked on page load to handle the reload case
        sessionStorage.setItem("battle_reload_confirmed", "true");
        sessionStorage.setItem("battle_lobby_code", lobbyCode || "");
        sessionStorage.setItem("battle_is_host", isHost ? "true" : "false");
        sessionStorage.setItem("battle_host_id", hostId || "");
        sessionStorage.setItem("battle_guest_id", guestId || "");

        return event.returnValue;
      }
    };

    // Handle browser back button and URL changes
    const handlePopState = async (event: PopStateEvent) => {
      // Only handle if not already leaving intentionally or ending battle
      if (!isIntentionallyLeaving && !isEndingBattle) {
        // Prevent the navigation first
        event.preventDefault();
        window.history.pushState(null, "", window.location.pathname);

        // Show confirmation dialog
        const confirmLeave = window.confirm(
          "Are you sure you want to leave the battle? Your progress will be lost and the battle will end."
        );

        if (confirmLeave) {
          console.log("User confirmed leaving battle via popstate");
          isIntentionallyLeaving = true;

          // Remove the beforeunload handler to prevent additional confirmation dialog
          window.removeEventListener("beforeunload", handleBeforeUnload);
          window.onbeforeunload = null;

          // Show the loading overlay
          setIsEndingBattle(true);

          try {
            // Wait for the leave battle function to complete
            await handleLeaveBattle("Left The Game", currentUserId);

            // The handleLeaveBattle function already handles navigation
          } catch (err) {
            console.error(
              "Error in handleLeaveBattle called from popstate:",
              err
            );
            // Force redirect even if error occurs
            window.location.replace("/dashboard/home");
          }
        }
      } else {
        console.log("Ignoring popstate event - already leaving:", {
          isIntentionallyLeaving,
          isEndingBattle,
        });
      }
    };

    // Handle direct URL changes
    const handleURLChange = async () => {
      // Only handle if not already leaving intentionally or ending battle
      if (!isIntentionallyLeaving && !isEndingBattle) {
        const currentPath = window.location.pathname;
        const battlePath = `/dashboard/pvp-battle/${lobbyCode}`;

        if (currentPath !== battlePath) {
          console.log(`URL changed from ${battlePath} to ${currentPath}`);

          // Force back to the battle path first to prevent immediate navigation
          window.history.pushState(null, "", battlePath);

          // User is trying to navigate away
          const confirmLeave = window.confirm(
            "Are you sure you want to leave the battle? Your progress will be lost and the battle will end."
          );

          if (confirmLeave) {
            console.log("User confirmed leaving battle via URL change");
            isIntentionallyLeaving = true;

            // Remove the beforeunload handler to prevent additional confirmation dialog
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.onbeforeunload = null;

            // Show the loading overlay
            setIsEndingBattle(true);

            try {
              // Wait for the leave battle function to complete
              await handleLeaveBattle("Left The Game", currentUserId);
            } catch (err) {
              console.error(
                "Error in handleLeaveBattle called from URL change:",
                err
              );
              // Force redirect even if error occurs
              window.location.replace("/dashboard/home");
            }
          } else {
            // User cancelled, navigate back to battle
            window.history.pushState(null, "", "/pvp-battle");
          }
        }
      } else {
        console.log("Ignoring URL change event - already leaving:", {
          isIntentionallyLeaving,
          isEndingBattle,
        });
      }
    };

    // Special handler for actual navigation away (after confirmation)
    const handleUnload = () => {
      // Check if this is a reload case where we've already stored the data
      const reloadConfirmed =
        sessionStorage.getItem("battle_reload_confirmed") === "true";

      // Only send the request if user hasn't confirmed through another handler
      // and we're not already in the process of ending the battle
      // and this is not a reload we're already handling
      if (
        !isIntentionallyLeaving &&
        !isEndingBattle &&
        !reloadConfirmed &&
        battleState &&
        (battleState.session_uuid || battleState.ID)
      ) {
        try {
          // Use synchronous approach for unload event
          // This is a fallback in case the user closes the browser without confirmation
          const xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/end`,
            false
          ); // Synchronous request
          xhr.setRequestHeader(
            "Content-Type",
            "application/json;charset=UTF-8"
          );

          // Create the payload - include both session_uuid and session_id
          const payload = JSON.stringify({
            lobby_code: lobbyCode,
            winner_id: isHost ? guestId : hostId,
            battle_end_reason: "Left The Game",
            session_uuid: battleState.session_uuid,
            session_id: battleState.ID, // Include numeric ID as fallback
          });

          console.log("Sending sync XHR before unload with payload:", payload);
          xhr.send(payload);

          // Log the response (though this might not be visible in all browsers during unload)
          console.log("XHR status:", xhr.status, xhr.statusText);
        } catch (e) {
          console.error("Error in sync XHR during unload:", e);
        }
      }
    };

    // Register event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handleURLChange);

    // Push initial state to prevent back button on first click
    window.history.pushState(null, "", window.location.pathname);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handleURLChange);
    };
  }, [
    lobbyCode,
    isHost,
    hostId,
    guestId,
    battleState,
    isEndingBattle,
    showVictoryModal,
  ]);

  // =========== BATTLE ENDING POLL ============

  // Effect for polling battle endings
  useEffect(() => {
    const checkBattleEnding = async () => {
      try {
        // Skip if we have no session identifier
        if (!battleState) return;

        let endpoint = "";

        // Determine which endpoint to use based on available identifiers
        if (battleState.session_uuid) {
          endpoint = `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/end-status/${battleState.session_uuid}`;
          console.log(
            `Checking battle end status using UUID: ${battleState.session_uuid}`
          );
        } else if (battleState.ID) {
          // If no UUID but we have ID, use that
          endpoint = `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/end-status-by-id/${battleState.ID}`;
          console.log(`Checking battle end status using ID: ${battleState.ID}`);
        } else if (lobbyCode) {
          // Last resort - use lobby code
          endpoint = `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/end-status-by-lobby/${lobbyCode}`;
          console.log(
            `Checking battle end status using lobby code: ${lobbyCode}`
          );
        } else {
          console.log("No identifiers available to check battle ending");
          return;
        }

        // Make the request
        const response = await axios.get(endpoint);
        console.log("Battle end status response:", response.data);

        if (response.data.success && response.data.data) {
          const endingData = response.data.data;

          // If battle has ended and current player is NOT the one who left
          if (
            endingData.battle_end_reason === "Left The Game" &&
            endingData.winner_id === currentUserId
          ) {
            console.log(
              `Opponent left the game. Showing victory modal. Winner ID: ${endingData.winner_id}, Current user ID: ${currentUserId}`
            );
            setVictoryMessage(`${opponentName} left the game. You won!`);
            setShowVictoryModal(true);

            // Clear polling intervals
            if (battleEndingPollingRef.current) {
              clearInterval(battleEndingPollingRef.current);
            }
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          }
        }
      } catch (error) {
        console.error("Error checking battle ending:", error);
      }
    };

    // Start polling for battle endings
    battleEndingPollingRef.current = window.setInterval(
      checkBattleEnding,
      2000
    );

    // Cleanup
    return () => {
      if (battleEndingPollingRef.current) {
        clearInterval(battleEndingPollingRef.current);
      }
    };
  }, [
    battleState?.session_uuid,
    battleState?.ID,
    currentUserId,
    opponentName,
    lobbyCode,
    battleState,
  ]);

  // =========== BATTLE STATE POLL ============

  // Check for both players and battle start with dynamic polling
  useEffect(() => {
    // Function to check the battle status
    const checkBattleStatus = async () => {
      try {
        if (lobbyCode) {
          console.log(`Polling battle session state for lobby: ${lobbyCode}`);

          const response = await axios.get(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/gameplay/battle/session-state/${lobbyCode}`
          );

          if (response.data.success) {
            const sessionState = response.data.data;

            // Log the session state for debugging
            console.log("Battle session state:", {
              sessionUuid: sessionState.session_uuid,
              isActive: sessionState.is_active,
              hostInBattle: sessionState.host_in_battle,
              guestInBattle: sessionState.guest_in_battle,
              battleStarted: sessionState.battle_started,
              currentTurn: sessionState.current_turn,
            });

            setBattleState({
              current_turn: sessionState.current_turn,
              round_number: 1, // Default to 1 for now
              total_rounds: sessionState.total_rounds || 30,
              host_card: null,
              guest_card: null,
              host_score: 0,
              guest_score: 0,
              host_health: 100,
              guest_health: 100,
              is_active: sessionState.is_active === 1,
              winner_id: null,
              battle_end_reason: null,
              host_in_battle: sessionState.host_in_battle === 1,
              guest_in_battle: sessionState.guess_in_battle === 1, // Note the field name is misspelled in DB
              battle_started: sessionState.battle_started === 1,
              host_username: sessionState.host_username,
              guest_username: sessionState.guest_username,
              ID: sessionState.ID,
              session_uuid: sessionState.session_uuid,
            });

            // Update waiting state based on both players being in battle
            if (
              sessionState.host_in_battle === 1 &&
              sessionState.guest_in_battle === 1
            ) {
              setWaitingForPlayer(false);

              // Show randomizer to host if battle started but no current_turn set
              if (
                sessionState.battle_started === 1 &&
                !sessionState.current_turn &&
                isHost &&
                !randomizationDone
              ) {
                setShowRandomizer(true);
              } else if (
                sessionState.battle_started === 1 &&
                !sessionState.current_turn &&
                !randomizationDone
              ) {
                // Guest just waits for host to randomize
                console.log("Waiting for host to determine who goes first...");
              } else if (
                sessionState.battle_started === 1 &&
                sessionState.current_turn
              ) {
                // Battle has started and turns are established - fetch battle round data
                try {
                  const roundResponse = await axios.get(
                    `${
                      import.meta.env.VITE_BACKEND_URL
                    }/api/gameplay/battle/round/${sessionState.session_uuid}`
                  );

                  if (roundResponse.data.success && roundResponse.data.data) {
                    const roundData = roundResponse.data.data;

                    // Update the battleState with round data
                    setBattleState((prevState: any) => {
                      if (!prevState) return null;

                      return {
                        ...prevState,
                        host_card: roundData.host_card,
                        guest_card: roundData.guest_card,
                        round_number: roundData.round_number,
                      };
                    });

                    // Determine if it's the current player's turn
                    const isCurrentPlayerTurn =
                      sessionState.current_turn === currentUserId;

                    // Enable game UI
                    if (!gameStarted) {
                      setGameStarted(true);
                    }

                    // Set turn state
                    setIsMyTurn(isCurrentPlayerTurn);

                    // Update UI based on turn
                    if (isCurrentPlayerTurn) {
                      setShowCards(true);
                      setPlayerAnimationState("picking");
                      setPlayerPickingIntroComplete(true);
                      setEnemyAnimationState("idle");
                      setEnemyPickingIntroComplete(false);
                    } else {
                      setShowCards(false);
                      setPlayerAnimationState("idle");
                      setPlayerPickingIntroComplete(false);
                      setEnemyAnimationState("picking");
                      setEnemyPickingIntroComplete(true);
                    }
                  }
                } catch (error) {
                  console.error("Error fetching battle round data:", error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking battle status:", error);
      }
    };

    // Check immediately
    checkBattleStatus();

    // Dynamic polling interval based on game state
    // Use a longer interval once game has started to reduce server load
    const intervalTime = gameStarted ? 5000 : 2000; // 5 seconds if game started, 2 seconds otherwise

    console.log(
      `Setting polling interval to ${intervalTime}ms (game started: ${gameStarted})`
    );

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Set new interval
    pollingIntervalRef.current = window.setInterval(
      checkBattleStatus,
      intervalTime
    );

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [lobbyCode, hostId, guestId, isHost, gameStarted, randomizationDone]);

  // Check for battle reload flag when component mounts
  useEffect(() => {
    const reloadConfirmed =
      sessionStorage.getItem("battle_reload_confirmed") === "true";

    if (reloadConfirmed) {
      console.log("Detected reload after confirmation, ending battle...");

      // Get battle data from sessionStorage
      const storedLobbyCode = sessionStorage.getItem("battle_lobby_code");
      const storedIsHost = sessionStorage.getItem("battle_is_host") === "true";
      const storedHostId = sessionStorage.getItem("battle_host_id");
      const storedGuestId = sessionStorage.getItem("battle_guest_id");

      if (storedLobbyCode) {
        // Show loading state
        setIsEndingBattle(true);

        // Send request to end battle
        const payload = {
          lobby_code: storedLobbyCode,
          winner_id: storedIsHost ? storedGuestId : storedHostId,
          battle_end_reason: "Left The Game",
        };

        console.log("Sending battle end request after reload:", payload);

        axios
          .post(
            `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/end`,
            payload
          )
          .then((response) => {
            console.log(
              "Battle ended successfully after reload:",
              response.data
            );
          })
          .catch((error) => {
            console.error("Error ending battle after reload:", error);
          })
          .finally(() => {
            // Clear the reload flags
            sessionStorage.removeItem("battle_reload_confirmed");
            sessionStorage.removeItem("battle_lobby_code");
            sessionStorage.removeItem("battle_is_host");
            sessionStorage.removeItem("battle_host_id");
            sessionStorage.removeItem("battle_guest_id");

            // Redirect to dashboard
            window.location.replace("/dashboard/home");
          });
      }
    }
  }, []);

  return {
    handleLeaveBattle,
    isEndingBattle,
    setIsEndingBattle,
  };
}