import express from "express";
import studyMaterialController from "../controller/StudyMaterialController.js";
import { pool } from "../config/db.js";
import { OpenAI } from "openai";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate summary using OpenAI
async function generateSummary(items) {
  try {
    console.log('Generating summary for items:', items);
    
    // Create a formatted string of all terms and definitions
    const content = items.map((item, index) => 
      `${index + 1}. Term: ${item.term}\nDefinition: ${item.definition}`
    ).join('\n\n');

    const prompt = `Create a single, complete sentence summary (5-8 words) that captures the relationship between these terms and definitions. The summary must be a grammatically complete sentence.

Rules:
- Use 5 to 8 words only
- Must be ONE complete sentence
- Must end with proper punctuation
- Focus on the relationship between the terms

Examples of good summaries:
- "AI networks enable intelligent information sharing worldwide."
- "Machine learning transforms data into useful knowledge."
- "Neural networks process information like human brains."

Terms and definitions to summarize:
${content}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a precise AI that generates concise, complete sentence summaries using 5-8 words. Each summary must be grammatically complete and end with proper punctuation.'
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ]
    });

    let summary = completion.choices[0].message.content.trim();
    console.log('Raw generated summary:', summary);

    // Clean up the summary
    summary = summary
      .replace(/["""]/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Count words
    const words = summary.split(/\s+/);
    
    if (words.length > 8) {
      // If too long, try to find a complete sentence break within the first 8 words
      const firstEightWords = words.slice(0, 8);
      const sentence = firstEightWords.join(' ');
      // Ensure it ends with punctuation
      summary = sentence.replace(/[.!?]?$/, '.');
    } else if (words.length < 5) {
      // If too short, request another summary
      console.log('Summary too short, generating new one');
      return generateSummary(items);
    }

    // Ensure the summary ends with punctuation
    if (!/[.!?]$/.test(summary)) {
      summary += '.';
    }

    console.log('Final summary:', summary);
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary');
  }
}

// Modified save endpoint to handle simple summary
router.post("/save", async (req, res) => {
  const { studyMaterialId, title, tags, totalItems, visibility, createdBy, items } = req.body;
  let connection;

  console.log('Save endpoint - Request body:', {
    studyMaterialId,
    title,
    tags,
    totalItems,
    visibility,
    createdBy,
    items
  });

  try {
    connection = await pool.getConnection();
    console.log('Database connection established');
    await connection.beginTransaction();
    console.log('Transaction started');

    // Generate summary using AI
    console.log('Generating summary for items:', items);
    const summary = await generateSummary(items);
    console.log('Generated summary:', summary);

    // Insert into study_material_info table
    console.log('Inserting into study_material_info');

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
        createdBy, // Using createdBy as created_by_id
        visibility || 0 // Default to 0 if visibility is not provided
      ]
    );

    console.log('Study material info insert result:', studyMaterialResult);

    // Insert items
    console.log('Inserting items:', items);
    for (const [index, item] of items.entries()) {
      await connection.query(
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
    }
    console.log('All items inserted successfully');

    await connection.commit();
    console.log('Transaction committed');

    res.status(201).json({
      message: 'Study material saved successfully',
      study_material_id: studyMaterialId,
      summary: summary
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
      stack: error.stack // Adding stack trace for better debugging
    });
  } finally {
    if (connection) {
      connection.release();
      console.log('Database connection released');
    }
  }
});

router.post('/increment-views/:studyMaterialId', studyMaterialController.incrementViews);

router.get("/get-by-study-material-id/:studyMaterialId", async (req, res) => {
  const { studyMaterialId } = req.params;
  let connection;

  console.log('Fetching study material with ID:', studyMaterialId);

  try {
    connection = await pool.getConnection();
    console.log('Database connection established for fetch');

    // Get study material details
    const [studyMaterial] = await connection.query(
      `SELECT * FROM study_material_info WHERE study_material_id = ?`,
      [studyMaterialId]
    );

    console.log('Raw study material data from DB:', studyMaterial[0]);

    if (!studyMaterial.length) {
      console.log('No study material found with ID:', studyMaterialId);
      return res.status(404).json({ error: "Study material not found" });
    }

    // Get content items with AI-generated content
    const [items] = await connection.query(
      `SELECT 
        term,
        definition,
        item_number,
        image,
        question_type,
        ai_question,
        ai_answer,
        ai_options,
        original_term,
        original_definition
      FROM study_material_content 
      WHERE study_material_id = ? 
      ORDER BY item_number`,
      [studyMaterialId]
    );

    console.log('Retrieved items from DB:', items);

    // Format items to include AI-generated content
    const formattedItems = items.map(item => {
      const baseItem = {
        term: item.term,
        definition: item.definition,
        item_number: item.item_number,
        image: item.image,
        type: item.question_type,
        question: item.ai_question,
        answer: item.ai_answer,
        original: {
          term: item.original_term || item.term,
          definition: item.original_definition || item.definition
        }
      };

      // Add options if they exist
      if (item.ai_options) {
        try {
          baseItem.options = JSON.parse(item.ai_options);
        } catch (e) {
          console.error('Error parsing options:', e);
        }
      }

      console.log('Formatted item:', baseItem);
      return baseItem;
    });

    // Construct response
    const response = {
      study_material_id: studyMaterial[0].study_material_id,
      title: studyMaterial[0].title,
      tags: JSON.parse(studyMaterial[0].tags || '[]'),
      summary: studyMaterial[0].summary || '',
      created_by: studyMaterial[0].created_by,
      created_by_id: studyMaterial[0].created_by_id,
      created_at: studyMaterial[0].created_at,
      visibility: studyMaterial[0].visibility,
      total_views: studyMaterial[0].total_views || 0,
      items: formattedItems
    };

    console.log('Sending response:', response);
    res.json(response);

  } catch (error) {
    console.error('Error in get-by-study-material-id:', error);
    res.status(500).json({
      error: 'Failed to fetch study material',
      details: error.message
    });
  } finally {
    if (connection) {
      connection.release();
      console.log('Database connection released after fetch');
    }
  }
});

router.get("/get-by-user/:created_by", studyMaterialController.getStudyMaterialByUser);
router.get("/get-recommended-for-you/:username", studyMaterialController.getRecommendedForYouCards);
router.get('/get-top-picks', studyMaterialController.getTopPicks);
router.get("/get-made-by-friends/:username", studyMaterialController.getMadeByFriends);
router.get("/discover/:username", studyMaterialController.getNonMatchingTags);

// Updated endpoint for updating study material content with better error handling
router.put("/update/:studyMaterialId", async (req, res) => {
  const { studyMaterialId } = req.params;
  const { items } = req.body;

  console.log('Update request received for study material:', studyMaterialId);
  console.log('Items to update:', JSON.stringify(items, null, 2));

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    console.log('Database connection established');

    // Get current items to verify the study material exists
    const [currentItems] = await connection.query(
      'SELECT * FROM study_material_content WHERE study_material_id = ? ORDER BY item_number',
      [studyMaterialId]
    );

    if (!currentItems.length) {
      console.log('Study material content not found:', studyMaterialId);
      throw new Error('Study material content not found');
    }

    // Update each item with AI-generated content
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const originalItem = currentItems[i];
      
      console.log('Processing item for update:', item);
      console.log('Original item:', originalItem);

      // Prepare the update data based on question type
      let updateData = {
        question_type: 'true-false', // Since we know it's true/false from the logs
        ai_question: item.definition, // The statement to evaluate
        ai_answer: item.term, // "True" or "False"
        ai_options: null,
        original_term: originalItem.term,
        original_definition: originalItem.definition
      };

      console.log('Update data prepared:', updateData);

      // Update the database
      await connection.query(
        `UPDATE study_material_content 
         SET 
           term = ?,
           definition = ?,
           question_type = ?,
           ai_question = ?,
           ai_answer = ?,
           ai_options = ?,
           original_term = ?,
           original_definition = ?
         WHERE study_material_id = ? AND item_number = ?`,
        [
          item.term, // "True" or "False"
          item.definition, // The statement
          updateData.question_type,
          updateData.ai_question,
          updateData.ai_answer,
          updateData.ai_options,
          updateData.original_term,
          updateData.original_definition,
          studyMaterialId,
          originalItem.item_number
        ]
      );
    }

    await connection.commit();
    console.log('Updates committed successfully');

    // Fetch the updated items
    const [updatedItems] = await connection.query(
      `SELECT 
        term,
        definition,
        item_number,
        image,
        question_type,
        ai_question,
        ai_answer,
        ai_options,
        original_term,
        original_definition
      FROM study_material_content 
      WHERE study_material_id = ? 
      ORDER BY item_number`,
      [studyMaterialId]
    );

    // Format the response
    const formattedItems = updatedItems.map(item => ({
      type: item.question_type,
      term: item.term,
      definition: item.definition,
      question: item.ai_question,
      answer: item.ai_answer,
      item_number: item.item_number,
      image: item.image,
      original: {
        term: item.original_term,
        definition: item.original_definition
      }
    }));

    console.log('Sending formatted response:', {
      study_material_id: studyMaterialId,
      items: formattedItems
    });

    res.json({
      study_material_id: studyMaterialId,
      items: formattedItems,
      originalItems: currentItems.map(item => ({
        term: item.term,
        definition: item.definition,
        item_number: item.item_number,
        image: item.image
      }))
    });

  } catch (error) {
    console.error('Error during update process:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(error.message.includes('Invalid') ? 400 : 500).json({
      error: error.message,
      details: error.stack
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;
