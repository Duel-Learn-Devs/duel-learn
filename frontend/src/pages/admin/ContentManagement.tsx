import * as React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Chip,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SortIcon from '@mui/icons-material/Sort';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

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
      id={`content-tabpanel-${index}`}
      aria-labelledby={`content-tab-${index}`}
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

interface ContentItem {
  id: string;
  title: string;
  type: 'AI-Generated' | 'User-Generated' | 'flashcards' | 'notes' | 'quiz' | 'practice';
  tags: string[];
  createdBy: string;
  createdAt: string;
  status: 'published' | 'draft' | 'archived' | 'under review';
  engagement: {
    views: number;
    completions: number;
    averageRating: number;
  };
}

const sampleContentItems: ContentItem[] = [
  {
    id: 'content-001',
    title: 'Algebra Fundamentals Flashcards',
    type: 'User-Generated',
    tags: ['Mathematics', 'algebra', 'fundamentals', 'equations'],
    createdBy: 'beginner',
    createdAt: '2023-08-15',
    status: 'published',
    engagement: {
      views: 1245,
      completions: 856,
      averageRating: 4.7
    }
  },
  {
    id: 'content-002',
    title: 'Advanced Calculus Study Notes',
    type: 'AI-Generated',
    tags: ['Mathematics', 'calculus', 'derivatives', 'integrals'],
    createdBy: 'advanced',
    createdAt: '2023-07-22',
    status: 'published',
    engagement: {
      views: 765,
      completions: 342,
      averageRating: 4.5
    }
  },
  {
    id: 'content-003',
    title: 'Chemistry Periodic Table Quiz',
    type: 'User-Generated',
    tags: ['Chemistry', 'elements', 'periodic table'],
    createdBy: 'beginner',
    createdAt: '2023-09-05',
    status: 'published',
    engagement: {
      views: 2341,
      completions: 1987,
      averageRating: 4.8
    }
  },
  {
    id: 'content-004',
    title: 'Physics Practice Problems: Forces',
    type: 'AI-Generated',
    tags: ['Physics', 'forces', 'motion'],
    createdBy: 'intermediate',
    createdAt: '2023-08-30',
    status: 'draft',
    engagement: {
      views: 0,
      completions: 0,
      averageRating: 0
    }
  },
  {
    id: 'content-005',
    title: 'Biology Cell Structure Notes',
    type: 'User-Generated',
    tags: ['Biology', 'cells', 'organelles'],
    createdBy: 'beginner',
    createdAt: '2023-07-10',
    status: 'under review',
    engagement: {
      views: 546,
      completions: 421,
      averageRating: 4.3
    }
  },
  {
    id: 'content-006',
    title: 'World History Timeline Practice',
    type: 'AI-Generated',
    tags: ['History', 'timeline', 'events'],
    createdBy: 'advanced',
    createdAt: '2023-09-12',
    status: 'archived',
    engagement: {
      views: 1265,
      completions: 542,
      averageRating: 3.9
    }
  }
];

