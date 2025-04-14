import { nanoid } from "nanoid";
import { pool } from "../config/db.js";
import manilacurrentTimestamp from "../utils/CurrentTimestamp.js";
import NodeCache from "node-cache";

// Create optimized cache instance (TTL: 10 minutes, check period: 2 minutes)
const studyMaterialCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Utility function to handle image conversion
const formatImageToBase64 = (imageBuffer) => {
  if (!imageBuffer) return null;
  const base64String = imageBuffer.toString("base64");
  return `data:image/jpeg;base64,${base64String}`;
};

// Utility function for cache invalidation
const invalidateCachesForUser = (created_by, created_by_id) => {
  studyMaterialCache.del(`study_materials_${created_by}`);
  studyMaterialCache.del("top_picks");

  const allKeys = studyMaterialCache.keys();
  allKeys.forEach((key) => {
    if (
      key.includes(created_by_id) ||
      key.includes(created_by) ||
      key.includes("bookmarks_") ||
      key.startsWith("recommended_")
    ) {
      studyMaterialCache.del(key);
    }
  });
};

const studyMaterialController = {
  saveStudyMaterial: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      let studyMaterialId = req.body.studyMaterialId || nanoid();
      const {
        title,
        tags,
        summary,
        totalItems,
        visibility = 0,
        createdBy,
        createdById,
        totalView = 1,
        status = "active",
        items,
      } = req.body;

      const currentTimestamp = manilacurrentTimestamp;

      await connection.beginTransaction();

      // Insert into study_material_info
      await connection.execute(
        `INSERT INTO study_material_info 
        (study_material_id, title, tags, summary, total_items, visibility, 
         status, created_by, created_by_id, total_views, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          studyMaterialId,
          title,
          JSON.stringify(tags),
          summary,
          totalItems,
          visibility,
          status,
          createdBy,
          createdById,
          totalView,
          currentTimestamp,
          currentTimestamp,
        ]
      );

      // Insert items with optimized promises
      const insertItemPromises = items.map(async (item, index) => {
        const itemId = nanoid();
        let imageBuffer = null;

        if (item.image) {
          const base64Data = item.image.replace(/^data:image\/\w+;base64,/, "");
          imageBuffer = Buffer.from(base64Data, "base64");
        }

        return connection.execute(
          `INSERT INTO study_material_content 
          (study_material_id, item_id, item_number, term, definition, image) 
          VALUES (?, ?, ?, ?, ?, ?);`,
          [
            studyMaterialId,
            itemId,
            index + 1,
            item.term,
            item.definition,
            imageBuffer,
          ]
        );
      });

      await Promise.all(insertItemPromises);
      await connection.commit();

      invalidateCachesForUser(createdBy, createdById);

      res.status(201).json({
        message: "Study material saved successfully",
        studyMaterialId,
      });
    } catch (error) {
      console.error("Error saving study material:", error);
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Error rolling back transaction:", rollbackError);
        }
      }
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  },

  editStudyMaterial: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const { studyMaterialId, title, tags, totalItems, visibility, items } =
        req.body;

      if (!studyMaterialId || !title || !items || !items.length) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await connection.beginTransaction();
      const updatedTimestamp = manilacurrentTimestamp;

      // Update study_material_info
      await connection.execute(
        `UPDATE study_material_info 
         SET title = ?, tags = ?, total_items = ?, visibility = ?, updated_at = ? 
         WHERE study_material_id = ?`,
        [
          title,
          JSON.stringify(tags),
          totalItems,
          visibility,
          updatedTimestamp,
          studyMaterialId,
        ]
      );

      // Delete existing items
      await connection.execute(
        `DELETE FROM study_material_content WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      // Insert updated items
      const insertItemPromises = items.map(async (item, index) => {
        const itemId = nanoid();
        let imageBuffer = null;

        if (item.image) {
          const base64Data = item.image
            .toString()
            .replace(/^data:image\/\w+;base64,/, "");
          imageBuffer = Buffer.from(base64Data, "base64");
        }

        return connection.execute(
          `INSERT INTO study_material_content 
           (study_material_id, item_id, item_number, term, definition, image) 
           VALUES (?, ?, ?, ?, ?, ?);`,
          [
            studyMaterialId,
            itemId,
            index + 1,
            item.term,
            item.definition,
            imageBuffer,
          ]
        );
      });

      await Promise.all(insertItemPromises);
      await connection.commit();

      // Get creator info for cache invalidation
      const [creatorInfo] = await connection.execute(
        `SELECT created_by, created_by_id FROM study_material_info WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      if (creatorInfo.length > 0) {
        invalidateCachesForUser(
          creatorInfo[0].created_by,
          creatorInfo[0].created_by_id
        );
      }

      studyMaterialCache.del(`study_material_${studyMaterialId}`);

      res.status(200).json({
        message: "Study material updated successfully",
        studyMaterialId,
        updated_at: updatedTimestamp,
      });
    } catch (error) {
      console.error("Error editing study material:", error);
      if (connection)
        await connection.rollback().catch((e) => console.error(e));
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  },

  archiveStudyMaterial: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { studyMaterialId } = req.params;

      // Get study material info before archiving
      const [studyMaterialInfo] = await connection.execute(
        `SELECT created_by, created_by_id FROM study_material_info WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      // Update status to archived
      await connection.execute(
        `UPDATE study_material_info SET status = 'archived' WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      // Clear relevant caches
      if (studyMaterialInfo && studyMaterialInfo.length > 0) {
        const { created_by, created_by_id } = studyMaterialInfo[0];
        studyMaterialCache.del(`study_material_${studyMaterialId}`);
        studyMaterialCache.del(`study_materials_${created_by}`);
        studyMaterialCache.del("top_picks");

        const allKeys = studyMaterialCache.keys();
        allKeys.forEach((key) => {
          if (
            key.includes(studyMaterialId) ||
            key.includes(created_by_id) ||
            key.includes(created_by) ||
            key.includes("bookmarks")
          ) {
            studyMaterialCache.del(key);
          }
        });
      }

      res.status(200).json({
        message: "Study material archived successfully",
        studyMaterialId,
      });
    } catch (error) {
      console.error("Error archiving study material:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  restoreStudyMaterial: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { studyMaterialId } = req.params;

      // Get study material info before restoring
      const [studyMaterialInfo] = await connection.execute(
        `SELECT created_by, created_by_id FROM study_material_info WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      // Update status to active
      await connection.execute(
        `UPDATE study_material_info SET status = 'active' WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      // Clear relevant caches
      if (studyMaterialInfo && studyMaterialInfo.length > 0) {
        const { created_by, created_by_id } = studyMaterialInfo[0];
        invalidateCachesForUser(created_by, created_by_id);
        studyMaterialCache.del(`study_material_${studyMaterialId}`);
      }

      res.status(200).json({
        message: "Study material restored successfully",
        studyMaterialId,
      });
    } catch (error) {
      console.error("Error restoring study material:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  deleteStudyMaterial: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { studyMaterialId } = req.params;

      // Get study material info before deleting
      const [studyMaterialInfo] = await connection.execute(
        `SELECT created_by, created_by_id, title FROM study_material_info WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      // Insert to deleted study material first
      if (studyMaterialInfo && studyMaterialInfo.length > 0) {
        const { created_by, created_by_id, title } = studyMaterialInfo[0];
        const deleted_at = manilacurrentTimestamp;

        await connection.execute(
          `INSERT INTO deleted_study_material
           (study_material_id, title, created_by, created_by_id, deleted_at) 
           VALUES (?, ?, ?, ?, ?)`,
          [studyMaterialId, title, created_by, created_by_id, deleted_at]
        );
      }

      // Delete study material content first (foreign key constraint)
      await connection.execute(
        `DELETE FROM study_material_content WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      // Delete study material info
      await connection.execute(
        `DELETE FROM study_material_info WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      // Clear relevant caches
      if (studyMaterialInfo && studyMaterialInfo.length > 0) {
        const { created_by, created_by_id } = studyMaterialInfo[0];
        invalidateCachesForUser(created_by, created_by_id);
        studyMaterialCache.del(`study_material_${studyMaterialId}`);
      }

      res.status(200).json({
        message: "Study material deleted successfully",
        studyMaterialId,
      });
    } catch (error) {
      console.error("Error deleting study material:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getStudyMaterialById: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { studyMaterialId } = req.params;

      // Check cache first
      const cacheKey = `study_material_${studyMaterialId}`;
      const cachedData = studyMaterialCache.get(cacheKey);

      if (cachedData) {
        return res.status(200).json(cachedData);
      }

      // Use a single JOIN query for better performance
      const [rows] = await connection.execute(
        `SELECT 
          i.title, i.tags, i.summary, i.total_items, i.created_by, i.created_by_id,
          i.total_views, i.created_at, i.status, i.visibility,
          c.term, c.definition, c.image, c.item_number
        FROM study_material_info i
        LEFT JOIN study_material_content c ON i.study_material_id = c.study_material_id
        WHERE i.study_material_id = ?`,
        [studyMaterialId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Study material not found" });
      }

      // Extract info data (same for all rows)
      const result = {
        title: rows[0].title,
        tags: JSON.parse(rows[0].tags),
        summary: rows[0].summary,
        total_items: rows[0].total_items,
        created_by: rows[0].created_by,
        created_by_id: rows[0].created_by_id,
        total_views: rows[0].total_views,
        created_at: rows[0].created_at,
        status: rows[0].status,
        visibility: rows[0].visibility,
        items: rows.map((row) => ({
          term: row.term,
          definition: row.definition,
          image: formatImageToBase64(row.image),
          item_number: row.item_number,
        })),
      };

      // Cache the result
      studyMaterialCache.set(cacheKey, result, 300); // 5 minutes cache

      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching study material:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getStudyMaterialByUser: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { created_by } = req.params;

      const cacheKey = `study_materials_${created_by}`;
      const skipCache = req.query.timestamp !== undefined;
      const cachedData = studyMaterialCache.get(cacheKey);

      if (cachedData && !skipCache) {
        return res.status(200).json(cachedData);
      }

      const [infoRows] = await connection.execute(
        `SELECT study_material_id, title, tags, summary, total_items, created_by, created_by_id,
         total_views, created_at, updated_at, visibility, status
         FROM study_material_info 
         WHERE created_by = ?
         ORDER BY updated_at DESC, created_at DESC`,
        [created_by]
      );

      if (infoRows.length === 0) {
        return res.status(200).json([]);
      }

      // Process all study materials with Promise.all for parallel execution
      const studyMaterials = await Promise.all(
        infoRows.map(async (info) => {
          const [contentRows] = await connection.execute(
            `SELECT term, definition, image, item_number
             FROM study_material_content 
             WHERE study_material_id = ?
             ORDER BY item_number ASC`,
            [info.study_material_id]
          );

          return {
            study_material_id: info.study_material_id,
            title: info.title,
            tags: JSON.parse(info.tags),
            summary: info.summary,
            total_items: info.total_items,
            created_by: info.created_by,
            created_by_id: info.created_by_id,
            total_views: info.total_views,
            created_at: info.created_at,
            updated_at: info.updated_at,
            visibility: info.visibility,
            status: info.status,
            items: contentRows.map((item) => ({
              term: item.term,
              definition: item.definition,
              image: formatImageToBase64(item.image),
            })),
          };
        })
      );

      if (!skipCache) {
        studyMaterialCache.set(cacheKey, studyMaterials, 300); // 5 minutes cache
      }

      res.status(200).json(studyMaterials);
    } catch (error) {
      console.error("Error fetching study materials by creator:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getRecommendedForYouCards: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      let { username } = req.params;

      // Ensure proper decoding
      if (username.includes("%")) {
        username = decodeURIComponent(username);
      }

      // Check cache with skip option
      const cacheKey = `recommended_${username}`;
      const skipCache = req.query.timestamp !== undefined;
      const cachedData = studyMaterialCache.get(cacheKey);

      if (cachedData && !skipCache) {
        return res.status(200).json(cachedData);
      }

      // Fetch tags of user's created study materials
      const [tagRows] = await connection.execute(
        `SELECT DISTINCT JSON_EXTRACT(tags, '$[*]') AS tags
         FROM study_material_info
         WHERE created_by = ?`,
        [username]
      );

      if (tagRows.length === 0) {
        return res.status(404).json({ message: "No tags found for this user" });
      }

      const userTags = tagRows
        .map((row) => JSON.parse(row.tags))
        .flat()
        .map((tag) => tag.toLowerCase());

      // Fetch study materials with matching tags
      const [infoRows] = await connection.execute(
        `SELECT study_material_id, title, tags, total_items, created_by, total_views, created_at 
                 FROM study_material_info 
                 WHERE created_by != ? AND visibility = 1; `,
        [username]
      );

      if (infoRows.length === 0) {
        return res.json({
          message: "No study materials found with matching tags",
        });
      }

      // Process study materials in parallel
      const studyMaterials = await Promise.all(
        infoRows.map(async (info) => {
          const materialTags = JSON.parse(info.tags).map((tag) =>
            tag.toLowerCase()
          );
          const hasMatchingTags = materialTags.some((tag) =>
            userTags.includes(tag)
          );

          if (!hasMatchingTags) {
            return null;
          }

          const [contentRows] = await connection.execute(
            `SELECT term, definition, image 
             FROM study_material_content 
             WHERE study_material_id = ?`,
            [info.study_material_id]
          );

          return {
            study_material_id: info.study_material_id,
            title: info.title,
            tags: materialTags,
            total_items: info.total_items,
            created_by: info.created_by,
            total_views: info.total_views,
            created_at: info.created_at,
            items: contentRows.map((item) => ({
              term: item.term,
              definition: item.definition,
              image: formatImageToBase64(item.image),
            })),
          };
        })
      );

      const filteredMaterials = studyMaterials.filter(
        (material) => material !== null
      );

      // Cache results
      if (!skipCache) {
        studyMaterialCache.set(cacheKey, filteredMaterials, 1200); // 20 minutes cache
      }

      res.status(200).json(filteredMaterials);
    } catch (error) {
      console.error("Error fetching recommended cards:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  updateVisibility: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { studyMaterialId } = req.params;
      const { visibility } = req.body;

      await connection.execute(
        `UPDATE study_material_info SET visibility = ? WHERE study_material_id = ?`,
        [visibility, studyMaterialId]
      );

      // Clear specific study material cache
      studyMaterialCache.del(`study_material_${studyMaterialId}`);

      res.status(200).json({
        message: "Visibility updated successfully",
        studyMaterialId,
        visibility,
      });
    } catch (error) {
      console.error("Error updating visibility:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  incrementViews: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { studyMaterialId } = req.params;

      await connection.execute(
        `UPDATE study_material_info SET total_views = total_views + 1 WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      res.status(200).json({ message: "View count updated successfully" });
    } catch (error) {
      console.error("Error updating total views:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getTopPicks: async (req, res) => {
    const cacheKey = "top_picks";
    // Skip cache if timestamp parameter is present
    const skipCache = req.query.timestamp !== undefined;
    const cachedData = studyMaterialCache.get(cacheKey);

    if (cachedData && !skipCache) {
      return res.status(200).json(cachedData);
    }

    const connection = await pool.getConnection();
    try {
      // Optimized query with LIMIT for better performance
      const [rows] = await connection.execute(
        `SELECT
      i.study_material_id, i.title, i.tags, i.total_items,
        i.created_by, i.total_views, i.created_at
        FROM study_material_info i
        WHERE i.status = 'active' AND i.visibility = 1
        ORDER BY i.total_views DESC
        LIMIT 9; `
      );

      if (rows.length === 0) {
        return res.status(200).json([]);
      }

      // Process in parallel for better performance
      const studyMaterials = await Promise.all(
        rows.map(async (info) => {
          const [contentRows] = await connection.execute(
            `SELECT term, definition, image 
             FROM study_material_content 
             WHERE study_material_id = ?
             LIMIT 10`, // Limit items per card for faster loading
            [info.study_material_id]
          );

          return {
            study_material_id: info.study_material_id,
            title: info.title,
            tags: JSON.parse(info.tags),
            total_items: info.total_items,
            created_by: info.created_by,
            total_views: info.total_views,
            created_at: info.created_at,
            items: contentRows.map((item) => ({
              term: item.term,
              definition: item.definition,
              image: formatImageToBase64(item.image),
            })),
          };
        })
      );

      // Cache results unless skip is requested
      if (!skipCache) {
        studyMaterialCache.set(cacheKey, studyMaterials, 300);
      }

      res.status(200).json(studyMaterials);
    } catch (error) {
      console.error("Error fetching top picks:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getMadeByFriends: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { userId } = req.params;

      // Check cache with skip option
      const cacheKey = `made_by_friends_${userId}`;
      const skipCache = req.query.timestamp !== undefined;
      const cachedData = studyMaterialCache.get(cacheKey);

      if (cachedData && !skipCache) {
        return res.status(200).json(cachedData);
      }

      // Find all friends with accepted status
      const [friendsQuery] = await connection.execute(
        `SELECT
          CASE 
            WHEN sender_id = ? THEN receiver_id 
            WHEN receiver_id = ? THEN sender_id 
          END AS friend_id
        FROM friend_requests
      WHERE(sender_id = ? OR receiver_id = ?) 
        AND status = 'accepted'`,
        [userId, userId, userId, userId]
      );

      console.log(`Found ${friendsQuery.length} friends with accepted status`);
      console.log(
        "Friend IDs:",
        friendsQuery.map((row) => row.friend_id)
      );

      if (friendsQuery.length === 0) {
        return res.status(200).json([]);
      }

      // Extract friend IDs
      const friendIds = friendsQuery.map((row) => row.friend_id);

      // Use IN clause with prepared statement
      const placeholders = friendIds.map(() => "?").join(",");

      // Enhanced direct query for debugging
      const [directCheckQuery] = await connection.execute(
        `SELECT friend_id, COUNT(*) as study_count
      FROM(
        SELECT ? as friend_id, study_material_id
           FROM study_material_info
           WHERE created_by_id = ?
         ) as subquery
         GROUP BY friend_id`,
        [friendIds[0], friendIds[0]]
      );

      console.log("Direct check results:", directCheckQuery);

      // Log the query that will be executed
      console.log(
        `Query to execute: SELECT * FROM study_material_info WHERE created_by IN(${placeholders})`
      );
      console.log("With parameters:", friendIds);

      // Fetch study materials created by friends
      const [infoRows] = await connection.execute(
        `SELECT study_material_id, title, tags, total_items, created_by, total_views, created_at, status
         FROM study_material_info 
         WHERE created_by_id IN(${placeholders}) AND status != 'archived AND visibility = 1'
         ORDER BY created_at DESC`,
        [...friendIds]
      );

      console.log(`Found ${infoRows.length} study materials from friends`);
      console.log(
        "Created_by values:",
        infoRows.map((row) => row.created_by)
      );

      if (infoRows.length === 0) {
        return res.status(200).json([]);
      }

      // Get content for each study material in parallel
      const studyMaterials = await Promise.all(
        infoRows.map(async (info) => {
          const [contentRows] = await connection.execute(
            `SELECT term, definition, image 
             FROM study_material_content 
             WHERE study_material_id = ?`,
            [info.study_material_id]
          );

          return {
            study_material_id: info.study_material_id,
            title: info.title,
            tags: JSON.parse(info.tags),
            total_items: info.total_items,
            created_by: info.created_by,
            total_views: info.total_views,
            created_at: info.created_at,
            items: contentRows.map((item) => ({
              term: item.term,
              definition: item.definition,
              image: formatImageToBase64(item.image),
            })),
          };
        })
      );

      // Cache results
      if (!skipCache) {
        studyMaterialCache.set(cacheKey, studyMaterials, 1200); // 20 minutes cache
      }

      res.status(200).json(studyMaterials);
    } catch (error) {
      console.error("Error fetching study materials from friends:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getNonMatchingTags: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      let { username } = req.params;
      if (username.includes("%")) {
        username = decodeURIComponent(username);
      }

      // First, get the user's tags
      const [userTagRows] = await connection.execute(
        `SELECT DISTINCT tags FROM study_material_info WHERE created_by = ?`,
        [username]
      );

      // Parse and flatten user's tags
      const userTags = userTagRows
        .flatMap((row) => JSON.parse(row.tags))
        .map((tag) => tag.toLowerCase());

      console.log("User's tags:", userTags);

      // Get study materials not created by the user
      const [materials] = await connection.execute(
        `SELECT study_material_id, title, tags, total_items, created_by,
        total_views, created_at, visibility
             FROM study_material_info 
             WHERE created_by != ?
        AND visibility = 1
             ORDER BY created_at DESC
             LIMIT 10`,
        [username]
      );

      // Process each study material in parallel
      const discoveryMaterials = await Promise.all(
        materials.map(async (material) => {
          // Parse material tags
          const materialTags = JSON.parse(material.tags);

          // Calculate tag difference score
          const uniqueTags = materialTags.filter(
            (tag) => !userTags.includes(tag.toLowerCase())
          ).length;

          // Get content for this material
          const [contentRows] = await connection.execute(
            `SELECT term, definition, image 
             FROM study_material_content 
             WHERE study_material_id = ?`,
            [material.study_material_id]
          );

          return {
            study_material_id: material.study_material_id,
            title: material.title,
            tags: materialTags,
            total_items: material.total_items,
            created_by: material.created_by,
            total_views: material.total_views,
            created_at: material.created_at,
            uniqueness_score: uniqueTags,
            items: contentRows.map((item) => ({
              term: item.term,
              definition: item.definition,
              image: formatImageToBase64(item.image),
            })),
          };
        })
      );

      // Sort by uniqueness score and limit results
      const sortedMaterials = discoveryMaterials
        .sort((a, b) => b.uniqueness_score - a.uniqueness_score)
        .slice(0, 10);

      if (sortedMaterials.length === 0) {
        return res.status(200).json([]); // Return empty array instead of 404
      }

      res.status(200).json(sortedMaterials);
    } catch (error) {
      console.error("Error in discover endpoint:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    } finally {
      connection.release();
    }
  },

  bookmarkStudyMaterial: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { study_material_id, bookmarked_by_id } = req.body;

      console.log("Received bookmark request:", {
        study_material_id,
        bookmarked_by_id,
      });

      if (!study_material_id || !bookmarked_by_id) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Get current timestamp - Make sure this is formatted correctly
      const bookmarked_at = manilacurrentTimestamp; // If this is a function, call it

      // Check if study material exists
      const [studyMaterialRows] = await connection.execute(
        `SELECT study_material_id, created_by, created_by_id 
         FROM study_material_info 
         WHERE study_material_id = ?`,
        [study_material_id]
      );

      if (studyMaterialRows.length === 0) {
        return res.status(404).json({ error: "Study material not found" });
      }

      const { created_by, created_by_id } = studyMaterialRows[0];

      // Check if bookmark already exists
      const [existingBookmark] = await connection.execute(
        `SELECT * FROM bookmarked_study_material 
         WHERE study_material_id = ? AND bookmarked_by_id = ?`,
        [study_material_id, bookmarked_by_id]
      );

      // If bookmark exists, remove it (toggle functionality)
      if (existingBookmark.length > 0) {
        await connection.execute(
          `DELETE FROM bookmarked_study_material 
           WHERE study_material_id = ? AND bookmarked_by_id = ?`,
          [study_material_id, bookmarked_by_id]
        );

        return res.status(200).json({
          message: "Bookmark removed successfully",
          bookmarked: false,
        });
      }

      // Get bookmarked_by username from user table using bookmarked_by_id
      const [userRows] = await connection.execute(
        `SELECT username FROM users WHERE firebase_uid = ?`,
        [bookmarked_by_id]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const bookmarked_by = userRows[0].username;

      // Insert new bookmark
      await connection.execute(
        `INSERT INTO bookmarked_study_material
        (study_material_id, created_by, created_by_id, bookmarked_by, bookmarked_by_id, bookmarked_at)
      VALUES(?, ?, ?, ?, ?, ?)`,
        [
          study_material_id,
          created_by,
          created_by_id,
          bookmarked_by,
          bookmarked_by_id,
          bookmarked_at,
        ]
      );

      res.status(201).json({
        message: "Study material bookmarked successfully",
        bookmarked: true,
        bookmark: {
          study_material_id,
          created_by,
          created_by_id,
          bookmarked_by,
          bookmarked_by_id,
          bookmarked_at,
        },
      });
    } catch (error) {
      console.error("Error bookmarking study material:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  checkBookmarkStatus: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { study_material_id, bookmarked_by_id } = req.query;

      if (!study_material_id || !bookmarked_by_id) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Check if bookmark exists
      const [existingBookmark] = await connection.execute(
        `SELECT * FROM bookmarked_study_material 
       WHERE study_material_id = ? AND bookmarked_by_id = ?`,
        [study_material_id, bookmarked_by_id]
      );

      res.status(200).json({
        isBookmarked: existingBookmark.length > 0,
      });
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getBookmarksByUser: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { bookmarked_by_id } = req.params;

      // Skip cache if timestamp parameter is present (for forced refresh)
      const skipCache = req.query.timestamp !== undefined;

      const cacheKey = `bookmarks_${bookmarked_by_id}`;
      const cachedData = studyMaterialCache.get(cacheKey);

      if (cachedData && !skipCache) {
        return res.status(200).json(cachedData);
      }

      // First get just the list of bookmarked study materials (fast query)
      const [bookmarkIds] = await connection.execute(
        `SELECT study_material_id, bookmarked_at FROM bookmarked_study_material
         WHERE bookmarked_by_id = ?
        ORDER BY bookmarked_at DESC`,
        [bookmarked_by_id]
      );

      console.log(
        `Found ${bookmarkIds.length} bookmarked materials for user ${bookmarked_by_id}`
      );

      if (bookmarkIds.length === 0) {
        return res.status(200).json([]);
      }

      // Fetch data in smaller batches to avoid timeout
      const batchSize = 5;
      const validStudyMaterials = [];

      // Process in batches
      for (let i = 0; i < bookmarkIds.length; i += batchSize) {
        const batchIds = bookmarkIds
          .slice(i, i + batchSize)
          .map((item) => item.study_material_id);
        const placeholders = batchIds.map(() => "?").join(",");

        console.log(
          `Processing batch ${i / batchSize + 1} with IDs: `,
          batchIds
        );

        // Fetch info for this batch
        const [infoRows] = await connection.execute(
          `SELECT
      i.study_material_id, i.title, i.tags, i.total_items,
        i.created_by, i.created_by_id, i.total_views,
        i.created_at, i.updated_at, i.visibility, i.status
          FROM study_material_info i
          WHERE i.study_material_id IN(${placeholders})`,
          [...batchIds]
        );

        // For each study material, fetch its content
        for (const info of infoRows) {
          const [contentRows] = await connection.execute(
            `SELECT term, definition, image 
             FROM study_material_content 
             WHERE study_material_id = ?
        ORDER BY item_number ASC`,
            [info.study_material_id]
          );

          // Find the bookmark info for this material
          const bookmarkInfo = bookmarkIds.find(
            (b) => b.study_material_id === info.study_material_id
          );

          if (bookmarkInfo) {
            validStudyMaterials.push({
              bookmark_info: {
                study_material_id: info.study_material_id,
                created_by: info.created_by,
                created_by_id: info.created_by_id,
                bookmarked_by_id: bookmarked_by_id,
                bookmarked_at: bookmarkInfo.bookmarked_at,
              },
              study_material_info: {
                study_material_id: info.study_material_id,
                title: info.title,
                tags: JSON.parse(info.tags),
                total_items: info.total_items,
                created_by: info.created_by,
                created_by_id: info.created_by_id,
                total_views: info.total_views,
                created_at: info.created_at,
                updated_at: info.updated_at,
                visibility: info.visibility,
                status: info.status,
                items: contentRows.map((item) => ({
                  term: item.term,
                  definition: item.definition,
                  image: formatImageToBase64(item.image),
                })),
              },
            });
          }
        }
      }

      // Cache the complete result unless skipping cache
      if (!skipCache) {
        studyMaterialCache.set(cacheKey, validStudyMaterials, 300);
      }

      console.log(
        `Returning ${validStudyMaterials.length} bookmarked study materials`
      );
      res.status(200).json(validStudyMaterials);
    } catch (error) {
      console.error("Error fetching bookmarks by user:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  updateCreatedByUser: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { created_by, created_by_id } = req.body;

      if (!created_by || !created_by_id) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Update study_material_info table for all materials by this user
      await connection.execute(
        `UPDATE study_material_info 
       SET created_by = ?
        WHERE created_by_id = ?`,
        [created_by, created_by_id]
      );

      // Also update bookmarked_study_material table
      await connection.execute(
        `UPDATE bookmarked_study_material 
       SET created_by = ?
        WHERE created_by_id = ?`,
        [created_by, created_by_id]
      );

      // Clear related caches
      studyMaterialCache.del("top_picks");

      // Clear user-specific cache keys that match pattern
      const keys = studyMaterialCache.keys();
      const userKeys = keys.filter((key) => key.includes(created_by_id));
      userKeys.forEach((key) => studyMaterialCache.del(key));

      res.status(200).json({ message: "Study materials updated successfully" });
    } catch (error) {
      console.error("Error updating study materials:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getStudyMaterialInfo: async (req, res) => {
    let connection;
    try {
      const { studyMaterialId } = req.params;

      if (!studyMaterialId) {
        return res.status(400).json({
          success: false,
          message: "Study material ID is required",
        });
      }

      // Try to get from cache first
      const cacheKey = `study_material_info_${studyMaterialId}`;
      const cachedInfo = studyMaterialCache.get(cacheKey);

      if (cachedInfo) {
        return res.json({
          success: true,
          data: cachedInfo,
        });
      }

      // Not in cache, get from database
      connection = await pool.getConnection();

      const [result] = await connection.query(
        `SELECT study_material_id, title, tags, total_items, visibility, status, created_by, created_by_id
         FROM study_material_info 
         WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Study material not found",
        });
      }

      // Store in cache for future requests
      studyMaterialCache.set(cacheKey, result[0], 600); // Cache for 10 minutes

      return res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error("Error fetching study material info:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch study material info",
        error: error.message,
      });
    } finally {
      if (connection) connection.release();
    }
  },

  getPersonalizedStudyMaterials: async (req, res) => {
    const { username } = req.params;
    const connection = await pool.getConnection();

    try {
      // Get user's personalization preferences
      const [userInfo] = await connection.execute(
        `SELECT personalization FROM user_info WHERE username = ?`,
        [username]
      );

      if (!userInfo || !userInfo.length || !userInfo[0].personalization) {
        return res.json([]);
      }

      const userPreferences = JSON.parse(userInfo[0].personalization);

      // Get study materials where tags match user preferences
      const [materials] = await connection.execute(
        `
        SELECT 
          study_material_id,
          title,
          tags,
          total_items,
          created_by,
          total_views,
          created_at,
          visibility,
          status
        FROM study_material_info 
        WHERE visibility = 1 
        AND status = 'active'
        AND created_by != ?
        AND JSON_OVERLAPS(JSON_ARRAY(?${",?".repeat(
          userPreferences.length - 1
        )}), JSON_EXTRACT(tags, '$'))
        ORDER BY created_at DESC
        LIMIT 10
      `,
        [username, ...userPreferences]
      );

      // Process each study material to get its content
      const personalizedMaterials = await Promise.all(
        materials.map(async (material) => {
          // Get content for this material
          const [contentRows] = await connection.execute(
            `SELECT term, definition, image 
             FROM study_material_content 
             WHERE study_material_id = ?`,
            [material.study_material_id]
          );

          return {
            study_material_id: material.study_material_id,
            title: material.title,
            tags: JSON.parse(material.tags),
            total_items: material.total_items,
            created_by: material.created_by,
            total_views: material.total_views,
            created_at: material.created_at,
            items: contentRows.map((item) => ({
              term: item.term,
              definition: item.definition,
              image: formatImageToBase64(item.image),
            })),
          };
        })
      );

      res.json(personalizedMaterials);
    } catch (error) {
      console.error("Error in getPersonalizedStudyMaterials:", error);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      connection.release();
    }
  },
};

export default studyMaterialController;
