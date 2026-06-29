import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { 
  Upload, FileText, CheckCircle, Loader2, AlertCircle, Sparkles, 
  ArrowLeft, Download, RefreshCw, X, Send, Bot, User, 
  Undo2, Redo2, MessageSquare, Check, Eye, ChevronRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, checkIsPremium } from '../lib/utils';
import { 
  generateResumeFromData, 
  parseResumeToData, 
  conversationalEdit
} from '../lib/gemini';

// Dynamic imports for heavy libraries to keep bundle optimized
const loadMammoth = () => import('mammoth').then(m => m.default || m);
const loadJsPDF = () => import('jspdf').then(m => (m as any).jsPDF || (m as any).default?.jsPDF || (m as any).default || m);

interface ResumeData {
  personalInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    links: { linkedin: string; github: string; portfolio: string };
  };
  summary: string;
  experience: any[];
  projects: any[];
  education: any[];
  skills: any[];
  certifications: string[];
  customSections: any[];
}

interface EditorStyles {
  fontFamily: string;
  primaryColor: string;
  fontSize: string;
  spacing: string;
  headingStyle: string;
}

interface CustomMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

function SmartEditor({ userData, user, onUpgrade, onLogin, isLoginProgress, isAdmin }: { 
  userData: any;
  user?: any;
  onUpgrade: () => void;
  onLogin?: () => void;
  isLoginProgress?: boolean;
  isAdmin?: boolean;
}) {
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[28px] flex items-center justify-center mb-6 shadow-lg shadow-indigo-100 dark:shadow-none">
          <Sparkles className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4 tracking-tight">Smart Editor Locked</h2>
        <p className="text-[var(--text-secondary)] mb-8 max-w-md font-medium text-lg leading-relaxed">Sign in to access the Smart Editor. Manually edit every pixel of your resume with AI assistance.</p>
        <button 
          onClick={onLogin}
          className="px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center gap-3"
        >
          <Zap className="w-5 h-5" />
          Unlock Editor
        </button>
      </div>
    );
  }

  const isPremium = checkIsPremium(userData);

  // Step state
  const [step, setStep] = useState<'import' | 'studio'>('import');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Extracting semantic patterns from your resume...");
  const [error, setError] = useState<string | null>(null);

  // Core Data & Visual defaults
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [styles, setStyles] = useState<EditorStyles>({
    fontFamily: 'Inter',
    primaryColor: '#4f46e5',
    fontSize: 'normal',
    spacing: 'normal',
    headingStyle: 'bold'
  });

  // Undo/Redo historical stacks
  const [resumeHistory, setResumeHistory] = useState<ResumeData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Apply/Preview modes
  const [pendingResumeData, setPendingResumeData] = useState<ResumeData | null>(null);
  const [pendingChangesSummary, setPendingChangesSummary] = useState<string[]>([]);

  // Mobile viewport toggle ('edit' = chat box, 'preview' = output canvas)
  const [mobileMode, setMobileMode] = useState<'edit' | 'preview'>('preview');

  // Chat State
  const [userMessage, setUserMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<CustomMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI Resume Architect. I have parsed your source resume structure. You can command me to do things like: 'Enhance the professional tone of my summary', 'Update my location to Seattle', or 'Format the overall styling with a modern teal accent'. Let me know what you would like to change!",
      timestamp: Date.now()
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper to commit state step to active undo timeline
  const commitResumeData = useCallback((newData: ResumeData) => {
    setResumeData(newData);
    const newHistory = resumeHistory.slice(0, historyIndex + 1);
    const updatedHistory = [...newHistory, newData];
    setResumeHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);

    // Persist draft backup in local storage
    try {
      localStorage.setItem('morph_smart_draft_simple', JSON.stringify({
        data: newData,
        styles,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn("Failed to backup local draft", e);
    }
  }, [resumeHistory, historyIndex, styles]);

  // Undo triggers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setResumeData(resumeHistory[prevIndex]);
      setPendingResumeData(null); // discards unapplied edits
    }
  }, [historyIndex, resumeHistory]);

  // Redo triggers
  const handleRedo = useCallback(() => {
    if (historyIndex < resumeHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setResumeData(resumeHistory[nextIndex]);
      setPendingResumeData(null); // discards unapplied edits
    }
  }, [historyIndex, resumeHistory]);

  // Synchronise state changes to the preview iframe
  useEffect(() => {
    if (!iframeRef.current) return;
    const iframeWindow = iframeRef.current.contentWindow;
    if (!iframeWindow) return;

    // Use preview data if pending exists, else steady-state committed data
    const activeData = pendingResumeData || resumeData;
    if (!activeData) return;

    iframeWindow.postMessage({
      type: 'SYNC_DATA',
      data: activeData,
      styles: styles
    }, '*');
  }, [resumeData, pendingResumeData, styles]);

  // Auto-scroll the chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Parse file and load resume state
  const handleParseAndLoad = async (parsedData: any) => {
    setResumeData(parsedData);
    setResumeHistory([parsedData]);
    setHistoryIndex(0);
    setStep('studio');
    window.dispatchEvent(new CustomEvent('morph-success'));
    setTimeout(() => refreshPreview(parsedData), 100);
  };

  const onDropResume = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);
    setLoadingMessage("Parsing document sections & building structural tree...");
    setError(null);
    try {
      const file = acceptedFiles[0];
      let text = '';
      let base64 = '';

      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await loadMammoth();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (file.type === 'text/plain') {
        text = await file.text();
      }

      base64 = await new Promise((res) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result as string);
        reader.readAsDataURL(file);
      });

      const parsed = await parseResumeToData({ base64, mimeType: file.type, text });
      await handleParseAndLoad(parsed);
    } catch (err: any) {
      setError(err.message || "Failed to process your file. Please double check file contents or try importing with copy-paste.");
    } finally {
      setLoading(false);
    }
  };

  const selectExistingResume = async (existingResume: any) => {
    setLoading(true);
    setLoadingMessage(`Importing "${existingResume.name}" into Smart Editor...`);
    setError(null);
    try {
      const originalText = existingResume.originalText || existingResume.html || "";
      const parsed = await parseResumeToData({ base64: "", mimeType: "text/plain", text: originalText });
      await handleParseAndLoad(parsed);
    } catch (err: any) {
      setError("Failed to transform selected resume layout. Please upload a physical file.");
    } finally {
      setLoading(false);
    }
  };

  const refreshPreview = async (overrideData?: ResumeData) => {
    const dataToUse = overrideData || pendingResumeData || resumeData;
    if (!dataToUse) return;
    setIsRefreshing(true);
    try {
      // Direct high fidelity rendering
      const result = await generateResumeFromData(
        dataToUse, 
        styles, 
        null,
        null,
        null,
        ""
      );
      setGeneratedHtml(result.html);
    } catch (err) {
      console.error("Preview render pipeline failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export & Download PDF triggers
  const downloadPdf = async () => {
    if (!iframeRef.current) return;
    const iframeWindow = iframeRef.current.contentWindow;
    if (!iframeWindow) return;

    setLoading(true);
    setLoadingMessage("Converting vector layout to standard A4 PDF pages...");
    try {
      const requestId = Date.now().toString();
      
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'CANVAS_RESPONSE' && event.data.requestId === requestId) {
          window.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            setError("PDF capture timed out. Please refresh visual layout.");
            setLoading(false);
            return;
          }

          const imgData = event.data.imgData;
          const jsPDF = await loadJsPDF();
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pageWidth = 210;
          const pageHeight = 297;
          
          const scaleOffset = event.data.width / 794;
          const pagesCount = Math.ceil(event.data.height / (1123 * scaleOffset)) || 1;
          const imgWidth = pageWidth;
          const imgHeight = pagesCount * pageHeight;
          
          for (let i = 0; i < pagesCount; i++) {
            const pos = -i * pageHeight;
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, pos, imgWidth, imgHeight, undefined, 'FAST');
          }
          
          pdf.save(`${resumeData?.personalInfo?.name || 'resume'}_smart.pdf`);
          setLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);
      iframeWindow.postMessage({ type: 'CAPTURE_CANVAS', requestId }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        if (loading) setLoading(false);
      }, 8000);

    } catch (err) {
      console.error("PDF engine crash", err);
      setError("Failed to compile pdf download.");
      setLoading(false);
    }
  };

  // Stream text typing style to look high grade and magical
  const animateBotResponse = (messageText: string, changes: string[], updatedResume: ResumeData) => {
    setIsTyping(false);
    setPendingResumeData(updatedResume);
    setPendingChangesSummary(changes && changes.length > 0 ? changes : ["Structural updates"]);

    const words = messageText.split(' ');
    const tempMsgId = Math.random().toString();
    
    setMessages(prev => [
      ...prev,
      {
        id: tempMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      }
    ]);

    let wordIdx = 0;
    const typingInterval = setInterval(() => {
      if (wordIdx < words.length) {
        const chunk = words.slice(0, wordIdx + 1).join(' ');
        setMessages(prev => prev.map(m => m.id === tempMsgId ? { ...m, content: chunk } : m));
        wordIdx++;
      } else {
        clearInterval(typingInterval);
        // Sync generated canvas view for newly proposed draft
        refreshPreview(updatedResume);
      }
    }, 35);
  };

  // Main conversational action sender
  const handleSendMessage = async (customText?: string) => {
    const rawVal = customText || userMessage;
    if (!rawVal.trim() || !resumeData) return;

    const queryMessage: CustomMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: rawVal,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, queryMessage]);
    if (!customText) setUserMessage('');
    setIsTyping(true);

    try {
      const parentDataState = pendingResumeData || resumeData;
      const historyContext = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));

      // Send to the live Gemini agent inside gemini.ts
      const response = await conversationalEdit(parentDataState, rawVal, historyContext);

      if (response.status === 'editing' || response.status === 'final') {
        const updated = response.updated_resume;
        const note = response.message || "I completed those updates in the temporary draft view!";
        const changesList = response.changes_applied || [];

        animateBotResponse(note, changesList, updated);
      } else {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            role: 'assistant',
            content: response.message || "I didn't capture that requirement fully. Could you rephrase it slightly?",
            timestamp: Date.now()
          }
        ]);
      }
    } catch (e: any) {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          content: e.message || "I ran into a problem rendering those updates. Let's try another approach!",
          timestamp: Date.now()
        }
      ]);
    }
  };

  // Commit proposed pendingChanges
  const handleConfirmChanges = () => {
    if (!pendingResumeData) return;
    const sumText = pendingChangesSummary.join(", ") || "Conversational smart updates";
    commitResumeData(pendingResumeData);
    setPendingResumeData(null);
    setPendingChangesSummary([]);

    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        role: 'assistant',
        content: `✅ Successfully committed updates: ${sumText}`,
        timestamp: Date.now()
      }
    ]);
  };

  // Revert preview draft proposal
  const handleRollbackDraft = () => {
    setPendingResumeData(null);
    setPendingChangesSummary([]);
    
    // Reset layout view to baseline
    setTimeout(() => refreshPreview(resumeData || undefined), 100);

    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        role: 'assistant',
        content: `❌ Reverted the temporary draft layout. Your changes have been discarded.`,
        timestamp: Date.now()
      }
    ]);
  };

  if (step === 'import') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 text-sans">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[450px] text-center space-y-8 py-12 saas-card bg-[var(--bg-primary)]/80 backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse-glow" />
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 flex items-center justify-center shadow-2xl animate-float">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  </div>
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-purple-500 animate-bounce" />
              </div>
              <div className="space-y-2.5 max-w-md mx-auto px-4 relative z-10">
                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight saas-gradient-text inline-block">AI Neural Semantic Extraction</h2>
                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{loadingMessage}</p>
                <div className="pt-4 flex items-center justify-center gap-2 text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Parsing structural ATS tree</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="import-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-[var(--bg-primary)]/90 backdrop-blur-xl border border-[var(--border-color)] p-6 md:p-14 shadow-xl relative overflow-hidden group"
            >
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
              <div className="text-center mb-10 relative z-10">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-200/60 dark:border-indigo-800/60 mb-4 shadow-sm select-none">
                  <Sparkles className="w-3.5 h-3.5 fill-indigo-600 dark:fill-indigo-400 animate-pulse" />
                  Interactive Smart Canvas
                </span>
                <h1 className="text-3xl md:text-6xl font-black text-[var(--text-primary)] mb-4 tracking-tighter">
                  Smart AI <span className="saas-gradient-text">Editor</span>
                </h1>
                <p className="text-[var(--text-secondary)] text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
                  Upload your resume, preview live, and instruct the assistant verbally to rewrite accomplishments, restructure sections, or update layouts.
                </p>
              </div>

              {/* Minimal Clean Single Dragzone */}
              <div className="max-w-xl mx-auto mb-8">
                <Dropzone onDrop={onDropResume} loading={loading} />
              </div>

              {/* Saved Resume History Shortcuts */}
              {userData?.resumeHistory && userData.resumeHistory.length > 0 && (
                <div className="max-w-xl mx-auto border-t border-[var(--border-color)] pt-8 mt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] text-center mb-4">
                    Or select an existing draft
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {userData.resumeHistory.map((res: any) => (
                      <button
                        key={res.id}
                        onClick={() => selectExistingResume(res)}
                        className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] hover:bg-indigo-55/15 hover:border-indigo-400 rounded-2xl border border-[var(--border-color)] transition-all group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 dark:bg-slate-900 rounded-xl text-indigo-600">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[var(--text-primary)] mb-0.5 group-hover:text-indigo-600">{res.name}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)] font-semibold">{new Date(res.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl max-w-md mx-auto flex items-center gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-semibold">{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] bg-[var(--bg-secondary)] flex flex-col overflow-hidden text-sans select-text">
      {/* Visual Top Bar Menu */}
      <div className="h-14 bg-[var(--bg-primary)] border-b border-[var(--border-color)] flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 shadow-subtle">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setStep('import')}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors text-[var(--text-secondary)] hover:text-indigo-600 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider leading-none">Back</span>
          </button>
          <div className="h-4 w-px bg-[var(--border-color)]" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)]">{resumeData?.personalInfo?.name || 'Smart Session'}</span>
          </div>
        </div>

        {/* Action controls for timeline and manual refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 text-[var(--text-secondary)] hover:text-indigo-600 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="Undo changes"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= resumeHistory.length - 1}
            className="p-1.5 text-[var(--text-secondary)] hover:text-indigo-600 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="Redo changes"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-[var(--border-color)]" />
          <button 
            onClick={() => refreshPreview()}
            disabled={isRefreshing}
            className="p-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg border border-[var(--border-color)] hover:text-indigo-600 hover:border-indigo-200 transition-all"
            title="Force visual layout refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-indigo-600")} />
          </button>
        </div>
      </div>

      {/* Main split screens container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        
        {/* Mobile quick toggler buttons */}
        <div className="md:hidden flex border-b border-[var(--border-color)] bg-[var(--bg-primary)] p-1 shrink-0 gap-1 select-none">
          <button 
            onClick={() => setMobileMode('preview')}
            className={cn(
              "flex-1 py-2 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5",
              mobileMode === 'preview' ? "bg-indigo-600 text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            Resume Preview
          </button>
          <button 
            onClick={() => setMobileMode('edit')}
            className={cn(
              "flex-1 py-2 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5",
              mobileMode === 'edit' ? "bg-indigo-600 text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            )}
          >
            <Bot className="w-3.5 h-3.5" />
            Co-Pilot Chat
          </button>
        </div>

        {/* LEFT VIEW: Full Visual Frame representation */}
        <main className={cn(
          "flex-1 bg-slate-100 dark:bg-slate-900/60 p-4 md:p-8 overflow-y-auto relative flex flex-col items-center custom-scrollbar pb-24 md:pb-8",
          mobileMode === 'edit' && "hidden md:flex"
        )}>
          {isRefreshing && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
              <div className="px-3.5 py-1.5 bg-white dark:bg-slate-900 shadow-md border border-[var(--border-color)] rounded-full flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-primary)]">Syncing Canvas...</span>
              </div>
            </div>
          )}

          <div className="w-full max-w-[800px] flex flex-col shrink-0">
            {/* Standard frame for document */}
            <div 
              className="bg-white shadow-2xl rounded-sm w-full mx-auto border border-slate-200/50 min-h-[1100px] overflow-hidden relative"
              style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)' }}
            >
              {generatedHtml ? (
                <iframe 
                  id="smart-canvas-renderer"
                  ref={iframeRef}
                  className="w-full h-[1100px] border-none"
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <script src="https://unpkg.com/lucide@latest"></script>
                        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@400;700;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
                        <style>
                          :root {
                            --primary-color: ${styles.primaryColor};
                            --font-family: '${styles.fontFamily}', sans-serif;
                            --font-size: 15px;
                            --text-main: #1e293b;
                          }
                          body { 
                            margin: 0; 
                            background-color: #f1f5f9;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            min-height: 100vh;
                            box-sizing: border-box;
                            padding: 24px 0;
                          }
                          .page { 
                            background: white;
                            width: 794px;
                            min-height: 1123px;
                            padding: 24px 32px;
                            box-sizing: border-box;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
                            border-radius: 2px;
                            border: 1px solid #e2e8f0;
                          }
                          #canvas-root {
                            width: 794px;
                            margin: 0 auto;
                          }
                          .watermark {
                            text-align: center;
                            font-size: 10px;
                            color: #94a3b8;
                            margin-top: 30px;
                            border-top: 1px solid #e2e8f0;
                            padding-top: 15px;
                          }
                        </style>
                      </head>
                      <body>
                        <div id="canvas-root">
                          ${generatedHtml}
                          ${!isPremium ? `
                            <div class="watermark">
                              Rendered by <a href="#" style="color: #4f46e5; text-decoration: none; font-weight: 700;">Resume Morph</a>
                            </div>
                          ` : ''}
                        </div>
                      </body>
                    </html>
                  `}
                />
              ) : (
                <div className="w-full h-[1100px] flex flex-col items-center justify-center gap-3 bg-white">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Building layout sandboxes...</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT VIEW: Clean modern Co-pilot panel */}
        <aside className={cn(
          "w-full md:w-[420px] bg-[var(--bg-primary)] border-t md:border-t-0 md:border-l border-[var(--border-color)] flex flex-col shrink-0 z-20 overflow-hidden",
          mobileMode === 'preview' && "hidden md:flex"
        )}>
          {/* Messages desk feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--bg-secondary)]/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2.5 max-w-[85%] animate-fadeIn",
                  m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 self-start border",
                  m.role === 'user' 
                    ? "bg-indigo-600 border-indigo-600 text-white" 
                    : "bg-[var(--bg-primary)] border-[var(--border-color)] text-indigo-600"
                )}>
                  {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 animate-pulse" />}
                </div>
                <div className={cn(
                  "p-3.5 rounded-2xl text-xs leading-normal font-medium shadow-sm transition-all",
                  m.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-none whitespace-pre-wrap"
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2.5 mr-auto">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center shadow-sm">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Conditional proposal banner (Apply or Rollback) */}
          <AnimatePresence>
            {pendingResumeData && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 border-t border-indigo-100 bg-indigo-50/95 dark:bg-indigo-950/20 shrink-0"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-indigo-800 dark:text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <p className="text-[11px] font-black uppercase tracking-wider">Review proposed changes</p>
                  </div>
                  {pendingChangesSummary.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                      {pendingChangesSummary.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-indigo-200/55 rounded text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={handleConfirmChanges}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                    >
                      Apply Edits
                    </button>
                    <button
                      onClick={handleRollbackDraft}
                      className="flex-1 py-2 bg-white dark:bg-slate-950 border border-indigo-200 text-indigo-700 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prompt sender & sugestions container */}
          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)] space-y-3 shrink-0">
            {/* Quick Suggestions Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
              <button
                onClick={() => handleSendMessage("Improve spelling, style grammar, and increase corporate vocabulary")}
                disabled={isTyping || !!pendingResumeData}
                className="px-3 py-1 bg-[var(--bg-secondary)] hover:bg-indigo-50 border border-[var(--border-color)] rounded-full text-[10px] font-bold text-[var(--text-secondary)] hover:text-indigo-600 whitespace-nowrap transition-all"
              >
                👔 Professional Redish
              </button>
              <button
                onClick={() => handleSendMessage("Restructure my professional experience summary to be shorter and result-driven")}
                disabled={isTyping || !!pendingResumeData}
                className="px-3 py-1 bg-[var(--bg-secondary)] hover:bg-indigo-50 border border-[var(--border-color)] rounded-full text-[10px] font-bold text-[var(--text-secondary)] hover:text-indigo-600 whitespace-nowrap transition-all"
              >
                ✂️ Shorten Summary
              </button>
              <button
                onClick={() => handleSendMessage("Highlight technical skills using bold indicators or modern coloring")}
                disabled={isTyping || !!pendingResumeData}
                className="px-3 py-1 bg-[var(--bg-secondary)] hover:bg-indigo-50 border border-[var(--border-color)] rounded-full text-[10px] font-bold text-[var(--text-secondary)] hover:text-indigo-600 whitespace-nowrap transition-all"
              >
                ⚡ Color Accent
              </button>
            </div>

            {/* Input form */}
            <div className="relative">
              <textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                disabled={isTyping || !!pendingResumeData}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  pendingResumeData 
                    ? "Apply or Discard changes above..." 
                    : "Describe edits (e.g., 'Change my title', 'Add certifications')"
                }
                className={cn(
                  "w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 pr-12 text-xs font-semibold leading-relaxed transition-all resize-none outline-none text-[var(--text-primary)] placeholder-gray-400",
                  pendingResumeData ? "opacity-50 cursor-not-allowed" : "focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                )}
                rows={2}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!userMessage.trim() || isTyping || !!pendingResumeData}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-705 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Floating unified primary actions footer footer bar */}
      <AnimatePresence>
        {!loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-6 left-6 z-[120] flex gap-2"
          >
            <button 
              onClick={downloadPdf}
              disabled={loading}
              className="px-4.5 h-11 rounded-full bg-slate-900 dark:bg-indigo-650 hover:bg-slate-800 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 gap-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              title="Download print optimized version"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('morph-success'));
              }}
              className="px-4.5 h-11 rounded-full bg-white text-slate-800 border border-slate-200/80 flex items-center justify-center shadow-xl hover:bg-slate-55 hover:scale-105 active:scale-95 gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Check className="w-3.5 h-3.5 text-green-600" />
              Save Layout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Minimal Dropzone Component
function Dropzone({ onDrop, loading }: { onDrop: (files: File[]) => void, loading: boolean }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave" || e.type === "drop") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onDrop(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onDrop(Array.from(e.target.files));
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      className={cn(
        "relative cursor-pointer transition-all duration-300 h-44 rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-3 border-2 border-dashed",
        isDragActive 
          ? "border-indigo-600 bg-indigo-50/20 scale-[1.01]" 
          : "border-[var(--border-color)] hover:border-indigo-400 hover:bg-indigo-55/5",
      )}
    >
      <input 
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt"
        onChange={handleChange}
      />
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
        isDragActive ? "bg-indigo-600 text-white scale-105" : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600"
      )}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
      </div>
      <div>
        <p className="text-sm font-black text-[var(--text-primary)] leading-none mb-1">Click or Drop your Resume</p>
        <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Supports PDF, DOCX, TXT</p>
      </div>
    </div>
  );
}

export default memo(SmartEditor);
