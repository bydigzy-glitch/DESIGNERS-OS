
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const geminiKey = process.env.VITE_GEMINI_API_KEY;

async function listModels() {
    if (!geminiKey) { console.error("Missing Key"); return; }
    // Note: The SDK doesn't have a direct listModels on the valid instance usually, 
    // but we can try to find a valid model by trial.
    // Actually, GoogleGenerativeAI class doesn't expose listModels in the web SDK easily without the manager.
    // We will just try a few known ones.

    const candidates = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    const genAI = new GoogleGenerativeAI(geminiKey);

    console.log("--- Testing Model Availability ---");
    for (const modelName of candidates) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            console.log("✅ OK");
        } catch (e: any) {
            if (e.message.includes("404")) {
                console.log("❌ Not Found");
            } else {
                console.log(`❌ Error: ${e.message.split('[')[0]}`); // Shorten error
            }
        }
    }
}

listModels();
