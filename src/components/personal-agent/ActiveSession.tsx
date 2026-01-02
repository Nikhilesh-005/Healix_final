
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Mic, MicOff, Square, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ActiveSessionProps {
    sessionId: string;
    onEnd: () => void;
    userImage?: string | null;
}

export default function ActiveSession({ sessionId, onEnd, userImage }: ActiveSessionProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(true); // TTS enabled by default

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onEnd(); // Auto-end
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onEnd]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Speech Recognition Setup
    const handleMicClick = () => {
        if (!("webkitSpeechRecognition" in window)) {
            alert("Voice input not supported in this browser.");
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            if (text) setInput(text);
        };

        recognition.start();
    };

    // Text-to-Speech
    const speak = (text: string) => {
        if (!isSpeaking || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        // Try to find a nice voice
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
        if (preferred) utterance.voice = preferred;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.cancel(); // Stop overlap
        window.speechSynthesis.speak(utterance);
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setLoading(true);

        try {
            const elapsedTime = Math.floor((15 * 60 - timeLeft) / 60);

            const res = await fetch("/api/personal-agent/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, message: userMsg, duration: elapsedTime }),
            });

            const data = await res.json();
            if (data.response) {
                setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
                speak(data.response);
            }
        } catch (err) {
            console.error("Chat error:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <div className="flex flex-col h-full w-full max-w-5xl mx-auto relative bg-[#09090b]">

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-900 bg-[#09090b]">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    <h2 className="text-zinc-200 font-medium tracking-wide text-sm">Active Session</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-zinc-500 font-mono text-xs tracking-wider">
                        {formatTime(timeLeft)}
                    </div>
                    <button
                        onClick={() => setIsSpeaking(!isSpeaking)}
                        className="p-2 text-zinc-500 hover:text-zinc-300 transition"
                        title={isSpeaking ? "Mute TTS" : "Enable TTS"}
                    >
                        {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                    <button
                        onClick={onEnd}
                        className="flex items-center gap-2 px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-full border border-zinc-800 transition text-xs font-medium"
                    >
                        End Session
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {msg.role === "assistant" && (
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-zinc-400 text-xs font-medium border border-zinc-700 shadow-sm">
                                    AI
                                </div>
                            )}

                            <div
                                className={`max-w-[80%] md:max-w-[65%] px-6 py-4 rounded text-sm leading-relaxed font-light ${msg.role === "user"
                                    ? "bg-[#1e293b] text-zinc-200 rounded-br-none border border-[#334155]"
                                    : "bg-zinc-900 text-zinc-300 rounded-bl-none border border-zinc-800"
                                    }`}
                            >
                                {msg.content}
                            </div>

                            {msg.role === "user" && (
                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-zinc-700 shadow-sm">
                                    <img
                                        src={userImage || "/placeholder.svg"}
                                        alt="User"
                                        className="w-full h-full object-cover grayscale opacity-80"
                                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                                    />
                                </div>
                            )}
                        </motion.div>
                    ))}
                    {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 justify-start">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-zinc-400 text-xs border border-zinc-700">AI</div>
                            <div className="flex items-center gap-1 bg-zinc-900 px-5 py-4 rounded-3xl rounded-bl-sm border border-zinc-800">
                                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-zinc-900 bg-[#09090b]">
                <form onSubmit={handleSend} className="max-w-5xl mx-auto relative flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-zinc-900 text-zinc-200 rounded-full px-6 py-4 border border-zinc-800 focus:border-zinc-700 focus:ring-0 outline-none transition-all placeholder:text-zinc-600 font-light"
                        disabled={loading}
                    />

                    <button
                        type="button"
                        onClick={handleMicClick}
                        className={`p-4 rounded-full transition-all border ${isListening ? "bg-red-900/20 text-red-400 border-red-900/30" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 border-zinc-800"
                            }`}
                        title="Voice Input"
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="p-4 bg-zinc-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-full transition-colors font-medium shadow-lg"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
