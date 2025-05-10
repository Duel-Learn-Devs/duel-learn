import { pool } from '../config/db.js';
import { OpenAiController } from '../controller/OpenAiController.js';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';


export const endBattle = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const {
            lobby_code,
            winner_id,
            battle_end_reason,
            session_id,
            session_uuid,
            early_leaver_id  // Add this to track who left early
        } = req.body;

        console.log("endBattle request:", {
            lobby_code,
            winner_id,
            battle_end_reason,
            session_id,
            session_uuid,
            early_leaver_id
        });

        // Validate required fields
        if (!lobby_code || !battle_end_reason) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: lobby_code and battle_end_reason are required"
            });
        }

        // Handle early leave tracking if applicable
        if (battle_end_reason === 'Left The Game' && early_leaver_id) {
            // Start a transaction for early leave handling
            await connection.beginTransaction();

            try {
                // Get current early leaves count
                const [userInfo] = await connection.query(
                    'SELECT earlyLeaves FROM user_info WHERE firebase_uid = ?',
                    [early_leaver_id]
                );

                if (userInfo.length > 0) {
                    const currentEarlyLeaves = userInfo[0].earlyLeaves || 0;
                    const newEarlyLeaves = currentEarlyLeaves + 1;

                    // Check if user should be banned (3 early leaves)
                    if (newEarlyLeaves >= 3) {
                        // Set ban until 24 hours from now
                        const banUntil = new Date();
                        banUntil.setHours(banUntil.getHours() + 24);

                        // Update user with new early leaves count and ban time
                        await connection.query(
                            'UPDATE user_info SET earlyLeaves = ?, banUntil = ? WHERE firebase_uid = ?',
                            [newEarlyLeaves, banUntil, early_leaver_id]
                        );

                        console.log(`User ${early_leaver_id} banned until ${banUntil} for excessive early leaves`);
                    } else {
                        // Just increment early leaves
                        await connection.query(
                            'UPDATE user_info SET earlyLeaves = ? WHERE firebase_uid = ?',
                            [newEarlyLeaves, early_leaver_id]
                        );

                        console.log(`Incremented early leaves for user ${early_leaver_id} to ${newEarlyLeaves}`);
                    }
                }
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        }

        // Determine which identifier to use to find the session
        let sessionQuery, sessionWhereClause;

        if (session_uuid) {
            // If session_uuid is provided, use it
            sessionWhereClause = "session_uuid = ?";
            sessionQuery = session_uuid;
            console.log(`Using session_uuid=${session_uuid} to identify battle`);
        } else if (session_id) {
            // If numeric session_id is provided, use it
            sessionWhereClause = "ID = ?";
            sessionQuery = session_id;
            console.log(`Using session_id=${session_id} to identify battle`);
        } else {
            // If neither is provided, search by lobby_code
            console.log(`No session identifiers provided, searching by lobby_code=${lobby_code}`);
            const [sessionResult] = await connection.query(
                `SELECT ID, session_uuid FROM battle_sessions 
                WHERE lobby_code = ? AND is_active = 1`,
                [lobby_code]
            );

            if (sessionResult.length === 0) {
                console.log(`No active battle session found for lobby_code=${lobby_code}`);

                // Try looking for any session with this lobby code, even inactive ones
                const [anySessionResult] = await connection.query(
                    `SELECT ID, session_uuid, is_active FROM battle_sessions 
                    WHERE lobby_code = ? 
                    ORDER BY created_at DESC LIMIT 1`,
                    [lobby_code]
                );

                if (anySessionResult.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "No battle session found for this lobby"
                    });
                }

                console.log(`Found inactive session for lobby_code=${lobby_code}:`, anySessionResult[0]);

                // Use the found session even if inactive
                if (anySessionResult[0].session_uuid) {
                    sessionWhereClause = "session_uuid = ?";
                    sessionQuery = anySessionResult[0].session_uuid;
                } else {
                    sessionWhereClause = "ID = ?";
                    sessionQuery = anySessionResult[0].ID;
                }

                console.log(`Using ${sessionWhereClause}=${sessionQuery} from inactive session`);
            } else {
                // Prefer session_uuid if available
                if (sessionResult[0].session_uuid) {
                    sessionWhereClause = "session_uuid = ?";
                    sessionQuery = sessionResult[0].session_uuid;
                } else {
                    sessionWhereClause = "ID = ?";
                    sessionQuery = sessionResult[0].ID;
                }
                console.log(`Found active session with ${sessionWhereClause}=${sessionQuery}`);
            }
        }

        console.log(`Ending battle with session identifier: ${sessionQuery}, using clause: ${sessionWhereClause}`);

        // Get the numeric session ID for the battle_endings table (foreign key)
        const [sessionData] = await connection.query(
            `SELECT ID, session_uuid FROM battle_sessions 
            WHERE ${sessionWhereClause}`,
            [sessionQuery]
        );

        if (sessionData.length === 0) {
            console.log(`Session not found with ${sessionWhereClause}=${sessionQuery}`);
            return res.status(404).json({
                success: false,
                message: "Battle session not found"
            });
        }

        console.log(`Found session data:`, sessionData[0]);
        const sessionId = sessionData[0].ID;
        const finalSessionUuid = sessionData[0].session_uuid;

        // Check if a battle ending record already exists for this session
        const [existingEnding] = await connection.query(
            `SELECT * FROM battle_endings 
            WHERE session_uuid = ?`,
            [finalSessionUuid]
        );

        if (existingEnding.length > 0) {
            console.log(`Battle already ended for session ${finalSessionUuid} with reason: ${existingEnding[0].battle_end_reason}`);
            return res.json({
                success: true,
                message: "Battle was already ended",
                data: {
                    session_id: sessionId,
                    session_uuid: finalSessionUuid,
                    battle_end_reason: existingEnding[0].battle_end_reason,
                    winner_id: existingEnding[0].winner_id
                }
            });
        }

        // 1. Insert record into battle_endings table - use string UUID
        const insertEndingQuery = `
            INSERT INTO battle_endings 
            (session_uuid, winner_id, battle_end_reason)
            VALUES (?, ?, ?)
        `;

        const insertParams = [
            finalSessionUuid, // Use the session UUID string
            winner_id || null,
            battle_end_reason
        ];

        console.log("Insert params:", insertParams);

        const [insertResult] = await connection.query(insertEndingQuery, insertParams);
        console.log("Insert result:", insertResult);

        // 2. Update the battle_sessions table to mark it as inactive
        const updateSessionQuery = `
            UPDATE battle_sessions 
            SET is_active = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE ${sessionWhereClause}
        `;

        const [result] = await connection.query(updateSessionQuery, [sessionQuery]);
        console.log("Update result:", result);

        // Check if the update was successful
        if (result.affectedRows === 0) {
            console.log(`Failed to update battle session - it may no longer exist or be active`);
            return res.status(404).json({
                success: false,
                message: "Failed to update battle session - it may no longer be active"
            });
        }

        // Commit any pending transactions
        if (battle_end_reason === 'Left The Game') {
            await connection.commit();
        }

        // Log the battle end for debugging
        console.log(`Battle ended: Session ${sessionQuery}, Reason: ${battle_end_reason}, Winner: ${winner_id || 'None'}`);

        res.json({
            success: true,
            message: "Battle ended successfully",
            data: {
                session_id: sessionId,
                session_uuid: finalSessionUuid,
                battle_end_reason,
                winner_id
            }
        });

    } catch (error) {
        // Rollback transaction if there was an error during early leave handling
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError);
            }
        }

        console.error('Error ending battle:', error);
        res.status(500).json({
            success: false,
            message: "Failed to end battle",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};


export const initializeBattleSession = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const {
            lobby_code,
            host_id,
            guest_id,
            host_username,
            guest_username,
            total_rounds,
            is_active,
            host_in_battle,
            guest_in_battle,
            difficulty_mode,
            study_material_id,
            question_types
        } = req.body;

        // Validate required fields
        if (!lobby_code || !host_id || !guest_id) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Generate a unique session ID with 'session-' prefix followed by 5 digits
        const sessionUuid = `session-${Math.floor(10000 + Math.random() * 90000)}`;
        console.log(`Generated new session UUID: ${sessionUuid}`);

        // Check if battle session already exists for this lobby
        const [existingSession] = await connection.query(
            `SELECT * FROM battle_sessions 
             WHERE lobby_code = ? AND is_active = true`,
            [lobby_code]
        );

        if (existingSession.length > 0) {
            // Update existing session
            const updateQuery = `
                UPDATE battle_sessions 
                SET host_id = ?,
                    guest_id = ?,
                    host_in_battle = ?,
                    difficulty_mode = ?,
                    study_material_id = ?,
                    question_types = ?, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE lobby_code = ? AND is_active = true
            `;

            await connection.query(updateQuery, [
                host_id,
                guest_id,
                host_in_battle || false,
                difficulty_mode || null,
                study_material_id || null,
                question_types ? JSON.stringify(question_types) : null,
                lobby_code
            ]);

            // Return updated session data
            const [updatedSession] = await connection.query(
                `SELECT * FROM battle_sessions 
                 WHERE lobby_code = ? AND is_active = true`,
                [lobby_code]
            );

            return res.json({
                success: true,
                data: updatedSession[0]
            });
        }

        // Initialize new battle session
        const query = `
            INSERT INTO battle_sessions 
            (lobby_code, host_id, guest_id, total_rounds, current_turn, is_active, 
             host_in_battle, guest_in_battle, battle_started, session_uuid,
             difficulty_mode, study_material_id, question_types)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            lobby_code,
            host_id,
            guest_id,
            total_rounds || 30,
            null, // No current turn initially
            is_active || true,
            host_in_battle || false,
            guest_in_battle || false,
            false, // Battle not started until both players are in
            sessionUuid,
            difficulty_mode || null,
            study_material_id || null,
            question_types ? JSON.stringify(question_types) : null
        ];

        const [result] = await connection.query(query, values);

        // Get the newly created session
        const [newSession] = await connection.query(
            `SELECT * FROM battle_sessions WHERE ID = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            data: {
                ...newSession[0],
                session_uuid: sessionUuid
            }
        });

    } catch (error) {
        console.error('Error initializing battle session:', error);
        res.status(500).json({
            success: false,
            message: "Failed to initialize battle session",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

export const updateBattleSession = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { lobby_code, ...updateData } = req.body;

        if (!lobby_code) {
            return res.status(400).json({
                success: false,
                message: "Missing lobby_code"
            });
        }

        // Build the dynamic update query based on provided fields
        let setClause = '';
        const queryParams = [];

        Object.entries(updateData).forEach(([key, value], index) => {
            setClause += `${key} = ?${index < Object.entries(updateData).length - 1 ? ', ' : ''}`;
            queryParams.push(value);
        });

        if (!setClause) {
            return res.status(400).json({
                success: false,
                message: "No update data provided"
            });
        }

        // Add the lobby_code to parameters
        queryParams.push(lobby_code);

        const query = `
            UPDATE battle_sessions 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE lobby_code = ? AND is_active = true
        `;

        const [result] = await connection.query(query, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Battle session not found or not active"
            });
        }

        // If guest is joining, check if both players are now in battle
        if (updateData.guest_in_battle === true) {
            const [checkSession] = await connection.query(
                `SELECT * FROM battle_sessions
                 WHERE lobby_code = ? AND is_active = true`,
                [lobby_code]
            );

            if (checkSession.length > 0 && checkSession[0].host_in_battle) {
                // Both players are in, update battle_started
                await connection.query(
                    `UPDATE battle_sessions
                     SET battle_started = true, updated_at = CURRENT_TIMESTAMP
                     WHERE lobby_code = ? AND is_active = true`,
                    [lobby_code]
                );
            }
        }

        // Get the updated session data
        const [updatedSession] = await connection.query(
            `SELECT * FROM battle_sessions
             WHERE lobby_code = ? AND is_active = true`,
            [lobby_code]
        );

        res.json({
            success: true,
            message: "Battle session updated successfully",
            data: updatedSession[0]
        });

    } catch (error) {
        console.error('Error updating battle session:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update battle session",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

export const getBattleSessionState = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { lobby_code } = req.params;

        const query = `
            SELECT * FROM battle_sessions
            WHERE lobby_code = ? AND is_active = true
            ORDER BY created_at DESC LIMIT 1
        `;

        const [sessions] = await connection.query(query, [lobby_code]);

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No active battle session found for this lobby"
            });
        }

        res.json({
            success: true,
            data: sessions[0]
        });

    } catch (error) {
        console.error('Error getting battle session state:', error);
        res.status(500).json({
            success: false,
            message: "Failed to get battle session state",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// Add this new function to check battle end status
export const getBattleEndStatus = async (req, res) => {
    try {
        const { session_uuid } = req.params;

        if (!session_uuid) {
            return res.status(400).json({
                success: false,
                message: "Missing session UUID"
            });
        }

        console.log(`Checking battle end status for session UUID: ${session_uuid}`);

        // Query the battle_endings table to check if this session has ended
        const query = `
            SELECT be.*, bs.host_id, bs.guest_id
            FROM battle_endings be
            JOIN battle_sessions bs ON be.session_uuid = bs.session_uuid
            WHERE be.session_uuid = ?
        `;

        const [results] = await pool.query(query, [session_uuid]);

        if (results.length === 0) {
            return res.json({
                success: true,
                data: null // Battle hasn't ended yet
            });
        }

        res.json({
            success: true,
            data: results[0]
        });

    } catch (error) {
        console.error('Error checking battle end status:', error);
        res.status(500).json({
            success: false,
            message: "Failed to check battle end status",
            error: error.message
        });
    }
};

// Add new function to check battle end status by numeric session ID
export const getBattleEndStatusById = async (req, res) => {
    try {
        const { session_id } = req.params;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: "Missing session ID"
            });
        }

        console.log(`Checking battle end status for session ID: ${session_id}`);

        // Query the battle_endings table to check if this session has ended
        // Join to battle_sessions using numeric ID
        const query = `
            SELECT be.*, bs.host_id, bs.guest_id
            FROM battle_endings be
            JOIN battle_sessions bs ON be.session_uuid = bs.session_uuid
            WHERE bs.ID = ?
        `;

        const [results] = await pool.query(query, [session_id]);

        if (results.length === 0) {
            return res.json({
                success: true,
                data: null // Battle hasn't ended yet
            });
        }

        res.json({
            success: true,
            data: results[0]
        });

    } catch (error) {
        console.error('Error checking battle end status by ID:', error);
        res.status(500).json({
            success: false,
            message: "Failed to check battle end status by ID",
            error: error.message
        });
    }
};