const ContentManagement: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedContentType, setSelectedContentType] = React.useState<string>('all');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>('all');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [currentContent, setCurrentContent] = React.useState<ContentItem | null>(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

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

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handlePreviewContent = (content: ContentItem) => {
    setCurrentContent(content);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Filter content based on search query and filters
  const filteredContent = sampleContentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedContentType === 'all' || item.type === selectedContentType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesCreatedBy = selectedDifficulty === 'all' || item.createdBy === selectedDifficulty;
    
    return matchesSearch && matchesType && matchesStatus && matchesCreatedBy;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'published': return 'success';
      case 'draft': return 'default';
      case 'under review': return 'warning';
      case 'archived': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#080511', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#E2DDF3' }}>
          Study Material Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => window.location.href = '/admin/create-study-material'}
          sx={{
            backgroundColor: '#4D18E8',
            color: '#E2DDF3',
            '&:hover': {
              backgroundColor: '#3b10b9'
            }
          }}
        >
          Create New Study Material
        </Button>
      </Box>

      <Paper sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: '#1E1A2B',
        border: '1px solid #3B354D',
        borderRadius: '1rem'
      }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#E2DDF3' }}>
          Study Material Overview
        </Typography>
        <Typography paragraph sx={{ color: '#9F9BAE' }}>
          Manage all study materials including flashcards, notes, quizzes, and practice exercises. Monitor engagement metrics and ensure quality across all subjects and difficulty levels.
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search by title, tags, or content..."
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9F9BAE' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#2A2636',
                  '& fieldset': {
                    borderColor: '#3B354D',
                  },
                  '&:hover fieldset': {
                    borderColor: '#4D18E8',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4D18E8',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: '#E2DDF3',
                  '&::placeholder': {
                    color: '#9F9BAE',
                    opacity: 1,
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              onClick={handleFilterClick}
              sx={{ 
                height: '100%',
                borderColor: '#3B354D',
                color: '#E2DDF3',
                '&:hover': {
                  borderColor: '#4D18E8',
                  backgroundColor: 'rgba(77, 24, 232, 0.08)'
                }
              }}
            >
              Filter
            </Button>
            {filterAnchorEl && (
              <Paper sx={{ 
                position: 'absolute', 
                zIndex: 1, 
                mt: 1, 
                p: 2, 
                minWidth: 300,
                backgroundColor: '#2A2636',
                border: '1px solid #3B354D',
                borderRadius: '1rem',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)'
              }}>
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3' }}>
                  Filter Content
                </Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="content-type-label" sx={{ color: '#9F9BAE' }}>Content Type</InputLabel>
                  <Select
                    labelId="content-type-label"
                    value={selectedContentType}
                    label="Content Type"
                    onChange={(e) => setSelectedContentType(e.target.value)}
                    sx={{
                      color: '#E2DDF3',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3B354D'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4D18E8'
                      },
                      '.MuiSvgIcon-root': {
                        color: '#9F9BAE'
                      },
                      backgroundColor: '#1E1A2B'
                    }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="AI-Generated">AI-Generated</MenuItem>
                    <MenuItem value="User-Generated">User-Generated</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="status-label" sx={{ color: '#9F9BAE' }}>Status</InputLabel>
                  <Select
                    labelId="status-label"
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    sx={{
                      color: '#E2DDF3',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3B354D'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4D18E8'
                      },
                      '.MuiSvgIcon-root': {
                        color: '#9F9BAE'
                      },
                      backgroundColor: '#1E1A2B'
                    }}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="under review">Under Review</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="difficulty-label" sx={{ color: '#9F9BAE' }}>Difficulty</InputLabel>
                  <Select
                    labelId="difficulty-label"
                    value={selectedDifficulty}
                    label="Difficulty"
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    sx={{
                      color: '#E2DDF3',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3B354D'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4D18E8'
                      },
                      '.MuiSvgIcon-root': {
                        color: '#9F9BAE'
                      },
                      backgroundColor: '#1E1A2B'
                    }}
                  >
                    <MenuItem value="all">All Levels</MenuItem>
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button onClick={handleFilterClose}>
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleFilterClose}
                  >
                    Apply Filters
                  </Button>
                </Box>
              </Paper>
            )}
          </Grid>
          <Grid item xs={6} md={2}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<SortIcon />}
              onClick={handleSortClick}
              sx={{ 
                height: '100%',
                borderColor: '#3B354D',
                color: '#E2DDF3',
                '&:hover': {
                  borderColor: '#4D18E8',
                  backgroundColor: 'rgba(77, 24, 232, 0.08)'
                }
              }}
            >
              Sort
            </Button>
            {sortAnchorEl && (
              <Paper sx={{ 
                position: 'absolute', 
                zIndex: 1, 
                mt: 1, 
                p: 2, 
                minWidth: 200,
                backgroundColor: '#2A2636',
                border: '1px solid #3B354D',
                borderRadius: '1rem',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)'
              }}>
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3' }}>
                  Sort By
                </Typography>
                <MenuItem onClick={handleSortClose} sx={{ color: '#E2DDF3', '&:hover': { backgroundColor: 'rgba(77, 24, 232, 0.08)' } }}>
                  Title (A-Z)
                </MenuItem>
                <MenuItem onClick={handleSortClose} sx={{ color: '#E2DDF3', '&:hover': { backgroundColor: 'rgba(77, 24, 232, 0.08)' } }}>
                  Title (Z-A)
                </MenuItem>
                <MenuItem onClick={handleSortClose} sx={{ color: '#E2DDF3', '&:hover': { backgroundColor: 'rgba(77, 24, 232, 0.08)' } }}>
                  Date Created (Newest)
                </MenuItem>
                <MenuItem onClick={handleSortClose} sx={{ color: '#E2DDF3', '&:hover': { backgroundColor: 'rgba(77, 24, 232, 0.08)' } }}>
                  Date Created (Oldest)
                </MenuItem>
                <MenuItem onClick={handleSortClose} sx={{ color: '#E2DDF3', '&:hover': { backgroundColor: 'rgba(77, 24, 232, 0.08)' } }}>
                  Most Views
                </MenuItem>
                <MenuItem onClick={handleSortClose} sx={{ color: '#E2DDF3', '&:hover': { backgroundColor: 'rgba(77, 24, 232, 0.08)' } }}>
                  Highest Completion Rate
                </MenuItem>
                <MenuItem onClick={handleSortClose} sx={{ color: '#E2DDF3', '&:hover': { backgroundColor: 'rgba(77, 24, 232, 0.08)' } }}>
                  Highest Rating
                </MenuItem>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ 
        borderBottom: 1, 
        borderColor: '#3B354D',
        '.MuiTabs-indicator': {
          backgroundColor: '#4D18E8'
        }
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="study material management tabs"
          sx={{
            '& .MuiTab-root': {
              color: '#9F9BAE',
              '&.Mui-selected': {
                color: '#E2DDF3'
              }
            }
          }}
        >
          <Tab label="All Materials" id="content-tab-0" />
          <Tab label="AI-Generated" id="content-tab-1" />
          <Tab label="User-Generated" id="content-tab-2" />
          <Tab label="Quizzes" id="content-tab-3" />
          <Tab label="Practice" id="content-tab-4" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper} sx={{ 
          backgroundColor: '#1E1A2B',
          border: '1px solid #3B354D',
          borderRadius: '1rem'
        }}>
          <Table sx={{ minWidth: 650 }} aria-label="study materials table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#E2DDF3', borderBottom: '1px solid #3B354D', fontWeight: 600 }}>Study Material</TableCell>
                <TableCell align="center" sx={{ color: '#E2DDF3', borderBottom: '1px solid #3B354D', fontWeight: 600 }}>Type</TableCell>
                <TableCell align="center" sx={{ color: '#E2DDF3', borderBottom: '1px solid #3B354D', fontWeight: 600 }}>Subject</TableCell>
                <TableCell align="center" sx={{ color: '#E2DDF3', borderBottom: '1px solid #3B354D', fontWeight: 600 }}>Difficulty</TableCell>
                <TableCell align="center" sx={{ color: '#E2DDF3', borderBottom: '1px solid #3B354D', fontWeight: 600 }}>Status</TableCell>
                <TableCell align="center" sx={{ color: '#E2DDF3', borderBottom: '1px solid #3B354D', fontWeight: 600 }}>Engagement</TableCell>
                <TableCell align="center" sx={{ color: '#E2DDF3', borderBottom: '1px solid #3B354D', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContent
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((content) => (
                <TableRow
                  key={content.id}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': { backgroundColor: 'rgba(77, 24, 232, 0.08)' },
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <TableCell 
                    component="th" 
                    scope="row"
                    sx={{ borderBottom: '1px solid #3B354D' }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: '#E2DDF3', fontWeight: 500 }}>
                        {content.title}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ color: '#9F9BAE' }}>
                        Created by {content.createdBy} • {content.createdAt}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {content.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{
                              mr: 0.5,
                              mb: 0.5,
                              backgroundColor: '#2A2636',
                              color: '#9F9BAE',
                              border: '1px solid #3B354D',
                              '&:hover': {
                                backgroundColor: '#3B354D'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ borderBottom: '1px solid #3B354D' }}
                  >
                    <Chip 
                      label={content.type.charAt(0).toUpperCase() + content.type.slice(1)}
                      sx={{
                        backgroundColor: '#2A2636',
                        color: '#E2DDF3',
                        border: '1px solid #3B354D',
                        '&:hover': {
                          backgroundColor: '#3B354D'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ color: '#E2DDF3', borderBottom: '1px solid #3B354D' }}
                  >
                    {content.tags.join(', ')}
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ borderBottom: '1px solid #3B354D' }}
                  >
                    <Chip 
                      label={content.createdBy.charAt(0).toUpperCase() + content.createdBy.slice(1)} 
                      color={getDifficultyColor(content.createdBy) as "success" | "warning" | "error" | "default"}
                      sx={{
                        backgroundColor: 'rgba(77, 24, 232, 0.1)',
                        color: '#E2DDF3',
                        border: '1px solid rgba(77, 24, 232, 0.2)'
                      }}
                    />
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ borderBottom: '1px solid #3B354D' }}
                  >
                    <Chip 
                      label={content.status.charAt(0).toUpperCase() + content.status.slice(1)} 
                      color={getStatusColor(content.status) as "success" | "warning" | "error" | "default"}
                      sx={{
                        '&.MuiChip-colorSuccess': {
                          backgroundColor: 'rgba(46, 196, 134, 0.1)',
                          color: '#2EC486',
                          border: '1px solid rgba(46, 196, 134, 0.2)'
                        },
                        '&.MuiChip-colorWarning': {
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                          color: '#FF9800',
                          border: '1px solid rgba(255, 152, 0, 0.2)'
                        },
                        '&.MuiChip-colorError': {
                          backgroundColor: 'rgba(255, 82, 82, 0.1)',
                          color: '#FF5252',
                          border: '1px solid rgba(255, 82, 82, 0.2)'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ borderBottom: '1px solid #3B354D' }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>
                        {content.engagement.views.toLocaleString()} views
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>
                        {content.engagement.completions.toLocaleString()} completions
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>
                        {content.engagement.averageRating.toFixed(1)} ★
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ borderBottom: '1px solid #3B354D' }}
                  >
                    <IconButton 
                      onClick={() => handlePreviewContent(content)} 
                      sx={{ 
                        color: '#9F9BAE',
                        '&:hover': {
                          color: '#E2DDF3',
                          backgroundColor: 'rgba(77, 24, 232, 0.08)'
                        }
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      sx={{ 
                        color: '#4D18E8',
                        '&:hover': {
                          color: '#3b10b9',
                          backgroundColor: 'rgba(77, 24, 232, 0.08)'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      sx={{ 
                        color: '#9F9BAE',
                        '&:hover': {
                          color: '#E2DDF3',
                          backgroundColor: 'rgba(77, 24, 232, 0.08)'
                        }
                      }}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                    <IconButton 
                      sx={{ 
                        color: '#FF5252',
                        '&:hover': {
                          color: '#ff0000',
                          backgroundColor: 'rgba(255, 82, 82, 0.08)'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredContent.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              color: '#E2DDF3',
              '.MuiTablePagination-select': {
                color: '#E2DDF3',
                backgroundColor: '#2A2636',
                borderColor: '#3B354D'
              },
              '.MuiTablePagination-selectIcon': {
                color: '#9F9BAE'
              },
              '.MuiTablePagination-displayedRows': {
                color: '#E2DDF3'
              },
              '.MuiTablePagination-actions': {
                color: '#E2DDF3',
                '& .MuiIconButton-root': {
                  color: '#9F9BAE',
                  '&:hover': {
                    backgroundColor: 'rgba(77, 24, 232, 0.08)',
                    color: '#E2DDF3'
                  },
                  '&.Mui-disabled': {
                    color: '#3B354D'
                  }
                }
              }
            }}
          />
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {sampleContentItems
            .filter(item => item.type === 'AI-Generated')
            .map(content => (
            <Grid item xs={12} sm={6} md={4} key={content.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div">
                    {content.title}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      size="small" 
                      label={content.tags.join(', ')} 
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip 
                      size="small" 
                      label={content.createdBy.charAt(0).toUpperCase() + content.createdBy.slice(1)} 
                      color={getDifficultyColor(content.createdBy) as "success" | "warning" | "error" | "default"}
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip 
                      size="small" 
                      label={content.status.charAt(0).toUpperCase() + content.status.slice(1)} 
                      color={getStatusColor(content.status) as "success" | "warning" | "error" | "default"}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Created: {content.createdAt}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    By: {content.createdBy}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Views: {content.engagement.views}
                    </Typography>
                    <Typography variant="body2">
                      Completions: {content.engagement.completions}
                    </Typography>
                    <Typography variant="body2">
                      Rating: {content.engagement.averageRating.toFixed(1)} / 5.0
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handlePreviewContent(content)}>
                    Preview
                  </Button>
                  <Button size="small" startIcon={<EditIcon />} color="primary">
                    Edit
                  </Button>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {sampleContentItems
            .filter(item => item.type === 'User-Generated')
            .map(content => (
            <Grid item xs={12} sm={6} md={4} key={content.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div">
                    {content.title}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      size="small" 
                      label={content.tags.join(', ')} 
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip 
                      size="small" 
                      label={content.createdBy.charAt(0).toUpperCase() + content.createdBy.slice(1)} 
                      color={getDifficultyColor(content.createdBy) as "success" | "warning" | "error" | "default"}
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip 
                      size="small" 
                      label={content.status.charAt(0).toUpperCase() + content.status.slice(1)} 
                      color={getStatusColor(content.status) as "success" | "warning" | "error" | "default"}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Created: {content.createdAt}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    By: {content.createdBy}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Views: {content.engagement.views}
                    </Typography>
                    <Typography variant="body2">
                      Completions: {content.engagement.completions}
                    </Typography>
                    <Typography variant="body2">
                      Rating: {content.engagement.averageRating.toFixed(1)} / 5.0
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handlePreviewContent(content)}>
                    Preview
                  </Button>
                  <Button size="small" startIcon={<EditIcon />} color="primary">
                    Edit
                  </Button>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {filteredContent
            .filter(item => item.type === 'quiz')
            .map(content => (
            <Grid item xs={12} sm={6} md={4} key={content.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div">
                    {content.title}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      size="small" 
                      label={content.tags.join(', ')} 
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip 
                      size="small" 
                      label={content.createdBy.charAt(0).toUpperCase() + content.createdBy.slice(1)} 
                      color={getDifficultyColor(content.createdBy) as "success" | "warning" | "error" | "default"}
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip 
                      size="small" 
                      label={content.status.charAt(0).toUpperCase() + content.status.slice(1)} 
                      color={getStatusColor(content.status) as "success" | "warning" | "error" | "default"}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Created: {content.createdAt}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    By: {content.createdBy}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Views: {content.engagement.views}
                    </Typography>
                    <Typography variant="body2">
                      Completions: {content.engagement.completions}
                    </Typography>
                    <Typography variant="body2">
                      Rating: {content.engagement.averageRating.toFixed(1)} / 5.0
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handlePreviewContent(content)}>
                    Preview
                  </Button>
                  <Button size="small" startIcon={<EditIcon />} color="primary">
                    Edit
                  </Button>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          {filteredContent
            .filter(item => item.type === 'practice')
            .map(content => (
            <Grid item xs={12} sm={6} md={4} key={content.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div">
                    {content.title}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      size="small" 
                      label={content.tags.join(', ')} 
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip 
                      size="small" 
                      label={content.createdBy.charAt(0).toUpperCase() + content.createdBy.slice(1)} 
                      color={getDifficultyColor(content.createdBy) as "success" | "warning" | "error" | "default"}
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip 
                      size="small" 
                      label={content.status.charAt(0).toUpperCase() + content.status.slice(1)} 
                      color={getStatusColor(content.status) as "success" | "warning" | "error" | "default"}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Created: {content.createdAt}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    By: {content.createdBy}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Views: {content.engagement.views}
                    </Typography>
                    <Typography variant="body2">
                      Completions: {content.engagement.completions}
                    </Typography>
                    <Typography variant="body2">
                      Rating: {content.engagement.averageRating.toFixed(1)} / 5.0
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handlePreviewContent(content)}>
                    Preview
                  </Button>
                  <Button size="small" startIcon={<EditIcon />} color="primary">
                    Edit
                  </Button>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Study Material Preview Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1E1A2B',
            border: '1px solid #3B354D',
            borderRadius: '1rem',
            color: '#E2DDF3'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #3B354D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" component="div" sx={{ color: '#E2DDF3' }}>
            Study Material Preview
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ 
              color: '#9F9BAE',
              '&:hover': {
                color: '#E2DDF3',
                backgroundColor: 'rgba(77, 24, 232, 0.08)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#3B354D', p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 500 }}>
              {currentContent?.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <Chip 
                label={currentContent?.type.charAt(0).toUpperCase() + currentContent?.type.slice(1)} 
                sx={{ 
                  backgroundColor: '#2A2636',
                  color: '#E2DDF3',
                  border: '1px solid #3B354D'
                }}
              />
              <Chip 
                label={currentContent?.tags.join(', ')} 
                sx={{ 
                  backgroundColor: '#2A2636',
                  color: '#E2DDF3',
                  border: '1px solid #3B354D'
                }}
              />
              <Chip 
                label={currentContent?.createdBy.charAt(0).toUpperCase() + currentContent?.createdBy.slice(1)} 
                color={getDifficultyColor(currentContent?.createdBy) as "success" | "warning" | "error" | "default"}
                sx={{ 
                  backgroundColor: 'rgba(77, 24, 232, 0.1)',
                  color: '#E2DDF3',
                  border: '1px solid rgba(77, 24, 232, 0.2)'
                }}
              />
              <Chip 
                label={currentContent?.status.charAt(0).toUpperCase() + currentContent?.status.slice(1)} 
                color={getStatusColor(currentContent?.status) as "success" | "warning" | "error" | "default"}
                sx={{ 
                  '&.MuiChip-colorSuccess': {
                    backgroundColor: 'rgba(46, 196, 134, 0.1)',
                    color: '#2EC486',
                    border: '1px solid rgba(46, 196, 134, 0.2)'
                  },
                  '&.MuiChip-colorWarning': {
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    color: '#FF9800',
                    border: '1px solid rgba(255, 152, 0, 0.2)'
                  },
                  '&.MuiChip-colorError': {
                    backgroundColor: 'rgba(255, 82, 82, 0.1)',
                    color: '#FF5252',
                    border: '1px solid rgba(255, 82, 82, 0.2)'
                  }
                }}
              />
            </Box>

            <Typography variant="subtitle2" sx={{ color: '#9F9BAE', mb: 2 }}>
              Created by {currentContent?.createdBy} • {currentContent?.createdAt}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 500 }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {currentContent?.tags.map((tag, index) => (
                  <Chip 
                    key={index}
                    label={tag}
                    size="small"
                    sx={{ 
                      backgroundColor: '#2A2636',
                      color: '#9F9BAE',
                      border: '1px solid #3B354D',
                      '&:hover': {
                        backgroundColor: '#3B354D'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 3, borderColor: '#3B354D' }} />

            <Typography variant="h6" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 500 }}>
              Study Material Content
            </Typography>
            
            <Box sx={{ 
              backgroundColor: '#2A2636',
              border: '1px solid #3B354D',
              borderRadius: '0.5rem',
              p: 2,
              mb: 3
            }}>
              <Typography sx={{ color: '#9F9BAE' }}>
                {currentContent?.type === 'flashcards' && 'A set of flashcards for interactive learning'}
                {currentContent?.type === 'notes' && 'Comprehensive study notes with key concepts'}
                {currentContent?.type === 'quiz' && 'Interactive quiz with multiple choice questions'}
                {currentContent?.type === 'practice' && 'Practice exercises with step-by-step solutions'}
              </Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 500 }}>
                Engagement Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    backgroundColor: '#2A2636',
                    border: '1px solid #3B354D',
                    borderRadius: '0.5rem'
                  }}>
                    <Typography variant="h4" sx={{ color: '#E2DDF3' }}>
                      {currentContent?.engagement.views.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Total Views</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    backgroundColor: '#2A2636',
                    border: '1px solid #3B354D',
                    borderRadius: '0.5rem'
                  }}>
                    <Typography variant="h4" sx={{ color: '#E2DDF3' }}>
                      {currentContent?.engagement.completions.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Completions</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    backgroundColor: '#2A2636',
                    border: '1px solid #3B354D',
                    borderRadius: '0.5rem'
                  }}>
                    <Typography variant="h4" sx={{ color: '#E2DDF3' }}>
                      {currentContent?.engagement.averageRating.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Avg. Rating</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid #3B354D',
          p: 2,
          gap: 1
        }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              color: '#9F9BAE',
              '&:hover': {
                color: '#E2DDF3',
                backgroundColor: 'rgba(77, 24, 232, 0.08)'
              }
            }}
          >
            Close
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />} 
            sx={{ 
              borderColor: '#4D18E8',
              color: '#4D18E8',
              '&:hover': {
                borderColor: '#3b10b9',
                backgroundColor: 'rgba(77, 24, 232, 0.08)'
              }
            }}
          >
            Edit Material
          </Button>
          {currentContent?.status !== 'published' && (
            <Button 
              variant="contained" 
              sx={{ 
                backgroundColor: '#4D18E8',
                color: '#E2DDF3',
                '&:hover': {
                  backgroundColor: '#3b10b9'
                }
              }}
            >
              Publish Material
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentManagement; 