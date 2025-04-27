import { useLocation, Navigate } from "react-router-dom";
import { GameState } from "../../types/index";

interface GameModeWrapperProps {
  children: (props: GameState) => React.ReactNode;
}

const GameModeWrapper: React.FC<GameModeWrapperProps> = ({ children }) => {
  const location = useLocation();
  const state = location.state as GameState;

  if (!state?.mode || !state?.selectedTypes) {
    return <Navigate to="/dashboard/home" />;
  }

  return <>{children(state)}</>;
};

export default GameModeWrapper;
