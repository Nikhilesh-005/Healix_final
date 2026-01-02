
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyBOsI3P9rYr7bD2XhdXWUjsIxWD8PiGXD8";

async function testHardcoded() {
    console.log("Testing with HARDCODED key:", GEMINI_API_KEY);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    try {
        const result = await model.generateContent("Hello, are you working?");
        console.log("✅ Success! Response:", result.response.text());
    } catch (err) {
        console.error("❌ Failed:", err.message);
    }
}

testHardcoded();
