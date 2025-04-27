import * as React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// Tab Panel Interface and Component
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

const GameSettings: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className="p-6 text-white">
      <Box className="mb-6 flex justify-between items-center">
        <Typography variant="h4" gutterBottom>
          Game Settings
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            sx={{ 
              backgroundColor: '#4D18E8', 
              marginRight: '1rem',
              '&:hover': {
                backgroundColor: '#3b13b5',
              }
            }}
          >
            Save All Settings
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<RestartAltIcon />}
            sx={{ 
              borderColor: '#ff9800',
              color: '#ff9800',
              '&:hover': {
                borderColor: '#e65100',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
              }
            }}
          >
            Reset to Defaults
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
          Game Settings Control Panel
        </Typography>
        <Typography variant="body1" paragraph>
          This control panel allows administrators to configure and fine-tune all aspects of the Duel Learn gaming experience.
          Changes made here will affect how players interact with the platform and how game mechanics function.
        </Typography>
        <Typography variant="body1" paragraph>
          Use these settings carefully as they directly impact user experience, game balance, and progression.
        </Typography>
      </Paper>

      <Paper 
        sx={{ 
          backgroundColor: '#1E1A2B',
          borderRadius: '12px',
          border: '1px solid #3B354D',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: '#3B354D' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              '& .MuiTabs-indicator': { backgroundColor: '#4D18E8' },
              '& .Mui-selected': { color: '#E2DDF3 !important' },
              '& .MuiTab-root': { color: '#9F9BAE' }
            }}
            aria-label="game settings tabs"
          >
            <Tab label="Economy Settings" />
            <Tab label="Game Modes" />
            <Tab label="Card Effects" />
            <Tab label="Statistics" />
            <Tab label="Rewards" />
            <Tab label="Difficulty" />
          </Tabs>
        </Box>

        {/* Economy Settings Panel */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>Economy Settings</Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
              Mana Economy
            </Typography>
            <Paper sx={{ backgroundColor: '#2A2636', p: 2, borderRadius: '8px', mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Initial Mana for New Players</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={200} 
                      min={0} 
                      max={1000}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Daily Mana Regeneration</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={20} 
                      min={0} 
                      max={200}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Mana Cost per Quiz Attempt</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={5} 
                      min={0} 
                      max={100}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
              Coins Economy
            </Typography>
            <Paper sx={{ backgroundColor: '#2A2636', p: 2, borderRadius: '8px', mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Initial Coins for New Players</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={500} 
                      min={0} 
                      max={2000}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Quiz Completion Reward</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={10} 
                      min={0} 
                      max={100}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">PVP Victory Reward</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={25} 
                      min={0} 
                      max={200}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Daily Login Bonus</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={15} 
                      min={0} 
                      max={100}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
              XP and Level Progression
            </Typography>
            <Paper sx={{ backgroundColor: '#2A2636', p: 2, borderRadius: '8px', mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Base XP per Correct Answer</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={5} 
                      min={0} 
                      max={50}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">XP Multiplier for Difficult Questions</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={1.5} 
                      min={1} 
                      max={5}
                      step={0.1}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Level Up XP Requirement Base</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={100} 
                      min={10} 
                      max={1000}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Level Up Scaling Factor</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={1.2} 
                      min={1} 
                      max={2}
                      step={0.1}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        </TabPanel>

        {/* Game Modes Panel */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Game Modes</Typography>
          
          {/* PVP Mode Settings */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
              PVP Mode Settings
            </Typography>
            <Paper sx={{ backgroundColor: '#2A2636', p: 2, borderRadius: '8px', mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={<Switch defaultChecked sx={{ 
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#4D18E8' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4D18E8' }
                  }} />}
                  label="Enable PVP Mode"
                  sx={{ color: '#E2DDF3' }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Time per Question (seconds)</Typography>
                  <Box sx={{ width: 200 }}>
                    <Slider
                      defaultValue={30}
                      step={5}
                      marks
                      min={10}
                      max={120}
                      valueLabelDisplay="auto"
                      sx={{ 
                        color: '#4D18E8',
                        '& .MuiSlider-thumb': { backgroundColor: '#E2DDF3' },
                        '& .MuiSlider-rail': { backgroundColor: '#3B354D' }
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Number of Questions per Battle</Typography>
                  <Box sx={{ width: 200 }}>
                    <Slider
                      defaultValue={10}
                      step={1}
                      marks
                      min={5}
                      max={20}
                      valueLabelDisplay="auto"
                      sx={{ 
                        color: '#4D18E8',
                        '& .MuiSlider-thumb': { backgroundColor: '#E2DDF3' },
                        '& .MuiSlider-rail': { backgroundColor: '#3B354D' }
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">PVP Matchmaking Timeout (seconds)</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={60} 
                      min={10} 
                      max={300}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
          
          {/* Peaceful Mode Settings */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
              Peaceful Mode Settings
            </Typography>
            <Paper sx={{ backgroundColor: '#2A2636', p: 2, borderRadius: '8px', mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={<Switch defaultChecked sx={{ 
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#4D18E8' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4D18E8' }
                  }} />}
                  label="Enable Peaceful Mode"
                  sx={{ color: '#E2DDF3' }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Minimum Correct Answers for Rewards</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={3} 
                      min={1} 
                      max={10}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Maximum Questions per Session</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={30} 
                      min={5} 
                      max={100}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
          
          {/* Time Pressured Mode Settings */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
              Time Pressured Mode Settings
            </Typography>
            <Paper sx={{ backgroundColor: '#2A2636', p: 2, borderRadius: '8px', mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={<Switch defaultChecked sx={{ 
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#4D18E8' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4D18E8' }
                  }} />}
                  label="Enable Time Pressured Mode"
                  sx={{ color: '#E2DDF3' }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Initial Time (seconds)</Typography>
                  <Box sx={{ width: 200 }}>
                    <Slider
                      defaultValue={60}
                      step={10}
                      marks
                      min={30}
                      max={180}
                      valueLabelDisplay="auto"
                      sx={{ 
                        color: '#4D18E8',
                        '& .MuiSlider-thumb': { backgroundColor: '#E2DDF3' },
                        '& .MuiSlider-rail': { backgroundColor: '#3B354D' }
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Time Bonus per Correct Answer (seconds)</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={5} 
                      min={1} 
                      max={30}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Time Penalty per Wrong Answer (seconds)</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={3} 
                      min={0} 
                      max={20}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        </TabPanel>

        {/* Card Effects Panel - to be implemented */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Card Effects Panel</Typography>
          <Paper sx={{ backgroundColor: '#2A2636', p: 4, borderRadius: '8px', mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Configure PVP card effects and modifiers that players can use during battle.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
              {/* Card Effect 1 */}
              <Paper sx={{ backgroundColor: '#1E1A2B', p: 2, borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#E2DDF3' }}>
                    Time Boost Card
                  </Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked sx={{ 
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#4D18E8' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4D18E8' }
                    }} />}
                    label="Enabled"
                    sx={{ color: '#E2DDF3' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ mb: 2, color: '#9F9BAE' }}>
                  Gives player an additional time bonus during their turn.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Effect Strength (seconds)</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={10} 
                      min={1} 
                      max={30}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Card Effect 2 */}
              <Paper sx={{ backgroundColor: '#1E1A2B', p: 2, borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#E2DDF3' }}>
                    Opponent Time Reduction
                  </Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked sx={{ 
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#4D18E8' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4D18E8' }
                    }} />}
                    label="Enabled"
                    sx={{ color: '#E2DDF3' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ mb: 2, color: '#9F9BAE' }}>
                  Reduces opponent's available time for answering questions.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Effect Strength (seconds)</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input 
                      type="number" 
                      defaultValue={5} 
                      min={1} 
                      max={15}
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-24 border border-[#3B354D]"
                    />
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Card Effect 3 */}
              <Paper sx={{ backgroundColor: '#1E1A2B', p: 2, borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#E2DDF3' }}>
                    Question Difficulty Modifier
                  </Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked sx={{ 
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#4D18E8' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4D18E8' }
                    }} />}
                    label="Enabled"
                    sx={{ color: '#E2DDF3' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ mb: 2, color: '#9F9BAE' }}>
                  Forces opponent to receive a more difficult question on their next turn.
            </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Difficulty Increase Level</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <select 
                      defaultValue="medium" 
                      className="bg-[#1E1A2B] text-[#E2DDF3] rounded-md p-2 w-32 border border-[#3B354D]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <Button size="small" variant="outlined" sx={{ color: '#4D18E8', borderColor: '#4D18E8' }}>
                      Update
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Add New Card Effect Button */}
              <Button 
                variant="outlined"
                sx={{ 
                  borderColor: '#4D18E8', 
                  color: '#4D18E8',
                  borderStyle: 'dashed',
                  borderWidth: '2px',
                  p: 2,
                  mt: 2
                }}
              >
                + Add New Card Effect
              </Button>
            </Box>
          </Paper>
        </TabPanel>

        {/* Statistics Panel - to be implemented */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>Game Statistics</Typography>
          
          <Paper sx={{ backgroundColor: '#2A2636', p: 3, borderRadius: '8px', mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Review and configure game mode statistics and metrics. Use this panel to track player engagement and gameplay data.
            </Typography>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
                Game Mode Usage Statistics
              </Typography>
              <Paper sx={{ backgroundColor: '#1E1A2B', p: 2, borderRadius: '8px', mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  {/* PVP Mode Stats */}
                  <Box sx={{ p: 2, bgcolor: 'rgba(77, 24, 232, 0.1)', borderRadius: '8px', border: '1px solid rgba(77, 24, 232, 0.3)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#E2DDF3', mb: 1 }}>
                      PVP Mode
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Total Battles:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>1,254</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Active Users:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>428</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Avg. Time/Battle:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>4:32</Typography>
                    </Box>
                    <Button size="small" sx={{ mt: 1, color: '#4D18E8' }}>View Details</Button>
                  </Box>

                  {/* Peaceful Mode Stats */}
                  <Box sx={{ p: 2, bgcolor: 'rgba(46, 196, 134, 0.1)', borderRadius: '8px', border: '1px solid rgba(46, 196, 134, 0.3)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#E2DDF3', mb: 1 }}>
                      Peaceful Mode
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Total Sessions:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>2,875</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Active Users:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>982</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Avg. Session Time:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>12:18</Typography>
                    </Box>
                    <Button size="small" sx={{ mt: 1, color: '#2EC486' }}>View Details</Button>
                  </Box>

                  {/* Time Pressured Mode Stats */}
                  <Box sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#E2DDF3', mb: 1 }}>
                      Time Pressured Mode
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Total Sessions:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>1,532</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Active Users:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>376</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Avg. Questions/Session:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>18.3</Typography>
                    </Box>
                    <Button size="small" sx={{ mt: 1, color: '#ff9800' }}>View Details</Button>
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#E2DDF3', fontWeight: 'bold' }}>
                Resource Usage & Performance
              </Typography>
              <Paper sx={{ backgroundColor: '#1E1A2B', p: 2, borderRadius: '8px', mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  {/* Economy Stats */}
                  <Box sx={{ p: 2, bgcolor: 'rgba(144, 202, 249, 0.1)', borderRadius: '8px', border: '1px solid rgba(144, 202, 249, 0.3)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#E2DDF3', mb: 1 }}>
                      Economy Metrics
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Total Mana Spent:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>24,876</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Total Coins Earned:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>156,392</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>XP Distributed:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>498,237</Typography>
                    </Box>
                    <Button size="small" sx={{ mt: 1, color: '#90CAF9' }}>View Details</Button>
                  </Box>

                  {/* System Performance */}
                  <Box sx={{ p: 2, bgcolor: 'rgba(236, 64, 122, 0.1)', borderRadius: '8px', border: '1px solid rgba(236, 64, 122, 0.3)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#E2DDF3', mb: 1 }}>
                      System Performance
            </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Avg. Matchmaking Time:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>12.4s</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Concurrent Users (Peak):</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>245</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9F9BAE' }}>Server Response Time:</Typography>
                      <Typography variant="body2" sx={{ color: '#E2DDF3' }}>98ms</Typography>
                    </Box>
                    <Button size="small" sx={{ mt: 1, color: '#EC407A' }}>View Details</Button>
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                sx={{ 
                  backgroundColor: '#4D18E8', 
                  '&:hover': {
                    backgroundColor: '#3b13b5',
                  }
                }}
              >
                Generate Full Report
              </Button>
            </Box>
          </Paper>
        </TabPanel>

        {/* Rewards Panel - to be implemented */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>Rewards Panel</Typography>
          <Paper sx={{ backgroundColor: '#2A2636', p: 4, borderRadius: '8px', mb: 3 }}>
            <Typography variant="body1" paragraph>
              Rewards system configuration will be implemented in a future update.
            </Typography>
          </Paper>
        </TabPanel>

        {/* Difficulty Panel - to be implemented */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>Difficulty Panel</Typography>
          <Paper sx={{ backgroundColor: '#2A2636', p: 4, borderRadius: '8px', mb: 3 }}>
            <Typography variant="body1" paragraph>
              Difficulty levels configuration will be implemented in a future update.
            </Typography>
          </Paper>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default GameSettings; 