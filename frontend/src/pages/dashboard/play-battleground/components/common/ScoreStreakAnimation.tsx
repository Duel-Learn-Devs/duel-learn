import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PentakillAnimationProps {
    streak: number;
}

export default function ScoreStreakAnimation({ streak }: PentakillAnimationProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 3500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <div className="relative inline-block">
                    {/* Left flare */}
                    <motion.div
                        className="absolute left-0 top-1/2 w-[150px] h-[2px] bg-gradient-to-r from-[#FF6B6B] via-[#FFD93D] to-transparent"
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: "100%", opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Right flare */}
                    <motion.div
                        className="absolute right-0 top-1/2 w-[150px] h-[2px] bg-gradient-to-l from-[#FF6B6B] via-[#FFD93D] to-transparent"
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: "-100%", opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Current streak text */}
                    <motion.h1
                        className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] via-[#FFD93D] to-[#FF6B6B]"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                            opacity: 1,
                            scale: [1, 1.1, 1],
                            textShadow: [
                                "0 0 20px rgba(255, 107, 107, 0.7)",
                                "0 0 40px rgba(255, 165, 0, 0.7)",
                                "0 0 20px rgba(255, 107, 107, 0.7)",
                                "0 0 40px rgba(255, 165, 0, 0.7)",
                                "0 0 20px rgba(255, 107, 107, 0.7)",
                            ],
                        }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{
                            duration: 1.5,
                            times: [0, 0.25, 0.5, 0.75, 1],
                            ease: "easeInOut",
                        }}
                    >
                        {streak}x
                    </motion.h1>

                    {/* Magical particles */}
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-0.5 h-0.5 bg-gradient-to-r from-[#FF6B6B] to-[#FFD93D] rounded-full"
                            initial={{
                                opacity: 0,
                                x: Math.random() * 200 - 100,
                                y: Math.random() * 200 - 100,
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                                x: Math.random() * 400 - 200,
                                y: Math.random() * 400 - 200,
                            }}
                            transition={{
                                duration: Math.random() * 2 + 1,
                                delay: Math.random(),
                                ease: "easeInOut",
                                times: [0, 0.5, 1],
                            }}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
} 