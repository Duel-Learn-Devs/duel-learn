import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// Import the actual card images
import cardBackImage from "/General/CardDesignBack.png";
import BasicCard from "/GameBattle/BasicCard.png";
import NormalCardQuickDraw from "/GameBattle/NormalCardQuickDraw.png";
import NormalCardTimeManipulation from "/GameBattle/NormalCardTimeManipulation.png";
import EpicCardAnswerShield from "/GameBattle/EpicCardAnswerShield.png";
import EpicCardRegeneration from "/GameBattle/EpicCardRegeneration.png";
import RareCardMindControl from "/GameBattle/RareCardMindControl.png";
import RareCardPoisonType from "/GameBattle/RareCardPoisonType.png";

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
  soundEffectsVolume?: number; // Add sound effect volume prop
  answerShieldDamagedSoundRef?: React.RefObject<HTMLAudioElement>; // Add prop for Answer Shield Damaged sound
  masterVolume?: number; // Add master volume prop
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
  difficultyMode = "average",
  soundEffectsVolume = 0.7, // Default to 0.7 if not provided
  answerShieldDamagedSoundRef,
  masterVolume = 1.0,
}) => {
  const [showBackCard, setShowBackCard] = useState(true);
  const [showCardOptions, setShowCardOptions] = useState(false);
  const [backCardExitComplete, setBackCardExitComplete] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [selectionTimer, setSelectionTimer] = useState(8); // 8 second timer
  const [timerActive, setTimerActive] = useState(false);

  // Audio refs for card sounds
  const flipCardSoundRef = useRef<HTMLAudioElement | null>(null);
  const shuffleCardsSoundRef = useRef<HTMLAudioElement | null>(null);
  const selectedCardSoundRef = useRef<HTMLAudioElement | null>(null);
  const noSelectedCardSoundRef = useRef<HTMLAudioElement | null>(null);

  // Card state management
  const [currentCards, setCurrentCards] = useState<Card[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const [isFirstTurn, setIsFirstTurn] = useState(true);
  const [turnCount, setTurnCount] = useState(1);
  const [debugInfo, setDebugInfo] = useState<string>(""); // Debug info for easier troubleshooting

  // Add stats tracking for card probabilities - with improved tracking
  const [cardStats, setCardStats] = useState<{
    basic: number;
    normal: number;
    epic: number;
    rare: number;
    total: number;
    selections: {
      name: string;
      type: string;
    }[];
  }>(() => {
    // Try to load card stats from sessionStorage
    const savedStats = sessionStorage.getItem("battle_card_stats");
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
      selections: [],
    };
  });

  // Clear all card stats on new game
  useEffect(() => {
    if (isMyTurn && isFirstTurn && turnCount === 1) {
      // Clear card stats when starting a new game
      setCardStats({
        basic: 0,
        normal: 0,
        epic: 0,
        rare: 0,
        total: 0,
        selections: []
      });
      sessionStorage.removeItem('battle_card_stats');
      setDebugInfo("New game started - stats reset");
    }
  }, [isMyTurn, isFirstTurn, turnCount]);

  // Function to clear all card stats
  const clearAllCardStats = () => {
    setCardStats({
      basic: 0,
      normal: 0,
      epic: 0,
      rare: 0,
      total: 0,
      selections: []
    });
    sessionStorage.removeItem('battle_card_stats');
    setDebugInfo("Stats cleared manually");
  };

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
      {
        id: "basic-1",
        name: "Basic Card",
        type: "Basic Card",
        description: "No effect",
        image: BasicCard,
      },
    ],
    normal: [
      {
        id: "normal-1",
        name: "Time Manipulation",
        type: "Normal Power Card",
        description: "Reduce your opponent's answer time",
        image: NormalCardTimeManipulation,
      },
      {
        id: "normal-2",
        name: "Quick Draw",
        type: "Normal Power Card",
        description:
          "Answer twice in a row without waiting for your opponent's turn",
        image: NormalCardQuickDraw,
      },
    ],
    epic: [
      {
        id: "epic-1",
        name: "Answer Shield",
        type: "Epic Power Card",
        description: "Block one card used by your opponent",
        image: EpicCardAnswerShield,
      },
      {
        id: "epic-2",
        name: "Regeneration",
        type: "Epic Power Card",
        description: "Gain +10 hp if the question is answered correctly",
        image: EpicCardRegeneration,
      },
    ],
    rare: [
      {
        id: "rare-1",
        name: "Mind Control",
        type: "Rare Power Card",
        description:
          "Forces the opponent to answer the next question without any power-ups",
        image: RareCardMindControl,
      },
      {
        id: "rare-2",
        name: "Poison Type",
        type: "Rare Power Card",
        description:
          "It gives the enemy a poison type effect that lasts 3 turns (counting both players' turns)",
        image: RareCardPoisonType,
      },
    ],
  };

  // Probability distribution for each card type based on difficulty level
  const probabilityDistribution = {
    easy: {
      basic: 70,
      normal: {
        total: 30,
        distribution: { "Time Manipulation": 15, "Quick Draw": 15 },
      },
      epic: { total: 0, distribution: { "Answer Shield": 0, Regeneration: 0 } },
      rare: { total: 0, distribution: { "Mind Control": 0, "Poison Type": 0 } },
    },
    average: {
      basic: 70,
      normal: {
        total: 20,
        distribution: { "Time Manipulation": 10, "Quick Draw": 10 },
      },
      epic: {
        total: 10,
        distribution: { "Answer Shield": 5, Regeneration: 5 },
      },
      rare: { total: 0, distribution: { "Mind Control": 0, "Poison Type": 0 } },
    },
    hard: {
      basic: 70,
      normal: {
        total: 15,
        distribution: { "Time Manipulation": 8, "Quick Draw": 8 },
      },
      epic: {
        total: 10,
        distribution: { "Answer Shield": 5, Regeneration: 5 },
      },
      rare: {
        total: 5,
        distribution: { "Mind Control": 2.5, "Poison Type": 2.5 },
      },
    },
  };

  // Choose a single card based on probability distribution
  const selectSingleCardByProbability = (difficulty: string): Card => {
    console.log(`Selecting card with difficulty: ${difficulty}`);

    // Extract just the first word (hard, easy, average) from strings like "Hard Mode"
    const difficultyWord = difficulty?.toLowerCase().split(" ")[0] || "average";

    // Map it to our expected keys
    let normalizedDifficulty: "easy" | "average" | "hard";
    if (difficultyWord.includes("easy")) normalizedDifficulty = "easy";
    else if (difficultyWord.includes("hard")) normalizedDifficulty = "hard";
    else normalizedDifficulty = "average"; // Default

    console.log(`Normalized difficulty: ${normalizedDifficulty}`);

    // Add debug information
    setDebugInfo(
      (prev) =>
        prev + `\nSelecting card with difficulty: ${normalizedDifficulty}`
    );

    const dist =
      probabilityDistribution[normalizedDifficulty] ||
      probabilityDistribution.average;

    // Log the probability distribution being used
    console.log(`Using probability distribution:`, JSON.stringify(dist));

    // Select a card based on probability
    const random = Math.random() * 100;
    console.log(`Random percentage: ${random}`);
    setDebugInfo((prev) => prev + `\nRandom percentage: ${random.toFixed(2)}`);

    // Track the expected probability ranges for debugging
    const basicRange = [0, dist.basic];
    const normalRange = [dist.basic, dist.basic + dist.normal.total];
    const epicRange = [
      dist.basic + dist.normal.total,
      dist.basic + dist.normal.total + dist.epic.total,
    ];
    const rareRange = [dist.basic + dist.normal.total + dist.epic.total, 100];

    setDebugInfo((prev) => prev + `\nProbability ranges:`);
    setDebugInfo(
      (prev) => prev + `\n  Basic: ${basicRange[0]}-${basicRange[1]}%`
    );
    setDebugInfo(
      (prev) => prev + `\n  Normal: ${normalRange[0]}-${normalRange[1]}%`
    );
    setDebugInfo((prev) => prev + `\n  Epic: ${epicRange[0]}-${epicRange[1]}%`);
    setDebugInfo((prev) => prev + `\n  Rare: ${rareRange[0]}-${rareRange[1]}%`);

    let selectedCard: Card = {
      id: "basic-1",
      name: "Basic Card",
      type: "Basic Card",
      description: "No effect",
      image: BasicCard,
    };

    // Basic cards selection
    if (random < dist.basic) {
      console.log(`Selected basic card type (${dist.basic}%)`);
      setDebugInfo(
        (prev) => prev + `\nSelected basic card type (${dist.basic}%)`
      );
      selectedCard =
        cardsByType.basic[Math.floor(Math.random() * cardsByType.basic.length)];
      console.log("Basic card selected:", selectedCard);
      console.log("Card image property:", selectedCard.image);
    }
    // Normal cards selection
    else if (random < dist.basic + dist.normal.total) {
      console.log(`Selected normal card type (${dist.normal.total}%)`);
      setDebugInfo(
        (prev) => prev + `\nSelected normal card type (${dist.normal.total}%)`
      );

      // Helper function to select a weighted card
      const totalWeight = Object.values(dist.normal.distribution).reduce(
        (sum, weight) => sum + weight,
        0
      );
      let weightRandom = Math.random() * totalWeight;
      console.log(
        `Normal card weighted random: ${weightRandom}, total weight: ${totalWeight}`
      );

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
      setDebugInfo(
        (prev) => prev + `\nSelected epic card type (${dist.epic.total}%)`
      );

      // Helper function to select a weighted card
      const totalWeight = Object.values(dist.epic.distribution).reduce(
        (sum, weight) => sum + weight,
        0
      );
      let weightRandom = Math.random() * totalWeight;
      console.log(
        `Epic card weighted random: ${weightRandom}, total weight: ${totalWeight}`
      );

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
      setDebugInfo(
        (prev) => prev + `\nSelected rare card type (${dist.rare.total}%)`
      );

      // Helper function to select a weighted card
      const totalWeight = Object.values(dist.rare.distribution).reduce(
        (sum, weight) => sum + weight,
        0
      );
      let weightRandom = Math.random() * totalWeight;
      console.log(
        `Rare card weighted random: ${weightRandom}, total weight: ${totalWeight}`
      );

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
    setCardStats((prev) => {
      const newStats = {
        ...prev,
        [statType]: prev[statType] + 1,
        total: prev.total + 1,
        selections: [
          ...prev.selections,
          { name: selectedCard.name, type: selectedCard.type },
        ].slice(-20), // Keep only last 20 selections to avoid growing too large
      };

      // Save to sessionStorage
      sessionStorage.setItem("battle_card_stats", JSON.stringify(newStats));
      return newStats;
    });

    // Before returning the card, ensure it has an image
    if (!selectedCard.image) {
      console.warn(
        `Selected card ${selectedCard.name} has no image, applying fallback`
      );
      // Find the matching card type to get a default image
      if (selectedCard.type.toLowerCase().includes("basic")) {
        selectedCard.image = BasicCard;
      } else if (selectedCard.type.toLowerCase().includes("normal")) {
        // Choose one of the normal card images
        selectedCard.image = selectedCard.name.includes("Time")
          ? NormalCardTimeManipulation
          : NormalCardQuickDraw;
      } else if (selectedCard.type.toLowerCase().includes("epic")) {
        // Choose one of the epic card images
        selectedCard.image = selectedCard.name.includes("Shield")
          ? EpicCardAnswerShield
          : EpicCardRegeneration;
      } else if (selectedCard.type.toLowerCase().includes("rare")) {
        // Choose one of the rare card images
        selectedCard.image = selectedCard.name.includes("Mind")
          ? RareCardMindControl
          : RareCardPoisonType;
      } else {
        // Last resort fallback
        selectedCard.image = cardBackImage;
      }
    }

    // Check if image is present before returning the card
    console.log(
      `Final card selected: ${selectedCard.name} (${selectedCard.type}) with image:`,
      selectedCard.image
    );
    setDebugInfo(
      (prev) =>
        prev +
        `\nFinal card selected: ${selectedCard.name} (${selectedCard.type})`
    );
    return selectedCard;
  };

  // Generate three random cards - making sure they're all different when possible
  const generateThreeRandomCards = (difficulty: string): Card[] => {
    console.log("Generating three random cards");
    setDebugInfo(
      "Generating three random cards with " + difficulty + " difficulty"
    );

    // First card is completely random
    const firstCard = selectSingleCardByProbability(difficulty);
    console.log(
      "First card generated:",
      firstCard.name,
      "with image:",
      firstCard.image
    );

    // Ensure first card has an image
    const safeFirstCard = firstCard.image
      ? firstCard
      : {
        ...firstCard,
        image: cardBackImage, // Fallback image
      };

    // For the second card, try up to 3 times to get a different card
    let secondCard: Card;
    let attempts = 0;
    do {
      secondCard = selectSingleCardByProbability(difficulty);
      attempts++;
    } while (secondCard.id === safeFirstCard.id && attempts < 3);
    console.log(
      "Second card generated:",
      secondCard.name,
      "with image:",
      secondCard.image
    );

    // Ensure second card has an image
    const safeSecondCard = secondCard.image
      ? secondCard
      : {
        ...secondCard,
        image: cardBackImage, // Fallback image
      };

    // For the third card, try up to 3 times to get a different card from both previous cards
    let thirdCard: Card;
    attempts = 0;
    do {
      thirdCard = selectSingleCardByProbability(difficulty);
      attempts++;
    } while (
      (thirdCard.id === safeFirstCard.id ||
        thirdCard.id === safeSecondCard.id) &&
      attempts < 3
    );
    console.log(
      "Third card generated:",
      thirdCard.name,
      "with image:",
      thirdCard.image
    );

    // Ensure third card has an image
    const safeThirdCard = thirdCard.image
      ? thirdCard
      : {
        ...thirdCard,
        image: cardBackImage, // Fallback image
      };

    const generatedCards = [safeFirstCard, safeSecondCard, safeThirdCard];
    console.log("All generated cards:", generatedCards);

    return generatedCards;
  };

  // Handle timer timeout - automatically select "no-card"
  const handleTimeExpired = () => {
    console.log("Time expired, no card selected");

    // Play no card selected sound
    if (noSelectedCardSoundRef.current) {
      noSelectedCardSoundRef.current.currentTime = 0;
      noSelectedCardSoundRef.current.volume = soundEffectsVolume;
      noSelectedCardSoundRef
        .current
        .play()
        .catch(err => console.error("Error playing no selected card sound:", err));
    }

    // Show a brief on-screen message
    const messageElement = document.createElement("div");
    messageElement.className =
      "fixed inset-0 flex items-center justify-center z-50";
    messageElement.innerHTML = `
            <div class="bg-gray-900/80 text-white py-4 px-8 rounded-lg text-xl font-bold shadow-lg border-2 border-gray-500/50 animate-pulse-border">
                Cards Locked! Your opponent used Mind Control...
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

  // Initialize cards for the first turn
  useEffect(() => {
    try {
      // Helper function to reattach image references to cards loaded from storage
      const reattachImageReferences = (cards: Card[]): Card[] => {
        return cards.map((card) => {
          // If the card already has an image, leave it as is
          if (card.image) {
            return card;
          }

          // Otherwise, try to find a matching card in the cardsByType
          for (const type in cardsByType) {
            const cardType = type as keyof typeof cardsByType;
            const matchingCard = cardsByType[cardType].find(
              (c) => c.id === card.id
            );
            if (matchingCard && matchingCard.image) {
              return { ...card, image: matchingCard.image };
            }
          }

          // If no match found, return with default image
          return { ...card, image: cardBackImage };
        });
      };

      // First try to load state from sessionStorage
      const savedCards = sessionStorage.getItem("battle_cards");
      const savedLastIndex = sessionStorage.getItem(
        "battle_last_selected_index"
      );
      const savedTurnCount = sessionStorage.getItem("battle_turn_count");
      const savedIsFirstTurn = sessionStorage.getItem("battle_is_first_turn");

      console.log("Loading session storage data:");
      console.log("Saved cards:", savedCards);
      console.log("Saved last index:", savedLastIndex);
      console.log("Saved turn count:", savedTurnCount);
      console.log("Saved is first turn:", savedIsFirstTurn);

      if (savedCards && isMyTurn) {
        // Restore saved state if it exists
        let parsedCards = JSON.parse(savedCards);
        console.log(
          "Parsed cards from storage (before reattaching):",
          parsedCards
        );

        // Reattach image references that were lost during storage
        parsedCards = reattachImageReferences(parsedCards);
        console.log("Cards after reattaching images:", parsedCards);

        parsedCards.forEach((card: Card, idx: number) => {
          console.log(
            `Card ${idx} (${card.name}):`,
            card.image ? "Has image" : "No image"
          );
        });

        setCurrentCards(parsedCards);

        if (savedLastIndex) {
          const parsedIndex = parseInt(savedLastIndex);
          setLastSelectedIndex(parsedIndex);

          // If we have a last selected index and it's not the first turn,
          // replace that card with a new random card
          if (savedIsFirstTurn === "false") {
            const updatedCards = [...parsedCards];
            const newCard = selectSingleCardByProbability(
              difficultyMode || "average"
            );
            console.log("Generated replacement card:", newCard);
            console.log("Replacement card image:", newCard.image);

            updatedCards[parsedIndex] = newCard;
            console.log("Updated cards after replacement:", updatedCards);

            setCurrentCards(updatedCards);

            // Save to session storage - no need to reattach images as they'll be reattached on load
            console.log("Saving updated cards to session storage");
            sessionStorage.setItem(
              "battle_cards",
              JSON.stringify(updatedCards)
            );

            setDebugInfo(
              `Restored and replaced card at index ${parsedIndex} with new random card`
            );
          } else {
            setDebugInfo("Restored cards from session storage");
          }
        }

        setTurnCount(savedTurnCount ? parseInt(savedTurnCount) : 1);
        setIsFirstTurn(savedIsFirstTurn === "true");
      } else if (isMyTurn) {
        // Generate new cards if no saved state
        const initialCards = generateThreeRandomCards(
          difficultyMode || "average"
        );
        console.log("Initial cards generated:", initialCards);
        console.log("Saving initial cards to session storage");

        setCurrentCards(initialCards);
        setDebugInfo("Initial setup: Generated 3 random cards for first turn");

        // Save to session storage
        sessionStorage.setItem("battle_cards", JSON.stringify(initialCards));

        // Check what was actually saved
        const savedCardsCheck = sessionStorage.getItem("battle_cards");
        console.log("Verification of saved cards:", savedCardsCheck);
        if (savedCardsCheck) {
          const parsedCheck = JSON.parse(savedCardsCheck);
          console.log("Parsed verification cards:", parsedCheck);
          parsedCheck.forEach((card: Card, idx: number) => {
            console.log(
              `Verification Card ${idx} (${card.name}):`,
              card.image ? "Has image" : "No image"
            );
          });
        }

        sessionStorage.setItem("battle_is_first_turn", "true");
        sessionStorage.setItem("battle_turn_count", "1");
      }
    } catch (error) {
      console.error("Error initializing cards:", error);
      // Fallback to generating new cards with safe defaults
      if (isMyTurn) {
        const initialCards = Array(3)
          .fill(null)
          .map(() => ({
            id: "basic-1",
            name: "Basic Card",
            type: "Basic Card",
            description: "No effect",
            image: BasicCard,
          }));
        setCurrentCards(initialCards);
        setDebugInfo("Error restoring state, generated fallback cards");
      }
    }
  }, [isMyTurn, difficultyMode]);

  // Update sound effects when volume changes
  useEffect(() => {
    if (flipCardSoundRef.current) {
      flipCardSoundRef.current.volume = soundEffectsVolume;
    }
    if (shuffleCardsSoundRef.current) {
      shuffleCardsSoundRef.current.volume = soundEffectsVolume;
    }
    if (selectedCardSoundRef.current) {
      selectedCardSoundRef.current.volume = soundEffectsVolume;
    }
    if (noSelectedCardSoundRef.current) {
      noSelectedCardSoundRef.current.volume = soundEffectsVolume;
    }
  }, [soundEffectsVolume]);

  // Handle turn transitions - this is the key improvement that ensures proper card persistence
  useEffect(() => {
    if (isMyTurn) {
      // Reset animation states with delay to prevent overlap
      setShowBackCard(true);
      setShowCardOptions(false);
      setBackCardExitComplete(false);
      setAnimationComplete(false);
      setSelectionTimer(8); // Reset timer to 8 seconds
      setTimerActive(false); // Don't start timer yet

      // Start the card animation sequence with a delay for smoother transitions
      setTimeout(() => {
        // Play flip card sound 1 second before the card flips
        if (flipCardSoundRef.current) {
          flipCardSoundRef.current.currentTime = 0;
          flipCardSoundRef.current.play().catch(err =>
            console.error("Error playing flip card sound:", err)
          );
        }

        const flipTimer = setTimeout(() => {
          setShowBackCard(false);
          setTimeout(() => {
            setAnimationComplete(true);
          }, 500);
        }, 1000);

        return () => clearTimeout(flipTimer);
      }, 200);
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
    // Add a small delay before showing cards to ensure animations don't overlap
    setTimeout(() => {
      setBackCardExitComplete(true);
      setShowCardOptions(true);
      setTimerActive(true); // Start the selection timer

      // Play shuffle cards sound immediately when showing the 3 cards
      if (shuffleCardsSoundRef.current) {
        shuffleCardsSoundRef.current.currentTime = 0;
        shuffleCardsSoundRef.current.play().catch(err =>
          console.error("Error playing shuffle cards sound:", err)
        );
      }
    }, 100); // Small delay to prevent animation conflicts
  };

  // Handle card selection
  const handleCardSelect = (cardId: string, index: number) => {
    // Stop the timer
    setTimerActive(false);

    // Play selected card sound
    if (selectedCardSoundRef.current) {
      selectedCardSoundRef.current.currentTime = 0;
      selectedCardSoundRef.current.volume = soundEffectsVolume;
      selectedCardSoundRef
        .current
        .play()
        .catch(err => console.error("Error playing selected card sound:", err));
    }

    // Store the selected index for the next turn
    setLastSelectedIndex(index);

    // Save selected index to sessionStorage
    sessionStorage.setItem("battle_last_selected_index", index.toString());

    // Log the selection
    setDebugInfo(
      (prev) =>
        prev + `\nCard selected: ${currentCards[index]?.name} at index ${index}`
    );

    // No longer the first turn
    setIsFirstTurn(false);
    sessionStorage.setItem("battle_is_first_turn", "false");

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
          const sessionUuid = sessionStorage.getItem("battle_session_uuid");
          const isHost = sessionStorage.getItem("is_host") === "true";
          const playerType = isHost ? "host" : "guest";

          if (!sessionUuid) return;

          // Check if this player has any card blocking effects active
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL
            }/api/gameplay/battle/card-blocking-effects/${sessionUuid}/${playerType}`
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
                [availableIndices[i], availableIndices[j]] = [
                  availableIndices[j],
                  availableIndices[i],
                ];
              }

              // Take only the number of cards we want to show
              const indicesToShow = availableIndices.slice(0, numCardsToShow);
              setVisibleCardIndices(indicesToShow);

              // Show notification about blocked cards
              const blockingAnimationContainer = document.createElement("div");
              blockingAnimationContainer.className = "fixed inset-0 z-[100] pointer-events-none flex items-center justify-center";

              // Play Answer Shield damaged sound effect
              if (answerShieldDamagedSoundRef?.current) {
                const calculatedVolume = (soundEffectsVolume / masterVolume);
                answerShieldDamagedSoundRef.current.volume = calculatedVolume;
                answerShieldDamagedSoundRef.current.currentTime = 0;
                answerShieldDamagedSoundRef.current.play().catch(err =>
                  console.error("Error playing Answer Shield damaged sound:", err)
                );
              }

              blockingAnimationContainer.innerHTML = `
                <div class="relative">
                  <!-- Fullscreen backdrop gradient -->
                  <div class="fixed inset-0 bg-gradient-to-b from-red-900/30 to-red-500/10 backdrop-blur-[2px]"></div>
                  
                  <!-- Shield hit animation -->
                  <div class="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse-slow" style="width: 350px; height: 350px; top: 50%; left: 50%; transform: translate(-50%, -50%)"></div>
                  
                  <!-- Broken shield visual -->
                  <div class="absolute" style="width: 300px; height: 300px; top: 50%; left: 50%; transform: translate(-50%, -50%)">
                    <div class="absolute inset-0 flex items-center justify-center">
                      <div class="w-60 h-60 rounded-full border-8 border-red-400/80 bg-gradient-to-br from-red-500/40 to-red-600/20 flex items-center justify-center">
                        <!-- Shield fracture animation -->
                        <div class="absolute w-full h-full overflow-hidden">
                          <div class="absolute bg-red-400/30 h-1 w-full top-1/2 left-0 transform -translate-y-1/2 animate-expand-x" style="animation-duration: 0.8s"></div>
                          <div class="absolute bg-red-400/30 w-1 h-full top-0 left-1/2 transform -translate-x-1/2 animate-expand-y" style="animation-duration: 0.8s"></div>
                          <div class="absolute bg-red-400/30 h-1 w-full top-1/4 left-0 transform -translate-y-1/2 animate-expand-x" style="animation-delay: 0.2s; animation-duration: 0.7s"></div>
                          <div class="absolute bg-red-400/30 h-1 w-full top-3/4 left-0 transform -translate-y-1/2 animate-expand-x" style="animation-delay: 0.3s; animation-duration: 0.7s"></div>
                        </div>
                        
                        <!-- Broken shield icon -->
                        <div class="relative">
                          <img src="/GameBattle/EpicCardAnswerShield.png" alt="Shield" class="w-32 h-32 object-contain opacity-70 drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]" />
                          <!-- Cracks overlay with animation -->
                          <div class="absolute inset-0 flex items-center justify-center">
                            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" 
                                 class="stroke-white drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" stroke-width="3">
                              <path d="M50 20 L40 55 L60 40 L30 70 L45 50 L20 80" stroke-linecap="round" 
                                    class="animate-draw-line" style="animation-duration: 1.2s; stroke-dasharray: 150; stroke-dashoffset: 150;" />
                              <path d="M50 20 L70 60 L50 45 L80 75" stroke-linecap="round" 
                                    class="animate-draw-line" style="animation-duration: 1s; animation-delay: 0.3s; stroke-dasharray: 120; stroke-dashoffset: 120;" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Blocked cards effect with animation -->
                    <div class="absolute inset-0">
                      ${Array(response.data.data.cards_blocked).fill(0).map((_, i) => `
                        <div class="absolute rounded-lg bg-gradient-to-br from-white/90 to-gray-200/90 w-16 h-24 shadow-xl animate-fade-slide-in"
                             style="top: calc(50% - 48px); left: calc(50% + ${(i - 0.5) * 30}px); transform: translateX(-50%) rotate(${(i - 1) * 15}deg); animation-delay: ${0.3 + i * 0.2}s;">
                          <div class="absolute inset-0 flex items-center justify-center">
                            <div class="relative">
                              <svg class="w-12 h-12 text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" />
                                <path d="M7 7 L17 17 M7 17 L17 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                              </svg>
                              <!-- Red flash effect -->
                              <div class="absolute inset-0 bg-red-500/50 rounded-full animate-flash-fade" style="animation-delay: ${0.5 + i * 0.2}s"></div>
                            </div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                  
                  <!-- Text indicator -->
                  <div class="absolute top-[68%] left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-900/90 to-red-700/90 px-8 py-4 rounded-xl border-2 border-red-400/70 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                    <p class="text-red-100 font-bold text-2xl text-center tracking-wider">
                      ${response.data.data.cards_blocked === 1 ?
                  "CARD BLOCKED!" :
                  `${response.data.data.cards_blocked} CARDS BLOCKED!`}
                    </p>
                    <p class="text-red-200 text-center text-sm mt-1">Your opponent activated Answer Shield</p>
                  </div>
                </div>
              `;

              document.body.appendChild(blockingAnimationContainer);

              // Remove the animation after 3 seconds with fade out
              setTimeout(() => {
                blockingAnimationContainer.style.transition = "opacity 0.5s";
                blockingAnimationContainer.style.opacity = "0";
                setTimeout(() => {
                  document.body.removeChild(blockingAnimationContainer);
                }, 500);
              }, 3000);

              // Mark the blocking effect as used
              if (
                response.data.data.effects &&
                response.data.data.effects.length > 0
              ) {
                const effectToConsume = response.data.data.effects[0];

                // Consume the effect
                await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL
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
      };

      checkForCardBlocking();
    } else {
      // Reset when not player's turn
      setHasCardBlocking(false);
      setBlockedCardCount(0);
      setVisibleCardIndices([0, 1, 2]);
    }
  }, [isMyTurn]);

  // Check for mind control effects
  useEffect(() => {
    if (isMyTurn) {
      const checkForMindControl = async () => {
        try {
          // Get session UUID and player type from sessionStorage
          const sessionUuid = sessionStorage.getItem("battle_session_uuid");
          const isHost = sessionStorage.getItem("is_host") === "true";
          const playerType = isHost ? "host" : "guest";

          if (!sessionUuid) return;

          // Check if this player has any mind control effects active
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL
            }/api/gameplay/battle/mind-control-effects/${sessionUuid}/${playerType}`
          );

          if (response.data.success && response.data.data) {
            setHasMindControl(response.data.data.has_mind_control_effect);

            // If there's a mind control effect active, the player can't select cards
            if (response.data.data.has_mind_control_effect) {
              setMindControlActive(true);

              // Show visually impressive mind control effect
              const mindControlAnimationContainer = document.createElement('div');
              mindControlAnimationContainer.className = `
                fixed top-0 left-0 w-full h-full
                bg-gray-900 bg-opacity-30
                flex items-center justify-center
                z-50
                animate-mindControlFade
              `;

              mindControlAnimationContainer.innerHTML = `
                <div class="relative w-full h-full flex items-center justify-center">
                  <!-- Removed backdrop with gradient -->
                  
                  <!-- Cards being blocked visualization -->
                  <div class="absolute flex items-center justify-center gap-4 z-10">
                    ${Array(3).fill(0).map((_, i) => `
                      <div class="relative">
                        <!-- Card -->
                        <div class="w-44 h-56 bg-gradient-to-b from-gray-800 to-gray-700 rounded-lg transform ${i === 0 ? 'rotate-[-8deg]' : i === 1 ? 'rotate-[0deg]' : 'rotate-[8deg]'
                } shadow-xl border border-gray-600">
                          <!-- Card content suggestion -->
                          <div class="absolute inset-2 rounded bg-gray-700 flex flex-col items-center justify-center p-2">
                            <div class="w-full h-28 bg-gray-600 mb-2 rounded-sm"></div>
                            <div class="w-full h-4 bg-gray-600 rounded-sm mb-1"></div>
                            <div class="w-3/4 h-4 bg-gray-600 rounded-sm mb-1"></div>
                            <div class="w-full h-10 bg-gray-600 rounded-sm"></div>
                          </div>
                          
                          <!-- Lock overlay -->
                          <div class="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center backdrop-blur-[2px]">
                            <svg class="w-16 h-16 text-purple-200 animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              <circle cx="12" cy="16" r="1" fill="currentColor"/>
                            </svg>
                          </div>
                          
                          <!-- Purple energy outline pulse -->
                          <div class="absolute inset-0 rounded-lg border-2 border-purple-500 animate-pulse-border"></div>
                        </div>
                        
                        <!-- X mark over card -->
                        <div class="absolute inset-0 flex items-center justify-center">
                          <svg class="w-28 h-28 text-red-500 animate-pulse-opacity" style="animation-delay: ${i * 0.2}s;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M6 6L18 18" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  
                  <!-- Mind control text indicator -->
                  <div class="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-16 bg-purple-900 px-8 py-4 rounded-lg border border-purple-500 shadow-lg z-20">
                    <div className="flex items-center gap-3 mb-1">
                      <svg class="w-6 h-6 text-purple-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <h2 class="text-purple-100 font-bold text-xl">CARDS LOCKED</h2>
                    </div>
                    <p class="text-purple-200 text-center text-sm">Your opponent used Mind Control</p>
                  </div>
                </div>
              `;

              // Add CSS for the animations if they don't exist
              if (!document.getElementById('mind-control-animations')) {
                const styleElement = document.createElement('style');
                styleElement.id = 'mind-control-animations';
                styleElement.textContent = `
                  @keyframes pulse-opacity {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                  }
                  @keyframes pulse-border {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
                    50% { box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.4); }
                  }
                  
                  .animate-pulse-opacity {
                    animation: pulse-opacity 2s ease-in-out infinite;
                  }
                  .animate-pulse-border {
                    animation: pulse-border 2s ease-in-out infinite;
                  }
                `;
                document.head.appendChild(styleElement);
              }

              // Add the animation to the document
              document.body.appendChild(mindControlAnimationContainer);

              // Remove the animation after 3.5 seconds with fade out
              setTimeout(() => {
                mindControlAnimationContainer.style.transition = "opacity 0.5s";
                mindControlAnimationContainer.style.opacity = "0";
                setTimeout(() => {
                  document.body.removeChild(mindControlAnimationContainer);
                }, 500);
              }, 3500);

              // Mark the mind control effect as used
              if (
                response.data.data.effects &&
                response.data.data.effects.length > 0
              ) {
                const effectToConsume = response.data.data.effects[0];

                // Consume the effect
                await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL
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
                }, 4000); // Increased to 4 seconds to allow the animation to complete
              }
            }
          }
        } catch (error) {
          console.error("Error checking for mind control effects:", error);
        }
      };

      checkForMindControl();
    } else {
      // Reset when not player's turn
      setHasMindControl(false);
      setMindControlActive(false);
    }
  }, [isMyTurn, onCardSelected]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-120 card-selection">
      {/* Audio elements for card animations */}
      <audio
        ref={flipCardSoundRef}
        src="/GameBattle/flipcard.mp3"
        preload="auto"
      />
      <audio
        ref={shuffleCardsSoundRef}
        src="/GameBattle/shuffle-cards.mp3"
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

      {/* Enhanced debug panel - shows more detailed probability info */}
      {/* Debug panel commented out for production
      {process.env.NODE_ENV === 'development' && (
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
            className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded font-bold"
            onClick={clearAllCardStats}
          >
            CLEAR STATS
          </button>
        </div>
      )}
      */}

      {/* Only show turn indicator when it's NOT the player's turn */}
      {!isMyTurn && (
        <div className="absolute inset-0 flex items-center top-[100px] justify-center z-20 game-overlay">
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
                className="w-[280px] h-[380px] overflow-hidden shadow-lg shadow-purple-500/30 animation-overlay"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.7,
                  exit: { duration: 0.5 },
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
            <div className="absolute top-[140px] text-white text-2xl font-bold game-overlay">
              Time remaining:{" "}
              <span
                className={selectionTimer <= 3 ? "text-red-500" : "text-white"}
              >
                {selectionTimer}s
              </span>
            </div>
          )}

          <AnimatePresence>
            {showCardOptions && backCardExitComplete && !mindControlActive && (
              <div className="flex gap-8">
                {currentCards.filter(Boolean).map((card, index) => {
                  // Only render this card if it's in the visibleCardIndices array
                  if (!visibleCardIndices.includes(index) && hasCardBlocking) {
                    return null; // Skip this card if it's blocked
                  }

                  // Ensure the card has all required properties
                  const safeCard = {
                    ...card,
                    id: card.id || `fallback-${index}`,
                    name: card.name || "Card",
                    type: card.type || "Basic Card",
                    description: card.description || "No effect",
                    image: card.image || cardBackImage,
                  };

                  return (
                    <motion.div
                      key={`card-${index}`}
                      className={`w-[280px] h-[380px] rounded-xl overflow-hidden cursor-pointer shadow-lg relative ${safeCard.image ? "" : getCardBackground(safeCard.type)
                        }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.15,
                      }}
                      onClick={() => handleCardSelect(safeCard.id, index)}
                      whileHover={{
                        y: -10,
                        scale: 1.05,
                      }}
                    >
                      {safeCard.image ? (
                        <img
                          src={safeCard.image}
                          alt={safeCard.name}
                          className="w-full h-full object-fill"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const imgElement = e.target as HTMLImageElement;
                            imgElement.src = cardBackImage;
                            imgElement.onerror = null; // Prevent infinite loop
                          }}
                        />
                      ) : (
                        <div
                          className={`flex flex-col h-full p-6 text-white ${getCardBackground(
                            safeCard.type
                          )}`}
                        >
                          <div className="text-2xl font-bold mb-4">
                            {safeCard.name}
                          </div>
                          <div className="text-lg italic mb-6">
                            {safeCard.type}
                          </div>
                          <div className="border-t border-white/20 my-4 pt-4">
                            <p className="text-xl">{safeCard.description}</p>
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
          )}

          {/* Show enhanced information about mind control if active */}
          {mindControlActive && showCardOptions && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-72 h-20 overflow-hidden">
                <div className="absolute inset-0 bg-gray-900/70 rounded-lg border border-purple-500 shadow-lg flex items-center justify-center">
                  {/* Content */}
                  <div className="flex items-center gap-3 p-3">
                    <svg className="w-10 h-10 text-purple-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <h3 className="text-purple-100 font-bold">CARDS LOCKED</h3>
                      <p className="text-purple-200 text-sm">Auto-proceeding without a card</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Show notification if cards are blocked */}
      {hasCardBlocking && blockedCardCount > 0 && isMyTurn && (
        <div className="absolute top-[170px] text-red-400 text-xl font-semibold game-overlay">
          {blockedCardCount === 1
            ? "Your opponent used Answer Shield: 1 card has been blocked!"
            : `Your opponent used Answer Shield: ${blockedCardCount} cards have been blocked!`}
        </div>
      )}

      {/* Enhanced notification if mind control is active */}
      {hasMindControl && mindControlActive && isMyTurn && (
        <div className="absolute top-[100px] flex items-center justify-center game-overlay">
          <div className="bg-gray-900/70 rounded-lg border border-purple-500 px-4 py-2 shadow-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-purple-200 text-sm font-semibold">Cards Locked</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSelection;
