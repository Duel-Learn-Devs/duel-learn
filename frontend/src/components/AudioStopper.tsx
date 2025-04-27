import { useEffect } from "react";
import { useAudio } from "../contexts/AudioContext";
import { useLocation } from "react-router-dom";

interface AudioStopperProps {
  stopOnRoutes?: string[];
}

/**
 * Component that monitors routes and stops audio when user navigates to specific pages.
 * Can be placed in app layout components to ensure cleanup.
 */
const AudioStopper: React.FC<AudioStopperProps> = ({
  stopOnRoutes = ["/dashboard/home", "/dashboard/session-complete"],
}) => {
  const { stopAllAudio, activeAudio } = useAudio();
  const location = useLocation();

  useEffect(() => {
    // Check if current path matches any of the stop routes
    const shouldStopAudio = stopOnRoutes.some((route) =>
      location.pathname.includes(route)
    );

    if (shouldStopAudio && activeAudio) {
      console.log("AudioStopper: Stopping audio on route:", location.pathname);
      stopAllAudio();
    }
  }, [location.pathname, stopAllAudio, activeAudio, stopOnRoutes]);

  // This is a utility component that doesn't render anything
  return null;
};

export default AudioStopper;
