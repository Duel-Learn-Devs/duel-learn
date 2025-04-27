import { pool } from '../config/db.js';
import { nanoid } from "nanoid";

export const createBattleInvitation = async (req, res) => {
    try {
        const {
            sender_id,
            sender_username,
            sender_level,
            receiver_id,
            receiver_username,
            receiver_level,
            lobby_code,
            status = 'no invitation',
            question_types,
            study_material_title
        } = req.body;

        // Validate required fields
        if (!sender_id || !receiver_id || !lobby_code) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Validate question_types is an array
        if (!Array.isArray(question_types)) {
            return res.status(400).json({
                success: false,
                message: "question_types must be an array"
            });
        }

        const query = `
            INSERT INTO battle_invitations 
            (sender_id, sender_username, sender_level, 
             receiver_id, receiver_username, receiver_level, 
             lobby_code, status, 
             question_types, study_material_title)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Convert array to JSON string for storage
        const questionTypesJson = JSON.stringify(question_types);

        const values = [
            sender_id,
            sender_username,
            sender_level,
            receiver_id,
            receiver_username,
            receiver_level,
            lobby_code,
            status,
            questionTypesJson,
            study_material_title || null
        ];

        const [result] = await pool.query(query, values);

        res.status(201).json({
            success: true,
            data: {
                ...result,
                question_types: question_types
            }
        });

    } catch (error) {
        console.error('Error creating battle invitation:', error);
        res.status(500).json({
            success: false,
            message: "Failed to create battle invitation",
            error: error.message
        });
    }
};

export const updateBattleInvitationStatus = async (req, res) => {
    try {
        const { invitation_id, status } = req.body;

        const query = `
            UPDATE battle_invitations
            SET status = ?
            WHERE id = ?
            RETURNING *
        `;

        const [result] = await pool.query(query, [status, invitation_id]);

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        res.json({
            success: true,
            data: result[0]
        });

    } catch (error) {
        console.error('Error updating battle invitation:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update battle invitation",
            error: error.message
        });
    }
};

export const getHostInfo = async (req, res) => {
    try {
        const { sender_id } = req.params;

        const query = `
            SELECT u.firebase_uid, u.username, u.level, u.display_picture
            FROM user_info u
            WHERE u.firebase_uid = ?
        `;

        const [result] = await pool.query(query, [sender_id]);

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Host not found"
            });
        }

        res.json({
            success: true,
            data: result[0]
        });

    } catch (error) {
        console.error('Error fetching host info:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch host information",
            error: error.message
        });
    }
};

// Add this function to update invitation status by lobby code and sender/receiver IDs
export const updateInvitationStatusByLobbyCode = async (req, res) => {
    try {
        const { lobby_code, sender_id, receiver_id, status } = req.body;

        const query = `
            UPDATE battle_invitations 
            SET status = ?
            WHERE lobby_code = ? 
            AND sender_id = ? 
            AND receiver_id = ?
            AND status = 'pending'
        `;

        const [result] = await pool.query(query, [status, lobby_code, sender_id, receiver_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found or already processed"
            });
        }

        res.json({
            success: true,
            message: `Invitation ${status} successfully`
        });

    } catch (error) {
        console.error('Error updating invitation status:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update invitation status",
            error: error.message
        });
    }
};

// Get invitation details
export const getInvitationDetails = async (req, res) => {
    const { lobby_code, sender_id, receiver_id } = req.params;

    // Validate required fields
    if (!lobby_code || !sender_id || !receiver_id) {
        return res.status(400).json({
            success: false,
            message: "Missing required parameters"
        });
    }

    const connection = await pool.getConnection();

    try {
        // Get invitation details
        const [invitations] = await connection.execute(
            `SELECT * FROM battle_invitations 
             WHERE lobby_code = ? AND sender_id = ? AND receiver_id = ?`,
            [lobby_code, sender_id, receiver_id]
        );

        if (invitations.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        const invitation = invitations[0];

        // Parse the question_types JSON string
        try {
            invitation.question_types = JSON.parse(invitation.question_types);
        } catch (e) {
            invitation.question_types = [];
        }

        res.status(200).json({
            success: true,
            data: invitation
        });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching invitation details"
        });
    } finally {
        connection.release();
    }
};

export const getLobbySettings = async (req, res) => {
    try {
        const { lobby_code } = req.params;

        if (!lobby_code) {
            return res.status(400).json({
                success: false,
                message: "Missing lobby code"
            });
        }

        // Get latest invitation for this lobby
        const [invitations] = await pool.query(
            `SELECT question_types, study_material_title 
            FROM battle_invitations 
            WHERE lobby_code = ? 
            ORDER BY created_at DESC LIMIT 1`,
            [lobby_code]
        );

        if (invitations.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lobby not found"
            });
        }

        const { question_types, study_material_title } = invitations[0];

        // Parse question types from JSON
        let parsedQuestionTypes = [];
        try {
            parsedQuestionTypes = JSON.parse(question_types || '[]');
        } catch (e) {
            console.error('Error parsing question_types:', e);
        }

        res.json({
            success: true,
            data: {
                question_types: parsedQuestionTypes,
                study_material_title
            }
        });

    } catch (error) {
        console.error('Error getting lobby settings:', error);
        res.status(500).json({
            success: false,
            message: "Failed to get lobby settings",
            error: error.message
        });
    }
};

export const updateLobbySettings = async (req, res) => {
    try {
        const { lobby_code, question_types, study_material_title } = req.body;

        const query = `
            UPDATE battle_invitations 
            SET question_types = ?,
                study_material_title = ?
            WHERE lobby_code = ? 
        `;

        const [result] = await pool.query(query, [
            JSON.stringify(question_types),
            study_material_title,
            lobby_code
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "No active invitation found for this lobby"
            });
        }

        res.json({
            success: true,
            message: "Lobby settings updated successfully"
        });

    } catch (error) {
        console.error('Error updating lobby settings:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update lobby settings",
            error: error.message
        });
    }
};

// Add these functions for handling player ready state

export const updatePlayerReadyState = async (req, res) => {
    try {
        const { lobby_code, player_id, is_ready } = req.body;

        if (!lobby_code || !player_id) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Get invitation details to determine player roles
        const [invitations] = await pool.query(
            `SELECT * FROM battle_invitations 
            WHERE lobby_code = ? 
            ORDER BY created_at DESC LIMIT 1`,
            [lobby_code]
        );

        if (invitations.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lobby not found"
            });
        }

        const invitation = invitations[0];

        // Determine if the player is host or guest
        const isHost = player_id === invitation.sender_id;
        const isGuest = player_id === invitation.receiver_id;

        if (!isHost && !isGuest) {
            return res.status(403).json({
                success: false,
                message: "Player is not part of this lobby"
            });
        }

        // Update the appropriate ready state column
        const fieldToUpdate = isHost ? 'host_ready' : 'guest_ready';

        // Update the ready state in the database
        const query = `
            UPDATE battle_invitations 
            SET ${fieldToUpdate} = ?
            WHERE lobby_code = ? 
            AND id = ?
        `;

        const [result] = await pool.query(query, [
            is_ready ? 1 : 0,
            lobby_code,
            invitation.id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Failed to update ready state"
            });
        }

        res.json({
            success: true,
            message: `Ready state updated successfully`,
            data: {
                lobby_code,
                player_id,
                is_ready
            }
        });

    } catch (error) {
        console.error('Error updating player ready state:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update player ready state",
            error: error.message
        });
    }
};

export const getReadyState = async (req, res) => {
    try {
        const { lobby_code } = req.params;

        if (!lobby_code) {
            return res.status(400).json({
                success: false,
                message: "Missing lobby code"
            });
        }

        // Get latest invitation for this lobby
        const [invitations] = await pool.query(
            `SELECT host_ready, guest_ready 
            FROM battle_invitations 
            WHERE lobby_code = ? 
            ORDER BY created_at DESC LIMIT 1`,
            [lobby_code]
        );

        if (invitations.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lobby not found"
            });
        }

        const { host_ready, guest_ready } = invitations[0];

        res.json({
            success: true,
            data: {
                hostReady: Boolean(host_ready),
                guestReady: Boolean(guest_ready)
            }
        });

    } catch (error) {
        console.error('Error getting ready state:', error);
        res.status(500).json({
            success: false,
            message: "Failed to get ready state",
            error: error.message
        });
    }
};

// Add these new functions for battle status

export const updateBattleStatus = async (req, res) => {
    try {
        const { lobby_code, battle_started } = req.body;

        if (!lobby_code) {
            return res.status(400).json({
                success: false,
                message: "Missing lobby code"
            });
        }

        // Get latest invitation for this lobby
        const [invitations] = await pool.query(
            `SELECT id FROM battle_invitations 
            WHERE lobby_code = ? 
            ORDER BY created_at DESC LIMIT 1`,
            [lobby_code]
        );

        if (invitations.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lobby not found"
            });
        }

        const invitationId = invitations[0].id;

        // Update battle_started status
        const query = `
            UPDATE battle_invitations 
            SET battle_started = ?
            WHERE id = ?
        `;

        const [result] = await pool.query(query, [
            battle_started ? 1 : 0,
            invitationId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Failed to update battle status"
            });
        }

        res.json({
            success: true,
            message: `Battle status updated successfully`,
            data: {
                lobby_code,
                battle_started
            }
        });

    } catch (error) {
        console.error('Error updating battle status:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update battle status",
            error: error.message
        });
    }
};

export const getBattleStatus = async (req, res) => {
    try {
        const { lobby_code } = req.params;

        if (!lobby_code) {
            return res.status(400).json({
                success: false,
                message: "Missing lobby code"
            });
        }

        // Get latest invitation for this lobby
        const [invitations] = await pool.query(
            `SELECT battle_started 
            FROM battle_invitations 
            WHERE lobby_code = ? 
            ORDER BY created_at DESC LIMIT 1`,
            [lobby_code]
        );

        if (invitations.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lobby not found"
            });
        }

        const { battle_started } = invitations[0];

        res.json({
            success: true,
            data: {
                battle_started: Boolean(battle_started)
            }
        });

    } catch (error) {
        console.error('Error getting battle status:', error);
        res.status(500).json({
            success: false,
            message: "Failed to get battle status",
            error: error.message
        });
    }
};

export const updateDifficulty = async (req, res) => {
    try {
        const { lobby_code, difficulty } = req.body;

        if (!lobby_code || !difficulty) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const query = `
            UPDATE battle_invitations 
            SET selected_difficulty = ?
            WHERE lobby_code = ? 
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const [result] = await pool.query(query, [difficulty, lobby_code]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Lobby not found"
            });
        }

        res.json({
            success: true,
            message: "Difficulty updated successfully",
            data: { difficulty }
        });

    } catch (error) {
        console.error('Error updating difficulty:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update difficulty",
            error: error.message
        });
    }
};

