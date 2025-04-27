import * as React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  LinearProgress,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PeopleIcon from "@mui/icons-material/People";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HelpIcon from "@mui/icons-material/Help";
import SecurityIcon from "@mui/icons-material/Security";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Sample data for charts and statistics
const userStatisticsData = [
  { name: "Jan", active: 400, new: 240 },
  { name: "Feb", active: 430, new: 220 },
  { name: "Mar", active: 470, new: 250 },
  { name: "Apr", active: 510, new: 230 },
  { name: "May", active: 540, new: 260 },
  { name: "Jun", active: 580, new: 290 },
  { name: "Jul", active: 620, new: 270 },
];

const userTypeData = [
  { name: "Students", value: 70 },
  { name: "Teachers", value: 15 },
  { name: "Parents", value: 12 },
  { name: "Admins", value: 3 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const recentActivityData = [
  {
    id: 1,
    type: "user",
    title: "New User Registration",
    description: "Emily Johnson registered as a new teacher.",
    time: "10 minutes ago",
    icon: <PersonAddIcon />,
    color: "#0088FE",
  },
  {
    id: 2,
    type: "content",
    title: "Content Published",
    description: "Advanced Mathematics course was published by Mark Wilson.",
    time: "45 minutes ago",
    icon: <MenuBookIcon />,
    color: "#00C49F",
  },
  {
    id: 3,
    type: "system",
    title: "System Alert",
    description: "High server load detected. Performance may be affected.",
    time: "2 hours ago",
    icon: <WarningIcon />,
    color: "#FF8042",
  },
  {
    id: 4,
    type: "user",
    title: "User Achievement",
    description: "John Smith completed 10 courses and earned a Gold badge.",
    time: "5 hours ago",
    icon: <SchoolIcon />,
    color: "#FFBB28",
  },
  {
    id: 5,
    type: "system",
    title: "Backup Completed",
    description: "Weekly database backup completed successfully.",
    time: "6 hours ago",
    icon: <CheckCircleIcon />,
    color: "#00C49F",
  },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#080511", minHeight: "100vh" }}>
      <Typography
        variant="h4"
        gutterBottom
        component="h1"
        sx={{ color: "#E2DDF3" }}
      >
        Admin Dashboard
      </Typography>
      <Typography
        variant="subtitle1"
        gutterBottom
        color="text.secondary"
        sx={{ color: "#9F9BAE" }}
      >
        Welcome to your admin control center. Monitor system health, user
        activity, and content performance.
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4, mt: 1 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
              backgroundColor: "#1E1A2B",
              border: "1px solid #3B354D",
              borderRadius: "1rem",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="#9F9BAE" variant="subtitle2" gutterBottom>
                Total Users
              </Typography>
              <Avatar sx={{ bgcolor: "#4D18E8", width: 32, height: 32 }}>
                <PeopleIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography
              component="p"
              variant="h4"
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                color: "#E2DDF3",
              }}
            >
              16
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TrendingUpIcon sx={{ color: "#2EC486", mr: 1, fontSize: 18 }} />
              <Typography variant="body2" sx={{ color: "#2EC486" }}>
                +12% from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
              backgroundColor: "#1E1A2B",
              border: "1px solid #3B354D",
              borderRadius: "1rem",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="#9F9BAE" variant="subtitle2" gutterBottom>
                Study Material Created
              </Typography>
              <Avatar sx={{ bgcolor: "#4D18E8", width: 32, height: 32 }}>
                <MenuBookIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography
              component="p"
              variant="h4"
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                color: "#E2DDF3",
              }}
            >
              2
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TrendingUpIcon sx={{ color: "#2EC486", mr: 1, fontSize: 18 }} />
              <Typography variant="body2" sx={{ color: "#2EC486" }}>
                +8% from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
              backgroundColor: "#1E1A2B",
              border: "1px solid #3B354D",
              borderRadius: "1rem",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="#9F9BAE" variant="subtitle2" gutterBottom>
                Study Materials Played
              </Typography>
              <Avatar sx={{ bgcolor: "#4D18E8", width: 32, height: 32 }}>
                <SchoolIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography
              component="p"
              variant="h4"
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                color: "#E2DDF3",
              }}
            >
              3,427
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TrendingUpIcon sx={{ color: "#2EC486", mr: 1, fontSize: 18 }} />
              <Typography variant="body2" sx={{ color: "#2EC486" }}>
                +15% from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
              backgroundColor: "#1E1A2B",
              border: "1px solid #3B354D",
              borderRadius: "1rem",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="#9F9BAE" variant="subtitle2" gutterBottom>
                PVP Matches Played
              </Typography>
              <Avatar sx={{ bgcolor: "#4D18E8", width: 32, height: 32 }}>
                <QuizIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography
              component="p"
              variant="h4"
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                color: "#E2DDF3",
              }}
            >
              7,842
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TrendingDownIcon
                sx={{ color: "#FF5252", mr: 1, fontSize: 18 }}
              />
              <Typography variant="body2" sx={{ color: "#FF5252" }}>
                -3% from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* System Health */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: "#1E1A2B",
          border: "1px solid #3B354D",
          borderRadius: "1rem",
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: "#E2DDF3" }}>
          System Health
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" sx={{ color: "#E2DDF3" }}>
                  Server Load
                </Typography>
                <Typography variant="body2" sx={{ color: "#9F9BAE" }}>
                  68%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={68}
                color="warning"
                sx={{
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: "#3B354D",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#4D18E8",
                  },
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" sx={{ color: "#E2DDF3" }}>
                  Database Performance
                </Typography>
                <Typography variant="body2" sx={{ color: "#9F9BAE" }}>
                  92%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={92}
                sx={{
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: "#3B354D",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#2EC486",
                  },
                }}
              />
            </Box>
            <Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" sx={{ color: "#E2DDF3" }}>
                  Storage Capacity
                </Typography>
                <Typography variant="body2" sx={{ color: "#9F9BAE" }}>
                  45%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={45}
                sx={{
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: "#3B354D",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#4D18E8",
                  },
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="body1"
                    sx={{ color: "#E2DDF3", fontWeight: "medium" }}
                  >
                    Active Servers
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#9F9BAE" }}>
                    All servers operational
                  </Typography>
                </Box>
                <Chip
                  label="Healthy"
                  color="success"
                  size="small"
                  sx={{
                    backgroundColor: "rgba(46, 196, 134, 0.1)",
                    color: "#2EC486",
                    border: "1px solid rgba(46, 196, 134, 0.2)",
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="body1"
                    sx={{ color: "#E2DDF3", fontWeight: "medium" }}
                  >
                    API Status
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#9F9BAE" }}>
                    All endpoints responding normally
                  </Typography>
                </Box>
                <Chip
                  label="Operational"
                  color="success"
                  size="small"
                  sx={{
                    backgroundColor: "rgba(46, 196, 134, 0.1)",
                    color: "#2EC486",
                    border: "1px solid rgba(46, 196, 134, 0.2)",
                  }}
                />
              </Box>
            </Box>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="body1"
                    sx={{ color: "#E2DDF3", fontWeight: "medium" }}
                  >
                    Backup Status
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#9F9BAE" }}>
                    Last backup: 6 hours ago
                  </Typography>
                </Box>
                <Chip
                  label="Up to Date"
                  color="success"
                  size="small"
                  sx={{
                    backgroundColor: "rgba(46, 196, 134, 0.1)",
                    color: "#2EC486",
                    border: "1px solid rgba(46, 196, 134, 0.2)",
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Charts and Activity */}
      <Grid container spacing={4}>
        {/* User Statistics Chart */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              backgroundColor: "#1E1A2B",
              border: "1px solid #3B354D",
              borderRadius: "1rem",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ mb: 3, color: "#E2DDF3" }}
            >
              User Growth Statistics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={userStatisticsData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3B354D" />
                <XAxis dataKey="name" stroke="#9F9BAE" />
                <YAxis stroke="#9F9BAE" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#2A2636",
                    border: "1px solid #3B354D",
                    borderRadius: "0.5rem",
                    color: "#E2DDF3",
                  }}
                />
                <Legend wrapperStyle={{ color: "#9F9BAE" }} />
                <Bar dataKey="active" name="Active Users" fill="#4D18E8" />
                <Bar dataKey="new" name="New Users" fill="#2EC486" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* User Distribution Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              backgroundColor: "#1E1A2B",
              border: "1px solid #3B354D",
              borderRadius: "1rem",
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: "#E2DDF3" }}>
              User Distribution
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 300,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {userTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          ["#4D18E8", "#2EC486", "#FF9800", "#FF5252"][
                            index % 4
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#2A2636",
                      border: "1px solid #3B354D",
                      borderRadius: "0.5rem",
                      color: "#E2DDF3",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: "#1E1A2B",
              border: "1px solid #3B354D",
              borderRadius: "1rem",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ color: "#E2DDF3" }}>
                Recent Activity
              </Typography>
              <Button
                variant="text"
                size="small"
                sx={{
                  color: "#4D18E8",
                  "&:hover": {
                    backgroundColor: "rgba(77, 24, 232, 0.08)",
                  },
                }}
              >
                View All
              </Button>
            </Box>
            <List>
              {recentActivityData.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem
                    alignItems="flex-start"
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="more"
                        sx={{ color: "#9F9BAE" }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: activity.color }}>
                        {activity.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: "#E2DDF3" }}>
                          {activity.title}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            sx={{ display: "inline", color: "#9F9BAE" }}
                            component="span"
                            variant="body2"
                          >
                            {activity.description}
                          </Typography>
                          <Typography
                            sx={{ display: "inline", color: "#6F658D", ml: 1 }}
                            component="span"
                            variant="body2"
                          >
                            {" — "}
                            {activity.time}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < recentActivityData.length - 1 && (
                    <Divider
                      variant="inset"
                      component="li"
                      sx={{ borderColor: "#3B354D" }}
                    />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: "#1E1A2B",
              border: "1px solid #3B354D",
              borderRadius: "1rem",
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: "#E2DDF3" }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {[
                {
                  title: "User Management",
                  icon: <PeopleIcon />,
                  path: "/admin/user-management",
                },
                {
                  title: "Content Management",
                  icon: <MenuBookIcon />,
                  path: "/admin/content-management",
                },
                {
                  title: "Create Content",
                  icon: <QuizIcon />,
                  path: "/admin/create-content",
                },
                {
                  title: "Settings",
                  icon: <SettingsIcon />,
                  path: "/admin/settings",
                },
                {
                  title: "Notifications",
                  icon: <NotificationsIcon />,
                  path: "/admin/notifications",
                },
                {
                  title: "Support",
                  icon: <HelpIcon />,
                  path: "/admin/support",
                },
              ].map((action, index) => (
                <Grid item xs={6} md={4} key={index}>
                  <Card
                    sx={{
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      backgroundColor: "#2A2636",
                      border: "1px solid #3B354D",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: 3,
                        borderColor: "#4D18E8",
                        backgroundColor: "#312E44",
                      },
                    }}
                    onClick={() => handleNavigate(action.path)}
                  >
                    <CardContent>
                      <Avatar
                        sx={{ bgcolor: "#4D18E8", margin: "0 auto", mb: 1 }}
                      >
                        {action.icon}
                      </Avatar>
                      <Typography variant="body1" sx={{ color: "#E2DDF3" }}>
                        {action.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
