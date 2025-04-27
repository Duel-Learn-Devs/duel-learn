import express from "express";
import multer from "multer";
import ocrController from "../controller/OcrController.js";
import os from "os";

const router = express.Router();

// Configure multer for multiple file uploads
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5, // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Unsupported file type. Only JPEG, PNG, and PDF files are allowed."
        ),
        false
      );
    }
  },
});

// Route for extracting text from a single image (for backward compatibility)
router.post(
  "/extract-text",
  upload.single("file"),
  ocrController.extractTextFromImage
);

// New route for extracting text from multiple images or PDFs
router.post(
  "/extract-multiple",
  upload.array("files", 5), // Accept up to 5 files with field name "files"
  ocrController.extractTextFromMultipleImages
);

// Route for extracting term-definition pairs
router.post("/extract-pairs", ocrController.extractTermDefinitionPairs);

export default router;