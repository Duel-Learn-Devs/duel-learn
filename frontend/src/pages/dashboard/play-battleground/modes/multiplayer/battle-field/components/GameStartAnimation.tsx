import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

interface GameStartAnimationProps {
    showGameStart: boolean;
    gameStartText: string;
}

export default function GameStartAnimation({
    showGameStart,
    gameStartText
}: GameStartAnimationProps) {
    // Create a ref for a notification sound
    const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

    // Effect to stop any randomizing sounds when game start animation appears
    useEffect(() => {
        if (showGameStart) {
            // Find and stop all looping audio elements on the page EXCEPT the background music
            const audioElements = document.querySelectorAll('audio:not(#pvp-background-music)');
            audioElements.forEach(audio => {
                // Only stop audio that's looping
                const audioElement = audio as HTMLAudioElement;
                if (audioElement.loop) {
                    audioElement.pause();
                    audioElement.currentTime = 0;
                }
            });

            // Play notification sound once
            if (notificationSoundRef.current) {
                notificationSoundRef.current.volume = 0.7;
                notificationSoundRef.current.play().catch(err =>
                    console.error("Error playing notification sound:", err)
                );
            }
        }
    }, [showGameStart]);

    return (
        <AnimatePresence>
            {showGameStart && (
                <motion.div
                    className="fixed inset-0 bg-black/70 z-30 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Audio for battle start notification */}
                    <audio
                        ref={notificationSoundRef}
                        src="/GameBattle/spin-complete.mp3"
                        preload="auto"
                    />

                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center"
                    >
                        <div className="text-purple-300 text-5xl font-bold mb-4">BATTLE START!</div>
                        <div className="text-white text-2xl">{gameStartText}</div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 