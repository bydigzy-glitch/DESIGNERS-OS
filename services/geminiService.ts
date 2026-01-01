
import { GoogleGenerativeAI, ChatSession, Part, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Module-level variable for API Key - loaded from environment variable
let activeApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
let chatSession: ChatSession | null = null;
let genAI: GoogleGenerativeAI | null = null;

export const setApiKey = (key: string) => {
  if (key && key.trim() !== "") {
    activeApiKey = key;
    genAI = null; // Force re-init
    chatSession = null;
  }
};

export const hasValidKey = (): boolean => {
  return !!activeApiKey && activeApiKey.trim() !== "";
};

const getGenAI = () => {
  // RUNTIME CHECK: If key is missing or is explicitly the placeholder, throw error
  if (!activeApiKey || activeApiKey === "YOUR_API_KEY_HERE" || activeApiKey.trim() === "") {
    console.error("Gemini API Key is missing or invalid.");
    throw new Error("MISSING_API_KEY");
  }

  if (!genAI) {
    try {
      genAI = new GoogleGenerativeAI(activeApiKey);
    } catch (e) {
      console.error("Failed to initialize GoogleGenerativeAI client", e);
      throw e;
    }
  }
  return genAI;
};

// Define Tool for Adding/Updating Tasks
const createTaskTool: FunctionDeclaration = {
  name: "createTask",
  description: "Create, update, or delete a task or calendar event. Use UPDATE with status='DONE' to mark tasks as completed.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      action: { type: SchemaType.STRING, enum: ["CREATE", "UPDATE", "DELETE"], format: 'enum' },
      id: { type: SchemaType.STRING, description: "Task ID. Required for UPDATE/DELETE. If unknown, use the task Title." },
      title: { type: SchemaType.STRING },
      date: { type: SchemaType.STRING, description: "ISO Date string (e.g. 2024-12-25T14:00:00) for the deadline or event start time." },
      category: { type: SchemaType.STRING, enum: ["PRODUCT", "CONTENT", "MONEY", "ADMIN", "MEETING"], format: 'enum' },
      priority: { type: SchemaType.STRING, enum: ["HIGH", "MEDIUM", "LOW"], format: 'enum' },
      status: { type: SchemaType.STRING, enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"], format: 'enum' }
    },
    required: ["action"],
  },
};

// Define Tool for Clients
const manageClientTool: FunctionDeclaration = {
  name: "manageClient",
  description: "Add, update, or delete a Client in the database.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      action: { type: SchemaType.STRING, enum: ["CREATE", "UPDATE", "DELETE"], format: 'enum' },
      id: { type: SchemaType.STRING, description: "Client ID. Required for UPDATE/DELETE." },
      name: { type: SchemaType.STRING },
      email: { type: SchemaType.STRING },
      notes: { type: SchemaType.STRING },
      status: { type: SchemaType.STRING, enum: ["ACTIVE", "INACTIVE"], format: 'enum' }
    },
    required: ["action"]
  }
};

// Define Tool for Projects
const manageProjectTool: FunctionDeclaration = {
  name: "manageProject",
  description: "Add, update, or delete a Project.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      action: { type: SchemaType.STRING, enum: ["CREATE", "UPDATE", "DELETE"], format: 'enum' },
      id: { type: SchemaType.STRING, description: "Project ID. Required for UPDATE/DELETE." },
      title: { type: SchemaType.STRING },
      clientName: { type: SchemaType.STRING },
      status: { type: SchemaType.STRING, enum: ["ACTIVE", "COMPLETED", "ARCHIVED"], format: 'enum' },
      price: { type: SchemaType.NUMBER },
      progress: { type: SchemaType.NUMBER }
    },
    required: ["action"]
  }
};

// Define Tool for Learning/Memory
const updateMemoryTool: FunctionDeclaration = {
  name: "updateMemory",
  description: "Save a new fact, preference, or context about the user to long-term memory.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      memory: {
        type: SchemaType.STRING,
        description: "The fact or preference to append to memory. Be concise.",
      },
    },
    required: ["memory"],
  },
};

export const initializeGemini = (userContext: string = ""): ChatSession => {
  const ai = getGenAI();

  const tailoredInstruction = `${SYSTEM_INSTRUCTION}
  
  \n\n[USER LONG-TERM MEMORY & CONTEXT]:
  The following is what you have learned about this user over time. Adapt your tone, advice, and responses based on this:
  ${userContext ? userContext : "No prior memory established yet."}

  \n\nIMPORTANT: Use Markdown formatting aggressively. Use ### Headers, **Bold**, and - Bullet points.`;

  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: tailoredInstruction,
    tools: [{ functionDeclarations: [createTaskTool, manageClientTool, manageProjectTool, updateMemoryTool] }]
  });

  chatSession = model.startChat({
    history: [],
    generationConfig: {
      temperature: 0.7
    }
  });

  return chatSession;
};

export const resetGeminiSession = () => {
  chatSession = null;
};

export interface GeminiResponse {
  text: string;
  functionCalls?: any[];
}

