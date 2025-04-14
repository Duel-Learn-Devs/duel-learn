import express from "express";
import userInfo from "../controller/UserInfo.js";

const router = express.Router();

router.get("/details/:firebase_uid", userInfo.getUserInfo);
router.get("/profile/:userId", userInfo.getUserProfileById);
router.get("/user-personalization/:firebase_uid", userInfo.fetchUserPersonalization);

router.post("/update-level", userInfo.updateLevel);

router.put("/personalization/:firebase_uid", userInfo.updatePersonalization);
router.put("/update-personalization/:firebase_uid", userInfo.updatePersonalization);


export default router;
