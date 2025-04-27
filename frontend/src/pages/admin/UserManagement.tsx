import * as React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Avatar,
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Chip,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Divider,
  Badge
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EmailIcon from '@mui/icons-material/Email';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SchoolIcon from '@mui/icons-material/School';
import StarIcon from '@mui/icons-material/Star';
import BarChartIcon from '@mui/icons-material/BarChart';
import CakeIcon from '@mui/icons-material/Cake';
import LocationOnIcon from '@mui/icons-material/LocationOn';

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
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
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

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  joinDate: string;
  lastActive: string;
  avatar?: string;
  verified: boolean;
  location?: string;
  birthdate?: string;
  stats: {
    completedCourses: number;
    totalPoints: number;
    averageScore: number;
    timeSpent: string; // In hours
  };
}

const sampleUsers: UserData[] = [
  {
    id: 'user-001',
    name: 'John Smith',
    email: 'john.smith@example.com',
    role: 'student',
    status: 'active',
    joinDate: '2023-05-12',
    lastActive: '2023-09-28',
    avatar: 'https://mui.com/static/images/avatar/1.jpg',
    verified: true,
    location: 'New York, USA',
    birthdate: '2004-03-15',
    stats: {
      completedCourses: 12,
      totalPoints: 5850,
      averageScore: 92.5,
      timeSpent: '87.5'
    }
  },
  {
    id: 'user-002',
    name: 'Emily Johnson',
    email: 'emily.johnson@example.com',
    role: 'teacher',
    status: 'active',
    joinDate: '2022-11-05',
    lastActive: '2023-09-29',
    avatar: 'https://mui.com/static/images/avatar/2.jpg',
    verified: true,
    location: 'Chicago, USA',
    birthdate: '1988-07-22',
    stats: {
      completedCourses: 45,
      totalPoints: 12450,
      averageScore: 98.2,
      timeSpent: '342.1'
    }
  },
  {
    id: 'user-003',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    role: 'student',
    status: 'inactive',
    joinDate: '2023-02-18',
    lastActive: '2023-07-15',
    verified: false,
    location: 'Los Angeles, USA',
    birthdate: '2005-11-30',
    stats: {
      completedCourses: 5,
      totalPoints: 1250,
      averageScore: 78.5,
      timeSpent: '23.5'
    }
  },
  {
    id: 'user-004',
    name: 'Sophia Davis',
    email: 'sophia.davis@example.com',
    role: 'parent',
    status: 'active',
    joinDate: '2023-01-10',
    lastActive: '2023-09-27',
    avatar: 'https://mui.com/static/images/avatar/3.jpg',
    verified: true,
    location: 'Miami, USA',
    birthdate: '1982-04-18',
    stats: {
      completedCourses: 0,
      totalPoints: 450,
      averageScore: 0,
      timeSpent: '12.5'
    }
  },
  {
    id: 'user-005',
    name: 'William Wilson',
    email: 'william.wilson@example.com',
    role: 'admin',
    status: 'active',
    joinDate: '2022-08-01',
    lastActive: '2023-09-29',
    avatar: 'https://mui.com/static/images/avatar/4.jpg',
    verified: true,
    location: 'Boston, USA',
    birthdate: '1990-09-12',
    stats: {
      completedCourses: 67,
      totalPoints: 23450,
      averageScore: 99.1,
      timeSpent: '678.3'
    }
  },
  {
    id: 'user-006',
    name: 'Alex Turner',
    email: 'alex.turner@example.com',
    role: 'student',
    status: 'suspended',
    joinDate: '2023-04-22',
    lastActive: '2023-08-05',
    verified: true,
    location: 'Seattle, USA',
    birthdate: '2003-12-08',
    stats: {
      completedCourses: 8,
      totalPoints: 2750,
      averageScore: 65.8,
      timeSpent: '45.2'
    }
  },
  {
    id: 'user-007',
    name: 'Olivia Miller',
    email: 'olivia.miller@example.com',
    role: 'teacher',
    status: 'pending',
    joinDate: '2023-09-01',
    lastActive: '2023-09-01',
    avatar: 'https://mui.com/static/images/avatar/5.jpg',
    verified: false,
    location: 'Austin, USA',
    birthdate: '1985-05-27',
    stats: {
      completedCourses: 0,
      totalPoints: 200,
      averageScore: 0,
      timeSpent: '5.0'
    }
  }
];

