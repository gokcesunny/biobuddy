import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { QuizData, LessonData, WorksheetItem } from "../types";

// Helper to get client
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction for the main chat
const TUTOR_SYSTEM_INSTRUCTION = `
You are BioBuddy, an enthusiastic, knowledgeable, and patient biology tutor. 
Your goal is to help students understand biological concepts from cell theory to ecosystems.
- Explain concepts clearly, using analogies where appropriate.
- If a user asks a question, answer it accurately but encourage critical thinking.
- Use formatting (bullet points, bold text) to make answers readable.
- If the topic is not related to biology or science, politely steer the conversation back to biology.
`;

/**
 * Manages a chat session
 */
export const createChatSession = (): Chat => {
  const ai = getClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview', // Strong reasoning model for STEM
    config: {
      systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 1024 }, // Enable some thinking for complex biology questions
    },
  });
};

/**
 * Generates a structured Biology Quiz
 */
export const generateBiologyQuiz = async (topic: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<QuizData> => {
  const ai = getClient();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A catchy title for the quiz" },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "A list of 4 possible answers"
            },
            correctAnswer: { type: Type.STRING, description: "The exact string text of the correct option" },
            explanation: { type: Type.STRING, description: "Brief explanation of why the answer is correct" }
          },
          required: ["id", "question", "options", "correctAnswer", "explanation"],
          propertyOrdering: ["id", "question", "options", "correctAnswer", "explanation"]
        }
      }
    },
    required: ["title", "questions"],
    propertyOrdering: ["title", "questions"]
  };

  const prompt = `Create a ${difficulty} biology quiz about ${topic} with 5 questions. Return ONLY JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Flash is great for structured JSON tasks
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No quiz generated");
  
  return JSON.parse(text) as QuizData;
};

/**
 * Generates content for a Biology Lesson on a specific Kingdom
 */
export const generateKingdomOrganisms = async (kingdom: string): Promise<LessonData> => {
  const ai = getClient();

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      kingdom: { type: Type.STRING },
      organisms: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Common name of the organism" },
            scientificName: { type: Type.STRING, description: "Scientific name (Genus species)" },
            habitat: { type: Type.STRING, description: "Typical habitat or environment" },
            description: { type: Type.STRING, description: "A short description (2-3 sentences)" },
            characteristics: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3-5 key characteristics" 
            },
            mnemonic: { type: Type.STRING, description: "A simple memory trick" },
            imagePrompt: { type: Type.STRING, description: "Detailed visual description for an educational diagram" }
          },
          required: ["name", "scientificName", "habitat", "description", "characteristics", "mnemonic", "imagePrompt"],
          propertyOrdering: ["name", "scientificName", "habitat", "description", "characteristics", "mnemonic", "imagePrompt"]
        }
      }
    },
    required: ["kingdom", "organisms"],
    propertyOrdering: ["kingdom", "organisms"]
  };

  const prompt = `Teach me about 5 distinct organisms from the Kingdom ${kingdom}.
  For each organism, provide:
  - Scientific name
  - Habitat
  - A short description (2-3 sentences)
  - 3–5 key characteristics
  - A simple memory trick (mnemonic)
  - A description for generating a safe, educational image.
  
  Ensure the list is diverse and accurate.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No lesson content generated");

  return JSON.parse(text) as LessonData;
};

/**
 * Generates a full worksheet for 30 organisms
 */
export const generateBiologyWorksheet = async (): Promise<WorksheetItem[]> => {
  const ai = getClient();
  
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        kingdom: { type: Type.STRING },
        name: { type: Type.STRING },
        characteristics: { type: Type.STRING, description: "A concise summary of key characteristics" }
      },
      required: ["kingdom", "name", "characteristics"],
    }
  };

  const prompt = `Create a list of 30 distinct organisms, exactly 5 from each of the 6 kingdoms of life (Archaebacteria, Eubacteria, Protista, Fungi, Plantae, Animalia).
  For each organism, provide:
  - Kingdom
  - Common Name
  - A concise summary of its key characteristics (1-2 sentences).
  
  This will be used for a student worksheet.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No worksheet content generated");
  
  return JSON.parse(text) as WorksheetItem[];
};

/**
 * Generates a biological diagram
 */
export const generateDiagram = async (description: string): Promise<string> => {
  const ai = getClient();
  
  // Switch to Imagen for better generation and potential permission fix
  // Using generateImages instead of generateContent
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `A clear, educational, labeled biological diagram of: ${description}. Style: Scientific textbook illustration, white background. Safety: Family safe, educational content only.`,
    config: {
      numberOfImages: 1,
      aspectRatio: '4:3',
      outputMimeType: 'image/jpeg' 
    }
  });

  const base64Data = response.generatedImages?.[0]?.image?.imageBytes;
  if (base64Data) {
    return `data:image/jpeg;base64,${base64Data}`;
  }
  
  throw new Error("No image generated");
};