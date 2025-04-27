import * as React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  TableSortLabel,
  Stack,
  Checkbox
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { UserData } from './UserData';
import { getStatusColor, formatDate, getAccountTypeColor } from './UserUtils';
const defaultProfile = "/assets/profile-picture/default-picture.svg";

interface UserTableProps {
  users: UserData[];
  onViewUser: (user: UserData) => void;
  onEditUser: (user: UserData) => void;
  onDeleteUser: (userId: string) => void;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedUsers?: string[];
  onToggleSelection?: (userId: string) => void;
}

type Order = 'asc' | 'desc';
type OrderKey = keyof UserData | '';

const UserTable: React.FC<UserTableProps> = ({
  users,
  onViewUser,
  onEditUser,
  onDeleteUser,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  selectedUsers = [],
  onToggleSelection
}) => {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<OrderKey>('');
  const hasSelectionFeature = Boolean(onToggleSelection);

  const handleRequestSort = (property: OrderKey) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedUsers = React.useMemo(() => {
    if (!orderBy) return users;

    return [...users].sort((a, b) => {
      const aValue = a[orderBy as keyof UserData];
      const bValue = b[orderBy as keyof UserData];
      
      if (order === 'asc') {
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue);
        }
        // @ts-ignore - TypeScript can't infer this correctly, but it's safe
        return aValue < bValue ? -1 : 1;
      } else {
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return bValue.localeCompare(aValue);
        }
        // @ts-ignore - TypeScript can't infer this correctly, but it's safe
        return bValue < aValue ? -1 : 1;
      }
    });
  }, [users, order, orderBy]);

  return (
    <Paper
      sx={{
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#1E1A2B',
        border: '1px solid #3B354D',
        borderRadius: 2,
        mb: 3
      }}
    >
      <TableContainer sx={{ maxHeight: 650 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {hasSelectionFeature && (
                <TableCell 
                  padding="checkbox"
                  sx={{
                    backgroundColor: '#181622',
                    borderBottom: '1px solid #3B354D'
                  }}
                >
                  <Checkbox
                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={() => {
                      if (selectedUsers.length === users.length) {
                        onToggleSelection && onToggleSelection("clear-all");
                      } else {
                        const allIds = users.map(user => user.firebase_uid || user.id);
                        onToggleSelection && onToggleSelection("select-all:" + allIds.join(","));
                      }
                    }}
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.5)',
                      '&.Mui-checked': {
                        color: '#4D18E8',
                      },
                      '&.MuiCheckbox-indeterminate': {
                        color: '#4D18E8',
                      }
                    }}
                  />
                </TableCell>
              )}
              <TableCell 
                sx={{
                  backgroundColor: '#181622',
                  color: '#E2DDF3',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #3B354D'
                }}
              >
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleRequestSort('name')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: '#9F9BAE !important',
                    },
                    '&.Mui-active': {
                      color: '#E2DDF3 !important',
                    },
                  }}
                >
                  User
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sx={{
                  backgroundColor: '#181622',
                  color: '#E2DDF3',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #3B354D'
                }}
              >
                <TableSortLabel
                  active={orderBy === 'username'}
                  direction={orderBy === 'username' ? order : 'asc'}
                  onClick={() => handleRequestSort('username')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: '#9F9BAE !important',
                    },
                    '&.Mui-active': {
                      color: '#E2DDF3 !important',
                    },
                  }}
                >
                  Username
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sx={{
                  backgroundColor: '#181622',
                  color: '#E2DDF3',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #3B354D'
                }}
              >
                <TableSortLabel
                  active={orderBy === 'account_type'}
                  direction={orderBy === 'account_type' ? order : 'asc'}
                  onClick={() => handleRequestSort('account_type')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: '#9F9BAE !important',
                    },
                    '&.Mui-active': {
                      color: '#E2DDF3 !important',
                    },
                  }}
                >
                  Account Type
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sx={{
                  backgroundColor: '#181622',
                  color: '#E2DDF3',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #3B354D'
                }}
              >
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: '#9F9BAE !important',
                    },
                    '&.Mui-active': {
                      color: '#E2DDF3 !important',
                    },
                  }}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sx={{
                  backgroundColor: '#181622',
                  color: '#E2DDF3',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #3B354D'
                }}
              >
                <TableSortLabel
                  active={orderBy === 'joinDate'}
                  direction={orderBy === 'joinDate' ? order : 'asc'}
                  onClick={() => handleRequestSort('joinDate')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: '#9F9BAE !important',
                    },
                    '&.Mui-active': {
                      color: '#E2DDF3 !important',
                    },
                  }}
                >
                  Created Date
                </TableSortLabel>
              </TableCell>
              <TableCell 
                align="right"
                sx={{
                  backgroundColor: '#181622',
                  color: '#E2DDF3',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #3B354D'
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => {
                // Use firebase_uid as primary identifier if available, otherwise fall back to id
                // Ensure we always have a userId even if both firebase_uid and id are undefined
                const userId = user.firebase_uid || user.id || `user-${Math.random().toString(36).substr(2, 9)}`;
                const isSelected = selectedUsers.includes(userId);
                
                return (
                  <TableRow
                    hover
                    key={userId}
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      '&:hover': { backgroundColor: 'rgba(77, 24, 232, 0.08)' },
                      borderBottom: '1px solid #3B354D',
                      ...(isSelected && { backgroundColor: 'rgba(77, 24, 232, 0.12)' }),
                    }}
                  >
                    {hasSelectionFeature && (
                      <TableCell padding="checkbox" sx={{ borderBottom: 'none' }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => onToggleSelection?.(userId)}
                          sx={{
                            color: '#9F9BAE',
                            '&.Mui-checked': {
                              color: '#4D18E8',
                            },
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell 
                      component="th" 
                      scope="row"
                      sx={{ 
                        color: '#E2DDF3',
                        borderBottom: 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={(user.avatar || user.display_picture) || defaultProfile} 
                          alt={user.name}
                          sx={{ 
                            mr: 2, 
                            width: 40, 
                            height: 40,
                            bgcolor: '#4D18E8' // Use a themed background color when no image is available
                          }}
                        >
                          {user.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Box sx={{ fontWeight: 'bold', color: '#E2DDF3' }}>{user.name}</Box>
                          <Box sx={{ fontSize: '0.8rem', color: '#9F9BAE' }}>{user.email}</Box>
                          {/* Display database existence flags for users with firebase_uid */}
                          {user.firebase_uid && (
                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                              <Tooltip title={user.existInSQL ? "Exists in SQL" : "Not in SQL"}>
                                <StorageIcon 
                                  fontSize="small" 
                                  sx={{ 
                                    color: user.existInSQL ? '#2EC486' : '#9F9BAE',
                                    opacity: user.existInSQL ? 1 : 0.5,
                                    width: 16,
                                    height: 16
                                  }} 
                                />
                              </Tooltip>
                              <Tooltip title={user.existInFirebaseAuth ? "Exists in Firebase Auth" : "Not in Firebase Auth"}>
                                <CloudDoneIcon 
                                  fontSize="small" 
                                  sx={{ 
                                    color: user.existInFirebaseAuth ? '#4D18E8' : '#9F9BAE',
                                    opacity: user.existInFirebaseAuth ? 1 : 0.5,
                                    width: 16,
                                    height: 16
                                  }} 
                                />
                              </Tooltip>
                              <Tooltip title={user.existInFirestore ? "Exists in Firestore" : "Not in Firestore"}>
                                <LocalFireDepartmentIcon 
                                  fontSize="small" 
                                  sx={{ 
                                    color: user.existInFirestore ? '#FF9800' : '#9F9BAE',
                                    opacity: user.existInFirestore ? 1 : 0.5,
                                    width: 16,
                                    height: 16
                                  }} 
                                />
                              </Tooltip>
                            </Stack>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: '#E2DDF3',
                        borderBottom: 'none'
                      }}
                    >
                      {user.username || '-'}
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#E2DDF3',
                        borderBottom: 'none'
                      }}
                    >
                      <Chip 
                        label={((user.account_type || 'free') + '').toUpperCase()} 
                        size="small" 
                        color={getAccountTypeColor(user.account_type)}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#E2DDF3',
                        borderBottom: 'none'
                      }}
                    >
                      <Chip 
                        label={((user.status || 'unknown') + '').toUpperCase()} 
                        size="small" 
                        color={getStatusColor(user.status || 'unknown')}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#9F9BAE',
                        borderBottom: 'none'
                      }}
                    >
                      {formatDate(user.created_at || user.joinDate)}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        borderBottom: 'none'
                      }}
                    >
                      <Tooltip title="View Details">
                        <IconButton 
                          onClick={() => onViewUser(user)}
                          size="small"
                          sx={{ color: '#9F9BAE', '&:hover': { color: '#E2DDF3' } }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit User">
                        <IconButton 
                          onClick={() => onEditUser(user)}
                          size="small" 
                          sx={{ color: '#9F9BAE', '&:hover': { color: '#4D18E8' } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton 
                          onClick={() => {
                            const userId = user.firebase_uid || user.id;
                            onDeleteUser(userId);
                          }}
                          size="small" 
                          sx={{ color: '#9F9BAE', '&:hover': { color: '#FF5252' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            {sortedUsers.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={hasSelectionFeature ? 7 : 6} 
                  align="center"
                  sx={{ 
                    color: '#9F9BAE',
                    py: 5,
                    borderBottom: 'none'
                  }}
                >
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={users.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        sx={{
          color: '#E2DDF3',
          borderTop: '1px solid #3B354D',
          '.MuiTablePagination-selectIcon': {
            color: '#9F9BAE',
          },
          '.MuiTablePagination-select': {
            color: '#E2DDF3',
          },
          '.MuiTablePagination-selectLabel': {
            color: '#9F9BAE',
          },
          '.MuiTablePagination-displayedRows': {
            color: '#9F9BAE',
          },
          '.MuiTablePagination-actions': {
            color: '#E2DDF3',
          }
        }}
      />
    </Paper>
  );
};

export default UserTable; 