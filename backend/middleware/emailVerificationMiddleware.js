import admin from "../services/firebaseAdmin.js";

const emailVerificationMiddleware = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
  
      if (!token) {
        return res.status(401).json({ message: "Unauthorized: No tokena provided" });
      }
  
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
  
      if (!decodedToken.email_verified) {
        return res.status(403).json({ message: "Email not verified. Please verify your email." });
      }
  
      // Attach user info to request for further use
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

export default emailVerificationMiddleware;
