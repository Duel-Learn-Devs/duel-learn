import { Server } from "socket.io";
import { pool } from "./config/db.js";

let io;

const setupSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 60000,
        connectTimeout: 5000,
        transports: ['websocket', 'polling'],
        // Add error handling and reconnection logic
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    // Store active user connections
    const activeUsers = new Map();

    // Handle server-side socket errors
    io.on("connect_error", (err) => {
        console.log(`Connection error due to ${err.message}`);
    });

    io.on("connection", (socket) => {
        console.log("🔌 New client connected:", socket.id);

        // Add user to a room based on their firebase_uid
        socket.on("setup", (userId) => {
            if (!userId) {
                console.error("Invalid userId in setup");
                return;
            }

            // Store the user's socket mapping
            activeUsers.set(userId, socket.id);
            socket.userId = userId; // Store uid in socket for easy access

            socket.join(userId);
            console.log("👤 User joined room:", userId);
        });

        // Handle friend requests with improved error handling and logging
        socket.on("sendFriendRequest", (data) => {
            try {
                const { sender_id, receiver_id, senderUsername } = data;

                if (!sender_id || !receiver_id || !senderUsername) {
                    throw new Error("Missing required friend request data");
                }

                console.log("📨 New friend request:", {
                    from: senderUsername,
                    sender_id,
                    to: receiver_id
                });

                // Emit to the receiver's room
                io.to(receiver_id).emit("newFriendRequest", {
                    sender_id,
                    senderUsername
                });

                // Confirm to sender that request was sent
                socket.emit("friendRequestSent", {
                    success: true,
                    receiver_id
                });

            } catch (error) {
                console.error("Error processing friend request:", error);
                socket.emit("error", {
                    type: "friendRequest",
                    message: "Failed to send friend request",
                    details: error.message
                });
            }
        });

        // Handle friend request acceptance
        socket.on("acceptFriendRequest", (data) => {
            try {
                const { sender_id, receiver_id, senderInfo, receiverInfo } = data;

                if (!sender_id || !receiver_id || !senderInfo || !receiverInfo) {
                    throw new Error("Missing required friend acceptance data");
                }

                console.log("✅ Friend request accepted:", {
                    sender_id,
                    receiver_id
                });

                // Notify both users about the accepted friendship
                io.to(sender_id).emit("friendRequestAccepted", {
                    newFriend: receiverInfo
                });
                io.to(receiver_id).emit("friendRequestAccepted", {
                    newFriend: senderInfo
                });

            } catch (error) {
                console.error("Error processing friend acceptance:", error);
                socket.emit("error", {
                    type: "friendAcceptance",
                    message: "Failed to process friend acceptance",
                    details: error.message
                });
            }
        });

        // Handle friend request rejection
        socket.on("rejectFriendRequest", (data) => {
            try {
                const { sender_id, receiver_id } = data;

                if (!sender_id || !receiver_id) {
                    throw new Error("Missing required friend rejection data");
                }

                console.log("❌ Friend request rejected:", {
                    sender_id,
                    receiver_id
                });

                // Notify both users about the rejection
                io.to(sender_id).emit("friendRequestRejected", {
                    sender_id,
                    receiver_id
                });
                io.to(receiver_id).emit("friendRequestRejected", {
                    sender_id,
                    receiver_id
                });

            } catch (error) {
                console.error("Error processing friend rejection:", error);
                socket.emit("error", {
                    type: "friendRejection",
                    message: "Failed to process friend rejection",
                    details: error.message
                });
            }
        });

        // Handle friend removal
        socket.on("removeFriend", (data) => {
            try {
                const { sender_id, receiver_id } = data;

                if (!sender_id || !receiver_id) {
                    throw new Error("Missing required friend removal data");
                }

                console.log("❌ Friend removed:", {
                    remover_id: sender_id,
                    removed_id: receiver_id
                });

                // Notify both users about the friend removal
                io.to(sender_id).emit("friendRemoved", {
                    removedFriendId: receiver_id
                });
                io.to(receiver_id).emit("friendRemoved", {
                    removedFriendId: sender_id
                });

            } catch (error) {
                console.error("Error processing friend removal:", error);
                socket.emit("error", {
                    type: "friendRemoval",
                    message: "Failed to process friend removal",
                    details: error.message
                });
            }
        });

        // Listen for new study material creation
        socket.on("broadcast_study_material", async (data) => {
            try {
                console.log("Received study material data for broadcasting:", data);

                // Validate the data structure
                if (!data || !data.study_material_id) {
                    throw new Error("Missing study material ID");
                }

                // Fetch the complete study material data from the database
                const connection = await pool.getConnection();
                try {
                    // Get study material info
                    const [studyMaterial] = await connection.query(
                        `SELECT * FROM study_material_info WHERE study_material_id = ?`,
                        [data.study_material_id]
                    );

                    if (!studyMaterial.length) {
                        throw new Error("Study material not found");
                    }

                    // Get study material content
                    const [items] = await connection.query(
                        'SELECT * FROM study_material_content WHERE study_material_id = ? ORDER BY item_number',
                        [data.study_material_id]
                    );

                    // Parse summary and tags
                    let summary;
                    try {
                        summary = JSON.parse(studyMaterial[0].summary || '{"term":"","definition":""}');
                    } catch (e) {
                        console.error('Error parsing summary:', e);
                        summary = { term: "", definition: "" };
                    }

                    const tags = JSON.parse(studyMaterial[0].tags || '[]');

                    // Construct the complete study material object
                    const studyMaterialData = {
                        study_material_id: studyMaterial[0].study_material_id,
                        title: studyMaterial[0].title,
                        tags: tags,
                        summary: summary,
                        created_by: studyMaterial[0].created_by,
                        created_by_id: studyMaterial[0].created_by_id,
                        created_at: studyMaterial[0].created_at,
                        visibility: studyMaterial[0].visibility,
                        total_views: studyMaterial[0].total_views || 0,
                        items: items.map(item => ({
                            term: item.term,
                            definition: item.definition,
                            item_number: item.item_number,
                            image: item.image
                        }))
                    };

                    console.log("Broadcasting study material:", studyMaterialData);
                    socket.broadcast.emit("receive_study_material", studyMaterialData);

                } finally {
                    connection.release();
                }
            } catch (error) {
                console.error("Error broadcasting study material:", error);
                socket.emit("broadcast_error", { error: error.message });
            }
        });

        // Handle disconnection
        socket.on("disconnect", (reason) => {
            if (socket.userId) {
                activeUsers.delete(socket.userId);
                console.log(`👋 User ${socket.userId} disconnected (${reason})`);
            }
            console.log(`🔌 Client disconnected (${reason}):`, socket.id);
        });

        // Generic error handler
        socket.on("error", (error) => {
            console.error("Socket error for user:", socket.userId, error);
            socket.emit("error", {
                message: "An unexpected error occurred",
                details: error.message
            });
        });
    });

    // Global error handler for the io server
    io.engine.on("connection_error", (error) => {
        console.error("Connection error:", error);
    });

    return io;
};

// Add this function to get the io instance
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

export default setupSocket;
