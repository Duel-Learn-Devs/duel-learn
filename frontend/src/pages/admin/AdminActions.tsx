import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Divider, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Switch, 
  FormControlLabel, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Alert,
  Chip
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import BackupIcon from '@mui/icons-material/Backup';
import CachedIcon from '@mui/icons-material/Cached';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PersonAddDisabledIcon from '@mui/icons-material/PersonAddDisabled';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import WarningIcon from '@mui/icons-material/Warning';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';
import SendIcon from '@mui/icons-material/Send';
import GroupIcon from '@mui/icons-material/Group';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const AdminActions: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<AdminActionData | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  interface AdminActionData {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    confirmationText: string;
    dangerLevel: 'low' | 'medium' | 'high' | 'critical';
    category: 'system' | 'user' | 'content' | 'security';
  }

  const systemActions: AdminActionData[] = [
    {
      id: 'system-maintenance',
      title: 'Enter Maintenance Mode',
      description: 'Put the site into maintenance mode. All users except admins will see a maintenance page.',
      icon: <BuildIcon sx={{ fontSize: 40, color: '#4D18E8' }} />,
      confirmationText: 'maintenance',
      dangerLevel: 'medium',
      category: 'system'
    },
    {
      id: 'system-cache',
      title: 'Clear System Cache',
      description: 'Purge all cached data to ensure users see the most recent content.',
      icon: <CachedIcon sx={{ fontSize: 40, color: '#4D18E8' }} />,
      confirmationText: 'clear cache',
      dangerLevel: 'low',
      category: 'system'
    },
    {
      id: 'system-backup',
      title: 'Backup Database',
      description: 'Create a full backup of the database and configuration.',
      icon: <BackupIcon sx={{ fontSize: 40, color: '#4D18E8' }} />,
      confirmationText: 'backup',
      dangerLevel: 'low',
      category: 'system'
    },
    {
      id: 'system-restore',
      title: 'Restore From Backup',
      description: 'Restore database from a previous backup point. This will overwrite current data.',
      icon: <RestoreIcon sx={{ fontSize: 40, color: '#FF5252' }} />,
      confirmationText: 'restore backup',
      dangerLevel: 'critical',
      category: 'system'
    }
  ];

  const userActions: AdminActionData[] = [
    {
      id: 'user-bulk-email',
      title: 'Send Bulk Email',
      description: 'Send a mass email to all users or specific user segments.',
      icon: <SendIcon sx={{ fontSize: 40, color: '#4D18E8' }} />,
      confirmationText: 'send email',
      dangerLevel: 'medium',
      category: 'user'
    },
    {
      id: 'user-verify-all',
      title: 'Verify All Pending Users',
      description: 'Approve all users waiting for email verification.',
      icon: <VerifiedUserIcon sx={{ fontSize: 40, color: '#4D18E8' }} />,
      confirmationText: 'verify all',
      dangerLevel: 'medium',
      category: 'user'
    },
    {
      id: 'user-suspend',
      title: 'Suspend User Accounts',
      description: 'Temporarily suspend multiple user accounts based on criteria.',
      icon: <PersonAddDisabledIcon sx={{ fontSize: 40, color: '#FF9800' }} />,
      confirmationText: 'suspend users',
      dangerLevel: 'high',
      category: 'user'
    },
    {
      id: 'user-delete-inactive',
      title: 'Delete Inactive Users',
      description: 'Permanently delete user accounts inactive for more than 1 year.',
      icon: <DeleteSweepIcon sx={{ fontSize: 40, color: '#FF5252' }} />,
      confirmationText: 'delete inactive',
      dangerLevel: 'critical',
      category: 'user'
    }
  ];

  const contentActions: AdminActionData[] = [
    {
      id: 'content-approve-all',
      title: 'Approve All Pending Content',
      description: 'Approve all content submissions currently awaiting review.',
      icon: <ContentPasteIcon sx={{ fontSize: 40, color: '#4D18E8' }} />,
      confirmationText: 'approve all',
      dangerLevel: 'medium',
      category: 'content'
    },
    {
      id: 'content-purge-cache',
      title: 'Purge Content Cache',
      description: 'Clear cached content to ensure users see the latest versions.',
      icon: <CachedIcon sx={{ fontSize: 40, color: '#4D18E8' }} />,
      confirmationText: 'purge cache',
      dangerLevel: 'low',
      category: 'content'
    },
    {
      id: 'content-block',
      title: 'Block Reported Content',
      description: 'Review and block all content that has been reported by users.',
      icon: <BlockIcon sx={{ fontSize: 40, color: '#FF9800' }} />,
      confirmationText: 'block reported',
      dangerLevel: 'high',
      category: 'content'
    },
    {
      id: 'content-cleanup',
      title: 'Clean Up Draft Content',
      description: 'Delete all draft content older than 6 months.',
      icon: <DeleteSweepIcon sx={{ fontSize: 40, color: '#FF5252' }} />,
      confirmationText: 'clean drafts',
      dangerLevel: 'medium',
      category: 'content'
    }
  ];

  const securityActions: AdminActionData[] = [
    {
      id: 'security-scan',
      title: 'Run Security Scan',
      description: 'Check the system for vulnerabilities and potential security issues.',
      icon: <SecurityIcon sx={{ fontSize: 40, color: '#4D18E8' }} />,
      confirmationText: 'run scan',
      dangerLevel: 'low',
      category: 'security'
    },
    {
      id: 'security-lockdown',
      title: 'Enable Security Lockdown',
      description: 'Restrict access to essential functions only during potential security incidents.',
      icon: <LockIcon sx={{ fontSize: 40, color: '#FF9800' }} />,
      confirmationText: 'lockdown',
      dangerLevel: 'high',
      category: 'security'
    },
    {
      id: 'security-reset-keys',
      title: 'Reset API Keys',
      description: 'Regenerate all API keys and tokens, invalidating current ones.',
      icon: <CachedIcon sx={{ fontSize: 40, color: '#FF9800' }} />,
      confirmationText: 'reset keys',
      dangerLevel: 'high',
      category: 'security'
    },
    {
      id: 'security-logs',
      title: 'Export Security Logs',
      description: 'Download all security-related logs for external analysis.',
      icon: <StorageIcon sx={{ fontSize: 40, color: '#4D18E8' }} />,
      confirmationText: 'export logs',
      dangerLevel: 'low',
      category: 'security'
    }
  ];

  const allActions = [...systemActions, ...userActions, ...contentActions, ...securityActions];

  const handleActionClick = (action: AdminActionData) => {
    setCurrentAction(action);
    setOpenDialog(true);
    setConfirmText('');
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setCurrentAction(null);
    setConfirmText('');
  };

  const handleConfirm = () => {
    if (!currentAction) return;
    
    if (confirmText.toLowerCase() !== currentAction.confirmationText.toLowerCase()) {
      setErrorMessage(`Please type "${currentAction.confirmationText}" to confirm this action.`);
      return;
    }
    
    // Simulate action execution
    setTimeout(() => {
      setSuccessMessage(`Successfully executed: ${currentAction.title}`);
      setErrorMessage(null);
      // In a real application, this would trigger the actual action
    }, 1000);
  };

  const getDangerLevelColor = (level: string) => {
    switch(level) {
      case 'low':
        return '#2EC486';
      case 'medium':
        return '#4D18E8';
      case 'high':
        return '#FF9800';
      case 'critical':
        return '#FF5252';
      default:
        return '#9F9BAE';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'system':
        return <BuildIcon />;
      case 'user':
        return <GroupIcon />;
      case 'content':
        return <ContentPasteIcon />;
      case 'security':
        return <SecurityIcon />;
      default:
        return <WarningIcon />;
    }
  };

  return (
    <Box className="p-6 text-white">
      <Box className="mb-6">
        <Typography variant="h4" gutterBottom>
          Admin Actions
        </Typography>
        <Typography variant="body1" color="#9F9BAE">
          Execute powerful administrative actions with caution
        </Typography>
      </Box>

      <Paper 
        sx={{ 
          backgroundColor: '#1E1A2B', 
          marginBottom: '2rem', 
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #3B354D'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WarningIcon sx={{ color: '#FF9800', mr: 2, fontSize: 28 }} />
          <Typography variant="h6" gutterBottom sx={{ m: 0 }}>
            Administrator Actions Center
          </Typography>
        </Box>
        <Typography variant="body1" paragraph>
          This page contains powerful administrative tools that can significantly impact the platform and its users. Please use caution when executing these actions.
        </Typography>
        <Alert severity="warning" sx={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', color: '#E2DDF3', mb: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> Some actions on this page are irreversible and can affect many users or system components. Always double-check before confirming any action.
          </Typography>
        </Alert>
        <List>
          <ListItem>
            <ListItemIcon sx={{ color: '#2EC486' }}>
              <CheckCircleIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Low Risk Actions" 
              secondary="These actions have minimal impact and can be easily reversed if needed." 
              sx={{ '& .MuiListItemText-secondary': { color: '#9F9BAE' } }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ color: '#4D18E8' }}>
              <CheckCircleIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Medium Risk Actions" 
              secondary="These actions affect parts of the system or specific user groups." 
              sx={{ '& .MuiListItemText-secondary': { color: '#9F9BAE' } }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ color: '#FF9800' }}>
              <WarningIcon />
            </ListItemIcon>
            <ListItemText 
              primary="High Risk Actions" 
              secondary="These actions have significant impact and should be used with caution." 
              sx={{ '& .MuiListItemText-secondary': { color: '#9F9BAE' } }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ color: '#FF5252' }}>
              <ErrorIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Critical Actions" 
              secondary="These actions have widespread effects and may be difficult or impossible to reverse." 
              sx={{ '& .MuiListItemText-secondary': { color: '#9F9BAE' } }}
            />
          </ListItem>
        </List>
      </Paper>

      {/* System Actions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
        <BuildIcon sx={{ mr: 2 }} /> System Maintenance Actions
      </Typography>
      <Grid container spacing={3}>
        {systemActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.id}>
            <Card 
              sx={{ 
                backgroundColor: '#1E1A2B', 
                borderRadius: '12px', 
                border: `1px solid ${getDangerLevelColor(action.dangerLevel)}40`,
                height: '100%',
                position: 'relative',
                overflow: 'visible',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: `0 8px 16px ${getDangerLevelColor(action.dangerLevel)}20`,
                },
              }}
            >
              <Chip 
                label={action.dangerLevel}
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: -10, 
                  right: 16, 
                  backgroundColor: getDangerLevelColor(action.dangerLevel),
                  color: '#fff',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  {action.icon}
                  <Typography variant="h6" sx={{ color: '#E2DDF3', mt: 2, mb: 1 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 3 }}>
                    {action.description}
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => handleActionClick(action)}
                    sx={{ 
                      backgroundColor: action.dangerLevel === 'critical' ? '#FF5252' : '#4D18E8', 
                      '&:hover': {
                        backgroundColor: action.dangerLevel === 'critical' ? '#d32f2f' : '#3b13b5',
                      }
                    }}
                  >
                    Execute Action
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* User Management Actions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
        <GroupIcon sx={{ mr: 2 }} /> User Management Actions
      </Typography>
      <Grid container spacing={3}>
        {userActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.id}>
            <Card 
              sx={{ 
                backgroundColor: '#1E1A2B', 
                borderRadius: '12px', 
                border: `1px solid ${getDangerLevelColor(action.dangerLevel)}40`,
                height: '100%',
                position: 'relative',
                overflow: 'visible',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: `0 8px 16px ${getDangerLevelColor(action.dangerLevel)}20`,
                },
              }}
            >
              <Chip 
                label={action.dangerLevel}
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: -10, 
                  right: 16, 
                  backgroundColor: getDangerLevelColor(action.dangerLevel),
                  color: '#fff',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  {action.icon}
                  <Typography variant="h6" sx={{ color: '#E2DDF3', mt: 2, mb: 1 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 3 }}>
                    {action.description}
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => handleActionClick(action)}
                    sx={{ 
                      backgroundColor: action.dangerLevel === 'critical' ? '#FF5252' : '#4D18E8', 
                      '&:hover': {
                        backgroundColor: action.dangerLevel === 'critical' ? '#d32f2f' : '#3b13b5',
                      }
                    }}
                  >
                    Execute Action
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Content Management Actions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
        <ContentPasteIcon sx={{ mr: 2 }} /> Content Management Actions
      </Typography>
      <Grid container spacing={3}>
        {contentActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.id}>
            <Card 
              sx={{ 
                backgroundColor: '#1E1A2B', 
                borderRadius: '12px', 
                border: `1px solid ${getDangerLevelColor(action.dangerLevel)}40`,
                height: '100%',
                position: 'relative',
                overflow: 'visible',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: `0 8px 16px ${getDangerLevelColor(action.dangerLevel)}20`,
                },
              }}
            >
              <Chip 
                label={action.dangerLevel}
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: -10, 
                  right: 16, 
                  backgroundColor: getDangerLevelColor(action.dangerLevel),
                  color: '#fff',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  {action.icon}
                  <Typography variant="h6" sx={{ color: '#E2DDF3', mt: 2, mb: 1 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 3 }}>
                    {action.description}
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => handleActionClick(action)}
                    sx={{ 
                      backgroundColor: action.dangerLevel === 'critical' ? '#FF5252' : '#4D18E8', 
                      '&:hover': {
                        backgroundColor: action.dangerLevel === 'critical' ? '#d32f2f' : '#3b13b5',
                      }
                    }}
                  >
                    Execute Action
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Security Actions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
        <SecurityIcon sx={{ mr: 2 }} /> Security Actions
      </Typography>
      <Grid container spacing={3}>
        {securityActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.id}>
            <Card 
              sx={{ 
                backgroundColor: '#1E1A2B', 
                borderRadius: '12px', 
                border: `1px solid ${getDangerLevelColor(action.dangerLevel)}40`,
                height: '100%',
                position: 'relative',
                overflow: 'visible',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: `0 8px 16px ${getDangerLevelColor(action.dangerLevel)}20`,
                },
              }}
            >
              <Chip 
                label={action.dangerLevel}
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: -10, 
                  right: 16, 
                  backgroundColor: getDangerLevelColor(action.dangerLevel),
                  color: '#fff',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  {action.icon}
                  <Typography variant="h6" sx={{ color: '#E2DDF3', mt: 2, mb: 1 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 3 }}>
                    {action.description}
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => handleActionClick(action)}
                    sx={{ 
                      backgroundColor: action.dangerLevel === 'critical' ? '#FF5252' : '#4D18E8', 
                      '&:hover': {
                        backgroundColor: action.dangerLevel === 'critical' ? '#d32f2f' : '#3b13b5',
                      }
                    }}
                  >
                    Execute Action
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        PaperProps={{
          sx: {
            backgroundColor: '#1E1A2B',
            color: '#E2DDF3',
            borderRadius: '12px',
            border: '1px solid #3B354D',
            minWidth: '400px',
          }
        }}
      >
        {currentAction && (
          <>
            <DialogTitle sx={{ borderBottom: '1px solid #3B354D', display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  backgroundColor: `${getDangerLevelColor(currentAction.dangerLevel)}20`,
                  p: 1,
                  borderRadius: '8px',
                  mr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getCategoryIcon(currentAction.category)}
              </Box>
              <Typography variant="h6">
                Confirm Action: {currentAction.title}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              {currentAction.dangerLevel === 'critical' && (
                <Alert severity="error" sx={{ backgroundColor: 'rgba(255, 82, 82, 0.1)', color: '#E2DDF3', mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Warning:</strong> This is a critical action that may have significant and irreversible consequences.
                  </Typography>
                </Alert>
              )}
              
              {currentAction.dangerLevel === 'high' && (
                <Alert severity="warning" sx={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', color: '#E2DDF3', mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Caution:</strong> This action has significant impact on the system or users.
                  </Typography>
                </Alert>
              )}
              
              <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                You are about to: <strong>{currentAction.description}</strong>
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 3 }}>
                To confirm, please type <strong>"{currentAction.confirmationText}"</strong> in the field below:
              </Typography>
              
              <TextField
                fullWidth
                variant="outlined"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${currentAction.confirmationText}" here`}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#3B354D' },
                    '&:hover fieldset': { borderColor: '#4D18E8' },
                    '&.Mui-focused fieldset': { borderColor: '#4D18E8' },
                    backgroundColor: '#2A2636',
                  },
                  '& .MuiInputLabel-root': { color: '#9F9BAE' },
                  '& .MuiInputBase-input': { color: '#E2DDF3' },
                }}
              />
              
              <Box sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      sx={{ 
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#4D18E8',
                          '&:hover': { backgroundColor: 'rgba(77, 24, 232, 0.08)' },
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#4D18E8',
                        },
                      }}
                    />
                  }
                  label="I understand the consequences of this action"
                />
              </Box>
              
              {errorMessage && (
                <Alert severity="error" sx={{ mt: 2, backgroundColor: 'rgba(255, 82, 82, 0.1)', color: '#E2DDF3' }}>
                  {errorMessage}
                </Alert>
              )}
              
              {successMessage && (
                <Alert severity="success" sx={{ mt: 2, backgroundColor: 'rgba(46, 196, 134, 0.1)', color: '#E2DDF3' }}>
                  {successMessage}
                </Alert>
              )}
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #3B354D', p: 2 }}>
              <Button 
                onClick={handleDialogClose}
                sx={{ color: '#9F9BAE' }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleConfirm}
                sx={{ 
                  backgroundColor: currentAction.dangerLevel === 'critical' ? '#FF5252' : '#4D18E8', 
                  '&:hover': {
                    backgroundColor: currentAction.dangerLevel === 'critical' ? '#d32f2f' : '#3b13b5',
                  }
                }}
              >
                Confirm & Execute
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminActions; 