// Add new function to check battle end status by lobby code
export const getBattleEndStatusByLobby = async (req, res) => {
    try {
        const { lobby_code } = req.params;

        if (!lobby_code) {
            return res.status(400).json({
                success: false,
                message: "Missing lobby code"
            });
        }

        console.log(`Checking battle end status for lobby code: ${lobby_code}`);

        // Query the battle_endings table by joining through battle_sessions using lobby_code
        const query = `
            SELECT be.*, bs.host_id, bs.guest_id
            FROM battle_endings be
            JOIN battle_sessions bs ON be.session_uuid = bs.session_uuid
            WHERE bs.lobby_code = ?
            ORDER BY be.created_at DESC LIMIT 1
        `;

        const [results] = await pool.query(query, [lobby_code]);

        if (results.length === 0) {
            return res.json({
                success: true,
                data: null // Battle hasn't ended yet
            });
        }

        res.json({
            success: true,
            data: results[0]
        });

    } catch (error) {
        console.error('Error checking battle end status by lobby code:', error);
        res.status(500).json({
            success: false,
            message: "Failed to check battle end status by lobby code",
            error: error.message
        });
    }
};

// Add new function to get battle session with study material details
export const getBattleSessionWithMaterial = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { lobby_code } = req.params;

        if (!lobby_code) {
            return res.status(400).json({
                success: false,
                message: "Missing lobby code"
            });
        }

        // Query to get session with study material details
        const query = `
            SELECT bs.*, 
                   bs.difficulty_mode, 
                   bs.study_material_id,
                   bs.question_types,
                   CASE 
                     WHEN bs.question_types IS NOT NULL THEN JSON_VALID(bs.question_types)
                     ELSE NULL 
                   END as has_valid_question_types
            FROM battle_sessions bs
            WHERE bs.lobby_code = ? AND bs.is_active = true
            ORDER BY bs.created_at DESC 
            LIMIT 1
        `;

        const [sessions] = await connection.query(query, [lobby_code]);

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No active battle session found for this lobby"
            });
        }

        // Parse question_types JSON if it exists and is valid
        const session = sessions[0];
        if (session.question_types && session.has_valid_question_types) {
            try {
                session.question_types = JSON.parse(session.question_types);
            } catch (e) {
                console.error('Error parsing question_types JSON:', e);
                session.question_types = null;
            }
        }
        delete session.has_valid_question_types; // Remove the helper field

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Error getting battle session with material details:', error);
        res.status(500).json({
            success: false,
            message: "Failed to get battle session details",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

export const initializeBattleRounds = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { session_uuid, round_number } = req.body;

        // Validate required fields
        if (!session_uuid) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: session_uuid"
            });
        }

        // Check if entry already exists for this session
        const [existingRounds] = await connection.query(
            `SELECT * FROM battle_rounds 
             WHERE session_uuid = ?`,
            [session_uuid]
        );

        if (existingRounds.length > 0) {
            return res.json({
                success: true,
                message: "Battle rounds already initialized",
                data: existingRounds[0]
            });
        }

        // Initialize a new entry in battle_rounds
        const query = `
            INSERT INTO battle_rounds 
            (session_uuid, round_number)
            VALUES (?, ?)
        `;

        const [result] = await connection.query(query, [
            session_uuid,
            round_number || null
        ]);

        if (result.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to initialize battle rounds"
            });
        }

        res.status(201).json({
            success: true,
            message: "Battle rounds initialized successfully",
            data: {
                session_uuid,
                round_number
            }
        });

    } catch (error) {
        console.error('Error initializing battle rounds:', error);
        res.status(500).json({
            success: false,
            message: "Failed to initialize battle rounds",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// Add new function to update battle rounds with selected card and switch turns
export const updateBattleRound = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const {
            session_uuid,
            player_type,
            card_id,
            is_correct, // Add this new parameter
            lobby_code
        } = req.body;

        // Validate required fields
        if (!session_uuid || !player_type || !card_id || !lobby_code) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: session_uuid, player_type, card_id, and lobby_code are required"
            });
        }

        // Ensure player_type is valid (host or guest)
        if (player_type !== 'host' && player_type !== 'guest') {
            return res.status(400).json({
                success: false,
                message: "Invalid player_type. Must be 'host' or 'guest'"
            });
        }

        // Get current battle session to determine next player
        const [sessionResult] = await connection.query(
            `SELECT * FROM battle_sessions 
            WHERE session_uuid = ? AND is_active = 1`,
            [session_uuid]
        );

        if (sessionResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Battle session not found or not active"
            });
        }

        const session = sessionResult[0];
        // Determine next player's turn
        const currentTurn = session.current_turn;
        let nextTurn = currentTurn === session.host_id ? session.guest_id : session.host_id;

        // Apply card effects if answer is correct
        let cardEffect = null;
        if (is_correct) {
            // Handle special card effects
            if (card_id === "normal-1") {
                // Time Manipulation: Reduce opponent's answer time
                // The opponent is the target of the effect
                const targetPlayer = player_type === 'host' ? 'guest' : 'host';
                cardEffect = {
                    type: "normal-1",
                    effect: "reduce_time",
                    target: targetPlayer, // FIXED: Target is the opponent
                    reduction_percent: 30, // Reduce time by 30%
                    min_time: 5           // Minimum time in seconds
                };
                console.log(`Card effect: ${player_type} used Time Manipulation to reduce answer time for ${targetPlayer} by 30% (min 5s)`);
            } else if (card_id === "normal-2") {
                // Quick Draw: Answer twice in a row
                // Keep the turn with the current player
                nextTurn = currentTurn;
                cardEffect = {
                    type: "normal-2",
                    effect: "double_turn",
                    target: player_type  // Current player keeps their turn
                };
                console.log(`Card effect: ${player_type} used Quick Draw to answer twice in a row`);
            } else if (card_id === "epic-1") {
                // Answer Shield: Block one card used by opponent
                const targetPlayer = player_type === 'host' ? 'guest' : 'host';
                cardEffect = {
                    type: "epic-1",
                    effect: "block_card",
                    target: targetPlayer,
                    block_count: 1  // Block one card in opponent's next turn
                };
                console.log(`Card effect: ${player_type} used Answer Shield to block one card for ${targetPlayer}`);
            } else if (card_id === "epic-2") {
                // Regeneration: Gain +10 HP if the question is answered correctly
                // Apply the effect immediately
                cardEffect = {
                    type: "epic-2",
                    effect: "regenerate",
                    target: player_type,
                    health_amount: 10
                };

                // Execute regeneration effect right away
                const healthField = player_type === 'host' ? 'host_health' : 'guest_health';
                await connection.query(
                    `UPDATE battle_scores 
                    SET ${healthField} = LEAST(${healthField} + ?, 100)
                    WHERE session_uuid = ?`,
                    [10, session_uuid]
                );


                console.log(`Card effect: ${player_type} used Regeneration to gain +10 HP`);
            } else if (card_id === "rare-1") {
                // Mind Control: Force opponent to answer without power-ups (no card selection)
                const targetPlayer = player_type === 'host' ? 'guest' : 'host';
                cardEffect = {
                    type: "rare-1",
                    effect: "mind_control",
                    target: targetPlayer,
                    duration: 1,  // Lasts for 1 turn
                    no_cards: true // Prevent card selection
                };
                console.log(`Card effect: ${player_type} used Mind Control to prevent ${targetPlayer} from selecting cards next turn`);
            } else if (card_id === "rare-2") {
                // Poison Type: Deal poison damage to opponent for 3 rounds
                const targetPlayer = player_type === 'host' ? 'guest' : 'host';
                cardEffect = {
                    type: "rare-2",
                    effect: "poison",
                    target: targetPlayer,
                    initial_damage: 10,  // Initial poison damage
                    damage_per_turn: 5, // Damage each subsequent turn
                    duration: 3,       // Lasts for 3 rounds
                    turns_remaining: 3, // Track turns remaining (exactly 3 turns)
                    turn_applied: Date.now(), // Record when it was applied
                    applied_for_turns: [], // Track which turns it's been applied for
                    turn_counter: 0 // Starting at 0, will be incremented each turn up to 3
                };

                // Apply initial poison damage immediately
                const opponentHealthField = targetPlayer === 'host' ? 'host_health' : 'guest_health';
                await connection.query(
                    `UPDATE battle_scores 
                    SET ${opponentHealthField} = GREATEST(0, ${opponentHealthField} - ?)
                    WHERE session_uuid = ?`,
                    [10, session_uuid]
                );

                console.log(`Card effect: ${player_type} used Poison Type to apply poison damage to ${targetPlayer} for exactly 3 turns`);
            }
        }

        // Start a transaction
        await connection.beginTransaction();

        try {
            // Update the battle rounds with selected card and answer result
            const updateField = player_type === 'host' ? 'host_card' : 'guest_card';
            const answerField = player_type === 'host' ? 'host_answer_correct' : 'guest_answer_correct';
            const cardEffectField = player_type === 'host' ? 'host_card_effect' : 'guest_card_effect';

            // Set card_id appropriately
            let finalCardId = card_id;
            if (card_id === "no-card-selected") {
                // Use a standardized value for no card selected
                finalCardId = "no-card-selected";

                // Log that no card was selected
                console.log(`${player_type} did not select a card within the time limit`);
            }

            // Check if the card_effect columns exist

            // Check for necessary columns
            const [columns] = await connection.query(`
                SHOW COLUMNS FROM battle_rounds 
                WHERE Field IN ('host_card_effect', 'guest_card_effect', 'question_count_total')
            `);

            // Add missing columns if needed
            const existingFields = columns.map(col => col.Field);

            if (!existingFields.includes('host_card_effect') || !existingFields.includes('guest_card_effect')) {
                console.log("Adding card effect columns to battle_rounds table");
                await connection.query(`
                    ALTER TABLE battle_rounds 
                    ADD COLUMN IF NOT EXISTS host_card_effect JSON NULL,
                    ADD COLUMN IF NOT EXISTS guest_card_effect JSON NULL
                `);
            }

            if (!existingFields.includes('question_count_total')) {
                console.log("Adding question_count_total column to battle_rounds table");
                await connection.query(`
                    ALTER TABLE battle_rounds 
                    ADD COLUMN IF NOT EXISTS question_count_total INT DEFAULT 0
                `);
            }

            // Prepare update query
            const updateRoundQuery = `
                UPDATE battle_rounds 
                SET ${updateField} = ?,
                    ${answerField} = ?,
                    ${cardEffectField} = ?,
                    question_count_total = COALESCE(question_count_total, 0) + 1
                WHERE session_uuid = ?
            `;

            const updateRoundParams = [
                finalCardId,
                is_correct,
                cardEffect ? JSON.stringify(cardEffect) : null,
                session_uuid
            ];

            // Execute update
            await connection.query(updateRoundQuery, updateRoundParams);


            // Update battle_sessions to store active card effects
            // First check if the active_card_effects column exists
            const [sessionColumns] = await connection.query(`
                SHOW COLUMNS FROM battle_sessions 
                WHERE Field = 'active_card_effects'
            `);

            if (sessionColumns.length === 0) {
                // Add the column
                console.log("Adding active_card_effects column to battle_sessions table");
                await connection.query(`
                    ALTER TABLE battle_sessions 
                    ADD COLUMN active_card_effects JSON NULL
                `);
            }

            // Update or set active card effects
            let activeCardEffects = [];

            if (session.active_card_effects) {
                try {
                    activeCardEffects = JSON.parse(session.active_card_effects);
                    if (!Array.isArray(activeCardEffects)) {
                        activeCardEffects = [];
                    }
                } catch (e) {
                    console.error('Error parsing active_card_effects:', e);
                    activeCardEffects = [];
                }
            }

            // Add new card effect if present and answer was correct
            if (cardEffect && is_correct) {
                activeCardEffects.push({
                    ...cardEffect,
                    applied_at: new Date().toISOString(),
                    used: false
                });
            }

            // Update turn in battle_sessions table
            const updateTurnQuery = `
                UPDATE battle_sessions 
                SET current_turn = ?,
                    active_card_effects = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE session_uuid = ? AND is_active = 1
            `;

            await connection.query(updateTurnQuery, [
                nextTurn,
                JSON.stringify(activeCardEffects),
                session_uuid
            ]);

            // If answer was provided, update battle scores
            if (typeof is_correct !== 'undefined') {
                // Update battle scores based on answer correctness
                const damage_amount = 10; // Default damage amount
                if (is_correct) {
                    // If player answers correctly, reduce opponent's health
                    const opponentType = player_type === 'host' ? 'guest' : 'host';
                    const updateScoreQuery = `
                        UPDATE battle_scores 
                        SET ${opponentType}_health = GREATEST(0, ${opponentType}_health - ?)
                        WHERE session_uuid = ?
                    `;
                    await connection.query(updateScoreQuery, [damage_amount, session_uuid]);
                }
            }


            // Commit the transaction
            await connection.commit();

            // Get the updated data
            const [updatedRound] = await connection.query(
                `SELECT * FROM battle_rounds WHERE session_uuid = ?`,
                [session_uuid]
            );

            const [updatedSession] = await connection.query(
                `SELECT * FROM battle_sessions WHERE session_uuid = ? AND is_active = 1`,
                [session_uuid]
            );

            const [updatedScores] = await connection.query(
                `SELECT * FROM battle_scores WHERE session_uuid = ?`,
                [session_uuid]
            );


            // Format the response based on card effects
            let responseMessage = `${player_type} card selection and answer recorded, turn switched to the next player`;

            if (cardEffect && is_correct) {
                if (card_id === "normal-1") {
                    responseMessage = `${player_type} used Time Manipulation card: Opponent's answer time will be reduced by 30% (min 5s)`
                } else if (card_id === "normal-2") {
                    responseMessage = `${player_type} used Quick Draw card: Player gets another turn`;
                } else if (card_id === "epic-1") {
                    responseMessage = `${player_type} used Answer Shield card: Opponent's next card will be blocked`;
                } else if (card_id === "epic-2") {
                    responseMessage = `${player_type} used Regeneration card: Player's health increased by 10 HP`;
                } else if (card_id === "rare-1") {
                    responseMessage = `${player_type} used Mind Control card: Opponent can't select cards next turn`;
                } else if (card_id === "rare-2") {
                    responseMessage = `${player_type} used Poison Type card: Opponent takes poison damage for 3 turns`;
                }
            }

            res.json({
                success: true,
                message: responseMessage,
                data: {
                    round: updatedRound[0] || null,
                    session: updatedSession[0] || null,
                    scores: updatedScores[0] || null,
                    card_effect: cardEffect

                }
            });

        } catch (error) {
            // If anything fails, roll back the transaction
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error updating battle round:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update battle round",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// Add new function to get the current battle round data
export const getBattleRound = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { session_uuid } = req.params;

        if (!session_uuid) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: session_uuid"
            });
        }

        // Get battle round data
        const [roundResult] = await connection.query(
            `SELECT * FROM battle_rounds WHERE session_uuid = ?`,
            [session_uuid]
        );

        if (roundResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Battle round not found for this session"
            });
        }

        res.json({
            success: true,
            data: roundResult[0]
        });

    } catch (error) {
        console.error('Error getting battle round data:', error);
        res.status(500).json({
            success: false,
            message: "Failed to get battle round data",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

export const initializeBattleScores = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { session_uuid, host_health, guest_health } = req.body;

        // Validate required fields
        if (!session_uuid) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: session_uuid"
            });
        }

        // Check if entry already exists for this session
        const [existingScores] = await connection.query(
            `SELECT * FROM battle_scores 
             WHERE session_uuid = ?`,
            [session_uuid]
        );

        if (existingScores.length > 0) {
            return res.json({
                success: true,
                message: "Battle scores already initialized",
                data: existingScores[0]
            });
        }

        // Initialize a new entry in battle_scores
        const query = `
            INSERT INTO battle_scores 
            (session_uuid, host_health, guest_health)
            VALUES (?, ?, ?)
        `;

        const [result] = await connection.query(query, [
            session_uuid,
            host_health || 100,
            guest_health || 100
        ]);

        if (result.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to initialize battle scores"
            });
        }

        res.status(201).json({
            success: true,
            message: "Battle scores initialized successfully",
            data: {
                session_uuid,
                host_health: host_health || 100,
                guest_health: guest_health || 100
            }
        });

    } catch (error) {
        console.error('Error initializing battle scores:', error);
        res.status(500).json({
            success: false,
            message: "Failed to initialize battle scores",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

export const getBattleScores = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { session_uuid } = req.params;

        if (!session_uuid) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: session_uuid"
            });
        }

        // Get battle scores data
        const [scoresResult] = await connection.query(
            `SELECT * FROM battle_scores WHERE session_uuid = ?`,
            [session_uuid]
        );

        if (scoresResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Battle scores not found for this session"
            });
        }

        res.json({
            success: true,
            data: scoresResult[0]
        });

    } catch (error) {
        console.error('Error getting battle scores:', error);
        res.status(500).json({
            success: false,
            message: "Failed to get battle scores",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// Add new function to update battle scores based on question answers
export const updateBattleScores = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const {
            session_uuid,
            player_type,
            is_correct,
            damage_amount = 10 // Default damage amount when wrong
        } = req.body;

        // Validate required fields
        if (!session_uuid || !player_type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: session_uuid and player_type are required"
            });
        }

        // Get current battle scores
        const [currentScores] = await connection.query(
            `SELECT * FROM battle_scores WHERE session_uuid = ?`,
            [session_uuid]
        );

        if (currentScores.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Battle scores not found for this session"
            });
        }

        // Calculate new health based on answer correctness
        let updateQuery;
        let updateParams;

        if (player_type === 'host') {
            // If host answers incorrectly, reduce host's health
            if (!is_correct) {
                updateQuery = `
                    UPDATE battle_scores 
                    SET host_health = GREATEST(0, host_health - ?)
                    WHERE session_uuid = ?
                `;
                updateParams = [damage_amount, session_uuid];
            }
        } else {
            // If guest answers incorrectly, reduce guest's health
            if (!is_correct) {
                updateQuery = `
                    UPDATE battle_scores 
                    SET guest_health = GREATEST(0, guest_health - ?)
                    WHERE session_uuid = ?
                `;
                updateParams = [damage_amount, session_uuid];
            }
        }

        // Only update if health needs to be reduced
        if (updateQuery && updateParams) {
            await connection.query(updateQuery, updateParams);
        }

        // Get updated scores
        const [updatedScores] = await connection.query(
            `SELECT * FROM battle_scores WHERE session_uuid = ?`,
            [session_uuid]
        );

        res.json({
            success: true,
            message: "Battle scores updated successfully",
            data: updatedScores[0]
        });

    } catch (error) {
        console.error('Error updating battle scores:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update battle scores",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }

};

// Add this new function to get active card effects for a player
export const getActiveCardEffects = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { session_uuid, player_type } = req.params;

        if (!session_uuid || !player_type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: session_uuid and player_type"
            });
        }

        console.log(`Getting active card effects for ${player_type} in session ${session_uuid}`);

        // Get the battle session to access active card effects
        const [sessionResult] = await connection.query(
            `SELECT active_card_effects FROM battle_sessions 
            WHERE session_uuid = ? AND is_active = 1`,
            [session_uuid]
        );

        if (sessionResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Battle session not found or not active"
            });
        }

        // Extract active card effects
        let activeCardEffects = [];
        let playerEffects = [];

        if (sessionResult[0].active_card_effects) {
            try {
                activeCardEffects = JSON.parse(sessionResult[0].active_card_effects);
                console.log(`All active card effects: ${JSON.stringify(activeCardEffects)}`);

                // Filter effects targeting this player
                playerEffects = activeCardEffects.filter(effect =>
                    effect.target === player_type && !effect.used
                );

                console.log(`Card effects targeting ${player_type}: ${JSON.stringify(playerEffects)}`);
            } catch (e) {
                console.error('Error parsing active_card_effects:', e);
            }
        } else {
            console.log(`No active card effects found for session ${session_uuid}`);
        }

        res.json({
            success: true,
            data: {
                player_type,
                effects: playerEffects
            }
        });

    } catch (error) {
        console.error('Error getting active card effects:', error);
        res.status(500).json({
            success: false,
            message: "Failed to get active card effects",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// Add this function to mark a card effect as used
export const consumeCardEffect = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { session_uuid, player_type, effect_type } = req.body;

        if (!session_uuid || !player_type || !effect_type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: session_uuid, player_type, and effect_type"
            });
        }

        // Get the current active card effects
        const [sessionResult] = await connection.query(
            `SELECT active_card_effects FROM battle_sessions 
            WHERE session_uuid = ? AND is_active = 1`,
            [session_uuid]
        );

        if (sessionResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Battle session not found or not active"
            });
        }

        // Parse and update the active card effects
        let activeCardEffects = [];
        let updated = false;

        if (sessionResult[0].active_card_effects) {
            try {
                activeCardEffects = JSON.parse(sessionResult[0].active_card_effects);

                // Find and mark the effect as used
                for (let i = 0; i < activeCardEffects.length; i++) {
                    if (activeCardEffects[i].target === player_type &&
                        activeCardEffects[i].type === effect_type &&
                        !activeCardEffects[i].used) {
                        activeCardEffects[i].used = true;
                        activeCardEffects[i].consumed_at = new Date().toISOString();
                        updated = true;
                        break;
                    }
                }
            } catch (e) {
                console.error('Error parsing active_card_effects:', e);
                return res.status(500).json({
                    success: false,
                    message: "Error processing card effects",
                    error: e.message
                });
            }
        }

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "No matching active card effect found"
            });
        }

        // Update the session with the modified card effects
        await connection.query(
            `UPDATE battle_sessions 
            SET active_card_effects = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE session_uuid = ? AND is_active = 1`,
            [JSON.stringify(activeCardEffects), session_uuid]
        );

        res.json({
            success: true,
            message: `Card effect ${effect_type} consumed for ${player_type}`,
            data: {
                remaining_effects: activeCardEffects.filter(effect =>
                    effect.target === player_type && !effect.used
                )
            }
        });

    } catch (error) {
        console.error('Error consuming card effect:', error);
        res.status(500).json({
            success: false,
            message: "Failed to consume card effect",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// Add this new function to check user's ban status
export const checkUserBanStatus = async (req, res) => {
    let connection;
    try {
        const { firebase_uid } = req.params;

        if (!firebase_uid) {
            return res.status(400).json({
                success: false,
                message: "Firebase UID is required"
            });
        }

        connection = await pool.getConnection();

        // Get user's ban status
        const [userInfo] = await connection.query(
            'SELECT banUntil, earlyLeaves FROM user_info WHERE firebase_uid = ?',
            [firebase_uid]
        );

        if (userInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if user is currently banned
        const banUntil = userInfo[0].banUntil;
        const earlyLeaves = userInfo[0].earlyLeaves || 0;
        const now = new Date();

        // If banUntil is in the future, user is banned
        const isBanned = banUntil && new Date(banUntil) > now;

        // If ban has expired, reset early leaves
        if (banUntil && new Date(banUntil) <= now) {
            await connection.query(
                'UPDATE user_info SET banUntil = NULL, earlyLeaves = 0 WHERE firebase_uid = ?',
                [firebase_uid]
            );
        }

        return res.status(200).json({
            success: true,
            data: {
                isBanned,
                banUntil: isBanned ? banUntil : null,
                earlyLeaves,
                banExpired: banUntil && new Date(banUntil) <= now
            }
        });

    } catch (error) {
        console.error('Error checking ban status:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to check ban status",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Save PvP battle session report
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const savePvpSessionReport = async (req, res) => {
    let connection;
    try {
        const {
            session_uuid,
            start_time,
            end_time,
            material_id,
            host_id,
            host_health,
            host_correct_count,
            host_incorrect_count,
            host_highest_streak,
            host_xp_earned,
            host_coins_earned,
            guest_id,
            guest_health,
            guest_correct_count,
            guest_incorrect_count,
            guest_highest_streak,
            guest_xp_earned,
            guest_coins_earned,
            winner_id,
            defeated_id,
            battle_duration,
            early_end
        } = req.body;

        console.log(host_xp_earned, host_coins_earned, guest_xp_earned, guest_coins_earned);

        // Validate required fields
        if (!session_uuid || !material_id || !host_id || !guest_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get a connection from the pool
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // First check if this session report already exists
        const checkQuery = `
            SELECT session_uuid FROM pvp_battle_sessions 
            WHERE session_uuid = ?
        `;
        const [existing] = await connection.execute(checkQuery, [session_uuid]);

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(200).json({
                success: true,
                message: 'PvP session report already exists',
                data: {
                    session_uuid
                }
            });
        }

        // Simple insert query for session report
        const insertQuery = `
            INSERT INTO pvp_battle_sessions (
                session_uuid, start_time, end_time, material_id,
                host_id, host_health, host_correct_count, host_incorrect_count,
                host_highest_streak, host_xp_earned, host_coins_earned,
                guest_id, guest_health, guest_correct_count, guest_incorrect_count,
                guest_highest_streak, guest_xp_earned, guest_coins_earned,
                winner_id, defeated_id, battle_duration, early_end
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            session_uuid,
            start_time,
            end_time,
            material_id,
            host_id,
            host_health,
            host_correct_count,
            host_incorrect_count,
            host_highest_streak,
            host_xp_earned,
            host_coins_earned || 0,
            guest_id,
            guest_health,
            guest_correct_count,
            guest_incorrect_count,
            guest_highest_streak,
            guest_xp_earned,
            guest_coins_earned || 0,
            winner_id,
            defeated_id,
            battle_duration,
            early_end
        ];

        const [result] = await connection.execute(insertQuery, values);

        // Commit the transaction
        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'PvP session report saved successfully',
            data: {
                id: result.insertId
            }
        });

    } catch (error) {
        // Rollback the transaction if there's an error
        if (connection) {
            await connection.rollback();
        }

        console.error('Error saving PvP session report:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Session report already exists',
                error: error.message
            });
        }

        if (error.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(400).json({
                success: false,
                message: 'Database column error',
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to save PvP session report',
            error: error.message
        });
    } finally {
        // Release the connection back to the pool
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Get user's current win streak
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getWinStreak = async (req, res) => {
    let connection;
    try {
        const { firebase_uid } = req.params;

        if (!firebase_uid) {
            return res.status(400).json({
                success: false,
                message: "Firebase UID is required"
            });
        }

        connection = await pool.getConnection();

        // Get win streak from user_info table
        const [result] = await connection.execute(
            'SELECT win_streak FROM user_info WHERE firebase_uid = ?',
            [firebase_uid]
        );

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                win_streak: result[0].win_streak || 0
            }
        });

    } catch (error) {
        console.error('Error getting win streak:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to get win streak",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Update user's win streak
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const updateWinStreak = async (req, res) => {
    const { firebase_uid, is_winner, protect_streak } = req.body;

    try {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // First, get the current win_streak and longest_win_streak
            const [userStreak] = await connection.query(
                "SELECT win_streak, longest_win_streak FROM user_info WHERE firebase_uid = ?",
                [firebase_uid]
            );

            if (userStreak.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const currentStreak = userStreak[0].win_streak || 0;
            let currentLongestStreak = userStreak[0].longest_win_streak || 0;

            if (is_winner) {
                // Winner: increment win streak
                const newStreak = currentStreak + 1;

                // Update longest streak if the new streak is higher
                if (newStreak > currentLongestStreak) {
                    currentLongestStreak = newStreak;
                }

                await connection.query(
                    "UPDATE user_info SET win_streak = ?, longest_win_streak = ? WHERE firebase_uid = ?",
                    [newStreak, currentLongestStreak, firebase_uid]
                );
            } else if (!protect_streak) {
                // Loser without Fortune Coin: reset win streak to 0 (longest_win_streak remains unchanged)
                await connection.query(
                    "UPDATE user_info SET win_streak = 0 WHERE firebase_uid = ?",
                    [firebase_uid]
                );
            }

            await connection.commit();

            // Get updated win streak and longest streak
            const [result] = await connection.query(
                "SELECT win_streak, longest_win_streak FROM user_info WHERE firebase_uid = ?",
                [firebase_uid]
            );

            res.status(200).json({
                success: true,
                data: {
                    win_streak: result[0].win_streak || 0,
                    longest_win_streak: result[0].longest_win_streak || 0
                },
                protected: protect_streak && !is_winner
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error updating win streak:", error);
        res.status(500).json({ success: false, message: "Error updating win streak" });
    }
};
// Add this new function to check if a player has any card blocking effects
export const checkCardBlockingEffects = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { session_uuid, player_type } = req.params;

        if (!session_uuid || !player_type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: session_uuid and player_type"
            });
        }

        console.log(`Checking card blocking effects for ${player_type} in session ${session_uuid}`);

        // Get the battle session to access active card effects
        const [sessionResult] = await connection.query(
            `SELECT active_card_effects FROM battle_sessions 
            WHERE session_uuid = ? AND is_active = 1`,
            [session_uuid]
        );

        if (sessionResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Battle session not found or not active"
            });
        }

        // Extract active card effects
        let activeCardEffects = [];
        let blockingEffects = [];

        if (sessionResult[0].active_card_effects) {
            try {
                activeCardEffects = JSON.parse(sessionResult[0].active_card_effects);

                // Filter for blocking effects that target this player and are not used
                blockingEffects = activeCardEffects.filter(effect =>
                    effect.target === player_type &&
                    effect.effect === "block_card" &&
                    !effect.used
                );

                console.log(`Card blocking effects for ${player_type}: ${JSON.stringify(blockingEffects)}`);
            } catch (e) {
                console.error('Error parsing active_card_effects:', e);
            }
        }

        const hasBlockingEffect = blockingEffects.length > 0;
        const numCardsBlocked = hasBlockingEffect
            ? blockingEffects.reduce((total, effect) => total + (effect.block_count || 1), 0)
            : 0;

        res.json({
            success: true,
            data: {
                has_blocking_effect: hasBlockingEffect,
                cards_blocked: numCardsBlocked,
                effects: blockingEffects
            }
        });

    } catch (error) {
        console.error('Error checking card blocking effects:', error);
        res.status(500).json({
            success: false,
            message: "Failed to check card blocking effects",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};


export const applyPoisonEffects = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { session_uuid, player_type, current_turn_number } = req.body;

        if (!session_uuid || !player_type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: session_uuid and player_type"
            });
        }

        console.log(`Applying poison effects for ${player_type} in session ${session_uuid}`);

        // Get the battle session to access active card effects
        const [sessionResult] = await connection.query(
            `SELECT active_card_effects FROM battle_sessions 
            WHERE session_uuid = ? AND is_active = 1`,
            [session_uuid]
        );

        if (sessionResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Battle session not found or not active"
            });
        }

        // Extract active card effects
        let activeCardEffects = [];
        let poisonEffects = [];
        let poisonDamageApplied = 0;
        let effectsUpdated = false;

        if (sessionResult[0].active_card_effects) {
            try {
                activeCardEffects = JSON.parse(sessionResult[0].active_card_effects);

                // Find poison effects targeting this player
                poisonEffects = activeCardEffects.filter(effect =>
                    effect.target === player_type &&
                    effect.effect === "poison" &&
                    effect.turns_remaining > 0
                );

                console.log(`Found ${poisonEffects.length} active poison effects for ${player_type}`);

                // Process each poison effect
                for (let i = 0; i < activeCardEffects.length; i++) {
                    const effect = activeCardEffects[i];

                    if (effect.target === player_type &&
                        effect.effect === "poison" &&
                        effect.turns_remaining > 0) {

                        // Check if we already applied this effect for the current turn
                        const turnNumber = current_turn_number || Date.now(); // Use timestamp as fallback

                        if (!effect.applied_for_turns || !effect.applied_for_turns.includes(turnNumber)) {
                            // Apply poison damage
                            const damage = effect.damage_per_turn || 5;
                            poisonDamageApplied += damage;

                            // Increment turn counter
                            if (typeof activeCardEffects[i].turn_counter !== 'number') {
                                activeCardEffects[i].turn_counter = 0;
                            }
                            activeCardEffects[i].turn_counter += 1;

                            // Only decrease turns_remaining if this is a new turn
                            // This ensures we count exactly 3 turns from when it was applied
                            if (activeCardEffects[i].turn_counter <= 3) {
                                console.log(`Poison turn ${activeCardEffects[i].turn_counter} of 3 applied to ${player_type}`);

                                // Only set turns_remaining to 0 after the 3rd application
                                if (activeCardEffects[i].turn_counter >= 3) {
                                    activeCardEffects[i].turns_remaining = 0;
                                    console.log(`Poison effect completed all 3 turns, will be removed for ${player_type}`);
                                } else {
                                    // Only decrement if we haven't reached 3 turns yet
                                    activeCardEffects[i].turns_remaining = 3 - activeCardEffects[i].turn_counter;
                                }
                            }

                            // Track that we applied it for this turn
                            if (!activeCardEffects[i].applied_for_turns) {
                                activeCardEffects[i].applied_for_turns = [];
                            }

                            activeCardEffects[i].applied_for_turns.push(turnNumber);

                            console.log(`Applied poison damage: ${damage}, turns remaining: ${activeCardEffects[i].turns_remaining}, turn count: ${activeCardEffects[i].turn_counter}/3`);

                            effectsUpdated = true;
                        } else {
                            console.log(`Poison effect already applied for turn ${turnNumber}`);
                        }
                    }
                }

                // Clean up any effects that have expired (turns_remaining <= 0)
                activeCardEffects = activeCardEffects.filter(effect => {
                    if (effect.effect === "poison" && effect.turns_remaining <= 0) {
                        console.log(`Removing expired poison effect targeting ${effect.target}`);
                        return false;
                    }
                    return true;
                });

                // Apply the accumulated poison damage to the player's health
                if (poisonDamageApplied > 0) {
                    const healthField = player_type === 'host' ? 'host_health' : 'guest_health';
                    await connection.query(
                        `UPDATE battle_scores 
                        SET ${healthField} = GREATEST(0, ${healthField} - ?)
                        WHERE session_uuid = ?`,
                        [poisonDamageApplied, session_uuid]
                    );

                    console.log(`Applied total poison damage of ${poisonDamageApplied} to ${player_type}`);
                }

                // Update the session with the modified effects if needed
                if (effectsUpdated) {
                    await connection.query(
                        `UPDATE battle_sessions 
                        SET active_card_effects = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE session_uuid = ? AND is_active = 1`,
                        [JSON.stringify(activeCardEffects), session_uuid]
                    );

                    console.log(`Updated poison effects in session ${session_uuid}`);
                }

            } catch (e) {
                console.error('Error parsing or updating active_card_effects:', e);
                return res.status(500).json({
                    success: false,
                    message: "Error processing poison effects",
                    error: e.message
                });
            }
        }

        // Get the updated health status
        const [updatedScores] = await connection.query(
            `SELECT * FROM battle_scores WHERE session_uuid = ?`,
            [session_uuid]
        );

        // Get updated effects to send back to client
        const updatedPoisonEffects = activeCardEffects.filter(e =>
            e.target === player_type &&
            e.effect === "poison" &&
            e.turns_remaining > 0
        );

        res.json({
            success: true,
            message: poisonDamageApplied > 0 ? `Applied ${poisonDamageApplied} poison damage to ${player_type}` : "No poison damage to apply",
            data: {
                poison_damage_applied: poisonDamageApplied,
                updated_scores: updatedScores[0] || null,
                active_poison_effects: updatedPoisonEffects,
                effects: updatedPoisonEffects // For backward compatibility
            }
        });

    } catch (error) {
        console.error('Error applying poison effects:', error);
        res.status(500).json({
            success: false,
            message: "Failed to apply poison effects",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// Add this new function to check if a player has mind control effects
export const checkMindControlEffects = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const { session_uuid, player_type } = req.params;

        if (!session_uuid || !player_type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: session_uuid and player_type"
            });
        }

        console.log(`Checking mind control effects for ${player_type} in session ${session_uuid}`);

        // Get the battle session to access active card effects
        const [sessionResult] = await connection.query(
            `SELECT active_card_effects FROM battle_sessions 
            WHERE session_uuid = ? AND is_active = 1`,
            [session_uuid]
        );

        if (sessionResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Battle session not found or not active"
            });
        }

        // Extract active card effects
        let activeCardEffects = [];
        let mindControlEffects = [];

        if (sessionResult[0].active_card_effects) {
            try {
                activeCardEffects = JSON.parse(sessionResult[0].active_card_effects);

                // Filter for mind control effects that target this player and are not used
                mindControlEffects = activeCardEffects.filter(effect =>
                    effect.target === player_type &&
                    effect.effect === "mind_control" &&
                    !effect.used
                );

                console.log(`Mind control effects for ${player_type}: ${JSON.stringify(mindControlEffects)}`);
            } catch (e) {
                console.error('Error parsing active_card_effects:', e);
            }
        }

        const hasMindControlEffect = mindControlEffects.length > 0;

        res.json({
            success: true,
            data: {
                has_mind_control_effect: hasMindControlEffect,
                effects: mindControlEffects
            }
        });

    } catch (error) {
        console.error('Error checking mind control effects:', error);
        res.status(500).json({
            success: false,
            message: "Failed to check mind control effects",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// Generate questions for battle
export const generateBattleQuestions = async (req, res) => {
    try {
        const { session_uuid, study_material_id, difficulty_mode, question_types, player_type } = req.body;

        // Validate required fields
        if (!session_uuid || !study_material_id || !difficulty_mode || !question_types || !player_type) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        // Get study material content
        const [studyMaterialContent] = await pool.query(
            `SELECT * FROM study_material_content WHERE study_material_id = ?`,
            [study_material_id]
        );

        if (!studyMaterialContent || studyMaterialContent.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Study material content not found"
            });
        }

        // Shuffle study material content
        const shuffledContent = studyMaterialContent.sort(() => Math.random() - 0.5);

        // Track used items to ensure unique usage
        const usedItems = new Set();
        const questions = [];

        // Calculate number of questions for each type
        const totalQuestions = Math.min(10, shuffledContent.length);
        const questionTypeCount = Math.floor(totalQuestions / question_types.length);
        const remainingQuestions = totalQuestions % question_types.length;

        let questionDistribution = question_types.map(type => ({
            type,
            count: questionTypeCount
        }));

        // Distribute remaining questions
        for (let i = 0; i < remainingQuestions; i++) {
            questionDistribution[i].count++;
        }

        // Generate questions for each type
        for (const distribution of questionDistribution) {
            const { type, count } = distribution;

            for (let i = 0; i < count; i++) {
                // Find an unused item
                const unusedItem = shuffledContent.find(item => !usedItems.has(item.item_id));
                if (!unusedItem) break;

                usedItems.add(unusedItem.item_id);

                if (type === 'identification') {
                    // For identification questions, use definition as question and term as answer
                    questions.push({
                        id: nanoid(),
                        type: 'identification',
                        question: unusedItem.definition,
                        correctAnswer: unusedItem.term,
                        itemInfo: {
                            term: unusedItem.term,
                            definition: unusedItem.definition,
                            itemId: unusedItem.item_id,
                            itemNumber: unusedItem.item_number
                        }
                    });
                } else {
                    // For other question types, use OpenAI generation
                    try {
                        let generatedQuestion;
                        if (type === 'multiple-choice') {
                            generatedQuestion = await OpenAiController.generateMultipleChoiceQuestion(
                                unusedItem.term,
                                unusedItem.definition,
                                {
                                    studyMaterialId: study_material_id,
                                    itemId: unusedItem.item_id,
                                    itemNumber: unusedItem.item_number,
                                    gameMode: 'battle',
                                    difficultyMode: difficulty_mode
                                }
                            );
                        } else if (type === 'true-false') {
                            generatedQuestion = await OpenAiController.generateTrueFalseQuestion(
                                unusedItem.term,
                                unusedItem.definition,
                                {
                                    studyMaterialId: study_material_id,
                                    itemId: unusedItem.item_id,
                                    itemNumber: unusedItem.item_number,
                                    gameMode: 'battle',
                                    difficultyMode: difficulty_mode
                                }
                            );
                        }

                        if (generatedQuestion && generatedQuestion.success) {
                            questions.push({
                                ...generatedQuestion.data,
                                id: nanoid(),
                                itemInfo: {
                                    term: unusedItem.term,
                                    definition: unusedItem.definition,
                                    itemId: unusedItem.item_id,
                                    itemNumber: unusedItem.item_number
                                }
                            });
                        }
                    } catch (error) {
                        console.error("Error generating question:", error);
                        continue;
                    }
                }
            }
        }

        // Delete existing questions for this session and player
        await pool.query(
            `DELETE FROM generated_material 
             WHERE study_material_id = ? AND game_mode = 'pvp'`,
            [study_material_id]
        );

        // Store the generated questions
        try {
            for (const question of questions) {
                const choicesJSON = question.options ? JSON.stringify(question.options) : null;
                await pool.query(
                    `REPLACE INTO generated_material 
                     (study_material_id, question_type, question, answer, choices, game_mode) 
                     VALUES (?, ?, ?, ?, ?, 'pvp')`,
                    [
                        study_material_id,
                        question.type,
                        question.question,
                        question.correctAnswer,
                        choicesJSON
                    ]
                );
            }
        } catch (dbError) {
            console.error("Error storing battle questions:", dbError);
            return res.status(500).json({
                success: false,
                error: "Failed to store battle questions"
            });
        }

        return res.json({
            success: true,
            data: questions
        });
    } catch (error) {
        console.error("Error in generateBattleQuestions:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Claim XP and coins rewards from a PvP battle
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const claimBattleRewards = async (req, res) => {
    let connection;
    try {
        const { firebase_uid, xp_earned, coins_earned, session_uuid } = req.body;

        // Validate required fields
        if (!firebase_uid || xp_earned === undefined || coins_earned === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: firebase_uid, xp_earned, and coins_earned are required"
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // First, get the user's current XP and coins
            const [userInfo] = await connection.query(
                'SELECT exp, coins FROM user_info WHERE firebase_uid = ?',
                [firebase_uid]
            );

            if (userInfo.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Calculate new values
            const currentExp = userInfo[0].exp || 0;
            const currentCoins = userInfo[0].coins || 0;
            const newExp = currentExp + xp_earned;
            const newCoins = currentCoins + coins_earned;

            // Update the user's XP and coins
            await connection.query(
                'UPDATE user_info SET exp = ?, coins = ? WHERE firebase_uid = ?',
                [newExp, newCoins, firebase_uid]
            );

            // If session_uuid is provided, mark rewards as claimed in the PvP session
            if (session_uuid) {
                // Check if we need to update host or guest fields
                const [sessionInfo] = await connection.query(
                    'SELECT host_id, guest_id FROM pvp_battle_sessions WHERE session_uuid = ?',
                    [session_uuid]
                );

                if (sessionInfo.length > 0) {
                    const isHost = sessionInfo[0].host_id === firebase_uid;
                    const isGuest = sessionInfo[0].guest_id === firebase_uid;

                    if (isHost || isGuest) {
                        const rewardsClaimedField = isHost ? 'host_rewards_claimed' : 'guest_rewards_claimed';

                        await connection.query(
                            `UPDATE pvp_battle_sessions SET ${rewardsClaimedField} = 1 WHERE session_uuid = ?`,
                            [session_uuid]
                        );
                    }
                }
            }

            // Commit the transaction
            await connection.commit();

            return res.status(200).json({
                success: true,
                message: "Battle rewards claimed successfully",
                data: {
                    firebase_uid,
                    xp_earned,
                    coins_earned,
                    new_exp: newExp,
                    new_coins: newCoins
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error claiming battle rewards:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to claim battle rewards",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

export const updateEnemyAnsweringQuestion = async (req, res) => {
    const { session_uuid, player_type, question_text, is_on_flashcard } = req.body;

    if (!session_uuid || !player_type || is_on_flashcard === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: session_uuid, player_type, is_on_flashcard'
        });
    }

    try {
        // Determine which columns to update based on player type
        const questionColumnToUpdate = player_type === 'host' ? 'host_answering_question_text' : 'guest_answering_question_text';
        const flashcardColumnToUpdate = player_type === 'host' ? 'host_on_flashcard' : 'guest_on_flashcard';

        const updateQuery = `
      UPDATE battle_rounds 
      SET ${questionColumnToUpdate} = ?, ${flashcardColumnToUpdate} = ?
      WHERE session_uuid = ?
    `;

        const [result] = await pool.query(updateQuery, [question_text, is_on_flashcard, session_uuid]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Battle round not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: `${player_type}'s question status updated successfully`
        });
    } catch (error) {
        console.error('Error updating enemy answering question:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const getEnemyAnsweringQuestion = async (req, res) => {
    const { session_uuid, player_type } = req.params;

    if (!session_uuid || !player_type) {
        return res.status(400).json({
            success: false,
            message: 'Missing required parameters: session_uuid, player_type'
        });
    }

    try {
        // Determine which columns to retrieve based on player type
        // If the player is host, we want to get guest's info and vice versa
        const questionColumnToRetrieve = player_type === 'host' ? 'guest_answering_question_text' : 'host_answering_question_text';
        const flashcardColumnToRetrieve = player_type === 'host' ? 'guest_on_flashcard' : 'host_on_flashcard';

        const query = `
      SELECT 
        ${questionColumnToRetrieve} AS enemy_question_text,
        ${flashcardColumnToRetrieve} AS enemy_on_flashcard
      FROM battle_rounds
      WHERE session_uuid = ?
    `;

        const [rows] = await pool.query(query, [session_uuid]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Battle round not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                enemy_question_text: rows[0].enemy_question_text,
                enemy_on_flashcard: rows[0].enemy_on_flashcard
            }
        });
    } catch (error) {
        console.error('Error retrieving enemy answering question:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Deduct XP from users who leave the game early
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const deductLeaverXP = async (req, res) => {
    const { firebase_uid } = req.body;
    const XP_PENALTY = 100; // Fixed penalty for leaving early

    try {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // First, get the current XP
            const [userInfo] = await connection.query(
                "SELECT exp FROM user_info WHERE firebase_uid = ?",
                [firebase_uid]
            );

            if (userInfo.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const currentExp = userInfo[0].exp || 0;

            // Ensure XP doesn't go below zero
            const newExp = Math.max(0, currentExp - XP_PENALTY);

            console.log(`Deducting XP for early leaver ${firebase_uid}: ${currentExp} -> ${newExp} (penalty: ${XP_PENALTY})`);

            // Update the user's XP
            await connection.query(
                "UPDATE user_info SET exp = ? WHERE firebase_uid = ?",
                [newExp, firebase_uid]
            );

            await connection.commit();

            return res.status(200).json({
                success: true,
                message: "XP penalty applied successfully",
                data: {
                    firebase_uid,
                    previous_exp: currentExp,
                    new_exp: newExp,
                    penalty: XP_PENALTY
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error applying XP penalty:", error);
        res.status(500).json({
            success: false,
            message: "Error applying XP penalty",
            error: error.message
        });
    }
};

