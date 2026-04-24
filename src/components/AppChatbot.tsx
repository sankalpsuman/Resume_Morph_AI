import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, Zap, Trophy, ShieldCheck, RefreshCw, Layout, Globe, FileText, Briefcase, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

const SYSTEM_PROMPT = `
You are the Morph AI Assistant, a helpful helper for the Morph resume building application.
Your goal is to answer questions about the application's features, subscriptions, and general job search advice.

Respond using Markdown for rich formatting. Use bold for emphasis, bullet points for lists, and headers for sections if needed. Be concise and fast.

KEY FEATURES OF MORPH:
1. Morph Engine: Clones any reference resume layout using the user's professional data. It's the core AI feature.
2. Smart Editor: A powerful markdown-based editor with AI-assisted rewriting and section-specific suggestions.
3. Portfolio Gen: Automatically converts a resume into a responsive, recruiter-ready web portfolio.
4. Cover Letter Gen: Generates tailored cover letters that perfectly match the resume style.
5. Apply Tracker: A dashboard to organize job applications, interviews, and status updates.

SUBSCRIPTION PLANS:
1. Free Plan: Users get 2 free "Morphs" (resume generations).
2. Level Up System: Users gain experience by using the app to unlock more features.
3. Portfolio Starter (₹299): 2 portfolios, expert templates.
4. Portfolio Pro (₹999): 5 portfolios, best for professionals.
5. Master Combo (₹1499): 15 Morphs + 10 Portfolios. Includes Morph Engine + Portfolio Gen.

All premium plans include: No watermarks, high-priority processing, premium templates, and expert support.

If a user wants to upgrade, they can click "Request Access" in the Premium modal or contact admin on WhatsApp at +91 9540446448.

Be professional, enthusiastic, and concise. Use bullet points for clarity.
`;

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function AppChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm Morph AI. How can I help you build your dream career today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("AI key not found");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: newMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: SYSTEM_PROMPT
        }
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      } else {
        throw new Error("No response text");
      }
    } catch (error: any) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: `I'm having a bit of trouble: ${error.message}. Please try again later!` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] bg-white rounded-[32px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden outline-none ring-4 ring-indigo-50"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <h3 className="text-white font-black tracking-tight leading-none">Morph AI</h3>
                  <p className="text-indigo-100/80 text-[10px] font-bold uppercase tracking-widest mt-1">Smart Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm prose prose-sm max-w-none",
                    msg.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-tr-none prose-invert" 
                      : "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100"
                  )}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col max-w-[85%] mr-auto items-start">
                  <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-50 bg-gray-50/30">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Morph anything..."
                  className="w-full pl-4 pr-12 py-4 bg-white rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none text-sm font-medium transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300",
          isOpen 
            ? "bg-gray-900 text-white rotate-90" 
            : "bg-indigo-600 text-white shadow-indigo-200"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 fill-white" />}
      </motion.button>
    </div>
  );
}
