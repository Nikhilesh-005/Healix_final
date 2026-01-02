
"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Quote, Heart, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";

interface ReportData {
    sessionSummary: {
        summary: string;
        overallTone: string;
        endingEmotionalState: string;
    };
    userSentimentOverview: {
        start: string;
        middle: string;
        end: string;
        trend: string;
    };
    sentimentTimeline: Array<{ phase: string; sentiment: string; score: number }>;
    keyEmotionalMoments: Array<{ message: string; change: string }>;
    detailedAnalysis: string;
    personalizedTips: string[];
    finalAssessment: string;
    metadata: {
        overallSentiment: string;
        sessionImpact: string;
        dominantEmotions: string[];
        recommendedFollowUp: boolean;
    };
}

interface SessionReportProps {
    report: ReportData | any;
    onClose: () => void;
}

export default function SessionReport({ report, onClose }: SessionReportProps) {
    if (!report || !report.sessionSummary) return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-400 animate-pulse">
            <div className="w-8 h-8 border-2 border-t-blue-500 rounded-full animate-spin mb-4" />
            Loading Report Analysis...
        </div>
    );

    const {
        sessionSummary,
        userSentimentOverview,
        sentimentTimeline,
        keyEmotionalMoments,
        detailedAnalysis,
        personalizedTips,
        finalAssessment
    } = report as ReportData;

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto bg-[#18181C] text-zinc-200 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
            <div className="p-8 space-y-8">

                {/* header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <CheckCircle size={18} />
                            <span className="text-sm font-medium uppercase tracking-wider">Session Completed</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white">Emotional & Sentiment Analysis</h1>
                        <p className="text-zinc-500 mt-1">Comprehensive overview of your session's emotional journey.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full transition text-sm font-medium flex items-center gap-2 border border-zinc-700"
                    >
                        Back to Dashboard <ArrowRight size={16} />
                    </button>
                </motion.div>


                {/* Section 1: Session Summary (Full Width) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-[#27272A] p-6 rounded-2xl border border-zinc-800 shadow-sm"
                >
                    <h2 className="text-lg font-semibold text-white mb-3">Session Summary</h2>
                    <p className="text-zinc-300 leading-relaxed text-sm">
                        {sessionSummary.summary}
                    </p>
                    <div className="flex gap-4 mt-4 pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <span className="text-zinc-500">Tone:</span>
                            <span className="text-white capitalize px-2 py-0.5 bg-zinc-800 rounded">{sessionSummary.overallTone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <span className="text-zinc-500">Ended feeling:</span>
                            <span className="text-green-300 capitalize">{sessionSummary.endingEmotionalState}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Grid: Sentiment Overview (Left) & Graph (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Section 2: User Sentiment Overview */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        className="col-span-1 bg-[#27272A] p-6 rounded-2xl border border-zinc-800 space-y-6"
                    >
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Heart size={18} className="text-red-400" /> Sentiment Overview
                        </h3>

                        <div className="space-y-4">
                            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Start</div>
                                <div className="text-zinc-200 font-medium capitalize">{userSentimentOverview.start}</div>
                            </div>
                            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Middle</div>
                                <div className="text-zinc-200 font-medium capitalize">{userSentimentOverview.middle}</div>
                            </div>
                            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">End</div>
                                <div className="text-zinc-200 font-medium capitalize">{userSentimentOverview.end}</div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800">
                            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Overall Trend</div>
                            <div className="text-xl font-medium text-blue-400 flex items-center gap-2">
                                <TrendingUp size={20} />
                                {userSentimentOverview.trend}
                            </div>
                        </div>
                    </motion.div>

                    {/* Section 3: Sentiment Timeline Graph */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                        className="col-span-1 lg:col-span-2 bg-[#27272A] p-6 rounded-2xl border border-zinc-800"
                    >
                        <h3 className="text-lg font-semibold text-white mb-6">Sentiment Timeline</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sentimentTimeline}>
                                    <defs>
                                        <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="phase" stroke="#666" tick={{ fill: '#888' }} />
                                    <YAxis hide domain={[-1, 1]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181B', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(val: number | undefined) => [val?.toFixed(2) ?? "0.00", "Score"]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorSentiment)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Section 4: Key Emotional Moments */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-[#27272A] p-6 rounded-2xl border border-zinc-800"
                >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <AlertCircle size={18} className="text-yellow-500" /> Key Emotional Moments
                    </h3>
                    <div className="space-y-4">
                        {keyEmotionalMoments.map((moment, idx) => (
                            <div key={idx} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60">
                                <div className="flex items-start gap-4">
                                    <Quote size={20} className="text-zinc-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="text-zinc-300 italic mb-2">"{moment.message}"</p>
                                        <p className="text-sm text-yellow-500/90 font-medium">
                                            Turning Point: <span className="text-zinc-400 font-normal">{moment.change}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {keyEmotionalMoments.length === 0 && (
                            <p className="text-zinc-500 text-sm">No specific major turning points detected.</p>
                        )}
                    </div>
                </motion.div>

                {/* Section 5: Detailed & Tips Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Section 5: Detailed Analysis */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                        className="bg-[#27272A] p-6 rounded-2xl border border-zinc-800"
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">Detailed Analysis</h3>
                        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                            {detailedAnalysis}
                        </p>
                    </motion.div>

                    {/* Section 6: Tips */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                        className="bg-[#27272A] p-6 rounded-2xl border border-zinc-800"
                    >
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Lightbulb size={18} className="text-blue-400" /> Personalized Tips
                        </h3>
                        <ul className="space-y-3">
                            {personalizedTips.map((tip, idx) => (
                                <li key={idx} className="flex gap-3 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                    <span className="text-zinc-300 text-sm">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* Section 7: Final Assessment */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="bg-gradient-to-r from-green-900/20 to-blue-900/20 p-8 rounded-2xl border border-white/5 text-center"
                >
                    <h3 className="text-lg font-medium text-white mb-3">Final Assessment</h3>
                    <p className="text-zinc-300 max-w-2xl mx-auto leading-relaxed">
                        {finalAssessment}
                    </p>
                </motion.div>

                <div className="h-4" /> {/* Spacer */}
            </div>
        </div>
    );
}
