
import { getRelevantContext } from "../src/lib/rag";

async function testRag() {
    console.log("Testing RAG Integration...");
    console.log("Query: 'I feel sad'");

    try {
        const context = await getRelevantContext("I feel sad");
        console.log("\n--- Retrieved Context ---");
        console.log(context);
        console.log("\n-------------------------");

        if (context.includes("sad")) {
            console.log("✅ SUCCESS: Context retrieved successfully.");
        } else {
            console.log("❌ FAILURE: No context returned or unexpected content.");
        }
    } catch (error) {
        console.error("❌ ERROR:", error);
    }
}

testRag();
