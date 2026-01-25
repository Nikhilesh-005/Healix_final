
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// Initialize Gemini (lazy load inside function to ensure env is ready)

interface EmbeddingItem {
    text: string;
    metadata: {
        tag: string;
        responses: string[];
        matched_pattern: string;
    };
    embedding: number[];
}

let cachedEmbeddings: EmbeddingItem[] | null = null;

function loadEmbeddings(): EmbeddingItem[] {
    if (cachedEmbeddings) return cachedEmbeddings;

    try {
        const filePath = path.join(process.cwd(), "rag", "embeddings.json");
        if (!fs.existsSync(filePath)) {
            console.error("❌ Embeddings file not found at:", filePath);
            return [];
        }
        const raw = fs.readFileSync(filePath, "utf-8");
        cachedEmbeddings = JSON.parse(raw);
        return cachedEmbeddings || [];
    } catch (error) {
        console.error("Failed to load embeddings:", error);
        return [];
    }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function getRelevantContext(query: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not set");
        return "";
    }

    try {
        // 1. Generate Query Embedding
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        const result = await model.embedContent(query);
        const queryEmbedding = result.embedding.values;

        // 2. Load Data
        const embeddings = loadEmbeddings();
        if (embeddings.length === 0) {
            console.warn("No embeddings loaded for RAG.");
            return "";
        }

        // 3. Search
        const scored = embeddings.map(item => ({
            item,
            score: cosineSimilarity(queryEmbedding, item.embedding)
        }));

        // Sort by descending score
        scored.sort((a, b) => b.score - a.score);

        // Top 3 results
        const topK = scored.slice(0, 3);

        // 4. Format Context
        const contextLines = topK.map(match => {
            const responses = match.item.metadata.responses.join(" | ");
            return `Context Tag: [${match.item.metadata.tag}]
Similar Previous User Input: "${match.item.metadata.matched_pattern}" (Similarity: ${match.score.toFixed(2)})
Verified Therapeutic Responses: "${responses}"`;
        });

        console.log(`RAG matched top item: ${topK[0]?.item.metadata.tag} with score ${topK[0]?.score}`);

        return contextLines.join("\n\n");

    } catch (error) {
        console.error("Failed to get RAG context:", error);
        return "";
    }
}
