// app/api/mood/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { mood } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, gte, lte } from "drizzle-orm";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

/* ----------------- Env names / defaults ----------------- */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/** Day range in Asia/Kolkata */
function getKolkataDayRange(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const day = `${map.year}-${map.month}-${map.day}`;
  const start = new Date(`${day}T00:00:00+05:30`);
  const end = new Date(`${day}T23:59:59.999+05:30`);
  return { start, end };
}

/** safeGetSession */
async function safeGetSession(headers: Headers) {
  const hdrObj: Record<string, string> = {};
  for (const [k, v] of Array.from(headers.entries())) hdrObj[k] = v;

  const cookie = headers.get("cookie") ?? "";
  try {
    if (cookie) {
      const s = await auth.api.getSession?.({ cookie } as any);
      if (s) return { ok: true, session: s };
    }
  } catch (e: any) {
    console.error("safeGetSession cookie attempt failed:", e?.message ?? e);
  }

  try {
    const s = await auth.api.getSession?.({ headers: hdrObj } as any);
    if (s) return { ok: true, session: s };
  } catch (e: any) {
    console.error("safeGetSession headers attempt failed:", e?.message ?? e);
    return { ok: false, error: e?.message ?? String(e) };
  }

  return { ok: false, error: "No session found" };
}

/** map mood score -> credits */
function scoreToCredits(score: number): number {
  switch (score) {
    case 1: return 0;
    case 2: return 1;
    case 3: return 3;
    case 4: return 3;
    case 5: return 5;
    default: return 0;
  }
}

/**
 * Call Gemini to get both quote and sentiment in one go.
 */
// Define models to try in order
const MOOD_MODELS = ["gemini-2.5-flash", "gemini-3.0-pro"];

/**
 * Call Gemini to get both quote and sentiment in one go.
 * Tries multiple models in sequence for fallback.
 */
async function analyzeMoodWithGemini(moodText: string) {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not set");
    throw new Error("Server configuration error: Missing Gemini API Key");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  let lastError: any = null;

  for (const modelName of MOOD_MODELS) {
    try {
      console.log(`[MoodTracker] Attempting with model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              quote: {
                type: SchemaType.STRING,
                description: "A famous quote matching the mood."
              },
              author: {
                type: SchemaType.STRING,
                description: "The author of the quote."
              },
              sentimentScore: {
                type: SchemaType.NUMBER,
                description: "Sentiment score from 1 (very negative) to 5 (very positive)."
              },
              sentimentConfidence: {
                type: SchemaType.NUMBER,
                description: "Confidence of the sentiment analysis from 0.0 to 1.0.",
              }
            },
            required: ["quote", "author", "sentimentScore", "sentimentConfidence"]
          }
        }
      });

      const prompt = `
        User mood: "${moodText}".
    
        1. Analyze the sentiment of this mood text and assign a score:
           1 = Very Negative (Despair, deep sadness, anger)
           2 = Negative (Sad, anxious, frustrated)
           3 = Neutral (Okay, board, indifferent)
           4 = Positive (Happy, hopeful, content)
           5 = Very Positive (Ecstatic, grateful, excited)
        
        2. Find a FAMOUS quote that best matches this mood to help the user.
           - If the mood is negative, provide something motivating, comforting, or hopeful.
           - If the mood is positive, provide something uplifting or celebrating.
           - The quote should be by a well-known Indian personality (historical or contemporary).
           - Do NOT invent quotes.
        
        Return JSON with 'quote', 'author', 'sentimentScore' (1-5), and 'sentimentConfidence' (0-1).
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // If we got here, it worked
      return { text, model: modelName };

    } catch (err: any) {
      console.warn(`[MoodTracker] Failed with model ${modelName}:`, err.message);
      lastError = err;
      // Continue to next model
    }
  }

  // If loop finishes without returning, throw the last error
  console.error("[MoodTracker] All models failed.");
  throw lastError || new Error("All Gemini models failed to generate response.");
}

export async function GET(request: Request) {
  const dev = process.env.NODE_ENV !== "production";
  const { ok, session, error } = await safeGetSession(request.headers);
  return NextResponse.json({
    dev,
    geminiKeySet: Boolean(GEMINI_API_KEY),
    session: dev ? { ok, session: session ?? undefined, error: error ?? undefined } : undefined,
  });
}

export async function POST(request: Request) {
  const { ok, session } = await safeGetSession(request.headers);
  if (!ok || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  if (!body?.moodText) return NextResponse.json({ error: "moodText is required" }, { status: 400 });

  const moodText = body.moodText.trim();
  const { start, end } = getKolkataDayRange();

  // Check limit: 1 post per day
  const existing = await db.select().from(mood)
    .where(and(eq(mood.userId, userId), gte(mood.createdAt, start), lte(mood.createdAt, end)));

  if (existing.length) {
    return NextResponse.json({ error: "Mood already entered today" }, { status: 409 });
  }

  let supportiveText = "Thanks for sharing. Be kind to yourself.";
  let moodScore = 3;
  let scoreConfidence = 0.5;
  let rawGemini: any = null;

  try {
    const { text: jsonStr, model: usedModel } = await analyzeMoodWithGemini(moodText);
    rawGemini = { json: jsonStr, model: usedModel }; // for debug
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      if (parsed.quote && parsed.author) {
        supportiveText = `"${parsed.quote}" — ${parsed.author}`;
      }
      if (typeof parsed.sentimentScore === 'number') {
        moodScore = Math.max(1, Math.min(5, Math.round(parsed.sentimentScore)));
      }
      if (typeof parsed.sentimentConfidence === 'number') {
        scoreConfidence = parsed.sentimentConfidence;
      }
    }
  } catch (e: any) {
    console.error("Gemini processing failed:", e);
    // Fallback happens automatically with default values
  }

  const credits = scoreToCredits(moodScore);

  try {
    await db.insert(mood).values({
      id: randomUUID(),
      userId,
      moodText,
      supportiveText,
      moodScore,
      scoreConfidence: scoreConfidence.toFixed(2),
      credits,
      createdAt: new Date(),
    } as any);
  } catch (dbErr) {
    console.error("DB insert failed:", dbErr);
    return NextResponse.json({ error: "Failed to save mood", details: String(dbErr) }, { status: 500 });
  }

  return NextResponse.json({
    message: "Mood saved successfully!",
    supportiveText,
    moodScore,
    credits,
    modelDebug: rawGemini,
  });
}
