import express from "express";
import achievementController from "../controller/AchievementController.js";

const router = express.Router();

router.get("/get-achievements", achievementController.getAchievement);
// Add the new consolidated route
router.get("/all-user-achievements/:firebase_uid", achievementController.getAllUserAchievements);
// Cache invalidation route
router.post("/invalidate-cache", achievementController.invalidateCache);
router.get("/user-longest-streak/:firebase_uid", achievementController.getUserLongestStreak);
router.get("/user-total-pvp-matches/:firebase_uid", achievementController.getUserTotalPvPMatches);
router.get("/user-total-pvp-wins/:firebase_uid", achievementController.getUserTotalPvPWins);

export default router;