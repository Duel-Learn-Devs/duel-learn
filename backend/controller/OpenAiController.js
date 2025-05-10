import { OpenAI } from "openai";
import dotenv from "dotenv";
import GeneratedMaterial from "../models/GeneratedMaterial.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add this at the top of the file, after the openai initialization
let answerDistribution = { A: 0, B: 0, C: 0, D: 0 };
let trueFalseDistribution = { True: 0, False: 0 };

// Updated helper function to fetch item_id from study_material_content with corrected column names
const getItemIdFromStudyMaterial = async (studyMaterialId, term, itemNumber) => {
  try {
    if (!studyMaterialId || !term) {
      console.error('Missing required parameters:', { studyMaterialId, term });
      throw new Error('Missing required parameters: studyMaterialId and term');
    }

    const { pool } = await import('../config/db.js');

    let query = `
      SELECT item_id, item_number
      FROM study_material_content 
      WHERE study_material_id = ? 
      AND term = ?
    `;
    let params = [studyMaterialId, term];

    // If item_number is provided, add it to the query
    if (itemNumber !== undefined && itemNumber !== null) {
      query += ` AND item_number = ?`;
      params.push(itemNumber);
    }

    // Add ordering and limit
    query += ` ORDER BY item_number ASC LIMIT 1`;

    console.log('Executing query:', query, 'with params:', params);

    const [rows] = await pool.query(query, params);

    if (rows && rows.length > 0) {
      console.log('Found item:', rows[0]);
      return rows[0].item_id;
    }

    // If no exact match found, try without item_number
    if (itemNumber !== undefined && itemNumber !== null) {
      query = `
        SELECT item_id, item_number
        FROM study_material_content 
        WHERE study_material_id = ? 
        AND term = ?
        ORDER BY item_number ASC
        LIMIT 1
      `;
      params = [studyMaterialId, term];

      console.log('Retrying query without item_number:', query, 'with params:', params);

      const [retryRows] = await pool.query(query, params);

      if (retryRows && retryRows.length > 0) {
        console.log('Found item on retry:', retryRows[0]);
        return retryRows[0].item_id;
      }
    }

    console.error(`No item found for study_material_id: ${studyMaterialId}, term: ${term}, item_number: ${itemNumber}`);
    throw new Error('Item not found in study_material_content');
  } catch (error) {
    console.error('Error in getItemIdFromStudyMaterial:', error);
    throw error;
  }
};

