import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface SoundSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLeaveGame: () => void;
    backgroundMusicRef?: React.RefObject<HTMLAudioElement>;
    attackSoundRef?: React.RefObject<HTMLAudioElement>;
    correctAnswerSoundRef?: React.RefObject<HTMLAudioElement>;
    incorrectAnswerSoundRef?: React.RefObject<HTMLAudioElement>;
    correctSfxRef?: React.RefObject<HTMLAudioElement>;
    incorrectSfxRef?: React.RefObject<HTMLAudioElement>;
    masterVolume: number;
    musicVolume: number;
    soundEffectsVolume: number;
    setMasterVolume: React.Dispatch<React.SetStateAction<number>>;
    setMusicVolume: React.Dispatch<React.SetStateAction<number>>;
    setSoundEffectsVolume: React.Dispatch<React.SetStateAction<number>>;
}

export default function SoundSettingsModal({
    isOpen,
    onClose,
    onLeaveGame,
    backgroundMusicRef,
    attackSoundRef,
    correctAnswerSoundRef,
    incorrectAnswerSoundRef,
    correctSfxRef,
    incorrectSfxRef,
    masterVolume,
    musicVolume,
    soundEffectsVolume,
    setMasterVolume,
    setMusicVolume,
    setSoundEffectsVolume
}: SoundSettingsModalProps) {
    // No need for local state since we're using props

    // Initialize volume values from audio refs when modal opens
    useEffect(() => {
        if (!isOpen) return;

        // Only set initial values if they haven't been changed by the user
        if (musicVolume === 100 && backgroundMusicRef?.current) {
            setMusicVolume(Math.round(backgroundMusicRef.current.volume * 100));
        }

        // Assuming all sound effects have the same volume initially
        if (soundEffectsVolume === 100 && correctAnswerSoundRef?.current) {
            setSoundEffectsVolume(Math.round(correctAnswerSoundRef.current.volume * 100));
        }
    }, [isOpen, backgroundMusicRef, correctAnswerSoundRef, musicVolume, soundEffectsVolume, setMusicVolume, setSoundEffectsVolume]);

    // Update audio volumes when sliders change
    useEffect(() => {
        // Calculate actual volumes by applying master volume percentage
        const actualMusicVolume = (musicVolume / 100) * (masterVolume / 100);
        const actualSoundEffectsVolume = (soundEffectsVolume / 100) * (masterVolume / 100);

        // Update music volume
        if (backgroundMusicRef?.current) {
            backgroundMusicRef.current.volume = actualMusicVolume;
        }

        // Create an array of all sound effect references with their names for better debugging
        const soundRefsWithNames = [
            { name: "attackSound", ref: attackSoundRef?.current },
            { name: "correctAnswerSound", ref: correctAnswerSoundRef?.current },
            { name: "incorrectAnswerSound", ref: incorrectAnswerSoundRef?.current },
            { name: "correctSfx", ref: correctSfxRef?.current },
            { name: "incorrectSfx", ref: incorrectSfxRef?.current }
        ].filter(({ ref }) => ref !== null && ref !== undefined);

        // Update each sound effect volume individually
        soundRefsWithNames.forEach(({ name, ref }) => {
            if (ref) {
                ref.volume = actualSoundEffectsVolume;
            }
        });

        // Store the current volume settings in localStorage for persistence
        localStorage.setItem('duel-learn-audio-settings', JSON.stringify({
            master: masterVolume,
            music: musicVolume,
            effects: soundEffectsVolume
        }));
    }, [masterVolume, musicVolume, soundEffectsVolume, backgroundMusicRef, attackSoundRef, correctAnswerSoundRef, incorrectAnswerSoundRef, correctSfxRef, incorrectSfxRef]);

    // Load saved volume settings from localStorage on initial render
    useEffect(() => {
        if (isOpen) {
            try {
                const savedSettings = localStorage.getItem('duel-learn-audio-settings');
                if (savedSettings) {
                    const { master, music, effects } = JSON.parse(savedSettings);
                    setMasterVolume(master);
                    setMusicVolume(music);
                    setSoundEffectsVolume(effects);
                    console.log("Loaded saved audio settings:", { master, music, effects });
                }
            } catch (error) {
                console.error("Error loading saved audio settings:", error);
            }
        }
    }, [isOpen, setMasterVolume, setMusicVolume, setSoundEffectsVolume]);

    // Function to handle leave game confirmation
    const handleLeaveGameClick = () => {
        const confirmLeave = window.confirm(
            "Are you sure you want to leave the battle? Leaving will count as a defeat for you and a victory for your opponent with minimal rewards."
        );

        if (confirmLeave) {
            // Just call the passed-in onLeaveGame function
            onLeaveGame();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-[#0F0E17] rounded-lg p-6 max-w-md w-full text-white">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Sound Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium mb-4">Audio Settings</h3>
                        <div className="flex items-center gap-4">
                            <span className="w-32 text-sm">Master Volume</span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={masterVolume}
                                onChange={(e) => setMasterVolume(parseInt(e.target.value))}
                                className="flex-grow h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="w-8 text-right text-sm">{masterVolume}</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium mb-4">Audio Balance</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="w-32 text-sm">Music</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={musicVolume}
                                    onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                                    className="flex-grow h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-8 text-right text-sm">{musicVolume}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="w-32 text-sm">Sound Effects</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={soundEffectsVolume}
                                    onChange={(e) => setSoundEffectsVolume(parseInt(e.target.value))}
                                    className="flex-grow h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-8 text-right text-sm">{soundEffectsVolume}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <button
                            onClick={handleLeaveGameClick}
                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md w-full"
                        >
                            Leave Game
                        </button>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            Note: Leaving the game will end your session and you will not earn any XP for this session.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 