import { GoogleGenAI, Chat, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = "AIzaSyAfEMY6w4-wkpGUOT1ymOcpgs7BJEBiBd0";
    if (!apiKey) {
      console.warn("Gemini API Key is missing. AI features will be disabled.");
      throw new Error("API_KEY is missing.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

// Define Tool for Adding/Updating Tasks
const createTaskTool = {
  name: "createTask",
  description: "Create, update, or delete a task or calendar event. Use UPDATE with status='DONE' to mark tasks as completed.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ["CREATE", "UPDATE", "DELETE"] },
      id: { type: Type.STRING, description: "Task ID. Required for UPDATE/DELETE." },
      title: { type: Type.STRING },
      date: { type: Type.STRING, description: "ISO Date string for the deadline." },
      category: { type: Type.STRING, enum: ["PRODUCT", "CONTENT", "MONEY", "ADMIN", "MEETING"] },
      priority: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
      status: { type: Type.STRING, enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] }
    },
    required: ["action"],
  },
};

// Define Tool for Clients
const manageClientTool = {
  name: "manageClient",
  description: "Add or update a Client in the database.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ["CREATE", "UPDATE"] },
      name: { type: Type.STRING },
      email: { type: Type.STRING },
      notes: { type: Type.STRING },
      status: { type: Type.STRING, enum: ["ACTIVE", "INACTIVE"] }
    },
    required: ["action", "name"]
  }
};

// Define Tool for Projects
const manageProjectTool = {
  name: "manageProject",
  description: "Add, update or change status of a Project.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ["CREATE", "UPDATE"] },
      title: { type: Type.STRING },
      clientName: { type: Type.STRING },
      status: { type: Type.STRING, enum: ["ACTIVE", "COMPLETED", "ARCHIVED"] },
      price: { type: Type.NUMBER },
      progress: { type: Type.NUMBER }
    },
    required: ["action"]
  }
};

// Define Tool for Learning/Memory
const updateMemoryTool = {
  name: "updateMemory",
  description: "Save a new fact, preference, or context about the user to long-term memory.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      memory: {
        type: Type.STRING,
        description: "The fact or preference to append to memory. Be concise.",
      },
    },
    required: ["memory"],
  },
};

export const initializeGemini = (userContext: string = ""): Chat => {
  const ai = getGenAI();

  const tailoredInstruction = `${SYSTEM_INSTRUCTION}
  
  \n\n[USER LONG-TERM MEMORY & CONTEXT]:
  The following is what you have learned about this user over time. Adapt your tone, advice, and responses based on this:
  ${userContext ? userContext : "No prior memory established yet."}

  \n\nIMPORTANT: Use Markdown formatting aggressively. Use ### Headers, **Bold**, and - Bullet points.`;

  chatSession = ai.chats.create({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: tailoredInstruction,
      temperature: 0.7,
      tools: [{ functionDeclarations: [createTaskTool, manageClientTool, manageProjectTool, updateMemoryTool] }]
    },
  });

  return chatSession;
};

export const resetGeminiSession = () => {
  chatSession = null;
};

// Return type extended to support function calls in UI layer
export interface GeminiResponse {
  text: string;
  functionCalls?: any[];
}

