import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

let openai;

try {
  // Add logging to see if the API key is being loaded
  console.log("OpenAI API Key present:", !!process.env.OPENAI_API_KEY);

  // Initialize OpenAI with the API key
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error("Error initializing OpenAI:", error);
}

export { openai };
