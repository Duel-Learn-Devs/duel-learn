import React from "react";

// =================== WAITING OVERLAY =====================
export interface WaitingOverlayProps {
    isVisible: boolean;
    waitingForTurn?: boolean;
    message?: string;
}

/**
 * WaitingOverlay component displays a waiting screen while looking for an opponent
 */
export function WaitingOverlay({ isVisible, waitingForTurn = false, message }: WaitingOverlayProps) {
    // If neither condition is true, don't render the overlay
    if (!isVisible && !waitingForTurn) return null;

    // Determine the appropriate message
    const displayMessage = message || (
        waitingForTurn
            ? "Waiting for the game to start..."
            : "Please stand by while we wait for your opponent to connect..."
    );

    // Determine the title
    const title = waitingForTurn ? "PREPARING BATTLE" : "WAITING FOR OPPONENT";

    return (
        <div className="fixed inset-0 bg-black/60 z-30 flex flex-col items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
                {/* VS Logo */}
                <div className="relative mb-4 sm:mb-6">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-purple-900/80 rotate-45 border-2 border-purple-400 mx-auto shadow-lg shadow-purple-500/30"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl sm:text-3xl font-bold text-purple-300">VS</span>
                    </div>
                </div>

                {/* Waiting text */}
                <h1 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3 text-purple-300 tracking-wide uppercase">
                    {title}
                </h1>

                {/* Status message */}
                <p className="text-purple-200/80 text-xs sm:text-sm mb-4 sm:mb-8 max-w-xs mx-auto">
                    {displayMessage}
                </p>

                {/* Loading animation dot */}
                <div className="flex justify-center items-center space-x-3 my-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-purple-200 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
                </div>
            </div>
        </div>
    );
}

// =================== LOADING ENDING OVERLAY =====================
interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
}

export function LoadingOverlay({
    isVisible,
    message = "Ending Battle..."
}: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-purple-300 text-3xl font-bold mb-6">{message}</h2>
                <div className="flex space-x-4 justify-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
} 