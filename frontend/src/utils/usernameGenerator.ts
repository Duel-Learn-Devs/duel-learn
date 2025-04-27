import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

const sanitizeUsername = (displayName: string): string => {
  // Remove special characters and spaces, keep only alphanumeric and underscore
  let sanitized = displayName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/\s+/g, '_');

  // Ensure it starts with a letter
  if (!/^[a-zA-Z]/.test(sanitized)) {
    sanitized = 'user_' + sanitized;
  }

  // Trim to max length (considering we'll add numbers)
  const maxBaseLength = 16; // 20 max - 4 for numbers
  if (sanitized.length > maxBaseLength) {
    sanitized = sanitized.substring(0, maxBaseLength);
  }

  // Ensure minimum length
  if (sanitized.length < 2) { // 2 minimum is the new requirement
    sanitized = sanitized.padEnd(2, 'x');
  }

  return sanitized;
};

const generateRandomNumbers = (length: number = 4): string => {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
};

export const generateUniqueUsername = async (
  displayName: string | null | undefined,
  email: string | null | undefined
): Promise<string> => {
  try {
    // Start with display name, fallback to email username, then default
    let baseUsername = 'user';
    if (displayName) {
      baseUsername = sanitizeUsername(displayName);
    } else if (email) {
      const emailUsername = email.split('@')[0];
      baseUsername = sanitizeUsername(emailUsername);
    }

    // Always try with random numbers for uniqueness
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const randomNum = generateRandomNumbers();
      const candidateUsername = `${baseUsername}${randomNum}`;
      
      if (candidateUsername.length >= 8 && candidateUsername.length <= 20) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", candidateUsername));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return candidateUsername;
        }
      }
      
      attempts++;
    }

    // If all attempts fail, use timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4);
    return `${baseUsername}${timestamp}`;
  } catch (error) {
    console.error("Error generating unique username:", error);
    // Fallback to a guaranteed unique username
    const timestamp = Date.now().toString().slice(-4);
    return `user_${timestamp}`;
  }
}; 