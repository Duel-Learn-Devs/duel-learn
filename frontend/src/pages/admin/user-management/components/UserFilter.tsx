import * as React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip,
  Popover
} from '@mui/material';

interface UserFilterProps {
  filterAnchorEl: null | HTMLElement;
  handleFilterClose: () => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
}

/**
 * Component for filtering users by account type and status
 */
const UserFilter: React.FC<UserFilterProps> = ({
  filterAnchorEl,
  handleFilterClose,
  selectedRole,
  setSelectedRole,
  selectedStatus,
  setSelectedStatus
}) => {
  return (
    <Popover
      open={Boolean(filterAnchorEl)}
      anchorEl={filterAnchorEl}
      onClose={handleFilterClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <Paper sx={{ 
        p: 2, 
        minWidth: 300, 
        boxShadow: 3,
        backgroundColor: '#1E1A2B',
        border: '1px solid #3B354D',
        color: '#E2DDF3'
      }}>
        <Typography variant="subtitle1" gutterBottom>
          Filter Users
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            By Account Type
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              label="All Types" 
              onClick={() => setSelectedRole('all')}
              color={selectedRole === 'all' ? 'primary' : 'default'}
              sx={{
                backgroundColor: selectedRole === 'all' ? '#4D18E8' : '#2A2636',
                color: '#E2DDF3',
                '&:hover': {
                  backgroundColor: selectedRole === 'all' ? '#4D18E8' : '#3B354D',
                }
              }}
            />
            <Chip 
              label="Free" 
              onClick={() => setSelectedRole('free')}
              color={selectedRole === 'free' ? 'primary' : 'default'}
              sx={{
                backgroundColor: selectedRole === 'free' ? '#4D18E8' : '#2A2636',
                color: '#E2DDF3',
                '&:hover': {
                  backgroundColor: selectedRole === 'free' ? '#4D18E8' : '#3B354D',
                }
              }}
            />
            <Chip 
              label="Premium" 
              onClick={() => setSelectedRole('premium')}
              color={selectedRole === 'premium' ? 'primary' : 'default'}
              sx={{
                backgroundColor: selectedRole === 'premium' ? '#4D18E8' : '#2A2636',
                color: '#E2DDF3',
                '&:hover': {
                  backgroundColor: selectedRole === 'premium' ? '#4D18E8' : '#3B354D',
                }
              }}
            />
            <Chip 
              label="Admin" 
              onClick={() => setSelectedRole('admin')}
              color={selectedRole === 'admin' ? 'primary' : 'default'}
              sx={{
                backgroundColor: selectedRole === 'admin' ? '#4D18E8' : '#2A2636',
                color: '#E2DDF3',
                '&:hover': {
                  backgroundColor: selectedRole === 'admin' ? '#4D18E8' : '#3B354D',
                }
              }}
            />
          </Box>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            By Status
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              label="All Statuses" 
              onClick={() => setSelectedStatus('all')}
              color={selectedStatus === 'all' ? 'primary' : 'default'}
              sx={{
                backgroundColor: selectedStatus === 'all' ? '#4D18E8' : '#2A2636',
                color: '#E2DDF3',
                '&:hover': {
                  backgroundColor: selectedStatus === 'all' ? '#4D18E8' : '#3B354D',
                }
              }}
            />
            <Chip 
              label="Active" 
              onClick={() => setSelectedStatus('active')}
              color={selectedStatus === 'active' ? 'success' : 'default'}
              sx={{
                backgroundColor: selectedStatus === 'active' ? 'rgba(46, 196, 134, 0.2)' : '#2A2636',
                color: selectedStatus === 'active' ? '#2EC486' : '#E2DDF3',
                '&:hover': {
                  backgroundColor: selectedStatus === 'active' ? 'rgba(46, 196, 134, 0.3)' : '#3B354D',
                }
              }}
            />
            <Chip 
              label="Inactive" 
              onClick={() => setSelectedStatus('inactive')}
              color={selectedStatus === 'inactive' ? 'warning' : 'default'}
              sx={{
                backgroundColor: selectedStatus === 'inactive' ? 'rgba(255, 193, 7, 0.2)' : '#2A2636',
                color: selectedStatus === 'inactive' ? '#FFC107' : '#E2DDF3',
                '&:hover': {
                  backgroundColor: selectedStatus === 'inactive' ? 'rgba(255, 193, 7, 0.3)' : '#3B354D',
                }
              }}
            />
            <Chip 
              label="Suspended" 
              onClick={() => setSelectedStatus('suspended')}
              color={selectedStatus === 'suspended' ? 'error' : 'default'}
              sx={{
                backgroundColor: selectedStatus === 'suspended' ? 'rgba(255, 82, 82, 0.2)' : '#2A2636',
                color: selectedStatus === 'suspended' ? '#FF5252' : '#E2DDF3',
                '&:hover': {
                  backgroundColor: selectedStatus === 'suspended' ? 'rgba(255, 82, 82, 0.3)' : '#3B354D',
                }
              }}
            />
            <Chip 
              label="Pending" 
              onClick={() => setSelectedStatus('pending')}
              color={selectedStatus === 'pending' ? 'info' : 'default'}
              sx={{
                backgroundColor: selectedStatus === 'pending' ? 'rgba(33, 150, 243, 0.2)' : '#2A2636',
                color: selectedStatus === 'pending' ? '#2196F3' : '#E2DDF3',
                '&:hover': {
                  backgroundColor: selectedStatus === 'pending' ? 'rgba(33, 150, 243, 0.3)' : '#3B354D',
                }
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Popover>
  );
};

export default UserFilter; 