interface GuestWaitingForRandomizationProps {
    waitingForRandomization?: boolean;
}

export default function GuestWaitingForRandomization({ waitingForRandomization = false }: GuestWaitingForRandomizationProps) {
    if (!waitingForRandomization) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-40 flex flex-col items-center justify-center">
            {/* Audio element for randomizing sound */}
            <audio
                src="/GameBattle/randomizing.mp3"
                autoPlay
                loop
                className="hidden"
            />

            <div className="text-center">
                <h2 className="text-purple-300 text-4xl font-bold mb-8">Ready to Battle!</h2>
                <p className="text-white text-xl mb-12">Waiting for host to determine who goes first...</p>
                <div className="flex space-x-4 justify-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
} 