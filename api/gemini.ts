import { GoogleGenerativeAI } from '@google/generative-ai';

// This API route will be deployed to Vercel and keep your API key secure
export default async function handler(req: any, res: any) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, imageBase64, context, userMemory, isIgnite, functionCalls } = req.body;

        // Get API key from environment variable (server-side only)
        const apiKey = process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
            console.error('VITE_GEMINI_API_KEY environment variable is not set');
            return res.status(500).json({
                error: 'API key not configured',
                details: 'VITE_GEMINI_API_KEY environment variable is missing. Please configure it in Vercel dashboard under Settings → Environment Variables.',
                diagnostic: 'MISSING_API_KEY'
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // If this is a function response callback
        if (functionCalls) {
            // Handle function response
            return res.status(200).json({ text: 'Function processed' });
        }

        // Create model with system instruction
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: context || '',
        });

        // Prepare message parts
        let parts: any[] = [{ text: message }];

        if (imageBase64) {
            const cleanBase64 = imageBase64.includes('base64,')
                ? imageBase64.split('base64,')[1]
                : imageBase64;
            const mimeType = imageBase64.includes(':') && imageBase64.includes(';')
                ? imageBase64.split(':')[1].split(';')[0]
                : 'image/png';

            parts.push({
                inlineData: {
                    mimeType,
                    data: cleanBase64
                }
            });
        }

        // Generate content
        const result = await model.generateContent(parts);
        const response = result.response;
        const text = response.text();

        return res.status(200).json({
            text: text || 'No response generated.',
            functionCalls: response.functionCalls?.() || []
        });

    } catch (error: any) {
        console.error('Gemini API Error:', error);

        // Determine if it's an API key issue
        const isApiKeyError = error.message?.includes('API_KEY') || error.message?.includes('API key');

        return res.status(500).json({
            error: 'Failed to generate response',
            details: error.message || 'Unknown error occurred',
            diagnostic: isApiKeyError ? 'INVALID_API_KEY' : 'GENERATION_ERROR',
            suggestion: isApiKeyError
                ? 'Verify that your Gemini API key is valid and has the correct permissions.'
                : 'The AI model encountered an error. Please try again or contact support.'
        });
    }
}
