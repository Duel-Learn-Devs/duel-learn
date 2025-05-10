import { pool } from "../config/db.js";

const formatImageToBase64 = (imageBuffer) => {
    if (!imageBuffer) return null;
    const base64String = imageBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64String}`;
};

const SearchController = {
    globalSearch: async (req, res) => {
        const { query } = req.params;
        let connection;
        // Get the current user's ID from the request if available
        const currentUserId = req.user?.firebase_uid || null;

        try {
            if (!query || query.trim() === '') {
                return res.status(400).json({ message: "Search query cannot be empty" });
            }

            connection = await pool.getConnection();

            // Fetch users with friendship status
            const [users] = await connection.execute(
                `SELECT u.firebase_uid, u.username, u.level, u.display_picture, u.exp,
                    CASE
                        WHEN fr.status = 'accepted' THEN TRUE
                        ELSE FALSE
                    END AS is_friend
                 FROM user_info u
                 LEFT JOIN (
                    SELECT sender_id, receiver_id, status 
                    FROM friend_requests 
                    WHERE (sender_id = ? OR receiver_id = ?) AND status = 'accepted'
                 ) fr ON (fr.sender_id = u.firebase_uid OR fr.receiver_id = u.firebase_uid)
                 WHERE LOWER(u.username) LIKE LOWER(?)
                 ORDER BY u.level DESC, u.username ASC 
                 LIMIT 10`,
                [currentUserId, currentUserId, `%${query}%`]
            );

            // Fetch study materials
            const [materials] = await connection.execute(
                `SELECT study_material_id, title, tags, total_items, 
                        created_by, created_by_id, total_views, created_at, status, visibility  
                 FROM study_material_info 
                 WHERE LOWER(title) LIKE LOWER(?)
                 AND status = 'active' AND visibility = 1
                 ORDER BY total_views DESC, created_at DESC
                 LIMIT 10`,
                [`%${query}%`]
            );

            res.status(200).json({
                users,
                study_materials: materials,
                query,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({ message: "Error performing search", details: error.message });
        } finally {
            if (connection) connection.release();
        }
    },

    searchUsers: async (req, res) => {
        const { query } = req.params;
        let connection;
        // Get the current user's ID from the request if available
        const currentUserId = req.user?.firebase_uid || null;

        try {
            console.log('Searching users with query:', query);

            if (!query || query.trim() === '') {
                return res.status(400).json({ message: "Search query cannot be empty" });
            }

            connection = await pool.getConnection();

            // Search users with friendship status information
            const [users] = await connection.execute(
                `SELECT u.firebase_uid, u.username, u.level, u.display_picture, u.created_at, u.exp,
                    CASE
                        WHEN fr.status = 'accepted' THEN 'friend'
                        WHEN fr.status = 'pending' AND fr.sender_id = ? THEN 'request_sent'
                        WHEN fr.status = 'pending' AND fr.receiver_id = ? THEN 'request_received'
                        ELSE 'not_friend'
                    END AS friendship_status
                 FROM user_info u
                 LEFT JOIN (
                    SELECT sender_id, receiver_id, status 
                    FROM friend_requests 
                    WHERE (sender_id = ? OR receiver_id = ?)
                 ) fr ON (
                    (fr.sender_id = ? AND fr.receiver_id = u.firebase_uid) OR 
                    (fr.sender_id = u.firebase_uid AND fr.receiver_id = ?)
                 )
                 WHERE LOWER(u.username) LIKE LOWER(?) 
                 ORDER BY u.level DESC, u.username ASC 
                 LIMIT 20`,
                [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, `%${query}%`]
            );

            // Format user data
            const formattedUsers = users.map(user => ({
                firebase_uid: user.firebase_uid,
                username: user.username,
                level: user.level || 0,
                exp: user.exp || 0,
                display_picture: user.display_picture || null,
                created_at: user.created_at,
                friendship_status: user.friendship_status || 'not_friend'
            }));

            console.log(`Found ${users.length} users matching "${query}"`);

            res.status(200).json(formattedUsers);
        } catch (error) {
            console.error("User search error:", error);
            res.status(500).json({
                message: "Error searching users",
                details: error.message || "Unknown database error"
            });
        } finally {
            if (connection) {
                try {
                    connection.release();
                } catch (err) {
                    console.error("Error releasing connection:", err);
                }
            }
        }
    },

    searchStudyMaterials: async (req, res) => {
        const { query } = req.params;
        let connection;

        try {
            console.log('Searching study materials with query:', query);

            if (!query || query.trim() === '') {
                return res.status(400).json({ message: "Search query cannot be empty" });
            }

            connection = await pool.getConnection();

            // Search study materials with simpler query for debugging
            const [materials] = await connection.execute(
                `SELECT i.study_material_id, i.title, i.tags, i.total_items,
                        i.created_by, i.created_by_id, i.total_views, i.created_at,
                        i.status, i.visibility 
                 FROM study_material_info i
                 WHERE LOWER(i.title) LIKE LOWER(?)
                 AND i.status = 'active' AND i.visibility = 1
                 ORDER BY i.total_views DESC, i.created_at DESC
                 LIMIT 20`,
                [`%${query}%`]
            );

            console.log(`Found ${materials.length} study materials matching "${query}"`);

            // Process study materials
            const studyMaterials = materials.map(info => {
                // Ensure consistent tags format
                let tags = [];
                try {
                    if (info.tags) {
                        if (typeof info.tags === 'string') {
                            tags = JSON.parse(info.tags);
                        } else if (Array.isArray(info.tags)) {
                            tags = info.tags;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing tags:', e);
                    tags = [];
                }

                return {
                    study_material_id: info.study_material_id,
                    title: info.title || '',
                    tags: tags, // Use the safely processed tags
                    total_items: info.total_items || 0,
                    created_by: info.created_by || '',
                    created_by_id: info.created_by_id || '',
                    total_views: info.total_views || 0,
                    created_at: info.created_at,
                    status: info.status || 'active',
                    visibility: info.visibility || 0,
                    items: [] // Simplified for debugging
                };
            });

            res.status(200).json(studyMaterials);
        } catch (error) {
            console.error("Study material search error:", error);
            res.status(500).json({
                message: "Error searching study materials",
                details: error.message || "Unknown database error"
            });
        } finally {
            if (connection) {
                try {
                    connection.release();
                } catch (err) {
                    console.error("Error releasing connection:", err);
                }
            }
        }
    },

    getUserWithMaterials: async (req, res) => {
        const { username } = req.params;
        let connection;
        // Get the current user's ID from the request if available
        const currentUserId = req.user?.firebase_uid || null;

        try {
            console.log('Fetching user profile and materials for:', username);

            if (!username || username.trim() === '') {
                return res.status(400).json({ message: "Username cannot be empty" });
            }

            connection = await pool.getConnection();

            // Get user profile with friendship status
            const [users] = await connection.execute(
                `SELECT u.firebase_uid, u.username, u.level, u.display_picture, u.exp,
                    CASE
                        WHEN fr.status = 'accepted' THEN 'friend'
                        WHEN fr.status = 'pending' AND fr.sender_id = ? THEN 'request_sent'
                        WHEN fr.status = 'pending' AND fr.receiver_id = ? THEN 'request_received'
                        ELSE 'not_friend'
                    END AS friendship_status
                 FROM user_info u
                 LEFT JOIN (
                    SELECT sender_id, receiver_id, status 
                    FROM friend_requests 
                    WHERE (sender_id = ? OR receiver_id = ?)
                 ) fr ON (
                    (fr.sender_id = ? AND fr.receiver_id = u.firebase_uid) OR 
                    (fr.sender_id = u.firebase_uid AND fr.receiver_id = ?)
                 )
                 WHERE u.username = ?
                 LIMIT 1`,
                [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, username]
            );

            if (users.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            const user = {
                firebase_uid: users[0].firebase_uid,
                username: users[0].username,
                level: users[0].level || 0,
                exp: users[0].exp || 0,
                display_picture: users[0].display_picture,
                created_at: users[0].created_at,
                friendship_status: users[0].friendship_status || 'not_friend'
            };

            // Get user's study materials (this part remains unchanged)
            const [materials] = await connection.execute(
                `SELECT study_material_id, title, tags, total_items, 
                        created_by, created_by_id, total_views, created_at,
                        status, visibility  
                 FROM study_material_info 
                 WHERE created_by = ? AND status = 'active' AND visibility = 1
                 ORDER BY created_at DESC`,
                [username]
            );

            // Process study materials (no changes needed here)
            const studyMaterials = materials.map(info => {
                // Ensure consistent tags format
                let tags = [];
                try {
                    if (info.tags) {
                        if (typeof info.tags === 'string') {
                            tags = JSON.parse(info.tags);
                        } else if (Array.isArray(info.tags)) {
                            tags = info.tags;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing tags:', e);
                    tags = [];
                }

                return {
                    study_material_id: info.study_material_id,
                    title: info.title || '',
                    tags: tags, // Use the safely processed tags
                    total_items: info.total_items || 0,
                    created_by: info.created_by || '',
                    created_by_id: info.created_by_id || '',
                    total_views: info.total_views || 0,
                    created_at: info.created_at,
                    status: info.status || 'active',
                    visibility: info.visibility || 0,
                    items: [] // We'll keep this simple for now to avoid heavy queries
                };
            });

            res.status(200).json({
                user,
                study_materials: studyMaterials,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error fetching user profile and materials:", error);
            res.status(500).json({
                message: "Error fetching user profile and materials",
                details: error.message
            });
        } finally {
            if (connection) connection.release();
        }
    },

    checkFriendshipStatus: async (req, res) => {
        const { currentUserId, targetUserId } = req.params;
        let connection;

        try {
            if (!currentUserId || !targetUserId) {
                return res.status(400).json({ message: "Both user IDs are required" });
            }

            connection = await pool.getConnection();

            // Check direct friendship status
            const [friendshipStatus] = await connection.execute(
                `SELECT status FROM friend_requests 
                 WHERE (sender_id = ? AND receiver_id = ?) 
                 OR (sender_id = ? AND receiver_id = ?)
                 LIMIT 1`,
                [currentUserId, targetUserId, targetUserId, currentUserId]
            );

            // Check mutual friends
            const [mutualFriends] = await connection.execute(
                `SELECT ui.firebase_uid, ui.username, ui.level, ui.display_picture
                 FROM friend_requests fr1
                 JOIN friend_requests fr2 ON fr1.receiver_id = fr2.sender_id OR fr1.receiver_id = fr2.receiver_id OR
                                           fr1.sender_id = fr2.sender_id OR fr1.sender_id = fr2.receiver_id
                 JOIN user_info ui ON (ui.firebase_uid = fr1.receiver_id OR ui.firebase_uid = fr1.sender_id) AND
                                      ui.firebase_uid != ? AND ui.firebase_uid != ?
                 WHERE fr1.status = 'accepted' AND fr2.status = 'accepted' AND
                       ((fr1.sender_id = ? AND fr1.receiver_id != ?) OR (fr1.receiver_id = ? AND fr1.sender_id != ?)) AND
                       ((fr2.sender_id = ? AND fr2.receiver_id != ?) OR (fr2.receiver_id = ? AND fr2.sender_id != ?))
                 GROUP BY ui.firebase_uid
                 ORDER BY ui.level DESC
                 LIMIT 5`,
                [currentUserId, targetUserId,
                    currentUserId, targetUserId, currentUserId, targetUserId,
                    targetUserId, currentUserId, targetUserId, currentUserId]
            );

            // Get mutual friends count
            const [mutualCount] = await connection.execute(
                `SELECT COUNT(DISTINCT ui.firebase_uid) as count
                 FROM friend_requests fr1
                 JOIN friend_requests fr2 ON fr1.receiver_id = fr2.sender_id OR fr1.receiver_id = fr2.receiver_id OR
                                           fr1.sender_id = fr2.sender_id OR fr1.sender_id = fr2.receiver_id
                 JOIN user_info ui ON (ui.firebase_uid = fr1.receiver_id OR ui.firebase_uid = fr1.sender_id) AND
                                      ui.firebase_uid != ? AND ui.firebase_uid != ?
                 WHERE fr1.status = 'accepted' AND fr2.status = 'accepted' AND
                       ((fr1.sender_id = ? AND fr1.receiver_id != ?) OR (fr1.receiver_id = ? AND fr1.sender_id != ?)) AND
                       ((fr2.sender_id = ? AND fr2.receiver_id != ?) OR (fr2.receiver_id = ? AND fr2.sender_id != ?))`,
                [currentUserId, targetUserId,
                    currentUserId, targetUserId, currentUserId, targetUserId,
                    targetUserId, currentUserId, targetUserId, currentUserId]
            );

            const isFriend = friendshipStatus.length > 0 && friendshipStatus[0].status === 'accepted';
            const isPending = friendshipStatus.length > 0 && friendshipStatus[0].status === 'pending';
            const status = isFriend ? 'friend' : (isPending ? 'pending' : 'not_friend');

            res.status(200).json({
                friendship_status: status,
                mutual_friends: {
                    count: mutualCount[0].count || 0,
                    list: mutualFriends
                }
            });

        } catch (error) {
            console.error("Error checking friendship status:", error);
            res.status(500).json({
                message: "Error checking friendship status",
                details: error.message || "Unknown database error"
            });
        } finally {
            if (connection) connection.release();
        }
    },

    // Add this new method to FriendRequestController
    getUserById: async (req, res) => {
        const { userId } = req.params;
        const connection = await pool.getConnection();

        try {
            console.log(`Getting user info by ID: ${userId}`);

            const [userInfo] = await connection.execute(
                `SELECT * FROM user_info WHERE firebase_uid = ?`,
                [userId]
            );

            if (userInfo.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            // Return the user info
            res.status(200).json(userInfo[0]);
        } catch (error) {
            console.error("Error getting user info:", error);
            res.status(500).json({ message: "Error retrieving user information" });
        } finally {
            connection.release();
        }
    },
};

export default SearchController;