// Helper function to store generated questions in the database
const storeGeneratedQuestions = async (studyMaterialId, term, definition, itemNumber, question, gameMode) => {
  try {
    if (!studyMaterialId || !term || !definition || !itemNumber) {
      console.error("Missing required parameters in storeGeneratedQuestions:", { studyMaterialId, term, definition, itemNumber });
      throw new Error('Missing required parameters');
    }

    // Use itemNumber as item_id if no match found
    let item_id;
    try {
      item_id = await getItemIdFromStudyMaterial(studyMaterialId, term, itemNumber);
    } catch (error) {
      console.warn('Could not find item_id, using itemNumber as fallback:', itemNumber);
      item_id = itemNumber;
    }

    // Format the choices if they exist
    let choicesString = null;
    if (question.options) {
      choicesString = JSON.stringify(question.options);
    }

    // Handle image if it exists
    let imageBuffer = null;
    if (question.image) {
      // Convert base64 to buffer if image exists
      const base64Data = question.image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    const { pool } = await import('../config/db.js');

    // Use REPLACE INTO to handle duplicates
    const insertQuery = `
      REPLACE INTO generated_material 
      (study_material_id, item_id, item_number, term, definition, image, 
       question_type, question, answer, choices, game_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      studyMaterialId,
      item_id,
      itemNumber,
      term,
      definition,
      imageBuffer,
      question.type || question.questionType || 'identification',
      question.question,
      question.answer || question.correctAnswer,
      choicesString,
      gameMode || "peaceful"
    ]);

    console.log(`Successfully stored question in generated_material:`, {
      study_material_id: studyMaterialId,
      item_id,
      item_number: itemNumber,
      term,
      question_type: question.type || question.questionType,
      game_mode: gameMode
    });

    return {
      success: true,
      data: {
        ...result,
        item_id,
        item_number: itemNumber
      }
    };
  } catch (error) {
    console.error('Error in storeGeneratedQuestions:', error);
    throw error;
  }
};

// Update the clearQuestionsForMaterial function
const clearQuestionsForMaterial = async (studyMaterialId, gameMode) => {
  try {
    const { pool } = await import("../config/db.js");

    console.log(
      `Clearing existing questions for study material ${studyMaterialId} and game mode ${gameMode}`
    );

    const [existingQuestions] = await pool.query(
      "SELECT id, item_number FROM generated_material WHERE study_material_id = ? AND game_mode = ?",
      [studyMaterialId, gameMode]
    );

    if (existingQuestions.length > 0) {
      const deleteQuery = `
        DELETE FROM generated_material 
        WHERE study_material_id = ? AND game_mode = ?
      `;

      const [result] = await pool.execute(deleteQuery, [
        studyMaterialId,
        gameMode,
      ]);
      console.log(`Cleared ${result.affectedRows} existing questions`);
    }

    return true;
  } catch (error) {
    console.error("Error clearing questions:", error);
    throw error;
  }
};

// Add this helper function at the top of the file
const getBalancedAnswerPosition = (currentDistribution, totalQuestions) => {
  // Initialize distribution if not provided
  const distribution = currentDistribution || { A: 0, B: 0, C: 0, D: 0 };

  // Calculate target distribution (roughly equal)
  const targetPerOption = Math.ceil(totalQuestions / 4);

  // Get available options that haven't exceeded target distribution
  const availableOptions = Object.entries(distribution)
    .filter(([_, count]) => count < targetPerOption)
    .map(([letter]) => letter);

  // If no available options, reset distribution
  if (availableOptions.length === 0) {
    return ["A", "B", "C", "D"][Math.floor(Math.random() * 4)];
  }

  // Randomly select from available options
  return availableOptions[Math.floor(Math.random() * availableOptions.length)];
};

// Add this helper function near getBalancedAnswerPosition
const getBalancedTrueFalseAnswer = (currentDistribution, totalQuestions) => {
  // Initialize distribution if not provided
  const distribution = currentDistribution || { True: 0, False: 0 };

  // Calculate target distribution (roughly equal)
  const targetPerOption = Math.ceil(totalQuestions / 2);

  // Get available options that haven't exceeded target distribution
  const availableOptions = Object.entries(distribution)
    .filter(([_, count]) => count < targetPerOption)
    .map(([answer]) => answer);

  // If no available options, reset distribution and pick randomly
  if (availableOptions.length === 0) {
    return Math.random() < 0.5 ? "True" : "False";
  }

  // Randomly select from available options
  return availableOptions[Math.floor(Math.random() * availableOptions.length)];
};

// Helper functions for question generation
const generateTrueFalseQuestionHelper = async (term, definition, context) => {
  try {
    const prompt = `
      Create a true/false question about the following term and its definition:
      Term: ${term}
      Definition: ${definition}

      Requirements:
      1. The question must incorporate both the term AND its definition
      2. If creating a false statement, modify the relationship between the term and definition
      3. Make the question challenging but clear
      4. Ensure the question tests understanding of both the term and its meaning
      5. Avoid overly simple questions that only test the term without its definition

      Format:
      Return a JSON object with:
      {
        "question": "your question here",
        "answer": "True" or "False",
        "explanation": "brief explanation of why the answer is true or false"
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI that generates educational true/false questions. Always return valid JSON."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const response = completion.choices[0].message.content;
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      throw new Error("Invalid response format from OpenAI");
    }

    // Validate the response has required fields
    if (!parsedResponse.question || !parsedResponse.answer) {
      throw new Error("Missing required fields in OpenAI response");
    }

    return {
      success: true,
      data: {
        type: "true-false",
        questionType: "true-false",
        question: parsedResponse.question,
        answer: parsedResponse.answer,
        correctAnswer: parsedResponse.answer,
        explanation: parsedResponse.explanation || ""
      }
    };
  } catch (error) {
    console.error("Error generating true/false question:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

const generateMultipleChoiceQuestionHelper = async (term, definition, context) => {
  try {
    const prompt = `
      Create a multiple-choice question about the following term and its definition:
      Term: ${term}
      Definition: ${definition}

      Requirements:
      1. The question must test understanding of the definition by asking which term it defines
      2. The question should be in the format: "Which term is defined as [definition]?"
      3. Generate EXACTLY 3 plausible but incorrect terms that are similar to "${term}" in length and style
      4. The term "${term}" MUST be one of the choices and MUST be the correct answer
      5. The incorrect options should be similar enough to create doubt but clearly wrong
      6. Do not create new terms that aren't related to the subject matter

      Format:
      Return a JSON object with:
      {
        "question": "Which term is defined as [definition]?",
        "options": ["${term}", "incorrect1", "incorrect2", "incorrect3"],
        "correctAnswer": "${term}",
        "explanation": "brief explanation of why this is the correct answer"
      }

      Note: The options array MUST include "${term}" as one of the choices, and it MUST be the correct answer.
      The other options should be similar to "${term}" in style and length to make them plausible distractors.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI that generates educational multiple-choice questions. Always return valid JSON. Always include the exact term as one of the options and as the correct answer."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      throw new Error("Invalid response format from OpenAI");
    }

    // Validate the response has required fields
    if (!parsedResponse.question || !parsedResponse.options || !parsedResponse.correctAnswer) {
      throw new Error("Missing required fields in OpenAI response");
    }

    // Validate options array
    if (!Array.isArray(parsedResponse.options) || parsedResponse.options.length !== 4) {
      throw new Error("Invalid options format in OpenAI response");
    }

    // Validate that the term is included in the options and is the correct answer
    if (!parsedResponse.options.includes(term)) {
      console.log("Term not found in options, fixing the options array");
      // Replace a random option with the term if it's not included
      const randomIndex = Math.floor(Math.random() * 4);
      parsedResponse.options[randomIndex] = term;
    }

    // Ensure the correct answer is the term
    parsedResponse.correctAnswer = term;

    // Shuffle the options to randomize the position of the correct answer
    const shuffledOptions = [...parsedResponse.options];
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    return {
      success: true,
      data: {
        type: "multiple-choice",
        questionType: "multiple-choice",
        question: parsedResponse.question,
        options: shuffledOptions,
        answer: term,
        correctAnswer: term,
        explanation: parsedResponse.explanation || ""
      }
    };
  } catch (error) {
    console.error("Error generating multiple-choice question:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

const generateIdentificationQuestionHelper = async (term, definition, context) => {
  try {
    const prompt = `
      Create an identification question about the following term and its definition:
      Term: ${term}
      Definition: ${definition}

      Requirements:
      1. The question must test understanding of both the term AND its definition
      2. Make the question clear and specific
      3. Ensure the answer can be derived from understanding the term and definition
      4. The answer should be the term itself

      Format:
      Return a JSON object with:
      {
        "question": "your question here",
        "answer": "${term}",
        "explanation": "brief explanation of why this is the correct answer"
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI that generates educational identification questions. Always return valid JSON."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const response = completion.choices[0].message.content;
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      throw new Error("Invalid response format from OpenAI");
    }

    // Validate the response has required fields
    if (!parsedResponse.question || !parsedResponse.answer) {
      throw new Error("Missing required fields in OpenAI response");
    }

    return {
      success: true,
      data: {
        type: "identification",
        questionType: "identification",
        question: parsedResponse.question,
        answer: parsedResponse.answer,
        correctAnswer: parsedResponse.answer,
        explanation: parsedResponse.explanation || ""
      }
    };
  } catch (error) {
    console.error("Error generating identification question:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Route handlers that use the helper functions
const generateTrueFalse = async (req, res) => {
  try {
    const { term, definition, studyMaterialId, itemNumber, gameMode } = req.body;

    if (!term || !definition || !studyMaterialId || !itemNumber) {
      console.error('Missing required parameters:', { term, definition, studyMaterialId, itemNumber });
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
        data: null
      });
    }

    console.log("Generating true/false question for:", { term, definition, studyMaterialId, itemNumber });

    try {
      const result = await generateTrueFalseQuestionHelper(term, definition, studyMaterialId, itemNumber);

      if (!result.success) {
        console.error("Failed to generate true/false question:", result.error);
        return res.status(500).json({
          success: false,
          error: result.error,
          data: null
        });
      }

      // Store the generated question
      const storeResult = await storeGeneratedQuestions(
        studyMaterialId,
        term,
        definition,
        itemNumber,
        result.data,
        gameMode || 'peaceful'
      );

      console.log("Successfully generated and stored true/false question");

      // Return the question data in an array as expected by the frontend
      return res.json([{
        ...result.data,
        ...storeResult.data,
        type: 'true-false',
        questionType: 'true-false'
      }]);

    } catch (generationError) {
      console.error("Error generating true/false question:", generationError);
      return res.status(500).json({
        success: false,
        error: generationError.message || "Failed to generate true/false question",
        data: null
      });
    }
  } catch (error) {
    console.error("Error in generateTrueFalse:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      data: null
    });
  }
};

const generateMultipleChoice = async (req, res) => {
  try {
    const { term, definition, studyMaterialId, itemNumber, gameMode } = req.body;

    if (!term || !definition || !studyMaterialId || !itemNumber) {
      console.error('Missing required parameters:', { term, definition, studyMaterialId, itemNumber });
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
        data: null
      });
    }

    console.log("Generating multiple-choice question for:", { term, definition, studyMaterialId, itemNumber });

    try {
      const result = await generateMultipleChoiceQuestionHelper(term, definition, studyMaterialId, itemNumber);

      if (!result.success) {
        console.error("Failed to generate multiple-choice question:", result.error);
        return res.status(500).json({
          success: false,
          error: result.error,
          data: null
        });
      }

      // Store the generated question
      const storeResult = await storeGeneratedQuestions(
        studyMaterialId,
        term,
        definition,
        itemNumber,
        result.data,
        gameMode || 'peaceful'
      );

      console.log("Successfully generated and stored multiple-choice question");

      // Return the question data in an array as expected by the frontend
      return res.json([{
        ...result.data,
        ...storeResult.data,
        type: 'multiple-choice',
        questionType: 'multiple-choice'
      }]);

    } catch (generationError) {
      console.error("Error generating multiple-choice question:", generationError);
      return res.status(500).json({
        success: false,
        error: generationError.message || "Failed to generate multiple-choice question",
        data: null
      });
    }
  } catch (error) {
    console.error("Error in generateMultipleChoice:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      data: null
    });
  }
};

const generateIdentification = async (req, res) => {
  try {
    const { term, definition, studyMaterialId, itemNumber, gameMode } = req.body;

    if (!term || !definition || !studyMaterialId || !itemNumber) {
      console.error('Missing required parameters:', { term, definition, studyMaterialId, itemNumber });
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
        data: null
      });
    }

    console.log("Generating identification question for:", { term, definition, studyMaterialId, itemNumber });

    try {
      const result = await generateIdentificationQuestionHelper(term, definition, studyMaterialId, itemNumber);

      if (!result.success) {
        console.error("Failed to generate identification question:", result.error);
        return res.status(500).json({
          success: false,
          error: result.error,
          data: null
        });
      }

      // Store the generated question
      const storeResult = await storeGeneratedQuestions(
        studyMaterialId,
        term,
        definition,
        itemNumber,
        result.data,
        gameMode || 'peaceful'
      );

      console.log("Successfully generated and stored identification question");

      // Return the question data in an array as expected by the frontend
      return res.json([{
        ...result.data,
        ...storeResult.data,
        type: 'identification',
        questionType: 'identification'
      }]);

    } catch (generationError) {
      console.error("Error generating identification question:", generationError);
      return res.status(500).json({
        success: false,
        error: generationError.message || "Failed to generate identification question",
        data: null
      });
    }
  } catch (error) {
    console.error("Error in generateIdentification:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      data: null
    });
  }
};

