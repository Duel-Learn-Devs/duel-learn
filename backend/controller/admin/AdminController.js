import admin from "../../services/firebaseAdmin.js";
import { pool } from "../../config/db.js";

const AdminController = {
  /**
   * Fetch all users with their existence status in different systems
   */
  fetchUsers: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      // Get users from Firebase Auth
      const authUsers = await admin.auth().listUsers();
      
      // Get users from Firestore
      const firestoreUsersSnapshot = await admin.firestore().collection('users').get();
      const firestoreUsers = firestoreUsersSnapshot.docs.map(doc => ({
        ...doc.data(),
        firebase_uid: doc.id // Ensure firebase_uid is correctly extracted
      }));
      
      // Get users from SQL with available fields
      const [sqlUsers] = await connection.execute(`
        SELECT 
          u.firebase_uid,
          u.username,
          u.email,
          u.password_hash,
          u.created_at,
          u.updated_at,
          u.display_picture,
          u.full_name,
          u.email_verified,
          u.isSSO,
          u.account_type,
          ui.level,
          ui.exp,
          ui.mana,
          ui.coins,
          (SELECT COUNT(*) FROM study_material_info WHERE created_by_id = u.firebase_uid) as created_materials
        FROM users u
        LEFT JOIN user_info ui ON u.firebase_uid = ui.firebase_uid
      `);
      
      // Create a map of all unique user IDs
      const userMap = new Map();
      
      // Add Firebase Auth users with default values
      authUsers.users.forEach(user => {
        userMap.set(user.uid, {
          id: user.uid,
          firebase_uid: user.uid,
          username: user.displayName || null,
          name: user.displayName || 'Unknown User',
          email: user.email || null,
          status: 'active', // Default value
          joinDate: user.metadata.creationTime || new Date().toISOString(),
          lastActive: user.metadata.lastSignInTime || new Date().toISOString(),
          verified: user.emailVerified || false,
          email_verified: user.emailVerified || false,
          isSSO: false,
          account_type: 'free',
          isNew: false,
          level: 1,
          exp: 0,
          mana: 200,
          coins: 0,
          display_picture: null,
          existInSQL: false,
          existInFirebaseAuth: true,
          existInFirestore: false,
          stats: {
            completedCourses: 0,
            totalPoints: 0,
            averageScore: 0,
            timeSpent: '0',
            createdMaterials: 0,
            studiedMaterials: 0,
            pvpMatches: {
              total: 0,
              wins: 0,
              losses: 0,
              winRate: 0
            },
            peacefulMatches: {
              total: 0,
              completed: 0,
              abandoned: 0,
              completionRate: 0
            },
            timePressuredMatches: {
              total: 0,
              completed: 0,
              timeouts: 0,
              averageCompletionTime: '0'
            },
            achievements: {
              total: 0,
              completed: 0,
              inProgress: 0,
              completionRate: 0
            },
            purchasedProducts: {
              total: 0,
              courses: 0,
              items: 0,
              totalSpent: 0
            },
            subscription: {
              type: 'monthly',
              startDate: new Date().toISOString().split('T')[0],
              autoRenew: false,
              price: 0,
              status: 'active'
            }
          }
        });
      });
      
      // Add SQL users with actual values
      sqlUsers.forEach(user => {
        if (userMap.has(user.firebase_uid)) {
          const existingUser = userMap.get(user.firebase_uid);
          existingUser.existInSQL = true;
          existingUser.username = user.username || existingUser.username;
          existingUser.name = user.full_name || existingUser.name;
          existingUser.email = user.email || existingUser.email;
          existingUser.joinDate = user.created_at || existingUser.joinDate;
          existingUser.lastActive = user.updated_at || existingUser.lastActive;
          existingUser.verified = user.email_verified || existingUser.verified;
          existingUser.email_verified = user.email_verified || existingUser.email_verified;
          existingUser.isSSO = user.isSSO || existingUser.isSSO;
          existingUser.account_type = user.account_type || existingUser.account_type;
          existingUser.display_picture = user.display_picture || existingUser.display_picture;
          existingUser.level = user.level || existingUser.level;
          existingUser.exp = user.exp || existingUser.exp;
          existingUser.mana = user.mana || existingUser.mana;
          existingUser.coins = user.coins || existingUser.coins;
          
          // Update stats with actual values where available
          existingUser.stats = {
            ...existingUser.stats,
            createdMaterials: user.created_materials || 0,
            // Keep default values for other stats that don't exist yet
          };
        } else {
          // Create new user entry with available fields
          userMap.set(user.firebase_uid, {
            id: user.firebase_uid,
            firebase_uid: user.firebase_uid,
            username: user.username,
            name: user.full_name || 'Unknown User',
            email: user.email,
            status: 'active', // Default value
            joinDate: user.created_at || new Date().toISOString(),
            lastActive: user.updated_at || new Date().toISOString(),
            verified: user.email_verified || false,
            email_verified: user.email_verified || false,
            isSSO: user.isSSO || false,
            account_type: user.account_type || 'free',
            isNew: false,
            level: user.level || 1,
            exp: user.exp || 0,
            mana: user.mana || 200,
            coins: user.coins || 0,
            display_picture: user.display_picture,
            existInSQL: true,
            existInFirebaseAuth: false,
            existInFirestore: false,
            stats: {
              completedCourses: 0,
              totalPoints: 0,
              averageScore: 0,
              timeSpent: '0',
              createdMaterials: user.created_materials || 0,
              studiedMaterials: 0,
              pvpMatches: {
                total: 0,
                wins: 0,
                losses: 0,
                winRate: 0
              },
              peacefulMatches: {
                total: 0,
                completed: 0,
                abandoned: 0,
                completionRate: 0
              },
              timePressuredMatches: {
                total: 0,
                completed: 0,
                timeouts: 0,
                averageCompletionTime: '0'
              },
              achievements: {
                total: 0,
                completed: 0,
                inProgress: 0,
                completionRate: 0
              },
              purchasedProducts: {
                total: 0,
                courses: 0,
                items: 0,
                totalSpent: 0
              },
              subscription: {
                type: 'monthly',
                startDate: new Date().toISOString().split('T')[0],
                autoRenew: false,
                price: 0,
                status: 'active'
              }
            }
          });
        }
      });
      
      // Update Firestore existence check
      userMap.forEach((user, key) => {
        const firestoreUser = firestoreUsers.find(fUser => fUser.firebase_uid === key);
        if (firestoreUser) {
          user.existInFirestore = true;
        }
      });
      
      // Convert map to array
      const users = Array.from(userMap.values());
      
      res.status(200).json({
        success: true,
        users,
        message: `Successfully fetched ${users.length} users`,
        severity: 'info'
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch users. Please try again later.',
        severity: 'error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      if (connection) connection.release();
    }
  },

  /**
   * Delete a user by admin
   */
  deleteUserByAdmin: async (req, res) => {
    const { id } = req.params;
    let connection;
    
    try {
      connection = await pool.getConnection();
      
      // Start a transaction
      await connection.beginTransaction();
      
      // Delete from SQL database
      const [result] = await connection.execute(
        'DELETE FROM users WHERE firebase_uid = ?',
        [id]
      );
      
      // Delete from Firebase Auth
      try {
        await admin.auth().deleteUser(id);
      } catch (firebaseError) {
        console.warn(`User not found in Firebase Auth: ${id}`, firebaseError);
        // We continue since the user might only exist in SQL
      }
      
      // Delete from Firestore
      try {
        await admin.firestore().collection('users').doc(id).delete();
      } catch (firestoreError) {
        console.warn(`User not found in Firestore: ${id}`, firestoreError);
        // We continue since the user might only exist in SQL/Firebase Auth
      }
      
      // Commit the transaction
      await connection.commit();
      
      res.status(200).json({
        success: true,
        message: `User ${id} has been successfully deleted`,
        severity: 'success'
      });
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      
      // Rollback the transaction if there was an error
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: `Failed to delete user ${id}. Please try again.`,
        severity: 'error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      if (connection) connection.release();
    }
  },

  /**
   * Delete all users (dangerous operation)
   */
  deleteAllUsers: async (req, res) => {
    let connection;
    
    try {
      connection = await pool.getConnection();
      
      // Confirm this is what the admin wants to do
      const { confirm } = req.body;
      if (confirm !== 'DELETE_ALL_USERS') {
        return res.status(400).json({
          success: false,
          message: 'This operation requires confirmation. Please provide the confirm field with value "DELETE_ALL_USERS"',
          severity: 'warning'
        });
      }
      
      // Start a transaction
      await connection.beginTransaction();
      
      // Delete all from SQL database
      await connection.execute('DELETE FROM users');
      
      // For Firebase, we'd need to iteratively delete users
      // This is a simplified example - in production you'd use a batch approach
      const listUsersResult = await admin.auth().listUsers();
      const deletePromises = listUsersResult.users.map(userRecord => 
        admin.auth().deleteUser(userRecord.uid)
      );
      await Promise.all(deletePromises);
      
      // Delete all users from Firestore
      const batch = admin.firestore().batch();
      const snapshot = await admin.firestore().collection('users').get();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      // Commit the transaction
      await connection.commit();
      
      res.status(200).json({
        success: true,
        message: 'All users have been deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting all users:', error);
      
      // Rollback the transaction if there was an error
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete all users. Operation has been rolled back.',
        severity: 'error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      if (connection) connection.release();
    }
  }
};

export default AdminController; 