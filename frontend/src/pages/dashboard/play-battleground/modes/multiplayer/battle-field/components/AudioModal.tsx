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
    // Create audio context and gain nodes
    const audioContextRef = useRef<AudioContext | null>(null);
    const musicGainNodeRef = useRef<GainNode | null>(null);
    const effectsGainNodeRef = useRef<GainNode | null>(null);
    const connectedElementsRef = useRef<Set<HTMLAudioElement>>(new Set());

    // Initialize audio context and gain nodes
    useEffect(() => {
        if (!isOpen) return;

        // Create audio context if it doesn't exist
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
        }

        // Create gain nodes if they don't exist
        if (!musicGainNodeRef.current) {
            musicGainNodeRef.current = audioContextRef.current.createGain();
            musicGainNodeRef.current.connect(audioContextRef.current.destination);
        }
        if (!effectsGainNodeRef.current) {
            effectsGainNodeRef.current = audioContextRef.current.createGain();
            effectsGainNodeRef.current.connect(audioContextRef.current.destination);
        }

        // Connect audio elements to gain nodes if not already connected
        const connectAudioElement = (element: HTMLAudioElement | null, gainNode: GainNode) => {
            if (!element || connectedElementsRef.current.has(element)) return;
            
            try {
                const source = audioContextRef.current!.createMediaElementSource(element);
                source.connect(gainNode);
                connectedElementsRef.current.add(element);
            } catch (error) {
                console.error("Error connecting audio element:", error);
            }
        };

        // Connect background music
        if (backgroundMusicRef?.current) {
            connectAudioElement(backgroundMusicRef.current, musicGainNodeRef.current);
        }

        // Connect sound effects
        const soundRefs = [
            attackSoundRef?.current,
            correctAnswerSoundRef?.current,
            incorrectAnswerSoundRef?.current,
            correctSfxRef?.current,
            incorrectSfxRef?.current
        ].filter(Boolean);

        soundRefs.forEach(ref => {
            if (ref) {
                connectAudioElement(ref, effectsGainNodeRef.current!);
            }
        });

        return () => {
            // Cleanup when modal closes
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            musicGainNodeRef.current = null;
            effectsGainNodeRef.current = null;
            connectedElementsRef.current.clear();
        };
    }, [isOpen, backgroundMusicRef, attackSoundRef, correctAnswerSoundRef, incorrectAnswerSoundRef, correctSfxRef, incorrectSfxRef]);

    // Update audio volumes when sliders change
    useEffect(() => {
        if (!audioContextRef.current || !musicGainNodeRef.current || !effectsGainNodeRef.current) return;

        // Calculate actual volumes by applying master volume percentage
        const actualMusicVolume = (musicVolume / 100) * (masterVolume / 100);
        const actualSoundEffectsVolume = (soundEffectsVolume / 100) * (masterVolume / 100);

        // Update gain nodes
        musicGainNodeRef.current.gain.value = actualMusicVolume;
        effectsGainNodeRef.current.gain.value = actualSoundEffectsVolume;

        // Store the current volume settings in localStorage for persistence
        localStorage.setItem('duel-learn-audio-settings', JSON.stringify({
            master: masterVolume,
            music: musicVolume,
            effects: soundEffectsVolume
        }));
    }, [masterVolume, musicVolume, soundEffectsVolume]);

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