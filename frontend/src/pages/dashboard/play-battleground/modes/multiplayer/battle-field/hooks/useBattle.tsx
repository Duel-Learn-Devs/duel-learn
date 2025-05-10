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
  isMyTurn: boolean;
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
  setRandomizationDone: (value: boolean) => void;
  setEarlyEnd: (value: boolean) => void;
  setShowEarlyLeaveModal: (value: boolean) => void;
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
}: BattleHookProps) {
  // State to track if we're in the process of ending the battle
  const [isEndingBattle, setIsEndingBattle] = useState<boolean>(false);

  // References for polling intervals
  const pollingIntervalRef = useRef<number | null>(null);
  const battleEndingPollingRef = useRef<number | null>(null);

  // =========== BATTLE LEAVER ============

  // Handle leaving the battle and updating the database
  const handleLeaveBattle = async (
    reason: string,
    currentUserId: string
  ): Promise<void> => {
    try {
      setIsEndingBattle(true);

      if (battleState?.session_uuid) {
        // End the battle first
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/end`,
          {
            session_uuid: battleState.session_uuid,
            lobby_code: lobbyCode,
            battle_end_reason: reason,
            early_leaver_id: currentUserId,
            winner_id: isHost ? guestId : hostId,
          }
        );

        // Then reset the win streak to 0 for the user who left
        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/win-streak`,
          {
            firebase_uid: currentUserId,
            is_winner: false, // Leaver is considered a loser
            protect_streak: false, // No protection for leaving early
          }
        );

        // Also deduct 100 XP as penalty for leaving early
        await axios.put(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/gameplay/battle/deduct-leaver-xp`,
          {
            firebase_uid: currentUserId,
          }
        );
      }

      // Force navigation to dashboard
      window.location.replace("/dashboard/home");
    } catch (error) {
      console.error("Error in handleLeaveBattle:", error);
      // Force navigation anyway on error
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
              `Opponent left the game. Showing early leave modal. Winner ID: ${endingData.winner_id}, Current user ID: ${currentUserId}`
            );

            // Instead of showing the normal victory modal, show the early leave modal
            setShowEarlyLeaveModal(true);

            // Set earlyEnd flag for the session report
            setEarlyEnd(true);

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
    setEarlyEnd,
    setShowEarlyLeaveModal,
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
              }

              // CRITICAL FIX: If current_turn is set, update randomizationDone for BOTH host and guest
              if (sessionState.current_turn && !randomizationDone) {
                console.log("Turn has been set, marking randomization as done");

                // Mark randomization as done
                setRandomizationDone(true);

                // For guest player, we need to initialize the game state
                if (!isHost) {
                  console.log("Guest - setting up game state");
                  setGameStarted(true);

                  // Determine if it's the guest's turn
                  const isGuestTurn =
                    sessionState.current_turn === currentUserId;
                  setIsMyTurn(isGuestTurn);

                  // Show game start animation
                  const startText = isGuestTurn
                    ? "You will go first!"
                    : `${sessionState.host_username || "Host"} will go first!`;
                  setGameStartText(startText);
                  setShowGameStart(true);

                  // Setup animations based on turn
                  if (isGuestTurn) {
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
                    setShowCards(isGuestTurn); // Only show cards if it's the guest's turn
                  }, 2000);
                }
              }

              // Check for battle round if battle has already started and turn has been set
              if (sessionState.battle_started && sessionState.current_turn) {
                try {
                  // If we have a session UUID, we can check for battle round data
                  if (sessionState.session_uuid) {
                    // Fetch battle round data
                    const { data } = await axios.get(
                      `${
                        import.meta.env.VITE_BACKEND_URL
                      }/api/gameplay/battle/round/${sessionState.session_uuid}`
                    );

                    if (data.success && data.data) {
                      const roundData = data.data;

                      // Update the current turn information in UI
                      console.log("Round data:", roundData);
                      console.log(
                        "Current player ID:",
                        currentUserId,
                        "Current turn:",
                        sessionState.current_turn
                      );

                      // Check if it's this player's turn
                      const isCurrentPlayerTurn =
                        sessionState.current_turn === currentUserId;

                      // Only update if the turn has changed
                      if (isCurrentPlayerTurn !== isMyTurn) {
                        console.log(
                          `Turn changed: ${isMyTurn} → ${isCurrentPlayerTurn}`
                        );
                        setIsMyTurn(isCurrentPlayerTurn);
                      }

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
  }, [
    lobbyCode,
    hostId,
    guestId,
    isHost,
    gameStarted,
    randomizationDone,
    isMyTurn,
    currentUserId,
  ]);

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
