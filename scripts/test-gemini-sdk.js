// scripts/test-mood.js
// Usage: node scripts/test-mood.js "I am feeling very happy today"

const moodText = process.argv[2] || "I am feeling a bit anxious but hopeful";

async function testMoodApi() {
    console.log(`Testing mood API with text: "${moodText}"`);

    // We can't easily call the API route directly from node script without mocking Next.js request/response
    // OR we can just run the logic similar to how the route does it, BUT we want to test the actual route code if possible.
    // Since we are in dev, we can try to fetch against the running dev server if it's up.
    // Metadata says "npm run dev" is running.

    try {
        const res = await fetch("http://localhost:3000/api/mood", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // We need a session cookie or auth header to pass the "safeGetSession" check.
                // This is tricky without a real user session.
                // HOWEVER, the user rules say I can't access files outside workspace, but I can use tools.
                // For now, let's try to just invoke the Gemini logic directly in a separate small script 
                // to verify the KEY and SDK logic works, independent of the Next.js auth layer.
            },
            body: JSON.stringify({ moodText })
        });

        if (res.status === 401) {
            console.log("⚠️  Endpoint returned 401 Unauthorized (Expected if no session).");
            console.log("   To verify the logic effectively, we will run a direct SDK test script instead.");
            return;
        }

        const data = await res.json();
        console.log("Response:", data);
    } catch (e) {
        console.error("Fetch failed (server might not be reachable at localhost:3000):", e.message);
    }
}

// Plan B: Direct SDK Test
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import 'dotenv/config';

async function testDirectGemini() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY not found in .env");
        process.exit(1);
    }

    console.log("\n--- Testing Direct Gemini SDK Call ---");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    quote: { type: SchemaType.STRING },
                    author: { type: SchemaType.STRING },
                    sentimentScore: { type: SchemaType.NUMBER },
                    sentimentConfidence: { type: SchemaType.NUMBER }
                },
                required: ["quote", "author", "sentimentScore", "sentimentConfidence"]
            }
        }
    });

    const prompt = `User mood: "${moodText}". 
    Return JSON with 'quote', 'author', 'sentimentScore' (1-5), and 'sentimentConfidence' (0-1).`;

    try {
        const result = await model.generateContent(prompt);
        console.log("✅ SDK Call Success!");
        console.log("Raw Text Response:", result.response.text());
    } catch (err) {
        console.error("❌ SDK Call Failed:", err);
    }
}

testDirectGemini();
