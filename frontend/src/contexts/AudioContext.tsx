"use client";

import type React from "react";
import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface AudioContextType {
  playStartAudio: () => Promise<void>;
  playLoopAudio: () => Promise<void>;
  playPeacefulModeAudio: () => Promise<void>;
  playUserOnboardingAudio: () => Promise<void>;
  playTimePressuredAudio: () => Promise<void>;
  playPvPModeAudio: () => Promise<void>;
  updateTimePressuredIntensity: (secondsLeft: number | null, timeLimit: number) => void;
  pauseAudio: () => void;
  isPlaying: boolean;
  currentTrack: string | null;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const startAudioRef = useRef<HTMLAudioElement | null>(null);
  const loopAudioRef = useRef<HTMLAudioElement | null>(null);
  const peacefulModeAudioRef = useRef<HTMLAudioElement | null>(null);
  const userOnboardingAudioRef = useRef<HTMLAudioElement | null>(null);
  const timePressuredAudioRef = useRef<HTMLAudioElement | null>(null);
  const timePressuredSpeedUpAudioRef = useRef<HTMLAudioElement | null>(null);
  const pvpModeAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [speedUpActive, setSpeedUpActive] = useState(false);
  const [vignetteActive, setVignetteActive] = useState(false);
  const [heartbeatActive, setHeartbeatActive] = useState(false);
  
  const location = useLocation();

  useEffect(() => {
    console.log('AudioContext: Initializing audio references...');
    
    const audioFiles = {
      start: "/sounds-sfx/WELCOME_START.mp3",
      loop: "/sounds-sfx/WELCOME_LOOP.mp3",
      peaceful: "/sounds-sfx/peacefulMode.mp3",
      onboarding: "/sounds-sfx/user_onboarding.mp3",
      timePressured: "/sounds-sfx/time_pressured.mp3",
      timePressuredSpeedUp: "/sounds-sfx/time_pressured_speed_up.mp3",
      pvp: "/sounds-sfx/idle_pvp.mp3"
    };

    // Check if files exist first before creating audio elements
    const checkFiles = async () => {
      try {
        for (const [key, path] of Object.entries(audioFiles)) {
          try {
            const response = await fetch(path);
            if (!response.ok) {
              console.error(`Audio file ${key} not found at ${path}: HTTP ${response.status}`);
            } else {
              console.log(`Audio file ${key} exists at ${path}`);
            }
          } catch (error) {
            console.error(`Error checking audio file ${key}:`, error);
          }
        }
        
        // Initialize audio elements after checking
        initializeAudio();
      } catch (error) {
        console.error('Error in file check process:', error);
      }
    };

    const initializeAudio = () => {
      try {
        startAudioRef.current = new Audio(audioFiles.start);
        loopAudioRef.current = new Audio(audioFiles.loop);
        peacefulModeAudioRef.current = new Audio(audioFiles.peaceful);
        userOnboardingAudioRef.current = new Audio(audioFiles.onboarding);
        timePressuredAudioRef.current = new Audio(audioFiles.timePressured);
        timePressuredSpeedUpAudioRef.current = new Audio(audioFiles.timePressuredSpeedUp);
        pvpModeAudioRef.current = new Audio(audioFiles.pvp);

        console.log('Audio elements created successfully');

        // Configure loop settings for audio elements
        if (loopAudioRef.current) loopAudioRef.current.loop = true;
        if (peacefulModeAudioRef.current) peacefulModeAudioRef.current.loop = true;
        if (userOnboardingAudioRef.current) userOnboardingAudioRef.current.loop = true;
        if (timePressuredAudioRef.current) timePressuredAudioRef.current.loop = true;
        if (timePressuredSpeedUpAudioRef.current) {
          timePressuredSpeedUpAudioRef.current.loop = true;
          timePressuredSpeedUpAudioRef.current.volume = 0; // Start muted
        }
        if (pvpModeAudioRef.current) pvpModeAudioRef.current.loop = true;

        // Preload audio files
        const preloadAudio = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
          if (audioRef.current) {
            audioRef.current.preload = "auto";
            audioRef.current.load();
          }
        };
        
        preloadAudio(startAudioRef);
        preloadAudio(loopAudioRef);
        preloadAudio(peacefulModeAudioRef);
        preloadAudio(userOnboardingAudioRef);
        preloadAudio(timePressuredAudioRef);
        preloadAudio(timePressuredSpeedUpAudioRef);
        preloadAudio(pvpModeAudioRef);
        
        // Set up event listeners
        const handleStartAudioEnded = () => {
          if (loopAudioRef.current) {
            loopAudioRef.current.play().catch((error) => console.error("Error playing loop audio:", error));
            setCurrentTrack("loop");
          }
        };

        if (startAudioRef.current) {
          startAudioRef.current.addEventListener("ended", handleStartAudioEnded);
        }

        // Mark audio as loaded
        setAudioLoaded(true);

      } catch (error) {
        console.error('Error initializing audio elements:', error);
      }
    };

    checkFiles();

    // Cleanup function
    return () => {
      const stopAndCleanRef = (ref: React.MutableRefObject<HTMLAudioElement | null>) => {
        if (ref.current) {
          ref.current.pause();
          ref.current = null;
        }
      };
      
      if (startAudioRef.current) {
        startAudioRef.current.removeEventListener("ended", () => {});
      }
      
      stopAndCleanRef(startAudioRef);
      stopAndCleanRef(loopAudioRef);
      stopAndCleanRef(peacefulModeAudioRef);
      stopAndCleanRef(userOnboardingAudioRef);
      stopAndCleanRef(timePressuredAudioRef);
      stopAndCleanRef(timePressuredSpeedUpAudioRef);
      stopAndCleanRef(pvpModeAudioRef);
      
      setIsPlaying(false);
      setCurrentTrack(null);
      setSpeedUpActive(false);
      setVignetteActive(false);
      setHeartbeatActive(false);
    };
  }, []);

  // Helper function to stop all audio
  const stopAllAudio = useCallback(() => {
    const refs = [
      startAudioRef,
      loopAudioRef,
      peacefulModeAudioRef,
      userOnboardingAudioRef,
      timePressuredAudioRef,
      timePressuredSpeedUpAudioRef,
      pvpModeAudioRef
    ];
    
    refs.forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    
    setIsPlaying(false);
    setSpeedUpActive(false);
    setVignetteActive(false);
    setHeartbeatActive(false);
  }, []);

  const playStartAudio = useCallback(async () => {
    if (!audioLoaded) {
      console.warn("Audio files not fully loaded yet");
      return;
    }
    
    stopAllAudio();
    
    if (startAudioRef.current) {
      try {
        console.log("Attempting to play start audio");
        startAudioRef.current.volume = 1.0;
        await startAudioRef.current.play();
        setIsPlaying(true);
        setCurrentTrack("start");
        console.log("Start audio playing successfully");
      } catch (error) {
        console.error("Error playing start audio:", error);
      }
    }
  }, [audioLoaded, stopAllAudio]);

  const playLoopAudio = useCallback(async () => {
    if (!audioLoaded) return;
    
    stopAllAudio();
    
    if (loopAudioRef.current) {
      try {
        loopAudioRef.current.volume = 1.0;
        await loopAudioRef.current.play();
        setIsPlaying(true);
        setCurrentTrack("loop");
      } catch (error) {
        console.error("Error playing loop audio:", error);
      }
    }
  }, [audioLoaded, stopAllAudio]);

  const playPeacefulModeAudio = useCallback(async () => {
    if (!audioLoaded) {
      console.warn("Audio files not fully loaded yet");
      return;
    }
    
    stopAllAudio();
    
    if (peacefulModeAudioRef.current) {
      try {
        console.log('Starting Peaceful Mode audio...');
        peacefulModeAudioRef.current.volume = 0;
        await peacefulModeAudioRef.current.play();
        
        // Fade in the volume
        let volume = 0;
        const fadeIn = setInterval(() => {
          volume += 0.05;
          if (peacefulModeAudioRef.current) {
            peacefulModeAudioRef.current.volume = Math.min(1, volume);
          }
          if (volume >= 1) {
            clearInterval(fadeIn);
          }
        }, 50);
        
        setIsPlaying(true);
        setCurrentTrack("peaceful");
        console.log('Peaceful Mode audio started successfully');
      } catch (error) {
        console.error("Error playing peaceful mode audio:", error);
      }
    }
  }, [audioLoaded, stopAllAudio]);

  const playUserOnboardingAudio = useCallback(async () => {
    if (!audioLoaded) return;
    
    stopAllAudio();
    
    if (userOnboardingAudioRef.current) {
      try {
        userOnboardingAudioRef.current.volume = 1.0;
        await userOnboardingAudioRef.current.play();
        setIsPlaying(true);
        setCurrentTrack("onboarding");
      } catch (error) {
        console.error("Error playing user onboarding audio:", error);
      }
    }
  }, [audioLoaded, stopAllAudio]);

  const playTimePressuredAudio = useCallback(async () => {
    if (!audioLoaded) {
      console.warn("Audio files not fully loaded yet");
      return;
    }
    
    stopAllAudio();
    
    if (timePressuredAudioRef.current && timePressuredSpeedUpAudioRef.current) {
      try {
        console.log('Starting Time Pressured audio...');
        
        // Start with base audio only
        timePressuredAudioRef.current.volume = 0;
        timePressuredSpeedUpAudioRef.current.volume = 0;
        timePressuredAudioRef.current.muted = false;
        timePressuredSpeedUpAudioRef.current.muted = false;
        
        // Start both tracks but keep speed-up at 0 volume
        await timePressuredAudioRef.current.play();
        
        // Also pre-load the speed-up audio but keep it muted until needed
        timePressuredSpeedUpAudioRef.current.currentTime = 0;
        await timePressuredSpeedUpAudioRef.current.play();
        timePressuredSpeedUpAudioRef.current.volume = 0;
        
        console.log('Base and speed-up audio playback started!');
        
        // Fade in only the base track
        let volume = 0;
        const fadeIn = setInterval(() => {
          volume += 0.05;
          if (timePressuredAudioRef.current) {
            timePressuredAudioRef.current.volume = Math.min(0.8, volume); // Base at 80% max
          }
          if (volume >= 0.8) {
            clearInterval(fadeIn);
          }
        }, 50);
        
        setIsPlaying(true);
        setCurrentTrack("timePressured");
      } catch (error) {
        console.error("Error playing time pressured audio:", error);
      }
    }
  }, [audioLoaded, stopAllAudio]);

  // Function to update time-pressured intensity based on the timer
  const updateTimePressuredIntensity = useCallback((secondsLeft: number | null, timeLimit: number) => {
    if (!audioLoaded || !timePressuredAudioRef.current || !timePressuredSpeedUpAudioRef.current) {
      return;
    }
    
    // Only proceed if we're playing the time-pressured track
    if (currentTrack !== "timePressured") {
      return;
    }
    
    // Calculate key thresholds
    const halfTimeLimit = timeLimit / 2;
    const criticalThreshold = 3; // When to start the heartbeat (3 seconds left)
    
    // Handle null or zero timer
    if (secondsLeft === null || secondsLeft === 0) {
      // Reset audio if needed
      if (speedUpActive || vignetteActive || heartbeatActive) {
        console.log("Timer reset or ended, resetting audio effects");
        
        // Fade out all audio effects
        if (timePressuredSpeedUpAudioRef.current && !timePressuredSpeedUpAudioRef.current.paused) {
          const fadeOutSpeedUp = setInterval(() => {
            if (timePressuredSpeedUpAudioRef.current) {
              timePressuredSpeedUpAudioRef.current.volume = Math.max(0, timePressuredSpeedUpAudioRef.current.volume - 0.1);
              
              if (timePressuredSpeedUpAudioRef.current.volume <= 0.05) {
                clearInterval(fadeOutSpeedUp);
                timePressuredSpeedUpAudioRef.current.pause();
              }
            } else {
              clearInterval(fadeOutSpeedUp);
            }
          }, 30);
        }
        
        // Restore base track volume
        if (timePressuredAudioRef.current && !timePressuredAudioRef.current.paused) {
          const fadeInBase = setInterval(() => {
            if (timePressuredAudioRef.current) {
              timePressuredAudioRef.current.volume = Math.min(0.8, timePressuredAudioRef.current.volume + 0.05);
              
              if (timePressuredAudioRef.current.volume >= 0.8) {
                clearInterval(fadeInBase);
              }
            } else {
              clearInterval(fadeInBase);
            }
          }, 30);
        }
        
        setSpeedUpActive(false);
        setVignetteActive(false);
        setHeartbeatActive(false);
      }
      return;
    }

    // VIGNETTE EFFECT AUDIO
    // Check if vignette effect should be active (timer at or below half time)
    if (secondsLeft <= halfTimeLimit && !vignetteActive) {
      console.log(`Vignette activated at ${secondsLeft}s - Activating vignette audio effect`);
      
      // Fade in speed-up track with medium intensity (when vignette appears)
      if (timePressuredSpeedUpAudioRef.current && !timePressuredSpeedUpAudioRef.current.paused) {
        const fadeInSpeedUp = setInterval(() => {
          if (timePressuredSpeedUpAudioRef.current) {
            timePressuredSpeedUpAudioRef.current.volume = Math.min(0.4, timePressuredSpeedUpAudioRef.current.volume + 0.02);
            
            if (timePressuredSpeedUpAudioRef.current.volume >= 0.4) {
              clearInterval(fadeInSpeedUp);
            }
          } else {
            clearInterval(fadeInSpeedUp);
          }
        }, 30);
      }
      
      // Reduce base track volume slightly
      if (timePressuredAudioRef.current && !timePressuredAudioRef.current.paused) {
        const fadeOutBase = setInterval(() => {
          if (timePressuredAudioRef.current) {
            timePressuredAudioRef.current.volume = Math.max(0.6, timePressuredAudioRef.current.volume - 0.02);
            
            if (timePressuredAudioRef.current.volume <= 0.6) {
              clearInterval(fadeOutBase);
            }
          } else {
            clearInterval(fadeOutBase);
          }
        }, 30);
      }
      
      setVignetteActive(true);
    } 
    // Turn off vignette effect if timer goes above half time
    else if (secondsLeft > halfTimeLimit && vignetteActive) {
      console.log('Exiting vignette zone - Fading out vignette audio effect');
      
      // Fade out speed-up track (when vignette disappears)
      if (timePressuredSpeedUpAudioRef.current && !timePressuredSpeedUpAudioRef.current.paused && !heartbeatActive) {
        const fadeOutSpeedUp = setInterval(() => {
          if (timePressuredSpeedUpAudioRef.current) {
            timePressuredSpeedUpAudioRef.current.volume = Math.max(0, timePressuredSpeedUpAudioRef.current.volume - 0.02);
            
            if (timePressuredSpeedUpAudioRef.current.volume <= 0.05) {
              clearInterval(fadeOutSpeedUp);
              // Only pause if heartbeat isn't active (which also uses this track)
              if (!heartbeatActive) {
                timePressuredSpeedUpAudioRef.current.pause();
              }
            }
          } else {
            clearInterval(fadeOutSpeedUp);
          }
        }, 30);
      }
      
      // Restore base track volume if heartbeat isn't active
      if (timePressuredAudioRef.current && !timePressuredAudioRef.current.paused && !heartbeatActive) {
        const fadeInBase = setInterval(() => {
          if (timePressuredAudioRef.current) {
            timePressuredAudioRef.current.volume = Math.min(0.8, timePressuredAudioRef.current.volume + 0.02);
            
            if (timePressuredAudioRef.current.volume >= 0.8) {
              clearInterval(fadeInBase);
            }
          } else {
            clearInterval(fadeInBase);
          }
        }, 30);
      }
      
      setVignetteActive(false);
    }

    // HEARTBEAT EFFECT AUDIO
    // Check if heartbeat effect should be active (timer at or below criticalThreshold)
    if (secondsLeft <= criticalThreshold && !heartbeatActive) {
      console.log(`Critical timer: ${secondsLeft}s - Activating heartbeat audio effect`);
      
      // Boost speed-up track volume to max (for heartbeat animation)
      if (timePressuredSpeedUpAudioRef.current) {
        const targetVolume = 0.9; // High volume for heartbeat effect
        
        const fadeInSpeedUp = setInterval(() => {
          if (timePressuredSpeedUpAudioRef.current) {
            timePressuredSpeedUpAudioRef.current.volume = Math.min(
              targetVolume, 
              timePressuredSpeedUpAudioRef.current.volume + 0.05
            );
            
            if (timePressuredSpeedUpAudioRef.current.volume >= targetVolume) {
              clearInterval(fadeInSpeedUp);
            }
          } else {
            clearInterval(fadeInSpeedUp);
          }
        }, 20);
      }
      
      // Reduce base track volume significantly during heartbeat
      if (timePressuredAudioRef.current) {
        const fadeOutBase = setInterval(() => {
          if (timePressuredAudioRef.current) {
            timePressuredAudioRef.current.volume = Math.max(0.3, timePressuredAudioRef.current.volume - 0.05);
            
            if (timePressuredAudioRef.current.volume <= 0.3) {
              clearInterval(fadeOutBase);
            }
          } else {
            clearInterval(fadeOutBase);
          }
        }, 20);
      }
      
      setHeartbeatActive(true);
      setSpeedUpActive(true); // Also set speed-up active
    } 
    // Turn off heartbeat effect but keep vignette if timer goes above criticalThreshold but below halfTimeLimit
    else if (secondsLeft > criticalThreshold && secondsLeft <= halfTimeLimit && heartbeatActive) {
      console.log('Exiting critical timer zone - Reducing heartbeat intensity but keeping vignette');
      
      // Reduce speed-up track volume but keep it above 0 for vignette effect
      if (timePressuredSpeedUpAudioRef.current) {
        const targetVolume = 0.4; // Medium volume for vignette effect
        
        const adjustSpeedUp = setInterval(() => {
          if (timePressuredSpeedUpAudioRef.current) {
            if (timePressuredSpeedUpAudioRef.current.volume > targetVolume) {
              timePressuredSpeedUpAudioRef.current.volume = Math.max(
                targetVolume,
                timePressuredSpeedUpAudioRef.current.volume - 0.05
              );
            }
            
            if (Math.abs(timePressuredSpeedUpAudioRef.current.volume - targetVolume) <= 0.05) {
              clearInterval(adjustSpeedUp);
            }
          } else {
            clearInterval(adjustSpeedUp);
          }
        }, 30);
      }
      
      // Increase base track volume a bit but keep it lower than normal for vignette effect
      if (timePressuredAudioRef.current) {
        const targetVolume = 0.6; // Medium volume for vignette effect
        
        const adjustBase = setInterval(() => {
          if (timePressuredAudioRef.current) {
            if (timePressuredAudioRef.current.volume < targetVolume) {
              timePressuredAudioRef.current.volume = Math.min(
                targetVolume,
                timePressuredAudioRef.current.volume + 0.05
              );
            }
            
            if (Math.abs(timePressuredAudioRef.current.volume - targetVolume) <= 0.05) {
              clearInterval(adjustBase);
            }
          } else {
            clearInterval(adjustBase);
          }
        }, 30);
      }
      
      setHeartbeatActive(false);
    }
    // Turn off both heartbeat and vignette effects if timer goes above halfTimeLimit
    else if (secondsLeft > halfTimeLimit && (heartbeatActive || vignetteActive)) {
      console.log('Timer back to normal range - Resetting all audio effects');
      
      // Reset speed-up track (fade out completely)
      if (timePressuredSpeedUpAudioRef.current && !timePressuredSpeedUpAudioRef.current.paused) {
        const fadeOutSpeedUp = setInterval(() => {
          if (timePressuredSpeedUpAudioRef.current) {
            timePressuredSpeedUpAudioRef.current.volume = Math.max(0, timePressuredSpeedUpAudioRef.current.volume - 0.05);
            
            if (timePressuredSpeedUpAudioRef.current.volume <= 0.05) {
              clearInterval(fadeOutSpeedUp);
              timePressuredSpeedUpAudioRef.current.pause();
            }
          } else {
            clearInterval(fadeOutSpeedUp);
          }
        }, 30);
      }
      
      // Restore base track volume to normal
      if (timePressuredAudioRef.current && !timePressuredAudioRef.current.paused) {
        const fadeInBase = setInterval(() => {
          if (timePressuredAudioRef.current) {
            timePressuredAudioRef.current.volume = Math.min(0.8, timePressuredAudioRef.current.volume + 0.05);
            
            if (timePressuredAudioRef.current.volume >= 0.8) {
              clearInterval(fadeInBase);
            }
          } else {
            clearInterval(fadeInBase);
          }
        }, 30);
      }
      
      setHeartbeatActive(false);
      setVignetteActive(false);
      setSpeedUpActive(false);
    }
    
    // Dynamic volume adjustment for heartbeat animation intensity
    // Make the audio more intense as the timer gets closer to 0
    if (secondsLeft <= criticalThreshold && heartbeatActive) {
      // Calculate target volumes based on remaining time
      // As time approaches 0, speed-up volume increases and base volume decreases
      if (timePressuredSpeedUpAudioRef.current && timePressuredAudioRef.current) {
        const speedUpTargetVolume = Math.min(0.95, 0.7 + (1 - secondsLeft/criticalThreshold) * 0.3);
        const baseTargetVolume = Math.max(0.2, 0.4 - (1 - secondsLeft/criticalThreshold) * 0.2);
        
        timePressuredSpeedUpAudioRef.current.volume = speedUpTargetVolume;
        timePressuredAudioRef.current.volume = baseTargetVolume;
      }
    }
  }, [audioLoaded, currentTrack, speedUpActive, vignetteActive, heartbeatActive]);

  // PvP Mode audio
  const playPvPModeAudio = useCallback(async () => {
    if (!audioLoaded) {
      console.warn("Audio files not fully loaded yet");
      return;
    }
    
    stopAllAudio();
    
    if (pvpModeAudioRef.current) {
      try {
        console.log('Starting PvP Mode audio...');
        pvpModeAudioRef.current.volume = 0;
        pvpModeAudioRef.current.muted = false;
        
        const playPromise = pvpModeAudioRef.current.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('PvP Mode audio playback started!');
              
          // Fade in the volume
          let volume = 0;
          const fadeIn = setInterval(() => {
            volume += 0.05;
            if (pvpModeAudioRef.current) {
              pvpModeAudioRef.current.volume = Math.min(1, volume);
            }
            if (volume >= 1) {
              clearInterval(fadeIn);
            }
          }, 50);
              
          setIsPlaying(true);
          setCurrentTrack("pvp");
        }
      } catch (error) {
        console.error("Error playing PvP mode audio:", error);
      }
    }
  }, [audioLoaded, stopAllAudio]);

  const pauseAudio = useCallback(() => {
    const fadeOutDuration = 1000;
    const fadeOutInterval = 50;
    
    const fadeOutAndStop = (ref: React.MutableRefObject<HTMLAudioElement | null>) => {
      if (ref.current && !ref.current.paused) {
        const initialVolume = ref.current.volume;
        const fadeStep = initialVolume / (fadeOutDuration / fadeOutInterval);
        
        const fadeOut = setInterval(() => {
          if (ref.current) {
            ref.current.volume = Math.max(0, ref.current.volume - fadeStep);
            
            if (ref.current.volume <= 0.05) {
              clearInterval(fadeOut);
              ref.current.pause();
              ref.current.volume = initialVolume; // Reset volume for next play
            }
          } else {
            clearInterval(fadeOut);
          }
        }, fadeOutInterval);
      }
    };
    
    fadeOutAndStop(startAudioRef);
    fadeOutAndStop(loopAudioRef);
    fadeOutAndStop(peacefulModeAudioRef);
    fadeOutAndStop(userOnboardingAudioRef);
    fadeOutAndStop(timePressuredAudioRef);
    fadeOutAndStop(timePressuredSpeedUpAudioRef);
    fadeOutAndStop(pvpModeAudioRef);
    
    setIsPlaying(false);
    setCurrentTrack(null);
    setSpeedUpActive(false);
    setVignetteActive(false);
    setHeartbeatActive(false);
  }, []);

  // Route-based audio control
  useEffect(() => {
    console.log('Route changed to:', location.pathname);
    if (location.pathname === "/welcome") {
      playStartAudio();
    } else if (location.pathname === "/my-preferences") {
      if (currentTrack === "start" || currentTrack === "loop") {
        pauseAudio();
      }
    } else if (location.pathname === "/tutorial/step-two") {
      playUserOnboardingAudio();
    } else if (location.pathname === "/dashboard/home") {
      pauseAudio();
    } else if (location.pathname.includes("/dashboard/play-battleground/modes/time-pressured")) {
      playTimePressuredAudio();
    } else if (location.pathname.includes("/dashboard/play-battleground/modes/pvp")) {
      playPvPModeAudio();
    }
  }, [
    location.pathname, 
    playStartAudio, 
    playUserOnboardingAudio, 
    pauseAudio, 
    playTimePressuredAudio, 
    playPvPModeAudio,
    currentTrack
  ]);

  return (
    <AudioContext.Provider value={{ 
      playStartAudio, 
      playLoopAudio, 
      playPeacefulModeAudio, 
      playUserOnboardingAudio, 
      playTimePressuredAudio,
      playPvPModeAudio,
      updateTimePressuredIntensity,
      pauseAudio, 
      isPlaying,
      currentTrack 
    }}>
      {children}
    </AudioContext.Provider>
  );
};