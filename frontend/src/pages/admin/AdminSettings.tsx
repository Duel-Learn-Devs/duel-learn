import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Grid, 
  Switch, 
  FormControlLabel,
  Divider, 
  Avatar,
  Card,
  CardContent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useUser } from '../../contexts/UserContext';

// Instead of importing the SVG file directly, create a placeholder URL
const defaultPicture = 'https://mui.com/static/images/avatar/1.jpg';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminSettings: React.FC = () => {
  const { user } = useUser();
  const [value, setValue] = useState(0);
  
  // Form state
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', backgroundColor: '#080511', color: '#E2DDF3', pb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#E2DDF3', mb: 3, px: 2 }}>
        Admin Settings
      </Typography>
      
      <Paper sx={{ 
        backgroundColor: '#1E1A2B',
        borderRadius: 2,
        border: '1px solid #3B354D',
        mb: 3
      }}>
        <Box sx={{ borderBottom: 1, borderColor: '#3B354D' }}>
          <Tabs 
            value={value} 
            onChange={handleTabChange} 
            textColor="inherit" 
            indicatorColor="primary"
            sx={{ 
              '& .MuiTab-root': { 
                color: '#9F9BAE',
                '&.Mui-selected': {
                  color: '#E2DDF3', 
                }
              } 
            }}
          >
            <Tab 
              icon={<AccountCircleIcon />} 
              label="Profile" 
              iconPosition="start" 
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<SecurityIcon />} 
              label="Security" 
              iconPosition="start" 
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<NotificationsIcon />} 
              label="Notifications" 
              iconPosition="start" 
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<SettingsIcon />} 
              label="System" 
              iconPosition="start" 
              sx={{ minHeight: 64 }}
            />
          </Tabs>
        </Box>
        
        <TabPanel value={value} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar 
                  src={user?.display_picture || defaultPicture} 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mx: 'auto', 
                    mb: 2,
                    border: '4px solid #4D18E8'
                  }}
                />
                <Typography variant="h6" gutterBottom sx={{ color: '#E2DDF3' }}>
                  {user?.full_name || user?.username || 'Admin User'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#9F9BAE' }}>
                  {user?.email || 'admin@example.com'}
                </Typography>
                <Box 
                  sx={{ 
                    display: 'inline-block', 
                    mt: 1, 
                    backgroundColor: '#4D18E8', 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: 2 
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                    Administrator
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  sx={{ 
                    mt: 2, 
                    borderColor: '#3B354D', 
                    color: '#E2DDF3',
                    '&:hover': {
                      borderColor: '#4D18E8',
                      backgroundColor: 'rgba(77, 24, 232, 0.08)'
                    }
                  }}
                >
                  Change Photo
                </Button>
              </Box>
              
              <Card sx={{ 
                mb: 2, 
                backgroundColor: '#2A2636', 
                border: '1px solid #3B354D',
                borderRadius: 2
              }}>
                <CardContent>
                  <Typography 
                    variant="subtitle1" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: '#E2DDF3', 
                      borderBottom: '1px solid #3B354D',
                      pb: 1,
                      mb: 2
                    }}
                  >
                    Account Status
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Account Type:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
                        {user?.account_type === 'admin' ? 'Administrator' : 'Admin'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Verified:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#2EC486', fontWeight: 'bold' }}>Yes</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Last Login:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>Today, 9:42 AM</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box component="form" noValidate sx={{ mt: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  pb: 2, 
                  mb: 3, 
                  borderBottom: '1px solid #3B354D',
                  color: '#E2DDF3', 
                }}>
                  Personal Information
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#2A2636',
                          '& fieldset': {
                            borderColor: '#3B354D',
                          },
                          '&:hover fieldset': {
                            borderColor: '#4D18E8',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9F9BAE',
                        },
                        '& .MuiOutlinedInput-input': {
                          color: '#E2DDF3',
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      defaultValue={user?.username || 'admin'}
                      disabled
                      sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#2A2636',
                          '& fieldset': {
                            borderColor: '#3B354D',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9F9BAE',
                        },
                        '& .MuiOutlinedInput-input': {
                          color: '#9F9BAE',
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#2A2636',
                          '& fieldset': {
                            borderColor: '#3B354D',
                          },
                          '&:hover fieldset': {
                            borderColor: '#4D18E8',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9F9BAE',
                        },
                        '& .MuiOutlinedInput-input': {
                          color: '#E2DDF3',
                        }
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ borderColor: '#3B354D', my: 3 }} />
                
                <Typography variant="h6" gutterBottom sx={{ 
                  mb: 3, 
                  color: '#E2DDF3', 
                }}>
                  Admin Preferences
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Default Dashboard View"
                      defaultValue="analytics"
                      SelectProps={{
                        native: true,
                      }}
                      sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#2A2636',
                          '& fieldset': {
                            borderColor: '#3B354D',
                          },
                          '&:hover fieldset': {
                            borderColor: '#4D18E8',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9F9BAE',
                        },
                        '& .MuiOutlinedInput-input': {
                          color: '#E2DDF3',
                        }
                      }}
                    >
                      <option value="analytics">Analytics Overview</option>
                      <option value="users">User Management</option>
                      <option value="content">Content Management</option>
                    </TextField>
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />}
                    sx={{ 
                      backgroundColor: '#4D18E8',
                      '&:hover': {
                        backgroundColor: '#3b10b9',
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <Typography variant="h6" gutterBottom sx={{ 
            pb: 2, 
            mb: 3, 
            borderBottom: '1px solid #3B354D',
            color: '#E2DDF3', 
          }}>
            Security Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
                Change Password
              </Typography>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2A2636',
                    '& fieldset': {
                      borderColor: '#3B354D',
                    },
                    '&:hover fieldset': {
                      borderColor: '#4D18E8',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9F9BAE',
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#E2DDF3',
                  }
                }}
              />
              <TextField
                fullWidth
                label="New Password"
                type="password"
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2A2636',
                    '& fieldset': {
                      borderColor: '#3B354D',
                    },
                    '&:hover fieldset': {
                      borderColor: '#4D18E8',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9F9BAE',
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#E2DDF3',
                  }
                }}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2A2636',
                    '& fieldset': {
                      borderColor: '#3B354D',
                    },
                    '&:hover fieldset': {
                      borderColor: '#4D18E8',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9F9BAE',
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#E2DDF3',
                  }
                }}
              />
              <Button 
                variant="contained" 
                sx={{ 
                  backgroundColor: '#4D18E8',
                  '&:hover': {
                    backgroundColor: '#3b10b9',
                  }
                }}
              >
                Update Password
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
                Two-Factor Authentication
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={true} 
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4D18E8',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4D18E8',
                      },
                    }}
                  />
                }
                label="Enable Two-Factor Authentication"
                sx={{ 
                  mb: 2,
                  color: '#E2DDF3',
                  '& .MuiFormControlLabel-label': {
                    color: '#E2DDF3',
                  }
                }}
              />
              <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 3 }}>
                Secure your account with two-factor authentication. When enabled, you'll be required
                to provide a verification code in addition to your password when signing in.
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ 
                  borderColor: '#3B354D', 
                  color: '#E2DDF3',
                  '&:hover': {
                    borderColor: '#4D18E8',
                    backgroundColor: 'rgba(77, 24, 232, 0.08)'
                  }
                }}
              >
                Configure Two-Factor
              </Button>
            </Grid>
          </Grid>
          
          <Divider sx={{ borderColor: '#3B354D', my: 4 }} />
          
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
            Active Sessions
          </Typography>
          <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 3 }}>
            These are the devices that are currently logged into your account.
          </Typography>
          
          <Card sx={{ 
            p: 2, 
            mb: 2, 
            backgroundColor: '#2A2636', 
            border: '1px solid #3B354D',
            borderRadius: 2
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#E2DDF3' }}>
                  Chrome on Windows
                </Typography>
                <Typography variant="body2" sx={{ color: '#9F9BAE' }}>
                  Current Session • IP: 192.168.1.1
                </Typography>
              </Box>
              <Button 
                sx={{ 
                  color: '#E2DDF3',
                  '&:hover': {
                    backgroundColor: 'rgba(77, 24, 232, 0.08)'
                  }
                }}
                disabled
              >
                This Device
              </Button>
            </Box>
          </Card>
          
          <Button 
            variant="outlined" 
            color="error" 
            sx={{ 
              mt: 2,
              borderColor: '#FF5252',
              color: '#FF5252',
              '&:hover': {
                borderColor: '#FF5252',
                backgroundColor: 'rgba(255, 82, 82, 0.08)'
              }
            }}
          >
            Log Out All Other Devices
          </Button>
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <Typography variant="h6" gutterBottom sx={{ 
            pb: 2, 
            mb: 3, 
            borderBottom: '1px solid #3B354D',
            color: '#E2DDF3', 
          }}>
            Notification Settings
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold', mb: 2 }}>
            Email Notifications
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={emailNotifications} 
                onChange={() => setEmailNotifications(!emailNotifications)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4D18E8',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4D18E8',
                  },
                }}
              />
            }
            label="System Alerts"
            sx={{ 
              mb: 1,
              display: 'block',
              '& .MuiFormControlLabel-label': {
                color: '#E2DDF3',
              }
            }}
          />
          <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 2, ml: 7 }}>
            Receive email notifications for important system alerts and updates.
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={emailNotifications} 
                onChange={() => setEmailNotifications(!emailNotifications)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4D18E8',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4D18E8',
                  },
                }}
              />
            }
            label="User Management Notifications"
            sx={{ 
              mb: 1,
              display: 'block',
              '& .MuiFormControlLabel-label': {
                color: '#E2DDF3',
              }
            }}
          />
          <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 2, ml: 7 }}>
            Receive email notifications for user registrations, account issues and status changes.
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={emailNotifications} 
                onChange={() => setEmailNotifications(!emailNotifications)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4D18E8',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4D18E8',
                  },
                }}
              />
            }
            label="Content Updates"
            sx={{ 
              mb: 1,
              display: 'block',
              '& .MuiFormControlLabel-label': {
                color: '#E2DDF3',
              }
            }}
          />
          <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 3, ml: 7 }}>
            Receive email notifications when new content is published or requires approval.
          </Typography>
          
          <Divider sx={{ borderColor: '#3B354D', my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold', mb: 2 }}>
            Push Notifications
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={pushNotifications} 
                onChange={() => setPushNotifications(!pushNotifications)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4D18E8',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4D18E8',
                  },
                }}
              />
            }
            label="Enable Push Notifications"
            sx={{ 
              mb: 1,
              display: 'block',
              '& .MuiFormControlLabel-label': {
                color: '#E2DDF3',
              }
            }}
          />
          <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 3, ml: 7 }}>
            Allow the system to send you push notifications when critical events occur.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              sx={{ 
                backgroundColor: '#4D18E8',
                '&:hover': {
                  backgroundColor: '#3b10b9',
                }
              }}
            >
              Save Notification Settings
            </Button>
          </Box>
        </TabPanel>
        
        <TabPanel value={value} index={3}>
          <Typography variant="h6" gutterBottom sx={{ 
            pb: 2, 
            mb: 3, 
            borderBottom: '1px solid #3B354D',
            color: '#E2DDF3', 
          }}>
            System Settings
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
            Application Theme
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Button 
              variant="contained"
              sx={{ 
                backgroundColor: '#080511',
                color: '#E2DDF3',
                px: 3,
                '&:hover': {
                  backgroundColor: '#121020',
                }
              }}
            >
              Dark
            </Button>
            <Button 
              variant="outlined"
              sx={{ 
                borderColor: '#3B354D', 
                color: '#9F9BAE',
                px: 3,
                '&:hover': {
                  borderColor: '#4D18E8',
                  backgroundColor: 'rgba(77, 24, 232, 0.08)'
                }
              }}
            >
              Light
            </Button>
            <Button 
              variant="outlined"
              sx={{ 
                borderColor: '#3B354D', 
                color: '#9F9BAE',
                px: 3,
                '&:hover': {
                  borderColor: '#4D18E8',
                  backgroundColor: 'rgba(77, 24, 232, 0.08)'
                }
              }}
            >
              System
            </Button>
          </Box>
          
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
            Data Management
          </Typography>
          <FormControlLabel
            control={
              <Switch 
                checked={true} 
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4D18E8',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4D18E8',
                  },
                }}
              />
            }
            label="Enable Analytics"
            sx={{ 
              mb: 1,
              display: 'block',
              '& .MuiFormControlLabel-label': {
                color: '#E2DDF3',
              }
            }}
          />
          <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 3, ml: 7 }}>
            Collect anonymous usage data to improve the system and user experience.
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={true} 
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4D18E8',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4D18E8',
                  },
                }}
              />
            }
            label="Automatic Backups"
            sx={{ 
              mb: 1,
              display: 'block',
              '& .MuiFormControlLabel-label': {
                color: '#E2DDF3',
              }
            }}
          />
          <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 3, ml: 7 }}>
            Schedule regular database backups (recommended).
          </Typography>
          
          <Divider sx={{ borderColor: '#3B354D', my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
            System Maintenance
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined"
              sx={{ 
                borderColor: '#3B354D', 
                color: '#E2DDF3',
                '&:hover': {
                  borderColor: '#4D18E8',
                  backgroundColor: 'rgba(77, 24, 232, 0.08)'
                }
              }}
            >
              Clear Cache
            </Button>
            <Button 
              variant="outlined"
              sx={{ 
                borderColor: '#3B354D', 
                color: '#E2DDF3',
                '&:hover': {
                  borderColor: '#4D18E8',
                  backgroundColor: 'rgba(77, 24, 232, 0.08)'
                }
              }}
            >
              Regenerate Indexes
            </Button>
            <Button 
              variant="outlined"
              sx={{ 
                borderColor: '#3B354D', 
                color: '#E2DDF3',
                '&:hover': {
                  borderColor: '#4D18E8',
                  backgroundColor: 'rgba(77, 24, 232, 0.08)'
                }
              }}
            >
              Test Email
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminSettings; 