import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Chip, 
  Button, 
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ErrorIcon from '@mui/icons-material/Error';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Sample notification data
const notifications = [
  {
    id: 1,
    type: 'user',
    title: 'New User Registration',
    message: 'A new user "johndoe123" has registered and needs approval.',
    time: '5 minutes ago',
    read: false,
    priority: 'medium',
    icon: <PersonAddIcon />
  },
  {
    id: 2,
    type: 'content',
    title: 'Content Submitted for Review',
    message: 'Educator "prof_smith" has submitted a new course "Advanced JavaScript" for approval.',
    time: '30 minutes ago',
    read: false,
    priority: 'high',
    icon: <ContentPasteIcon />
  },
  {
    id: 3,
    type: 'system',
    title: 'Database Backup Completed',
    message: 'Weekly automated database backup has completed successfully.',
    time: '2 hours ago',
    read: true,
    priority: 'low',
    icon: <CheckCircleIcon />
  },
  {
    id: 4,
    type: 'security',
    title: 'Multiple Failed Login Attempts',
    message: 'There have been 5 failed login attempts for user "admin_sarah".',
    time: '3 hours ago',
    read: true,
    priority: 'critical',
    icon: <WarningAmberIcon />
  },
  {
    id: 5,
    type: 'system',
    title: 'System Update Available',
    message: 'A new system update (v2.1.4) is available for installation.',
    time: '1 day ago',
    read: true,
    priority: 'medium',
    icon: <NotificationsIcon />
  },
  {
    id: 6,
    type: 'content',
    title: 'Content Reported',
    message: 'Course "Introduction to Chemistry" has been reported for inaccurate information.',
    time: '1 day ago',
    read: true,
    priority: 'high',
    icon: <ErrorIcon />
  },
];

