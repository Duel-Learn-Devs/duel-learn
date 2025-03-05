import { pool } from "../config/db.js";
import { nanoid } from "nanoid";
import manilacurrentTimestamp from "../utils/CurrentTimestamp.js";


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
        items, // Receiving items with Base64 images
      } = req.body;

      console.log("Generated Study Material ID:", studyMaterialId);
      const currentTimestamp = manilacurrentTimestamp;
      const updatedTimestamp = currentTimestamp;

      await connection.beginTransaction();

      // Insert into study_material_info with summary
      await connection.execute(
        `INSERT INTO study_material_info 
                (study_material_id, title, tags, summary, total_items, visibility, status,created_by, created_by_id, total_views, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?,?,?, ?, ?, ?, ?);`,
        [
          studyMaterialId,
          title,
          JSON.stringify(tags), // Store tags as a JSON string
          summary,
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

      // Insert items into study_material_content
      const insertItemPromises = items.map(async (item, index) => {
        const itemId = nanoid();
        let imageBuffer = null;

        console.log('Saving item:', item); // Add logging

        if (item.image) {
          const base64Data = item.image.replace(/^data:image\/\w+;base64,/, "");
          imageBuffer = Buffer.from(base64Data, "base64");
        }

        // Ensure options is properly stringified
        const optionsString = item.options ? JSON.stringify(item.options) : null;
        console.log('Options being saved:', optionsString); // Add logging

        return connection.execute(
          `INSERT INTO study_material_content 
          (study_material_id, item_id, item_number, term, definition, image,
           type, question, answer, options, original_term, original_definition) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            studyMaterialId,
            itemId,
            index + 1,
            item.term,
            item.definition,
            imageBuffer,
            item.type || 'multiple-choice', // Default to multiple-choice
            item.question || item.definition,
            item.answer || item.term,
            optionsString,
            item.original?.term || item.term,
            item.original?.definition || item.definition
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
      console.error("Error saving study material:", error);
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Error rolling back transaction:", rollbackError);
        }
      }
      res.status(500).json({ error: "Internal server error", details: error.message });
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
    const { studyMaterialId } = req.params;
    const { items } = req.body;
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Delete existing items
      await connection.query(
        'DELETE FROM study_material_content WHERE study_material_id = ?',
        [studyMaterialId]
      );

      // Insert updated items
      for (const item of items) {
        const itemId = nanoid();
        await connection.query(
          `INSERT INTO study_material_content 
           (study_material_id, item_id, item_number, term, definition, image, 
            question_type, ai_question, ai_answer, ai_options, original_term, original_definition) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            studyMaterialId,
            itemId,
            item.item_number,
            item.term,
            item.definition,
            item.image || null,
            item.type,
            item.definition, // ai_question
            item.term,      // ai_answer
            item.options ? JSON.stringify(item.options) : null,
            item.original?.term,
            item.original?.definition
          ]
        );
      }

      await connection.commit();
      res.json({ success: true, items });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error updating study material:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update study material',
        error: error.message
      });
    } finally {
      if (connection) connection.release();
    }
  },

  archiveStudyMaterial: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { studyMaterialId } = req.params;
      console.log("Archiving study material with ID:", studyMaterialId);

      // Update visibility to 1 (archived)
      await connection.execute(
        `UPDATE study_material_info
         SET status = 'archived'
          WHERE study_material_id = ?`,
        [studyMaterialId]
      );

      res.status(200).json({ message: "Study material archived successfully" });
    } catch (error) {
      console.error("Error archiving study material:", error);
      res.status(500).json({ error: "Internal server error", details: error });
    } finally {
      connection.release();
    }
  },

  getStudyMaterialById: async (req, res) => {
    const { studyMaterialId } = req.params;
    const connection = await pool.getConnection();
    
    try {
      // Get the main study material info
      const [infoRows] = await connection.query(
        `SELECT smi.*, 
                GROUP_CONCAT(smc.term SEPARATOR '|||') as terms,
                GROUP_CONCAT(smc.definition SEPARATOR '|||') as definitions,
                GROUP_CONCAT(smc.image SEPARATOR '|||') as images,
                GROUP_CONCAT(smc.item_number SEPARATOR '|||') as item_numbers,
                GROUP_CONCAT(smc.type SEPARATOR '|||') as types,
                GROUP_CONCAT(smc.question SEPARATOR '|||') as questions,
                GROUP_CONCAT(smc.answer SEPARATOR '|||') as answers,
                GROUP_CONCAT(smc.options SEPARATOR '|||') as all_options,
                GROUP_CONCAT(smc.original_term SEPARATOR '|||') as original_terms,
                GROUP_CONCAT(smc.original_definition SEPARATOR '|||') as original_definitions
         FROM study_material_info smi
         LEFT JOIN study_material_content smc ON smi.study_material_id = smc.study_material_id
         WHERE smi.study_material_id = ?
         GROUP BY smi.study_material_id`,
        [studyMaterialId]
      );

      if (infoRows.length === 0) {
        return res.status(404).json({ message: "Study material not found" });
      }

      const studyMaterial = infoRows[0];
      
      // Parse the items with new fields
      const terms = studyMaterial.terms ? studyMaterial.terms.split('|||') : [];
      const definitions = studyMaterial.definitions ? studyMaterial.definitions.split('|||') : [];
      const images = studyMaterial.images ? studyMaterial.images.split('|||') : [];
      const itemNumbers = studyMaterial.item_numbers ? studyMaterial.item_numbers.split('|||').map(Number) : [];
      const types = studyMaterial.types ? studyMaterial.types.split('|||') : [];
      const questions = studyMaterial.questions ? studyMaterial.questions.split('|||') : [];
      const answers = studyMaterial.answers ? studyMaterial.answers.split('|||') : [];
      const options = studyMaterial.all_options ? studyMaterial.all_options.split('|||').map(opt => {
        try {
          return opt ? JSON.parse(opt) : null;
        } catch (e) {
          console.error('Error parsing options:', opt);
          return null;
        }
      }) : [];
      const originalTerms = studyMaterial.original_terms ? studyMaterial.original_terms.split('|||') : [];
      const originalDefinitions = studyMaterial.original_definitions ? studyMaterial.original_definitions.split('|||') : [];

      // Construct the response with new fields
      const response = {
        title: studyMaterial.title,
        tags: JSON.parse(studyMaterial.tags || '[]'),
        total_items: studyMaterial.total_items,
        created_by: studyMaterial.created_by,
        created_by_id: studyMaterial.created_by_id,
        total_views: studyMaterial.total_views,
        created_at: studyMaterial.created_at,
        summary: studyMaterial.summary,
        items: terms.map((term, index) => {
          console.log(`Processing item ${index}:`, {
            term,
            type: types[index],
            options: options[index],
            answer: answers[index]
          });
          
          return {
            term,
            definition: definitions[index],
            image: images[index],
            item_number: itemNumbers[index],
            type: types[index] || 'multiple-choice',
            question: questions[index] || definitions[index],
            answer: answers[index] || term,
            options: options[index],
            original: {
              term: originalTerms[index] || term,
              definition: originalDefinitions[index] || definitions[index]
            }
          };
        })
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching study material:', error);
      res.status(500).json({ message: "Error fetching study material" });
    } finally {
      connection.release();
    }
  },

  getStudyMaterialByUser: async (req, res) => {
    let connection;
    const { created_by } = req.params;

    console.log('Fetching study materials for user:', created_by);

    try {
      connection = await pool.getConnection();
      console.log('Database connection established');

      // Test database connection
      const [testResult] = await connection.query('SELECT 1');
      console.log('Database connection test:', testResult);

      // Query study materials
      const [materials] = await connection.query(
        `SELECT 
          smi.*,
          GROUP_CONCAT(smc.term) as terms,
          GROUP_CONCAT(smc.definition) as definitions,
          GROUP_CONCAT(smc.item_number) as item_numbers,
          GROUP_CONCAT(smc.image) as images
        FROM study_material_info smi
        LEFT JOIN study_material_content smc ON smi.study_material_id = smc.study_material_id
        WHERE smi.created_by = ?
        GROUP BY smi.study_material_id`,
        [created_by]
      );

      console.log('Query result:', materials);

      // Transform the data
      const transformedMaterials = materials.map(material => ({
        study_material_id: material.study_material_id,
        title: material.title,
        tags: material.tags ? JSON.parse(material.tags) : [],
        summary: material.summary,
        total_items: material.total_items || 0,
        created_by: material.created_by,
        created_by_id: material.created_by_id,
        total_views: material.total_views || 0,
        created_at: material.created_at,
        updated_at: material.updated_at || material.created_at,
        visibility: material.visibility,
        items: material.terms ? material.terms.split(',').map((term, index) => ({
          term,
          definition: material.definitions.split(',')[index],
          item_number: parseInt(material.item_numbers.split(',')[index]),
          image: material.images ? material.images.split(',')[index] : null
        })) : []
      }));

      console.log('Transformed materials:', transformedMaterials);

      res.json(transformedMaterials);

    } catch (error) {
      console.error('Error in getStudyMaterialByUser:', error);
      res.status(500).json({
        error: 'Failed to fetch study materials',
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
        return res
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

  getMadeByFriends: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { userId } = req.params;
      console.log("Looking for study materials for user with ID:", userId);

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
      console.log("Friend IDs:", friendsQuery.map(row => row.friend_id));

      if (friendsQuery.length === 0) {
        return res.status(200).json([]);
      }

      // Extract friend IDs
      const friendIds = friendsQuery.map(row => row.friend_id);

      // Use IN clause with prepared statement
      const placeholders = friendIds.map(() => '?').join(',');

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
      console.log(`Query to execute: SELECT * FROM study_material_info WHERE created_by IN (${placeholders})`);
      console.log("With parameters:", friendIds);

      // Fetch study materials created by friends
      const [infoRows] = await connection.execute(
        `SELECT study_material_id, title, tags, total_items, created_by, total_views, created_at 
         FROM study_material_info 
         WHERE created_by_id IN (${placeholders})
         ORDER BY created_at DESC`,
        [...friendIds]
      );

      console.log(`Found ${infoRows.length} study materials from friends`);
      console.log("Created_by values:", infoRows.map(row => row.created_by));

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
            items: contentRows.map(item => ({
              term: item.term,
              definition: item.definition,
              image: item.image ? item.image.toString('base64') : null,
            })),
          };
        })
      );

      res.status(200).json(studyMaterials);

    } catch (error) {
      console.error("Error fetching study materials from friends:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    } finally {
      connection.release();
    }
  },

  getNonMatchingTags: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      let { username } = req.params;
      if (username.includes('%')) {
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
        .flatMap(row => JSON.parse(row.tags))
        .map(tag => tag.toLowerCase());

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
            tag => !userTags.includes(tag.toLowerCase())
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
            items: contentRows.map(item => ({
              term: item.term,
              definition: item.definition,
              image: item.image ? item.image.toString('base64') : null
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
        details: error.message
      });
    } finally {
      connection.release();
    }
  },
};

export default studyMaterialController;
