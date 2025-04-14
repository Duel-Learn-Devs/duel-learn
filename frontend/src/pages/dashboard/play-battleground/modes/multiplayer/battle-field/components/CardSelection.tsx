import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// Import the actual card images
import cardBackImage from "../../../../../../../assets/General/CardDesignBack.png";
import BasicCard from "/GameBattle/BasicCard.png"
import NormalCardQuickDraw from "/GameBattle/NormalCardQuickDraw.png";
import NormalCardTimeManipulation from "/GameBattle/NormalCardTimeManipulation.png"
import EpicCardAnswerShield from "/GameBattle/EpicCardAnswerShield.png";
import EpicCardRegeneration from "/GameBattle/EpicCardRegeneration.png"
import RareCardMindControl from "/GameBattle/RareCardMindControl.png"
import RareCardPoisonType from "/GameBattle/RareCardPoisonType.png"

// Define card types
interface Card {
    id: string;
    name: string;
    description: string;
    type: string;
    image?: string; // Added image property

}

export interface CardSelectionProps {
  isMyTurn: boolean;
  opponentName: string;
  playerName: string;
  onCardSelected: (cardId: string) => void;
  difficultyMode?: string | null;
}

/**
 * CardSelection component handles the card selection UI during the battle
 * with improved card persistence logic
 */
