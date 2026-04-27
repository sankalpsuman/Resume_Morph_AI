import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Send, Sparkles, AlertCircle, CheckCircle2, Search, Zap, RefreshCw, X, MessageSquare, Download, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { extractTextFromAny } from '../lib/gemini';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function ResumeAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Welcome to morph AI Resume Assistant! Upload your resume and I'll help you find issues, suggest corrections, and answer any questions." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setIsExtracting(true);
    setLoadingStatus('Reading document...');
    
    const formData = new FormData();
    formData.append('resume', file);

    try {
      // 1. Try server-side extraction
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData
      });

      let extractedText = "";
      if (response.ok) {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            extractedText = data.text || "";
          } else {
            console.error("Server returned non-JSON response:", await response.text());
          }
        } catch (jsonErr) {
          console.error("Failed to parse JSON from server:", jsonErr);
        }
      }

      // 2. If server failed or text is too short, fallback to AI Extraction in frontend
      if (extractedText.trim().length < 50) {
        setLoadingStatus('Employing AI Extraction...');
        console.log("Server extraction minimal, trying frontend AI fallback...");
        // Use more robust key detection
        const apiKey = process.env.GEMINI_API_KEY || 
                       process.env.API_KEY || 
                       (import.meta as any).env?.VITE_GEMINI_API_KEY ||
                       (window as any).GEMINI_API_KEY;

        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          
          // Read file as base64
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve) => {
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1]);
            };
            reader.readAsDataURL(file);
          });

          const extractionResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: file.type
                  }
                },
                { text: "Extract all text from this resume perfectly. Preserve logical flow. No chat, just the text." }
              ]
            }
          });
          
          if (extractionResponse && extractionResponse.text) {
            extractedText = extractionResponse.text;
            
            // Trigger Congrats Modal
            window.dispatchEvent(new CustomEvent('feature-success', { detail: { feature: 'coach' } }));
          }
        }
      }

      if (extractedText.trim().length > 0) {
        setResumeText(extractedText);
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: `### ✅ Resume Successfully Analyzed\n\nI've successfully parsed your professional data from **"${file.name}"**. I'm now equipped with your career history and ready to help you stand out.\n\n**What shall we focus on first?**\n\n*   **🔍 ATS Optimization** — *Check if filters will flag your resume*\n*   **🚀 Impact Analysis** — *Transform passive tasks into active wins*\n*   **🎯 Skill Benchmarking** — *See how you compare to top industry candidates*\n*   **💬 General Strategic Review** — *Get a full grade on your profile*` 
        }]);
      } else {
        throw new Error("Unable to extract text from this file.");
      }
    } catch (error: any) {
      console.error("Extraction Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `Error: ${error.message}. Please make sure it's a valid PDF, DOCX, or text file and try again.` 
      }]);
    } finally {
      setIsTyping(false);
      setIsExtracting(false);
      setLoadingStatus('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/html': ['.html', '.htm'],
      'application/json': ['.json']
    },
    multiple: false
  } as any);

  const handleSend = async (customPrompt?: string) => {
    const userMessage = customPrompt || input.trim();
    if (!userMessage || isTyping) return;

    if (!resumeText) {
      setMessages(prev => [...prev, { role: 'model', text: "Please upload your resume first so I can provide customized advice." }]);
      return;
    }

    if (!customPrompt) setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setIsTyping(true);
    setLoadingStatus('Analyzing resume...');

    try {
      // Use more robust key detection
      const apiKey = process.env.GEMINI_API_KEY || 
                     process.env.API_KEY || 
                     (import.meta as any).env?.VITE_GEMINI_API_KEY ||
                     (window as any).GEMINI_API_KEY;

      if (!apiKey) throw new Error("AI Key not found. Please check your configuration.");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...newMessages.slice(0, -1).map(m => ({ 
            role: m.role === 'user' ? 'user' : 'model', 
            parts: [{ text: m.text }] 
          })),
          {
            role: 'user',
            parts: [{ text: `
              USER RESUME CONTENT:
              """
              ${resumeText}
              """

              USER QUERY: ${userMessage}
            `}]
          }
        ],
        config: {
          systemInstruction: `You are a morph expert Resume Strategist and Career Coach. 
Answer questions about the provided resume content. Be professional, specific, and provide actionable advice.
Respond using Markdown for better formatting. Use bold for emphasis, and use comparison blocks (e.g., Before/After) for suggestions.`
        }
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      } else {
        throw new Error("No response text");
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: `I'm having trouble analyzing your resume: ${error.message}. Please try again later.` }]);
    } finally {
      setIsTyping(false);
      setLoadingStatus('');
    }
  };

  const RECOMMENDATIONS = [
    "Find issues in my resume",
    "Improve my professional summary",
    "Tailor my bullet points for better impact",
    "What key skills are missing?"
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 transition-colors duration-300">
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:min-h-[700px]">
        {/* Left Panel: Upload & Info */}
        <div className="lg:w-1/3 space-y-6">
          <div className="bg-[var(--bg-primary)] p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-[var(--border-color)] shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 dark:shadow-none">
                <Sparkles className="w-6 h-6 text-white fill-white" />
              </div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">AI Resume Coach</h2>
              <p className="text-[var(--text-secondary)] font-medium text-sm leading-relaxed">
                Upload your resume and get instant feedback, corrections, and career guidance powered by Gemini 3.1 Pro.
              </p>
            </div>

            <div 
              {...getRootProps()}
              className={cn(
                "p-6 md:p-8 border-2 border-dashed rounded-[24px] md:rounded-[32px] transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center",
                isDragActive ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10" : "border-[var(--border-color)] hover:border-indigo-300 hover:bg-[var(--bg-secondary)]/50",
                resumeText && "border-green-500 bg-green-50/30 dark:bg-green-900/10"
              )}
            >
              <input {...getInputProps()} />
              {isExtracting ? (
                <div className="space-y-3">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-2">
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{loadingStatus || 'Reading Resume...'}</p>
                    <div className="w-24 h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden mx-auto">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="h-full bg-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              ) : resumeText ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-green-500/20 dark:shadow-none">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-black text-[var(--text-primary)]">{fileName}</p>
                  <p className="text-[10px] text-green-600 font-black uppercase tracking-widest">Analysis Ready</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center text-[var(--text-tertiary)] group-hover:text-indigo-500 transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[var(--text-primary)]">Drop your resume</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">PDF, DOCX, or TXT</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                {RECOMMENDATIONS.map((rec) => (
                  <button
                    key={rec}
                    onClick={() => handleSend(rec)}
                    className="px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-black rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all border border-[var(--border-color)]"
                  >
                    {rec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-[32px] border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-4">
            <div className="px-2 py-1 bg-[var(--bg-primary)] rounded-lg shadow-sm">
              <Info className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
              Your data is processed securely and is only used to provide analysis. We don't share your content with third parties.
            </p>
          </div>
        </div>

        {/* Right Panel: Chat Interface */}
        <div className="flex-grow bg-[var(--bg-primary)] rounded-[32px] md:rounded-[40px] border border-[var(--border-color)] shadow-sm flex flex-col overflow-hidden h-[500px] md:h-[700px] lg:h-auto lg:max-h-[800px]">
          {/* Chat Header */}
          <div className="p-4 md:p-6 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white fill-white" />
              </div>
              <h3 className="text-base md:text-lg font-black text-[var(--text-primary)] tracking-tight">Strategy Chat</h3>
            </div>
            <button 
              onClick={() => {
                setMessages([{ role: 'model', text: "Welcome back! Upload your resume and I'll help you find issues, suggest corrections, and answer any questions." }]);
                setResumeText(null);
                setFileName(null);
              }}
              className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-grow overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 no-scrollbar scrolling-touch"
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex flex-col max-w-[95%] md:max-w-[90%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "px-4 md:px-6 py-3 md:py-4 rounded-[20px] md:rounded-[24px] text-sm md:text-base font-medium leading-relaxed shadow-sm prose prose-sm md:prose-base max-w-none",
                  msg.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-tr-none prose-invert" 
                    : "bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border-color)] prose-neutral dark:prose-invert dark:prose-p:text-gray-300 dark:prose-strong:text-white dark:prose-code:text-indigo-300"
                )}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                <span className="text-[9px] md:text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-widest mt-2 px-1">
                  {msg.role === 'user' ? 'You' : 'Morph Assistant'}
                </span>
              </div>
            ))}
            {isTyping && (
              <div className="flex flex-col max-w-[90%] mr-auto items-start">
                <div className="bg-[var(--bg-secondary)] px-4 md:px-6 py-3 md:py-4 rounded-[20px] md:rounded-[24px] rounded-tl-none border border-[var(--border-color)] flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <div className="flex flex-col gap-0.5 md:gap-1">
                    <span className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-widest">{loadingStatus || 'Analyzing...'}</span>
                    <div className="w-16 md:w-20 h-0.5 bg-[var(--border-color)] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="h-full bg-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 md:p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
            <div className="relative">
              <input
                type="text"
                disabled={!resumeText || isTyping}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={resumeText ? "Ask anything..." : "Upload resume first..."}
                className="w-full pl-5 pr-14 py-4 md:pl-6 md:pr-16 md:py-5 bg-[var(--bg-primary)] rounded-[20px] md:rounded-[24px] border border-[var(--border-color)] focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none text-sm md:text-base font-medium text-[var(--text-primary)] transition-all disabled:bg-[var(--bg-secondary)] disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping || !resumeText}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl shadow-lg shadow-indigo-500/20 dark:shadow-none hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
