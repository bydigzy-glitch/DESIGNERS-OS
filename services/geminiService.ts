
import { GoogleGenAI, Chat, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable is missing.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

// Define Tool for Adding/Updating Tasks
const createTaskTool: FunctionDeclaration = {
  name: "createTask",
  description: "Create, update, or delete a task or calendar event. Use this to schedule items or change due dates.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ["CREATE", "UPDATE", "DELETE"] },
      id: { type: Type.STRING, description: "Task ID. Required for UPDATE/DELETE. If unknown, use the task Title." },
      title: { type: Type.STRING },
      date: { type: Type.STRING, description: "ISO Date string (e.g. 2024-12-25T14:00:00) for the deadline or event start time." },
      category: { type: Type.STRING, enum: ["PRODUCT", "CONTENT", "MONEY", "ADMIN", "MEETING"] },
      priority: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
      status: { type: Type.STRING, enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] }
    },
    required: ["action"],
  },
};

// Define Tool for Clients
const manageClientTool: FunctionDeclaration = {
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
const manageProjectTool: FunctionDeclaration = {
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
const updateMemoryTool: FunctionDeclaration = {
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
    model: 'gemini-2.5-flash',
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

export const sendMessageToGemini = async (message: string, imageBase64?: string, context?: string, userMemory?: string): Promise<GeminiResponse> => {
  if (!chatSession) {
    initializeGemini(userMemory || "");
  }

  if (!chatSession) {
    throw new Error("Failed to initialize Gemini session.");
  }

  try {
    let response: GenerateContentResponse;
    
    // Supplement prompt with context if available
    let finalMessage = message;
    if (context) {
        finalMessage = `[CURRENT APP STATE CONTEXT]:\n${context}\n\n[USER REQUEST]:\n${message}`;
    }

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
    const functionCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall);

    return {
        text: response.text || (functionCalls && functionCalls.length > 0 ? "One moment, processing changes..." : "No response generated."),
        functionCalls: functionCalls
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    try {
        initializeGemini(userMemory || "");
        // Fallback retry
        if (chatSession) {
             const res = await chatSession.sendMessage({ message: message }); // Retry without context/image to save partial fail
             return { text: res.text || "Error recovered." };
        }
    } catch(e) {}
    
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

// ... (Existing Image helper functions remain unchanged below)
export const analyzeVideoConcept = async (concept: string): Promise<string> => {
  const ai = getGenAI();
  const model = ai.models;
  const prompt = `ACT AS A VIRAL CONTENT ALGORITHM EXPERT. Analyze this video concept: "${concept}". Return formatted Markdown report.`;
  const result = await model.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Generate a high-quality, photorealistic fashion mockup. Instruction: Put the clothing item shown in the second image onto the model shown in the first image. ${userPrompt}` }, { inlineData: { mimeType: modelMime, data: modelData } }, { inlineData: { mimeType: garmentMime, data: garmentData } }] }
    });
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
};

export const extendImage = async (imageBase64: string, aspectRatio: string, userPrompt: string): Promise<string> => {
    const ai = getGenAI();
    const cleanBase64 = (str: string) => str.includes('base64,') ? str.split('base64,')[1] : str;
    const getMimeType = (str: string) => str.includes(':') && str.includes(';') ? str.split(':')[1].split(';')[0] : 'image/png';
    const imgData = cleanBase64(imageBase64);
    const imgMime = getMimeType(imageBase64);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Re-generate this image with the requested aspect ratio. ${userPrompt}` }, { inlineData: { mimeType: imgMime, data: imgData } }] },
      config: { imageConfig: { aspectRatio: aspectRatio as any } }
    });
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated.");
};