export const getDifficulty = async (req, res) => {
    try {
        const { lobby_code } = req.params;

        const query = `
            SELECT selected_difficulty 
            FROM battle_invitations 
            WHERE lobby_code = ? 
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const [results] = await pool.query(query, [lobby_code]);

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lobby not found"
            });
        }

        res.json({
            success: true,
            data: {
                difficulty: results[0].selected_difficulty
            }
        });

    } catch (error) {
        console.error('Error getting difficulty:', error);
        res.status(500).json({
            success: false,
            message: "Failed to get difficulty",
            error: error.message
        });
    }
};

// Create a new battle invitation
export const createInvitation = async (req, res) => {
    const {
        lobby_code,
        sender_id,
        sender_username,
        sender_level,
        receiver_id,
        receiver_username,
        receiver_level,
        status,
        question_types,
        study_material_title,
        host_ready,
        guest_ready,
        battle_started,
        selected_difficulty
    } = req.body;

    // Validate required fields
    if (!lobby_code || !sender_id || !receiver_id || !sender_username || !receiver_username) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    const connection = await pool.getConnection();

    try {
        // Check for existing invitations that are not declined
        const [existingInvitation] = await connection.execute(
            `SELECT * FROM battle_invitations 
             WHERE lobby_code = ? AND sender_id = ? AND receiver_id = ? AND status != 'declined'`,
            [lobby_code, sender_id, receiver_id]
        );

        if (existingInvitation.length > 0) {
            return res.status(400).json({
                success: false,
                message: "An invitation already exists for this lobby and user"
            });
        }

        // Delete any existing declined invitations
        await connection.execute(
            `DELETE FROM battle_invitations 
             WHERE lobby_code = ? AND sender_id = ? AND receiver_id = ? AND status = 'declined'`,
            [lobby_code, sender_id, receiver_id]
        );

        // Convert question_types array to JSON string
        const questionTypesJson = JSON.stringify(question_types || []);

        // Insert the invitation
        const [result] = await connection.execute(
            `INSERT INTO battle_invitations (
                sender_id, sender_username, sender_level, 
                receiver_id, receiver_username, receiver_level, 
                lobby_code, status, question_types, 
                study_material_title, host_ready, guest_ready, 
                battle_started, selected_difficulty
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sender_id,
                sender_username,
                sender_level || 1,
                receiver_id,
                receiver_username,
                receiver_level || 1,
                lobby_code,
                status || "pending",
                questionTypesJson,
                study_material_title || null,
                host_ready !== undefined ? host_ready : 1,
                guest_ready !== undefined ? guest_ready : 0,
                battle_started !== undefined ? battle_started : 0,
                selected_difficulty || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Battle invitation created successfully",
            data: {
                id: result.insertId,
                lobby_code,
                sender_id,
                receiver_id,
                status: status || "pending"
            }
        });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({
            success: false,
            message: "Error creating battle invitation"
        });
    } finally {
        connection.release();
    }
};

