import { pool } from "../config/db.js";
import NodeCache from "node-cache";

const shopCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const invalidateShopCaches = (firebase_uid) => {
    shopCache.del('shop_items');

    if (firebase_uid) {
        shopCache.del(`user_items_${firebase_uid}`);
    }

    // Clear any cache keys related to the user
    const allKeys = shopCache.keys();
    allKeys.forEach(key => {
        if (key.includes(firebase_uid)) {
            shopCache.del(key);
        }
    });
};

const checkAndUpdateExpiredItems = async (connection, firebase_uid) => {
    const now = new Date();
    try {
        // Find items that are active but have expired
        const [expiredItems] = await connection.query(
            "SELECT item_code FROM user_items WHERE firebase_uid = ? AND status = 'active' AND duration_ends_at < ?",
            [firebase_uid, now]
        );

        if (expiredItems.length > 0) {
            console.log(`Found ${expiredItems.length} expired items for user ${firebase_uid}`);

            // Update all expired items to status "expired"
            await connection.query(
                "UPDATE user_items SET status = 'expired' WHERE firebase_uid = ? AND status = 'active' AND duration_ends_at < ?",
                [firebase_uid, now]
            );

            // If reward multiplier expired, reset it in user_info table
            await connection.query(
                "UPDATE user_info SET reward_multiplier = 1.0 WHERE firebase_uid = ? AND reward_multiplier_expiry < ?",
                [firebase_uid, now]
            );

            return true; // Items were updated
        }
        return false; // No items needed updating
    } catch (error) {
        console.error("Error checking expired items:", error);
        throw error;
    }
};

