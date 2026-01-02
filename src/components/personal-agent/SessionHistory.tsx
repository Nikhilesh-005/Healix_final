"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Smile } from "lucide-react";

interface Session {
    id: string;
    startedAt: string;
    moodDescription: string;
    endedAt: string | null;
}

interface SessionHistoryProps {
    sessions: Session[];
    onSelectSession: (id: string) => void;
    onClose: () => void;
}

export default function SessionHistory({ sessions, onSelectSession, onClose }: SessionHistoryProps) {
    return (
        <div className="w-full h-full bg-[#18181C] text-white flex flex-col p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Session History</h2>
                <button
                    onClick={onClose}
                    className="text-zinc-500 hover:text-zinc-300 transition"
                >
                    Close
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {sessions.length === 0 ? (
                    <div className="text-center text-zinc-500 mt-20">
                        <p>No past sessions found.</p>
                    </div>
                ) : (
                    sessions.map((session, idx) => (
                        <motion.button
                            key={session.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => onSelectSession(session.id)}
                            className="w-full text-left bg-[#27272A] p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-[#2f2f33] transition group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <Calendar size={14} />
                                    {new Date(session.startedAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-500 font-mono">
                                    <Clock size={14} />
                                    {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    <Smile size={18} className="text-blue-400 group-hover:text-blue-300 transition" />
                                </div>
                                <div>
                                    <p className="text-zinc-200 font-medium line-clamp-1">
                                        {session.moodDescription || "Check-in Session"}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Click to view analysis report
                                    </p>
                                </div>
                            </div>
                        </motion.button>
                    ))
                )}
            </div>
        </div>
    );
}
