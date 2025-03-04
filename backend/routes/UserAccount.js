import express from "express";
import userController from "../controller/User.js"; // Add .js extension

const router = express.Router();

// Route to save user details
router.post("/sign-up", userController.signUpUser);

// Route to reset password
router.post("/reset-password", userController.resetPassword);

// Route to update email verified status
router.post("/update-email-verified", userController.updateEmailVerified);

// Route to update user details
router.post("/update-user-details", userController.updateUserDetails);

// Route to fetch users
router.get("/admin/admin-dashboard/fetch-users", userController.fetchUsers);

// Route to delete user's own account
router.delete("/delete-account", userController.deleteUserAccount);

// Route to get all users
router.get("/", userController.getAllUsers);

// Route to add a new user
router.post("/", userController.addUser);

// Route to delete all users
router.delete("/", userController.deleteAllUsers);

// These routes should come last as they use URL parameters
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUserByAdmin);

// Export the router as default
export default router;
