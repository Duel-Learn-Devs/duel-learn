import { pool } from "../config/db.js";
import NodeCache from "node-cache";
import { getIO } from '../socket.js';


// Create cache instance with 10-minute default TTL and 2-minute check period
const achievementCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Cache invalidation helper function
const invalidateAchievementCaches = (firebase_uid) => {
    // Clear general achievement cache
    achievementCache.del('all_achievements');

    // Clear user-specific caches
    if (firebase_uid) {
        achievementCache.del(`mystic_elder_${firebase_uid}`);
        achievementCache.del(`wisdom_collector_${firebase_uid}`);
        achievementCache.del(`arcane_scholar_${firebase_uid}`);
    }

    // Clear any other cache keys related to this user
    const allKeys = achievementCache.keys();
    allKeys.forEach(key => {
        if (key.includes(firebase_uid)) {
            achievementCache.del(key);
        }
    });
};

const AchievementController = {

    getAchievement: async (req, res) => {
        try {
            // Check if force refresh parameter exists
            const skipCache = req.query.timestamp !== undefined;
            const cacheKey = 'all_achievements';

            // Check cache first unless skipping
            if (!skipCache) {
                const cachedData = achievementCache.get(cacheKey);
                if (cachedData) {
                    console.log("Achievement cache hit for all achievements");
                    return res.status(200).json(cachedData);
                }
            }

            const [rows] = await pool.query(
                `SELECT achievement_id, achievement_name, achievement_description, 
                achievement_requirement, achievement_level, achievement_picture_url 
                FROM achievements WHERE achievement_level = 1`);

            const result = {
                success: true,
                data: rows,
            };

            // Cache the result
            achievementCache.set(cacheKey, result, 3600); // Cache for 1 hour

            res.status(200).json(result);
        } catch (error) {
            console.error("Error fetching achievements:", error);
            res.status(500).json({
                success: false,
                message: "Failed to retrieve achievements",
                error: error.message
            });
        }
    },


    getUserLongestStreak: async (req, res) => {
        try {
            const { firebase_uid } = req.params;
            const skipCache = req.query.timestamp !== undefined;
            const cacheKey = `longest_streak_${firebase_uid}`;

            // Check cache first unless skipping
            if (!skipCache) {
                const cachedData = achievementCache.get(cacheKey);
                if (cachedData) {
                    console.log(`Cache hit for Longest Streak - user: ${firebase_uid}`);
                    return res.status(200).json(cachedData);
                }
            }

            // Get user's highest streak using the longest_win_streak column
            const [result] = await pool.query(
                `SELECT longest_win_streak as highest_streak FROM user_info WHERE firebase_uid = ?`,
                [firebase_uid]
            );

            // Fetch the Duelist achievement details
            const [duelistResult] = await pool.query(
                `SELECT achievement_id, achievement_name, achievement_description, 
                achievement_requirement, achievement_level, achievement_picture_url 
                FROM achievements WHERE achievement_name = 'Duelist'`
            );

            if (duelistResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Duelist achievement not found",
                });
            }

            const duelistAchievement = duelistResult[0];
            const achieved = result[0].highest_streak >= duelistAchievement.achievement_requirement;

            const response = {
                success: true,
                highest_streak: result[0].highest_streak,
                duelistAchievement: {
                    ...duelistAchievement,
                    achieved
                }
            };

            // If the achievement was just earned, emit an event
            if (achieved && result[0].highest_streak >= duelistAchievement.achievement_requirement) {
                const io = getIO();
                io.emit('achievementUnlocked', {
                    firebase_uid,
                    achievement_name: 'Duelist',
                    achievement_level: result[0].highest_streak,
                    timestamp: new Date().toISOString()
                });
            }

            // Cache the result (5 minutes TTL)
            achievementCache.set(cacheKey, response, 3600);

            res.status(200).json(response);
        } catch (error) {
            console.error("Error fetching user highest streak:", error);
            res.status(500).json({
                success: false,
                message: "Failed to retrieve user highest streak",
                error: error.message
            });
        }
    },

    getUserTotalPvPMatches: async (req, res) => {
        try {
            const { firebase_uid } = req.params;
            const skipCache = req.query.timestamp !== undefined;
            const cacheKey = `total_pvp_matches_${firebase_uid}`;

            // Check cache first unless skipping
            if (!skipCache) {
                const cachedData = achievementCache.get(cacheKey);
                if (cachedData) {
                    console.log(`Cache hit for Total PvP Matches - user: ${firebase_uid}`);
                    return res.status(200).json(cachedData);
                }
            }

            // Check if user exists
            const [userExists] = await pool.query(
                'SELECT 1 FROM user_info WHERE firebase_uid = ?',
                [firebase_uid]
            );

            if (userExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Count matches where user was either host or guest
            const [result] = await pool.query(
                `SELECT COUNT(*) as total_matches 
                 FROM pvp_battle_sessions
                 WHERE host_id = ? OR guest_id = ?`,
                [firebase_uid, firebase_uid]
            );

            // Fetch the Battle Archmage achievement
            const [battleArchmageResult] = await pool.query(
                `SELECT achievement_id, achievement_name, achievement_description, 
                achievement_requirement, achievement_level, achievement_picture_url 
                FROM achievements WHERE achievement_name = 'Battle Archmage'`
            );

            if (battleArchmageResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Battle Archmage achievement not found",
                });
            }

            const battleArchmageAchievement = battleArchmageResult[0];
            const totalMatches = result[0].total_matches || 0;
            const achieved = totalMatches >= battleArchmageAchievement.achievement_requirement;

            const response = {
                success: true,
                total_matches: totalMatches,
                battleArchmageAchievement: {
                    ...battleArchmageAchievement,
                    achieved
                }
            };

            // If the achievement was just earned, emit an event
            if (achieved && totalMatches >= battleArchmageAchievement.achievement_requirement) {
                const io = getIO();
                io.emit('achievementUnlocked', {
                    firebase_uid,
                    achievement_name: 'Battle Archmage',
                    achievement_level: totalMatches,
                    timestamp: new Date().toISOString()
                });
            }

            // Cache the result (5 minutes TTL)
            achievementCache.set(cacheKey, response, 3600);

            res.status(200).json(response);
        } catch (error) {
            console.error("Error fetching user total PvP matches:", error);
            res.status(500).json({
                success: false,
                message: "Failed to retrieve user total PvP matches",
                error: error.message
            });
        }
    },

    getUserTotalPvPWins: async (req, res) => {
        try {
            const { firebase_uid } = req.params;
            const skipCache = req.query.timestamp !== undefined;
            const cacheKey = `total_pvp_wins_${firebase_uid}`;

            // Check cache first unless skipping
            if (!skipCache) {
                const cachedData = achievementCache.get(cacheKey);
                if (cachedData) {
                    console.log(`Cache hit for Total PvP Wins - user: ${firebase_uid}`);
                    return res.status(200).json(cachedData);
                }
            }

            // Check if user exists
            const [userExists] = await pool.query(
                'SELECT 1 FROM user_info WHERE firebase_uid = ?',
                [firebase_uid]
            );

            if (userExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Count matches where user is the winner
            const [result] = await pool.query(
                `SELECT COUNT(*) as total_wins 
                 FROM pvp_battle_sessions
                 WHERE winner_id = ?`,
                [firebase_uid]
            );

            // Fetch the Best Magician achievement
            const [bestMagicianResult] = await pool.query(
                `SELECT achievement_id, achievement_name, achievement_description, 
                achievement_requirement, achievement_level, achievement_picture_url 
                FROM achievements WHERE achievement_name = 'Best Magician'`
            );

            if (bestMagicianResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Best Magician achievement not found",
                });
            }

            const bestMagicianAchievement = bestMagicianResult[0];
            const totalWins = result[0].total_wins || 0;
            const achieved = totalWins >= bestMagicianAchievement.achievement_requirement;

            const response = {
                success: true,
                total_wins: totalWins,
                bestMagicianAchievement: {
                    ...bestMagicianAchievement,
                    achieved
                }
            };

            // If the achievement was just earned, emit an event
            if (achieved && totalWins >= bestMagicianAchievement.achievement_requirement) {
                const io = getIO();
                io.emit('achievementUnlocked', {
                    firebase_uid,
                    achievement_name: 'Best Magician',
                    achievement_level: totalWins,
                    timestamp: new Date().toISOString()
                });
            }

            // Cache the result (5 minutes TTL)
            achievementCache.set(cacheKey, response, 3600);

            res.status(200).json(response);
        } catch (error) {
            console.error("Error fetching user total PvP wins:", error);
            res.status(500).json({
                success: false,
                message: "Failed to retrieve user total PvP wins",
                error: error.message
            });
        }
    },

    // Add method to programmatically invalidate cache when achievements change
    invalidateCache: async (req, res) => {
        const { firebase_uid } = req.body;

        invalidateAchievementCaches(firebase_uid);

        res.status(200).json({
            success: true,
            message: "Achievement cache invalidated"
        });
    },

    getAllUserAchievements: async (req, res) => {
        try {
            const { firebase_uid } = req.params;
            const skipCache = req.query.timestamp !== undefined;
            const cacheKey = `all_user_achievements_${firebase_uid}`;

            // Check cache
            if (!skipCache) {
                const cachedData = achievementCache.get(cacheKey);
                if (cachedData) {
                    return res.status(200).json(cachedData);
                }
            }

            // We'll use these in multiple queries
            const achievementQueries = [
                // Query for Mystic Elder
                pool.query(
                    `SELECT level FROM user_info WHERE firebase_uid = ?`,
                    [firebase_uid]
                ),
                pool.query(
                    `SELECT achievement_id, achievement_name, achievement_description, 
                    achievement_requirement, achievement_level, achievement_picture_url 
                    FROM achievements WHERE achievement_name = 'Mystic Elder'`
                ),

                // Query for Wisdom Collector
                pool.query(
                    `SELECT COUNT(*) as count FROM study_material_info WHERE created_by_id = ?`,
                    [firebase_uid]
                ),
                pool.query(
                    `SELECT achievement_id, achievement_name, achievement_description, 
                    achievement_requirement, achievement_level, achievement_picture_url 
                    FROM achievements WHERE achievement_name = 'Wisdom Collector'`
                ),

                // Query for Arcane Scholar
                pool.query(
                    `SELECT COUNT(*) as count FROM session_report WHERE session_by_user_id = ? AND status = 'completed'`,
                    [firebase_uid]
                ),
                pool.query(
                    `SELECT achievement_id, achievement_name, achievement_description, 
                    achievement_requirement, achievement_level, achievement_picture_url 
                    FROM achievements WHERE achievement_name = 'Arcane Scholar'`
                ),

                // Query for Duelist
                pool.query(
                    `SELECT longest_win_streak as highest_streak FROM user_info WHERE firebase_uid = ?`,
                    [firebase_uid]
                ),
                pool.query(
                    `SELECT achievement_id, achievement_name, achievement_description, 
                    achievement_requirement, achievement_level, achievement_picture_url 
                    FROM achievements WHERE achievement_name = 'Duelist'`
                ),

                // Query for Battle Archmage
                pool.query(
                    `SELECT COUNT(*) as total_matches FROM pvp_battle_sessions 
                    WHERE host_id = ? OR guest_id = ?`,
                    [firebase_uid, firebase_uid]
                ),
                pool.query(
                    `SELECT achievement_id, achievement_name, achievement_description, 
                    achievement_requirement, achievement_level, achievement_picture_url 
                    FROM achievements WHERE achievement_name = 'Battle Archmage'`
                ),

                // Query for Best Magician
                pool.query(
                    `SELECT COUNT(*) as total_wins FROM pvp_battle_sessions 
                    WHERE winner_id = ?`,
                    [firebase_uid]
                ),
                pool.query(
                    `SELECT achievement_id, achievement_name, achievement_description, 
                    achievement_requirement, achievement_level, achievement_picture_url 
                    FROM achievements WHERE achievement_name = 'Best Magician'`
                )
            ];

            // Execute all queries in parallel
            const queryResults = await Promise.all(achievementQueries);

            // Process Mystic Elder data
            const userLevel = queryResults[0][0][0]?.level || 0;
            const mysticElderAchievement = queryResults[1][0][0] || null;
            const mysticElderAchieved = mysticElderAchievement ? userLevel >= mysticElderAchievement.achievement_requirement : false;

            // Process Wisdom Collector data
            const userStudyMaterialCount = queryResults[2][0][0]?.count || 0;
            const wisdomCollectorAchievement = queryResults[3][0][0] || null;
            const wisdomCollectorAchieved = wisdomCollectorAchievement ? userStudyMaterialCount >= wisdomCollectorAchievement.achievement_requirement : false;

            // Process Arcane Scholar data
            const completedSessionsCount = queryResults[4][0][0]?.count || 0;
            const arcaneScholarAchievement = queryResults[5][0][0] || null;
            const arcaneScholarAchieved = arcaneScholarAchievement ? completedSessionsCount >= arcaneScholarAchievement.achievement_requirement : false;

            // Process Duelist data
            const highestStreak = queryResults[6][0][0]?.highest_streak || 0;
            const duelistAchievement = queryResults[7][0][0] || null;
            const duelistAchieved = duelistAchievement ? highestStreak >= duelistAchievement.achievement_requirement : false;

            // Process Battle Archmage data
            const totalMatches = queryResults[8][0][0]?.total_matches || 0;
            const battleArchmageAchievement = queryResults[9][0][0] || null;
            const battleArchmageAchieved = battleArchmageAchievement ? totalMatches >= battleArchmageAchievement.achievement_requirement : false;

            // Process Best Magician data
            const totalWins = queryResults[10][0][0]?.total_wins || 0;
            const bestMagicianAchievement = queryResults[11][0][0] || null;
            const bestMagicianAchieved = bestMagicianAchievement ? totalWins >= bestMagicianAchievement.achievement_requirement : false;

            // Build consolidated response
            const result = {
                success: true,
                mysticElder: {
                    success: true,
                    userLevel,
                    mysticElderAchievement: mysticElderAchievement ? {
                        ...mysticElderAchievement,
                        achieved: mysticElderAchieved
                    } : null
                },
                wisdomCollector: {
                    success: true,
                    userStudyMaterialCount,
                    wisdomCollectorAchievement: wisdomCollectorAchievement ? {
                        ...wisdomCollectorAchievement,
                        achieved: wisdomCollectorAchieved
                    } : null
                },
                arcaneScholar: {
                    success: true,
                    userStudyMaterialCount: completedSessionsCount,
                    arcaneScholarAchievement: arcaneScholarAchievement ? {
                        ...arcaneScholarAchievement,
                        achieved: arcaneScholarAchieved
                    } : null
                },
                duelist: {
                    success: true,
                    highest_streak: highestStreak,
                    duelistAchievement: duelistAchievement ? {
                        ...duelistAchievement,
                        achieved: duelistAchieved
                    } : null
                },
                battleArchmage: {
                    success: true,
                    total_matches: totalMatches,
                    battleArchmageAchievement: battleArchmageAchievement ? {
                        ...battleArchmageAchievement,
                        achieved: battleArchmageAchieved
                    } : null
                },
                bestMagician: {
                    success: true,
                    total_wins: totalWins,
                    bestMagicianAchievement: bestMagicianAchievement ? {
                        ...bestMagicianAchievement,
                        achieved: bestMagicianAchieved
                    } : null
                }
            };

            // Cache result (1 hour TTL)
            achievementCache.set(cacheKey, result, 3600);

            res.status(200).json(result);
        } catch (error) {
            console.error("Error fetching all user achievements:", error);
            res.status(500).json({
                success: false,
                message: "Failed to retrieve user achievements",
                error: error.message
            });
        }
    }
};

export default AchievementController;
