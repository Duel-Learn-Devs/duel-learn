import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import AdminDashboard from "../pages/admin/admin-dashboard";
import AdminSignUp from "../pages/user-account/AdminSignUp"; // Import AdminSignUp

const AdminRoutes = () => {
  const { user } = useUser();
  const token = localStorage.getItem("userToken");

  if (!user || !token || user.account_type !== "admin") {
    return <Navigate to="/admin-sign-up" />;
  }

  return (
    <Routes>
      <Route path="admin-dashboard" element={<AdminDashboard />} />
      <Route path="admin-sign-up" element={<AdminSignUp />} /> {/* Add AdminSignUp route */}
      {/* Add more admin routes here */}
    </Routes>
  );
};

export default AdminRoutes;