const CardSelection: React.FC<CardSelectionProps> = ({
    isMyTurn,
    opponentName,
    playerName,
    onCardSelected,
    difficultyMode = "average"
}) => {
    const [showBackCard, setShowBackCard] = useState(true);
    const [showCardOptions, setShowCardOptions] = useState(false);
    const [backCardExitComplete, setBackCardExitComplete] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);
    const [selectionTimer, setSelectionTimer] = useState(8); // 8 second timer
    const [timerActive, setTimerActive] = useState(false);

    // Card state management
    const [currentCards, setCurrentCards] = useState<Card[]>([]);
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    const [isFirstTurn, setIsFirstTurn] = useState(true);
    const [turnCount, setTurnCount] = useState(1);
    const [debugInfo, setDebugInfo] = useState<string>(""); // Debug info for easier troubleshooting

    // Add stats tracking for card probabilities - with improved tracking
    const [cardStats, setCardStats] = useState<{
        basic: number,
        normal: number,
        epic: number,
        rare: number,
        total: number,
        selections: {
            name: string,
            type: string
        }[]
    }>(() => {
        // Try to load card stats from sessionStorage
        const savedStats = sessionStorage.getItem('battle_card_stats');
        if (savedStats) {
            try {
                return JSON.parse(savedStats);
            } catch (e) {
                console.error("Error parsing saved card stats:", e);
            }
        }
        // Default initial state
        return {
            basic: 0,
            normal: 0,
            epic: 0,
            rare: 0,
            total: 0,
            selections: []
        };
    });

    // State for card blocking effect
    const [hasCardBlocking, setHasCardBlocking] = useState(false);
    const [blockedCardCount, setBlockedCardCount] = useState(0);
    const [visibleCardIndices, setVisibleCardIndices] = useState<number[]>([]);

    // State for mind control effect
    const [hasMindControl, setHasMindControl] = useState(false);
    const [mindControlActive, setMindControlActive] = useState(false);

    // Cards grouped by type for easier selection
    const cardsByType = {
        basic: [
            { id: "basic-1", name: "Basic Card", type: "Basic Card", description: "No effect", image: BasicCard }
        ],
        normal: [
            { id: "normal-1", name: "Time Manipulation", type: "Normal Power Card", description: "Reduce your opponent's answer time", image: NormalCardTimeManipulation },
            { id: "normal-2", name: "Quick Draw", type: "Normal Power Card", description: "Answer twice in a row without waiting for your opponent's turn", image: NormalCardQuickDraw }
        ],
        epic: [
            { id: "epic-1", name: "Answer Shield", type: "Epic Power Card", description: "Block one card used by your opponent", image: EpicCardAnswerShield },
            { id: "epic-2", name: "Regeneration", type: "Epic Power Card", description: "Gain +10 hp if the question is answered correctly", image: EpicCardRegeneration }
        ],
        rare: [
            { id: "rare-1", name: "Mind Control", type: "Rare Power Card", description: "Forces the opponent to answer the next question without any power-ups", image: RareCardMindControl },
            { id: "rare-2", name: "Poison Type", type: "Rare Power Card", description: "It gives the enemy a poison type effect that last 3 rounds", image: RareCardPoisonType }
        ]
    };

    // Probability distribution for each card type based on difficulty level
    const probabilityDistribution = {
        easy: {
            basic: 70,
            normal: { total: 30, distribution: { "Time Manipulation": 15, "Quick Draw": 15 } },
            epic: { total: 0, distribution: { "Answer Shield": 0, "Regeneration": 0 } },
            rare: { total: 0, distribution: { "Mind Control": 0, "Poison Type": 0 } }
        },
        average: {
            basic: 70,
            normal: { total: 20, distribution: { "Time Manipulation": 10, "Quick Draw": 10 } },
            epic: { total: 10, distribution: { "Answer Shield": 5, "Regeneration": 5 } },
            rare: { total: 0, distribution: { "Mind Control": 0, "Poison Type": 0 } }
        },
        hard: {
            basic: 70,
            normal: { total: 15, distribution: { "Time Manipulation": 8, "Quick Draw": 8 } },
            epic: { total: 10, distribution: { "Answer Shield": 5, "Regeneration": 5 } },
            rare: { total: 5, distribution: { "Mind Control": 2.5, "Poison Type": 2.5 } }
        }
    };

    // Choose a single card based on probability distribution
    const selectSingleCardByProbability = (difficulty: string): Card => {
        console.log(`Selecting card with difficulty: ${difficulty}`);

        // Extract just the first word (hard, easy, average) from strings like "Hard Mode"
        const difficultyWord = difficulty?.toLowerCase().split(' ')[0] || "average";

        // Map it to our expected keys
        let normalizedDifficulty: "easy" | "average" | "hard";
        if (difficultyWord.includes("easy")) normalizedDifficulty = "easy";
        else if (difficultyWord.includes("hard")) normalizedDifficulty = "hard";
        else normalizedDifficulty = "average"; // Default

        console.log(`Normalized difficulty: ${normalizedDifficulty}`);

        // Add debug information
        setDebugInfo(prev => prev + `\nSelecting card with difficulty: ${normalizedDifficulty}`);

        const dist = probabilityDistribution[normalizedDifficulty] || probabilityDistribution.average;

        // Log the probability distribution being used
        console.log(`Using probability distribution:`, JSON.stringify(dist));

        // Select a card based on probability
        const random = Math.random() * 100;
        console.log(`Random percentage: ${random}`);
        setDebugInfo(prev => prev + `\nRandom percentage: ${random.toFixed(2)}`);

        // Track the expected probability ranges for debugging
        const basicRange = [0, dist.basic];
        const normalRange = [dist.basic, dist.basic + dist.normal.total];
        const epicRange = [dist.basic + dist.normal.total, dist.basic + dist.normal.total + dist.epic.total];
        const rareRange = [dist.basic + dist.normal.total + dist.epic.total, 100];

        setDebugInfo(prev => prev + `\nProbability ranges:`);
        setDebugInfo(prev => prev + `\n  Basic: ${basicRange[0]}-${basicRange[1]}%`);
        setDebugInfo(prev => prev + `\n  Normal: ${normalRange[0]}-${normalRange[1]}%`);
        setDebugInfo(prev => prev + `\n  Epic: ${epicRange[0]}-${epicRange[1]}%`);
        setDebugInfo(prev => prev + `\n  Rare: ${rareRange[0]}-${rareRange[1]}%`);

        let selectedCard: Card;

        // Basic cards selection
        if (random < dist.basic) {
            console.log(`Selected basic card type (${dist.basic}%)`);
            setDebugInfo(prev => prev + `\nSelected basic card type (${dist.basic}%)`);
            selectedCard = cardsByType.basic[Math.floor(Math.random() * cardsByType.basic.length)];
            console.log("Basic card selected:", selectedCard);
            console.log("Card image property:", selectedCard.image);
        }
        // Normal cards selection
        else if (random < dist.basic + dist.normal.total) {
            console.log(`Selected normal card type (${dist.normal.total}%)`);
            setDebugInfo(prev => prev + `\nSelected normal card type (${dist.normal.total}%)`);

            // Helper function to select a weighted card
            const totalWeight = Object.values(dist.normal.distribution).reduce((sum, weight) => sum + weight, 0);
            let weightRandom = Math.random() * totalWeight;
            console.log(`Normal card weighted random: ${weightRandom}, total weight: ${totalWeight}`);

            selectedCard = cardsByType.normal[0]; // Default fallback
            for (const card of cardsByType.normal) {
                const cardName = card.name as keyof typeof dist.normal.distribution;
                const weight = dist.normal.distribution[cardName] || 0;
                console.log(`Checking card: ${cardName}, weight: ${weight}`);
                if (weightRandom < weight) {
                    console.log(`Selected normal card: ${cardName}`);
                    selectedCard = card;
                    break;
                }
                weightRandom -= weight;
            }
            console.log("Normal card selected:", selectedCard);
            console.log("Card image property:", selectedCard.image);
        }
        // Epic cards selection
        else if (random < dist.basic + dist.normal.total + dist.epic.total) {
            console.log(`Selected epic card type (${dist.epic.total}%)`);
            setDebugInfo(prev => prev + `\nSelected epic card type (${dist.epic.total}%)`);

            // Helper function to select a weighted card
            const totalWeight = Object.values(dist.epic.distribution).reduce((sum, weight) => sum + weight, 0);
            let weightRandom = Math.random() * totalWeight;
            console.log(`Epic card weighted random: ${weightRandom}, total weight: ${totalWeight}`);

            selectedCard = cardsByType.epic[0]; // Default fallback
            for (const card of cardsByType.epic) {
                const cardName = card.name as keyof typeof dist.epic.distribution;
                const weight = dist.epic.distribution[cardName] || 0;
                console.log(`Checking card: ${cardName}, weight: ${weight}`);
                if (weightRandom < weight) {
                    console.log(`Selected epic card: ${cardName}`);
                    selectedCard = card;
                    break;
                }
                weightRandom -= weight;
            }
            console.log("Epic card selected:", selectedCard);
            console.log("Card image property:", selectedCard.image);
        }
        // Rare cards selection
        else {
            console.log(`Selected rare card type (${dist.rare.total}%)`);
            setDebugInfo(prev => prev + `\nSelected rare card type (${dist.rare.total}%)`);

            // Helper function to select a weighted card
            const totalWeight = Object.values(dist.rare.distribution).reduce((sum, weight) => sum + weight, 0);
            let weightRandom = Math.random() * totalWeight;
            console.log(`Rare card weighted random: ${weightRandom}, total weight: ${totalWeight}`);

            selectedCard = cardsByType.rare[0]; // Default fallback
            for (const card of cardsByType.rare) {
                const cardName = card.name as keyof typeof dist.rare.distribution;
                const weight = dist.rare.distribution[cardName] || 0;
                console.log(`Checking card: ${cardName}, weight: ${weight}`);
                if (weightRandom < weight) {
                    console.log(`Selected rare card: ${cardName}`);
                    selectedCard = card;
                    break;
                }
                weightRandom -= weight;
            }
            console.log("Rare card selected:", selectedCard);
            console.log("Card image property:", selectedCard.image);
        }

        // Update card stats when we actually use a card
        const cardType = selectedCard.type.toLowerCase();
        let statType: "basic" | "normal" | "epic" | "rare" = "basic";

        if (cardType.includes("basic")) {
            statType = "basic";
        } else if (cardType.includes("normal")) {
            statType = "normal";
        } else if (cardType.includes("epic")) {
            statType = "epic";
        } else if (cardType.includes("rare")) {
            statType = "rare";
        }

        // Update the stats with the finalized card
        setCardStats(prev => {
            const newStats = {
                ...prev,
                [statType]: prev[statType] + 1,
                total: prev.total + 1,
                selections: [
                    ...prev.selections,
                    { name: selectedCard.name, type: selectedCard.type }
                ].slice(-20) // Keep only last 20 selections to avoid growing too large
            };

            // Save to sessionStorage
            sessionStorage.setItem('battle_card_stats', JSON.stringify(newStats));
            return newStats;
        });

        // Check if image is present before returning the card
        console.log(`Final card selected: ${selectedCard.name} (${selectedCard.type}) with image:`, selectedCard.image);
        setDebugInfo(prev => prev + `\nFinal card selected: ${selectedCard.name} (${selectedCard.type})`);
        return selectedCard;
    };

    // Generate three random cards - making sure they're all different when possible
    const generateThreeRandomCards = (difficulty: string): Card[] => {
        console.log("Generating three random cards");
        setDebugInfo("Generating three random cards with " + difficulty + " difficulty");

        // First card is completely random
        const firstCard = selectSingleCardByProbability(difficulty);
        console.log("First card generated:", firstCard.name, "with image:", firstCard.image);

        // For the second card, try up to 3 times to get a different card
        let secondCard: Card;
        let attempts = 0;
        do {
            secondCard = selectSingleCardByProbability(difficulty);
            attempts++;
        } while (secondCard.id === firstCard.id && attempts < 3);
        console.log("Second card generated:", secondCard.name, "with image:", secondCard.image);

        // For the third card, try up to 3 times to get a different card from both previous cards
        let thirdCard: Card;
        attempts = 0;
        do {
            thirdCard = selectSingleCardByProbability(difficulty);
            attempts++;
        } while ((thirdCard.id === firstCard.id || thirdCard.id === secondCard.id) && attempts < 3);
        console.log("Third card generated:", thirdCard.name, "with image:", thirdCard.image);

        const generatedCards = [firstCard, secondCard, thirdCard];
        console.log("All generated cards:", generatedCards);

        return generatedCards;
    };

    // Handle timer timeout - automatically select "no-card"
    const handleTimeExpired = () => {
        console.log("Time expired, no card selected");

        // Show a brief on-screen message
        const messageElement = document.createElement('div');
        messageElement.className = 'fixed inset-0 flex items-center justify-center z-50';
        messageElement.innerHTML = `

            <div class="bg-purple-900/80 text-white py-4 px-8 rounded-lg text-xl font-bold shadow-lg border-2 border-purple-500/50">
                No card selected! Proceeding to question...
            </div>
        `;
    document.body.appendChild(messageElement);

    // Remove the message after 1.2 seconds
    setTimeout(() => {
      document.body.removeChild(messageElement);

      // No card selected, use a special "no-card" ID
      onCardSelected("no-card-selected");
      setShowCardOptions(false);
      setTimerActive(false);
    }, 1200);
  };

  // Timer effect
  useEffect(() => {
    if (timerActive && selectionTimer > 0) {
      const timer = setTimeout(() => {
        setSelectionTimer(selectionTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timerActive && selectionTimer === 0) {
      // Time's up
      handleTimeExpired();
    }
  }, [timerActive, selectionTimer]);

  useEffect(() => {
    if (isMyTurn) {
      // Reset animation states
      setShowBackCard(true);
      setShowCardOptions(false);
      setBackCardExitComplete(false);
      setAnimationComplete(false);
      setSelectionTimer(8); // Reset timer to 8 seconds
      setTimerActive(false); // Don't start timer yet

      // Generate cards for this turn
      const cardsForThisTurn = generateCardsForTurn(
        difficultyMode || "average"
      );
      setSelectedCards(cardsForThisTurn);

      // Start the card animation sequence
      const flipTimer = setTimeout(() => {
        setShowBackCard(false);
        setTimeout(() => {
            document.body.removeChild(messageElement);

            // No card selected, use a special "no-card" ID
            onCardSelected("no-card-selected");
            setShowCardOptions(false);
            setTimerActive(false);
        }, 1200);
    };

    // Timer effect
    useEffect(() => {
        if (timerActive && selectionTimer > 0) {
            const timer = setTimeout(() => {
                setSelectionTimer(selectionTimer - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (timerActive && selectionTimer === 0) {
            // Time's up
            handleTimeExpired();
        }
    }, [timerActive, selectionTimer]);

    // Initialize cards for the first turn
    useEffect(() => {
        try {
            // Helper function to reattach image references to cards loaded from storage
            const reattachImageReferences = (cards: Card[]): Card[] => {
                return cards.map(card => {
                    // Find the matching card in the cardsByType object to get the correct image reference
                    for (const type in cardsByType) {
                        const cardType = type as keyof typeof cardsByType;
                        const matchingCard = cardsByType[cardType].find(c => c.id === card.id);
                        if (matchingCard) {
                            console.log(`Reattaching image for ${card.name}:`, matchingCard.image);
                            return { ...card, image: matchingCard.image };
                        }
                    }
                    console.log(`No matching card found for ${card.name}`);
                    return card;
                });
            };

            // First try to load state from sessionStorage
            const savedCards = sessionStorage.getItem('battle_cards');
            const savedLastIndex = sessionStorage.getItem('battle_last_selected_index');
            const savedTurnCount = sessionStorage.getItem('battle_turn_count');
            const savedIsFirstTurn = sessionStorage.getItem('battle_is_first_turn');

            console.log("Loading session storage data:");
            console.log("Saved cards:", savedCards);
            console.log("Saved last index:", savedLastIndex);
            console.log("Saved turn count:", savedTurnCount);
            console.log("Saved is first turn:", savedIsFirstTurn);

            if (savedCards && isMyTurn) {
                // Restore saved state if it exists
                let parsedCards = JSON.parse(savedCards);
                console.log("Parsed cards from storage (before reattaching):", parsedCards);

                // Reattach image references that were lost during storage
                parsedCards = reattachImageReferences(parsedCards);
                console.log("Cards after reattaching images:", parsedCards);

                parsedCards.forEach((card: Card, idx: number) => {
                    console.log(`Card ${idx} (${card.name}):`, card.image ? "Has image" : "No image");
                });

                setCurrentCards(parsedCards);

                if (savedLastIndex) {
                    const parsedIndex = parseInt(savedLastIndex);
                    setLastSelectedIndex(parsedIndex);

                    // If we have a last selected index and it's not the first turn,
                    // replace that card with a new random card
                    if (savedIsFirstTurn === 'false') {
                        const updatedCards = [...parsedCards];
                        const newCard = selectSingleCardByProbability(difficultyMode || "average");
                        console.log("Generated replacement card:", newCard);
                        console.log("Replacement card image:", newCard.image);

                        updatedCards[parsedIndex] = newCard;
                        console.log("Updated cards after replacement:", updatedCards);

                        setCurrentCards(updatedCards);

                        // Save to session storage - no need to reattach images as they'll be reattached on load
                        console.log("Saving updated cards to session storage");
                        sessionStorage.setItem('battle_cards', JSON.stringify(updatedCards));

                        setDebugInfo(`Restored and replaced card at index ${parsedIndex} with new random card`);
                    } else {
                        setDebugInfo("Restored cards from session storage");
                    }
                }

                setTurnCount(savedTurnCount ? parseInt(savedTurnCount) : 1);
                setIsFirstTurn(savedIsFirstTurn === 'true');
            } else if (isMyTurn) {
                // Generate new cards if no saved state
                const initialCards = generateThreeRandomCards(difficultyMode || "average");
                console.log("Initial cards generated:", initialCards);
                console.log("Saving initial cards to session storage");

                setCurrentCards(initialCards);
                setDebugInfo("Initial setup: Generated 3 random cards for first turn");

                // Save to session storage
                sessionStorage.setItem('battle_cards', JSON.stringify(initialCards));

                // Check what was actually saved
                const savedCardsCheck = sessionStorage.getItem('battle_cards');
                console.log("Verification of saved cards:", savedCardsCheck);
                if (savedCardsCheck) {
                    const parsedCheck = JSON.parse(savedCardsCheck);
                    console.log("Parsed verification cards:", parsedCheck);
                    parsedCheck.forEach((card: Card, idx: number) => {
                        console.log(`Verification Card ${idx} (${card.name}):`, card.image ? "Has image" : "No image");
                    });
                }

                sessionStorage.setItem('battle_is_first_turn', 'true');
                sessionStorage.setItem('battle_turn_count', '1');
            }
        } catch (error) {
            console.error("Error initializing cards:", error);
            // Fallback to generating new cards
            if (isMyTurn) {
                const initialCards = generateThreeRandomCards(difficultyMode || "average");
                setCurrentCards(initialCards);
                setDebugInfo("Error restoring state, generated new cards");
            }
        }
    }, [isMyTurn, difficultyMode]);

    // Handle turn transitions - this is the key improvement that ensures proper card persistence
    useEffect(() => {
        if (isMyTurn) {
            // Reset animation states
            setShowBackCard(true);
            setShowCardOptions(false);
            setBackCardExitComplete(false);
            setAnimationComplete(false);
            setSelectionTimer(8); // Reset timer to 8 seconds
            setTimerActive(false); // Don't start timer yet

            // Start the card animation sequence
            const flipTimer = setTimeout(() => {
                setShowBackCard(false);
                setTimeout(() => {
                    setAnimationComplete(true);
                }, 500);
            }, 1000);

            return () => clearTimeout(flipTimer);
        } else {
            // Reset state when it's not my turn
            setShowBackCard(false);
            setShowCardOptions(false);
            setBackCardExitComplete(false);
            setAnimationComplete(false);
            setTimerActive(false);
        }
    }, [isMyTurn]);

    // Handle when back card exit animation is complete
    const handleBackCardExitComplete = () => {
        setBackCardExitComplete(true);
        setShowCardOptions(true);
        setTimerActive(true); // Start the selection timer
    };

    // Handle card selection
    const handleCardSelect = (cardId: string, index: number) => {
        // Stop the timer
        setTimerActive(false);

        // Store the selected index for the next turn
        setLastSelectedIndex(index);

        // Save selected index to sessionStorage
        sessionStorage.setItem('battle_last_selected_index', index.toString());

        // Log the selection
        setDebugInfo(prev => prev + `\nCard selected: ${currentCards[index]?.name} at index ${index}`);

        // No longer the first turn
        setIsFirstTurn(false);
        sessionStorage.setItem('battle_is_first_turn', 'false');

        // Pass the selected card to the parent component
        onCardSelected(cardId);
        setShowCardOptions(false);
    };

    // Get the background color based on card type
    const getCardBackground = (type: string) => {
        switch (type) {
            case "Basic Card":
                return "bg-gray-700";
            case "Normal Power Card":
                return "bg-blue-700";
            case "Epic Power Card":
                return "bg-purple-700";
            case "Rare Power Card":
                return "bg-yellow-700";
            default:
                return "bg-gray-700";
        }
    };

    // Check for card blocking effects
    useEffect(() => {
        if (isMyTurn) {
            const checkForCardBlocking = async () => {
                try {
                    // Get session UUID and player type from sessionStorage
                    const sessionUuid = sessionStorage.getItem('battle_session_uuid');
                    const isHost = sessionStorage.getItem('is_host') === 'true';
                    const playerType = isHost ? 'host' : 'guest';

                    if (!sessionUuid) return;

                    // Check if this player has any card blocking effects active
                    const response = await axios.get(
                        `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/card-blocking-effects/${sessionUuid}/${playerType}`
                    );

                    if (response.data.success && response.data.data) {
                        setHasCardBlocking(response.data.data.has_blocking_effect);
                        setBlockedCardCount(response.data.data.cards_blocked);

                        // If there's a blocking effect, randomly select which cards to hide
                        if (response.data.data.has_blocking_effect) {
                            const numCardsToShow = 3 - response.data.data.cards_blocked;

                            // Create an array of available indices (0, 1, 2)
                            const availableIndices = [0, 1, 2];

                            // Shuffle the indices
                            for (let i = availableIndices.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
                            }

                            // Take only the number of cards we want to show
                            const indicesToShow = availableIndices.slice(0, numCardsToShow);
                            setVisibleCardIndices(indicesToShow);

                            // Show notification about blocked cards
                            const messageElement = document.createElement('div');
                            messageElement.className = 'fixed inset-0 flex items-center justify-center z-50';
                            messageElement.innerHTML = `

                                <div class="bg-purple-900/80 text-white py-4 px-8 rounded-lg text-xl font-bold shadow-lg border-2 border-purple-500/50">
                                    Answer Shield: ${response.data.data.cards_blocked} of your cards have been blocked!
                                </div>
                            `;
              document.body.appendChild(messageElement);

              // Remove the message after 2 seconds
              setTimeout(() => {
                document.body.removeChild(messageElement);
              }, 2000);

              // Mark the blocking effect as used
              if (
                response.data.data.effects &&
                response.data.data.effects.length > 0
              ) {
                const effectToConsume = response.data.data.effects[0];

                // Consume the effect
                await axios.post(
                  `${
                    import.meta.env.VITE_BACKEND_URL
                  }/api/gameplay/battle/consume-card-effect`,
                  {
                    session_uuid: sessionUuid,
                    player_type: playerType,
                    effect_type: effectToConsume.type,
                  }
                );

                console.log(`Card blocking effect consumed`);
              }
            } else {
              // No blocking, show all cards
              setVisibleCardIndices([0, 1, 2]);
            }
          }
        } catch (error) {
          console.error("Error checking for card blocking effects:", error);
          // Default to showing all cards on error
          setVisibleCardIndices([0, 1, 2]);
        }
    }, [isMyTurn]);

    // Check for mind control effects
    useEffect(() => {
        if (isMyTurn) {
            const checkForMindControl = async () => {
                try {
                    // Get session UUID and player type from sessionStorage
                    const sessionUuid = sessionStorage.getItem('battle_session_uuid');
                    const isHost = sessionStorage.getItem('is_host') === 'true';
                    const playerType = isHost ? 'host' : 'guest';

                    if (!sessionUuid) return;

                    // Check if this player has any mind control effects active
                    const response = await axios.get(
                        `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/mind-control-effects/${sessionUuid}/${playerType}`
                    );

                    if (response.data.success && response.data.data) {
                        setHasMindControl(response.data.data.has_mind_control_effect);

                        // If there's a mind control effect active, the player can't select cards
                        if (response.data.data.has_mind_control_effect) {
                            setMindControlActive(true);

                            // Show notification about mind control
                            const messageElement = document.createElement('div');
                            messageElement.className = 'fixed inset-0 flex items-center justify-center z-50';
                            messageElement.innerHTML = `

                                <div class="bg-purple-900/80 text-white py-4 px-8 rounded-lg text-xl font-bold shadow-lg border-2 border-purple-500/50">
                                    Mind Control: You cannot select a card this turn!
                                </div>
                            `;
              document.body.appendChild(messageElement);

              // Remove the message after 2 seconds
              setTimeout(() => {
                document.body.removeChild(messageElement);
              }, 2000);

              // Mark the mind control effect as used
              if (
                response.data.data.effects &&
                response.data.data.effects.length > 0
              ) {
                const effectToConsume = response.data.data.effects[0];

                // Consume the effect
                await axios.post(
                  `${
                    import.meta.env.VITE_BACKEND_URL
                  }/api/gameplay/battle/consume-card-effect`,
                  {
                    session_uuid: sessionUuid,
                    player_type: playerType,
                    effect_type: effectToConsume.type,
                  }
                );

                console.log(`Mind control effect consumed`);

                // Auto-select "no-card" after a delay to simulate no card selection
                setTimeout(() => {
                  onCardSelected("no-card-selected");
                  setShowCardOptions(false);
                  setTimerActive(false);
                }, 3000);
              }
            }
          }
        } catch (error) {
          console.error("Error checking for mind control effects:", error);
        }
    }, [isMyTurn, onCardSelected]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-120">
            {/* Enhanced debug panel - shows more detailed probability info */}
            {/* {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-0 right-0 bg-gray-800/90 p-2 text-white text-xs max-w-md opacity-90 overflow-y-auto max-h-[400px]">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold">Card Selection Debug</h3>
                        <div className="flex gap-2">
                            <span>Difficulty: <span className="font-semibold">{difficultyMode}</span></span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-1 mb-2 text-center text-[10px]">
                        <div className="bg-gray-700 p-1 rounded">
                            <p className="font-bold">Basic</p>
                            <p>{cardStats.basic}</p>
                            <p>{cardStats.total > 0 ? ((cardStats.basic / cardStats.total) * 100).toFixed(1) + '%' : '0%'}</p>
                            <p className="text-gray-300 text-[8px]">
                                {difficultyMode?.toLowerCase().includes("easy") ? "70%" :
                                    difficultyMode?.toLowerCase().includes("hard") ? "70%" : "70%"}
                            </p>
                        </div>
                        <div className="bg-blue-700 p-1 rounded">
                            <p className="font-bold">Normal</p>
                            <p>{cardStats.normal}</p>
                            <p>{cardStats.total > 0 ? ((cardStats.normal / cardStats.total) * 100).toFixed(1) + '%' : '0%'}</p>
                            <p className="text-gray-300 text-[8px]">
                                {difficultyMode?.toLowerCase().includes("easy") ? "30%" :
                                    difficultyMode?.toLowerCase().includes("hard") ? "15%" : "20%"}
                            </p>
                        </div>
                        <div className="bg-purple-700 p-1 rounded">
                            <p className="font-bold">Epic</p>
                            <p>{cardStats.epic}</p>
                            <p>{cardStats.total > 0 ? ((cardStats.epic / cardStats.total) * 100).toFixed(1) + '%' : '0%'}</p>
                            <p className="text-gray-300 text-[8px]">
                                {difficultyMode?.toLowerCase().includes("easy") ? "0%" :
                                    difficultyMode?.toLowerCase().includes("hard") ? "10%" : "10%"}
                            </p>
                        </div>
                        <div className="bg-yellow-700 p-1 rounded">
                            <p className="font-bold">Rare</p>
                            <p>{cardStats.rare}</p>
                            <p>{cardStats.total > 0 ? ((cardStats.rare / cardStats.total) * 100).toFixed(1) + '%' : '0%'}</p>
                            <p className="text-gray-300 text-[8px]">
                                {difficultyMode?.toLowerCase().includes("easy") ? "0%" :
                                    difficultyMode?.toLowerCase().includes("hard") ? "5%" : "0%"}
                            </p>
                        </div>
                        <div className="bg-gray-600 p-1 rounded">
                            <p className="font-bold">Total</p>
                            <p>{cardStats.total}</p>
                            <p>100%</p>
                        </div>
                    </div>

                    <div className="mb-1">
                        <p>Turn: {turnCount}</p>
                        <p>Last Selected: {lastSelectedIndex !== null ? lastSelectedIndex : 'None'}</p>
                        <p>First Turn: {isFirstTurn ? 'Yes' : 'No'}</p>
                    </div>

                    {cardStats.selections.length > 0 && (
                        <div className="mb-2">
                            <p className="font-bold text-[9px]">Recent Card Selections:</p>
                            <div className="bg-gray-900/60 p-1 rounded text-[8px] grid grid-cols-2 gap-x-2">
                                {cardStats.selections.slice(-10).map((card, i) => (
                                    <div key={i} className={`${card.type.toLowerCase().includes("basic") ? "text-gray-300" :
                                        card.type.toLowerCase().includes("normal") ? "text-blue-300" :
                                            card.type.toLowerCase().includes("epic") ? "text-purple-300" :
                                                "text-yellow-300"
                                        }`}>
                                        {card.name} ({card.type.split(' ')[0]})
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-900 p-1 rounded text-[9px] font-mono max-h-[120px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{debugInfo}</pre>
                    </div>

                    <button
                        className="mt-1 bg-red-600 text-white text-[10px] px-2 py-1 rounded"
                        onClick={() => {
                            setCardStats({
                                basic: 0,
                                normal: 0,
                                epic: 0,
                                rare: 0,
                                total: 0,
                                selections: []
                            });
                            sessionStorage.removeItem('battle_card_stats');
                            setDebugInfo("Stats cleared");
                        }}
                    >
                        Clear Stats
                    </button>
                </div>
            )} */}

            {/* Only show turn indicator when it's NOT the player's turn */}
            {!isMyTurn && (
                <div className="absolute inset-0 flex items-center top-[100px] justify-center z-20">
                    <div className="text-white text-3xl font-bold animate-pulse">
                        {`${opponentName}'s turn`}
                    </div>
                </div>
            )}

            {isMyTurn && (
                <>
                    <AnimatePresence onExitComplete={handleBackCardExitComplete}>
                        {showBackCard && (
                            <motion.div
                                className="w-[280px] h-[380px] overflow-hidden shadow-lg shadow-purple-500/30"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                                exit={{ rotateY: 90, opacity: 0 }}
                                transition={{
                                    duration: 0.7,
                                    exit: { duration: 0.5 }
                                }}
                            >
                                <img
                                    src={cardBackImage}
                                    alt="Card Back"
                                    className="w-full h-full object-contain"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Timer display when it's the player's turn and options are shown */}
                    {showCardOptions && backCardExitComplete && (
                        <div className="absolute top-[100px] text-white text-2xl font-bold">
                            Time remaining: <span className={selectionTimer <= 3 ? "text-red-500" : "text-white"}>{selectionTimer}s</span>
                        </div>
                    )}

                    <AnimatePresence>
                        {showCardOptions && backCardExitComplete && !mindControlActive && (
                            <div className="flex gap-8">
                                {currentCards.map((card, index) => {
                                    // Only render this card if it's in the visibleCardIndices array
                                    if (!visibleCardIndices.includes(index) && hasCardBlocking) {
                                        return null; // Skip this card if it's blocked
                                    }

                                    return (
                                        <motion.div
                                            key={card.id + "-" + index} // Add index to key to ensure uniqueness when the same card appears twice
                                            className={`w-[280px] h-[380px] rounded-xl overflow-hidden cursor-pointer shadow-lg relative ${card.image ? '' : getCardBackground(card.type)}`}
                                            initial={{ opacity: 0, y: 20, rotateY: -90 }}
                                            animate={{ opacity: 1, y: 0, rotateY: 0 }}
                                            transition={{
                                                duration: 0.4,
                                                delay: index * 0.15,
                                                ease: "easeOut"
                                            }}
                                            onClick={() => handleCardSelect(card.id, index)}
                                            whileHover={{
                                                y: -10,
                                                scale: 1.05,
                                                transition: { duration: 0.2 }
                                            }}
                                        >
                                            {card.image ? (
                                                <img
                                                    src={card.image}
                                                    alt={card.name}
                                                    className="w-full h-full object-fill"
                                                />
                                            ) : (
                                                <div className={`flex flex-col h-full p-6 text-white ${getCardBackground(card.type)}`}>
                                                    <div className="text-2xl font-bold mb-4">{card.name}</div>
                                                    <div className="text-lg italic mb-6">{card.type}</div>
                                                    <div className="border-t border-white/20 my-4 pt-4">
                                                        <p className="text-xl">{card.description}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </AnimatePresence>

                    {showCardOptions && backCardExitComplete && (
                        <div className="absolute bottom-[120px] text-white text-xl font-semibold">
                            Choose a card to use in this round

                        </div>
                        <div className="mt-auto flex justify-end">
                          <div className="text-xs italic opacity-60">
                            Card ID: {card.id}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>

          {showCardOptions && backCardExitComplete && (
            <div className="absolute bottom-[170px] text-white text-xl font-semibold">
              Choose a card to use in this round
            </div>
          )}

          {/* Show information about mind control if active */}
          {mindControlActive && showCardOptions && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-yellow-600 text-white py-4 px-8 rounded-lg text-xl font-bold shadow-lg border-2 border-yellow-500/50">
                Mind Control Active: Cannot select a card!
              </div>
              <div className="text-white text-lg">
                Opponent used Mind Control - proceeding without a card...
              </div>
            </div>
          )}
        </>
      )}

      {/* Show notification if cards are blocked */}
      {hasCardBlocking && blockedCardCount > 0 && isMyTurn && (
        <div className="absolute top-[100px] text-red-400 text-xl font-semibold">
          {blockedCardCount === 1
            ? "Your opponent used Answer Shield: 1 card has been blocked!"
            : `Your opponent used Answer Shield: ${blockedCardCount} cards have been blocked!`}
        </div>
      )}

      {/* Show notification if mind control is active */}
      {hasMindControl && mindControlActive && isMyTurn && (
        <div className="absolute top-[100px] text-red-400 text-xl font-semibold">
          Mind Control: Your opponent has prevented you from using cards this
          turn!
        </div>
      )}
    </div>
  );
};

export default CardSelection;
