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
                        "INSERT INTO user_items (firebase_uid, username, item_code, item_name, item_price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [firebase_uid, username, item_code, item.item_name, itemPrice, quantity, totalPrice]
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
        const { firebase_uid } = req.params;

        try {

            const [rows] = await pool.query("SELECT tech_pass FROM user_info WHERE firebase_uid = ?", [firebase_uid]);

            if (rows[0].tech_pass < 1) {
                return res.status(400).json({ message: "You don't have any Tech Passes!" });
            }

            const [rows2] = await pool.query("SELECT * FROM user_items WHERE firebase_uid = ? AND item_code = 'ITEM002TP'", [firebase_uid]);

            if (rows2.length === 0) {
                return res.status(400).json({ message: "You don't have any Tech Passes!" });
            }

            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                await connection.query("UPDATE user_info SET tech_pass = tech_pass - 1 WHERE firebase_uid = ?", [firebase_uid]);

                await connection.query("UPDATE user_items SET quantity = quantity - 1 WHERE firebase_uid = ? AND item_code = 'ITEM002TP'", [firebase_uid]);

                await connection.commit();
                connection.release();

                // Invalidate cache
                invalidateShopCaches(firebase_uid);

                res.json({ message: "Tech Pass used successfully!" });
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
                        // Set mana to maximum (200)
                        updateQuery = "UPDATE user_info SET mana = 200 WHERE firebase_uid = ?";
                        updateValues = [firebase_uid];
                        resultMessage = `Mana fully restored with ${item_name}!`;
                        break;

                    case "tech_pass":

                        updateQuery = "UPDATE user_info SET tech_pass = tech_pass + 1 WHERE firebase_uid = ?";
                        updateValues = [firebase_uid];
                        resultMessage = `Tech pass added `;
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
                    // Delete item if quantity is 1
                    await connection.query(
                        "DELETE FROM user_items WHERE firebase_uid = ? AND item_code = ?",
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

};

export default shopController;