// Update invitation status (accept/decline)
export const updateInvitationStatus = async (req, res) => {
    const { lobby_code, sender_id, receiver_id, status } = req.body;

    // Validate required fields
    if (!lobby_code || !sender_id || !receiver_id || !status) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    // Validate status
    if (!['accepted', 'declined', 'pending', 'expired'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status value"
        });
    }

    const connection = await pool.getConnection();

    try {
        // Update the invitation status
        const [result] = await connection.execute(
            `UPDATE battle_invitations 
             SET status = ?
             ${status === 'accepted' ? ', guest_ready = 1' : ''}
             WHERE lobby_code = ? AND sender_id = ? AND receiver_id = ?`,
            [status, lobby_code, sender_id, receiver_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `Battle invitation ${status} successfully`
        });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating battle invitation status"
        });
    } finally {
        connection.release();
    }
};

// Get all pending invitations for a user
export const getPendingInvitations = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });
    }

    const connection = await pool.getConnection();

    try {
        // Get all pending invitations
        const [invitations] = await connection.execute(
            `SELECT bi.*, ui.username as sender_username, ui.level as sender_level, ui.display_picture as sender_display_picture
             FROM battle_invitations bi
             LEFT JOIN user_info ui ON bi.sender_id = ui.firebase_uid
             WHERE bi.receiver_id = ? AND bi.status = 'pending'`,
            [userId]
        );

        // Format the invitations
        const formattedInvitations = invitations.map(invitation => {
            // Parse the question_types JSON string
            try {
                invitation.question_types = JSON.parse(invitation.question_types);
            } catch (e) {
                invitation.question_types = [];
            }

            // Add sender info
            invitation.sender_info = {
                username: invitation.sender_username,
                level: invitation.sender_level,
                display_picture: invitation.sender_display_picture
            };

            return invitation;
        });

        res.status(200).json({
            success: true,
            data: formattedInvitations
        });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching pending invitations"
        });
    } finally {
        connection.release();
    }
};
