import { pool } from "../config/db.js";
import { nanoid } from "nanoid";
import manilacurrentTimestamp from "../utils/CurrentTimestamp.js";
// Add NodeCache for caching
import NodeCache from "node-cache";

// Create cache instance (TTL: 10 minutes, check period: 2 minutes)
const studyMaterialCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Utility function to handle image conversion properly
const formatImageToBase64 = (imageBuffer) => {
  if (!imageBuffer) return null;

  // Convert buffer to Base64
  const base64String = imageBuffer.toString('base64');

  // Add proper data URL prefix for images
  // We'll use image/jpeg as default, but in a production app
  // you might want to store and use the actual mime type
  return `data:image/jpeg;base64,${base64String}`;
};

// Add this utility function at the top level
const invalidateCachesForUser = (created_by, created_by_id) => {
  // Clear specific user caches
  studyMaterialCache.del(`study_materials_${created_by}`);

  // Clear top picks cache
  studyMaterialCache.del('top_picks');

  // Clear relevant caches by searching all keys
  const allKeys = studyMaterialCache.keys();
  allKeys.forEach(key => {
    if (key.includes(created_by_id) ||
      key.includes(created_by) ||
      key.includes('bookmarks_') ||
      key.startsWith('recommended_')) {
      studyMaterialCache.del(key);
    }
  });
};

// Near the beginning of the file, add these preload functions
const preloadTopPicks = async () => {
  console.log("Preloading top picks data...");
  const connection = await pool.getConnection();
  try {
    // Fetch top picks data
    const [rows] = await connection.execute(
      `SELECT 
        i.study_material_id, i.title, i.tags, i.total_items, 
        i.created_by, i.total_views, i.created_at,
        c.term, c.definition, c.image, c.item_number
      FROM study_material_info i
      JOIN study_material_content c ON i.study_material_id = c.study_material_id
      WHERE i.status = 'active' AND i.visibility = 0
      ORDER BY i.total_views DESC, c.item_number ASC
      LIMIT 100;`
    );

    if (rows.length === 0) {
      console.log("No top picks found to preload");
      return;
    }

    // Group by study_material_id
    const materialMap = new Map();

    rows.forEach(row => {
      if (!materialMap.has(row.study_material_id)) {
        materialMap.set(row.study_material_id, {
          study_material_id: row.study_material_id,
          title: row.title,
          tags: JSON.parse(row.tags),
          total_items: row.total_items,
          created_by: row.created_by,
          total_views: row.total_views,
          created_at: row.created_at,
          items: []
        });
      }

      // Add content item
      materialMap.get(row.study_material_id).items.push({
        term: row.term,
        definition: row.definition,
        image: formatImageToBase64(row.image)
      });
    });

    // Convert map to array and take top 9
    const studyMaterials = Array.from(materialMap.values()).slice(0, 9);

    // Cache the results
    studyMaterialCache.set('top_picks', studyMaterials, 3600); // Cache for 1 hour
    console.log("Top picks preloaded successfully");
  } catch (error) {
    console.error("Error preloading top picks:", error);
  } finally {
    connection.release();
  }
};

