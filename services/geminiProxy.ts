// Client-side proxy service that calls our secure backend API
// This allows all users to use AI features without needing their own API key

export interface GeminiResponse {
    text: string;
    functionCalls?: any[];
}

// Determine API endpoint based on environment
const getApiEndpoint = () => {
    // In production (Vercel), use the API route
    if (import.meta.env.PROD) {
        return '/api/gemini';
    }
    // In development, check if we have a direct API key
    const directKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (directKey) {
        // Use direct API (for development)
        return null; // Will use geminiService.ts directly
    }
    // Use local API proxy
    return '/api/gemini';
};

export const sendMessageToGeminiProxy = async (
    message: string,
    imageBase64?: string,
    context?: string,
    userMemory?: string,
    isIgnite?: boolean
): Promise<GeminiResponse> => {
    const endpoint = getApiEndpoint();

    // If no endpoint, fall back to direct API (development only)
    if (!endpoint) {
        const { sendMessageToGemini } = await import('./geminiService');
        return sendMessageToGemini(message, imageBase64, context, userMemory, isIgnite);
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                imageBase64,
                context,
                userMemory,
                isIgnite
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get AI response');
        }

        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error('Gemini Proxy Error:', error);
        throw new Error(error.message || 'Failed to communicate with AI service');
    }
};

export const analyzeVideoConceptProxy = async (concept: string): Promise<string> => {
    const endpoint = getApiEndpoint();

    if (!endpoint) {
        const { analyzeVideoConcept } = await import('./geminiService');
        return analyzeVideoConcept(concept);
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `ACT AS A VIRAL CONTENT ALGORITHM EXPERT. Analyze this video concept: "${concept}". Return formatted Markdown report.`,
                context: 'Video concept analysis'
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to analyze video concept');
        }

        const data = await response.json();
        return data.text;
    } catch (error: any) {
        console.error('Video Analysis Error:', error);
        throw error;
    }
};

// Re-export other functions from geminiService for compatibility
export { initializeGemini, resetGeminiSession, sendToolResponseToGemini, setApiKey, hasValidKey } from './geminiService';
