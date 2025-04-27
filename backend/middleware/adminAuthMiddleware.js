import admin from '../services/firebaseAdmin.js';
import { pool } from '../config/db.js';

/**
 * Middleware to verify if a user has admin privileges
 * Sends structured response messages that can be displayed in the frontend Snackbar
 */
export const adminAuthMiddleware = async (req, res, next) => {
  try {
    // 1. Get the authorization header
    const authHeader = req.headers.authorization;
    console.log('Admin check - Auth header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access admin features',
        severity: 'error',
      });
    }
    
    // 2. Extract the token
    const token = authHeader.split(' ')[1];
    console.log('Admin check - Token exists:', !!token);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Valid token required for admin access',
        severity: 'error',
      });
    }
    
    try {
      // 3. Verify the token with Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Admin check - Token decoded, UID:', decodedToken.uid);
      
      // 4. Check if user exists in our database
      let connection;
      try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
          'SELECT account_type FROM users WHERE firebase_uid = ?',
          [decodedToken.uid]
        );
        
        console.log('Admin check - User DB result:', rows);
        
        if (rows.length === 0) {
          console.log('Admin check failed - User not found in database');
          return res.status(403).json({
            success: false,
            message: 'User not found in our database',
            severity: 'error',
          });
        }
        
        const user = rows[0];
        console.log('Admin check - User account type:', user.account_type);
        
        // 5. Check if the user has admin account type in our database
        if (user.account_type !== 'admin') {
          console.log('Admin check failed - Not an admin account');
          return res.status(403).json({
            success: false,
            message: 'Your account does not have admin privileges',
            severity: 'error',
          });
        }
        
        // 6. Add the user info to the request object for later use
        req.user = {
          ...decodedToken,
          account_type: user.account_type
        };
        
        console.log('Admin check passed for user:', decodedToken.uid);
        
        // 7. If all checks pass, proceed to the next middleware/handler
        next();
      } finally {
        if (connection) connection.release();
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
        severity: 'error',
      });
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while validating admin access',
      severity: 'error',
    });
  }
};

export default adminAuthMiddleware; 