
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface AgentSetupProps {
    onStart: (mood: string) => void;
    loading: boolean;
}

export default function AgentSetup({ onStart, loading }: AgentSetupProps) {
    const [mood, setMood] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mood.trim()) onStart(mood);
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
            >
                <h1 className="text-3xl font-bold text-gray-100 mb-2">Personal AI Agent</h1>
                <p className="text-gray-400 mb-8">
                    Share how you're feeling right now. Our AI will listen, support, and help you find clarity.
                    (10-15 minute session)
                </p>

                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    <div className="relative">
                        <textarea
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            placeholder="I'm feeling..."
                            className="w-full h-32 bg-[#18181b] text-zinc-200 rounded-xl p-5 border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 outline-none resize-none transition-all placeholder:text-zinc-600 font-light"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!mood.trim() || loading}
                        className="w-full py-4 bg-zinc-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-medium text-lg transition-colors shadow-lg"
                    >
                        {loading ? "Starting..." : "Start Session"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
