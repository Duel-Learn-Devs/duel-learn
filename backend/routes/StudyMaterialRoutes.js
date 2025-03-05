import express from "express";
import studyMaterialController from "../controller/StudyMaterialController.js";
import { pool } from "../config/db.js";

const router = express.Router();

// Save endpoint to handle study material creation
router.post("/save", async (req, res) => {
  const { studyMaterialId, title, tags, summary, visibility, createdBy, createdById, items } = req.body;
  let connection;

  console.log('Save endpoint - Request body:', {
    studyMaterialId,
    title,
    tags,
    summary,
    visibility,
    createdBy,
    createdById,
    itemsCount: items?.length
  });

  try {
    connection = await pool.getConnection();
    console.log('Database connection established');

    // Test database connection
    const [testResult] = await connection.query('SELECT 1');
    console.log('Database connection test:', testResult);

    await connection.beginTransaction();
    console.log('Transaction started');

    // Insert into study_material_info table
    console.log('Inserting into study_material_info with values:', {
      studyMaterialId,
      title,
      tags: JSON.stringify(tags),
      summary,
      createdBy,
      createdById,
      visibility
    });

    const [studyMaterialResult] = await connection.query(
      `INSERT INTO study_material_info (
        study_material_id, 
        title,
        tags,
        summary,
        created_by,
        created_by_id,
        created_at,
        visibility,
        total_views
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 0)`,
      [
        studyMaterialId,
        title,
        JSON.stringify(tags),
        summary,
        createdBy,
        createdById,
        visibility || 0
      ]
    );

    console.log('Study material info insert result:', studyMaterialResult);

    // Insert items
    console.log('Inserting items:', items);
    for (const [index, item] of items.entries()) {
      const [itemResult] = await connection.query(
        `INSERT INTO study_material_content (
          study_material_id, 
          term, 
          definition, 
          item_number,
          image
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          studyMaterialId,
          item.term || '',
          item.definition || '',
          index + 1,
          item.image || null
        ]
      );
      console.log(`Item ${index + 1} insert result:`, itemResult);
    }
    console.log('All items inserted successfully');

    await connection.commit();
    console.log('Transaction committed');

    res.status(201).json({
      success: true,
      message: 'Study material saved successfully',
      studyMaterialId,
      summary
    });

  } catch (error) {
    console.error('Error in save endpoint:', error);
    if (connection) {
      await connection.rollback();
      console.log('Transaction rolled back due to error');
    }
    res.status(500).json({
      error: 'Failed to save study material',
      details: error.message,
      sqlMessage: error.sqlMessage,
      code: error.code
    });
  } finally {
    if (connection) {
      connection.release();
      console.log('Database connection released');
    }
  }
});

// Routes handled by controller
router.get("/get-by-study-material-id/:studyMaterialId", studyMaterialController.getStudyMaterialById);
router.get("/get-by-user/:created_by", studyMaterialController.getStudyMaterialByUser);
router.get("/get-recommended-for-you/:username", studyMaterialController.getRecommendedForYouCards);
router.get('/get-top-picks', studyMaterialController.getTopPicks);
router.get("/get-made-by-friends/:userId", studyMaterialController.getMadeByFriends);
router.get("/discover/:username", studyMaterialController.getNonMatchingTags);
router.put("/update/:studyMaterialId", studyMaterialController.editStudyMaterial);
router.post("/archive/:studyMaterialId", studyMaterialController.archiveStudyMaterial);
router.post('/increment-views/:studyMaterialId', studyMaterialController.incrementViews);

router.get("/test", (req, res) => {
  res.json({ message: "Study material routes are working" });
});

export default router;