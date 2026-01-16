
import { NextResponse } from "next/server";
import { db } from "@/db";
import { personal_sessions, personal_messages } from "@/db/schema"; // Ensure schema export
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { getModel, REPORT_PROMPT } from "@/lib/geminiAgent";

export async function POST(req: Request) {
    // START SESSION
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { moodDescription } = body;

        const [newSession] = await db
            .insert(personal_sessions)
            .values({
                userId: session.user.id,
                moodDescription: moodDescription || "",
                status: "active",
            })
            .returning();

        return NextResponse.json({ session: newSession });
    } catch (error) {
        console.error("Error starting session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    // END SESSION & GENERATE REPORT
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { sessionId } = body;

        if (!sessionId) {
            console.error("Session ID missing in PATCH");
            return NextResponse.json({ error: "Session ID required" }, { status: 400 });
        }

        console.log("Ending session:", sessionId);

        // 1. Fetch chat history
        const messages = await db
            .select()
            .from(personal_messages)
            .where(eq(personal_messages.sessionId, sessionId))
            .orderBy(desc(personal_messages.createdAt)); // Get in reverse chronological first, then reverse back

        // 2. Fetch session details (mood description)
        const [sess] = await db
            .select()
            .from(personal_sessions)
            .where(eq(personal_sessions.id, sessionId));

        if (!sess) return NextResponse.json({ error: "Session not found" }, { status: 404 });

        const orderedMessages = messages.reverse();

        // 3. Construct context for Gemini
        const historyText = orderedMessages.map(m => `[${m.createdAt.toISOString()}] ${m.role.toUpperCase()}: ${m.content}`).join("\n");

        const detailedPrompt = `
You are an advanced conversational sentiment analysis and reporting assistant.

You are given a complete user chat session from START to END, including timestamps.
The session has now ended.

Your task is to deeply analyze the entire conversation and generate a professional,
user-facing emotional and sentiment analysis report.

The report must be clear, empathetic, structured, and suitable for display
inside a web dashboard application.

Analyze the following completed user conversation session.

GOALS:
1. Analyze the user's emotional and sentiment state across the entire session.
2. Detect how the user's feelings changed from the start to the end.
3. Identify key emotional turning points in the conversation.
4. Generate a final emotional assessment of the user.
5. Provide personalized tips and suggestions based on the emotional analysis.
6. Generate structured data for a sentiment chart.
7. Prepare the report so it can be saved and shown later in a History sidebar.

CONVERSATION DATA:
${historyText}

----------------------------------------

OUTPUT REQUIREMENTS:

The report MUST follow this exact structure and order, and be returned as valid JSON:

{
  "sessionSummary": {
    "summary": "Concise summary (4–6 lines)",
    "overallTone": "Overall emotional tone",
    "endingEmotionalState": "How the user ended the session emotionally"
  },
  "userSentimentOverview": {
    "start": "Emotional state at START",
    "middle": "Emotional state at MIDDLE",
    "end": "Emotional state at END",
    "trend": "Improving / Declining / Fluctuating / Stable"
  },
  "sentimentTimeline": [
    { "phase": "Start", "sentiment": "negative", "score": -0.6 },
    { "phase": "Middle", "sentiment": "neutral", "score": 0.0 },
    { "phase": "End", "sentiment": "positive", "score": 0.7 }
  ],
  "keyEmotionalMoments": [
    { "message": "Quote or summary of message", "change": "What emotion changed and why" }
  ],
  "detailedAnalysis": "Detailed emotional trends, stress/relief/confidence patterns.",
  "personalizedTips": [
    "Tip 1",
    "Tip 2"
  ],
  "finalAssessment": "Clear concluding paragraph.",
  "metadata": {
    "overallSentiment": "positive",
    "sessionImpact": "helpful",
    "dominantEmotions": ["emotion1", "emotion2"],
    "recommendedFollowUp": true
  }
}

IMPORTANT: Return ONLY the JSON object. Do not include markdown formatting or backticks.
`;

        // 4. Generate Report
        let reportData: any = {};
        try {
            const model = getModel();
            const result = await model.generateContent(detailedPrompt);
            const responseText = result.response.text();

            console.log("Gemini Raw Response:", responseText); // Debugging

            const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            reportData = JSON.parse(jsonStr);
        } catch (genError) {
            console.error("Gemini report generation failed:", genError);
            // Fallback content to ensure session completes
            reportData = {
                sessionSummary: {
                    summary: "Session completed, but report generation failed.",
                    overallTone: "Neutral",
                    endingEmotionalState: "Neutral"
                },
                userSentimentOverview: { start: "Unknown", middle: "Unknown", end: "Unknown", trend: "Stable" },
                sentimentTimeline: [],
                keyEmotionalMoments: [],
                detailedAnalysis: "Analysis unavailable due to an error.",
                personalizedTips: ["Please try again later."],
                finalAssessment: "Session recorded.",
                metadata: { overallSentiment: "neutral", sessionImpact: "neutral", dominantEmotions: [], recommendedFollowUp: false }
            };
        }

        // 5. Update Session
        const [updatedSession] = await db
            .update(personal_sessions)
            .set({
                endedAt: new Date(),
                status: "completed",
                report: reportData,
            })
            .where(eq(personal_sessions.id, sessionId))
            .returning();

        return NextResponse.json({ session: updatedSession, report: reportData });

    } catch (error) {
        console.error("Error ending session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
