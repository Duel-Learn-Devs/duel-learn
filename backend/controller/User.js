import manilacurrentTimestamp from "../utils/CurrentTimestamp.js";
import { pool } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import moment from "moment";
import admin from "../services/firebaseAdmin.js";

const archiveUser = async (connection, firebase_uid) => {
  try {
    // Get user data before deletion
    const [userData] = await connection.execute(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [firebase_uid]
    );

    if (userData.length === 0) {
      throw new Error('User not found');
    }

    // Get user_info data before deletion
    const [userInfoData] = await connection.execute(
      'SELECT * FROM user_info WHERE firebase_uid = ?',
      [firebase_uid]
    );

    const user = userData[0];
    const userInfo = userInfoData[0] || {};
    const archiveTimestamp = moment().format("YYYY-MM-DD HH:mm:ss");

    // Insert into archive_users table
    await connection.execute(
      `INSERT INTO archive_users 
       (id, firebase_uid, username, email, password_hash, created_at, updated_at, 
        display_picture, full_name, email_verified, isSSO, archived_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), // Generate unique archive ID
        user.firebase_uid,
        user.username,
        user.email,
        user.password_hash,
        user.created_at,
        user.updated_at,
        user.display_picture,
        user.full_name,
        user.email_verified,
        user.isSSO,
        archiveTimestamp
      ]
    );

    // Insert into archive_user_info table
    await connection.execute(
      `INSERT INTO archive_user_info 
       (firebase_uid, level, exp, coins, mana, archived_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.firebase_uid,
        userInfo.level || 1,
        userInfo.exp || 0,
        userInfo.coins || 500,
        userInfo.mana || 200,
        archiveTimestamp
      ]
    );

    // Archive in Firestore
    const userDoc = await admin.firestore().collection('users').doc(firebase_uid).get();
    if (userDoc.exists) {
      const firestoreUserData = userDoc.data();
      await admin.firestore().collection('archive_users').doc(firebase_uid).set({
        ...firestoreUserData,
        archived_at: new Date()
      });

      // Create separate archive document for user_info in Firestore
      await admin.firestore().collection('archive_user_info').doc(firebase_uid).set({
        firebase_uid: user.firebase_uid,
        level: userInfo.level || 1,
        exp: userInfo.exp || 0,
        coins: userInfo.coins || 500,
        mana: userInfo.mana || 200,
        archived_at: new Date()
      });
    }

    return true;
  } catch (error) {
    console.error('Error archiving user:', error);
    throw error;
  }
};


