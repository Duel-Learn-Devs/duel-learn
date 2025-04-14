import express from "express";
import userController from "../controller/User.js"; // Add .js extension
import asyncValidation from "../middleware/validationMiddleware.js"; // Import the validation middleware
import emailVerificationMiddleware from "../middleware/emailVerificationMiddleware.js"; // Import the email verification middleware
import storeUserValidation from '../middleware/validationMiddleware.js';

const router = express.Router();

// Route to save user details with validation
router.post("/sign-up", userController.signUpUser);
// Route to reset password
router.post("/reset-password", userController.resetPassword);
router.get("/info/:firebase_uid", userController.getUserInfo);

// Route to update email verified status with email verification check
router.post("/update-email-verified", emailVerificationMiddleware, userController.updateEmailVerified); // Apply the email verification middleware

// Route to update user details with email verification check
router.post("/update-user-details", emailVerificationMiddleware, userController.updateUserDetails); // Apply the email verification middleware

// Route to delete user's own account
router.delete("/delete-account", userController.deleteUserAccount);

// Route to get all users
router.get("/", userController.getAllUsers);

// Route to add a new user
router.post("/", userController.addUser);

// These routes should come last as they use URL parameters
router.put("/:firebase_uid", userController.updateUser);

// Route for storing user data
router.post("/store-user/:firebase_uid", storeUserValidation, userController.storeUser);
router.get("/store-user/:firebase_uid", userController.getStoredUser);

// Export the router as default
export default router;
