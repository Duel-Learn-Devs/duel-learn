import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface SoundSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLeaveGame: () => void;
    backgroundMusicRef: React.RefObject<HTMLAudioElement>;
    attackSoundRef: React.RefObject<HTMLAudioElement>;
    correctAnswerSoundRef: React.RefObject<HTMLAudioElement>;
    incorrectAnswerSoundRef: React.RefObject<HTMLAudioElement>;
    correctSfxRef: React.RefObject<HTMLAudioElement>;
    incorrectSfxRef: React.RefObject<HTMLAudioElement>;
    decreaseHealthSoundRef: React.RefObject<HTMLAudioElement>;
    healthAttackSoundRef: React.RefObject<HTMLAudioElement>;
    healRegenSoundRef: React.RefObject<HTMLAudioElement>;
    regenerationSfxRef?: React.RefObject<HTMLAudioElement>;
    selectedCardSoundRef?: React.RefObject<HTMLAudioElement>;
    noSelectedCardSoundRef?: React.RefObject<HTMLAudioElement>;
    timeManipulationActivateSoundRef?: React.RefObject<HTMLAudioElement>;
    timeManipulationEffectSoundRef?: React.RefObject<HTMLAudioElement>;
    quickDrawUserSoundRef?: React.RefObject<HTMLAudioElement>;
    quickDrawEnemySoundRef?: React.RefObject<HTMLAudioElement>;
    answerShieldActivatedSoundRef?: React.RefObject<HTMLAudioElement>;
    answerShieldDamagedSoundRef?: React.RefObject<HTMLAudioElement>;
    mindControlActivateSoundRef?: React.RefObject<HTMLAudioElement>;
    mindControlEffectSoundRef?: React.RefObject<HTMLAudioElement>;
    victorySoundRef?: React.RefObject<HTMLAudioElement>;
    defeatSoundRef?: React.RefObject<HTMLAudioElement>;
    leftGameSoundRef?: React.RefObject<HTMLAudioElement>;
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
    decreaseHealthSoundRef,
    healthAttackSoundRef,
    healRegenSoundRef,
    regenerationSfxRef,
    selectedCardSoundRef,
    noSelectedCardSoundRef,
    timeManipulationActivateSoundRef,
    timeManipulationEffectSoundRef,
    quickDrawUserSoundRef,
    quickDrawEnemySoundRef,
    answerShieldActivatedSoundRef,
    answerShieldDamagedSoundRef,
    mindControlActivateSoundRef,
    mindControlEffectSoundRef,
    victorySoundRef,
    defeatSoundRef,
    leftGameSoundRef,
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
        if (isOpen && backgroundMusicRef.current) {
            // Only set initial values if they haven't been changed by the user
            if (musicVolume === 100) {
                setMusicVolume(Math.round(backgroundMusicRef.current.volume * 100));
            }

            // Assuming all sound effects have the same volume initially
            if (soundEffectsVolume === 100 && attackSoundRef.current) {
                setSoundEffectsVolume(Math.round(attackSoundRef.current.volume * 100));
            }
        }
    }, [isOpen, backgroundMusicRef, attackSoundRef, musicVolume, soundEffectsVolume, setMusicVolume, setSoundEffectsVolume]);

    // Update audio volumes when sliders change
    useEffect(() => {
        // Calculate actual volumes by applying master volume percentage
        const actualMusicVolume = (musicVolume / 100) * (masterVolume / 100);
        const actualSoundEffectsVolume = (soundEffectsVolume / 100) * (masterVolume / 100);

        // Update music volume
        if (backgroundMusicRef.current) {
            backgroundMusicRef.current.volume = actualMusicVolume;
            console.log("Updated background music volume to:", actualMusicVolume);
        }

        // Create an array of all sound effect references with their names for better debugging
        const soundRefsWithNames = [
            { name: "attackSound", ref: attackSoundRef.current },
            { name: "correctAnswerSound", ref: correctAnswerSoundRef.current },
            { name: "incorrectAnswerSound", ref: incorrectAnswerSoundRef.current },
            { name: "correctSfx", ref: correctSfxRef.current },
            { name: "incorrectSfx", ref: incorrectSfxRef.current },
            { name: "decreaseHealthSound", ref: decreaseHealthSoundRef.current },
            { name: "healthAttackSound", ref: healthAttackSoundRef.current },
            { name: "healRegenSound", ref: healRegenSoundRef.current },
            { name: "regenerationSfx", ref: regenerationSfxRef?.current },
            { name: "selectedCardSound", ref: selectedCardSoundRef?.current },
            { name: "noSelectedCardSound", ref: noSelectedCardSoundRef?.current },
            { name: "timeManipulationActivateSound", ref: timeManipulationActivateSoundRef?.current },
            { name: "timeManipulationEffectSound", ref: timeManipulationEffectSoundRef?.current },
            { name: "quickDrawUserSound", ref: quickDrawUserSoundRef?.current },
            { name: "quickDrawEnemySound", ref: quickDrawEnemySoundRef?.current },
            { name: "answerShieldActivatedSound", ref: answerShieldActivatedSoundRef?.current },
            { name: "answerShieldDamagedSound", ref: answerShieldDamagedSoundRef?.current },
            { name: "mindControlActivateSound", ref: mindControlActivateSoundRef?.current },
            { name: "mindControlEffectSound", ref: mindControlEffectSoundRef?.current },
            { name: "victorySound", ref: victorySoundRef?.current },
            { name: "defeatSound", ref: defeatSoundRef?.current },
            { name: "leftGameSound", ref: leftGameSoundRef?.current }
        ];

        // Update each sound effect volume individually and log for debugging
        soundRefsWithNames.forEach(({ name, ref }) => {
            if (ref) {
                // Store original volume for debugging
                const originalVolume = ref.volume;

                // Set the new volume
                ref.volume = actualSoundEffectsVolume;

                // Log the change
                console.log(`Updated ${name} volume: ${originalVolume} -> ${actualSoundEffectsVolume}`);
            } else {
                console.log(`${name} reference is null or undefined`);
            }
        });

        // Also store the current volume settings in localStorage for persistence
        localStorage.setItem('duel-learn-audio-settings', JSON.stringify({
            master: masterVolume,
            music: musicVolume,
            effects: soundEffectsVolume
        }));
    }, [masterVolume, musicVolume, soundEffectsVolume, backgroundMusicRef, attackSoundRef, correctAnswerSoundRef, incorrectAnswerSoundRef, correctSfxRef, incorrectSfxRef, decreaseHealthSoundRef, healthAttackSoundRef, healRegenSoundRef, regenerationSfxRef, selectedCardSoundRef, noSelectedCardSoundRef, timeManipulationActivateSoundRef, timeManipulationEffectSoundRef, quickDrawUserSoundRef, quickDrawEnemySoundRef, answerShieldActivatedSoundRef, answerShieldDamagedSoundRef, mindControlActivateSoundRef, mindControlEffectSoundRef, victorySoundRef, defeatSoundRef, leftGameSoundRef]);

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
            "Are you sure you want to leave the battle? You will lose 100 XP and your win streak will reset to 0. The battle will count as a defeat for you and a victory for your opponent."
        );

        if (confirmLeave) {
            // First close the modal
            onClose();

            // Then call the leave game function
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
                            Note: Leaving will deduct 100 XP, reset your win streak to 0, and count as a defeat.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 