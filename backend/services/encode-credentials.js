import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to JSON file (assuming it's in the backend root directory)
const filePath = path.join(__dirname, '..', 'lunar-goal-452311-e6-1af8037708ca.json');
console.log('Looking for file at:', filePath);

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const base64Content = Buffer.from(fileContent).toString('base64');

    // Save to a file in the current directory
    const outputPath = path.join(__dirname, 'credentials-base64.txt');
    fs.writeFileSync(outputPath, base64Content);

    console.log('Base64 credentials saved to:', outputPath);
    console.log('First 50 characters of base64 string:', base64Content.substring(0, 50) + '...');
} catch (error) {
    console.error('Error processing credentials file:', error.message);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        console.error('File not found! Please check the path:', filePath);

        // List files in the backend directory for debugging
        const parentDir = path.join(__dirname, '..');
        console.log('Files in backend directory:', fs.readdirSync(parentDir));
    }
}