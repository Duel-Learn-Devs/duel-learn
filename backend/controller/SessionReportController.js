import { pool } from '../config/db.js';

export const saveSessionReport = async (req, res) => {
  try {
    console.log("=== RECEIVED SESSION REPORT REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const {
      session_id,
      study_material_id,
      title,
      summary,
      session_by_user_id,
      session_by_username,
      status,
      ends_at,
      exp_gained,
      coins_gained,
      game_mode,
      total_time,
      mastered,
      unmastered,
    } = req.body;

    // Log the extracted values
    console.log("Extracted values:", {
      total_time,
      mastered,
      unmastered,
      game_mode,
      status
    });

    // Format timestamp for MySQL
    const formattedEndsAt = new Date(ends_at).toISOString().slice(0, 19).replace('T', ' ');

    const query = `
      INSERT INTO session_report (
        session_id,
        study_material_id,
        title,
        summary,
        session_by_user_id,
        session_by_username,
        status,
        ends_at,
        exp_gained,
        coins_gained,
        game_mode,
        total_time,
        mastered,
        unmastered
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      session_id,
      study_material_id,
      title,
      summary,
      session_by_user_id,
      session_by_username,
      status,
      formattedEndsAt,
      exp_gained,
      coins_gained,
      game_mode,
      total_time,
      mastered,
      unmastered,
    ];

    console.log("Executing query with values:", values);

    const [result] = await pool.query(query, values);

    console.log("Query result:", result);

    if (result.affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: 'Session report saved successfully',
        sessionId: session_id
      });
    } else {
      throw new Error('Failed to save session report');
    }
  } catch (error) {
    console.error("Error saving session report:", error);

    res.status(500).json({
      success: false,
      message: 'Failed to save session report',
      error: error.message,
      details: {
        code: error.code,
        sqlMessage: error.sqlMessage
      }
    });
  }
}; 