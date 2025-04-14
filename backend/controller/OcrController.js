import { ImageAnnotatorClient } from "@google-cloud/vision";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import multer from "multer";
import { promisify } from "util";
import { exec } from "child_process";
import pdfParse from "pdf-parse";
import pdf2pic from "pdf2pic";
import sharp from "sharp";
import { createWriteStream } from "fs";
import https from "https";

// Promisify exec for async/await
const execAsync = promisify(exec);

// Define __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add these constants at the top of your file
const CONFIG = {
  textDetectionTimeout: 30000, // Timeout for each API call in milliseconds
  retryAttempts: 3, // Number of times to retry failed API calls
  maxImages: 5, // Maximum number of images allowed for processing
};

// Create a Vision client using environment variables
let visionClient;
try {
  // Check if base64 credentials are provided
  if (process.env.GOOGLE_VISION_CREDENTIALS_BASE64) {
    try {
      console.log("Using base64 encoded credentials for Google Vision API");
      const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_VISION_CREDENTIALS_BASE64, 'base64').toString('utf8')
      );
      visionClient = new ImageAnnotatorClient({ credentials });
      console.log("Successfully initialized Vision API client with base64 credentials");
    } catch (parseError) {
      console.error("Failed to parse base64 credentials:", parseError);
      throw new Error(`Failed to parse base64 credentials: ${parseError.message}`);
    }
  }
  // Check if credentials are provided as a JSON string in env var
  else if (process.env.GOOGLE_VISION_CREDENTIALS) {
    try {
      // Only try to parse if it starts with '{' (looks like JSON)
      if (process.env.GOOGLE_VISION_CREDENTIALS.trim().startsWith("{")) {
        const credentials = JSON.parse(process.env.GOOGLE_VISION_CREDENTIALS);
        console.log(
          "Initializing Vision API client with credentials from environment variable"
        );
        visionClient = new ImageAnnotatorClient({ credentials });
      } else {
        // Treat as a file path
        console.log("Using credentials file path from environment variable");
        visionClient = new ImageAnnotatorClient({
          keyFilename: process.env.GOOGLE_VISION_CREDENTIALS,
        });
      }
    } catch (parseError) {
      console.error(
        "Failed to parse credentials from environment variable:",
        parseError
      );
      throw new Error(`Failed to use credentials from environment variable: ${parseError.message}`);
    }
  } else {
    // No credentials available
    throw new Error(
      "No Google Vision credentials found. Please set GOOGLE_VISION_CREDENTIALS_BASE64 environment variable."
    );
  }
  console.log("Vision API client initialized successfully");
} catch (error) {
  console.error("Failed to initialize Vision API client:", error);
  throw new Error(
    `Google Vision API client initialization failed: ${error.message}`
  );
}

// Configure temporary storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// File filter to ensure only supported images are accepted
const imageFileFilter = (req, file, cb) => {
  // Accept only images (no PDFs)
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Unsupported file type. Only JPEG and PNG files are allowed."),
      false
    );
  }
};

// Use the enhanced multer configuration
const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: CONFIG.maxImages, // Maximum number of files
  },
});

// Helper function to process any document (image) with OCR
async function processImageWithOCR(imagePath) {
  try {
    console.log(`Processing image: ${imagePath}`);

    // Verify file exists and check file size
    if (!fs.existsSync(imagePath)) {
      console.error(`Image file not found: ${imagePath}`);
      return ""; // Return empty string instead of throwing
    }

    const stats = fs.statSync(imagePath);
    console.log(`File size: ${stats.size} bytes`);

    if (stats.size === 0) {
      console.error(`File is empty: ${imagePath}`);
      return ""; // Return empty string instead of throwing
    }

    // Read the file
    let fileBuffer;
    try {
      fileBuffer = fs.readFileSync(imagePath);
      console.log(
        `Successfully read file, buffer length: ${fileBuffer.length} bytes`
      );

      // Simple validation for image files - check for image signatures
      const fileHeader = fileBuffer.slice(0, 4).toString("hex");
      const isPNG = fileHeader.startsWith("89504e47"); // PNG signature
      const isJPEG = fileHeader.startsWith("ffd8"); // JPEG signature

      if (!isPNG && !isJPEG) {
        console.error(`File ${imagePath} does not appear to be a valid image`);
        return ""; // Return empty for invalid images
      }
    } catch (readError) {
      console.error(`Error reading image file: ${readError.message}`);
      return ""; // Return empty if file reading fails
    }

    // Convert to base64
    let encodedFile;
    try {
      encodedFile = fileBuffer.toString("base64");
      console.log(
        `Converted file to base64, length: ${encodedFile.length} chars`
      );
    } catch (encodeError) {
      console.error(`Error encoding file to base64: ${encodeError.message}`);
      return ""; // Return empty if encoding fails
    }

    // Use regular text detection for images
    try {
      console.log(`Using textDetection for ${imagePath}`);
      const [result] = await visionClient.textDetection({
        image: { content: encodedFile },
        imageContext: {
          languageHints: ["en", "en-t-i0-handwrit"], // Include handwriting recognition
        },
      });

      // Extract text from text annotations
      if (result.textAnnotations && result.textAnnotations.length > 0) {
        const extractedText = result.textAnnotations[0].description;
        console.log(`Extracted ${extractedText.length} characters from image`);
        return extractedText;
      } else {
        console.log(`No text annotations found in API response`);
        return "";
      }
    } catch (visionError) {
      console.error(`Error in Vision API processing: ${visionError.message}`);
      return ""; // Return empty instead of propagating the error
    }
  } catch (error) {
    console.error(`Error processing image:`, error);
    // Return empty string instead of throwing to prevent crashes
    return "";
  }
}

