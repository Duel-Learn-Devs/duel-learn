import express from "express";
import { OpenAiController } from "../controller/OpenAiController.js";
const router = express.Router();

router.get("/status", (req, res) => {
  const apiKeyExists = !!process.env.OPENAI_API_KEY;
  const apiKeyFirstChars = apiKeyExists
    ? `${process.env.OPENAI_API_KEY.substring(
      0,
      3
    )}...${process.env.OPENAI_API_KEY.substring(
      process.env.OPENAI_API_KEY.length - 3
    )}`
    : "not set";

  res.json({
    status: 'OpenAI API routes are configured',
    apiKeyConfigured: apiKeyExists,
    apiKeyHint: apiKeyFirstChars,
    routesAvailable: [
      '/api/openai/generate-summary (POST)',
      '/api/openai/generate-identification (POST)',
      '/api/openai/generate-true-false (POST)',
      '/api/openai/generate-multiple-choice (POST)',
      '/api/openai/save-session-results (POST)',
      '/api/openai/status (GET)'
    ],
    serverTime: new Date().toISOString()
  });
});

router.post("/generate-summary", OpenAiController.generateSummary);
router.post(
  "/generate-identification",
  OpenAiController.generateIdentification
);
router.post("/generate-true-false", OpenAiController.generateTrueFalse);
router.post(
  "/generate-multiple-choice",
  OpenAiController.generateMultipleChoice
);
router.post("/save-session-results", OpenAiController.saveSessionResults);
router.delete(
  "/clear-questions/:studyMaterialId",
  OpenAiController.clearQuestionsForMaterial
);
router.post(
  "/cross-reference-definition",
  OpenAiController.crossReferenceDefinition
);
router.get("/test", (req, res) => {
  res.json({ success: true, message: "API is working" });
});

export default router;
