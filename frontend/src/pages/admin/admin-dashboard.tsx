import React, { useEffect, useState } from "react";
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Header from "../../components/header/Header"; // Import the Header component
import "./AdminDashboard.css"; // Import the CSS file

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/admin/admin-dashboard/fetch-users`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          throw new Error("Invalid data format");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteAllUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/$firebase_uid`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error("Failed to delete all users");
      }
      setUsers([]);
    } catch (error) {
      console.error("Error deleting all users:", error);
    }
  };

  const handleDeleteUser = async (firebase_uid: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      setUsers(users.filter(user => user.firebase_uid !== firebase_uid));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleLogout = () => {
    // Implement your logout logic here
    console.log("User logged out");
  };

  return (
    <Box p={3}>
      <Header />
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Box sx={{ maxHeight: 750, overflow: 'auto' }}>
        <Table>
          <TableHead className="sticky-header">
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell>Firebase UID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell> {/* Added Email column */}
              <TableCell>Exist in SQL</TableCell>
              <TableCell>Exist in Firebase Auth</TableCell>
              <TableCell>Exist in Firestore Collection</TableCell>
              <TableCell>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.firebase_uid}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{user.firebase_uid}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell> {/* Added Email field */}
                <TableCell>{user.existInSQL ? "Yes" : "No"}</TableCell>
                <TableCell>{user.existInFirebaseAuth ? "Yes" : "No"}</TableCell>
                <TableCell>{user.existInFirestore ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Button variant="contained" color="secondary" onClick={() => handleDeleteUser(user.firebase_uid)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Box mt={2}>
        <Button variant="contained" color="secondary" onClick={handleDeleteAllUsers}>
          Delete All
        </Button>
      </Box>
    </Box>
  );
};

export default AdminDashboard;