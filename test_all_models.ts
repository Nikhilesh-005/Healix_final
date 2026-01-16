
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const models = [
    "gemini-1.5-flash-latest",
    "gemini-pro"
];

async function main() {
    const apiKey = process.env.GEMINI_API_KEY!;
    console.log("Checking key length:", apiKey?.length);
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const m of models) {
        console.log(`\nTesting: ${m}`);
        const model = genAI.getGenerativeModel({ model: m });
        try {
            const res = await model.generateContent("hi");
            console.log(`SUCCESS: ${m}`);
            // console.log("Response:", res.response.text().substring(0, 50));
        } catch (e: any) {
            // console.log(`FAILED: ${m} - ${e.message.split('\n')[0]}`);
        }
    }
}

main();
