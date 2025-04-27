import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function AutoConfettiAnimation() {
    useEffect(() => {
        // Theme-appropriate colors: white, purple shades, and a touch of blue
        const colors = [
            "#ffffff", // white
            "#7c3aed", // purple (matching the button)
            "#8b5cf6", // lighter purple
            "#6d28d9", // darker purple
            "#c4b5fd", // very light purple
            "#312e81", // deep purple/blue
        ];

        // Function to create a single confetti drop
        const dropConfetti = () => {
            confetti({
                particleCount: 2,
                angle: 90,
                spread: 60,
                origin: { x: Math.random(), y: -0.01 },
                colors: colors,
                ticks: 300,
                gravity: 0.8,
                scalar: 1.2,
                drift: 0.1,
                shapes: ["square", "circle"],
            });
        };

        // Function to create a continuous rain effect for 3 seconds
        const startConfetti = () => {
            const intervalId = setInterval(dropConfetti, 25);
            setTimeout(() => {
                clearInterval(intervalId);
            }, 15000);
            return intervalId; // Return the interval ID for cleanup
        };

        // Start the confetti rain
        const intervalId = startConfetti();

        // Cleanup function to stop the confetti when the component unmounts
        return () => {
            clearInterval(intervalId);
        };

    }, []);

    return <div className="fixed inset-0 pointer-events-none" />
}