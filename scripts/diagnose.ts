
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiKey = process.env.VITE_GEMINI_API_KEY;

console.log("--- FINAL DIAGNOSTIC ---");

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error("Missing keys.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    // 1. Supabase Check
    const { data: { session } } = await supabase.auth.signInWithPassword({
        email: "bydigzy@gmail.com",
        password: "Aa332211"
    });

    if (session) {
        console.log("✅ Supabase Auth: OK");
    } else {
        console.log("❌ Supabase Auth: FAILED");
    }

    // 2. Gemini Check (gemini-2.0-flash)
    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Ping");
        const response = result.response.text();
        console.log(`✅ Gemini AI (2.0-flash): OK (Response: ${response.trim()})`);
    } catch (e: any) {
        console.error(`❌ Gemini AI (2.0-flash): FAILED (${e.message})`);
    }
}

runTest();
