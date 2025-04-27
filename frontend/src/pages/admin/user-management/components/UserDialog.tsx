import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Avatar,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  SelectChangeEvent,
  IconButton,
  Chip,
  Stack,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import { UserData } from './UserData';
import { formatDate } from './UserUtils';
const defaultProfile = "/assets/profile-picture/default-picture.svg";

interface UserDialogProps {
  open: boolean;
  user: UserData | null;
  onClose: () => void;
  onSave: (user: UserData) => void;
  viewOnly?: boolean;
}

const UserDialog: React.FC<UserDialogProps> = ({
  open,
  user,
  onClose,
  onSave,
  viewOnly = false
}) => {
  const [editedUser, setEditedUser] = useState<UserData | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
    }
    setEditMode(false);
  }, [user, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedUser) return;
    
    const { name, value } = e.target;
    setEditedUser({
      ...editedUser,
      [name]: value
    });
  };

  // Handle select changes for dropdown menus
  const handleSelectChange = (e: SelectChangeEvent) => {
    if (!editedUser) return;
    
    const { name, value } = e.target;
    if (name) {
      setEditedUser({
        ...editedUser,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedUser) return;
    
    const { name, checked } = e.target;
    setEditedUser({
      ...editedUser,
      [name]: checked
    });
  };

  const handleSave = () => {
    if (editedUser) {
      onSave(editedUser);
    }
    setEditMode(false);
  };

  if (!user || !editedUser) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          backgroundColor: '#1E1A2B',
          color: '#E2DDF3',
          borderRadius: 2,
          border: '1px solid #3B354D',
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          {viewOnly ? 'User Details' : (editMode ? 'Edit User' : 'User Details')}
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          sx={{ color: '#9F9BAE' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ borderColor: '#3B354D' }} />
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar 
            src={editedUser.avatar || defaultProfile} 
            alt={editedUser.name}
            sx={{ width: 120, height: 120, mb: 2 }}
          />
          {editedUser.account_type === 'admin' && (
            <Chip 
              icon={<SecurityIcon />}
              label="ADMINISTRATOR" 
              color="error"
              sx={{ mb: 1, fontWeight: 'bold' }}
            />
          )}
          {(editMode && !viewOnly) && (
            <Button 
              variant="outlined" 
              size="small"
              sx={{ 
                color: '#E2DDF3', 
                borderColor: '#3B354D',
                '&:hover': {
                  borderColor: '#4D18E8',
                  backgroundColor: 'rgba(77, 24, 232, 0.08)'
                }
              }}
            >
              Change Avatar
            </Button>
          )}
        </Box>
        
        <Grid container spacing={3}>
          {!editMode && (
            <>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#9F9BAE">ID</Typography>
                <Typography variant="body1">
                  {editedUser.id}
                  {editedUser.firebase_uid && editedUser.firebase_uid !== editedUser.id && (
                    <Typography variant="caption" sx={{ ml: 1, color: '#9F9BAE' }}>
                      (Firebase UID: {editedUser.firebase_uid})
                    </Typography>
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#9F9BAE">Email</Typography>
                <Typography variant="body1">{editedUser.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#9F9BAE">Username</Typography>
                <Typography variant="body1">{editedUser.username || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#9F9BAE">Account Type</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{editedUser.account_type || 'free'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#9F9BAE">Status</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{editedUser.status}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#9F9BAE">Join Date</Typography>
                <Typography variant="body1">{formatDate(editedUser.created_at)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#9F9BAE">Last Active</Typography>
                <Typography variant="body1">{formatDate(editedUser.lastActive)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#9F9BAE">Location</Typography>
                <Typography variant="body1">{editedUser.location || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#9F9BAE">SSO Login</Typography>
                <Typography variant="body1">{editedUser.isSSO ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#9F9BAE">Email Verified</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1">{editedUser.verified || editedUser.email_verified ? 'Yes' : 'No'}</Typography>
                  {(editedUser.verified || editedUser.email_verified) && (
                    <VerifiedUserIcon fontSize="small" sx={{ ml: 0.5, color: '#2EC486' }} />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#9F9BAE">New User</Typography>
                <Typography variant="body1">{editedUser.isNew ? 'Yes' : 'No'}</Typography>
              </Grid>
              
              {/* Game statistics */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Game Statistics</Typography>
                <Divider sx={{ borderColor: '#3B354D', mb: 2 }} />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="#9F9BAE">Level</Typography>
                <Typography variant="body1">{editedUser.level || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="#9F9BAE">Experience</Typography>
                <Typography variant="body1">{editedUser.exp || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="#9F9BAE">Mana</Typography>
                <Typography variant="body1">{editedUser.mana || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="#9F9BAE">Coins</Typography>
                <Typography variant="body1">{editedUser.coins || 0}</Typography>
              </Grid>
              
              {editedUser.stats && (
                <>
                  {/* Learning Progress */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Learning Progress</Typography>
                    <Divider sx={{ borderColor: '#3B354D', mb: 2 }} />
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#9F9BAE">Completed Courses</Typography>
                    <Typography variant="body1">{editedUser.stats.completedCourses}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#9F9BAE">Total Points</Typography>
                    <Typography variant="body1">{editedUser.stats.totalPoints}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#9F9BAE">Average Score</Typography>
                    <Typography variant="body1">{editedUser.stats.averageScore}%</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#9F9BAE">Time Spent</Typography>
                    <Typography variant="body1">{editedUser.stats.timeSpent}h</Typography>
                  </Grid>
                  
                  {/* Study Materials */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Study Materials</Typography>
                    <Divider sx={{ borderColor: '#3B354D', mb: 2 }} />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="#9F9BAE">Created Materials</Typography>
                    <Typography variant="body1">{editedUser.stats.createdMaterials}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="#9F9BAE">Studied Materials</Typography>
                    <Typography variant="body1">{editedUser.stats.studiedMaterials}</Typography>
                  </Grid>
                  
                  {/* PVP Matches */}
                  {editedUser.stats.pvpMatches && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>PVP Matches</Typography>
                        <Divider sx={{ borderColor: '#3B354D', mb: 2 }} />
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Total Matches</Typography>
                        <Typography variant="body1">{editedUser.stats.pvpMatches.total}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Wins</Typography>
                        <Typography variant="body1">{editedUser.stats.pvpMatches.wins}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Losses</Typography>
                        <Typography variant="body1">{editedUser.stats.pvpMatches.losses}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Win Rate</Typography>
                        <Typography variant="body1">{editedUser.stats.pvpMatches.winRate}%</Typography>
                      </Grid>
                    </>
                  )}
                  
                  {/* Peaceful Matches */}
                  {editedUser.stats.peacefulMatches && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Peaceful Matches</Typography>
                        <Divider sx={{ borderColor: '#3B354D', mb: 2 }} />
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Total Matches</Typography>
                        <Typography variant="body1">{editedUser.stats.peacefulMatches.total}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Completed</Typography>
                        <Typography variant="body1">{editedUser.stats.peacefulMatches.completed}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Abandoned</Typography>
                        <Typography variant="body1">{editedUser.stats.peacefulMatches.abandoned}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Completion Rate</Typography>
                        <Typography variant="body1">{editedUser.stats.peacefulMatches.completionRate}%</Typography>
                      </Grid>
                    </>
                  )}
                  
                  {/* Time Pressured Matches */}
                  {editedUser.stats.timePressuredMatches && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Time Pressured Matches</Typography>
                        <Divider sx={{ borderColor: '#3B354D', mb: 2 }} />
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Total Matches</Typography>
                        <Typography variant="body1">{editedUser.stats.timePressuredMatches.total}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Completed</Typography>
                        <Typography variant="body1">{editedUser.stats.timePressuredMatches.completed}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Timeouts</Typography>
                        <Typography variant="body1">{editedUser.stats.timePressuredMatches.timeouts}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Avg. Completion Time</Typography>
                        <Typography variant="body1">{editedUser.stats.timePressuredMatches.averageCompletionTime} min</Typography>
                      </Grid>
                    </>
                  )}
                  
                  {/* Achievements */}
                  {editedUser.stats.achievements && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Achievements</Typography>
                        <Divider sx={{ borderColor: '#3B354D', mb: 2 }} />
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Total</Typography>
                        <Typography variant="body1">{editedUser.stats.achievements.total}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Completed</Typography>
                        <Typography variant="body1">{editedUser.stats.achievements.completed}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">In Progress</Typography>
                        <Typography variant="body1">{editedUser.stats.achievements.inProgress}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Completion Rate</Typography>
                        <Typography variant="body1">{editedUser.stats.achievements.completionRate}%</Typography>
                      </Grid>
                    </>
                  )}
                  
                  {/* Purchased Products */}
                  {editedUser.stats.purchasedProducts && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Purchased Products</Typography>
                        <Divider sx={{ borderColor: '#3B354D', mb: 2 }} />
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Total Products</Typography>
                        <Typography variant="body1">{editedUser.stats.purchasedProducts.total}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Courses</Typography>
                        <Typography variant="body1">{editedUser.stats.purchasedProducts.courses}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Items</Typography>
                        <Typography variant="body1">{editedUser.stats.purchasedProducts.items}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Total Spent</Typography>
                        <Typography variant="body1">${editedUser.stats.purchasedProducts.totalSpent}</Typography>
                      </Grid>
                    </>
                  )}
                  
                  {/* Subscription Details */}
                  {editedUser.stats.subscription && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Subscription Details</Typography>
                        <Divider sx={{ borderColor: '#3B354D', mb: 2 }} />
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Type</Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {editedUser.stats.subscription.type}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Status</Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {editedUser.stats.subscription.status}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Start Date</Typography>
                        <Typography variant="body1">
                          {formatDate(editedUser.stats.subscription.startDate)}
                        </Typography>
                      </Grid>
                      {editedUser.stats.subscription.endDate && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="#9F9BAE">End Date</Typography>
                          <Typography variant="body1">
                            {formatDate(editedUser.stats.subscription.endDate)}
                          </Typography>
                        </Grid>
                      )}
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Price</Typography>
                        <Typography variant="body1">
                          ${editedUser.stats.subscription.price}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="#9F9BAE">Auto Renew</Typography>
                        <Typography variant="body1">
                          {editedUser.stats.subscription.autoRenew ? 'Yes' : 'No'}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {(editMode && !viewOnly) && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={editedUser.name}
                  onChange={handleInputChange}
                  variant="outlined"
                  InputLabelProps={{ 
                    sx: { color: '#9F9BAE' } 
                  }}
                  InputProps={{
                    sx: { 
                      color: '#E2DDF3',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3B354D',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4D18E8',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4D18E8',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={editedUser.username || ''}
                  onChange={handleInputChange}
                  variant="outlined"
                  InputLabelProps={{ 
                    sx: { color: '#9F9BAE' } 
                  }}
                  InputProps={{
                    sx: { 
                      color: '#E2DDF3',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3B354D',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4D18E8',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4D18E8',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={editedUser.email || ''}
                  onChange={handleInputChange}
                  variant="outlined"
                  InputLabelProps={{ 
                    sx: { color: '#9F9BAE' } 
                  }}
                  InputProps={{
                    sx: { 
                      color: '#E2DDF3',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3B354D',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4D18E8',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4D18E8',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3B354D',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4D18E8',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4D18E8',
                    }
                  }}
                >
                  <InputLabel id="account-type-label" sx={{ color: '#9F9BAE' }}>Account Type</InputLabel>
                  <Select
                    labelId="account-type-label"
                    name="account_type"
                    value={editedUser.account_type || 'free'}
                    onChange={handleSelectChange}
                    label="Account Type"
                    sx={{ color: '#E2DDF3' }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: '#1E1A2B',
                          color: '#E2DDF3',
                          border: '1px solid #3B354D'
                        }
                      }
                    }}
                  >
                    <MenuItem value="free">Free</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3B354D',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4D18E8',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4D18E8',
                    }
                  }}
                >
                  <InputLabel id="status-label" sx={{ color: '#9F9BAE' }}>Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={editedUser.status}
                    onChange={handleSelectChange}
                    label="Status"
                    sx={{ color: '#E2DDF3' }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: '#1E1A2B',
                          color: '#E2DDF3',
                          border: '1px solid #3B354D'
                        }
                      }
                    }}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={editedUser.location || ''}
                  onChange={handleInputChange}
                  variant="outlined"
                  InputLabelProps={{ 
                    sx: { color: '#9F9BAE' } 
                  }}
                  InputProps={{
                    sx: { 
                      color: '#E2DDF3',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3B354D',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4D18E8',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4D18E8',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editedUser.verified}
                      onChange={handleSwitchChange}
                      name="verified"
                      color="primary"
                    />
                  }
                  label="Email Verified"
                  sx={{ color: '#E2DDF3' }}
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <Divider sx={{ borderColor: '#3B354D' }} />
      <DialogActions sx={{ p: 2 }}>
        {!viewOnly && (
          <>
            {editMode ? (
              <>
                <Button 
                  onClick={() => setEditMode(false)} 
                  color="inherit"
                  sx={{ color: '#9F9BAE' }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  variant="contained"
                  sx={{ 
                    bgcolor: '#4D18E8',
                    '&:hover': {
                      bgcolor: '#3B10B9',
                    }
                  }}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setEditMode(true)} 
                variant="outlined"
                sx={{ 
                  color: '#E2DDF3', 
                  borderColor: '#3B354D',
                  '&:hover': {
                    borderColor: '#4D18E8',
                    backgroundColor: 'rgba(77, 24, 232, 0.08)'
                  }
                }}
              >
                Edit
              </Button>
            )}
          </>
        )}
        <Button 
          onClick={onClose} 
          color="inherit"
          sx={{ 
            color: viewOnly ? '#E2DDF3' : '#9F9BAE',
            ...(viewOnly && {
              borderColor: '#3B354D',
              border: '1px solid',
              '&:hover': {
                borderColor: '#4D18E8',
                backgroundColor: 'rgba(77, 24, 232, 0.08)'
              }
            })
          }}
        >
          {viewOnly ? 'Close' : 'Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDialog; 