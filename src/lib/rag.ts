
import { exec } from "child_process";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

interface RagMatch {
    distance: number;
    text: string;
    metadata: {
        tag: string;
        responses: string[];
        matched_pattern: string;
    }
}

interface RagResponse {
    matches: RagMatch[];
    error?: string;
}

export async function getRelevantContext(query: string): Promise<string> {
    try {
        // Resolve path to script
        // Assuming running from project root
        const scriptPath = path.join(process.cwd(), "scripts", "query_index.py");

        // Escape query to prevent shell injection issues (basic)
        const safeQuery = query.replace(/"/g, '\\"');

        // Execute python script
        // Using 'python' - ensure it's in PATH or use process.env.PYTHON_PATH
        const command = `python "${scriptPath}" "${safeQuery}"`;

        console.log(`Executing RAG query: ${command}`);
        const { stdout, stderr } = await execPromise(command);

        if (stderr && stderr.length > 0) {
            // Python warnings often go to stderr, so we don't always fail, but log it
            // console.warn("RAG Script stderr:", stderr); 
        }

        const data: RagResponse = JSON.parse(stdout.trim());

        if (data.error) {
            console.error("RAG Error:", data.error);
            return "";
        }

        if (!data.matches || data.matches.length === 0) {
            return "";
        }

        // Format context for the LLM
        // We want to give the model the "intent"(tag) and suggested "responses" + original user "pattern"
        // This helps it style its answer like the dataset or use the specific advice.

        const contextLines = data.matches.map(match => {
            const responses = match.metadata.responses.join(" | ");
            return `Context Tag: [${match.metadata.tag}]
Similar Previous User Input: "${match.metadata.matched_pattern}"
Verified Therapeutic Responses: "${responses}"`;
        });

        return contextLines.join("\n\n");

    } catch (error) {
        console.error("Failed to get RAG context:", error);
        return "";
    }
}
