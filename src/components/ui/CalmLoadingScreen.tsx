"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const QUOTES = [
    "“It’s okay to not be okay.”",
    "“Your feelings are valid.”",
    "“Take a deep breath. You’re safe here.”",
    "“Healing takes time — and that’s okay.”",
    "“You are stronger than you know.”",
    "“This feeling will pass.”",
    "“Be gentle with yourself.”"
];

const LOADING_TEXTS = [
    "Listening to your emotions...",
    "Preparing your calm space...",
    "Connecting with your inner peace...",
    "Almost there..."
];

export default function CalmLoadingScreen() {
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [textIndex, setTextIndex] = useState(0);

    // Cycle quotes every 3.5s
    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    // Cycle status text every 2s
    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex((prev) => Math.min(prev + 1, LOADING_TEXTS.length - 1));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[#1a1a1a]" >
            {/* Animated Dark Gradient Background */}
            < motion.div
                className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"
                animate={{
                    background: [
                        "linear-gradient(135deg, #1f2937 0%, #000000 100%)",
                        "linear-gradient(135deg, #374151 0%, #111827 100%)",
                        "linear-gradient(135deg, #1f2937 0%, #000000 100%)",
                    ],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-md w-full">

                {/* Breathing Circle Animation */}
                <div className="relative mb-10 flex items-center justify-center">
                    {/* Outer ripples */}
                    <motion.div
                        className="absolute rounded-full bg-white/5"
                        style={{ width: 200, height: 200 }}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute rounded-full bg-white/10"
                        style={{ width: 160, height: 160 }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0, 0.15] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />

                    {/* Core breathing circle */}
                    <motion.div
                        className="w-32 h-32 rounded-full bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center backdrop-blur-sm border border-white/10"
                        animate={{ scale: [1, 1.2, 1], boxShadow: ["0 0 30px rgba(255,255,255,0.1)", "0 0 60px rgba(255,255,255,0.2)", "0 0 30px rgba(255,255,255,0.1)"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <motion.div
                            className="w-3 h-3 rounded-full bg-white/80"
                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                    </motion.div>
                </div>

                {/* Status Text (Wave Flow) */}
                <motion.h2
                    key={textIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.8 }}
                    className="text-xl md:text-2xl font-semibold text-gray-200 mb-2 font-sans tracking-wide"
                >
                    {LOADING_TEXTS[textIndex]}
                </motion.h2>

                {/* Progress Bar (Pulse) */}
                <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden mb-8 relative">
                    <motion.div
                        className="absolute inset-0 bg-gray-400 rounded-full"
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 5, ease: "easeInOut" }} // Approximate total load time
                    />
                    <motion.div
                        className="absolute inset-0 bg-white opacity-10"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                </div>

                {/* Quote Carousel */}
                <div className="h-20 w-full flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={quoteIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="text-base md:text-lg text-gray-400 italic font-medium px-4"
                        >
                            {QUOTES[quoteIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div >
    );
}