const signUpUser = async (req, res) => {
  let connection;
  console.log(req.headers.authorization);
  let decodedToken;
  try {
    // Extract the token from the Authorization header
    const token = req.get('Authorization')?.split(" ")[1];

    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Token verified successfully:', decodedToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const { username, email, password, email_verified, isSSO, account_type } = req.body;
    const uid = decodedToken.uid;
    const currentTimestamp = moment().format("YYYY-MM-DD HH:mm:ss");
    connection = await pool.getConnection();
    const password_hash = await bcrypt.hash(password, 10);

    console.log("Sign Up Request Data:", {
      username,
      email,
      email_verified,
      isSSO,
      uid,
      password: '[HIDDEN]'
    });

    // Parallelize SQL and Firestore operations
    await Promise.all([
      connection.execute(
        `INSERT INTO users (firebase_uid, username, email, password_hash, created_at, updated_at, display_picture, full_name, email_verified, isSSO, account_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          uid,
          username || " ",
          email || null,
          password_hash,
          currentTimestamp,
          currentTimestamp,
          null,
          null,
          email_verified,
          isSSO === true,  // Ensure boolean value
          account_type || "free"
        ]
      ),
      connection.execute(
        `INSERT INTO user_info (firebase_uid, username, display_picture, level, exp, coins, mana)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [uid, username || "Default Username", null, 1, 0, 500, 200]
      ),
      admin.firestore().collection("users").doc(uid).set({
        firebase_uid: uid,
        username: username || "Default Username",
        email: email || null,
        password_hash: password_hash,
        email_verified: email_verified || false,
        isSSO: isSSO,
        account_type: account_type || "free", // Use validated account type
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        display_picture: null,
        full_name: null,
        lastLogin: null,
        session: {},
      }),
      admin.firestore().collection("activity_logs").add({
        firebase_uid: uid,
        action: "User Signed Up",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
      admin.firestore().collection("temp_users").doc(uid).delete(),
    ]);

    res.status(201).json({
      message: "User signed up successfully",
      firebase_uid: uid,
    });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
    // Delete Firebase Authentication account if it exists
    try {
      await admin.auth().deleteUser(uid);
      console.log("Successfully deleted Firebase auth account for uid:", uid);
    } catch (deleteError) {
      console.error("Error deleting Firebase auth account:", deleteError);
      // Don't throw error since we want to continue cleanup of other resources
    }
  } finally {
    if (connection) connection.release();
  }
};

const storeUser = async (req, res) => {
  try {
    console.log("Request headers:", req.headers);
    const authHeader = req.headers.authorization;
    console.log("Auth header:", authHeader);

    // Check if Authorization header exists and has correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided or invalid format" });
    }

    // Extract token
    const token = authHeader.split(" ")[1];
    console.log("Extracted token:", token);

    // Verify token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("Decoded token:", decodedToken);

    // Get firebase_uid from request params
    const { firebase_uid } = req.params;

    // Check if the token UID matches the requested firebase_uid
    if (decodedToken.uid !== firebase_uid) {
      return res.status(403).json({ error: "Unauthorized: Token UID doesn't match request UID(store-user)" });
    }

    const { username, email, password, account_type } = req.body;
    console.log("Request body:", { username, email, password: '***', account_type });

    // Store user data with UID as key
    const userData = {
      username,
      email,
      password,
      account_type,
    };

    // Store in Firestore temp_users collection
    await admin.firestore().collection('temp_users').doc(firebase_uid).set(userData);

    res.status(201).json({
      success: true,
      message: "User data stored successfully",
      user: {
        username,
        email
      }
    });

  } catch (error) {
    console.error("Error in storeUser:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
};

const getStoredUser = async (req, res) => {
  try {
    const { firebase_uid } = req.params;
    const token = req.get('Authorization')?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("Decoded token for GET request:", decodedToken);

    // Check if the requesting user matches the firebase_uid
    if (decodedToken.uid !== firebase_uid) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Get user from temporary storage or database
    const userDoc = await admin.firestore().collection("temp_users").doc(firebase_uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User data not found" });
    }

    res.status(200).json({
      success: true,
      user: userDoc.data()
    });

  } catch (error) {
    console.error("Error fetching stored user data:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
};

export default {
  signUpUser,
  getUserInfo: async (req, res) => {
    let connection;
    try {
      const { firebase_uid } = req.params;

      // Get a connection from the pool
      connection = await pool.getConnection();

      // Fetch combined user data from both tables
      const [userData] = await connection.execute(
        `SELECT 
                u.firebase_uid,
                u.username,
                u.email,
                u.display_picture,
                u.full_name,
                u.email_verified,
                u.isSSO,
                u.account_type,
                ui.level,
                ui.exp,
                ui.mana,
                ui.coins,
                ui.tech_pass
            FROM users u
            LEFT JOIN user_info ui ON u.firebase_uid = ui.firebase_uid
            WHERE u.firebase_uid = ?`,
        [firebase_uid]
      );

      if (userData.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Send the combined data
      res.status(200).json({
        user: userData[0],
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
      if (connection) connection.release();
    }
  },
  resetPassword: async (req, res) => {
    let connection;
    try {
      const { firebase_uid, password_hash, updated_at } = req.body;

      if (!firebase_uid || !password_hash) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Convert the updated_at to the desired format, or use current timestamp if not provided
      const sqlTimestamp = updated_at ? moment(updated_at).format("YYYY-MM-DD HH:mm:ss") : moment().format("YYYY-MM-DD HH:mm:ss");

      // Get a connection from the pool
      connection = await pool.getConnection();

      // Update the user's password hash and updated_at in the database
      await connection.execute(
        `UPDATE users SET password_hash = ?, updated_at = ? WHERE firebase_uid = ?`,
        [password_hash, sqlTimestamp, firebase_uid]
      );

      // Send a success response
      res.status(200).json({
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  },

  updateEmailVerified: async (req, res) => {
    let connection;
    try {
      const { firebase_uid, email_verified, updated_at } = req.body;

      // Convert the updated_at to the desired format
      const sqlTimestamp = moment(updated_at).format("YYYY-MM-DD HH:mm:ss");

      // Get a connection from the pool
      connection = await pool.getConnection();

      // Update the user's email_verified and updated_at in the database
      await connection.execute(
        `UPDATE users SET email_verified = ?, updated_at = ? WHERE firebase_uid = ?;`,
        [email_verified, sqlTimestamp, firebase_uid]
      );

      // Send a success response
      res.status(200).json({
        message: "Email verified status updated successfully",
      });
    } catch (error) {
      console.error("Error updating email verified status:", error);
      res.status(500).json({ error: "Internal server error", details: error });
    } finally {
      if (connection) connection.release();
    }
  },

  fetchUsers: async (req, res) => {
    let connection;
    try {
      // Get a connection from the pool
      connection = await pool.getConnection();

      // Fetch users from SQL
      const [sqlUsers] = await connection.execute('SELECT firebase_uid, username, email FROM users'); // Include email

      // Fetch users from Firestore
      const firestoreUsersSnapshot = await admin.firestore().collection('users').get();
      const firestoreUsers = firestoreUsersSnapshot.docs.map(doc => doc.data());

      // Fetch users from Firebase Auth
      const authUsers = await admin.auth().listUsers();
      const firebaseAuthUsers = Array.isArray(authUsers.users) ? authUsers.users.map(user => ({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      })) : [];

      // Match users
      const matchedUsers = sqlUsers.map(sqlUser => {
        const firestoreUser = firestoreUsers.find(user => user.firebase_uid === sqlUser.firebase_uid);
        const authUser = firebaseAuthUsers.find(user => user.uid === sqlUser.firebase_uid);
        return {
          firebase_uid: sqlUser.firebase_uid,
          username: sqlUser.username,
          email: sqlUser.email, // Include email
          existInSQL: true,
          existInFirestore: !!firestoreUser,
          existInFirebaseAuth: !!authUser,
          created_at: sqlUser.created_at,
        };
      });

      // Send the matched users as response
      res.status(200).json({
        message: "Users fetched successfully",
        users: matchedUsers,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM users');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  addUser: async (req, res) => {
    const { email, username } = req.body;
    try {
      const userRecord = await admin.auth().createUser({ email });
      await admin.firestore().collection('users').doc(userRecord.uid).set({ email, username });
      await pool.query('INSERT INTO users (id, email, username) VALUES (?, ?, ?)', [userRecord.uid, email, username]);
      res.status(201).json({ id: userRecord.uid, email, username });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateUser: async (req, res) => {
    const { id } = req.params;
    const { email, username } = req.body;
    try {
      await admin.auth().updateUser(id, { email });
      await admin.firestore().collection('users').doc(id).update({ email, username });
      await pool.query('UPDATE users SET email = ?, username = ? WHERE id = ?', [email, username, id]);
      res.json({ id, email, username });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteUserByAdmin: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      // Get a connection from the pool
      connection = await pool.getConnection();

      // Check if the user exists in SQL
      const [sqlUsers] = await connection.execute('SELECT firebase_uid FROM users WHERE firebase_uid = ?', [id]);
      if (sqlUsers.length === 0) {
        return res.status(404).json({ error: "User not found in SQL database" });
      }

      // Check if the user exists in Firestore
      const firestoreUserDoc = await admin.firestore().collection('users').doc(id).get();
      if (!firestoreUserDoc.exists) {
        return res.status(404).json({ error: "User not found in Firestore" });
      }

      // Check if the user exists in Firebase Auth
      try {
        await admin.auth().getUser(id);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          return res.status(404).json({ error: "User not found in Firebase Auth" });
        }
        throw error;
      }

      // Archive user data
      await archiveUser(connection, id);

      // Delete user from Firebase Auth
      await admin.auth().deleteUser(id);

      // Delete user from Firestore users collection (already archived)
      await admin.firestore().collection('users').doc(id).delete();

      // Delete user from SQL
      await connection.execute('DELETE FROM users WHERE firebase_uid = ?', [id]);

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  },

  deleteUserAccount: async (req, res) => {
    let connection;
    try {
      const { firebase_uid } = req.body;

      // Get a connection from the pool
      connection = await pool.getConnection();

      // Check if user exists in SQL before proceeding
      const [userExists] = await connection.execute(
        'SELECT firebase_uid FROM users WHERE firebase_uid = ?',
        [firebase_uid]
      );

      if (userExists.length === 0) {
        return res.status(404).json({ error: 'User not found in SQL database' });
      }

      // Check if user exists in Firestore
      const firestoreUser = await admin.firestore().collection('users').doc(firebase_uid).get();
      if (!firestoreUser.exists) {
        return res.status(404).json({ error: 'User not found in Firestore' });
      }

      // Check if user exists in Firebase Auth
      try {
        await admin.auth().getUser(firebase_uid);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          return res.status(404).json({ error: 'User not found in Firebase Auth' });
        }
        throw error;
      }

      // Begin deletion process
      try {
        // First archive the user data
        await archiveUser(connection, firebase_uid);

        // Then delete from all services
        await Promise.all([
          // Delete from SQL database
          connection.execute('DELETE FROM users WHERE firebase_uid = ?', [firebase_uid]),
          connection.execute('DELETE FROM user_info WHERE firebase_uid = ?', [firebase_uid]),
          // Delete from Firestore users collection
          admin.firestore().collection('users').doc(firebase_uid).delete(),
          // Delete from Firebase Auth
          admin.auth().deleteUser(firebase_uid)
        ]);

        res.status(200).json({ message: 'Account deleted and archived successfully' });
      } catch (error) {
        // If error occurs after archiving, we still have the archived data
        console.error('Error during deletion process:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(500).json({
        error: 'Failed to delete account',
        details: error.message
      });
    } finally {
      if (connection) connection.release();
    }
  },

  deleteAllUsers: async (req, res) => {
    try {
      const users = await admin.auth().listUsers();
      const deletePromises = Array.isArray(users.users) ? users.users.map(user => admin.auth().deleteUser(user.uid)) : [];
      await Promise.all(deletePromises);
      await admin.firestore().collection('users').get().then(querySnapshot => {
        querySnapshot.forEach(doc => doc.ref.delete());
      });
      await pool.query('DELETE FROM users');
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateUserDetails: async (req, res) => {
    let connection;
    try {
      const { firebase_uid, username, newpassword, display_picture } = req.body;

      // Get a connection from the pool
      connection = await pool.getConnection();

      // Update username if provided
      if (username) {
        await connection.execute(
          `UPDATE users SET username = ?, updated_at = ? WHERE firebase_uid = ?;`,
          [username, moment().format("YYYY-MM-DD HH:mm:ss"), firebase_uid]
        );

        await connection.execute(
          `UPDATE user_info SET username = ? WHERE firebase_uid = ?;`,
          [username, firebase_uid]
        );

        await admin.firestore().collection("users").doc(firebase_uid).update({
          username: username,
          updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        });

        await admin.auth().updateUser(firebase_uid, {
          displayName: username,
        });
      }

      // Update display picture if provided
      if (display_picture) {
        // Handle both formats: paths with /assets/ (production) or /profile-picture/ (dev)
        const normalizedPath = display_picture.replace(/^\/public/, '');

        await connection.execute(
          `UPDATE users SET display_picture = ?, updated_at = ? WHERE firebase_uid = ?;`,
          [normalizedPath, moment().format("YYYY-MM-DD HH:mm:ss"), firebase_uid]
        );

        await connection.execute(
          `UPDATE user_info SET display_picture = ? WHERE firebase_uid = ?;`,
          [normalizedPath, firebase_uid]
        );

        await admin.firestore().collection("users").doc(firebase_uid).update({
          display_picture: normalizedPath,
          updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      }

      // Update password if provided
      if (newpassword) {
        const hashedPassword = await bcrypt.hash(newpassword, 10);

        await connection.execute(
          `UPDATE users SET password_hash = ?, updated_at = ? WHERE firebase_uid = ?;`,
          [hashedPassword, moment().format("YYYY-MM-DD HH:mm:ss"), firebase_uid]
        );

        await admin.firestore().collection("users").doc(firebase_uid).update({
          password_hash: hashedPassword,
          updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        });

        await admin.auth().updateUser(firebase_uid, {
          password: newpassword,
        });
      }

      res.status(200).json({
        message: "User details updated successfully",
      });
    } catch (error) {
      console.error("Error updating user details:", error);
      res.status(500).json({ error: "Internal server error", details: error });
    } finally {
      if (connection) connection.release();
    }
  },

  storeUser,
  getStoredUser,
}

