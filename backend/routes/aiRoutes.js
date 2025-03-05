import express from "express";
import { OpenAI } from "openai";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/generate-questions", async (req, res) => {
  console.log("Received request to generate questions");
  let { term, definition, selectedQuestionTypes, numberOfItems } = req.body;
  
  // Clean the term by removing any letter prefix (e.g., "D. AI" becomes "AI")
  term = term.replace(/^[A-D]\.\s+/, '');
  
  console.log("Cleaned request body:", { term, definition, selectedQuestionTypes, numberOfItems });

  // If identification is selected, return the original term and definition
  if (selectedQuestionTypes.length === 1 && selectedQuestionTypes[0] === 'identification') {
    console.log("Identification question type selected, returning original format");
    return res.json([{
      type: 'identification',
      question: definition,
      answer: term
    }]);
  }

  // If true/false is selected, generate a true/false question
  if (selectedQuestionTypes.length === 1 && selectedQuestionTypes[0] === 'true-false') {
    console.log("True/false question type selected");
    try {
      const prompt = `Generate a true/false question based on this term and definition:
Term: "${term}"
Definition: "${definition}"

Rules:
1. Use the definition to create a statement that can be true or false
2. The statement should be clear and unambiguous
3. The answer should be either "True" or "False"

Format the response exactly as:
{
  "type": "true-false",
  "question": "(statement based on the definition)",
  "answer": "(True or False)"
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful AI that generates true/false questions. Create clear statements that can be definitively answered as True or False based on the given term and definition.' 
          },
          { role: 'user', content: prompt }
        ]
      });

      const text = completion.choices[0].message.content;
      console.log("AI response for true/false:", text);

      // Parse and validate the response
      const cleanedText = text.replace(/```json|```/g, '').trim();
      let question = JSON.parse(cleanedText);
      
      // Ensure it's in array format
      question = Array.isArray(question) ? question : [question];
      
      console.log("Sending true/false response:", question);
      return res.json(question);
    } catch (error) {
      console.error("Error generating true/false question:", error);
      return res.status(500).json({
        error: "Failed to generate true/false question",
        details: error.message
      });
    }
  }

  if (!term || !definition || !selectedQuestionTypes || !selectedQuestionTypes.length || !numberOfItems) {
    console.log("Missing required parameters");
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // Continue with multiple choice question generation if not true/false or identification
  try {
    console.log("Creating multiple choice prompt");
    let prompt = `Generate ${numberOfItems} multiple choice questions based on this term and definition:
Term: "${term}"
Definition: "${definition}"

Rules for generating the question:
1. Use the EXACT original definition as the question
2. Generate 3 plausible but incorrect options that are similar in nature to the original term
3. The original term MUST be one of the options
4. Options must be complete words or phrases, NEVER single letters
5. Each option should be 1-3 words maximum
6. All options should be of similar length and style to the original term

Format the response exactly as:
{
  "type": "multiple-choice",
  "question": "${definition}",
  "options": {
    "A": "(first option)",
    "B": "(second option)",
    "C": "(third option)",
    "D": "(fourth option)"
  },
  "answer": "(letter). ${term}"
}

Example:
If term="AI" and definition="is helpful", generate something like:
{
  "type": "multiple-choice",
  "question": "is helpful",
  "options": {
    "A": "Machine Learning",
    "B": "Neural Network",
    "C": "AI",
    "D": "Deep Learning"
  },
  "answer": "C. AI"
}

Important:
- The answer format must be "letter. term" where letter matches where the term appears in options
- Never use single letters or numbers as options
- Keep options concise and similar in style to the original term
- The original term must appear exactly as provided in one of the options
- Use the original definition exactly as provided for the question\n`;

    console.log("Prompt created:", prompt);

    console.log("Generating text with OpenAI");
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful AI that generates multiple-choice questions. Always use the original definition as the question, include the original term as one of the options, and ensure all options are proper words or phrases (never single letters or numbers). Format the answer as "letter. term" where the letter matches where the term appears in the options.' 
        },
        { role: 'user', content: prompt }
      ]
    });

    const text = completion.choices[0].message.content;
    console.log("AI response received");
    console.log("Raw AI response:", text);

    // Remove any Markdown formatting from the response
    const cleanedText = text.replace(/```json|```/g, '').trim();

    let questions;
    try {
      console.log("Parsing AI response");
      questions = JSON.parse(cleanedText);
      console.log("Questions parsed successfully:", questions);

      // Ensure questions is always an array
      if (!Array.isArray(questions)) {
        questions = [questions];
      }

      // Validate and fix the response
      questions = questions.map(q => {
        if (q.type === 'multiple-choice' && q.options) {
          // Find which option contains the original term
          const optionLetter = Object.entries(q.options).find(([_, value]) => value === term)?.[0];
          if (optionLetter) {
            q.answer = `${optionLetter}. ${term}`;
          }
        }
        return q;
      });

      console.log("Sending response:", questions);
      res.json(questions);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", cleanedText);
      console.error("Parse error:", parseError);
      res.status(500).json({
        error: "Failed to parse questions",
        rawResponse: cleanedText,
        parseError: parseError.message,
      });
    }
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({
      error: "Failed to generate questions",
      details: error.message,
      stack: error.stack,
    });
  }
});

export default router;