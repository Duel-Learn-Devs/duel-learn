import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  Tabs, 
  Tab, 
  Divider, 
  Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Preview';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CreateContent: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [contentType, setContentType] = useState('course');
  const [difficulty, setDifficulty] = useState('beginner');
  const [tags, setTags] = useState<string[]>(['education']);
  const [currentTag, setCurrentTag] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Box className="p-6 text-white">
      <Box className="mb-6 flex justify-between items-center">
        <Typography variant="h4" gutterBottom>
          Create New Content
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<PreviewIcon />}
            sx={{ 
              borderColor: '#4D18E8',
              color: '#4D18E8',
              mr: 2,
              '&:hover': {
                borderColor: '#3b13b5',
                backgroundColor: 'rgba(77, 24, 232, 0.1)',
              }
            }}
          >
            Preview
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            sx={{ 
              backgroundColor: '#4D18E8', 
              '&:hover': {
                backgroundColor: '#3b13b5',
              }
            }}
          >
            Save Content
          </Button>
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
          Content Creation Guidelines
        </Typography>
        <Typography variant="body1" paragraph>
          This page provides tools for creating new educational content in the Duel Learn platform. When creating content, please:
        </Typography>
        <ul className="list-disc ml-6 mb-4 text-gray-300">
          <li className="mb-2">Ensure that educational objectives are clearly defined</li>
          <li className="mb-2">Provide accurate, up-to-date information from reliable sources</li>
          <li className="mb-2">Structure content in a logical sequence with clear progression</li>
          <li className="mb-2">Include varied learning activities to engage different learning styles</li>
          <li className="mb-2">Use inclusive language and examples that represent diverse perspectives</li>
          <li className="mb-2">Provide meaningful assessment opportunities aligned with learning objectives</li>
          <li className="mb-2">Upload high-quality media that enhances the learning experience</li>
        </ul>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: '#3B354D' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ 
            '& .MuiTabs-indicator': { backgroundColor: '#4D18E8' },
            '& .Mui-selected': { color: '#E2DDF3 !important' },
            '& .MuiTab-root': { color: '#9F9BAE' }
          }}
        >
          <Tab label="Basic Information" />
          <Tab label="Content" />
          <Tab label="Media" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              variant="outlined"
              sx={{
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
                '& .MuiInputLabel-root': {
                  color: '#9F9BAE',
                },
                '& .MuiInputBase-input': {
                  color: '#E2DDF3',
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth
              sx={{
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
                '& .MuiInputLabel-root': {
                  color: '#9F9BAE',
                },
                '& .MuiSelect-select': {
                  color: '#E2DDF3',
                },
              }}
            >
              <InputLabel>Content Type</InputLabel>
              <Select
                value={contentType}
                label="Content Type"
                onChange={(e) => setContentType(e.target.value as string)}
              >
                <MenuItem value="course">Course</MenuItem>
                <MenuItem value="quiz">Quiz</MenuItem>
                <MenuItem value="lesson">Single Lesson</MenuItem>
                <MenuItem value="resource">Learning Resource</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth
              sx={{
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
                '& .MuiInputLabel-root': {
                  color: '#9F9BAE',
                },
                '& .MuiSelect-select': {
                  color: '#E2DDF3',
                },
              }}
            >
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={difficulty}
                label="Difficulty Level"
                onChange={(e) => setDifficulty(e.target.value as string)}
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              variant="outlined"
              sx={{
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
                '& .MuiInputLabel-root': {
                  color: '#9F9BAE',
                },
                '& .MuiInputBase-input': {
                  color: '#E2DDF3',
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3' }}>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                label="Add Tag"
                variant="outlined"
                size="small"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                sx={{
                  mr: 2,
                  flexGrow: 1,
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
                  '& .MuiInputLabel-root': {
                    color: '#9F9BAE',
                  },
                  '& .MuiInputBase-input': {
                    color: '#E2DDF3',
                  },
                }}
              />
              <Button 
                variant="contained" 
                onClick={handleAddTag}
                sx={{ 
                  backgroundColor: '#4D18E8', 
                  '&:hover': {
                    backgroundColor: '#3b13b5',
                  }
                }}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tags.map((tag) => (
                <Chip 
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  sx={{ 
                    backgroundColor: '#2A2636',
                    color: '#E2DDF3',
                    '& .MuiChip-deleteIcon': {
                      color: '#9F9BAE',
                      '&:hover': {
                        color: '#ff5252',
                      }
                    }
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', mb: 2 }}>
          Content Editor
        </Typography>
        <Box 
          sx={{ 
            backgroundColor: '#2A2636', 
            borderRadius: '8px', 
            border: '1px solid #3B354D',
            height: '400px',
            mb: 3,
            p: 2,
            color: '#E2DDF3',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}
        >
          // Rich text editor would be integrated here
          Welcome to the Duel Learn content editor. This area would contain a full-featured rich text editor
          allowing you to create and format educational content with support for text formatting,
          lists, tables, code blocks, and embedding media.
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ p: 3, border: '2px dashed #3B354D', borderRadius: '12px', textAlign: 'center', mb: 4 }}>
          <CloudUploadIcon sx={{ fontSize: 60, color: '#4D18E8', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ color: '#E2DDF3' }}>
            Drag and drop files here
          </Typography>
          <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 2 }}>
            Supported formats: PNG, JPG, PDF, MP4, MP3, DOC
          </Typography>
          <Button 
            variant="contained" 
            component="label"
            sx={{ 
              backgroundColor: '#4D18E8', 
              '&:hover': {
                backgroundColor: '#3b13b5',
              }
            }}
          >
            Upload Files
            <input type="file" hidden multiple />
          </Button>
        </Box>
        <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3' }}>
          Media Library
        </Typography>
        <Paper 
          sx={{ 
            backgroundColor: '#1E1A2B', 
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid #3B354D'
          }}
        >
          <Typography variant="body2" sx={{ color: '#9F9BAE', textAlign: 'center' }}>
            No media files uploaded yet. Uploaded files will appear here.
          </Typography>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth
              sx={{
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
                '& .MuiInputLabel-root': {
                  color: '#9F9BAE',
                },
                '& .MuiSelect-select': {
                  color: '#E2DDF3',
                },
              }}
            >
              <InputLabel>Visibility</InputLabel>
              <Select
                defaultValue="draft"
                label="Visibility"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth
              sx={{
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
                '& .MuiInputLabel-root': {
                  color: '#9F9BAE',
                },
                '& .MuiSelect-select': {
                  color: '#E2DDF3',
                },
              }}
            >
              <InputLabel>Access Level</InputLabel>
              <Select
                defaultValue="all"
                label="Access Level"
              >
                <MenuItem value="all">All Users</MenuItem>
                <MenuItem value="registered">Registered Users Only</MenuItem>
                <MenuItem value="premium">Premium Users Only</MenuItem>
                <MenuItem value="specific">Specific User Groups</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ bgcolor: '#3B354D', my: 2 }} />
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3' }}>
              Advanced Settings
            </Typography>
            
            <Paper 
              sx={{ 
                backgroundColor: '#2A2636', 
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #3B354D',
                mb: 3
              }}
            >
              <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 2 }}>
                These settings control advanced features for your content.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estimated Completion Time (minutes)"
                    type="number"
                    variant="outlined"
                    defaultValue="30"
                    sx={{
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
                        backgroundColor: '#1E1A2B',
                      },
                      '& .MuiInputLabel-root': {
                        color: '#9F9BAE',
                      },
                      '& .MuiInputBase-input': {
                        color: '#E2DDF3',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Maximum Attempts (if applicable)"
                    type="number"
                    variant="outlined"
                    defaultValue="0"
                    sx={{
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
                        backgroundColor: '#1E1A2B',
                      },
                      '& .MuiInputLabel-root': {
                        color: '#9F9BAE',
                      },
                      '& .MuiInputBase-input': {
                        color: '#E2DDF3',
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default CreateContent; 