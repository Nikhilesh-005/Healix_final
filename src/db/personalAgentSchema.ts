
import {
    pgTable,
    text,
    timestamp,
    boolean,
    integer,
    numeric,
    json,
    uuid
} from "drizzle-orm/pg-core";
import { user } from "./schema";
import { sql } from "drizzle-orm";

export const personal_sessions = pgTable("personal_sessions", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    moodDescription: text("mood_description"), // User's initial input
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    report: json("report"), // Stores the structured JSON report
    status: text("status").notNull().default("active"), // active, completed
});

export const personal_messages = pgTable("personal_messages", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id").notNull().references(() => personal_sessions.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'user' or 'assistant'
    content: text("content").notNull(),
    sentimentScore: numeric("sentiment_score", { precision: 3, scale: 2 }), // 0.00-1.00
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
