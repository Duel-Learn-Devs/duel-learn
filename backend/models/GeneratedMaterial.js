import { Model } from 'objection';

class GeneratedMaterial extends Model {
  static get tableName() {
    return 'generated_material';
  }

  
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['study_material_id', 'term', 'definition', 'question_type', 'question', 'answer', 'game_mode'],

      properties: {
        id: { type: 'integer' },
        study_material_id: { type: 'string' },
        item_id: { type: ['string', 'null'] },
        item_number: { type: ['integer', 'null'] },
        term: { type: 'string' },
        definition: { type: 'string' },
        image: { type: ['string', 'null'] },
        question_type: { type: 'string' },
        question: { type: 'string' },
        answer: { type: 'string' },
        choices: { type: ['string', 'null'] },
        game_mode: { type: 'string' }
      }
    };
  }

  // Utility to check if table exists and create if needed
  static async checkTableExists() {
    try {
      const { pool } = await import('../config/db.js');
      
      // Check if table exists
      const [tables] = await pool.query(
        `SHOW TABLES LIKE 'generated_material'`
      );
      
      if (tables.length === 0) {
        console.log("generated_material table does not exist - creating it");
        
        // Create table with updated unique constraint to include item_id
        await pool.query(`
          CREATE TABLE generated_material (
            id INT AUTO_INCREMENT PRIMARY KEY,
            study_material_id VARCHAR(255) NOT NULL,
            item_id VARCHAR(255),
            item_number INT,
            term VARCHAR(255) NOT NULL,
            definition TEXT NOT NULL,
            image VARCHAR(255),
            question_type VARCHAR(50) NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            choices TEXT DEFAULT NULL,
            game_mode VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX (study_material_id),
            INDEX (question_type),
            INDEX (game_mode),
            UNIQUE KEY unique_question (study_material_id, item_id, question_type, game_mode)
          )
        `);
        
        console.log("generated_material table created successfully");
      } else {
        console.log("generated_material table exists - updating constraints");
        
        // First check if there are any duplicate rows that would violate our unique constraint
        const [duplicates] = await pool.query(`
          SELECT study_material_id, item_id, question_type, game_mode, COUNT(*) as count
          FROM generated_material
          GROUP BY study_material_id, item_id, question_type, game_mode
          HAVING COUNT(*) > 1
        `);
        
        if (duplicates.length > 0) {
          console.log("Found duplicate entries that would violate the unique constraint - cleaning up...");
          
          // For each set of duplicates, keep only the newest one
          for (const dup of duplicates) {
            // Get all IDs for this combination, ordered by creation date (newest first)
            const [rows] = await pool.query(`
              SELECT id
              FROM generated_material
              WHERE study_material_id = ? AND item_id = ? AND question_type = ? AND game_mode = ?
              ORDER BY created_at DESC
            `, [dup.study_material_id, dup.item_id, dup.question_type, dup.game_mode]);
            
            // Keep the first one (newest), delete the rest
            if (rows.length > 1) {
              const keepId = rows[0].id;
              const deleteIds = rows.slice(1).map(r => r.id);
              
              console.log(`Keeping newest entry (ID: ${keepId}) and deleting ${deleteIds.length} duplicates`);
              
              await pool.query(`
                DELETE FROM generated_material
                WHERE id IN (?)
              `, [deleteIds]);
            }
          }
        }
        
        // Now try to drop any existing unique constraint
        try {
          await pool.query(`ALTER TABLE generated_material DROP INDEX unique_question`);
          console.log("Dropped existing unique_question constraint");
        } catch (error) {
          console.log("No existing unique_question constraint to drop");
        }

        // Add the new unique constraint
        try {
          await pool.query(`
            ALTER TABLE generated_material 
            ADD CONSTRAINT unique_question 
            UNIQUE (study_material_id, item_id, question_type, game_mode)
          `);
          console.log("Added new unique_question constraint");
        } catch (error) {
          console.error("Error adding unique constraint:", error);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error checking or creating table:", error);
      throw error;
    }
  }
}

export default GeneratedMaterial;