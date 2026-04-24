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
        const data = await response.json();
        extractedText = data.text || "";
      }

      // 2. If server failed or text is too short, fallback to AI Extraction in frontend
      if (extractedText.trim().length < 50) {
        console.log("Server extraction minimal, trying frontend AI fallback...");
        const apiKey = process.env.GEMINI_API_KEY;
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
          
          if (extractionResponse.text) {
            extractedText = extractionResponse.text;
          }
        }
      }

      if (extractedText.trim().length > 0) {
        setResumeText(extractedText);
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: `Success! I've read your resume ("${file.name}"). What would you like to know? I can help with:\n\n• Identifying ATS issues\n• Fixing bullet points\n• Recommending skills\n• General feedback` 
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
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
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

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("AI configuration missing");

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
    }
  };

  const RECOMMENDATIONS = [
    "Find issues in my resume",
    "Improve my professional summary",
    "Tailor my bullet points for better impact",
    "What key skills are missing?"
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12">
      <div className="flex flex-col lg:flex-row gap-8 min-h-[700px]">
        {/* Left Panel: Upload & Info */}
        <div className="lg:w-1/3 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <Sparkles className="w-6 h-6 text-white fill-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">AI Resume Coach</h2>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                Upload your resume and get instant feedback, corrections, and career guidance powered by Gemini 3.1 Pro.
              </p>
            </div>

            <div 
              {...getRootProps()}
              className={cn(
                "p-8 border-2 border-dashed rounded-[32px] transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center",
                isDragActive ? "border-indigo-500 bg-indigo-50/50" : "border-gray-100 hover:border-indigo-300 hover:bg-gray-50/50",
                resumeText && "border-green-500 bg-green-50/30"
              )}
            >
              <input {...getInputProps()} />
              {isExtracting ? (
                <div className="space-y-3">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Reading Resume...</p>
                </div>
              ) : resumeText ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-green-100">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-black text-gray-900">{fileName}</p>
                  <p className="text-[10px] text-green-600 font-black uppercase tracking-widest">Analysis Ready</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">Drop your resume</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PDF, DOCX, or TXT</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                {RECOMMENDATIONS.map((rec) => (
                  <button
                    key={rec}
                    onClick={() => handleSend(rec)}
                    className="px-3 py-2 bg-gray-50 text-gray-600 text-xs font-black rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-gray-100"
                  >
                    {rec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100 flex items-start gap-4">
            <div className="px-2 py-1 bg-white rounded-lg shadow-sm">
              <Info className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xs text-indigo-700 font-medium leading-relaxed">
              Your data is processed securely and is only used to provide analysis. We don't share your content with third parties.
            </p>
          </div>
        </div>

        {/* Right Panel: Chat Interface */}
        <div className="flex-grow bg-white rounded-[40px] border border-gray-100 shadow-sm flex flex-col overflow-hidden max-h-[800px]">
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white fill-white" />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Strategy Chat</h3>
            </div>
            <button 
              onClick={() => {
                setMessages([{ role: 'model', text: "Welcome back! Upload your resume and I'll help you find issues, suggest corrections, and answer any questions." }]);
                setResumeText(null);
                setFileName(null);
              }}
              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Clear Conversation
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-grow overflow-y-auto p-8 space-y-6 no-scrollbar scrolling-touch"
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex flex-col max-w-[90%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "px-6 py-4 rounded-[24px] text-sm md:text-base font-medium leading-relaxed shadow-sm prose prose-sm md:prose-base max-w-none",
                  msg.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-tr-none prose-invert" 
                    : "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100"
                )}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 px-1">
                  {msg.role === 'user' ? 'You' : 'Morph Assistant'}
                </span>
              </div>
            ))}
            {isTyping && (
              <div className="flex flex-col max-w-[90%] mr-auto items-start">
                <div className="bg-gray-50 px-6 py-4 rounded-[24px] rounded-tl-none border border-gray-100 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Analyzing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-6 border-t border-gray-50 bg-gray-50/30">
            <div className="relative">
              <input
                type="text"
                disabled={!resumeText || isTyping}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={resumeText ? "Ask anything about your resume..." : "Upload your resume first..."}
                className="w-full pl-6 pr-16 py-5 bg-white rounded-[24px] border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none text-sm md:text-base font-medium transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping || !resumeText}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
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
