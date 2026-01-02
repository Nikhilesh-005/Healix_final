
"use client";

import React, { useState, useEffect } from "react";
import AgentSetup from "./AgentSetup";
import ActiveSession from "./ActiveSession";
import SessionReport from "./SessionReport";
import AgentLanding from "./AgentLanding";
import SessionHistory from "./SessionHistory";
import { motion, AnimatePresence } from "framer-motion";
import { History } from "lucide-react";

type Step = "landing" | "setup" | "active" | "report" | "history";

interface PersonalAgentContainerProps {
    userId: string;
    userImage?: string | null;
    initialView?: "landing" | "history";
}

export default function PersonalAgentContainer({ userId, userImage, initialView = "landing" }: PersonalAgentContainerProps) {
    const [step, setStep] = useState<Step>(initialView === "history" ? "history" : "landing");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    // Fetch history
    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/personal-agent/history");
            const data = await res.json();
            if (data.history) {
                setHistory(data.history);
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    // Initialize history if starting in history view
    useEffect(() => {
        if (initialView === "history") {
            setStep("history");
            fetchHistory();
        } else {
            // If navigating back to "Personal Agent" (landing), make sure we show landing
            // But only if we are currently in history or report view (don't interrupt setup/active if possible, 
            // though URL change usually implies reset if it's a fresh navigation).
            // For now, strict sync to landing as requested.
            if (step === "history") {
                setStep("landing");
            }
        }
    }, [initialView]);

    // 0. To Setup
    const handleStartSetup = () => {
        setStep("setup");
    };

    // 1. Start Session
    const handleStartSession = async (mood: string) => {
        setLoading(true);
        try {
            const res = await fetch("/api/personal-agent/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ moodDescription: mood }),
            });
            const data = await res.json();
            if (data.session) {
                setSessionId(data.session.id);
                setStep("active");
            }
        } catch (err) {
            console.error("Failed to start session", err);
        } finally {
            setLoading(false);
        }
    };

    // 2. End Session & Generate Report
    const handleEndSession = async () => {
        if (!sessionId) return;
        setLoading(true);

        try {
            const res = await fetch("/api/personal-agent/session", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });
            const data = await res.json();
            console.log("End session response data:", data);

            if (data.report) {
                setReport(data.report);
                setStep("report");
            } else {
                console.error("End session failed, no report:", data);
                alert("Could not generate report. Please try again or check console.");
            }
        } catch (err) {
            console.error("Failed to end session", err);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep("landing");
        setSessionId(null);
        setReport(null);
    };

    const handleOpenHistory = async () => {
        setLoading(true);
        await fetchHistory();
        setLoading(false);
        setStep("history");
    };

    const handleSelectHistorySession = (id: string) => {
        const session = history.find(s => s.id === id);
        if (session && session.report) {
            setReport(session.report);
            setStep("report");
        }
    };

    return (
        <div className="w-full h-full relative overflow-hidden bg-[#18181C]">

            <AnimatePresence mode="wait">
                {step === "landing" && (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full"
                    >
                        <AgentLanding onStart={handleStartSetup} />
                    </motion.div>
                )}

                {step === "setup" && (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center"
                    >
                        <AgentSetup onStart={handleStartSession} loading={loading} />
                    </motion.div>
                )}

                {step === "active" && sessionId && (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full"
                    >
                        <ActiveSession
                            sessionId={sessionId}
                            onEnd={handleEndSession}
                            userImage={userImage}
                        />
                        {loading && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-white font-medium">Generating your session report...</p>
                                    <p className="text-zinc-500 text-sm mt-2">This may take a moment</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {step === "report" && report && (
                    <motion.div
                        key="report"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full"
                    >
                        <SessionReport report={report} onClose={reset} />
                    </motion.div>
                )}

                {step === "history" && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
                        className="w-full h-full"
                    >
                        <SessionHistory
                            sessions={history}
                            onSelectSession={handleSelectHistorySession}
                            onClose={reset}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
