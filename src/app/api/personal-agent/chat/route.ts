
import { NextResponse } from "next/server";
import { db } from "@/db";
import { personal_sessions, personal_messages } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { model, SYSTEM_PROMPT } from "@/lib/geminiAgent";
import { Content } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { sessionId, message, duration } = body; // duration used for context if needed

        if (!sessionId || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // 1. Save User Message
        const [savedMsg] = await db.insert(personal_messages).values({
            sessionId,
            role: "user",
            content: message,
        }).returning();
        console.log("User message saved:", savedMsg.id);

        // 2. Fetch Context (Previous messages) - limit to last 20 for context window efficiency
        const history = await db
            .select()
            .from(personal_messages)
            .where(eq(personal_messages.sessionId, sessionId))
            .orderBy(desc(personal_messages.createdAt))
            .limit(10);

        // 3. fetch session for user mood
        const [currentSession] = await db.select().from(personal_sessions).where(eq(personal_sessions.id, sessionId));

        // Filter out the current message we just saved to avoid duplicating it in history
        const previousMessages = history.filter(m => m.id !== savedMsg.id).reverse();

        // Sanitize history to ensure alternating roles
        const sanitizedHistory: Content[] = [];
        let lastRole = "";

        for (const msg of previousMessages) {
            const role = msg.role === 'user' ? 'user' : 'model';

            if (role === lastRole) {
                // Merge content with previous message of same role
                if (sanitizedHistory.length > 0) {
                    sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += `\n\n(Follow-up): ${msg.content}`;
                }
            } else {
                sanitizedHistory.push({
                    role: role,
                    parts: [{ text: msg.content }]
                });
                lastRole = role;
            }
        }

        // Ensure history ends with a model turn if it's not empty, 
        // because we are about to call sendMessage (which provides the next User turn).
        if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
            sanitizedHistory.push({
                role: 'model',
                parts: [{ text: "..." }]
            });
        }

        const chatHistory = sanitizedHistory;

        // Add system context frame
        const contextPrompt = `
      ${SYSTEM_PROMPT}

      New personal support session started.
      User details:
      - Current mood description: "${currentSession?.moodDescription || 'Not specified'}"
      - Session duration elapsed: ${duration || 0} minutes
      
      Respond to the user's latest message: "${message}"
      
      RETURN JSON ONLY:
      {
        "response": "Your compassionate response here...",
        "sentimentScore": 0.5, // 0-1 based on user's message
        "emotion": "sad" // one of: sad, anxious, stressed, neutral, hopeful, happy
      }
    `;

        // We use a fresh generation each time with history as context, or use chatSession.
        // For simplicity and strict control, we'll prompt with history + instruction
        const chat = model.startChat({
            history: chatHistory
        });

        const result = await chat.sendMessage(contextPrompt);
        const responseText = result.response.text();

        // Parse JSON response
        let aiParams = { response: "", sentimentScore: 0.5, emotion: "neutral" };
        try {
            const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            aiParams = JSON.parse(cleanJson);
        } catch (e) {
            console.error("JSON parse failed, using raw text", e);
            aiParams.response = responseText;
        }

        // 4. Save AI Response
        await db.insert(personal_messages).values({
            sessionId,
            role: "assistant",
            content: aiParams.response,
            sentimentScore: String(aiParams.sentimentScore),
        });

        return NextResponse.json({
            response: aiParams.response,
            sentimentScore: aiParams.sentimentScore,
            emotion: aiParams.emotion
        });

    } catch (error) {
        console.error("Error in chat handler:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
