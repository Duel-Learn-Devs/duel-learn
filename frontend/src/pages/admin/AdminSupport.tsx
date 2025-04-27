import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemAvatar, 
  Avatar, 
  ListItemText, 
  Chip, 
  Divider, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Card, 
  CardContent,
  Link,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArticleIcon from '@mui/icons-material/Article';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import LaptopIcon from '@mui/icons-material/Laptop';
import SecurityIcon from '@mui/icons-material/Security';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';

// Sample support tickets
const supportTickets = [
  {
    id: 'T-1001',
    title: 'Unable to approve new content',
    description: 'When I try to approve a course, I get a "Permission Denied" error message.',
    status: 'Open',
    priority: 'High',
    category: 'Content Management',
    created: '2 days ago',
    assignedTo: 'Support Team',
    icon: <ArticleIcon />
  },
  {
    id: 'T-1002',
    title: 'User account merge request',
    description: 'Need help merging duplicate accounts for user "teacher_jane".',
    status: 'In Progress',
    priority: 'Medium',
    category: 'User Management',
    created: '3 days ago',
    assignedTo: 'David Kim',
    icon: <GroupIcon />
  },
  {
    id: 'T-1003',
    title: 'Data export failing',
    description: 'Monthly user activity report export is failing with timeout error.',
    status: 'Open',
    priority: 'Medium',
    category: 'Reporting',
    created: '1 week ago',
    assignedTo: 'Support Team',
    icon: <AssignmentIcon />
  },
  {
    id: 'T-1004',
    title: 'Admin dashboard loading slowly',
    description: 'The admin dashboard takes over 30 seconds to load completely.',
    status: 'Resolved',
    priority: 'Low',
    category: 'Performance',
    created: '2 weeks ago',
    assignedTo: 'Technical Team',
    icon: <LaptopIcon />
  },
];

// Sample FAQs
const faqs = [
  {
    id: 1,
    question: 'How do I approve or reject content submissions?',
    answer: 'To approve or reject content submissions, navigate to Content Management > Pending Approvals. Each submission will have approve and reject buttons. When rejecting content, you can include feedback for the creator explaining the reasons for rejection.'
  },
  {
    id: 2,
    question: 'How can I reset a user\'s password?',
    answer: 'To reset a user\'s password, go to User Management, find the user in question, click on the three-dot menu and select "Reset Password". The system will send a password reset link to the user\'s registered email address.'
  },
  {
    id: 3,
    question: 'Where can I view system logs?',
    answer: 'System logs can be accessed through Settings > System > Logs. You can filter logs by date, severity level, and type of activity. For security events, check the dedicated Security Logs section.'
  },
  {
    id: 4,
    question: 'How do I configure notification settings?',
    answer: 'Admin notification settings can be configured in your Profile Settings under the Notifications tab. You can choose which events trigger notifications and set your preferred notification methods (email, in-app, etc.).'
  },
  {
    id: 5,
    question: 'How do I generate custom reports?',
    answer: 'Custom reports can be created in the Reports section. Click "Create New Report", select the data points you wish to include, set any filters, and choose your preferred visualization options. Reports can be saved for future use and exported in various formats.'
  },
];

// Sample support resources
const resources = [
  {
    id: 1,
    title: 'Admin Documentation',
    description: 'Comprehensive guide to all admin features and functions',
    link: '/admin/documentation',
    icon: <LocalLibraryIcon sx={{ fontSize: 40, color: '#4D18E8' }} />
  },
  {
    id: 2,
    title: 'Video Tutorials',
    description: 'Step-by-step video guides for common admin tasks',
    link: '/admin/tutorials',
    icon: <LiveHelpIcon sx={{ fontSize: 40, color: '#4D18E8' }} />
  },
  {
    id: 3,
    title: 'Release Notes',
    description: 'Latest updates and features in the admin dashboard',
    link: '/admin/releases',
    icon: <NewReleasesIcon sx={{ fontSize: 40, color: '#4D18E8' }} />
  },
  {
    id: 4,
    title: 'Security Guidelines',
    description: 'Best practices for maintaining platform security',
    link: '/admin/security',
    icon: <SecurityIcon sx={{ fontSize: 40, color: '#4D18E8' }} />
  },
];

