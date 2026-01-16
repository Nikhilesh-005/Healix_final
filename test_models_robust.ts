
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';
import fs from 'fs';

const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-2.0-flash-exp",
    "gemini-3-pro-preview"
];

async function main() {
    const apiKey = process.env.GEMINI_API_KEY!;
    const genAI = new GoogleGenerativeAI(apiKey);
    let output = `Testing API Key (len=${apiKey?.length})\n`;

    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const res = await model.generateContent("hi");
            output += `SUCCESS: ${m}\n`;
            output += `Response: ${res.response.text()}\n\n`;
        } catch (e: any) {
            output += `FAILED: ${m} - ${e.message.split('\n')[0]}\n`;
        }
    }

    fs.writeFileSync('model_results.txt', output);
    console.log("Done. Wrote results to model_results.txt");
}

main();
