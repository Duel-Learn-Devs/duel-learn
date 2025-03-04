import { Server } from "socket.io";

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
        socket.on("newStudyMaterial", (data) => {
            try {
                if (!data || !data.content) {
                    throw new Error("Invalid study material data");
                }

                console.log("📚 New study material received:", data);
                io.emit("broadcastStudyMaterial", data);
            } catch (error) {
                console.error("Error broadcasting study material:", error);
                socket.emit("error", {
                    type: "studyMaterial",
                    message: "Failed to broadcast study material",
                    details: error.message
                });
            }
        });

        // Handle email action results
        socket.on("emailActionResult", (data) => {
            try {
                if (!data || !data.mode) {
                    throw new Error("Invalid email action result data");
                }

                console.log("📧 Email action result:", data);
                
                // Broadcast to all connected clients
                io.emit("emailActionResult", data);
            } catch (error) {
                console.error("Error handling email action result:", error);
                socket.emit("error", {
                    type: "emailAction",
                    message: "Failed to process email action result",
                    details: error.message
                });
            }
        });

        // Handle password reset success
        socket.on("passwordResetSuccess", () => {
            try {
                console.log("🔑 Password reset success");
                io.emit("passwordResetSuccess");
            } catch (error) {
                console.error("Error handling password reset success:", error);
                socket.emit("error", {
                    type: "passwordReset",
                    message: "Failed to process password reset success",
                    details: error.message
                });
            }
        });

        // Handle email verification success
        socket.on("emailVerifiedSuccess", () => {
            try {
                console.log("✅ Email verification success");
                io.emit("emailVerifiedSuccess");
            } catch (error) {
                console.error("Error handling email verification success:", error);
                socket.emit("error", {
                    type: "emailVerification",
                    message: "Failed to process email verification success",
                    details: error.message
                });
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
