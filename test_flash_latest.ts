
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

async function main() {
    const apiKey = process.env.GEMINI_API_KEY!;
    console.log("Key Len:", apiKey?.length);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    try {
        const res = await model.generateContent("hi");
        console.log("SUCCESS: gemini-1.5-flash-latest");
        console.log(res.response.text());
    } catch (e: any) {
        console.log("FAILED: gemini-1.5-flash-latest", e.message.split('\n')[0]);
    }
}
main();