// Add preloader for recommended content
const preloadRecommendedContent = async () => {
  const connection = await pool.getConnection();
  try {
    // Get a list of active users to preload their recommendations
    const [activeUsers] = await connection.execute(
      `SELECT username FROM users ORDER BY last_active DESC LIMIT 10`
    );

    if (activeUsers.length === 0) return;

    // Preload recommendations for the most active users
    for (const userRow of activeUsers) {
      const username = userRow.username;
      const cacheKey = `recommended_${username}`;

      // Skip if already cached
      if (studyMaterialCache.has(cacheKey)) continue;

      console.log(`Preloading recommendations for user: ${username}`);

      // Fetch tags of the user's created study materials
      const [tagRows] = await connection.execute(
        `SELECT DISTINCT JSON_EXTRACT(tags, '$[*]') AS tags
         FROM study_material_info
         WHERE created_by = ?;`,
        [username]
      );

      if (tagRows.length === 0) continue;

      const userTags = tagRows
        .map((row) => JSON.parse(row.tags))
        .flat()
        .map((tag) => tag.toLowerCase());

      // Fetch study materials with matching tags
      const [infoRows] = await connection.execute(
        `SELECT study_material_id, title, tags, total_items, created_by, total_views, created_at 
         FROM study_material_info 
         WHERE created_by != ? AND status = 'active';`,
        [username]
      );

      if (infoRows.length === 0) continue;

      const materialPromises = infoRows.map(async (info) => {
        const materialTags = JSON.parse(info.tags).map((tag) => tag.toLowerCase());
        const hasMatchingTags = materialTags.some((tag) => userTags.includes(tag));

        if (!hasMatchingTags) return null;

        const [contentRows] = await connection.execute(
          `SELECT term, definition, image 
           FROM study_material_content 
           WHERE study_material_id = ?;`,
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
      });

      const studyMaterials = (await Promise.all(materialPromises)).filter(m => m !== null);
      if (studyMaterials.length > 0) {
        // Cache for 30 minutes
        studyMaterialCache.set(cacheKey, studyMaterials, 1800);
        console.log(`Cached recommendations for ${username}: ${studyMaterials.length} items`);
      }
    }
  } catch (error) {
    console.error("Error preloading recommendations:", error);
  } finally {
    connection.release();
  }
};

// Initialize preloading
setTimeout(preloadTopPicks, 2000);
setTimeout(preloadRecommendedContent, 2000); // Slightly delayed to not overload startup

const studyMaterialController = {
  saveStudyMaterial: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      let studyMaterialId = req.body.studyMaterialId || nanoid();
      const {
        title,
        tags,
        totalItems,
        visibility = 0,
        createdBy,
        createdById,
        totalView = 1,
        status = "active",
        items,
      } = req.body;

      console.log("Generated Study Material ID:", studyMaterialId);
      const currentTimestamp = manilacurrentTimestamp;
      const updatedTimestamp = currentTimestamp;

      await connection.beginTransaction();

      await connection.execute(
        `INSERT INTO study_material_info 
                (study_material_id, title, tags, total_items, visibility, status, created_by, created_by_id, total_views, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          studyMaterialId,
          title,
          JSON.stringify(tags),
          totalItems,
          visibility,
          status,
          createdBy,
          createdById,
          totalView,
          currentTimestamp,
          updatedTimestamp,
        ]
      );

      // Insert items and collect term-definition pairs
      const termDefinitionPairs = [];
      const insertItemPromises = Array.isArray(items)
        ? items.map(async (item, index) => {
            const itemId = nanoid();
            let imageBuffer = null;

            if (item.image) {
              const base64Data = item.image.replace(
                /^data:image\/\w+;base64,/,
                ""
              );
              imageBuffer = Buffer.from(base64Data, "base64");
            }

            termDefinitionPairs.push({
              term: item.term,
              definition: item.definition,
            });

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
          })
        : [];

      // Ensure termDefinitionPairs is fully populated before AI calls
      await Promise.all(insertItemPromises);
      await connection.commit();

      // Clear caches after successful save
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
      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError);
        }
      }
    }
  },

  editStudyMaterial: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const { studyMaterialId, title, tags, totalItems, visibility, items } =
        req.body;

      // Validate required fields
      if (!studyMaterialId || !title || !items || !items.length) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await connection.beginTransaction();

      // Get current timestamp for the update
      const updatedTimestamp = manilacurrentTimestamp;

      // Update study_material_info table with timestamp
      await connection.execute(
        `UPDATE study_material_info 
         SET title = ?, tags = ?, total_items = ?, visibility = ?, updated_at = ? 
         WHERE study_material_id = ?`,
        [
          title,
          JSON.stringify(tags), // Store tags as a JSON string
          totalItems,
          visibility,
          updatedTimestamp, // Add the updated timestamp
          studyMaterialId,
        ]
      );

      // Delete existing items for this study material
      await connection.execute(
        `DELETE FROM study_material_content WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      // Insert updated items into study_material_content
      const insertItemPromises = items.map(async (item, index) => {
        const itemId = nanoid();
        let imageBuffer = null;

        if (item.image) {
          // Handle both new base64 images and existing ones
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
        invalidateCachesForUser(creatorInfo[0].created_by, creatorInfo[0].created_by_id);
      }

      // Also clear specific study material cache
      studyMaterialCache.del(`study_material_${studyMaterialId}`);

      res.status(200).json({
        message: "Study material updated successfully",
        studyMaterialId,
        updated_at: updatedTimestamp,
      });
    } catch (error) {
      console.error("Error editing study material:", error);
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
      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError);
        }
      }
    }
  },

  archiveStudyMaterial: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { studyMaterialId } = req.params;
      console.log("Archiving study material with ID:", studyMaterialId);

      // Get study material info before archiving (for cache invalidation)
      const [studyMaterialInfo] = await connection.execute(
        `SELECT created_by, created_by_id FROM study_material_info WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      // Update visibility to 1 (archived)
      await connection.execute(
        `UPDATE study_material_info
         SET status = 'archived'
          WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      // Clear all relevant caches
      if (studyMaterialInfo && studyMaterialInfo.length > 0) {
        const { created_by, created_by_id } = studyMaterialInfo[0];

        // Clear specific study material cache
        studyMaterialCache.del(`study_material_${studyMaterialId}`);

        // Clear user's materials cache
        studyMaterialCache.del(`study_materials_${created_by}`);

        // Clear top picks cache
        studyMaterialCache.del('top_picks');

        // Look for any cache keys containing this study material ID
        const allKeys = studyMaterialCache.keys();
        allKeys.forEach(key => {
          if (key.includes(studyMaterialId) ||
            key.includes(created_by_id) ||
            key.includes(created_by) ||
            key.includes('bookmarks')) {
            studyMaterialCache.del(key);
          }
        });

        console.log("Cache cleared for archived study material");
      }

      res.status(200).json({
        message: "Study material archived successfully",
        studyMaterialId
      });
    } catch (error) {
      console.error("Error archiving study material:", error);
      res.status(500).json({ error: "Internal server error", details: error });
    } finally {
      connection.release();
    }
  },

  getStudyMaterialById: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { studyMaterialId } = req.params;
      console.log("Requested studyMaterialId:", studyMaterialId);

      // Check cache first
      const cacheKey = `study_material_${studyMaterialId}`;
      const cachedData = studyMaterialCache.get(cacheKey);

      if (cachedData) {
        console.log("Returning cached study material");
        return res.status(200).json(cachedData);
      }

      // Use a single JOIN query instead of two separate queries
      const [rows] = await connection.execute(
        `SELECT 
        i.title, i.tags, i.total_items, i.created_by, i.created_by_id, 
        i.total_views, i.created_at, i.status, i.visibility,
        c.term, c.definition, c.image 
      FROM study_material_info i
      LEFT JOIN study_material_content c ON i.study_material_id = c.study_material_id
      WHERE i.study_material_id = ?;`,
        [studyMaterialId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Study material not found" });
      }

      // Extract info data (same for all rows)
      const result = {
        title: rows[0].title,
        tags: JSON.parse(rows[0].tags),
        total_items: rows[0].total_items,
        created_by: rows[0].created_by,
        created_by_id: rows[0].created_by_id,
        total_views: rows[0].total_views,
        created_at: rows[0].created_at,
        status: rows[0].status,
        visibility: rows[0].visibility,
        items: rows.map(row => ({
          term: row.term,
          definition: row.definition,
          image: formatImageToBase64(row.image),
        }))
      };

      // Cache the result
      studyMaterialCache.set(cacheKey, result, 300); // Cache for 5 minutes

      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching study material:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getStudyMaterialByUser: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { created_by } = req.params;
      console.log("Fetching study materials for created_by:", created_by);

      // Check for cache but use a consistent key format
      const cacheKey = `study_materials_${created_by}`;
      const cachedData = studyMaterialCache.get(cacheKey);

      // Skip cache if requested (for forced refresh)
      const skipCache = req.query.timestamp !== undefined;

      if (cachedData && !skipCache) {
        console.log("Returning cached study materials for user");
        return res.status(200).json(cachedData);
      }

      const [infoRows] = await connection.execute(
        `SELECT study_material_id, title, tags, total_items, created_by, created_by_id, 
                total_views, created_at, updated_at, visibility, status
         FROM study_material_info 
         WHERE created_by = ? 
         ORDER BY updated_at DESC, created_at DESC;`,
        [created_by]
      );

      if (infoRows.length === 0) {
        return res
          .status(200)
          .json([]); // Return empty array instead of 404 for easier frontend handling
      }

      const studyMaterials = await Promise.all(
        infoRows.map(async (info) => {
          const [contentRows] = await connection.execute(
            `SELECT term, definition, image 
             FROM study_material_content 
             WHERE study_material_id = ?
             ORDER BY item_number ASC;`,
            [info.study_material_id]
          );

          return {
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
          };
        })
      );

      // Cache the results but only if not skipping cache
      if (!skipCache) {
        studyMaterialCache.set(cacheKey, studyMaterials, 300); // Cache for 5 minutes
      }

      console.log(`Returning ${studyMaterials.length} study materials for user ${created_by}`);
      res.status(200).json(studyMaterials);
    } catch (error) {
      console.error("Error fetching study materials by creator:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getRecommendedForYouCards: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      let { username } = req.params;
      console.log("Raw user param:", username);

      // Ensure decoding only if necessary
      if (username.includes("%")) {
        username = decodeURIComponent(username);
      }
      console.log("Decoded user param:", username);

      // Check cache first
      const cacheKey = `recommended_${username}`;
      // Skip cache if timestamp parameter is present
      const skipCache = req.query.timestamp !== undefined;
      const cachedData = studyMaterialCache.get(cacheKey);

      if (cachedData && !skipCache) {
        console.log(`Returning cached recommendations for ${username}`);
        return res.status(200).json(cachedData);
      }

      // Fetch tags of the user's created study materials
      const [tagRows] = await connection.execute(
        `SELECT DISTINCT JSON_EXTRACT(tags, '$[*]') AS tags
                 FROM study_material_info
                 WHERE created_by = ?;`,
        [username]
      );

      if (tagRows.length === 0) {
        return res.status(404).json({ message: "No tags found for this user" });
      }

      const userTags = tagRows
        .map((row) => JSON.parse(row.tags))
        .flat()
        .map((tag) => tag.toLowerCase());
      console.log("User tags:", userTags);

      // Fetch study materials with matching tags
      const [infoRows] = await connection.execute(
        `SELECT study_material_id, title, tags, total_items, created_by, total_views, created_at 
                 FROM study_material_info 
                 WHERE created_by != ?;`,
        [username]
      );

      if (infoRows.length === 0) {
        return res.json({
          message: "No study materials found with matching tags",
        });
      }

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
                     WHERE study_material_id = ?;`,
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

      // Cache results at the end
      if (!skipCache) {
        studyMaterialCache.set(cacheKey, filteredMaterials, 1200); // Cache for 20 minutes
      }

      res.status(200).json(filteredMaterials);
    } catch (error) {
      console.error("Error fetching recommended cards:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  incrementViews: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { studyMaterialId } = req.params;

      // Increment total_views by 1
      await connection.execute(
        `UPDATE study_material_info 
                 SET total_views = total_views + 1 
                 WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      res.status(200).json({ message: "View count updated successfully" });
    } catch (error) {
      console.error("Error updating total views:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getTopPicks: async (req, res) => {
    const cacheKey = 'top_picks';
    const cachedData = studyMaterialCache.get(cacheKey);

    if (cachedData) {
      console.log("Returning cached top picks");
      return res.status(200).json(cachedData);
    }

    // If cache is empty and a request comes in, start preloading for next request
    setTimeout(preloadTopPicks, 0);

    const connection = await pool.getConnection();
    try {
      console.log("Cache miss for top picks, fetching from database...");

      // Use a lighter query with LIMIT for faster initial response
      const [rows] = await connection.execute(
        `SELECT 
          i.study_material_id, i.title, i.tags, i.total_items, 
          i.created_by, i.total_views, i.created_at
        FROM study_material_info i
        WHERE i.status = 'active' AND i.visibility = 0
        ORDER BY i.total_views DESC
        LIMIT 9;`
      );

      if (rows.length === 0) {
        return res.status(200).json([]);
      }

      // Use Promise.all for parallel content fetching
      const studyMaterials = await Promise.all(
        rows.map(async (info) => {
          const [contentRows] = await connection.execute(
            `SELECT term, definition, image 
             FROM study_material_content 
             WHERE study_material_id = ?
             LIMIT 10;`, // Limit items per card for faster loading
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
            items: contentRows.map(item => ({
              term: item.term,
              definition: item.definition,
              image: formatImageToBase64(item.image)
            }))
          };
        })
      );

      // Cache results
      studyMaterialCache.set(cacheKey, studyMaterials, 300);

      res.status(200).json(studyMaterials);
    } catch (error) {
      console.error("Error fetching top picks:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getMadeByFriends: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { userId } = req.params;
      console.log("Looking for study materials for user with ID:", userId);

      // Check cache first
      const cacheKey = `made_by_friends_${userId}`;
      // Skip cache if timestamp parameter is present
      const skipCache = req.query.timestamp !== undefined;
      const cachedData = studyMaterialCache.get(cacheKey);

      if (cachedData && !skipCache) {
        console.log("Returning cached study materials made by friends");
        return res.status(200).json(cachedData);
      }

      // Find all friends with accepted status (where user is either sender or receiver)
      const [friendsQuery] = await connection.execute(
        `SELECT 
          CASE 
            WHEN sender_id = ? THEN receiver_id 
            WHEN receiver_id = ? THEN sender_id 
          END AS friend_id
        FROM friend_requests 
        WHERE (sender_id = ? OR receiver_id = ?) 
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
         FROM (
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
        `Query to execute: SELECT * FROM study_material_info WHERE created_by IN (${placeholders})`
      );
      console.log("With parameters:", friendIds);

      // Fetch study materials created by friends
      const [infoRows] = await connection.execute(
        `SELECT study_material_id, title, tags, total_items, created_by, total_views, created_at, status
         FROM study_material_info 
         WHERE created_by_id IN (${placeholders}) AND status != 'archived'
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

      // Get content for each study material
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

      // Cache results at the end
      if (!skipCache) {
        studyMaterialCache.set(cacheKey, studyMaterials, 1200); // Cache for 20 minutes
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
      console.log("Fetching discover content for user:", username);

      // First, get the user's tags
      const [userTagRows] = await connection.execute(
        `SELECT DISTINCT tags 
             FROM study_material_info 
             WHERE created_by = ?`,
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
             AND visibility = 0
             ORDER BY created_at DESC
             LIMIT 10`,
        [username]
      );

      // Process each study material
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
            }))
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

      console.log("Received bookmark request:", { study_material_id, bookmarked_by_id });

      if (!study_material_id || !bookmarked_by_id) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Get current timestamp - Make sure this is formatted correctly
      const bookmarked_at = manilacurrentTimestamp;  // If this is a function, call it

      // First check if this study material exists
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
        console.log("Removing existing bookmark");
        await connection.execute(
          `DELETE FROM bookmarked_study_material 
           WHERE study_material_id = ? AND bookmarked_by_id = ?`,
          [study_material_id, bookmarked_by_id]
        );

        return res.status(200).json({
          message: "Bookmark removed successfully",
          bookmarked: false
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
      console.log("Adding new bookmark for user:", bookmarked_by);

      // Insert new bookmark
      await connection.execute(
        `INSERT INTO bookmarked_study_material 
         (study_material_id, created_by, created_by_id, bookmarked_by, bookmarked_by_id, bookmarked_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [study_material_id, created_by, created_by_id, bookmarked_by, bookmarked_by_id, bookmarked_at]
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
          bookmarked_at
        }
      });
    } catch (error) {
      console.error("Error bookmarking study material:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
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
        isBookmarked: existingBookmark.length > 0
      });
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getBookmarksByUser: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { bookmarked_by_id } = req.params;
      console.log("Fetching bookmarks for user ID:", bookmarked_by_id);

      // Skip cache if timestamp parameter is present (for forced refresh)
      const skipCache = req.query.timestamp !== undefined;

      const cacheKey = `bookmarks_${bookmarked_by_id}`;
      const cachedData = studyMaterialCache.get(cacheKey);

      if (cachedData && !skipCache) {
        console.log("Returning cached bookmarks");
        return res.status(200).json(cachedData);
      }

      // First get just the list of bookmarked study materials (fast query)
      const [bookmarkIds] = await connection.execute(
        `SELECT study_material_id, bookmarked_at FROM bookmarked_study_material
         WHERE bookmarked_by_id = ?
         ORDER BY bookmarked_at DESC`,
        [bookmarked_by_id]
      );

      console.log(`Found ${bookmarkIds.length} bookmarked materials for user ${bookmarked_by_id}`);

      if (bookmarkIds.length === 0) {
        return res.status(200).json([]);
      }

      // Fetch data in smaller batches to avoid timeout
      const batchSize = 5;
      const validStudyMaterials = [];

      // Process in batches
      for (let i = 0; i < bookmarkIds.length; i += batchSize) {
        const batchIds = bookmarkIds.slice(i, i + batchSize).map(item => item.study_material_id);
        const placeholders = batchIds.map(() => '?').join(',');

        console.log(`Processing batch ${i / batchSize + 1} with IDs:`, batchIds);

        // Fetch info for this batch
        const [infoRows] = await connection.execute(
          `SELECT 
            i.study_material_id, i.title, i.tags, i.total_items, 
            i.created_by, i.created_by_id, i.total_views, 
            i.created_at, i.visibility, i.status
          FROM study_material_info i
          WHERE i.study_material_id IN (${placeholders})`,
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
            b => b.study_material_id === info.study_material_id
          );

          if (bookmarkInfo) {
            validStudyMaterials.push({
              bookmark_info: {
                study_material_id: info.study_material_id,
                created_by: info.created_by,
                created_by_id: info.created_by_id,
                bookmarked_by_id: bookmarked_by_id,
                bookmarked_at: bookmarkInfo.bookmarked_at
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
                visibility: info.visibility,
                status: info.status,
                items: contentRows.map(item => ({
                  term: item.term,
                  definition: item.definition,
                  image: formatImageToBase64(item.image)
                }))
              }
            });
          }
        }
      }

      // Cache the complete result unless skipping cache
      if (!skipCache) {
        studyMaterialCache.set(cacheKey, validStudyMaterials, 300);
      }

      console.log(`Returning ${validStudyMaterials.length} bookmarked study materials`);
      res.status(200).json(validStudyMaterials);
    } catch (error) {
      console.error("Error fetching bookmarks by user:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
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
      studyMaterialCache.del('top_picks');

      // Clear user-specific cache keys that match pattern
      const keys = studyMaterialCache.keys();
      const userKeys = keys.filter(key => key.includes(created_by_id));
      userKeys.forEach(key => studyMaterialCache.del(key));

      res.status(200).json({ message: "Study materials updated successfully" });
    } catch (error) {
      console.error("Error updating study materials:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  }

};


export default studyMaterialController;
