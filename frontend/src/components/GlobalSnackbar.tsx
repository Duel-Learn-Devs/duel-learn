import React from 'react';
import { useSnackbar } from '../contexts/SnackbarContext';
import AutoHideSnackbar from './ErrorsSnackbar';

const GlobalSnackbar: React.FC = () => {
  const { snackbarOpen, snackbarMessage, closeSnackbar, snackbarSeverity } = useSnackbar();

  return (
    <AutoHideSnackbar
      message={snackbarMessage}
      open={snackbarOpen}
      onClose={closeSnackbar}
      action={snackbarSeverity === 'error'}
    />
  );
};

export default GlobalSnackbar; 