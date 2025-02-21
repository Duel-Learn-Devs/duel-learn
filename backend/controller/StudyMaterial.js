import { pool } from "../config/db.js";
import { nanoid } from "nanoid";
import moment from "moment-timezone";

const studyMaterialController = {
  saveStudyMaterial: async (req, res) => {
    const connection = await pool.getConnection();

    try {
      let studyMaterialId = req.body.studyMaterialId || nanoid();
      const {
        title,
        tags,
        totalItems,
        visibility = 0,
        createdBy,
        totalView = 1,
        items, // Receiving items with Base64 images
      } = req.body;

      console.log("Generated Study Material ID:", studyMaterialId);
      const currentTimestamp = moment()
        .tz("Asia/Manila")
        .format("YYYY-MM-DD HH:mm:ss");

      await connection.beginTransaction();

      // Insert into study_material_info
      await connection.execute(
        `INSERT INTO study_material_info 
                (study_material_id, title, tags, total_items, visibility, created_by, total_views, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          studyMaterialId,
          title,
          JSON.stringify(tags), // Store tags as a JSON string
          totalItems,
          visibility,
          createdBy,
          totalView,
          currentTimestamp,
        ]
      );

      // Insert items into study_material_content
      const insertItemPromises = items.map(async (item, index) => {
        const itemId = nanoid();
        let imageBuffer = null;

        if (item.image) {
          // Decode Base64 to binary (Buffer)
          const base64Data = item.image.replace(/^data:image\/\w+;base64,/, ""); // Remove Base64 header
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
      res.status(201).json({
        message: "Study material saved successfully",
        studyMaterialId,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Error saving study material:", error);
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

      const [infoRows] = await connection.execute(
        `SELECT title, tags, total_items, created_by, total_views, created_at 
                FROM study_material_info 
                WHERE study_material_id = ?;`,
        [studyMaterialId]
      );

      if (infoRows.length === 0) {
        return res.status(404).json({ message: "Study material not found" });
      }

      const [contentRows] = await connection.execute(
        `SELECT term, definition, image 
                FROM study_material_content 
                WHERE study_material_id = ?;`,
        [studyMaterialId]
      );

      // Ensure JSON-safe data
      const formattedContent = contentRows.map((item) => ({
        term: item.term,
        definition: item.definition,
        image: item.image ? item.image.toString("base64") : null,
      }));

      res.status(200).json({
        title: infoRows[0].title,
        tags: JSON.parse(infoRows[0].tags), // Parse stored JSON tags
        total_items: infoRows[0].total_items,
        created_by: infoRows[0].created_by,
        total_views: infoRows[0].total_views,
        created_at: infoRows[0].created_at,
        items: formattedContent, // Updated to match frontend structure
      });
    } catch (error) {
      console.error("Error fetching study material:", error);
      res.status(500).json({ error: "Internal server error", details: error });
    } finally {
      connection.release();
    }
  },

  getStudyMaterialByUser: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { created_by } = req.params;
      console.log("Fetching study materials for created_by:", created_by);

      const [infoRows] = await connection.execute(
        `SELECT study_material_id, title, tags, total_items, created_by, total_views, created_at 
                FROM study_material_info 
                WHERE created_by = ?;`,
        [created_by]
      );

      if (infoRows.length === 0) {
        return res
          .status(404)
          .json({ message: "No study materials found for this creator" });
      }

      const studyMaterials = await Promise.all(
        infoRows.map(async (info) => {
          const [contentRows] = await connection.execute(
            `SELECT term, definition, image 
                    FROM study_material_content 
                    WHERE study_material_id = ?;`,
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
              image: item.image ? item.image.toString("base64") : null,
            })),
          };
        })
      );

      res.status(200).json(studyMaterials);
    } catch (error) {
      console.error("Error fetching study materials by creator:", error);
      res.status(500).json({ error: "Internal server error", details: error });
    } finally {
      connection.release();
    }
  },

  getRecommendedForYouCards: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      let { user } = req.params;
      console.log("Raw user param:", user);

      // Ensure decoding only if necessary
      if (user.includes("%")) {
        user = decodeURIComponent(user);
      }
      console.log("Decoded user param:", user);

      // Fetch tags of the user's created study materials
      const [tagRows] = await connection.execute(
        `SELECT DISTINCT JSON_EXTRACT(tags, '$[*]') AS tags
                 FROM study_material_info
                 WHERE created_by = ?;`,
        [user]
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
        [user]
      );

      if (infoRows.length === 0) {
        return res
          .status(404)
          .json({ message: "No study materials found with matching tags" });
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
              image: item.image ? item.image.toString("base64") : null,
            })),
          };
        })
      );

      const filteredMaterials = studyMaterials.filter(
        (material) => material !== null
      );

      res.status(200).json(filteredMaterials);
    } catch (error) {
      console.error("Error fetching recommended cards:", error);
      res.status(500).json({ error: "Internal server error", details: error });
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
      res.status(500).json({ error: "Internal server error", details: error });
    } finally {
      connection.release();
    }
  },

  getTopPicks: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const [infoRows] = await connection.execute(
        `SELECT study_material_id, title, tags, total_items, created_by, total_views, created_at 
                 FROM study_material_info 
                 ORDER BY total_views DESC;`
      );

      console.log(
        `Fetched ${infoRows.length} study materials from the database.`
      );

      if (infoRows.length === 0) {
        return res.status(404).json({ message: "No study materials found" });
      }

      const studyMaterials = await Promise.all(
        infoRows.map(async (info) => {
          const [contentRows] = await connection.execute(
            `SELECT term, definition, image 
                     FROM study_material_content 
                     WHERE study_material_id = ?;`,
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
              image: item.image ? item.image.toString("base64") : null,
            })),
          };
        })
      );

      console.log(
        `Returning ${studyMaterials.length} study materials as top picks.`
      );

      res.status(200).json(studyMaterials);
    } catch (error) {
      console.error("Error fetching top picks:", error);
      res.status(500).json({ error: "Internal server error", details: error });
    } finally {
      connection.release();
    }
  },

  getNonMatchingTags: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      let { user } = req.params;
      if (user.includes("%")) user = decodeURIComponent(user);
      console.log("Fetching non-matching tags for user:", user);

      // Fetch tags of study materials created by the user
      const [tagRows] = await connection.execute(
        `SELECT tags FROM study_material_info WHERE created_by = ?;`,
        [user]
      );

      if (tagRows.length === 0) {
        return res.status(404).json({ message: "No tags found for this user" });
      }

      // Extract and flatten all tags
      const userTags = tagRows.flatMap((row) => JSON.parse(row.tags));
      if (userTags.length === 0) {
        return res.status(404).json({ message: "User has not used any tags" });
      }

      // Fetch study materials that do not contain any matching tags
      const [infoRows] = await connection.execute(
        `SELECT study_material_id, title, tags, total_items, created_by, total_views, created_at 
             FROM study_material_info;`
      );

      // Filter study materials by checking if they do not share any tags with the user
      const filteredMaterials = infoRows.filter((info) => {
        const materialTags = JSON.parse(info.tags);
        return !materialTags.some((tag) => userTags.includes(tag));
      });

      if (filteredMaterials.length === 0) {
        return res
          .status(404)
          .json({ message: "No non-matching study materials found" });
      }

      const studyMaterials = await Promise.all(
        filteredMaterials.map(async (info) => {
          const [contentRows] = await connection.execute(
            `SELECT term, definition, image 
                 FROM study_material_content 
                 WHERE study_material_id = ?;`,
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
              image: item.image ? item.image.toString("base64") : null,
            })),
          };
        })
      );

      res.status(200).json(studyMaterials);
    } catch (error) {
      console.error("Error fetching non-matching tags:", error);
      res.status(500).json({ error: "Internal server error", details: error });
    } finally {
      connection.release();
    }
  },
};

export default studyMaterialController;
