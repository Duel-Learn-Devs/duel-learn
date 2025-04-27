import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function AutoConfettiAnimation() {
    useEffect(() => {
        // Function to trigger confetti from both bottom corners
        const triggerConfetti = () => {
            // Left bottom corner explosion
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { x: 0, y: 1 },
                colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
            });

            // Right bottom corner explosion
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { x: 1, y: 1 },
                colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
            });
        };

        // First explosion immediately
        triggerConfetti();

        // Second explosion after 1.5 seconds
        const secondExplosionTimeout = setTimeout(() => {
            triggerConfetti();
        }, 1500);

        // Clean up
        return () => {
            clearTimeout(secondExplosionTimeout);
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Return an empty div - no visible UI elements
    return <div className="fixed inset-0 pointer-events-none" />;
} 