export const sendMessageToGemini = async (message: string, imageBase64?: string, context?: string, userMemory?: string, isIgnite?: boolean): Promise<GeminiResponse> => {
  if (!chatSession) {
    try {
      initializeGemini(userMemory || "");
    } catch (e) {
      console.error("Failed to init gemini inside sendMessage", e);
      throw e;
    }
  }

  if (!chatSession) {
    throw new Error("Failed to initialize Gemini session.");
  }

  try {
    // Supplement prompt with context if available
    let finalMessage = message;
    if (context) {
      finalMessage = `[CURRENT APP STATE CONTEXT]:\n${context}\n\n[USER REQUEST]:\n${message}`;
    }

    if (isIgnite) {
      finalMessage = `[SUPER AGENT MODE: IGNITE ACTIVATED]\n\nINSTRUCTION: You are in a high-powered execution mode. \n1. Analyze the request deeply.\n2. If tasks are mentioned via @, prioritize them.\n3. Verify your plan before answering.\n4. You have full permission to CREATE, UPDATE, DELETE tasks/clients/projects if implied.\n\n${finalMessage}`;
    }

    let response;
    if (imageBase64) {
      const cleanBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
      const mimeType = imageBase64.includes(':') && imageBase64.includes(';')
        ? imageBase64.split(':')[1].split(';')[0]
        : 'image/png';

      response = await chatSession.sendMessage({
        message: [
          { text: finalMessage },
          { inlineData: { mimeType, data: cleanBase64 } }
        ]
      });
    } else {
      response = await chatSession.sendMessage({ message: finalMessage });
    }

    // Check for tool calls
    const functionCalls = response.functionCalls;

    return {
      text: response.text || ((functionCalls && functionCalls.length > 0) ? "Processing action..." : "No response generated."),
      functionCalls: functionCalls ? functionCalls.map((fc: any) => ({
        name: fc.name,
        args: fc.args
      })) : undefined
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    try {
      // Retry logic: Re-init and retry simple message
      initializeGemini(userMemory || "");
      if (chatSession) {
        const result = await chatSession.sendMessage({ message: message });
        return { text: result.text || "Error recovered." };
      }
    } catch (e) { }

    throw error;
  }
};

// Helper to send tool response back to Gemini (Multi-turn)
export const sendToolResponseToGemini = async (functionName: string, functionId: string, result: any): Promise<string> => {
  if (!chatSession) return "Session lost.";

  const response = await chatSession.sendMessage({
    message: [{
      functionResponse: {
        name: functionName,
        response: { result: result }
      }
    }]
  });

  return response.text || "Action completed.";
};

export const analyzeVideoConcept = async (concept: string): Promise<string> => {
  const ai = getGenAI();
  const prompt = `ACT AS A VIRAL CONTENT ALGORITHM EXPERT. Analyze this video concept: "${concept}". Return formatted Markdown report.`;
  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt
  });
  return result.text || "Analysis Failed.";
};

export const generateMockup = async (modelBase64: string, garmentBase64: string, userPrompt: string): Promise<string> => {
  const ai = getGenAI();
  const cleanBase64 = (str: string) => str.includes('base64,') ? str.split('base64,')[1] : str;
  const getMimeType = (str: string) => str.includes(':') && str.includes(';') ? str.split(':')[1].split(';')[0] : 'image/png';
  const modelData = cleanBase64(modelBase64);
  const garmentData = cleanBase64(garmentBase64);
  const modelMime = getMimeType(modelBase64);
  const garmentMime = getMimeType(garmentBase64);

  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      parts: [
        { text: `Generate a high-quality, photorealistic fashion mockup. Instruction: Put the clothing item shown in the second image onto the model shown in the first image. ${userPrompt}` },
        { inlineData: { mimeType: modelMime, data: modelData } },
        { inlineData: { mimeType: garmentMime, data: garmentData } }
      ]
    }
  });

  return result.text || "Mockup generation failed.";
};

export const extendImage = async (imageBase64: string, aspectRatio: string, userPrompt: string): Promise<string> => {
  const ai = getGenAI();
  const cleanBase64 = (str: string) => str.includes('base64,') ? str.split('base64,')[1] : str;
  const getMimeType = (str: string) => str.includes(':') && str.includes(';') ? str.split(':')[1].split(';')[0] : 'image/png';
  const imgData = cleanBase64(imageBase64);
  const imgMime = getMimeType(imageBase64);

  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      parts: [
        { text: `Re-generate this image with the requested aspect ratio (${aspectRatio}). ${userPrompt}` },
        { inlineData: { mimeType: imgMime, data: imgData } }
      ]
    }
  });

  return result.text || "Image extension failed.";
};
