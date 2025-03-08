import axios from "axios";

const MODE = 1; // Change this to 1 for multiple choice, 0 for true/false

export const generateAIResponse = async (term, definition, studyMaterial) => {
  let prompt;

  switch (MODE) {
    case 0: // True/False Mode
      prompt = `
        You are an AI that creates true/false variations of term-definition pairs.
        Here is a term and its definition:

        Term: ${term}
        Definition: ${definition}

        Your task:
        - Create a statement combining the term and definition.
        - Randomly decide if the statement should be TRUE or FALSE.
        - If false, make a small but **subtle** change to the term or a **minor part of the definition** without paraphrasing the whole definition.
        - **If the definition is too short or lacks enough context, DO NOT change the definition. Instead, swap the term with a related term from the study material that still makes sense with the definition.**
        - False statements should sound **plausible** at first glance but still be incorrect.
        - Avoid making false statements that are too obvious or unrealistic.
        - Respond in this format: "Statement: [Your generated statement] Answer: [True/False]"

        Example 1 (normal case):
        Term: AI
        Definition: Is an advanced and modern tool used to help people accomplish their daily tasks.
        Output: "Statement: AI is an advanced and common tool used to help people accomplish their daily tasks. Answer: False"

        Example 2 (short definition → change term instead):
        Term: CPU
        Definition: Central Processing Unit.
        Output: "Statement: GPU is the Central Processing Unit of a computer. Answer: False"
      `;
      break;

    case 1: // Multiple Choice Mode
      prompt = `
    You are an AI that generates multiple-choice questions based on term-definition pairs.
    Here is a term and its definition:
  
    Term: ${term}
    Definition: ${definition}
  
    Study Material Terms: ${
      Array.isArray(studyMaterial)
        ? studyMaterial.map((item) => item.term).join(", ")
        : "None available"
    }

    Your task:
    - Use the **definition** as the question.
    - The **correct answer** is the given **term**.
    - Generate **three incorrect but tricky choices** that are related to the topic.
    - **Prefer using terms from the Study Material Terms list** whenever possible.
    - If no suitable term exists, generate tricky but related choices.
    - Respond in this format:
      "Question: [Definition as the question]\nCorrect Answer: [Term]\nOther Choices: [Choice 1], [Choice 2], [Choice 3]"
  `;
      break;
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Error generating question.";
  }
};

export default generateAIResponse;
