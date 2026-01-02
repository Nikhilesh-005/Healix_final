"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface AgentLandingProps {
    onStart: () => void;
}

export default function AgentLanding({ onStart }: AgentLandingProps) {
    return (
        <div className="flex flex-col h-full w-full bg-[#09090b] text-zinc-300 overflow-hidden relative">

            {/* Header - Left Title, Right Button */}
            <div className="absolute top-0 left-0 w-full px-8 py-8 flex justify-between items-start z-10 bg-transparent pointer-events-none">
                {/* Left Title */}
                <div className="text-left pointer-events-auto">
                    <h1 className="text-3xl font-semibold text-white tracking-tight">Personal AI Agent</h1>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium mt-2">Wellness Companion</p>
                </div>

                {/* Right Button */}
                <div className="pointer-events-auto">
                    <button
                        onClick={onStart}
                        className="group flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm rounded-full transition-all shadow-lg active:scale-95 border border-zinc-700/50"
                    >
                        <Plus size={16} />
                        Create Agent
                    </button>
                </div>
            </div>

            {/* Central Condensed Content - Left Aligned */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-4xl w-full space-y-10 mt-24 text-left"
                >
                    {/* Intro Text */}
                    <div className="space-y-6 max-w-2xl">
                        <p className="text-xl md:text-2xl text-zinc-300 leading-relaxed font-light">
                            The Personal AI Agent is a sophisticated digital conduit for self-reflection.
                            It offers a structured, private environment where thoughts can be articulated without judgment.
                            Using advanced processing, the agent provides an empathetic presence focused on clarity and stability.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-zinc-900/50 text-left">
                        <div className="space-y-4">
                            <p className="text-base text-zinc-400 font-light leading-relaxed">
                                <strong className="text-zinc-200 font-medium block mb-2">How It Works</strong>
                                The process begins with a brief description of your emotional state to contextually calibrate the agent.
                                Once active, a focused conversation ensues—fluid yet guided—to foster understanding.
                            </p>
                            <p className="text-base text-zinc-400 font-light leading-relaxed">
                                <strong className="text-zinc-200 font-medium block mb-2">Time-Bounded & Secure</strong>
                                Sessions are finite (10–15 mins) to prevent fatigue and promote productive processing.
                                You retain full control to end the session at any moment. All interactions are strictly private.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50 fit-content">
                                <strong className="text-zinc-300 font-medium block mb-3 uppercase tracking-wider text-xs">Disclaimer</strong>
                                <p className="text-sm text-zinc-500 font-light leading-relaxed">
                                    This specialized AI tool does not replace professional medical or psychological care.
                                    It provides supportive guidance based on patterns and cannot diagnose or treat.
                                    Users in crisis should seek professional help immediately.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
