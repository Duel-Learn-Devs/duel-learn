import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { 
  Box, 
  Button, 
  Checkbox,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle, 
  Chip,
  Typography,
  CircularProgress,
  Stack
} from "@mui/material";
import apiClient from "../../api/apiClient";
import { useUser } from "../../contexts/UserContext";
import { auth } from "../../services/firebase";
import DocumentHead from "../../components/DocumentHead";
import PageTransition from "../../styles/PageTransition";
import { AxiosError } from "axios";
import { styled } from '@mui/material/styles';
import LoadingScreen from "../../components/LoadingScreen";

interface User {
  firebase_uid: string;
  username: string;
  email: string;
  existInSQL: boolean;
  existInFirebaseAuth: boolean;
  existInFirestore: boolean;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: '#1a1a1f',
  color: '#fff',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
}));

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: '#1e1e24',
  color: '#fff',
  fontWeight: 600,
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

const AdminDashboard = () => {
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Update effect to wait for user context to be available
  useEffect(() => {
    // Only fetch users when user context is available
    if (user && user.firebase_uid) {
      fetchInitialUsers();
    } else if (user === null) {
      // If user context has been checked and is null, show auth error
      // The useUser hook will set user to null when auth is complete but unsuccessful
      console.log("Authentication incomplete - waiting for user context to be ready");
      // Keep initialLoading true, but we could set an auth error message here
    }
  }, [user]); // Depend on user context changes

  // Function to handle auth status checking with timeout
  useEffect(() => {
    // Set a timeout to check if authentication is taking too long
    const authTimeout = setTimeout(() => {
      if (initialLoading && !user) {
        console.log("Authentication timed out or failed");
        // Try again with current auth state
        fetchInitialUsersWithAuth();
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(authTimeout);
  }, []);

  // Try to fetch users with current auth state, even if not ideal
  const fetchInitialUsersWithAuth = async () => {
    setLoading(true);
    try {
      console.log("Attempting to fetch users with current auth state...");
      const currentFirebaseUser = auth.currentUser;
      
      // If we have Firebase user but not user context, try to use Firebase token
      if (currentFirebaseUser) {
        const token = await currentFirebaseUser.getIdToken(true);
        console.log("Using Firebase token for request");
        
        // Get user claims if any
        const claims = await currentFirebaseUser.getIdTokenResult();
        console.log("Token claims:", claims.claims);
        
        const response = await apiClient.get('/admin/users');
        if (Array.isArray(response.data.users)) {
          setUsers(response.data.users);
          setAuthError(null);
        } else {
          throw new Error("Invalid data format");
        }
      } else {
        // Try the request anyway - may fail with 401, which is handled in catch
        console.log("No auth user available, attempting request");
        const response = await apiClient.get('/admin/users');
        if (Array.isArray(response.data.users)) {
          setUsers(response.data.users);
          setAuthError(null);
        } else {
          throw new Error("Invalid data format");
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      
      // Check if the error is related to authentication
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        setAuthError("Authentication failed. Please try refreshing the users or reload the page.");
      } else if (axiosError.response) {
        console.log("Error status:", axiosError.response.status);
        console.log("Error data:", axiosError.response.data);
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Separate function for initial loading
  const fetchInitialUsers = async () => {
    setInitialLoading(true);
    setLoading(true);
    try {
      // Log user context for debugging
      console.log("Current user context:", user);
      console.log("User account type:", user?.account_type);
      console.log("User ID:", user?.firebase_uid);
      
      // Log Firebase current user
      const currentFirebaseUser = auth.currentUser;
      console.log("Firebase current user:", currentFirebaseUser);
      
      if (currentFirebaseUser) {
        // Get ID token and decode it
        const token = await currentFirebaseUser.getIdToken(true);
        console.log("ID token first 20 chars:", token.substring(0, 20) + "...");
        
        // Get user claims if any
        const claims = await currentFirebaseUser.getIdTokenResult();
        console.log("Token claims:", claims.claims);
      }

      const response = await apiClient.get('/admin/users');
      if (Array.isArray(response.data.users)) {
        setUsers(response.data.users);
        setAuthError(null);
      } else {
        throw new Error("Invalid data format");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      
      // Check the exact error response
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        setAuthError("Authentication failed. Please try refreshing the users or reload the page.");
      } else if (axiosError.response) {
        console.log("Error status:", axiosError.response.status);
        console.log("Error data:", axiosError.response.data);
      }
      
      // Note: Error handling is already managed by apiClient interceptors
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await apiClient.get('/admin/users');
      if (Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        throw new Error("Invalid data format");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Check the exact error response
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        setAuthError("Authentication failed. Please ensure you are logged in as an admin.");
      } else if (axiosError.response) {
        console.log("Error status:", axiosError.response.status);
        console.log("Error data:", axiosError.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllUsersConfirm = () => {
    setDeleteAllConfirmOpen(true);
  };

  const handleDeleteAllUsers = async () => {
    setLoading(true);
    try {
      await apiClient.delete('/admin/users', {
        data: {
          confirm: 'DELETE_ALL_USERS'
        }
      });
      
      // If we get here, it means the request was successful
      setUsers([]);
      setSelectedUsers([]);
      setDeleteAllConfirmOpen(false);
    } catch (error) {
      console.error("Error deleting all users:", error);
      // Note: Error handling is already managed by apiClient interceptors
    } finally {
      setLoading(false);
    }
  };

  const openDeleteUserConfirm = (firebase_uid: string) => {
    setUserToDelete(firebase_uid);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setLoading(true);
    try {
      // Find the user to check their existence flags
      const userToDeleteData = users.find(user => user.firebase_uid === userToDelete);
      
      if (!userToDeleteData) {
        console.error("User not found in the list");
        return;
      }
      
      // Check if user exists in any system
      const existsInAnySystem = userToDeleteData.existInFirebaseAuth || 
                              userToDeleteData.existInFirestore || 
                              userToDeleteData.existInSQL;
      
      if (!existsInAnySystem) {
        console.log("User doesn't exist in any system, removing from UI only");
        // Just remove from UI if not in any system
        setUsers(users.filter(user => user.firebase_uid !== userToDelete));
        if (selectedUsers.includes(userToDelete)) {
          setSelectedUsers(selectedUsers.filter(id => id !== userToDelete));
        }
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
        return;
      }

      await apiClient.delete(`/admin/users/${userToDelete}`);
      
      // If successful, update UI
      setUsers(users.filter(user => user.firebase_uid !== userToDelete));
      if (selectedUsers.includes(userToDelete)) {
        setSelectedUsers(selectedUsers.filter(id => id !== userToDelete));
      }
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error(`Error deleting user ${userToDelete}:`, error);
      // Note: Error handling is already managed by apiClient interceptors
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelection = (firebase_uid: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(firebase_uid)) {
        return prev.filter(id => id !== firebase_uid);
      } 
      return [...prev, firebase_uid];
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;
    
    setLoading(true);
    try {
      // Delete one by one
      for (const uid of selectedUsers) {
        await apiClient.delete(`/admin/users/${uid}`);
      }
      
      // Update UI
      setUsers(users.filter(user => !selectedUsers.includes(user.firebase_uid)));
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error deleting selected users:", error);
      // Note: Error handling is already managed by apiClient interceptors
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    const adminLoadingMessages = [
      "Securing the admin portal...",
      "Fetching user data...",
      "Analyzing system integrity...",
      "Preparing admin controls...",
      "Verifying admin privileges...",
      "Loading management interface...",
      "Scanning for magical anomalies in the user database...",
      "Preparing the admin console for the Grand Wizard...",
      "Summoning user data from the mystical database...",
      "Enchanting the admin dashboard...",
    ];
    
    const randomMessage = adminLoadingMessages[Math.floor(Math.random() * adminLoadingMessages.length)];
    return <LoadingScreen text={randomMessage} />;
  }

  return (
    <PageTransition>
      <Box className="h-full w-auto" sx={{ backgroundColor: '#0f0f12', color: '#fff' }}>
        <DocumentHead title="Admin Dashboard | Duel Learn" />
        <Stack spacing={2} className="px-4 sm:px-6 py-4">
          {/* Header Section */}
          <Stack 
            direction="row" 
            spacing={2} 
            alignItems="center" 
            className="flex justify-between mb-4"
          >
            <Stack direction="row" spacing={1.5} className="flex items-center">
              <img src="/admin-icon.png" className="w-8 h-8" alt="admin" onError={(e) => {
                e.currentTarget.src = "/book.png";
              }} />
              <Typography variant="h5" className="text-lg sm:text-xl md:text-2xl" sx={{ color: '#fff' }}>
                Admin Dashboard
              </Typography>
            </Stack>
            
            <Box>
              <Typography variant="body2" className="text-right" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {user?.email || 'Unknown'}
              </Typography>
              <Chip 
                label={user?.account_type === 'admin' ? 'Admin' : 'User'}
                color={user?.account_type === 'admin' ? 'primary' : 'default'} 
                size="small"
                sx={{ mt: 0.5, backgroundColor: user?.account_type === 'admin' ? '#1a73e8' : 'rgba(255, 255, 255, 0.1)' }}
              />
            </Box>
          </Stack>

          {/* Authentication error message */}
          {authError && (
            <Box 
              className="flex items-center justify-between gap-4 p-3 mb-4 rounded-lg" 
              sx={{ 
                backgroundColor: 'rgba(211, 47, 47, 0.15)',
                border: '1px solid rgba(211, 47, 47, 0.3)'
              }}
            >
              <Typography variant="body1" sx={{ color: '#fff' }}>
                {authError}
              </Typography>
              <Button
                variant="contained"
                onClick={fetchUsers}
                size="small"
                sx={{ 
                  backgroundColor: '#2d2d3a',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#3d3d4a',
                  }
                }}
              >
                Try Again
              </Button>
            </Box>
          )}

          {/* Selected Users Actions */}
          {selectedUsers.length > 0 && (
            <Box 
              className="flex items-center justify-between gap-4 p-3 mb-4 rounded-lg" 
              sx={{ 
                backgroundColor: 'rgba(211, 47, 47, 0.15)',
                border: '1px solid rgba(211, 47, 47, 0.3)'
              }}
            >
              <Typography variant="body1" sx={{ color: '#fff' }}>
                {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'} selected
              </Typography>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteSelected}
                disabled={loading}
                size="small"
              >
                Delete Selected
              </Button>
            </Box>
          )}

          {/* Users Table */}
          <Paper 
            elevation={0} 
            sx={{ 
              mb: 3, 
              position: 'relative', 
              minHeight: '200px',
              borderRadius: '1rem',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#1a1a1f',
            }}
            className="dark-table-container"
          >
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(10, 10, 15, 0.7)',
                  zIndex: 10
                }}
              >
                <CircularProgress sx={{ color: '#fff' }} />
              </Box>
            )}
            <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
              <Table stickyHeader className="dark-themed-table">
                <TableHead>
                  <TableRow>
                    <StyledHeaderCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                        checked={users.length > 0 && selectedUsers.length === users.length}
                        onChange={() => {
                          if (selectedUsers.length === users.length) {
                            setSelectedUsers([]);
                          } else {
                            setSelectedUsers(users.map(user => user.firebase_uid));
                          }
                        }}
                        disabled={loading}
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.5)',
                          '&.Mui-checked': {
                            color: '#fff',
                          },
                          '&.MuiCheckbox-indeterminate': {
                            color: '#fff',
                          }
                        }}
                      />
                    </StyledHeaderCell>
                    <StyledHeaderCell className="font-medium">Firebase UID</StyledHeaderCell>
                    <StyledHeaderCell className="font-medium">Username</StyledHeaderCell>
                    <StyledHeaderCell className="font-medium">Email</StyledHeaderCell>
                    <StyledHeaderCell className="font-medium">SQL DB</StyledHeaderCell>
                    <StyledHeaderCell className="font-medium">Firebase Auth</StyledHeaderCell>
                    <StyledHeaderCell className="font-medium">Firestore</StyledHeaderCell>
                    <StyledHeaderCell className="font-medium">Actions</StyledHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 && !loading ? (
                    <TableRow>
                      <StyledTableCell colSpan={8} align="center" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        <Typography variant="body1" className="py-8" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          No users found
                        </Typography>
                      </StyledTableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow 
                        key={user.firebase_uid}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          },
                          backgroundColor: selectedUsers.includes(user.firebase_uid) 
                            ? 'rgba(26, 115, 232, 0.1)' 
                            : 'transparent'
                        }}
                      >
                        <StyledTableCell padding="checkbox">
                          <Checkbox
                            checked={selectedUsers.includes(user.firebase_uid)}
                            onChange={() => handleToggleSelection(user.firebase_uid)}
                            disabled={loading}
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.5)',
                              '&.Mui-checked': {
                                color: '#fff',
                              }
                            }}
                          />
                        </StyledTableCell>
                        <StyledTableCell 
                          sx={{ 
                            maxWidth: '150px', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.75rem',
                            letterSpacing: '-0.2px'
                          }}
                        >
                          {user.firebase_uid || "N/A"}
                        </StyledTableCell>
                        <StyledTableCell>{user.username || "-"}</StyledTableCell>
                        <StyledTableCell>{user.email || "-"}</StyledTableCell>
                        <StyledTableCell>
                          {user.existInSQL ? (
                            <Chip label="Yes" color="success" size="small" />
                          ) : (
                            <Chip label="No" color="error" size="small" />
                          )}
                        </StyledTableCell>
                        <StyledTableCell>
                          {user.existInFirebaseAuth ? (
                            <Chip label="Yes" color="success" size="small" />
                          ) : (
                            <Chip label="No" color="error" size="small" />
                          )}
                        </StyledTableCell>
                        <StyledTableCell>
                          {user.existInFirestore ? (
                            <Chip label="Yes" color="success" size="small" />
                          ) : (
                            <Chip label="No" color="error" size="small" />
                          )}
                        </StyledTableCell>
                        <StyledTableCell>
                          <Button
                            variant="contained"
                            onClick={() => openDeleteUserConfirm(user.firebase_uid)}
                            size="small"
                            disabled={loading}
                            sx={{ 
                              backgroundColor: '#6c2d2d',
                              color: '#fff',
                              '&:hover': {
                                backgroundColor: '#8e3a3a',
                              }
                            }}
                          >
                            DELETE
                          </Button>
                        </StyledTableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Actions Buttons */}
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              variant="contained"
              onClick={fetchUsers}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                backgroundColor: '#2d2d3a',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#3d3d4a',
                }
              }}
            >
              REFRESH USERS
            </Button>
            <Button
              variant="contained"
              onClick={handleDeleteAllUsersConfirm}
              disabled={loading || users.length === 0}
              sx={{ 
                backgroundColor: '#6c2d2d',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#8e3a3a',
                }
              }}
            >
              DELETE ALL USERS
            </Button>
          </Stack>
        </Stack>
        
        {/* Footer area */}
        <Box sx={{ 
          mt: 'auto', 
          pt: 4, 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '16px 24px',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.75rem'
        }}>
          <Box>
            <span>Privacy</span>
            <span style={{ margin: '0 8px' }}>•</span>
            <span>Terms and Condition</span>
          </Box>
          <Box>
            © 2024 Duel-Learn Inc.
          </Box>
        </Box>
      </Box>

      {/* Dialogs - Update their styling too */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          style: {
            backgroundColor: '#1a1a1f',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: '#fff' }}>Cancel</Button>
          <Button 
            onClick={handleDeleteUser} 
            sx={{ 
              backgroundColor: '#6c2d2d',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#8e3a3a',
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteAllConfirmOpen}
        onClose={() => setDeleteAllConfirmOpen(false)}
        PaperProps={{
          style: {
            backgroundColor: '#1a1a1f',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Confirm Delete ALL Users</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            WARNING: This will delete ALL users from the database, Firebase Auth, and Firestore.
            This action CANNOT be undone. Are you absolutely sure?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllConfirmOpen(false)} sx={{ color: '#fff' }}>Cancel</Button>
          <Button 
            onClick={handleDeleteAllUsers}
            sx={{ 
              backgroundColor: '#6c2d2d',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#8e3a3a',
              }
            }}
          >
            Delete All Users
          </Button>
        </DialogActions>
      </Dialog>
    </PageTransition>
  );
};

export default AdminDashboard;