const shouldGenerateNewSummary = async (studyMaterialId, newContent) => {
  try {
    const { pool } = await import("../config/db.js");

    // Get the current material's content and summary
    const [currentMaterial] = await pool.query(
      `SELECT title, tags, summary, content_hash 
       FROM study_material_info 
       WHERE study_material_id = ?`,
      [studyMaterialId]
    );

    if (!currentMaterial || currentMaterial.length === 0) {
      console.log("No existing material found, generating new summary");
      return true;
    }

    const existingMaterial = currentMaterial[0];

    // Rule 1: If title or tags have changed, always generate new summary
    const existingTags = JSON.parse(existingMaterial.tags || "[]").sort();
    const newTags = newContent.tags.sort();
    const titleChanged = existingMaterial.title !== newContent.title;
    const tagsChanged =
      JSON.stringify(existingTags) !== JSON.stringify(newTags);

    if (titleChanged || tagsChanged) {
      console.log("Title or tags changed, generating new summary");
      return true;
    }

    // Rule 2: For term and definition changes, check if they impact the current summary
    const [currentContent] = await pool.query(
      `SELECT term, definition 
       FROM study_material_content 
       WHERE study_material_id = ? 
       ORDER BY term`,
      [studyMaterialId]
    );

    // If number of items changed significantly (more than 20%), generate new summary
    const itemCountChange = Math.abs(
      currentContent.length - newContent.items.length
    );
    const significantItemChange = itemCountChange > currentContent.length * 0.2;

    if (significantItemChange) {
      console.log(
        "Significant change in number of items, generating new summary"
      );
      return true;
    }

    // Calculate content hash for the new content
    const newContentHash = calculateContentHash(newContent.items);

    // If content hash matches, no need for new summary
    if (existingMaterial.content_hash === newContentHash) {
      console.log("Content hash matches, reusing existing summary");
      return false;
    }

    // If we have an existing summary, check if it still applies to the content changes
    if (existingMaterial.summary) {
      const prompt = `
        Analyze if this summary still accurately represents the updated study material.
        Only recommend a new summary if the changes significantly alter the core concepts or themes.
        Minor wording changes or clarifications should not trigger a new summary.
        
        Current Summary: "${existingMaterial.summary}"
        
        Updated Material:
        Title: "${newContent.title}"
        Tags: ${JSON.stringify(newTags)}
        Items: ${JSON.stringify(
        newContent.items.map((item) => ({
          term: item.term,
          definition: item.definition,
        }))
      )}
        
        Return a JSON object with:
        {
          "stillApplies": boolean,
          "reason": "brief explanation"
        }
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at analyzing if summaries still accurately represent updated content. Be lenient with minor changes and only recommend new summaries when core concepts or themes are significantly altered.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      });

      const response = JSON.parse(completion.choices[0].message.content);

      if (response.stillApplies) {
        console.log("Existing summary still applies:", response.reason);
        return false;
      }

      console.log("Existing summary no longer applies:", response.reason);
      return true;
    }

    // If we get here, content is identical or changes are minor
    console.log(
      "Content unchanged or changes are minor, reusing existing summary"
    );
    return false;
  } catch (error) {
    console.error("Error in shouldGenerateNewSummary:", error);
    // On error, generate new summary to be safe
    return true;
  }
};

// Helper function to calculate content hash
const calculateContentHash = (items) => {
  // Sort items by term to ensure consistent hashing
  const sortedItems = [...items].sort((a, b) => a.term.localeCompare(b.term));

  // Create a string representation of the content
  const contentString = sortedItems
    .map((item) => `${item.term}:${item.definition}`)
    .join("|");

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return hash.toString(16);
};

export const OpenAiController = {
  generateSummary: async (req, res) => {
    try {
      const { tags, items, studyMaterialId } = req.body;

      console.log("Received summary generation request with data:", {
        tagCount: tags?.length || 0,
        itemCount: items?.length || 0,
        studyMaterialId,
      });

      if (!items || !Array.isArray(items) || items.length === 0) {
        console.log("Invalid items data received:", items);
        return res.status(400).json({
          error: "Invalid items data",
          message: "Please provide at least one item with term and definition",
        });
      }

      // Check if we need to generate a new summary
      const needsNewSummary = await shouldGenerateNewSummary(studyMaterialId, {
        title: req.body.title || "",
        tags: tags || [],
        items: items,
      });

      if (!needsNewSummary) {
        // Get the existing summary
        const { pool } = await import("../config/db.js");
        const [currentMaterial] = await pool.query(
          `SELECT summary FROM study_material_info WHERE study_material_id = ?`,
          [studyMaterialId]
        );

        if (
          currentMaterial &&
          currentMaterial.length > 0 &&
          currentMaterial[0].summary
        ) {
          console.log("Reusing existing summary");
          return res.json({ summary: currentMaterial[0].summary });
        }
      }

      const prompt = `Generate a concise overview-style summary (maximum 500 characters) for the following study material. Focus on describing the content that is actually present in the material:

      Tags: ${tags ? tags.join(", ") : "No tags"}  
      Items: ${items
          .map((item) => `${item.term}: ${item.definition}`)
          .join("\n")}  

      Rules:
      1. CRITICAL: Keep the entire summary not more than 500 characters (including spaces and line breaks)
      2. Write in a clear, concise style that maximizes information in limited space
      3. Create a focused overview that:
        - Introduces the core subject matter
        - Highlights 2-3 key themes or concepts
        - Gives a quick preview of what to expect based on the terms and definitions provided
        - Don't include terminologies or sentences that are not explicitly defined in the material
        - No need to include application if not necessary
        - Focus on what the material includes, not what it can teach you because it will be too out of scope
      4. Format efficiently:
        - Use 1-2 short paragraphs maximum
        - Double line breaks ("\\n\\n") between paragraphs
        - Keep sentences brief but informative
      5. Prioritize content:
        - Focus on the most important themes
        - Mention only the most representative terms
        - Skip minor details
      6. Make every character count while maintaining readability
      7. Avoid making assumptions about what the material can teach you
      8. Avoid overgeneralizing the material, and strictly use the definitions and terms provided
      9. Use a "In this material, ..." kind of sentence to start the summary

      Example for reference:
      
      Java is a programming language that is used to create applications for the web.
      
      Then, summary should not include terms that are out of the scope of the material. Like, "Users will learn how to code in Java" or "Users will learn how to create applications for the web".

      IMPORTANT: The 500-character limit is strict - responses exceeding this will be truncated.`;

      console.log("Calling OpenAI API...");

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an AI that generates concise, accurate summaries of educational content.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 100, // Increased from 50 to 200 to allow for longer summaries
        });

        const summary = completion.choices[0].message.content.trim();
        console.log("Generated summary:", summary);

        // Update the material with the new summary
        if (studyMaterialId) {
          const { pool } = await import("../config/db.js");
          await pool.query(
            `UPDATE study_material_info 
             SET summary = ? 
             WHERE study_material_id = ?`,
            [summary, studyMaterialId]
          );
        }

        res.json({ summary });
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError.message);

        // Fallback: generate a simple summary if OpenAI fails
        let fallbackSummary = "";
        if (tags && tags.length > 0) {
          fallbackSummary = `Study guide on ${tags[0]}`;
        } else if (items && items.length > 0) {
          fallbackSummary = `Notes on ${items[0].term}`;
        } else {
          fallbackSummary = "Study material collection";
        }

        console.log("Using fallback summary:", fallbackSummary);
        res.json({
          summary: fallbackSummary,
          note: "Generated as fallback due to API error",
        });
      }
    } catch (error) {
      console.error("Error in generate-summary route:", error);
      res.status(500).json({
        error: "Failed to generate summary",
        message: "An error occurred while generating the summary",
        details: error.message,
      });
    }
  },
  generateTrueFalse,
  generateMultipleChoice,
  generateIdentification,

  // New method for cross-referencing definitions
  crossReferenceDefinition: async (req, res) => {
    try {
      console.log("Received cross-reference request");
      const { term, definition, tags } = req.body;

      if (!term || !definition) {
        console.log("Missing required parameters");
        return res.status(400).json({
          error: "Missing required parameters",
          message: "Both term and definition are required",
        });
      }

      // Validate definition has enough content to check
      if (definition.trim().split(/\s+/).length < 5) {
        console.log("Definition too short for meaningful cross-reference");
        return res.status(400).json({
          error: "Definition too vague",
          message:
            "Please provide a more detailed definition for effective fact-checking",
        });
      }

      console.log(`Cross-referencing term: "${term}" with definition and tags:`, tags);

      const prompt = `Please fact-check this definition for the term "${term}" with a very precise approach:
      
Definition: "${definition}"
Tags: ${tags ? JSON.stringify(tags) : "[]"}

Instructions:
1. Use the provided tags as context to understand the domain and subject matter.
2. Be precise in identifying incorrect facts, especially for domain-specific terms.
3. Pay special attention to crucial keywords that define the term's meaning.
4. Check for both:
   - Incorrect words/phrases that need correction
   - Missing crucial keywords that should be added
5. Only flag individual words or short phrases that are factually wrong.
6. Do not suggest rewriting the entire definition - ONLY identify specific issues.
7. Make sure the definition doesn't include the term itself - if it does, flag this circular reference.
8. Consider the domain context from tags when evaluating accuracy.
9. Be stricter with domain-specific terminology and concepts.
10. For missing keywords, provide the complete definition with the keyword added in the correct position.
11. Should not exceed 200 characters for the response.

Respond with JSON in this exact format:
{
  "isAccurate": boolean,
  "accuracyScore": number (0-100),
  "assessment": "brief assessment, mention it's just checking for definitively wrong facts",
  "incorrectParts": ["specific word/phrase that is wrong", "another specific word/phrase"] (empty array if nothing is definitively wrong),
  "suggestedCorrections": ["replacement for first part", "replacement for second part"] (empty array if nothing to correct),
  "missingKeywords": ["crucial missing keyword 1", "crucial missing keyword 2"] (empty array if no crucial keywords are missing),
  "suggestedAdditions": ["complete definition with first keyword added", "complete definition with second keyword added"] (empty array if no additions needed)
}

Assessment criteria:
- "Accurate" (90-100): Definition is factually correct, includes all crucial keywords, and aligns with domain knowledge
- "Partially Accurate" (70-89): Definition has minor issues or is missing some crucial keywords but is mostly correct
- "Inaccurate" (<70): Definition contains significant factual errors or is missing essential keywords

Important: 
- SPECIFIC WORDS ONLY - Do not flag whole sentences, only the exact words that need changing
- Different phrasings, styles, or levels of detail are all acceptable
- Focus on factual correctness and completeness of crucial keywords
- If the definition is technically incomplete but not wrong, still mark it as accurate
- If the definition is too vague to assess, set isAccurate to null
- If the definition contains the term itself (e.g., "A dog is a dog that..."), flag this circular reference
- Use the tags to understand the domain context and be more precise in fact-checking
- Pay special attention to identifying missing crucial keywords that are essential to the term's definition
- For missing keywords, provide the complete definition with the keyword added in the correct position, not just the position instruction`;

      console.log("Calling OpenAI for cross-reference assessment");
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a precise fact-checker who uses domain context to identify incorrect information and missing crucial keywords. You focus on specific words or short phrases that are factually wrong and identify essential keywords that are missing. When suggesting additions for missing keywords, provide the complete definition with the keyword added in the correct position, not just the position instruction. For example, if the definition is 'Is the process by plants convert light into chemical energy stored in glucose' and it's missing 'by absorbing carbon dioxide and releasing oxygen', provide the complete definition: 'Is the process by plants convert light into chemical energy stored in glucose by absorbing carbon dioxide and releasing oxygen'.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      });

      const text = completion.choices[0].message.content;
      console.log("AI response for cross-reference received");

      // Remove any Markdown formatting from the response and parse JSON
      const cleanedText = text.replace(/```json|```/g, "").trim();

      try {
        console.log("Parsing AI response");
        const assessment = JSON.parse(cleanedText);

        // If the definition is too vague for assessment
        if (assessment.isAccurate === null) {
          return res.status(400).json({
            error: "Definition too vague",
            message:
              assessment.assessment ||
              "The definition lacks sufficient detail for assessment",
          });
        }

        console.log("Cross-reference assessment:", assessment);
        res.json(assessment);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        res.status(500).json({
          error: "Failed to process AI response",
          message: "The AI response could not be properly interpreted",
        });
      }
    } catch (error) {
      console.error("Error in cross-reference-definition route:", error);
      res.status(500).json({
        error: "Failed to cross-reference definition",
        message: "An error occurred during the cross-reference process",
        details: error.message,
      });
    }
  },

  // New function to save session results and ensure questions are stored
  saveSessionResults: async (req, res) => {
    try {
      console.log("=== SAVE SESSION RESULTS - START ===");
      console.log("Received session results request body:", req.body);

      const {
        studyMaterialId,
        timeSpent,
        correctCount,
        incorrectCount,
        mode,
        highestStreak,
        masteredCount,
        unmasteredCount,
        questions,
        items,
      } = req.body;

      // Normalize the game mode to ensure consistent format
      // Convert to lowercase and replace spaces with hyphens for consistency
      let gameMode = mode
        ? mode.toLowerCase().replace(/\s+/g, "-")
        : "peaceful";

      // Special handling for "Time Pressured" mode
      if (gameMode === "time-pressured" || gameMode === "time-pressure") {
        gameMode = "time-pressured";
      } else if (gameMode === "peaceful") {
        gameMode = "peaceful";
      }

      console.log("Game mode normalization:", {
        original: mode,
        normalized: gameMode,
      });

      console.log("Extracted data:", {
        studyMaterialId,
        timeSpent,
        correctCount,
        incorrectCount,
        mode,
        gameMode,
        highestStreak,
        masteredCount,
        unmasteredCount,
        questionsCount: questions?.length || 0,
        itemsCount: items?.length || 0,
      });

      if (!studyMaterialId) {
        console.error("Missing studyMaterialId in request");
        return res.status(400).json({
          success: false,
          error: "Missing studyMaterialId",
        });
      }

      // Check if we have questions to store
      if (Array.isArray(questions) && questions.length > 0) {
        console.log(`Processing ${questions.length} questions for storage`);

        // Log question types to help with debugging
        const questionTypes = questions
          .map((q) => q.type || q.questionType)
          .filter(Boolean);
        const typeCounts = questionTypes.reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        console.log("Question types in payload:", typeCounts);

        // First declaration (keep this one)
        const identificationQuestions = questions.filter(
          (q) =>
            q.type === "identification" ||
            q.questionType === "identification" ||
            q.question_type === "identification"
        );

        console.log(
          `Found ${identificationQuestions.length} identification questions in request`);
        if (identificationQuestions.length > 0) {
          console.log(
            "Identification question samples:",
            identificationQuestions.map((q) => ({
              type: q.type,
              questionType: q.questionType,
              question_type: q.question_type,
              term: q.itemInfo?.term || "unknown",
              question: q.question,
              answer: q.answer || q.correctAnswer,
            }))
          );
        }

        // Create items from itemInfo if items are not provided
        const providedItems = items || [];
        const processedItems =
          providedItems.length > 0
            ? providedItems
            : questions.map((q, index) => {
              // First try to get item from itemInfo
              if (q.itemInfo && q.itemInfo.term && q.itemInfo.definition) {
                console.log(
                  `Creating item from question ${index + 1} itemInfo:`,
                  q.itemInfo
                );
                return {
                  id: q.itemInfo.itemId || index + 1,
                  term: q.itemInfo.term,
                  definition: q.itemInfo.definition,
                };
              } else {
                // Fall back to creating from question fields
                const item = {
                  id: index + 1,
                  term: q.correctAnswer || q.answer || `Item ${index + 1}`,
                  definition: q.question || `Definition ${index + 1}`,
                };
                console.log(`Created dummy item ${index + 1}:`, item);
                return item;
              }
            });

        console.log(`Processed ${processedItems.length} items for storage`);

        // Filter out duplicate questions (same term and question type)
        const uniqueQuestions = [];
        const seenKeys = new Set(); // Track unique term + question_type combinations

        console.log("Filtering questions to ensure uniqueness...");

        for (const question of questions) {
          const term =
            question.itemInfo?.term ||
            question.correctAnswer ||
            question.answer;
          const questionType = question.type || question.questionType;

          // Create a unique key for this term and question type
          const key = `${term}:${questionType}`;

          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueQuestions.push(question);
            console.log(
              `✓ Added question for term "${term}" of type ${questionType}`
            );
          } else {
            console.log(
              `✗ Filtering out duplicate question for term "${term}" of type ${questionType}`
            );
          }
        }

        console.log(
          `Filtered questions: ${questions.length} -> ${uniqueQuestions.length}`
        );
        console.log(`Unique term+type combinations: ${seenKeys.size}`);

        // Right before calling storeGeneratedQuestions, check the items format
        console.log(
          "Items before storage:",
          items.map((item) => ({
            id: item.id,
            term: item.term,
            definition: item.definition,
          }))
        );

        // Store the questions
        try {
          console.log("Calling storeGeneratedQuestions with:", {
            studyMaterialId,
            processedItemsCount: processedItems.length,
            questionsCount: uniqueQuestions.length,
            gameMode,
          });

          await storeGeneratedQuestions(
            studyMaterialId,
            processedItems,
            uniqueQuestions,
            gameMode
          );
          console.log(
            `Successfully stored ${uniqueQuestions.length} questions for study material ${studyMaterialId} with game mode ${gameMode}`
          );
        } catch (storeError) {
          console.error(
            "Error storing questions from session results:",
            storeError
          );
          console.error("Error details:", {
            message: storeError.message,
            stack: storeError.stack,
          });
        }

        // Change the second declaration to use a different variable name
        const identificationQuestionsForDebug = questions.filter(
          (q) =>
            q.type === "identification" || q.questionType === "identification"
        );

        if (identificationQuestionsForDebug.length > 0) {
          console.log("=== IDENTIFICATION QUESTION DEBUG ===");
          console.log(
            `Found ${identificationQuestionsForDebug.length} identification questions`
          );

          // For each identification question, try to store it directly
          for (let i = 0; i < identificationQuestionsForDebug.length; i++) {
            const q = identificationQuestionsForDebug[i];

            // Extract all relevant data
            const term =
              q.itemInfo?.term || q.correctAnswer || q.answer || "Unknown Term";
            const definition =
              q.itemInfo?.definition || q.question || "Unknown Definition";
            const question = q.question || "Unknown Question";
            const answer = q.correctAnswer || q.answer || term;

            console.log(`Identification question ${i + 1}:`);
            console.log(` - Term: ${term}`);
            console.log(` - Definition: ${definition}`);
            console.log(` - Question: ${question}`);
            console.log(` - Answer: ${answer}`);

            try {
              const { pool } = await import("../config/db.js");

              // Fetch the actual item_id from study_material_content with enhanced debugging
              console.log(
                `Looking up content for identification question ${i + 1
                } with term "${term}"`
              );
              const contentItem = await getItemIdFromStudyMaterial(
                studyMaterialId,
                term,
                i + 1
              );
              let actualItemId, actualItemNumber;

              if (contentItem && contentItem.itemId) {
                actualItemId = contentItem.itemId; // Keep as string
                actualItemNumber = contentItem.itemNumber;
                console.log(
                  `✅ SUCCESS: Using actual item_id ${actualItemId} (type: ${typeof actualItemId}) from study_material_content for term "${term}"`
                );
              } else {
                console.warn(
                  `❌ FAILURE: Couldn't find item_id in study_material_content for term "${term}"`
                );
                actualItemId = q.itemInfo?.itemId || String(i + 1); // Use fallback but ensure it's not study_material_id
                actualItemNumber = q.itemInfo?.itemNumber || i + 1;

                // Make sure actualItemId isn't accidentally the study_material_id
                if (actualItemId === studyMaterialId) {
                  console.warn(
                    `⚠️ Detected item_id same as study_material_id. Using fallback ID instead.`
                  );
                  actualItemId = `item_${i + 1}`;
                }
              }

              console.log(
                `Using item_id ${actualItemId} and item_number ${actualItemNumber} for identification question ${i + 1
                }`
              );

              // Try simple manual insertion
              const directInsertQuery = `
                INSERT INTO generated_material 
                (study_material_id, item_id, item_number, term, definition, question_type, question, answer, game_mode) 
                VALUES (?, ?, ?, ?, ?, 'identification', ?, ?, ?)
              `;

              const directInsertValues = [
                studyMaterialId,
                actualItemId, // Use the properly fetched item_id
                actualItemNumber,
                term,
                definition,
                question,
                answer,
                "peaceful",
              ];

              console.log(
                `Executing direct insert for identification question ${i + 1
                }...`
              );
              console.log(`Direct insert values:`, directInsertValues);

              try {
                const [directResult] = await pool.execute(
                  directInsertQuery,
                  directInsertValues
                );
                console.log(`Direct insertion result:`, directResult);

                if (directResult.affectedRows > 0) {
                  console.log(
                    `✅ Successfully inserted identification question ${i + 1
                    } directly`
                  );
                } else {
                  console.warn(
                    `⚠️ Direct insertion affected 0 rows for identification question ${i + 1
                    }`
                  );
                }
              } catch (directError) {
                console.error(`❌ Error with direct insertion:`, directError);

                // Try update if insert failed
                try {
                  const updateQuery = `
                    UPDATE generated_material 
                    SET definition = ?, question = ?, answer = ?
                    WHERE study_material_id = ? AND term = ? AND question_type = 'identification' AND game_mode = 'peaceful'
                  `;

                  const updateValues = [
                    definition,
                    question,
                    answer,
                    studyMaterialId,
                    term,
                  ];

                  const [updateResult] = await pool.execute(
                    updateQuery,
                    updateValues
                  );
                  console.log(`Update result:`, updateResult);

                  if (updateResult.affectedRows > 0) {
                    console.log(
                      `✅ Successfully updated identification question ${i + 1}`
                    );
                  } else {
                    console.warn(
                      `⚠️ Update affected 0 rows for identification question ${i + 1
                      }`
                    );
                  }
                } catch (updateError) {
                  console.error(`❌ Error with update:`, updateError);
                }
              }

              // Verify by query
              const [verifyResult] = await pool.query(
                `SELECT * FROM generated_material WHERE study_material_id = ? AND term = ? AND question_type = 'identification'`,
                [studyMaterialId, term]
              );

              if (verifyResult && verifyResult.length > 0) {
                console.log(
                  `✅ Verification found identification question in DB:`,
                  verifyResult[0]
                );
              } else {
                console.error(
                  `❌ Verification FAILED for identification question ${i + 1}`
                );
              }
            } catch (manualError) {
              console.error(
                `Critical error with manual insertion:`,
                manualError
              );
            }
          }
        }
      } else {
        console.log("No questions to store in session results");
      }

      // Here you could also save other session statistics to a different table if needed
      console.log("=== SAVE SESSION RESULTS - COMPLETE ===");
      res.status(200).json({
        success: true,
        message: "Session results saved successfully",
        studyMaterialId,
      });
    } catch (error) {
      console.error("=== SAVE SESSION RESULTS - ERROR ===");
      console.error("Error saving session results:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        success: false,
        error: "Failed to save session results",
        details: error.message,
      });
    }
  },

  // Function to clear all questions for a study material
  clearQuestionsForMaterial: async (req, res) => {
    try {
      const studyMaterialId = req.params.studyMaterialId;
      const gameMode = req.query.gameMode;

      if (!gameMode) {
        return res.status(400).json({
          success: false,
          error: "Game mode is required",
        });
      }

      // Normalize game mode to lowercase for consistent storage
      const normalizedGameMode = gameMode.toLowerCase().trim();

      console.log(
        `Clearing questions for study material ${studyMaterialId} in ${normalizedGameMode} mode`
      );

      // Use direct database connection with the pool
      const { pool } = await import("../config/db.js");

      // Get count of existing questions first
      const [countResult] = await pool.query(
        "SELECT COUNT(*) as count FROM generated_material WHERE study_material_id = ? AND game_mode = ?",
        [studyMaterialId, normalizedGameMode]
      );

      const questionCount = countResult[0]?.count || 0;
      console.log(`Found ${questionCount} questions to delete`);

      // Delete questions for specific study material AND game mode
      const [deleteResult] = await pool.query(
        "DELETE FROM generated_material WHERE study_material_id = ? AND game_mode = ?",
        [studyMaterialId, normalizedGameMode]
      );

      console.log(
        `Cleared ${deleteResult.affectedRows} questions for ${normalizedGameMode} mode`
      );

      return res.json({
        success: true,
        message: `Successfully cleared questions for study material ${studyMaterialId}`,
        count: deleteResult.affectedRows,
      });
    } catch (error) {
      console.error("Error clearing questions:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to clear questions",
        details: error.message,
      });
    }
  },

  // Update the save function to handle duplicates
  saveGeneratedQuestion: async (
    studyMaterialId,
    itemId,
    itemNumber,
    term,
    definition,
    type,
    question,
    answer,
    gameMode
  ) => {
    try {
      // First try to delete any existing question with the same key combination
      const deleteQuery = `
        DELETE FROM generated_material 
        WHERE study_material_id = ? 
        AND term = ? 
        AND question_type = ? 
        AND game_mode = ?
      `;

      await pool.query(deleteQuery, [studyMaterialId, term, type, gameMode]);

      // Then insert the new question
      const insertQuery = `
        INSERT INTO generated_material 
        (study_material_id, item_id, item_number, term, definition, question_type, question, answer, game_mode) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.query(insertQuery, [
        studyMaterialId,
        itemId,
        itemNumber,
        term,
        definition,
        type,
        question,
        answer,
        gameMode,
      ]);

      return result;
    } catch (error) {
      console.error("Error saving generated question:", error);
      throw error;
    }
  },

  // Helper functions for direct calls
  generateTrueFalseQuestion: generateTrueFalseQuestionHelper,
  generateMultipleChoiceQuestion: generateMultipleChoiceQuestionHelper,
  generateIdentificationQuestion: generateIdentificationQuestionHelper
};
