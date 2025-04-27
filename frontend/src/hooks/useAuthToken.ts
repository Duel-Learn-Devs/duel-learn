import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { setAuthToken } from '../api/apiClient';

/**
 * Hook to synchronize the auth token from AuthContext with the API client.
 * This should be used at the application root level to ensure all API calls
 * have access to the current authentication token.
 */
const useAuthToken = () => {
  const { token, getToken } = useAuth();

  // Update API client token when the auth token changes
  useEffect(() => {
    console.log('🔄 Token changed in AuthContext, updating apiClient token');
    setAuthToken(token);
  }, [token]);

  // Set up a token refresh mechanism
  useEffect(() => {
    // Initial token fetch
    const fetchToken = async () => {
      console.log('🔍 Fetching fresh token from AuthContext');
      const freshToken = await getToken();
      if (freshToken) {
        console.log('✅ Fresh token obtained and set in apiClient');
        setAuthToken(freshToken);
      } else {
        console.warn('⚠️ Failed to get fresh token from AuthContext');
      }
    };

    fetchToken();

    // Set up token refresh interval (every 55 minutes)
    // Firebase tokens typically expire after 1 hour, so refresh a bit before that
    const intervalId = setInterval(fetchToken, 55 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [getToken]);

  return null;
};

export default useAuthToken; 