import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StudyMaterial {
  id?: string;
  study_material_id?: string;
  title: string;
  items?: any[];
  [key: string]: any;
}

interface BattleSetupContextType {
  // Lobby Information
  lobbyCode: string;
  setLobbyCode: (code: string) => void;
  
  // Player Information
  hostUsername: string;
  setHostUsername: (username: string) => void;
  guestUsername: string;
  setGuestUsername: (username: string) => void;
  hostId: string;
  setHostId: (id: string) => void;
  guestId: string;
  setGuestId: (id: string) => void;
  
  // Game Settings
  selectedMaterial: StudyMaterial | null;
  setSelectedMaterial: (material: StudyMaterial | null) => void;
  questionTypes: string[];
  setQuestionTypes: (types: string[]) => void;
  
  // Battle State
  isHost: boolean;
  setIsHost: (isHost: boolean) => void;
  difficulty: string;
  setDifficulty: (difficulty: string) => void;
}

const BattleSetupContext = createContext<BattleSetupContextType | undefined>(undefined);

export const BattleSetupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lobbyCode, setLobbyCode] = useState<string>('');
  const [hostUsername, setHostUsername] = useState<string>('');
  const [guestUsername, setGuestUsername] = useState<string>('');
  const [hostId, setHostId] = useState<string>('');
  const [guestId, setGuestId] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<string>('');

  const value = {
    lobbyCode,
    setLobbyCode,
    hostUsername,
    setHostUsername,
    guestUsername,
    setGuestUsername,
    hostId,
    setHostId,
    guestId,
    setGuestId,
    selectedMaterial,
    setSelectedMaterial,
    questionTypes,
    setQuestionTypes,
    isHost,
    setIsHost,
    difficulty,
    setDifficulty,
  };

  return (
    <BattleSetupContext.Provider value={value}>
      {children}
    </BattleSetupContext.Provider>
  );
};

export const useBattleSetup = () => {
  const context = useContext(BattleSetupContext);
  if (context === undefined) {
    throw new Error('useBattleSetup must be used within a BattleSetupProvider');
  }
  return context;
};