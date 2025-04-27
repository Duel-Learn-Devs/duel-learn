import { useEffect } from "react";

const useWandCursor = () => {
    useEffect(() => {
        // Create wand cursor
        const wandCursor = document.createElement("div");
        wandCursor.className = "wand-cursor";
        wandCursor.style.top = "-50px"; // Start offscreen
        wandCursor.style.left = "-50px"; // Start offscreen
        document.body.appendChild(wandCursor);

        // Create sparkles container
        const sparklesContainer = document.createElement("div");
        sparklesContainer.id = "sparkles-container";
        document.body.appendChild(sparklesContainer);

        const handleMouseMove = (e: MouseEvent) => {
            // Update wand position
            wandCursor.style.left = `${e.pageX}px`;
            wandCursor.style.top = `${e.pageY}px`;

            // Generate sparkles
            const numSparkles = 5;
            for (let i = 0; i < numSparkles; i++) {
                const offsetX = Math.random() * 20 - 10;
                const offsetY = Math.random() * 20 - 10;
                createSparkle(e.pageX + offsetX, e.pageY + offsetY);
            }
        };

        const createSparkle = (x: number, y: number) => {
            const sparkle = document.createElement("div");
            sparkle.classList.add("sparkle");
            sparkle.style.left = `${x}px`;
            sparkle.style.top = `${y}px`;

            sparklesContainer.appendChild(sparkle);

            // Remove sparkle after animation
            setTimeout(() => sparkle.remove(), 800);
        };

        // Attach event listener
        document.addEventListener("mousemove", handleMouseMove);

        // Cleanup on component unmount
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            wandCursor.remove();
            sparklesContainer.remove();
        };
    }, []);
};

export default useWandCursor;
