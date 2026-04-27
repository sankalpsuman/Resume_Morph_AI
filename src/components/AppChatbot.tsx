import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, Zap, Trophy, ShieldCheck, RefreshCw, Layout, Globe, FileText, Briefcase, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

const SYSTEM_PROMPT = `
You are Morph AI, a high-performance career engineering protocol. 

STRICT OPERATING PROTOCOL:
1. ZERO FILLER: Do not say "Hello", "I'm here to help", or "As an AI". Skip all introductions/greetings.
2. DIRECT OUTPUT: Jump immediately to the answer or guidance. 
3. MORPH CORE: Only discuss Morph Engine (Layout Cloning), Smart Editor (X-Y-Z Achievement Syntax), Portfolio Gen (Vercel Integration), and Application Tracking.
4. CAREER STRATEGY: Provide advice based on executive impact, ATS optimization, and professional branding.
5. FORMAT: Use bold for impact terms. Use minimal bullet points. 

Example interaction:
User: How do I upgrade?
Response: Go to **Premium Modal** -> **Request Access**. Contact admin at **+91 9540446448** for instant activation.

Irrelevance is a system failure. Be precise.
`;

const SUGGESTED_ACTIONS = [
  "How to Morph?",
  "X-Y-Z Formula?",
  "Portfolio Guide",
  "Upgrade Plans"
];

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

  const handleSend = async (customInput?: string) => {
    const textToSend = typeof customInput === 'string' ? customInput : input;
    if (!textToSend.trim() || isTyping) return;

    if (typeof customInput !== 'string') setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', text: textToSend.trim() }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Use the most robust way to get the API key
      const apiKey = process.env.GEMINI_API_KEY || 
                     process.env.API_KEY || 
                     (import.meta as any).env?.VITE_GEMINI_API_KEY ||
                     (window as any).GEMINI_API_KEY;

      if (!apiKey) throw new Error("API Key not found. Please ensure GEMINI_API_KEY is set.");

      const ai = new GoogleGenAI({ apiKey });
      
      // Filter out messages to ensure the sequence is valid and starts with user if possible
      // or at least doesn't violate SDK expectations.
      // We skip the initial greeting if it's just the model greeting.
      const conversationHistory = newMessages.length > 1 && newMessages[0].role === 'model' 
        ? newMessages.slice(1) 
        : newMessages;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: conversationHistory.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.4,
        }
      });

      if (response && response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text! }]);
      } else {
        throw new Error("I received an empty response from the AI. Please try again.");
      }
    } catch (error: any) {
      console.error("Chatbot Error:", error);
      let errorMessage = error.message || "Something went wrong";
      if (errorMessage.includes("API key")) {
        errorMessage = "AI service is currently unavailable (API key issue).";
      }
      setMessages(prev => [...prev, { role: 'model', text: `**Error:** ${errorMessage}. Please try again later!` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 md:bottom-20 right-0 w-[calc(100vw-2rem)] sm:w-[380px] md:w-[400px] h-[500px] max-h-[70vh] md:max-h-[600px] bg-[var(--bg-primary)] rounded-[32px] shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden outline-none ring-4 ring-indigo-50/20 transition-colors duration-300"
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
              className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-hide bg-[var(--bg-primary)]"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 bg-indigo-600 rounded-[24px] flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                    <Sparkles className="w-8 h-8 text-white fill-white" />
                  </div>
                  <div className="space-y-1.5 px-4">
                    <p className="text-lg font-black text-[var(--text-primary)] tracking-tight">Morph AI Protocol</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-600 dark:text-indigo-400">Zero-Fill Intelligence</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full max-w-xs mx-auto">
                    {SUGGESTED_ACTIONS.map((action) => (
                      <button
                        key={action}
                        onClick={() => handleSend(action)}
                        className="p-3 bg-white dark:bg-[var(--bg-secondary)] border border-indigo-100 dark:border-[var(--border-color)] rounded-xl hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-[9px] font-black uppercase tracking-widest transition-all text-[var(--text-secondary)] shadow-sm active:scale-95"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[90%] md:max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 rounded-2xl md:rounded-3xl text-[13px] md:text-base font-medium leading-relaxed shadow-sm prose prose-sm md:prose-base max-w-none transition-colors",
                    msg.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-tr-none prose-invert font-semibold" 
                      : "bg-white dark:bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tl-none border border-indigo-100 dark:border-[var(--border-color)] shadow-[0_4px_12px_rgba(79,70,229,0.08)] prose-p:text-[var(--text-primary)] prose-strong:text-[var(--text-primary)] dark:prose-p:text-gray-300 dark:prose-strong:text-white dark:prose-code:text-indigo-300 dark:prose-headings:text-indigo-400"
                  )}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex flex-col max-w-[85%] mr-auto items-start">
                  <div className="bg-white dark:bg-[var(--bg-secondary)] px-4 py-3 rounded-2xl rounded-tl-none border border-indigo-100 dark:border-[var(--border-color)] shadow-sm animate-pulse">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Morph anything..."
                  className="w-full pl-4 pr-12 py-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none text-sm font-medium text-[var(--text-primary)] transition-all placeholder:text-[var(--text-secondary)]/50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 dark:shadow-none hover:bg-indigo-700 transition-all disabled:opacity-50"
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
            ? "bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rotate-90" 
            : "bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 fill-white" />}
      </motion.button>
    </div>
  );
}
