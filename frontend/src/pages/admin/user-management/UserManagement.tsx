import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  InputAdornment,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Menu,
  MenuItem,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import TabPanel from './components/TabPanel';
import UserTable from './components/UserTable';
import UserDialog from './components/UserDialog';
import UserFilter from './components/UserFilter';
import { UserData } from './components/UserData';
import { getDarkThemeCardStyle } from './components/UserUtils';
import { useUser } from '../../../contexts/UserContext';
import { auth } from '../../../services/firebase';
import apiClient from '../../../api/apiClient';
import { AxiosError } from 'axios';

/**
 * UserManagement component for the admin dashboard
 */
const UserManagement: React.FC = () => {
  const { user } = useUser();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAccountType, setSelectedAccountType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // For delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  
  // For bulk actions
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Initial loading
  useEffect(() => {
    console.log("UserManagement - Component rendered");
    console.log("UserManagement - Current user:", user);
    
    // Only fetch users when user context is available
    if (user && user.firebase_uid) {
      fetchInitialUsers();
    } else if (user === null) {
      // If user context has been checked and is null, show auth error
      console.log("Authentication incomplete - waiting for user context to be ready");
      setAuthError("You need to be logged in as an admin to view this page");
    }
  }, [user]);
  
  // Set a timeout for authentication
  useEffect(() => {
    const authTimeout = setTimeout(() => {
      if (initialLoading && !user) {
        console.log("Authentication timed out or failed");
        // Try again with current auth state
        fetchInitialUsersWithAuth();
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(authTimeout);
  }, []);
  
  // Fetch initial users
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
      
      // Fetch real users from API
      const response = await apiClient.get('/admin/users');
      if (Array.isArray(response.data.users)) {
        setUsers(response.data.users);
        console.log("Users fetched:", response.data.users);
        setAuthError(null);
      } else {
        console.error("API response is not an array of users");
        setAuthError("Invalid data format received from server");
        setUsers([]);
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
        setAuthError(`Error: ${axiosError.response.statusText || 'Unknown error'}`);
      } else {
        setAuthError("Could not connect to server. Please check your connection.");
      }
      
      // Set empty users array
      setUsers([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };
  
  // Fetch users with current auth state, even if not ideal
  const fetchInitialUsersWithAuth = async () => {
    setLoading(true);
    try {
      console.log("Attempting to fetch users...");
      
      // Use apiClient directly which already has token handling
      const response = await apiClient.get('/admin/users');
      if (Array.isArray(response.data.users)) {
        setUsers(response.data.users);
        setAuthError(null);
      } else {
        console.error("API response is not an array of users");
        setAuthError("Invalid data format received from server");
        setUsers([]);
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
        setAuthError(`Error: ${axiosError.response.statusText || 'Unknown error'}`);
      } else {
        setAuthError("Could not connect to server. Please check your connection.");
      }
      
      // Set empty users array
      setUsers([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };
  
  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Search handler
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when searching
  };
  
  // Filter handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Dialog handlers
  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setViewOnly(true);
    setDialogOpen(true);
  };
  
  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setViewOnly(false);
    setDialogOpen(true);
  };
  
  // User deletion handlers
  const openDeleteUserConfirm = (userId: string) => {
    setUserToDelete(userId);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteUser = (userId: string) => {
    openDeleteUserConfirm(userId);
  };
  
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setLoading(true);
    
    try {
      // Find the user to check their existence flags
      const userToDeleteData = users.find(user => (user.firebase_uid || user.id) === userToDelete);
      
      if (!userToDeleteData) {
        console.error("User not found in the list");
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
        return;
      }
      
      // Check if user exists in any system
      const existsInAnySystem = userToDeleteData.existInFirebaseAuth || 
                              userToDeleteData.existInFirestore || 
                              userToDeleteData.existInSQL;
      
      if (!existsInAnySystem) {
        console.log("User doesn't exist in any system, removing from UI only");
        // Just remove from UI if not in any system
        setUsers(prevUsers => prevUsers.filter(user => (user.firebase_uid || user.id) !== userToDelete));
        if (selectedUsers.includes(userToDelete)) {
          setSelectedUsers(selectedUsers.filter(id => id !== userToDelete));
        }
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
        return;
      }
      
      // Delete from API
      await apiClient.delete(`/admin/users/${userToDelete}`);
      
      // Update UI by removing the user from the list
      setUsers(prevUsers => prevUsers.filter(user => (user.firebase_uid || user.id) !== userToDelete));
      if (selectedUsers.includes(userToDelete)) {
        setSelectedUsers(selectedUsers.filter(id => id !== userToDelete));
      }
      
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error(`Error deleting user ${userToDelete}:`, error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };
  
  const handleUserSave = async (updatedUser: UserData) => {
    setLoading(true);
    
    try {
      // Update via API
      const userId = updatedUser.firebase_uid || updatedUser.id;
      await apiClient.put(`/admin/users/${userId}`, updatedUser);
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => {
          const userId = user.firebase_uid || user.id;
          const updatedUserId = updatedUser.firebase_uid || updatedUser.id;
          return userId === updatedUserId ? updatedUser : user;
        })
      );
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setLoading(false);
      setDialogOpen(false);
    }
  };
  
  // Toggle user selection for bulk actions
  const handleToggleSelection = (userId: string) => {
    // Special cases for select-all and clear-all
    if (userId === "clear-all") {
      setSelectedUsers([]);
      return;
    }
    
    if (userId.startsWith("select-all:")) {
      const allIds = userId.substring("select-all:".length).split(",");
      setSelectedUsers(allIds);
      return;
    }
    
    // Regular toggle for a single user
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } 
      return [...prev, userId];
    });
  };
  
  // Delete selected users
  const handleDeleteSelected = () => {
    if (selectedUsers.length === 0) return;
    setDeleteAllConfirmOpen(true);
  };
  
  const confirmDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;
    
    setLoading(true);
    
    try {
      // Delete from API one by one
      for (const uid of selectedUsers) {
        await apiClient.delete(`/admin/users/${uid}`);
      }
      
      // Update UI by removing the selected users from the list
      setUsers(prevUsers => prevUsers.filter(user => {
        const userId = user.firebase_uid || user.id;
        return !selectedUsers.includes(userId);
      }));
      
      setSelectedUsers([]);
      setDeleteAllConfirmOpen(false);
    } catch (error) {
      console.error("Error deleting selected users:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Add new user button handler
  const handleAddUser = () => {
    // Create a new user template matching our data structure
    const newUser: UserData = {
      id: `temp-${Date.now()}`,
      name: 'New User',
      email: 'newuser@example.com',
      username: '',
      status: 'pending',
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0],
      verified: false,
      email_verified: false,
      account_type: 'free',
      isNew: true,
      level: 1,
      exp: 0,
      mana: 200,
      coins: 500,
      stats: {
        completedCourses: 0,
        totalPoints: 0,
        averageScore: 0,
        timeSpent: '0',
        createdMaterials: 0,
        studiedMaterials: 0,
        pvpMatches: {
          total: 0,
          wins: 0,
          losses: 0,
          winRate: 0
        },
        peacefulMatches: {
          total: 0,
          completed: 0,
          abandoned: 0,
          completionRate: 0
        },
        timePressuredMatches: {
          total: 0,
          completed: 0,
          timeouts: 0,
          averageCompletionTime: '0'
        },
        achievements: {
          total: 0,
          completed: 0,
          inProgress: 0,
          completionRate: 0
        },
        purchasedProducts: {
          total: 0,
          courses: 0,
          items: 0,
          totalSpent: 0
        },
        subscription: {
          type: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
          autoRenew: false,
          price: 0,
          status: 'active'
        }
      }
    };
    setSelectedUser(newUser);
    setViewOnly(false);
    setDialogOpen(true);
  };
  
  // Refresh users
  const handleRefreshUsers = async () => {
    setLoading(true);
    setAuthError(null);
    
    try {
      // Fetch real users from API
      const response = await apiClient.get('/admin/users');
      if (Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        setAuthError("Invalid data format received from server");
        setUsers([]);
      }
    } catch (error) {
      console.error("Error refreshing users:", error);
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        setAuthError("Authentication failed. Please ensure you are logged in as an admin.");
      } else {
        setAuthError(`Error: ${axiosError.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Filter users based on search query and selected filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchQuery === '' || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firebase_uid?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAccountType = selectedAccountType === 'all' || user.account_type === selectedAccountType;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesAccountType && matchesStatus;
  });
  
  // Loading state with random messages
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
    
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress sx={{ color: '#4D18E8' }} />
        <Typography variant="h6" sx={{ color: '#E2DDF3' }}>
          {randomMessage}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ backgroundColor: '#080511', minHeight: '100vh', color: '#E2DDF3', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          User Management
        </Typography>
        <Badge 
          badgeContent={users.length} 
          color="primary"
          sx={{ '& .MuiBadge-badge': { backgroundColor: '#4D18E8', color: 'white' } }}
        >
          <Typography variant="h6" sx={{ mr: 1 }}>Total Users</Typography>
        </Badge>
      </Box>
      
      {authError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
      )}
      
      {/* Selected Users Actions */}
      {selectedUsers.length > 0 && (
        <Box 
          className="flex items-center justify-between gap-4 p-3 mb-4 rounded-lg" 
          sx={{ 
            backgroundColor: 'rgba(211, 47, 47, 0.15)',
            border: '1px solid rgba(211, 47, 47, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
            padding: 2,
            borderRadius: 1
          }}
        >
          <Typography variant="body1" sx={{ color: '#E2DDF3' }}>
            {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'} selected
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSelected}
            disabled={loading}
            size="small"
            sx={{ 
              bgcolor: '#FF5252',
              '&:hover': { bgcolor: '#FF3232' }
            }}
          >
            Delete Selected
          </Button>
        </Box>
      )}
      
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: '#1E1A2B', 
          border: '1px solid #3B354D',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search users..."
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
              width: 300,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#3B354D',
                },
                '&:hover fieldset': {
                  borderColor: '#4D18E8',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4D18E8',
                },
                backgroundColor: '#2A2636',
              },
              '& .MuiInputBase-input': {
                color: '#E2DDF3',
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9F9BAE' }} />
                </InputAdornment>
              ),
            }}
          />
          <Box>
            <Tooltip title="Refresh Users">
              <IconButton 
                onClick={handleRefreshUsers}
                disabled={loading}
                sx={{ 
                  color: '#E2DDF3', 
                  mr: 1, 
                  '&:hover': { color: '#4D18E8' },
                  '&.Mui-disabled': { color: '#9F9BAE' }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#4D18E8' }} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <IconButton 
              onClick={handleFilterClick} 
              sx={{ color: '#E2DDF3', mr: 1, '&:hover': { color: '#4D18E8' } }}
            >
              <FilterListIcon />
            </IconButton>
            {selectedUsers.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
                sx={{ 
                  borderColor: '#FF5252',
                  color: '#FF5252',
                  mr: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 82, 82, 0.08)',
                    borderColor: '#FF5252',
                  }
                }}
              >
                Delete Selected ({selectedUsers.length})
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleAddUser}
              sx={{ 
                backgroundColor: '#4D18E8',
                '&:hover': {
                  backgroundColor: '#3B10B9',
                }
              }}
            >
              Add User
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: '#3B354D' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: '#9F9BAE',
                '&.Mui-selected': {
                  color: '#E2DDF3',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#4D18E8',
              },
            }}
          >
            <Tab label="All Users" />
            <Tab label="Free" />
            <Tab label="Premium" />
            <Tab label="Admin" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <UserTable 
            users={filteredUsers}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            selectedUsers={selectedUsers}
            onToggleSelection={handleToggleSelection}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <UserTable 
            users={filteredUsers.filter(user => user.account_type === 'free')}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            selectedUsers={selectedUsers}
            onToggleSelection={handleToggleSelection}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <UserTable 
            users={filteredUsers.filter(user => user.account_type === 'premium')}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            selectedUsers={selectedUsers}
            onToggleSelection={handleToggleSelection}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <UserTable 
            users={filteredUsers.filter(user => user.account_type === 'admin')}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            selectedUsers={selectedUsers}
            onToggleSelection={handleToggleSelection}
          />
        </TabPanel>
      </Paper>
      
      {/* User management tips */}
      <Paper 
        sx={{ 
          p: 2, 
          backgroundColor: '#1E1A2B', 
          border: '1px solid #3B354D',
          borderRadius: 2
        }}
      >
        <Typography variant="h6" gutterBottom>User Management Tips</Typography>
        <Typography variant="body2" paragraph sx={{ color: '#9F9BAE' }}>
          • Use the filter button to narrow down users by account type and status
        </Typography>
        <Typography variant="body2" paragraph sx={{ color: '#9F9BAE' }}>
          • Click on a user row to view detailed information
        </Typography>
        <Typography variant="body2" paragraph sx={{ color: '#9F9BAE' }}>
          • You can edit user details or change their status from the user details panel
        </Typography>
        <Typography variant="body2" paragraph sx={{ color: '#9F9BAE' }}>
          • Database indicators show user existence in different systems: SQL, Firebase Auth, and Firestore
        </Typography>
        <Typography variant="body2" sx={{ color: '#9F9BAE' }}>
          • You can select multiple users for bulk actions using the checkboxes
        </Typography>
      </Paper>
      
      {/* Filter popover */}
      <UserFilter
        filterAnchorEl={filterAnchorEl}
        handleFilterClose={handleFilterClose}
        selectedRole={selectedAccountType}
        setSelectedRole={setSelectedAccountType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />
      
      {/* User dialog */}
      <UserDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        user={selectedUser}
        onSave={handleUserSave}
        viewOnly={viewOnly}
      />
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1E1A2B',
            color: '#E2DDF3',
            border: '1px solid #3B354D',
          }
        }}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#9F9BAE' }}>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)} 
            sx={{ color: '#E2DDF3' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteUser} 
            sx={{ color: '#FF5252' }} 
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete multiple users confirmation dialog */}
      <Dialog
        open={deleteAllConfirmOpen}
        onClose={() => setDeleteAllConfirmOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1E1A2B',
            color: '#E2DDF3',
            border: '1px solid #3B354D',
          }
        }}
      >
        <DialogTitle>Confirm Multiple Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#9F9BAE' }}>
            Are you sure you want to delete {selectedUsers.length} users? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteAllConfirmOpen(false)} 
            sx={{ color: '#E2DDF3' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteSelected} 
            sx={{ color: '#FF5252' }} 
            autoFocus
          >
            Delete All Selected
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 