const UserManagement: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [selectedUser, setSelectedUser] = React.useState<UserData | null>(null);
  const [userDialogOpen, setUserDialogOpen] = React.useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>('all');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleUserClick = (user: UserData) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Filter users based on search query, role, and status
  const filteredUsers = sampleUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    // Apply tab filters
    if (tabValue === 1 && user.role !== 'student') return false;
    if (tabValue === 2 && user.role !== 'teacher') return false;
    if (tabValue === 3 && user.role !== 'parent') return false;
    if (tabValue === 4 && user.role !== 'admin') return false;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'student': return 'primary';
      case 'teacher': return 'success';
      case 'admin': return 'error';
      case 'parent': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'suspended': return 'error';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<PersonIcon />}
        >
          Add New User
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          User Dashboard
        </Typography>
        <Typography paragraph>
          Manage all users from this centralized dashboard. View and edit user details, track user activity, and manage user roles and permissions across the platform.
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search by name, email, or user ID..."
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              onClick={handleFilterClick}
              sx={{ height: '100%' }}
            >
              Filter Users
            </Button>
            {filterAnchorEl && (
              <Paper sx={{ 
                position: 'absolute', 
                zIndex: 1, 
                mt: 1, 
                p: 2, 
                minWidth: 300, 
                boxShadow: 3 
              }}>
                <Typography variant="subtitle1" gutterBottom>
                  Filter Users
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    By Role
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label="All Roles" 
                      onClick={() => setSelectedRole('all')}
                      color={selectedRole === 'all' ? 'primary' : 'default'}
                    />
                    <Chip 
                      label="Students" 
                      onClick={() => setSelectedRole('student')}
                      color={selectedRole === 'student' ? 'primary' : 'default'}
                    />
                    <Chip 
                      label="Teachers" 
                      onClick={() => setSelectedRole('teacher')}
                      color={selectedRole === 'teacher' ? 'primary' : 'default'}
                    />
                    <Chip 
                      label="Parents" 
                      onClick={() => setSelectedRole('parent')}
                      color={selectedRole === 'parent' ? 'primary' : 'default'}
                    />
                    <Chip 
                      label="Admins" 
                      onClick={() => setSelectedRole('admin')}
                      color={selectedRole === 'admin' ? 'primary' : 'default'}
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
                    />
                    <Chip 
                      label="Active" 
                      onClick={() => setSelectedStatus('active')}
                      color={selectedStatus === 'active' ? 'success' : 'default'}
                    />
                    <Chip 
                      label="Inactive" 
                      onClick={() => setSelectedStatus('inactive')}
                      color={selectedStatus === 'inactive' ? 'warning' : 'default'}
                    />
                    <Chip 
                      label="Suspended" 
                      onClick={() => setSelectedStatus('suspended')}
                      color={selectedStatus === 'suspended' ? 'error' : 'default'}
                    />
                    <Chip 
                      label="Pending" 
                      onClick={() => setSelectedStatus('pending')}
                      color={selectedStatus === 'pending' ? 'info' : 'default'}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button onClick={handleFilterClose}>
                    Close
                  </Button>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="user management tabs">
          <Tab label="All Users" id="user-tab-0" />
          <Tab label="Students" id="user-tab-1" />
          <Tab label="Teachers" id="user-tab-2" />
          <Tab label="Parents" id="user-tab-3" />
          <Tab label="Admins" id="user-tab-4" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="user table">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell align="center">Role</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Join Date</TableCell>
                <TableCell align="center">Last Active</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                <TableRow
                  key={user.id}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                  onClick={() => handleUserClick(user)}
                >
                  <TableCell component="th" scope="row" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        user.verified ? 
                        <VerifiedUserIcon color="primary" sx={{ width: 16, height: 16 }} /> : 
                        null
                      }
                    >
                      <Avatar 
                        src={user.avatar} 
                        alt={user.name}
                        sx={{ mr: 2 }}
                      >
                        {!user.avatar && user.name.charAt(0)}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="subtitle2">
                        {user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                      color={getRoleColor(user.role) as "primary" | "success" | "error" | "warning" | "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={user.status.charAt(0).toUpperCase() + user.status.slice(1)} 
                      color={getStatusColor(user.status) as "success" | "warning" | "error" | "info" | "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{user.joinDate}</TableCell>
                  <TableCell align="center">{user.lastActive}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={(e) => { e.stopPropagation(); /* edit action */ }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={(e) => { e.stopPropagation(); /* block/suspend action */ }}>
                      <BlockIcon />
                    </IconButton>
                    <IconButton onClick={(e) => { e.stopPropagation(); /* more options */ }}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </TabPanel>

      {/* Other tabs have similar content structure but with filtered data */}
      <TabPanel value={tabValue} index={1}>
        {/* Students tab content - Similar to All Users but filtered for students */}
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="students table">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Join Date</TableCell>
                <TableCell align="center">Completed Courses</TableCell>
                <TableCell align="center">Avg. Score</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                <TableRow
                  key={user.id}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                  onClick={() => handleUserClick(user)}
                >
                  <TableCell component="th" scope="row" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      src={user.avatar} 
                      alt={user.name}
                      sx={{ mr: 2 }}
                    >
                      {!user.avatar && user.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={user.status.charAt(0).toUpperCase() + user.status.slice(1)} 
                      color={getStatusColor(user.status) as "success" | "warning" | "error" | "info" | "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{user.joinDate}</TableCell>
                  <TableCell align="center">{user.stats.completedCourses}</TableCell>
                  <TableCell align="center">{user.stats.averageScore}%</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={(e) => { e.stopPropagation(); /* view progress */ }}>
                      <BarChartIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={(e) => { e.stopPropagation(); /* edit action */ }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={(e) => { e.stopPropagation(); /* block/suspend action */ }}>
                      <BlockIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </TabPanel>

      {/* User Detail Dialog */}
      <Dialog open={userDialogOpen} onClose={handleCloseUserDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          User Details
          <IconButton
            aria-label="close"
            onClick={handleCloseUserDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            X
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        selectedUser.verified ? 
                        <VerifiedUserIcon color="primary" /> : 
                        null
                      }
                    >
                      <Avatar 
                        src={selectedUser.avatar} 
                        alt={selectedUser.name}
                        sx={{ width: 120, height: 120, mb: 2 }}
                      >
                        {!selectedUser.avatar && selectedUser.name.charAt(0)}
                      </Avatar>
                    </Badge>
                    <Typography variant="h6" gutterBottom>
                      {selectedUser.name}
                    </Typography>
                    <Chip 
                      label={selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)} 
                      color={getRoleColor(selectedUser.role) as "primary" | "success" | "error" | "warning" | "default"}
                      sx={{ mb: 1 }}
                    />
                    <Chip 
                      label={selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)} 
                      color={getStatusColor(selectedUser.status) as "success" | "warning" | "error" | "info" | "default"}
                    />
                    
                    <Box sx={{ mt: 3, width: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Contact Information
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {selectedUser.email}
                        </Typography>
                      </Box>
                      {selectedUser.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOnIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {selectedUser.location}
                          </Typography>
                        </Box>
                      )}
                      {selectedUser.birthdate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CakeIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            Born: {selectedUser.birthdate}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ mt: 3, width: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Account Information
                      </Typography>
                      <Typography variant="body2">
                        Joined: {selectedUser.joinDate}
                      </Typography>
                      <Typography variant="body2">
                        Last Active: {selectedUser.lastActive}
                      </Typography>
                      <Typography variant="body2">
                        Verification: {selectedUser.verified ? 'Verified' : 'Not Verified'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    User Statistics
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                        <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">{selectedUser.stats.completedCourses}</Typography>
                        <Typography variant="body2">Completed Courses</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                        <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                          <StarIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h4">{selectedUser.stats.totalPoints}</Typography>
                          <Typography variant="body2">Total Points</Typography>
                        </Paper>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                        <BarChartIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">{selectedUser.stats.averageScore}%</Typography>
                        <Typography variant="body2">Average Score</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                        <Typography variant="h4">{selectedUser.stats.timeSpent}h</Typography>
                        <Typography variant="body2">Time Spent</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    User Settings
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={<Switch checked={selectedUser.status === 'active'} />}
                        label="Account Active"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={<Switch checked={selectedUser.verified} />}
                        label="Email Verified"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={<Switch checked={true} />}
                        label="Email Notifications"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={<Switch checked={false} />}
                        label="Two-Factor Authentication"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Change User Role
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant={selectedUser.role === 'student' ? 'contained' : 'outlined'}>
                        Student
                      </Button>
                      <Button variant={selectedUser.role === 'teacher' ? 'contained' : 'outlined'}>
                        Teacher
                      </Button>
                      <Button variant={selectedUser.role === 'parent' ? 'contained' : 'outlined'}>
                        Parent
                      </Button>
                      <Button variant={selectedUser.role === 'admin' ? 'contained' : 'outlined'}>
                        Admin
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Activity Log
                    </Typography>
                    <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>2023-09-29 14:35</strong> - Logged in from Chrome on Windows
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>2023-09-28 10:12</strong> - Completed "Introduction to Algebra" course
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>2023-09-27 16:45</strong> - Changed password
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>2023-09-25 09:30</strong> - Started "Advanced Mathematics" course
                      </Typography>
                      <Typography variant="body2">
                        <strong>2023-09-20 13:15</strong> - Profile updated
                      </Typography>
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog} color="inherit">
            Close
          </Button>
          <Button color="primary" variant="outlined" startIcon={<EmailIcon />}>
            Send Message
          </Button>
          <Button color="primary" variant="contained" startIcon={<EditIcon />}>
            Edit User
          </Button>
          {selectedUser && selectedUser.status !== 'suspended' ? (
            <Button color="error" variant="outlined" startIcon={<BlockIcon />}>
              Suspend User
            </Button>
          ) : (
            <Button color="success" variant="outlined">
              Reactivate User
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 