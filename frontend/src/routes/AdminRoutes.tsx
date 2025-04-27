import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import LoadingScreen from "../components/LoadingScreen";
import AdminDashboardLayout from "../layouts/AdminDashboardLayout";

// Import all admin components from the barrel file
import {
  UserManagement,
  ContentManagement, 
  CreateContent,
  AdminSettings,
  AdminNotifications,
  AdminSupport,
  AdminActions,
  AdminDashboard,
  GameSettings
} from "../pages/admin";

const AdminRoutes = () => {
  const { user, loading: userLoading } = useUser();
  const { isAuthenticated, isLoading: authLoading, currentUser } = useAuth();
  
  // Effect to handle initial loading
  const isLoading = authLoading || userLoading;
  
  // Check if admin based on user context data
  const isAdmin = user?.account_type === "admin";

  // While loading, show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" />;
  }

  // If not admin, redirect to admin signup
  if (!isAdmin) {
    return <Navigate to="/admin-sign-up" />;
  }

  // If email isn't verified, redirect to verification page
  if (user && !user.email_verified) {
    return <Navigate to="/verify-email" />;
  }
  
  return (
    <Routes>
      {/* Routes that use the AdminDashboardLayout */}
      <Route element={<AdminDashboardLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        
        {/* User Management */}
        <Route path="users" element={<UserManagement />} />
        
        {/* Content Management */}
        <Route path="content" element={<ContentManagement />} />
        <Route path="content/create" element={<CreateContent />} />
        
        {/* Settings */}
        <Route path="settings" element={<AdminSettings />} />
        
        {/* Notifications */}
        <Route path="notifications" element={<AdminNotifications />} />
        
        {/* Support */}
        <Route path="support" element={<AdminSupport />} />
        
        {/* Admin Actions */}
        <Route path="actions" element={<AdminActions />} />
        
        {/* Game Settings */}
        <Route path="game-settings" element={<GameSettings />} />
      </Route>
      
      {/* Default route for admin section */}
      <Route index element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