// Create a new helper function for image preprocessing
async function preprocessImage(imagePath) {
  try {
    console.log(`Preprocessing image: ${imagePath}`);

    // Use sharp to enhance the image for better OCR
    const outputPath = `${imagePath.replace(/\.[^/.]+$/, "")}_preprocessed.png`;

    await sharp(imagePath)
      .grayscale() // Convert to grayscale
      .normalize() // Normalize the image (improves contrast)
      .sharpen() // Sharpen the image for better text detection
      .toFile(outputPath);

    console.log(`Preprocessed image saved at: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`Error preprocessing image:`, error);
    // If preprocessing fails, return the original image path
    return imagePath;
  }
}

// Helper function to clean up files
function cleanupFiles(files) {
  files.forEach((file) => {
    try {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);

        if (stats.isDirectory()) {
          // Remove directory content first
          const dirContents = fs.readdirSync(file);
          dirContents.forEach((item) => {
            const itemPath = path.join(file, item);
            if (fs.statSync(itemPath).isFile()) {
              fs.unlinkSync(itemPath);
            }
          });

          // Then remove the directory
          fs.rmdirSync(file);
          console.log(`Removed directory: ${file}`);
        } else {
          // Remove file
          fs.unlinkSync(file);
          console.log(`Removed file: ${file}`);
        }
      }
    } catch (error) {
      console.error(`Failed to clean up ${file}:`, error);
    }
  });

  console.log("Cleanup complete");
}

// Preprocessing function for text
function preprocessExtractedText(text) {
  // Remove excessive whitespace
  let processed = text.replace(/\s+/g, " ").trim();

  // Fix bullet point formatting
  processed = processed.replace(/•\s*/g, "\n• ");

  // Fix dash formatting (often used in definitions)
  processed = processed.replace(/\s-\s/g, " - ");

  // Fix arrow formatting (often used in handwritten notes)
  processed = processed.replace(/\s?→\s?/g, " - ");
  processed = processed.replace(/\s?->\s?/g, " - ");

  // Try to identify potential terms (capitalized phrases at beginning of lines)
  const lines = processed.split("\n");
  const structuredLines = lines.map((line) => {
    // If line starts with a capitalized word(s) followed by lowercase, add a line break after
    if (/^[A-Z][A-Za-z\s]+[a-z]\s+[a-z]/.test(line)) {
      const match = line.match(/^([A-Z][A-Za-z\s]+?[a-z])\s+([a-z].*)/);
      if (match) {
        return `${match[1]}\n${match[2]}`;
      }
    }
    return line;
  });

  // Rejoin and ensure proper spacing around bullet points
  processed = structuredLines.join("\n");

  // Handle terms with colons
  processed = processed.replace(/([^:]+):\s*/g, "$1\n");

  // Better handle numbered or bulleted lists which are common in notes
  processed = processed.replace(/(\d+[\.\)]) /g, "\n$1 ");

  // Better detect section headers (often all caps or numbered)
  processed = processed.replace(/^([0-9]+\.\s+[A-Z\s]+)$/gm, "\n$1\n");

  return processed;
}

// Add a helper function for PDF processing
async function processPdfWithOCR(pdfPath) {
  try {
    console.log(`Processing PDF: ${pdfPath}`);

    // Verify file exists and check file size
    if (!fs.existsSync(pdfPath)) {
      console.error(`PDF file not found: ${pdfPath}`);
      return ""; // Return empty string instead of throwing
    }

    const stats = fs.statSync(pdfPath);
    console.log(`File size: ${stats.size} bytes`);

    if (stats.size === 0) {
      console.error(`File is empty: ${pdfPath}`);
      return ""; // Return empty string instead of throwing
    }

    // First, try extracting text directly from the PDF using pdf-parse
    console.log("Attempting direct text extraction from PDF...");

    let pdfBuffer;
    try {
      pdfBuffer = fs.readFileSync(pdfPath);

      // Basic validation check for PDF signature
      const fileStart = pdfBuffer.slice(0, 5).toString();
      if (fileStart !== "%PDF-") {
        console.error(`File does not appear to be a valid PDF: ${pdfPath}`);
        return ""; // Return empty for invalid PDFs
      }
    } catch (readError) {
      console.error(`Error reading PDF file: ${readError.message}`);
      return ""; // Return empty if we can't read the file
    }

    try {
      const result = await pdfParse(pdfBuffer);
      const extractedText = result.text;

      // If we got meaningful text, return it
      if (extractedText && extractedText.trim().length > 50) {
        console.log(
          `Successfully extracted ${extractedText.length} characters from PDF directly`
        );
        return extractedText;
      }

      console.log(
        "Direct extraction yielded insufficient text, falling back to OCR..."
      );
    } catch (pdfParseError) {
      console.log(
        `Direct PDF text extraction failed: ${pdfParseError.message}`
      );
    }

    // If direct extraction fails or yields little text, use Google Vision documentTextDetection
    console.log("Using documentTextDetection for PDF...");

    try {
      // Convert to base64
      const encodedFile = pdfBuffer.toString("base64");
      console.log(
        `Converted file to base64, length: ${encodedFile.length} chars`
      );

      // Use document text detection for PDFs (better for structured text)
      const [result] = await visionClient.documentTextDetection({
        image: { content: encodedFile },
        imageContext: {
          languageHints: ["en"],
        },
      });

      // Extract text from text annotations
      if (result.fullTextAnnotation) {
        const extractedText = result.fullTextAnnotation.text;
        console.log(
          `Extracted ${extractedText.length} characters from PDF with OCR`
        );
        return extractedText;
      } else {
        console.log(`No text annotations found in API response for PDF`);
        return "";
      }
    } catch (visionError) {
      console.error(`Error in Vision API processing: ${visionError.message}`);
      return ""; // Return empty instead of propagating the error
    }
  } catch (error) {
    console.error(`Error processing PDF:`, error);
    return ""; // Return empty string instead of throwing
  }
}

// Main controller with improved logging
const ocrController = {
  // New method to handle multiple images and PDFs
  extractTextFromMultipleImages: async (req, res) => {
    try {
      console.log("=== MULTIPLE FILES OCR PROCESS START ===");
      console.log(
        `Request received, files:`,
        req.files ? `${req.files.length} files` : "None"
      );

      if (!req.files || req.files.length === 0) {
        console.log("No files uploaded");
        return res.status(400).json({ error: "No files uploaded" });
      }

      if (req.files.length > CONFIG.maxImages) {
        console.log(`Too many files: ${req.files.length}`);
        return res.status(400).json({
          error: `Maximum ${CONFIG.maxImages} files allowed`,
        });
      }

      // Process each file sequentially and collect all text
      const tempFiles = [];
      let allExtractedText = "";
      let processedCount = 0;
      let errorCount = 0;

      // Process each file one by one
      for (let i = 0; i < req.files.length; i++) {
        try {
          const file = req.files[i];
          const filePath = file.path;
          const fileName = file.originalname;
          const fileType = file.mimetype;

          console.log(
            `Processing file ${i + 1} of ${req.files.length
            }: ${fileName} (${fileType})`
          );

          if (!fs.existsSync(filePath)) {
            console.error(`File not found at path: ${filePath}`);
            errorCount++;
            continue; // Skip this file and continue with others
          }

          let extractedText = "";

          // Handle PDF files differently than images
          if (fileType === "application/pdf") {
            console.log(`Detected PDF file: ${fileName}`);
            extractedText = await processPdfWithOCR(filePath);
          } else {
            // Handle image files
            console.log(`Detected image file: ${fileName}`);
            // Preprocess the image
            console.log("Preprocessing image for better OCR results...");
            const preprocessedImagePath = await preprocessImage(filePath);
            tempFiles.push(preprocessedImagePath);

            // Extract text from the preprocessed image
            extractedText = await processImageWithOCR(preprocessedImagePath);
          }

          if (extractedText && extractedText.trim()) {
            processedCount++;
            // Add page marker and the extracted text
            allExtractedText += `\n\n--- File ${i + 1
              }: ${fileName} ---\n\n${extractedText}`;
            console.log(
              `Successfully extracted ${extractedText.length
              } characters from file ${i + 1}`
            );
          } else {
            console.log(`No text extracted from file ${i + 1}`);
            errorCount++;
          }
        } catch (processingError) {
          console.error(`Error processing file ${i + 1}:`, processingError);
          errorCount++;
        }
      }

      // Check if any text was extracted
      if (!allExtractedText || allExtractedText.trim() === "") {
        console.log("No text could be extracted from any of the files");
        return res.status(422).json({
          error: "No text found",
          details: "No recognizable text could be extracted from the files",
        });
      }

      // Add a summary of the extraction process
      const summary = `\n\n=== Extraction Summary ===\nSuccessfully processed ${processedCount} of ${req.files.length
        } files${errorCount > 0 ? ` (${errorCount} files had issues)` : ""}\n`;

      allExtractedText = summary + allExtractedText;

      console.log(
        `Extracted text from all files, total length: ${allExtractedText.length}`
      );

      // Clean up temporary files
      cleanupFiles([...tempFiles, ...req.files.map((f) => f.path)]);

      return res.status(200).json({
        text: allExtractedText.trim(),
        fileCount: req.files.length,
        successCount: processedCount,
        errorCount: errorCount,
      });
    } catch (error) {
      console.error("Error processing files:", error);
      return res.status(500).json({
        error: "An error occurred while processing the files",
        details: error.message || "Unknown error during OCR processing",
      });
    }
  },

  // Add the old methods with a redirect for compatibility
  extractTextFromImage: async (req, res) => {
    try {
      console.log("=== SINGLE IMAGE OCR PROCESS START ===");

      if (!req.file) {
        console.log("No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname;

      console.log(`Processing single image: ${fileName}`);

      let tempFiles = [];

      try {
        // Preprocess the image
        console.log("Preprocessing image for better OCR results...");
        const preprocessedImagePath = await preprocessImage(filePath);
        tempFiles.push(preprocessedImagePath);

        // Extract text from the preprocessed image
        const extractedText = await processImageWithOCR(preprocessedImagePath);

        if (!extractedText || extractedText.trim() === "") {
          console.log("No text could be extracted from the image");
          return res.status(422).json({
            error: "No text found",
            details: "No recognizable text could be extracted from the image",
          });
        }

        console.log(`Extracted ${extractedText.length} characters from image`);

        // Clean up temporary files
        cleanupFiles([...tempFiles, filePath]);

        return res.status(200).json({
          text: extractedText.trim(),
          fileName: fileName,
        });
      } catch (error) {
        console.error("Error processing image:", error);
        return res.status(500).json({
          error: "An error occurred while processing the image",
          details: error.message,
        });
      }
    } catch (error) {
      console.error("Error handling single image request:", error);
      return res.status(500).json({
        error: "An error occurred while processing the request",
        details: error.message,
      });
    }
  },

  // Existing method to extract term-definition pairs
  extractTermDefinitionPairs: async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      // Preprocess the text to improve structure
      const preprocessedText = preprocessExtractedText(text);
      console.log(
        "Preprocessed text:",
        preprocessedText.substring(0, 200) + "..."
      );

      // Import OpenAI with proper error handling
      console.log("Importing OpenAI...");
      let openaiModule;
      try {
        openaiModule = await import("../config/openai.js");
        if (!openaiModule.openai) {
          throw new Error("OpenAI client not initialized");
        }
      } catch (importError) {
        console.error("OpenAI import error:", importError);
        return res.status(500).json({
          error: "Failed to initialize AI services",
          details: importError.message,
        });
      }

      const { openai } = openaiModule;

      // Updated prompt as suggested
      const prompt = `
          Analyze this educational text and create flashcard-style term-definition pairs:

          TEXT:
          ${preprocessedText}

          INSTRUCTIONS:
1. ONLY extract terms that have clearly designated definitions in the text. Do not create or infer definitions for terms that don't have them explicitly stated.
2. You can fix minimal errors in the text to make it more readable.
2. A term must have an EXPLICIT definition directly following it - usually after a colon, dash, or on the next line with clear indentation.
3. Headers, titles, section names, or category labels are NOT terms with definitions - ignore these completely.
4. If a term appears as a list item without a definition, DO NOT include it.
5. Extract one term with its complete corresponding definition. If a term appears with different contexts/definitions, create separate entries for each definition.
6. Ignore section headers, titles, or topic markers that aren't actual defined terms with associated definitions.
7. Use the EXACT definition as provided in the text - do not paraphrase, summarize, or modify the extracted definitions.
8. Only include terms that have substantive definitions. Skip terms with vague or incomplete explanations.
9. Format your response as a JSON array of term-definition pairs.

          FORMAT:
          [
  {"term": "Term1", "definition": "The exact and complete definition as found in the text..."},
  {"term": "Term2", "definition": "The exact and complete definition as found in the text..."}
          ]

          EXAMPLE INPUT:
"4 Number Systems
Binary - (NO DEFINITION)
Decimal - (NO DEFINITION)
Octal - (NO DEFINITION)"

          EXAMPLE OUTPUT:
{No need to return anything}.

          RESPONSE FORMAT: Return ONLY the JSON array with no additional text.
`;

      console.log("Sending request to OpenAI...");

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000,
      });

      // Parse the AI response
      const content = response.choices[0].message.content.trim();
      console.log("AI response received:", content.substring(0, 100) + "...");

      // After receiving the response, add this debug log
      console.log("FULL RAW RESPONSE:", content);

      try {
        // Parse the response as JSON
        const jsonResponse = JSON.parse(content);
        console.log(
          "Parsed JSON response type:",
          typeof jsonResponse,
          Array.isArray(jsonResponse)
        );

        // Check if we have the expected array structure
        if (Array.isArray(jsonResponse)) {
          // Direct array format - most likely case
          return res.json({ pairs: jsonResponse });
        } else if (Array.isArray(jsonResponse.pairs)) {
          // Object with pairs property
          return res.json({ pairs: jsonResponse.pairs });
        } else {
          // Log the full response structure for debugging
          console.log(
            "Unexpected response structure:",
            JSON.stringify(jsonResponse)
          );

          // Check if there's any array property we can use
          for (const key in jsonResponse) {
            if (Array.isArray(jsonResponse[key])) {
              return res.json({ pairs: jsonResponse[key] });
            }
          }

          throw new Error(
            "Unexpected response structure: " + JSON.stringify(jsonResponse)
          );
        }
      } catch (parseError) {
        console.error("Parse error:", parseError);
        console.log("Raw content:", content);

        // NEW FALLBACK PARSING - more aggressive approach
        try {
          // Look for anything that resembles a JSON array with term and definition
          const simplifiedContent = content.replace(/\s+/g, " ").trim();

          // Match just the array part using regex
          const arrayMatch = simplifiedContent.match(/\[\s*\{.*?\}\s*\]/s);
          if (arrayMatch) {
            const extractedArray = arrayMatch[0];
            console.log("Extracted array part:", extractedArray);

            // Try to parse just that part
            const parsed = JSON.parse(extractedArray);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return res.json({ pairs: parsed });
            }
          }

          // If the text has term/definition pattern, manually construct JSON
          if (
            simplifiedContent.includes('"term"') &&
            simplifiedContent.includes('"definition"')
          ) {
            const pairsRegex =
              /"term"\s*:\s*"([^"]*)"\s*,\s*"definition"\s*:\s*"([^"]*)"/g;
            const pairs = [];
            let match;

            while ((match = pairsRegex.exec(simplifiedContent)) !== null) {
              pairs.push({
                term: match[1],
                definition: match[2],
              });
            }

            if (pairs.length > 0) {
              return res.json({ pairs });
            }
          }
        } catch (fallbackError) {
          console.error("Fallback parsing also failed:", fallbackError);
        }

        // Existing fallback logic...
        return res.json({
          pairs: [{ term: "Sample Term", definition: "Sample Definition" }],
          notice: "AI response could not be parsed, showing sample data",
        });
      }
    } catch (error) {
      console.error("Error in term extraction:", error);
      return res.status(500).json({
        error: "Failed to extract term-definition pairs",
        details: error.message,
      });
    }
  },
};

export default ocrController;