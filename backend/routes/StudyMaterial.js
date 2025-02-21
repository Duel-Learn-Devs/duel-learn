import express from "express";
import studyMaterialController from "../controller/StudyMaterial.js";

const router = express.Router();

// Use studyMaterialController.saveStudyMaterial instead of saveStudyMaterial directly
router.post("/save", studyMaterialController.saveStudyMaterial);
router.post('/increment-views/:studyMaterialId', studyMaterialController.incrementViews);

router.get("/get-by-study-material-id/:studyMaterialId", studyMaterialController.getStudyMaterialById);
router.get("/get-by-user/:created_by", studyMaterialController.getStudyMaterialByUser);
router.get("/get-recommended-for-you/:user", studyMaterialController.getRecommendedForYouCards);
router.get('/get-top-picks', studyMaterialController.getTopPicks);
router.get("/non-matching-tags/:user", studyMaterialController.getNonMatchingTags);

export default router;