const AdminSupport: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<number | false>(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAccordionChange = (panel: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Open':
        return '#FF9800';
      case 'In Progress':
        return '#4D18E8';
      case 'Resolved':
        return '#2EC486';
      default:
        return '#9F9BAE';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High':
        return '#FF5252';
      case 'Medium':
        return '#FF9800';
      case 'Low':
        return '#2EC486';
      default:
        return '#9F9BAE';
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="p-6 text-white">
      <Box className="mb-6">
        <Typography variant="h4" gutterBottom>
          Admin Support
        </Typography>
        <Typography variant="body1" color="#9F9BAE">
          Find help resources, submit support tickets, and access documentation
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
        <Typography variant="h6" gutterBottom>
          Support Center
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to the Admin Support Center. Here you can access resources to help you perform your admin duties:
        </Typography>
        <ul className="list-disc ml-6 mb-4 text-gray-300">
          <li className="mb-2">View and manage your support tickets</li>
          <li className="mb-2">Find answers to frequently asked questions</li>
          <li className="mb-2">Access admin documentation and tutorial videos</li>
          <li className="mb-2">Submit new support requests when needed</li>
          <li className="mb-2">Connect with the technical support team</li>
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
          <Tab icon={<ConfirmationNumberIcon />} label="Support Tickets" />
          <Tab icon={<HelpOutlineIcon />} label="FAQs" />
          <Tab icon={<SupportAgentIcon />} label="Help Resources" />
        </Tabs>
      </Box>

      {/* Support Tickets Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Your Support Tickets
          </Typography>
          <Button 
            variant="contained" 
            sx={{ 
              backgroundColor: '#4D18E8', 
              '&:hover': {
                backgroundColor: '#3b13b5',
              }
            }}
          >
            Create New Ticket
          </Button>
        </Box>

        <Paper sx={{ backgroundColor: '#1E1A2B', borderRadius: '12px', border: '1px solid #3B354D', mb: 4 }}>
          <List>
            {supportTickets.map((ticket, index) => (
              <React.Fragment key={ticket.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    padding: '16px 20px',
                    '&:hover': { backgroundColor: '#2A2636' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#2A2636', color: '#E2DDF3' }}>
                      {ticket.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ color: '#E2DDF3', fontWeight: 'bold', mr: 1 }}
                        >
                          {ticket.title}
                        </Typography>
                        <Chip 
                          label={ticket.id}
                          size="small"
                          sx={{ 
                            backgroundColor: '#2A2636',
                            color: '#9F9BAE',
                            borderRadius: '4px',
                            height: '20px',
                            fontSize: '0.7rem'
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }} />
                        <Chip 
                          label={ticket.status}
                          size="small"
                          sx={{ 
                            backgroundColor: `${getStatusColor(ticket.status)}20`,
                            color: getStatusColor(ticket.status),
                            borderRadius: '4px',
                            height: '22px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            mr: 1
                          }}
                        />
                        <Chip 
                          label={ticket.priority}
                          size="small"
                          sx={{ 
                            backgroundColor: `${getPriorityColor(ticket.priority)}20`,
                            color: getPriorityColor(ticket.priority),
                            borderRadius: '4px',
                            height: '22px',
                            fontSize: '0.75rem',
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
                          {ticket.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ color: '#6F658D' }}
                          >
                            {ticket.category} • Created {ticket.created} • Assigned to {ticket.assignedTo}
                          </Typography>
                          <Button 
                            variant="text" 
                            size="small"
                            sx={{ 
                              color: '#4D18E8',
                              minWidth: 'auto',
                              '&:hover': {
                                backgroundColor: 'rgba(77, 24, 232, 0.1)',
                              }
                            }}
                          >
                            View Details
                          </Button>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < supportTickets.length - 1 && (
                  <Divider sx={{ backgroundColor: '#3B354D' }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </TabPanel>

      {/* FAQs Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: '#6F658D', mr: 1 }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#3B354D' },
                '&:hover fieldset': { borderColor: '#4D18E8' },
                '&.Mui-focused fieldset': { borderColor: '#4D18E8' },
                backgroundColor: '#2A2636',
                borderRadius: '8px',
                color: '#E2DDF3',
              },
            }}
          />
        </Box>

        <Paper sx={{ backgroundColor: '#1E1A2B', borderRadius: '12px', border: '1px solid #3B354D', mb: 4 }}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <Accordion 
                key={faq.id}
                expanded={expanded === faq.id}
                onChange={handleAccordionChange(faq.id)}
                sx={{ 
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  borderBottom: '1px solid #3B354D',
                  '&:last-child': { borderBottom: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#E2DDF3' }} />}
                  sx={{ 
                    '&:hover': { backgroundColor: '#2A2636' },
                    '& .MuiAccordionSummary-content': { margin: '16px 0' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HelpOutlineIcon sx={{ color: '#4D18E8', mr: 2 }} />
                    <Typography variant="subtitle1" sx={{ color: '#E2DDF3' }}>
                      {faq.question}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: '#2A2636', p: 3, borderRadius: '0 0 12px 12px' }}>
                  <Typography variant="body2" sx={{ color: '#E2DDF3' }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#9F9BAE' }}>
                No FAQs match your search. Try different keywords or browse all FAQs by clearing the search.
              </Typography>
            </Box>
          )}
        </Paper>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 2 }}>
            Can't find what you're looking for?
          </Typography>
          <Button 
            variant="outlined"
            sx={{ 
              borderColor: '#4D18E8',
              color: '#4D18E8',
              '&:hover': {
                borderColor: '#3b13b5',
                backgroundColor: 'rgba(77, 24, 232, 0.1)',
              }
            }}
          >
            Contact Support Team
          </Button>
        </Box>
      </TabPanel>

      {/* Help Resources Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {resources.map((resource) => (
            <Grid item xs={12} sm={6} md={3} key={resource.id}>
              <Card 
                sx={{ 
                  backgroundColor: '#1E1A2B', 
                  borderRadius: '12px', 
                  border: '1px solid #3B354D',
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.3)',
                  }
                }}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3 }}>
                  {resource.icon}
                  <Typography variant="h6" sx={{ color: '#E2DDF3', mt: 2, mb: 1 }}>
                    {resource.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9F9BAE', mb: 2 }}>
                    {resource.description}
                  </Typography>
                  <Link 
                    href={resource.link}
                    sx={{ 
                      color: '#4D18E8', 
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Access Resource
                  </Link>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ backgroundColor: '#1E1A2B', borderRadius: '12px', border: '1px solid #3B354D', mt: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#E2DDF3' }}>
            Need Direct Assistance?
          </Typography>
          <Typography variant="body2" paragraph sx={{ color: '#9F9BAE' }}>
            Our support team is available to help you with any issues you may encounter while using the admin dashboard.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<SupportAgentIcon />}
              sx={{ 
                backgroundColor: '#4D18E8', 
                '&:hover': {
                  backgroundColor: '#3b13b5',
                }
              }}
            >
              Live Chat
            </Button>
            <Button 
              variant="outlined"
              sx={{ 
                borderColor: '#4D18E8',
                color: '#4D18E8',
                '&:hover': {
                  borderColor: '#3b13b5',
                  backgroundColor: 'rgba(77, 24, 232, 0.1)',
                }
              }}
            >
              Email Support
            </Button>
          </Box>
        </Paper>
      </TabPanel>
    </Box>
  );
};

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
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
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

export default AdminSupport; 