import { useEffect } from 'react';
import { useSnackbar } from '../contexts/SnackbarContext';
import { setSnackbarFunction } from '../api/apiClient';

// Component to connect the Snackbar context with our API client
const SnackbarConnector: React.FC = () => {
  const { showSnackbar } = useSnackbar();
  
  useEffect(() => {
    // Set the showSnackbar function to be used by the API client
    setSnackbarFunction(showSnackbar);
  }, [showSnackbar]);
  
  return null;
};

export default SnackbarConnector; 