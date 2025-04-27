import express from "express";
import adminController from "../../controller/admin/AdminController.js";
import adminAuthMiddleware from "../../middleware/adminAuthMiddleware.js";
// Import any middleware you might need
// import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

// Apply admin authorization middleware to all admin routes
router.use(adminAuthMiddleware);

// Admin routes for user management
router.get("/users", adminController.fetchUsers);
router.delete("/users/:id", adminController.deleteUserByAdmin);
router.delete("/users", adminController.deleteAllUsers);

// Add more admin routes as needed
// router.get("/dashboard-stats", adminController.getDashboardStats);

export default router; 