export const sendMessageToGemini = async (message: string, imageBase64?: string, context?: string, userMemory?: string, isIgnite?: boolean): Promise<GeminiResponse> => {
  if (!chatSession) {
    try {
      initializeGemini(userMemory || "");
    } catch (e) {
      if (e.message === "MISSING_API_KEY") {
        return { text: "⚠️ System Error: Gemini API Key is missing. Please check your .env file." };
      }
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

    let result;

    if (imageBase64) {
      const cleanBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
      const mimeType = imageBase64.includes(':') && imageBase64.includes(';')
        ? imageBase64.split(':')[1].split(';')[0]
        : 'image/png';

      const parts: Part[] = [
        { text: finalMessage },
        { inlineData: { mimeType, data: cleanBase64 } }
      ];

      result = await chatSession.sendMessage(parts);
    } else {
      result = await chatSession.sendMessage(finalMessage);
    }

    const response = result.response;
    const text = response.text();

    // Check for tool calls
    // In new SDK, functionCalls are in candidates[0].content.parts
    const functionCalls = response.functionCalls();

    return {
      text: text || (functionCalls && functionCalls.length > 0 ? "One moment, processing changes..." : "No response generated."),
      functionCalls: functionCalls
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    try {
      initializeGemini(userMemory || "");
      // Fallback retry
      if (chatSession) {
        const res = await chatSession.sendMessage(message);
        return { text: res.response.text() || "Error recovered." };
      }
    } catch (e) { }

    throw error;
  }
};

// Helper to send tool response back to Gemini (Multi-turn)
export const sendToolResponseToGemini = async (functionName: string, functionId: string, result: any): Promise<string> => {
  if (!chatSession) return "Session lost.";

  // In new SDK, we send a part with functionResponse
  const response = await chatSession.sendMessage([{
    functionResponse: {
      name: functionName,
      response: { result: result }
    }
  }]);

  return response.response.text();
};

export const analyzeVideoConcept = async (concept: string): Promise<string> => {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `ACT AS A VIRAL CONTENT ALGORITHM EXPERT. Analyze this video concept: "${concept}". Return formatted Markdown report.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const generateMockup = async (modelBase64: string, garmentBase64: string, userPrompt: string): Promise<string> => {
  const ai = getGenAI();
  const cleanBase64 = (str: string) => str.includes('base64,') ? str.split('base64,')[1] : str;
  const getMimeType = (str: string) => str.includes(':') && str.includes(';') ? str.split(':')[1].split(';')[0] : 'image/png';
  const modelData = cleanBase64(modelBase64);
  const garmentData = cleanBase64(garmentBase64);
  const modelMime = getMimeType(modelBase64);
  const garmentMime = getMimeType(garmentBase64);

  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent([
    { text: `Generate a high-quality, photorealistic fashion mockup. Instruction: Put the clothing item shown in the second image onto the model shown in the first image. ${userPrompt}` },
    { inlineData: { mimeType: modelMime, data: modelData } },
    { inlineData: { mimeType: garmentMime, data: garmentData } }
  ]);

  // Note: generateContent for images usually returns blob/image data but Gemini API mostly returns text unless Image Generation model is used. 
  // Standard Gemini 1.5 is text/multimodal-in -> text-out. 
  // If expecting image output, we assume it might return a link or we are using a specific model.
  // For now, returning text. If we need image generation, we need Imagen model which is different.
  // Assuming the user wants text description validation for now as I can't generate images directly via this API easily without Imagen.

  return result.response.text();
};

export const extendImage = async (imageBase64: string, aspectRatio: string, userPrompt: string): Promise<string> => {
  // Same limitation as above. Using Gemini to describe expansion.
  const ai = getGenAI();
  const cleanBase64 = (str: string) => str.includes('base64,') ? str.split('base64,')[1] : str;
  const getMimeType = (str: string) => str.includes(':') && str.includes(';') ? str.split(':')[1].split(';')[0] : 'image/png';
  const imgData = cleanBase64(imageBase64);
  const imgMime = getMimeType(imageBase64);

  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent([
    { text: `Re-generate this image with the requested aspect ratio. ${userPrompt}` },
    { inlineData: { mimeType: imgMime, data: imgData } }
  ]);

  return result.response.text();
};

export interface IntakeAnalysis {
  paymentReliability: number;
  scopeCreepRisk: number;
  stressCost: number;
  summary: string;
  recommendation: 'APPROVE' | 'REJECT' | 'NEEDS_CLARITY';
  redFlags: string[];
}

export const analyzeIntakeSubmission = async (data: any): Promise<IntakeAnalysis> => {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `ACT AS AN EXPERT DESIGN BUSINESS ADVISOR. Analyze this client intake submission and provide a risk score (0-100) and analysis.
  
  INTAKE DATA:
  Name: ${data.name}
  Email: ${data.email}
  Budget: ${data.budget}
  Timeline: ${data.timeline}
  Description: ${data.description}
  
  RETURN JSON ONLY in the following format:
  {
    "paymentReliability": number,
    "scopeCreepRisk": number,
    "stressCost": number,
    "summary": "string",
    "redFlags": ["string"],
    "recommendation": "APPROVE" | "REJECT" | "NEEDS_CLARITY"
  }
  
  Scoring Guidelines:
  - Low budget + rush timeline = high stressCost and scopeCreepRisk.
  - Vague descriptions = high scopeCreepRisk.
  - Large enterprise budget = high paymentReliability.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  // Clean potential markdown code blocks
  const jsonString = responseText.replace(/```json|```/gi, '').trim();

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse AI scoring:", jsonString);
    return {
      paymentReliability: 70,
      scopeCreepRisk: 50,
      stressCost: 40,
      summary: "AI analysis failed, using conservative estimates.",
      recommendation: 'NEEDS_CLARITY',
      redFlags: ["System could not parse AI response"]
    };
  }
};