const AdminNotifications: React.FC = () => {
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [notificationList, setNotificationList] = useState(notifications);

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setActionAnchorEl(event.currentTarget);
    setActiveActionId(id);
  };

  const handleActionClose = () => {
    setActionAnchorEl(null);
    setActiveActionId(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleMarkAsRead = (id: number) => {
    setNotificationList(
      notificationList.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    handleActionClose();
  };

  const handleDelete = (id: number) => {
    setNotificationList(
      notificationList.filter(notification => notification.id !== id)
    );
    handleActionClose();
  };

  const handleMarkAllAsRead = () => {
    setNotificationList(
      notificationList.map(notification => ({ ...notification, read: true }))
    );
  };

  const handleDeleteAll = () => {
    setNotificationList([]);
  };

  const getFilteredNotifications = () => {
    switch(selectedTab) {
      case 0: // All
        return notificationList;
      case 1: // Unread
        return notificationList.filter(notification => !notification.read);
      case 2: // User
        return notificationList.filter(notification => notification.type === 'user');
      case 3: // Content
        return notificationList.filter(notification => notification.type === 'content');
      case 4: // System
        return notificationList.filter(notification => notification.type === 'system');
      case 5: // Security
        return notificationList.filter(notification => notification.type === 'security');
      default:
        return notificationList;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'low':
        return '#2EC486';
      case 'medium':
        return '#FFC107';
      case 'high':
        return '#FF9800';
      case 'critical':
        return '#FF5252';
      default:
        return '#9F9BAE';
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <Box className="p-6 text-white">
      <Box className="mb-6 flex justify-between items-center">
        <Box>
          <Typography variant="h4" gutterBottom>
            Notifications
          </Typography>
          <Typography variant="body1" color="#9F9BAE">
            View and manage system notifications and alerts
          </Typography>
        </Box>
        <Box>
          <Button 
            startIcon={<FilterListIcon />}
            onClick={handleFilterClick}
            sx={{ 
              color: '#E2DDF3',
              mr: 2,
              borderColor: '#3B354D',
              borderWidth: '1px',
              borderStyle: 'solid',
              '&:hover': {
                backgroundColor: 'rgba(77, 24, 232, 0.1)',
              }
            }}
          >
            Filter
          </Button>
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
            PaperProps={{
              sx: {
                backgroundColor: '#1E1A2B',
                color: '#E2DDF3',
                border: '1px solid #3B354D',
                borderRadius: '12px',
                minWidth: '200px',
              }
            }}
          >
            <MenuItem onClick={handleFilterClose} sx={{ '&:hover': { backgroundColor: '#2A2636' } }}>
              All Notifications
            </MenuItem>
            <MenuItem onClick={handleFilterClose} sx={{ '&:hover': { backgroundColor: '#2A2636' } }}>
              Unread Only
            </MenuItem>
            <MenuItem onClick={handleFilterClose} sx={{ '&:hover': { backgroundColor: '#2A2636' } }}>
              High Priority
            </MenuItem>
            <Divider sx={{ backgroundColor: '#3B354D' }} />
            <MenuItem onClick={handleFilterClose} sx={{ '&:hover': { backgroundColor: '#2A2636' } }}>
              User Notifications
            </MenuItem>
            <MenuItem onClick={handleFilterClose} sx={{ '&:hover': { backgroundColor: '#2A2636' } }}>
              Content Notifications
            </MenuItem>
            <MenuItem onClick={handleFilterClose} sx={{ '&:hover': { backgroundColor: '#2A2636' } }}>
              System Notifications
            </MenuItem>
            <MenuItem onClick={handleFilterClose} sx={{ '&:hover': { backgroundColor: '#2A2636' } }}>
              Security Alerts
            </MenuItem>
          </Menu>
        </Box>
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
        <Typography variant="h6" gutterBottom>
          Notifications Center
        </Typography>
        <Typography variant="body1" paragraph>
          This page displays all system notifications and alerts that require your attention. You can:
        </Typography>
        <ul className="list-disc ml-6 mb-4 text-gray-300">
          <li className="mb-2">View and respond to user registration and content submission requests</li>
          <li className="mb-2">Monitor system health and security alerts</li>
          <li className="mb-2">Filter notifications by type, priority, and read status</li>
          <li className="mb-2">Mark notifications as read or delete them</li>
          <li className="mb-2">Configure notification preferences in Settings</li>
        </ul>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange} 
          sx={{ 
            '& .MuiTabs-indicator': { backgroundColor: '#4D18E8' },
            '& .Mui-selected': { color: '#E2DDF3 !important' },
            '& .MuiTab-root': { color: '#9F9BAE', minWidth: 'auto', px: 2 }
          }}
        >
          <Tab label="All" />
          <Tab label="Unread" />
          <Tab label="User" />
          <Tab label="Content" />
          <Tab label="System" />
          <Tab label="Security" />
        </Tabs>
        
        <Box>
          <Button 
            variant="text"
            onClick={handleMarkAllAsRead}
            sx={{ 
              color: '#4D18E8',
              mr: 2,
              '&:hover': {
                backgroundColor: 'rgba(77, 24, 232, 0.1)',
              }
            }}
          >
            Mark All as Read
          </Button>
          <Button 
            variant="text"
            onClick={handleDeleteAll}
            sx={{ 
              color: '#ff5252',
              '&:hover': {
                backgroundColor: 'rgba(255, 82, 82, 0.1)',
              }
            }}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      <Paper sx={{ backgroundColor: '#1E1A2B', borderRadius: '12px', border: '1px solid #3B354D' }}>
        {filteredNotifications.length > 0 ? (
          <List>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    borderLeft: notification.read ? 'none' : '4px solid #4D18E8',
                    backgroundColor: notification.read ? '#1E1A2B' : 'rgba(77, 24, 232, 0.05)',
                    '&:hover': { backgroundColor: '#2A2636' },
                    padding: '16px 20px',
                  }}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="more" 
                      onClick={(e) => handleActionClick(e, notification.id)}
                      sx={{ color: '#9F9BAE' }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${getPriorityColor(notification.priority)}20`,
                        color: getPriorityColor(notification.priority)
                      }}
                    >
                      {notification.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ 
                            color: '#E2DDF3',
                            fontWeight: notification.read ? 'normal' : 'bold',
                            mr: 1
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Chip 
                          label={notification.priority}
                          size="small"
                          sx={{ 
                            backgroundColor: `${getPriorityColor(notification.priority)}20`,
                            color: getPriorityColor(notification.priority),
                            borderRadius: '4px',
                            height: '20px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ color: '#9F9BAE', display: 'block', mb: 0.5 }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: '#6F658D' }}
                        >
                          {notification.time}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < filteredNotifications.length - 1 && (
                  <Divider sx={{ backgroundColor: '#3B354D' }} />
                )}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 60, color: '#3B354D', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#E2DDF3', mb: 1 }}>
              No Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: '#9F9BAE' }}>
              You're all caught up! There are no notifications to display.
            </Typography>
          </Box>
        )}
      </Paper>

      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleActionClose}
        PaperProps={{
          sx: {
            backgroundColor: '#1E1A2B',
            color: '#E2DDF3',
            border: '1px solid #3B354D',
            borderRadius: '12px',
            minWidth: '180px',
          }
        }}
      >
        {activeActionId && notificationList.find(n => n.id === activeActionId)?.read ? (
          <MenuItem 
            onClick={() => handleMarkAsRead(activeActionId)}
            sx={{ '&:hover': { backgroundColor: '#2A2636' } }}
            disabled
          >
            Mark as Read
          </MenuItem>
        ) : (
          <MenuItem 
            onClick={() => activeActionId && handleMarkAsRead(activeActionId)}
            sx={{ '&:hover': { backgroundColor: '#2A2636' } }}
          >
            Mark as Read
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => activeActionId && handleDelete(activeActionId)}
          sx={{ 
            color: '#ff5252',
            '&:hover': { backgroundColor: 'rgba(255, 82, 82, 0.1)' }
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminNotifications; 