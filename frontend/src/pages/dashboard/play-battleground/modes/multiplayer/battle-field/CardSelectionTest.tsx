import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Import the card images
import BasicCard from "/GameBattle/BasicCard.png"
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
    image?: string;
}

const CardSelectionTest: React.FC = () => {
    // Card state management
    const [selectedCards, setSelectedCards] = useState<Card[]>([]);
    const [persistentCards, setPersistentCards] = useState<Card[]>([])
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    const [isFirstTurn, setIsFirstTurn] = useState(true);
    const [turnCount, setTurnCount] = useState(1);
    const [debugInfo, setDebugInfo] = useState<string>("");
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("average");
    const [cardStats, setCardStats] = useState<{
        basic: number,
        normal: number,
        epic: number,
        rare: number,
        total: number
    }>({
        basic: 0,
        normal: 0,
        epic: 0,
        rare: 0,
        total: 0
    });

    // Cards grouped by type
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
        // Extract just the first word (hard, easy, average) from strings like "Hard Mode"
        const difficultyWord = difficulty?.toLowerCase().split(' ')[0] || "average";

        // Map it to our expected keys
        let normalizedDifficulty: "easy" | "average" | "hard";
        if (difficultyWord.includes("easy")) normalizedDifficulty = "easy";
        else if (difficultyWord.includes("hard")) normalizedDifficulty = "hard";
        else normalizedDifficulty = "average"; // Default

        setDebugInfo(prev => prev + `\nSelecting card with difficulty: ${normalizedDifficulty}`);

        const dist = probabilityDistribution[normalizedDifficulty] || probabilityDistribution.average;

        // Select a card based on probability
        const random = Math.random() * 100;
        setDebugInfo(prev => prev + `\nRandom percentage: ${random.toFixed(2)}`);

        // Update card stats
        setCardStats(prev => ({
            ...prev,
            total: prev.total + 1
        }));

        // Basic cards selection
        if (random < dist.basic) {
            setDebugInfo(prev => prev + `\nSelected basic card type (${dist.basic}%)`);
            setCardStats(prev => ({
                ...prev,
                basic: prev.basic + 1
            }));
            return cardsByType.basic[Math.floor(Math.random() * cardsByType.basic.length)];
        }
        // Normal cards selection
        else if (random < dist.basic + dist.normal.total) {
            setDebugInfo(prev => prev + `\nSelected normal card type (${dist.normal.total}%)`);
            setCardStats(prev => ({
                ...prev,
                normal: prev.normal + 1
            }));

            // Select weighted normal card
            const totalWeight = Object.values(dist.normal.distribution).reduce((sum, weight) => sum + weight, 0);
            let weightRandom = Math.random() * totalWeight;

            for (const card of cardsByType.normal) {
                const weight = dist.normal.distribution[card.name as keyof typeof dist.normal.distribution] || 0;
                if (weightRandom < weight) return card;
                weightRandom -= weight;
            }

            return cardsByType.normal[0];
        }
        // Epic cards selection
        else if (random < dist.basic + dist.normal.total + dist.epic.total) {
            setDebugInfo(prev => prev + `\nSelected epic card type (${dist.epic.total}%)`);
            setCardStats(prev => ({
                ...prev,
                epic: prev.epic + 1
            }));

            // Select weighted epic card
            const totalWeight = Object.values(dist.epic.distribution).reduce((sum, weight) => sum + weight, 0);
            let weightRandom = Math.random() * totalWeight;

            for (const card of cardsByType.epic) {
                const weight = dist.epic.distribution[card.name as keyof typeof dist.epic.distribution] || 0;
                if (weightRandom < weight) return card;
                weightRandom -= weight;
            }

            return cardsByType.epic[0];
        }
        // Rare cards selection
        else {
            setDebugInfo(prev => prev + `\nSelected rare card type (${dist.rare.total}%)`);
            setCardStats(prev => ({
                ...prev,
                rare: prev.rare + 1
            }));

            // Select weighted rare card
            const totalWeight = Object.values(dist.rare.distribution).reduce((sum, weight) => sum + weight, 0);
            let weightRandom = Math.random() * totalWeight;

            for (const card of cardsByType.rare) {
                const weight = dist.rare.distribution[card.name as keyof typeof dist.rare.distribution] || 0;
                if (weightRandom < weight) return card;
                weightRandom -= weight;
            }

            return cardsByType.rare[0];
        }
    };

    // Generate three random cards - making sure they're all different when possible
    const generateThreeRandomCards = (difficulty: string): Card[] => {
        setDebugInfo(prev => prev + `\nGenerating three random cards with ${difficulty} difficulty`);

        // First card is completely random
        const firstCard = selectSingleCardByProbability(difficulty);

        // For the second card, try up to 3 times to get a different card
        let secondCard: Card;
        let attempts = 0;
        do {
            secondCard = selectSingleCardByProbability(difficulty);
            attempts++;
        } while (secondCard.id === firstCard.id && attempts < 3);

        // For the third card, try up to 3 times to get a different card from both previous cards
        let thirdCard: Card;
        attempts = 0;
        do {
            thirdCard = selectSingleCardByProbability(difficulty);
            attempts++;
        } while ((thirdCard.id === firstCard.id || thirdCard.id === secondCard.id) && attempts < 3);

        return [firstCard, secondCard, thirdCard];
    };

    // Generate cards with persistence between turns - debugging function
    const generateCardsForTurn = (): Card[] => {
        if (isFirstTurn || persistentCards.length === 0) {
            // First turn or no persistent cards - generate all new
            const newCards = generateThreeRandomCards(selectedDifficulty);
            setDebugInfo(prev => prev + `\nFirst turn: generating 3 new random cards`);
            return newCards;
        } else {
            // Create a new set of cards
            let newCards: Card[] = [...persistentCards];

            // Replace the card that was used in the previous turn with a new random card
            if (lastSelectedIndex !== null) {
                const oldCard = newCards[lastSelectedIndex]?.name || "unknown";
                newCards[lastSelectedIndex] = selectSingleCardByProbability(selectedDifficulty);
                const newCard = newCards[lastSelectedIndex]?.name || "unknown";
                setDebugInfo(prev => prev + `\nTurn ${turnCount}: Replacing card at index ${lastSelectedIndex} (${oldCard} -> ${newCard})`);
            } else {
                setDebugInfo(prev => prev + `\nTurn ${turnCount}: No card was selected in the previous turn`);
            }

            return newCards;
        }
    };

    // Initialize cards on first render
    useEffect(() => {
        const initialCards = generateThreeRandomCards(selectedDifficulty);
        setSelectedCards(initialCards);
        setDebugInfo("Initial setup: generated 3 random cards");
    }, []);

    // Handle card selection
    const handleCardSelect = (index: number) => {
        // Store the selected index for the next turn
        setLastSelectedIndex(index);

        // Save the current cards for persistence
        setPersistentCards([...selectedCards]);

        // Log the selection
        setDebugInfo(prev => prev + `\nCard selected: ${selectedCards[index]?.name} at index ${index}`);

        // No longer the first turn
        setIsFirstTurn(false);
    };

    // Simulate next turn
    const handleNextTurn = () => {
        const cardsForNextTurn = generateCardsForTurn();
        setSelectedCards(cardsForNextTurn);
        setTurnCount(prev => prev + 1);
    };

    // Reset everything
    const handleReset = () => {
        setIsFirstTurn(true);
        setLastSelectedIndex(null);
        setPersistentCards([]);
        setTurnCount(1);
        const initialCards = generateThreeRandomCards(selectedDifficulty);
        setSelectedCards(initialCards);
        setDebugInfo("Reset: generated 3 new random cards");
    };

    // Handle difficulty change
    const handleDifficultyChange = (difficulty: string) => {
        setSelectedDifficulty(difficulty);
        setDebugInfo(prev => prev + `\nChanged difficulty to: ${difficulty}`);
    };

    // Generate a batch of cards to test probability distribution
    const testProbability = () => {
        // Reset stats
        setCardStats({
            basic: 0,
            normal: 0,
            epic: 0,
            rare: 0,
            total: 0
        });

        // Generate 100 cards and count types
        setDebugInfo("Testing probability distribution with 100 cards:");

        for (let i = 0; i < 100; i++) {
            selectSingleCardByProbability(selectedDifficulty);
        }
    };

    // Get the background color based on card type
    const getCardBackground = (type: string) => {
        switch (type) {
            case "Basic Card": return "bg-gray-700";
            case "Normal Power Card": return "bg-blue-700";
            case "Epic Power Card": return "bg-purple-700";
            case "Rare Power Card": return "bg-yellow-700";
            default: return "bg-gray-700";
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="container mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Card Selection Test</h1>
                    <Link to="/dashboard/play-battleground" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
                        Back to Battleground
                    </Link>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg mb-8">
                    <h2 className="text-2xl mb-4">Difficulty Settings</h2>
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => handleDifficultyChange("easy")}
                            className={`px-4 py-2 rounded ${selectedDifficulty === "easy" ? "bg-green-600" : "bg-gray-600"}`}
                        >
                            Easy
                        </button>
                        <button
                            onClick={() => handleDifficultyChange("average")}
                            className={`px-4 py-2 rounded ${selectedDifficulty === "average" ? "bg-blue-600" : "bg-gray-600"}`}
                        >
                            Average
                        </button>
                        <button
                            onClick={() => handleDifficultyChange("hard")}
                            className={`px-4 py-2 rounded ${selectedDifficulty === "hard" ? "bg-red-600" : "bg-gray-600"}`}
                        >
                            Hard
                        </button>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Probability Distribution:</h3>
                        <div className="bg-gray-700 p-3 rounded mb-4">
                            <p><strong>Basic:</strong> {probabilityDistribution[selectedDifficulty as keyof typeof probabilityDistribution].basic}%</p>
                            <p><strong>Normal:</strong> {probabilityDistribution[selectedDifficulty as keyof typeof probabilityDistribution].normal.total}%</p>
                            <p><strong>Epic:</strong> {probabilityDistribution[selectedDifficulty as keyof typeof probabilityDistribution].epic.total}%</p>
                            <p><strong>Rare:</strong> {probabilityDistribution[selectedDifficulty as keyof typeof probabilityDistribution].rare.total}%</p>
                        </div>
                    </div>
                    <button
                        onClick={testProbability}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
                    >
                        Test Probability (Generate 100 Cards)
                    </button>
                </div>

                {cardStats.total > 0 && (
                    <div className="bg-gray-800 p-6 rounded-lg mb-8">
                        <h2 className="text-2xl mb-4">Probability Test Results</h2>
                        <div className="grid grid-cols-5 gap-4">
                            <div className="bg-gray-700 p-3 rounded">
                                <p className="text-lg font-bold">Basic</p>
                                <p className="text-2xl">{cardStats.basic}</p>
                                <p className="text-sm">{((cardStats.basic / cardStats.total) * 100).toFixed(1)}%</p>
                            </div>
                            <div className="bg-blue-700 p-3 rounded">
                                <p className="text-lg font-bold">Normal</p>
                                <p className="text-2xl">{cardStats.normal}</p>
                                <p className="text-sm">{((cardStats.normal / cardStats.total) * 100).toFixed(1)}%</p>
                            </div>
                            <div className="bg-purple-700 p-3 rounded">
                                <p className="text-lg font-bold">Epic</p>
                                <p className="text-2xl">{cardStats.epic}</p>
                                <p className="text-sm">{((cardStats.epic / cardStats.total) * 100).toFixed(1)}%</p>
                            </div>
                            <div className="bg-yellow-700 p-3 rounded">
                                <p className="text-lg font-bold">Rare</p>
                                <p className="text-2xl">{cardStats.rare}</p>
                                <p className="text-sm">{((cardStats.rare / cardStats.total) * 100).toFixed(1)}%</p>
                            </div>
                            <div className="bg-gray-600 p-3 rounded">
                                <p className="text-lg font-bold">Total</p>
                                <p className="text-2xl">{cardStats.total}</p>
                                <p className="text-sm">100%</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-800 p-6 rounded-lg mb-8">
                    <h2 className="text-2xl mb-4">Debug Information</h2>
                    <div className="flex gap-4 mb-4">
                        <div className="bg-purple-900 p-4 rounded">
                            <p><strong>Turn:</strong> {turnCount}</p>
                            <p><strong>Is First Turn:</strong> {isFirstTurn ? "Yes" : "No"}</p>
                            <p><strong>Last Selected Index:</strong> {lastSelectedIndex !== null ? lastSelectedIndex : "None"}</p>
                            <p><strong>Difficulty:</strong> {selectedDifficulty}</p>
                        </div>
                        <div className="bg-purple-900 p-4 rounded flex-1 max-h-60 overflow-y-auto">
                            <p><strong>Debug Log:</strong></p>
                            <pre className="font-mono text-xs whitespace-pre-wrap">{debugInfo}</pre>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleNextTurn}
                            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-lg font-semibold"
                        >
                            Simulate Next Turn
                        </button>
                        <button
                            onClick={handleReset}
                            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded text-lg font-semibold"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl mb-6">Card Selection</h2>

                    <div className="flex gap-8 justify-center mb-8">
                        {selectedCards.map((card, index) => (
                            <div
                                key={`${card.id}-${index}`}
                                className={`w-[280px] h-[380px] rounded-xl overflow-hidden cursor-pointer shadow-lg relative ${card.image ? '' : getCardBackground(card.type)}`}
                                onClick={() => handleCardSelect(index)}
                            >
                                {card.image ? (
                                    <img
                                        src={card.image}
                                        alt={card.name}
                                        className="w-full h-full object-fill"
                                    />
                                ) : (
                                    <div className="flex flex-col h-full p-6 text-white">
                                        <div className="text-2xl font-bold mb-4">{card.name}</div>
                                        <div className="text-lg italic mb-6">{card.type}</div>
                                        <div className="border-t border-white/20 my-4 pt-4">
                                            <p className="text-xl">{card.description}</p>
                                        </div>
                                        <div className="mt-auto flex justify-end">
                                            <div className="text-sm italic opacity-60">Card ID: {card.id}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Selection indicator overlay */}
                                {lastSelectedIndex === index && (
                                    <div className="absolute inset-0 bg-green-500/20 border-4 border-green-500 rounded-xl flex items-center justify-center">
                                        <div className="bg-green-900/80 px-4 py-2 rounded-lg font-bold">
                                            Selected
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="text-center text-lg">
                        <p>Click on a card to select it, then click "Simulate Next Turn" to test persistence behavior</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardSelectionTest; 