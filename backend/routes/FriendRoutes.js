import express from "express";
import friendController from "../controller/FriendController.js";

const router = express.Router();

router.get("/user-info/:firebase_uid", friendController.getUserInfo);
router.get("/friend-info/:firebase_uid", friendController.getFriendInfo);
router.get("/pending/:firebase_uid", friendController.getPendingFriendRequests);
router.get("/requests-count/:firebase_uid", friendController.getFriendRequestsCount);
router.get("/search/:searchQuery", friendController.searchUsers);
router.get("/leaderboard/:firebase_uid", friendController.getFriendsLeaderboard);
router.get("/friend-count/:firebase_uid", friendController.getFriendCount);

router.post("/request", friendController.sendFriendRequest);
router.post("/accept", friendController.acceptFriendRequest);
router.post("/remove", friendController.removeFriend);
router.post("/reject", friendController.rejectFriendRequest);


export default router;