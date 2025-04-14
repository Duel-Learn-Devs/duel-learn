import express from "express";
import studyMaterialController from "../controller/StudyMaterialController.js";

const router = express.Router();

// Use studyMaterialController.saveStudyMaterial instead of saveStudyMaterial directly
router.post("/save", studyMaterialController.saveStudyMaterial);
router.post("/update", studyMaterialController.editStudyMaterial);
router.post(
  "/archive/:studyMaterialId",
  studyMaterialController.archiveStudyMaterial
);
router.post(
  "/delete/:studyMaterialId",
  studyMaterialController.deleteStudyMaterial
);
router.post(
  "/restore/:studyMaterialId",
  studyMaterialController.restoreStudyMaterial
);
router.post(
  "/increment-views/:studyMaterialId",
  studyMaterialController.incrementViews
);
router.post("/bookmark", studyMaterialController.bookmarkStudyMaterial);
router.post("/update-creator", studyMaterialController.updateCreatedByUser);
router.post(
  "/update-visibility/:studyMaterialId",
  studyMaterialController.updateVisibility
);

router.get(
  "/get-by-study-material-id/:studyMaterialId",
  studyMaterialController.getStudyMaterialById
);
router.get(
  "/get-by-user/:created_by",
  studyMaterialController.getStudyMaterialByUser
);
router.get(
  "/get-recommended-for-you/:username",
  studyMaterialController.getRecommendedForYouCards
);
router.get("/get-top-picks", studyMaterialController.getTopPicks);
router.get(
  "/get-made-by-friends/:userId",
  studyMaterialController.getMadeByFriends
);
router.get("/discover/:username", studyMaterialController.getNonMatchingTags);
router.get(
  "/check-bookmark-status",
  studyMaterialController.checkBookmarkStatus
);
router.get(
  "/get-bookmarks-by-user/:bookmarked_by_id",
  studyMaterialController.getBookmarksByUser
);
router.get(
  "/info/:studyMaterialId",
  studyMaterialController.getStudyMaterialInfo
);
router.get(
  "/personalized/:username",
  studyMaterialController.getPersonalizedStudyMaterials
);

router.post("/store-image/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const { image } = req.body; // This should be the base64 image

    if (!image || !image.startsWith("data:image")) {
      return res.status(400).send("Invalid image data");
    }

    const { pool } = await import("../config/db.js");

    // Remove the data:image prefix and convert to buffer
    const base64Data = image.split(",")[1];
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Store in study_material_content
    await pool.query(
      "INSERT INTO study_material_content (item_id, image) VALUES (?, ?) ON DUPLICATE KEY UPDATE image = ?",
      [itemId, imageBuffer, imageBuffer]
    );

    res.json({ success: true, message: "Image stored successfully" });
  } catch (error) {
    console.error("Error storing image:", error);
    res.status(500).send("Error storing image");
  }
});

router.get("/image/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    console.log("Fetching image for itemId:", itemId);

    const { pool } = await import("../config/db.js");
    const [results] = await pool.query(
      "SELECT image FROM study_material_content WHERE item_id = ?",
      [itemId]
    );

    console.log("Query results:", {
      hasResults: results.length > 0,
      hasImage: results.length > 0 && !!results[0].image,
      itemId,
    });

    if (results.length > 0 && results[0].image) {
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31557600");
      res.send(results[0].image);
    } else {
      console.log(`No image found for item_id: ${itemId}`);
      res.status(404).send("Image not found");
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).send("Error fetching image");
  }
});

export default router;
