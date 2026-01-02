
import { NextResponse } from "next/server";
import { db } from "@/db";
import { personal_sessions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const history = await db
            .select({
                id: personal_sessions.id,
                startedAt: personal_sessions.startedAt,
                endedAt: personal_sessions.endedAt,
                moodDescription: personal_sessions.moodDescription,
                report: personal_sessions.report, // Fetching report too so we can display it immediately
            })
            .from(personal_sessions)
            .where(eq(personal_sessions.userId, session.user.id))
            .orderBy(desc(personal_sessions.startedAt));

        return NextResponse.json({ history });
    } catch (error) {
        console.error("Error fetching history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
