import { useState, useEffect, useRef } from "react";
import axios from "axios";

interface EnemyQuestionDisplayProps {
    sessionUuid: string | undefined;
    isHost: boolean;
    isMyTurn: boolean;
    opponentName: string;
}

/**
 * Component to display what question the opponent is currently answering
 * - Polls every 1 second to check if the opponent is on a flashcard
 * - Only displays when the opponent is actively on a flashcard screen
 * - Shows the exact question the opponent is currently answering
 */
const EnemyQuestionDisplay: React.FC<EnemyQuestionDisplayProps> = ({
    sessionUuid,
    isHost,
    isMyTurn,
    opponentName,
}) => {
    const [enemyQuestionText, setEnemyQuestionText] = useState<string | null>(null);
    const [enemyOnFlashcard, setEnemyOnFlashcard] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true); // Track only initial loading
    const [isPolling, setIsPolling] = useState(false); // Track if we're polling
    const [error, setError] = useState<string | null>(null);
    const lastQuestionRef = useRef<string | null>(null); // Store last valid question

    // Only poll when it's not the current player's turn and we have a session UUID
    const shouldPoll = !isMyTurn && sessionUuid;

    useEffect(() => {
        // Reset state when turn changes
        if (isMyTurn) {
            setEnemyQuestionText(null);
            setEnemyOnFlashcard(false);
            setIsInitialLoading(true);
            lastQuestionRef.current = null;
            return;
        }

        // Only poll when it's not the current player's turn
        if (!shouldPoll) return;

        let isMounted = true;
        const playerType = isHost ? 'host' : 'guest';

        const fetchEnemyQuestion = async () => {
            if (!sessionUuid) return;

            try {
                setIsPolling(true); // Mark that we're polling
                const { data } = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/enemy-question/${sessionUuid}/${playerType}`
                );

                if (isMounted && data.success) {
                    // Log status changes for debugging
                    const statusChanged = data.data.enemy_on_flashcard !== enemyOnFlashcard;
                    const textChanged = data.data.enemy_question_text !== enemyQuestionText;

                    if (statusChanged || textChanged) {
                        console.log('Enemy flashcard status updated:', {
                            wasOnFlashcard: enemyOnFlashcard,
                            isNowOnFlashcard: data.data.enemy_on_flashcard,
                            questionChanged: textChanged,
                            timestamp: new Date().toISOString()
                        });
                    }

                    // If we got a valid question text, save it to our ref
                    if (data.data.enemy_question_text) {
                        lastQuestionRef.current = data.data.enemy_question_text;
                    }

                    // Update state with data from API
                    setEnemyQuestionText(data.data.enemy_question_text);
                    setEnemyOnFlashcard(data.data.enemy_on_flashcard);
                    setError(null);
                    setIsInitialLoading(false); // Turn off initial loading after successful load
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Error fetching enemy question:", error);
                    setError("Failed to load opponent's question");
                    // Don't change isInitialLoading here to prevent flicker
                }
            } finally {
                if (isMounted) {
                    setIsPolling(false); // Mark that we're done polling
                }
            }
        };

        // Initial fetch
        fetchEnemyQuestion();

        // Set up polling every 1 second
        const interval = setInterval(fetchEnemyQuestion, 1000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [sessionUuid, isHost, isMyTurn, shouldPoll]);

    // Don't render anything if it's the current player's turn or if enemy is not on flashcard
    if (isMyTurn || (!enemyQuestionText && !lastQuestionRef.current) || !enemyOnFlashcard) {
        return null;
    }

    // Use the last valid question text if the current request is in progress
    const questionToDisplay = enemyQuestionText || lastQuestionRef.current;

    return (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[800px] z-30">
            <div className="bg-purple-800 text-white py-3 rounded-t-lg shadow-md text-center font-medium">
                Opponent is answering
            </div>
            <div className="bg-white p-10 rounded-b-lg shadow-xl flex items-center justify-center min-h-[180px]">
                <div className="text-black text-2xl font-medium text-center max-w-[90%]">
                    {isInitialLoading ? (
                        <div className="animate-pulse">Loading question...</div>
                    ) : error && !questionToDisplay ? (
                        <div className="text-red-500">{error}</div>
                    ) : (
                        <div>{questionToDisplay}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnemyQuestionDisplay; 