const shopController = {

    getShopItems: async (req, res) => {
        try {
            // Check cache first
            const cachedItems = shopCache.get('shop_items');
            // Skip cache if timestamp parameter exists (for forced refresh)
            const skipCache = req.query.timestamp !== undefined;

            if (cachedItems && !skipCache) {
                return res.status(200).json(cachedItems);
            }

            const [rows] = await pool.query("SELECT item_code, item_name, item_description, item_effect, item_price, item_picture_url FROM shop_items");

            // Cache the result
            shopCache.set('shop_items', rows, 1800); // Cache for 30 minutes

            res.status(200).json(rows);
        } catch (error) {
            console.error("Error executing query: ", error);
            res.status(500).json({ message: "Error executing query" });
        }
    },

    getUserItem: async (req, res) => {
        const { firebase_uid } = req.params;

        try {
            // Check cache first
            const cacheKey = `user_items_${firebase_uid}`;
            const cachedItems = shopCache.get(cacheKey);
            // Skip cache if timestamp parameter exists
            const skipCache = req.query.timestamp !== undefined;

            if (cachedItems && !skipCache) {
                return res.status(200).json(cachedItems);
            }

            // Modified query to include quantity and join with shop_items to get all needed info
            const [rows] = await pool.query(
                `SELECT ui.firebase_uid, ui.item_code, ui.quantity, si.item_name, si.item_effect, si.item_description, si.item_price, si.item_picture_url
                 FROM user_items ui
                 JOIN shop_items si ON ui.item_code = si.item_code
                 WHERE ui.firebase_uid = ?`,
                [firebase_uid]
            );

            // Cache the results
            shopCache.set(cacheKey, rows, 300); // Cache for 5 minutes

            res.json(rows);
        } catch (error) {
            console.error("Error executing query: ", error);
            res.status(500).json({ message: "Error executing query" });
        }
    },

    buyShopItem: async (req, res) => {
        const { firebase_uid, username, item_code, item_price, quantity = 1 } = req.body;

        try {
            // Start a transaction
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // Get item details from shop_items
                const [itemResult] = await connection.query(
                    "SELECT item_code, item_name, item_price FROM shop_items WHERE item_code = ?",
                    [item_code]
                );

                if (itemResult.length === 0) {
                    await connection.rollback();
                    connection.release();
                    return res.status(404).json({ message: "Item not found" });
                }

                const item = itemResult[0];
                const itemPrice = item.item_price;

                // Calculate total price based on quantity
                const totalPrice = itemPrice * quantity;

                // Check if user has enough coins
                const [userResult] = await connection.query(
                    "SELECT coins FROM user_info WHERE firebase_uid = ?",
                    [firebase_uid]
                );

                if (userResult.length === 0) {
                    await connection.rollback();
                    connection.release();
                    return res.status(404).json({ message: "User not found" });
                }

                const userCoins = userResult[0].coins;

                if (userCoins < totalPrice) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({
                        message: "Insufficient coins",
                        required: totalPrice,
                        available: userCoins
                    });
                }

                // Update user coins with total price
                const newCoinBalance = userCoins - totalPrice;
                await connection.query(
                    "UPDATE user_info SET coins = ? WHERE firebase_uid = ?",
                    [newCoinBalance, firebase_uid]
                );

                // Check if the user already has this item in inventory
                const [existingItem] = await connection.query(
                    "SELECT * FROM user_items WHERE firebase_uid = ? AND item_code = ?",
                    [firebase_uid, item_code]
                );

                if (existingItem.length > 0) {
                    // Update existing item quantity
                    await connection.query(
                        "UPDATE user_items SET quantity = quantity + ? WHERE firebase_uid = ? AND item_code = ?",
                        [quantity, firebase_uid, item_code]
                    );
                } else {
                    // Insert with the correct parameter order and all required fields
                    await connection.query(
                        "INSERT INTO user_items (firebase_uid, username, item_code, item_name, item_price, quantity) VALUES (?, ?, ?, ?, ?, ?)",
                        [firebase_uid, username, item_code, item.item_name, itemPrice, quantity,]
                    );
                }

                // ADDED: Special handling for Tech Pass - Update tech_pass count in user_info table
                if (item_code === "ITEM002TP") {
                    await connection.query(
                        "UPDATE user_info SET tech_pass = tech_pass + ? WHERE firebase_uid = ?",
                        [quantity, firebase_uid]
                    );

                    // Get updated tech_pass count
                    const [updatedUserInfo] = await connection.query(
                        "SELECT tech_pass FROM user_info WHERE firebase_uid = ?",
                        [firebase_uid]
                    );

                    await connection.commit();
                    connection.release();

                    // Invalidate cache
                    invalidateShopCaches(firebase_uid);

                    // Return the updated coin balance, purchase details, and tech_pass count
                    return res.status(200).json({
                        message: "Item bought successfully",
                        remainingCoins: newCoinBalance,
                        quantityPurchased: quantity,
                        totalPrice: totalPrice,
                        tech_pass: updatedUserInfo[0].tech_pass // Include tech_pass in the response
                    });
                }

                await connection.commit();
                connection.release();

                // Invalidate cache
                invalidateShopCaches(firebase_uid);

                // Return the updated coin balance and purchase details
                res.status(200).json({
                    message: "Item bought successfully",
                    remainingCoins: newCoinBalance,
                    quantityPurchased: quantity,
                    totalPrice: totalPrice
                });

            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
        } catch (error) {
            console.error("Error executing query: ", error);
            res.status(500).json({ message: "Error executing query" });
        }
    },

    useUserTechPass: async (req, res) => {
        const { firebase_uid, techPassCount } = req.params;
        const passesToDeduct = parseInt(techPassCount) || 1; // Default to 1 if not provided

        try {
            // First check if user is premium
            const [userInfo] = await pool.query(
                "SELECT tech_pass, account_type FROM user_info WHERE firebase_uid = ?",
                [firebase_uid]
            );

            if (!userInfo.length) {
                return res.status(404).json({ message: "User not found" });
            }

            const isPremium = userInfo[0].account_type === "premium";

            // If user is premium, just return success without checking or decrementing tech passes
            if (isPremium) {
                return res.json({
                    message: "Feature used successfully! (Premium benefit: No Tech Pass consumed)",
                    isPremium: true
                });
            }

            // For non-premium users, verify they have enough tech passes
            if (userInfo[0].tech_pass < passesToDeduct) {
                return res.status(400).json({
                    message: `You need ${passesToDeduct} Tech Passes but only have ${userInfo[0].tech_pass}!`
                });
            }

            // Process tech pass usage for non-premium users
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // Always update the tech_pass count in user_info table
                await connection.query(
                    "UPDATE user_info SET tech_pass = tech_pass - ? WHERE firebase_uid = ?",
                    [passesToDeduct, firebase_uid]
                );

                // Check if user has the tech pass item in their inventory
                const [userItemResult] = await connection.query(
                    "SELECT quantity FROM user_items WHERE firebase_uid = ? AND item_code = 'ITEM002TP'",
                    [firebase_uid]
                );

                // Only update user_items if the user has the item in their inventory
                if (userItemResult.length > 0) {
                    if (userItemResult[0].quantity >= passesToDeduct) {
                        // If quantity is greater than what we're deducting, update it
                        await connection.query(
                            "UPDATE user_items SET quantity = quantity - ? WHERE firebase_uid = ? AND item_code = 'ITEM002TP'",
                            [passesToDeduct, firebase_uid]
                        );
                    } else if (userItemResult[0].quantity > 0) {
                        // If quantity is less than what we're deducting but greater than 0, set to 0
                        await connection.query(
                            "UPDATE user_items SET quantity = 0 WHERE firebase_uid = ? AND item_code = 'ITEM002TP'",
                            [firebase_uid]
                        );
                    }
                    // If quantity is 0, no need to update
                }
                const [updatedUserInfo] = await connection.query(
                    "SELECT tech_pass FROM user_info WHERE firebase_uid = ?",
                    [firebase_uid]
                );


                await connection.commit();
                connection.release();

                // Invalidate cache
                invalidateShopCaches(firebase_uid);

                res.json({
                    message: `${passesToDeduct} Tech Pass(es) used successfully!`,
                    isPremium: false,
                    techPassesUsed: passesToDeduct,
                    updatedTechPassCount: updatedUserInfo[0].tech_pass  // Add this

                });
            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
        }
        catch (error) {
            console.error("Error executing query: ", error);
            res.status(500).json({ message: "Error executing query" });
        }
    },
    useItem: async (req, res) => {
        const { firebase_uid, item_code } = req.body;

        try {
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                console.log(`Using item ${item_code} for user ${firebase_uid}`);

                // Check if user has the item
                const [userItemResult] = await connection.query(
                    "SELECT quantity FROM user_items WHERE firebase_uid = ? AND item_code = ?",
                    [firebase_uid, item_code]
                );

                if (userItemResult.length === 0 || userItemResult[0].quantity < 1) {
                    await connection.rollback();
                    connection.release();
                    return res.status(404).json({ message: "Item not found in your inventory" });
                }

                // Get item effect info
                const [itemResult] = await connection.query(
                    "SELECT item_name, item_effect FROM shop_items WHERE item_code = ?",
                    [item_code]
                );
                console.log("Item result:", itemResult);

                if (itemResult.length === 0) {
                    await connection.rollback();
                    connection.release();
                    return res.status(404).json({ message: "Item not found" });
                }

                // Store the actual item name for later use
                const item_name = itemResult[0].item_name;

                // Parse item_effect to determine effect type and value
                let effect_type = "none";
                let effect_value = null;

                try {
                    // Handle different formats of item_effect
                    if (itemResult[0].item_effect) {
                        if (typeof itemResult[0].item_effect === 'string') {
                            // Try to parse JSON string
                            if (itemResult[0].item_effect.trim().startsWith('{')) {
                                const effectData = JSON.parse(itemResult[0].item_effect);
                                effect_type = effectData.type || 'none';
                                effect_value = effectData.value;
                            } else {
                                // Simple string format (legacy support)
                                effect_type = itemResult[0].item_effect;
                            }
                        } else if (typeof itemResult[0].item_effect === 'object') {
                            // Direct object format
                            effect_type = itemResult[0].item_effect.type || 'none';
                            effect_value = itemResult[0].item_effect.value;
                        }
                    }
                } catch (err) {
                    console.error("Error parsing item_effect:", err);
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({
                        message: "Invalid item effect format",
                        error: err.message
                    });
                }

                console.log(`Determined effect - Type: ${effect_type}, Value: ${effect_value}`);

                let updateQuery = "";
                let updateValues = [];
                let resultMessage = `Used ${item_name} successfully!`;

                // Apply different effects based on the item type
                switch (effect_type) {
                    case "max_mana":
                        // First check if mana is already at maximum
                        const [currentMana] = await connection.query(
                            "SELECT mana FROM user_info WHERE firebase_uid = ?",
                            [firebase_uid]
                        );

                        if (currentMana.length > 0 && currentMana[0].mana >= 200) {
                            await connection.rollback();
                            connection.release();
                            return res.status(400).json({
                                message: "Your mana is already full!"
                            });
                        }

                        // Set mana to maximum (200) only if not already at max
                        updateQuery = "UPDATE user_info SET mana = 200 WHERE firebase_uid = ?";
                        updateValues = [firebase_uid];
                        resultMessage = `Mana fully restored with ${item_name}!`;
                        break;

                    case "tech_pass":
                        // Don't perform any database query, just return a message
                        updateQuery = "SELECT 1"; // Dummy query that does nothing
                        updateValues = [];
                        resultMessage = "Scan a material";
                        break;

                    case "starter_pack":

                        // Update user stats
                        updateQuery = "UPDATE user_info SET coins = coins + 500, exp = exp + 500, mana = 200 WHERE firebase_uid = ?";
                        updateValues = [firebase_uid];

                        // First check if the user already has a Fortune Coin
                        const [existingFortuneCoin] = await connection.query(
                            "SELECT item_code, quantity FROM user_items WHERE firebase_uid = ? AND item_code = 'ITEM004FC'",
                            [firebase_uid]
                        );

                        if (existingFortuneCoin.length > 0) {
                            // User already has Fortune Coins, increment quantity
                            await connection.query(
                                "UPDATE user_items SET quantity = quantity + 1 WHERE firebase_uid = ? AND item_code = 'ITEM004FC'",
                                [firebase_uid]
                            );
                            console.log(`Updated fortune coin count for user ${firebase_uid}`);
                        } else {
                            // User does not have Fortune Coins yet, insert new row
                            await connection.query(
                                `INSERT INTO user_items (firebase_uid, username, item_code, item_name, item_price, quantity, total_price) 
                                     SELECT ?, 
                                        (SELECT username FROM user_info WHERE firebase_uid = ?), 
                                        'ITEM004FC', 
                                        (SELECT item_name FROM shop_items WHERE item_code = 'ITEM004FC'), 
                                        (SELECT item_price FROM shop_items WHERE item_code = 'ITEM004FC'), 
                                        1, 
                                        (SELECT item_price FROM shop_items WHERE item_code = 'ITEM004FC')`,
                                [firebase_uid, firebase_uid]
                            );
                            console.log(`Added first fortune coin for user ${firebase_uid}`);
                        }

                        resultMessage = `${item_name} applied! You got 500 coins, 500 exp, full mana, and 1 Fortune Coin added to your inventory!`;
                        break;

                    case "reward_multiplier":
                        // First check if user already has an active reward multiplier
                        const [activeMultiplier] = await connection.query(
                            "SELECT reward_multiplier, reward_multiplier_expiry FROM user_info WHERE firebase_uid = ? AND reward_multiplier > 1 AND reward_multiplier_expiry > NOW()",
                            [firebase_uid]
                        );

                        if (activeMultiplier.length > 0) {
                            // Calculate remaining time
                            const now = new Date();
                            const expiryTime = new Date(activeMultiplier[0].reward_multiplier_expiry);
                            const remainingHours = Math.ceil((expiryTime - now) / (1000 * 60 * 60));

                            await connection.rollback();
                            connection.release();
                            return res.status(400).json({
                                message: `You already have an active reward multiplier (${activeMultiplier[0].reward_multiplier}x) that expires in ${remainingHours} hours.`
                            });
                        }

                        // Get current timestamp
                        const now = new Date();
                        // Default duration 24 hours and multiplier value if not specified
                        const durationHours = effect_value?.duration || 24;
                        const multiplierValue = effect_value?.multiplier || 2;

                        // Calculate end time
                        const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

                        // Define the update query for user_info table
                        updateQuery = "UPDATE user_info SET reward_multiplier = ?, reward_multiplier_expiry = ? WHERE firebase_uid = ?";
                        updateValues = [multiplierValue, endTime, firebase_uid];

                        // Also update the duration info in the user_items table for this item
                        await connection.query(
                            "UPDATE user_items SET status = ?, duration = ?, duration_starts_at = ?, duration_ends_at = ? WHERE firebase_uid = ? AND item_code = ?",
                            ["active", durationHours.toString(), now, endTime, firebase_uid, item_code]
                        );

                        resultMessage = `${item_name} activated! Your rewards are now multiplied by ${multiplierValue}x for the next ${durationHours} hours.`;
                        break;

                    case "prevent_loss":
                        // First, check if user already has an active fortune coin
                        const [activeFortuneCoin] = await connection.query(
                            "SELECT id FROM user_items WHERE firebase_uid = ? AND item_code = 'ITEM004FC' AND status = 'active'",
                            [firebase_uid]
                        );

                        if (activeFortuneCoin.length > 0) {
                            await connection.rollback();
                            connection.release();
                            return res.status(400).json({
                                message: "You already have an active Fortune Coin!"
                            });
                        }

                        // Modified: Get full item details including id
                        const [fortuneCoinItem] = await connection.query(
                            "SELECT id FROM user_items WHERE firebase_uid = ? AND item_code = ?",
                            [firebase_uid, item_code]
                        );

                        if (fortuneCoinItem.length === 0) {
                            await connection.rollback();
                            connection.release();
                            return res.status(404).json({
                                message: "Fortune Coin not found in your inventory"
                            });
                        }

                        // Set the status to active
                        updateQuery = "UPDATE user_items SET status = 'active' WHERE firebase_uid = ? AND item_code = ?";
                        updateValues = [firebase_uid, item_code];

                        resultMessage = `${item_name} activated! Your win streak is now protected from the next loss!`;
                        break;

                    default:
                        await connection.rollback();
                        connection.release();
                        return res.status(400).json({
                            message: `Unknown item effect: ${effect_type}`,
                            item: itemResult[0]
                        });
                }

                console.log(`Executing query: ${updateQuery} with values:`, updateValues);

                // Apply the effect
                await connection.query(updateQuery, updateValues);

                // Update the user item quantity
                if (userItemResult[0].quantity > 1) {
                    // Decrement quantity if more than 1
                    await connection.query(
                        "UPDATE user_items SET quantity = quantity - 1 WHERE firebase_uid = ? AND item_code = ?",
                        [firebase_uid, item_code]
                    );
                } else {
                    // Set quantity to 0 instead of deleting
                    await connection.query(
                        "UPDATE user_items SET quantity = 0 WHERE firebase_uid = ? AND item_code = ?",
                        [firebase_uid, item_code]
                    );
                }

                // Get updated user info to return
                const [updatedUserInfo] = await connection.query(
                    "SELECT mana, coins, exp, tech_pass FROM user_info WHERE firebase_uid = ?",
                    [firebase_uid]
                );

                await connection.commit();
                connection.release();

                // Invalidate cache
                invalidateShopCaches(firebase_uid);

                res.json({
                    message: resultMessage,
                    updatedStats: updatedUserInfo[0] || {}
                });

            } catch (error) {
                console.error("Error in transaction:", error);
                await connection.rollback();
                connection.release();
                throw error;
            }
        } catch (error) {
            console.error("Error executing query: ", error);
            res.status(500).json({
                message: "Error executing query",
                error: error.message
            });
        }
    },

    getUserActiveItems: async (req, res) => {
        const { firebase_uid, item_code } = req.params;

        try {
            const connection = await pool.getConnection();

            try {
                // Check for active items of the specified type
                const [activeItems] = await connection.query(
                    "SELECT id, status FROM user_items WHERE firebase_uid = ? AND item_code = ? AND status = 'active'",
                    [firebase_uid, item_code]
                );

                connection.release();

                if (activeItems.length > 0) {
                    return res.status(200).json({
                        active: true,
                        id: activeItems[0].id
                    });
                } else {
                    return res.status(200).json({
                        active: false
                    });
                }
            } catch (error) {
                connection.release();
                throw error;
            }
        } catch (error) {
            console.error("Error checking active items:", error);
            res.status(500).json({ message: "Error checking active items" });
        }
    },

    useFortuneCoins: async (req, res) => {
        const { firebase_uid, item_id } = req.body;

        try {
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // Mark the fortune coin as used (not active anymore)
                await connection.query(
                    "UPDATE user_items SET status = 'used' WHERE firebase_uid = ? AND id = ?",
                    [firebase_uid, item_id]
                );

                await connection.commit();
                connection.release();

                // Invalidate cache
                invalidateShopCaches(firebase_uid);

                res.status(200).json({
                    message: "Fortune Coin used successfully to protect win streak!"
                });
            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
        } catch (error) {
            console.error("Error using Fortune Coin:", error);
            res.status(500).json({ message: "Error using Fortune Coin" });
        }
    },

    deductTechPassForCrossReference: async (req, res) => {
        const { firebase_uid } = req.body;

        try {
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // Check if user has enough tech passes in user_info table
                const [userInfo] = await connection.query(
                    "SELECT tech_pass FROM user_info WHERE firebase_uid = ?",
                    [firebase_uid]
                );

                console.log('User tech pass info:', {
                    firebase_uid,
                    userInfo,
                    techPassCount: userInfo[0]?.tech_pass
                });

                if (!userInfo.length || userInfo[0].tech_pass < 1) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({
                        success: false,
                        message: "Insufficient tech passes",
                        currentTechPasses: userInfo[0]?.tech_pass || 0
                    });
                }

                // Deduct one tech pass from user_info table
                await connection.query(
                    "UPDATE user_info SET tech_pass = tech_pass - 1 WHERE firebase_uid = ?",
                    [firebase_uid]
                );

                await connection.commit();
                connection.release();

                // Invalidate cache
                invalidateShopCaches(firebase_uid);

                res.json({
                    success: true,
                    message: "Tech pass deducted successfully",
                    remainingTechPasses: userInfo[0].tech_pass - 1
                });
            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
        } catch (error) {
            console.error("Error deducting tech pass:", error);
            res.status(500).json({
                success: false,
                message: "Error deducting tech pass",
                error: error.message
            });
        }
    }
};

export default shopController;