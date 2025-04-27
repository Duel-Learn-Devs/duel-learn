import React, { createContext, useContext, useState } from 'react';

type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

type SnackbarContextType = {
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
  closeSnackbar: () => void;
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: SnackbarSeverity;
};

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>('info');

  const showSnackbar = (message: string, severity: SnackbarSeverity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <SnackbarContext.Provider
      value={{
        showSnackbar,
        closeSnackbar,
        snackbarOpen,
        snackbarMessage,
        snackbarSeverity
      }}
    >
      {children}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}; 