import useAuthToken from '../hooks/useAuthToken';

/**
 * Component that synchronizes the authentication token between
 * the AuthContext and the API client. This is a utility component
 * with no visual output - it only handles the token synchronization logic.
 */
const AuthTokenSynchronizer: React.FC = () => {
  // Use the hook to synchronize tokens
  useAuthToken();
  
  // This component doesn't render anything
  return null;
};

export default AuthTokenSynchronizer; 