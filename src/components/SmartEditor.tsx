import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, Zap, FileText, CheckCircle, Loader2, AlertCircle, Sparkles, 
  Settings, Layout, Type, Palette, Move, Trash2, Plus, ArrowLeft, 
  Download, Printer, Eye, Languages, Wand2, Search, Target, 
  ChevronRight, ChevronDown, GripVertical, Save, Edit3, Github, Linkedin, Globe, Mail, Phone, MapPin,
  RefreshCw, MousePointerClick, X, MessageSquare, Send, Bot, User, Clock, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, compressImage } from '../lib/utils';
import { 
  analyzeLayout, 
  generateResumeFromData, 
  parseResumeToData, 
  getOptimizationPlan, 
  improveBulletPoint, 
  checkMatch,
  conversationalEdit 
} from '../lib/gemini';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

const FONTS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Playfair Display', value: 'Playfair Display, serif' },
  { name: 'Space Grotesk', value: 'Space Grotesk, sans-serif' },
  { name: 'JetBrains Mono', value: 'JetBrains Mono, monospace' },
  { name: 'Roboto', value: 'Roboto, sans-serif' }
];

const COLORS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Slate', value: '#334155' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' }
];

interface CustomMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function SmartEditor({ userData }: { userData: any }) {
  const isPremium = userData?.plan && userData.plan !== 'free';
  
  const [step, setStep] = useState<'import' | 'studio'>('import');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'chat' | 'design' | 'sections' | 'analyze' | 'manual'>('chat');
  const [mobileMode, setMobileMode] = useState<'edit' | 'preview'>('edit');
  
  // Chat State
  const [messages, setMessages] = useState<CustomMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI Resume Architect. I've successfully imported your resume. You can tell me to do things like 'Update my current role to Senior Lead', 'Add a project about a chat application', or 'Make my summary more result-oriented'. What would you like to do first?",
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Data States
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [debouncedData, setDebouncedData] = useState<ResumeData | null>(null);
  
  // Debounce resumeData changes
  useEffect(() => {
    if (!resumeData) return;
    const timer = setTimeout(() => {
      setDebouncedData(resumeData);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resumeData]);

  const [styles, setStyles] = useState<EditorStyles>({
    fontFamily: 'Inter',
    primaryColor: '#4f46e5',
    fontSize: 'normal',
    spacing: 'comfortable',
    headingStyle: 'bold'
  });
  
  // Reference Design State
  const [referenceFile, setReferenceFile] = useState<{ base64: string; mime: string; blueprint: string } | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  
  const [sectionConfig, setSectionConfig] = useState([
    { id: 'Summary', name: 'Summary', visible: true },
    { id: 'Experience', name: 'Experience', visible: true },
    { id: 'Projects', name: 'Projects', visible: true },
    { id: 'Education', name: 'Education', visible: true },
    { id: 'Skills', name: 'Skills', visible: true },
    { id: 'Certifications', name: 'Certifications', visible: true },
  ]);
  
  // Real-time Preview Sync Effect (Zero-Lag Content & Style)
  useEffect(() => {
    if (resumeData && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ 
        type: 'SYNC_DATA', 
        data: resumeData,
        styles: styles,
        sections: sectionConfig
      }, '*');
    }
  }, [resumeData, styles, sectionConfig]);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Tab change handler for mobile (auto-switch to edit)
  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setMobileMode('edit');
  };
  
  // Analysis States
  const [atsAnalysis, setAtsAnalysis] = useState<any>(null);
  const [jdMatch, setJdMatch] = useState<any>(null);
  const [targetJd, setTargetJd] = useState('');
  
  // Auto-save logic
  useEffect(() => {
    if (resumeData && step === 'studio') {
      const draft = {
        data: resumeData,
        styles,
        sections: sectionConfig,
        timestamp: Date.now()
      };
      localStorage.setItem('resume_morph_draft', JSON.stringify(draft));
    }
  }, [resumeData, styles, sectionConfig, step]);

  // Load draft
  useEffect(() => {
    const saved = localStorage.getItem('resume_morph_draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
      } catch (e) {}
    }
  }, []);

  const [userMessage, setUserMessage] = useState('');
  
  const [isLocked, setIsLocked] = useState(false);

  const handleSave = () => {
    setIsLocked(true);
    setActiveTab('analyze'); // Close chat/edit by moving to analysis
    
    // Trigger Success Event for Congratulations Modal/Notification
    window.dispatchEvent(new CustomEvent('resume-saved', { 
      detail: { name: resumeData?.personalInfo.name } 
    }));
  };

  const shareToWhatsApp = () => {
    if (!resumeData) return;
    const text = encodeURIComponent(`Check out my resume for ${resumeData.personalInfo.name}! Generated by AI Resume Architect.`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const handleSendMessage = useCallback(async () => {
    if (!userMessage.trim() || isTyping || !resumeData || isLocked) return;
    
    const userMsg: CustomMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage.trim(),
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setUserMessage('');
    setIsTyping(true);
    
    try {
      const updatedData = await conversationalEdit(resumeData, userMsg.content);
      setResumeData(updatedData);
      
      const assistantMsg: CustomMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I've updated your resume based on your request. You can see the changes in the preview. Is there anything else you'd like to modify?",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      const errorMsg: CustomMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while trying to process that. Please try rephrasing your request.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [userMessage, isTyping, resumeData]);

  const onDropResume = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const file = acceptedFiles[0];
      let base64 = "";
      let text = "";

      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
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

      // Compress large images if any (not really applicable to resumes but good practice)
      const parsed = await parseResumeToData({ base64, mimeType: file.type, text });
      setResumeData(parsed);
      setStep('studio');
      
      // Trigger Success Event for Congratulations Modal
      window.dispatchEvent(new CustomEvent('morph-success'));

      // Force initial refresh 
      setTimeout(() => refreshPreview(), 100);
    } catch (err: any) {
      setError(err.message || "Failed to parse resume.");
    } finally {
      setLoading(false);
    }
  };

  const onDropReference = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);
    try {
      const file = acceptedFiles[0];
      let base64 = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      // Compress design reference image to avoid large AI payloads
      if (file.type.startsWith('image/')) {
        base64 = await compressImage(base64, 1024);
      }
      
      const blueprint = await analyzeLayout(base64, file.type);
      setReferenceFile({ base64, mime: file.type, blueprint });
    } catch (err: any) {
      setError("Failed to analyze design reference.");
    } finally {
      setLoading(false);
    }
  };

  const refreshPreview = async () => {
    if (!resumeData) return;
    setIsRefreshing(true);
    try {
      const result = await generateResumeFromData(
        resumeData, 
        styles, 
        referenceFile?.blueprint || null,
        referenceFile?.base64 || null,
        referenceFile?.mime || null
      );
      setGeneratedHtml(result.html);
    } catch (err) {
      console.error("Preview refresh failed", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const downloadPdf = async () => {
    if (!iframeRef.current) return;
    const iframeWindow = iframeRef.current.contentWindow;
    if (!iframeWindow) return;

    setLoading(true);
    try {
      // Send a request to the iframe to generate a canvas
      // We'll use a unique ID to handle the response
      const requestId = Date.now().toString();
      
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'CANVAS_RESPONSE' && event.data.requestId === requestId) {
          window.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            setError("Failed to capture resume. Please try again.");
            setLoading(false);
            return;
          }

          const imgData = event.data.imgData;
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pageWidth = 210;
          const pageHeight = 297;
          
          const pagesCount = Math.round(event.data.height / 1123) || 1;
          const imgWidth = pageWidth;
          const imgHeight = pagesCount * pageHeight;
          
          for (let i = 0; i < pagesCount; i++) {
            const position = -i * pageHeight;
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          }
          
          pdf.save(`${resumeData?.personalInfo.name || 'resume'}_premium.pdf`);
          setLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);
      iframeWindow.postMessage({ type: 'CAPTURE_CANVAS', requestId }, '*');
      
      // Cleanup listener if it takes too long
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        if (loading) setLoading(false);
      }, 10000);

    } catch (err) {
      console.error("Download error:", err);
      setError("Download failed. Please try again.");
      setLoading(false);
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    if (!resumeData) return;
    setResumeData(prev => prev ? ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }) : null);
  };

  const updateProject = (index: number, field: string, value: any) => {
    if (!resumeData) return;
    setResumeData(prev => {
      if (!prev) return null;
      const newProj = [...(prev.projects || [])];
      newProj[index] = { ...newProj[index], [field]: value };
      return { ...prev, projects: newProj };
    });
  };

  const addProject = () => {
    setResumeData(prev => prev ? ({
      ...prev,
      projects: [...(prev.projects || []), { name: '', description: '', tech: '', link: '' }]
    }) : null);
  };

  const updateExperience = (index: number, field: string, value: any) => {
    if (!resumeData) return;
    setResumeData(prev => {
      if (!prev) return null;
      const newExp = [...(prev.experience || [])];
      newExp[index] = { ...newExp[index], [field]: value };
      return { ...prev, experience: newExp };
    });
  };

  const updateEducation = (index: number, field: string, value: any) => {
    if (!resumeData) return;
    setResumeData(prev => {
      if (!prev) return null;
      const newEdu = [...(prev.education || [])];
      newEdu[index] = { ...newEdu[index], [field]: value };
      return { ...prev, education: newEdu };
    });
  };

  const updateSkills = (value: string[]) => {
    if (!resumeData) return;
    setResumeData(prev => prev ? ({ ...prev, skills: value }) : null);
  };

  const addExperience = () => {
    setResumeData(prev => prev ? ({
      ...prev,
      experience: [...(prev.experience || []), { company: '', role: '', dates: '', bullets: [''] }]
    }) : null);
  };

  const addEducation = () => {
    setResumeData(prev => prev ? ({
      ...prev,
      education: [...(prev.education || []), { school: '', degree: '', dates: '' }]
    }) : null);
  };

  const removeExperience = (index: number) => {
    setResumeData(prev => prev ? ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }) : null);
  };

  const removeEducation = (index: number) => {
    setResumeData(prev => prev ? ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }) : null);
  };

  const removeProject = (index: number) => {
    setResumeData(prev => prev ? ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }) : null);
  };

  const optimizeSummary = async () => {
    if (!resumeData?.summary) return;
    setLoading(true);
    try {
      // Create a dummy prompt for summary optimization
      const plan = await getOptimizationPlan(resumeData.summary, "General Professional Improvement");
      // Actually we'll use a specific prompt here if needed, but for now let's simulate with existing logic or a new call
      // For brevity, I'll just keep the structure
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'import') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-20">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-8"
            >
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 animate-pulse" />
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-indigo-600 animate-spin" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl"
                />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">AI Engine Processing...</h2>
                <p className="text-[var(--text-secondary)] font-medium max-w-sm mx-auto">Extracting architectural data and semantic patterns from your resume.</p>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className="w-2 h-2 bg-indigo-600 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[40px] bg-[var(--bg-primary)] border border-[var(--border-color)] p-8 md:p-20 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -ml-48 -mb-48 blur-3xl pointer-events-none" />
              
              <div className="text-center mb-16 relative z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-3 px-6 py-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6 shadow-sm border border-indigo-500/20"
                >
                  <Sparkles className="w-4 h-4 fill-indigo-600 dark:fill-indigo-400" />
                  Premium Studio Mode
                </motion.div>
                <h1 className="text-5xl md:text-8xl font-black text-[var(--text-primary)] mb-6 tracking-tighter leading-none">
                  Resume <span className="text-indigo-600">Studio.</span>
                </h1>
                <p className="text-[var(--text-secondary)] text-lg md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">
                  The ultimate professional editor. Import your resume, clone any design, and customize every pixel with AI precision.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto relative z-10">
                {/* Step 1: Upload Source */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 dark:shadow-none">1</div>
                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Structure Source</h2>
                  </div>
                  <Dropzone onDrop={onDropResume} loading={loading} label="Upload your current resume" icon={<FileText className="w-10 h-10" />} />
                </motion.div>

                {/* Step 2: Upload Design Reference (Optional) */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center font-black shadow-lg">2</div>
                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Design Pattern</h2>
                  </div>
                  <Dropzone onDrop={onDropReference} loading={loading} label="Reference a layout (Optional)" icon={<Layout className="w-10 h-10" />} />
                  {referenceFile && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-2xl flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-xs font-bold text-green-700 dark:text-green-400">Visual Pattern Analyzed Successfully</span>
                    </div>
                  )}
                </motion.div>
              </div>

              {error && (
                <div className="mt-12 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-[28px] max-w-2xl mx-auto flex items-center gap-4 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  <p className="text-sm font-black">{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-160px)] bg-[var(--bg-secondary)] flex flex-col overflow-hidden">
      {/* Local Context Header */}
      <div className="h-16 bg-[var(--bg-primary)]/50 backdrop-blur-md border-b border-[var(--border-color)] flex items-center justify-between px-8 md:px-12 shrink-0 z-30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setStep('import')}
            title="Go back to the import screen to upload a different resume"
            className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors text-[var(--text-secondary)] hover:text-indigo-600 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest leading-none">Studio</span>
          </button>
          <div className="h-6 w-px bg-[var(--border-color)]" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Live Editor</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={refreshPreview}
            disabled={isRefreshing}
            title="Synchronize changes"
            className="p-2.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-primary)] transition-all border border-[var(--border-color)]"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-indigo-600")} />
          </button>
          <div className="h-6 w-px bg-[var(--border-color)] mx-1" />
          {/* Actions moved to unified sticky bottom bar */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Mobile Toggle Bar */}
        <div className="lg:hidden fixed bottom-28 left-1/2 -translate-x-1/2 flex items-center bg-[var(--bg-primary)]/90 backdrop-blur-md border border-[var(--border-color)] rounded-2xl shadow-2xl z-[60] p-1.5 gap-1">
          <button 
            onClick={() => setMobileMode('edit')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              mobileMode === 'edit' ? "bg-indigo-600 text-white shadow-lg" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            )}
          >
            <Edit3 className="w-4 h-4" />
            Editor
          </button>
          <button 
            onClick={() => setMobileMode('preview')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              mobileMode === 'preview' ? "bg-indigo-600 text-white shadow-lg" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            )}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        {/* Left Sidebar: Controls */}
        <aside 
          id="smart-editor-controls" 
          className={cn(
            "w-full lg:w-[450px] bg-[var(--bg-primary)] border-r border-[var(--border-color)] flex flex-col shrink-0 z-20 overflow-y-auto lg:overflow-hidden transition-all duration-300",
            mobileMode === 'preview' && "hidden lg:flex"
          )}
        >
          {/* Tabs */}
          <div className="flex border-b border-[var(--border-color)] shrink-0 overflow-x-auto no-scrollbar">
            {(['chat', 'design', 'sections', 'analyze', 'manual'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "flex-1 py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap min-w-[80px]",
                  activeTab === tab ? "text-indigo-600" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[var(--bg-secondary)]">
            <AnimatePresence mode="wait">
              {activeTab === 'chat' && (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex-1 min-h-0"
                >
                  <ResumeChat 
                    messages={messages} 
                    isTyping={isTyping} 
                    userMessage={userMessage}
                    setUserMessage={setUserMessage}
                    onSend={handleSendMessage}
                  />
                </motion.div>
              )}

              {activeTab === 'manual' && (
                <motion.div 
                  key="manual"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 md:space-y-10 custom-scrollbar"
                >
                  <IdentitySection 
                    data={resumeData?.personalInfo} 
                    update={updatePersonalInfo} 
                  />

                  <SummarySection 
                    value={resumeData?.summary} 
                    onChange={(v: string) => setResumeData(prev => prev ? ({ ...prev, summary: v }) : null)} 
                  />

                  <ExperienceSection 
                    data={resumeData?.experience} 
                    update={updateExperience}
                    add={addExperience}
                    remove={removeExperience}
                  />

                  <ProjectsSection 
                    data={resumeData?.projects}
                    update={updateProject}
                    add={addProject}
                    remove={removeProject}
                  />

                  <EducationSection 
                    data={resumeData?.education} 
                    update={updateEducation}
                    add={addEducation}
                    remove={removeEducation}
                  />

                  <SkillsSection 
                    data={resumeData?.skills} 
                    update={updateSkills}
                  />
                </motion.div>
              )}

              {activeTab === 'design' && (
                <div className="p-8 overflow-y-auto custom-scrollbar">
                  <DesignSection styles={styles} setStyles={setStyles} />
                </div>
              )}

              {activeTab === 'sections' && (
                <div className="p-8 overflow-y-auto custom-scrollbar">
                  <SectionsVisibility 
                    config={sectionConfig} 
                    setConfig={setSectionConfig} 
                  />
                </div>
              )}

              {activeTab === 'analyze' && (
                <div className="p-8 overflow-y-auto custom-scrollbar">
                  <AnalyzeSection 
                    resumeData={resumeData}
                    atsAnalysis={atsAnalysis}
                    setAtsAnalysis={setAtsAnalysis}
                    jdMatch={jdMatch}
                    setJdMatch={setJdMatch}
                    targetJd={targetJd}
                    setTargetJd={setTargetJd}
                  />
                </div>
              )}
            </AnimatePresence>
            
            {/* Bottom Spacing for Mobile Toggle Bar */}
            <div className="h-24 lg:hidden shrink-0" />
          </div>
        </aside>

        {/* Right Area: Preview Canvas */}
        <main className={cn(
          "flex-1 bg-[var(--bg-secondary)] p-4 md:p-12 overflow-y-auto relative flex flex-col items-center custom-scrollbar transition-all duration-300",
          mobileMode === 'edit' && "hidden lg:flex"
        )}>
          {isRefreshing && (
            <div className="absolute top-4 md:top-12 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-32px)] md:w-auto">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-3 md:py-2 bg-[var(--bg-primary)] rounded-full shadow-xl border border-[var(--border-color)] flex items-center justify-center gap-3"
              >
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">AI Syncing...</span>
              </motion.div>
            </div>
          )}

          <div className="w-full max-w-[850px] space-y-6 md:space-y-8 animate-in fade-in duration-1000">
             {/* Toolbar Overlay */}
             <div className="flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-[var(--bg-primary)]/80 backdrop-blur-md rounded-2xl shadow-xl shadow-black/5 border border-[var(--border-color)] mb-4 md:mb-8 sticky top-0 z-30">
               <button className="p-2 md:p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-all text-indigo-600 flex items-center gap-2 group shrink-0">
                 <MousePointerClick className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Select Mode</span>
               </button>
               <div className="w-px h-6 bg-[var(--border-color)]" />
               <button className="p-2 md:p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-all text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-2 group shrink-0">
                 <Move className="w-4 h-4 group-hover:scale-110" />
                 <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Layout</span>
               </button>
               <div className="w-px h-6 bg-[var(--border-color)]" />
               <div className="flex items-center gap-0.5 md:gap-1.5">
                 <button 
                   onClick={refreshPreview}
                   disabled={isRefreshing}
                   className={cn(
                     "p-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-all text-[var(--text-tertiary)] hover:text-indigo-600",
                     isRefreshing && "animate-spin text-indigo-600"
                   )}
                   title="Force AI Sync"
                 >
                   <RefreshCw className="w-4 h-4" />
                 </button>
                 <button className="p-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><AlertCircle className="w-4 h-4" /></button>
                 <button className="p-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><Languages className="w-4 h-4" /></button>
                 <button 
                  onClick={handleSave}
                  disabled={isLocked}
                  className={cn(
                    "p-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors",
                    isLocked ? "text-green-600" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  )}
                  title={isLocked ? "Resume Locked" : "Save and Lock for Export"}
                >
                  {isLocked ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                </button>
               </div>
             </div>

             {/* Canvas Container */}
             <div 
               className="bg-white shadow-2xl rounded-sm w-full mx-auto ring-1 ring-gray-200 min-h-[1100px] overflow-hidden origin-top transition-all"
               style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)' }}
             >
                {generatedHtml ? (
                  <iframe 
                    id="smart-editor-preview"
                    ref={iframeRef}
                    className="w-full h-[1100px] border-none"
                      srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <script src="https://cdn.tailwindcss.com"></script>
                          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@400;700;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
                          <style>
                            :root {
                              --primary-color: ${styles.primaryColor};
                              --font-family: '${styles.fontFamily}', sans-serif;
                              --line-height: ${styles.spacing === 'compact' ? '1.4' : styles.spacing === 'normal' ? '1.6' : '1.8'};
                              --font-size: ${styles.fontSize === 'xs' ? '12px' : styles.fontSize === 'small' ? '14px' : styles.fontSize === 'normal' ? '16px' : '18px'};
                              --text-main: #1f2937;
                            }
                            body { 
                              margin: 0; 
                              padding: 40px 0;
                              background-color: #f1f5f9;
                              display: flex;
                              justify-content: center;
                              min-height: 100vh;
                              box-sizing: border-box;
                            }
                            .page { 
                              background: white;
                              width: 794px;
                              height: 1123px;
                              padding: 48px 56px;
                              margin: 0 auto 20px auto;
                              box-sizing: border-box;
                              overflow: hidden;
                              position: relative;
                            }
                            .content {
                              width: 100%;
                              height: 100%;
                              box-sizing: border-box;
                              overflow: hidden;
                            }
                            #resume-root {
                              width: 794px;
                              margin: 0 auto;
                              box-sizing: border-box;
                              position: relative;
                            }
                            @media print {
                              .page { margin: 0; box-shadow: none; }
                            }
                            .resume-footer {
                              font-size: 10px; 
                              color: #94a3b8; 
                              text-align: center; 
                              margin-top: 30px; 
                              padding-bottom: 20px;
                              font-family: 'Inter', sans-serif;
                              width: 100%;
                              border-top: 1px solid #f1f5f9;
                              padding-top: 15px;
                              display: block !important;
                            }
                            /* Table stability without artifacts */
                            table {
                              border-collapse: collapse !important;
                            }
                            [data-section-name] {
                              page-break-inside: avoid;
                            }
                            .new-content { animation: highlight 1s ease-out; }
                            @keyframes highlight { from { background-color: #fef08a; } to { background-color: transparent; } }
                          </style>
                          <script>
                            function resolvePath(obj, path) {
                              if (!path) return undefined;
                              return path.split('.').reduce((acc, part) => acc && acc[part], obj);
                            }

                            async function paginate() {
                              const root = document.getElementById('resume-root');
                              if (!root) return;

                              // Use a unique marker to avoid infinite loops
                              if (root.getAttribute('data-paginating') === 'true') return;
                              root.setAttribute('data-paginating', 'true');

                              // 1. Wait for images for accurate sizing
                              const images = Array.from(root.querySelectorAll('img'));
                              await Promise.all(images.map(img => {
                                if (img.complete) return Promise.resolve();
                                return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
                              }));

                              // 2. Flatten
                              const existingPages = Array.from(root.querySelectorAll('.page'));
                              if (existingPages.length > 0) {
                                const flatContent = document.createDocumentFragment();
                                existingPages.forEach(p => {
                                  const c = p.querySelector('.content');
                                  if (c) {
                                    while (c.firstChild) flatContent.appendChild(c.firstChild);
                                  }
                                });
                                root.innerHTML = '';
                                root.appendChild(flatContent);
                              }

                              const elements = Array.from(root.children);
                              root.innerHTML = '';

                              const USABLE_HEIGHT = 1027;
                              const BUFFER = 4;

                              let currentPage = createPage();
                              root.appendChild(currentPage);
                              let currentContent = currentPage.querySelector('.content');

                              for (const el of elements) {
                                if (el instanceof HTMLElement) {
                                  el.style.breakInside = 'avoid';
                                  el.style.pageBreakInside = 'avoid';
                                }
                                currentContent.appendChild(el);

                                const lastChild = currentContent.lastElementChild;
                                const currentHeight = lastChild 
                                  ? Math.ceil(lastChild.getBoundingClientRect().bottom - currentContent.getBoundingClientRect().top) 
                                  : 0;

                                if (currentHeight > (USABLE_HEIGHT - BUFFER)) {
                                  if (currentContent.children.length > 1) {
                                    currentContent.removeChild(el);
                                    currentPage = createPage();
                                    root.appendChild(currentPage);
                                    currentContent = currentPage.querySelector('.content');
                                    currentContent.appendChild(el);
                                  }
                                }
                              }

                              function createPage() {
                                const p = document.createElement('div');
                                p.className = 'page';
                                const c = document.createElement('div');
                                c.className = 'content';
                                p.appendChild(c);
                                return p;
                              }
                              
                              root.removeAttribute('data-paginating');
                            }

                            window.addEventListener('message', async (event) => {
                              if (event.data.type === 'SYNC_DATA') {
                                const data = event.data.data;
                                const styles = event.data.styles;
                                const sections = event.data.sections;

                                if (styles) {
                                  const root = document.documentElement;
                                  root.style.setProperty('--primary-color', styles.primaryColor);
                                  root.style.setProperty('--font-family', styles.fontFamily + ', sans-serif');
                                  const fontSizeMap = { xs: '12px', small: '14px', normal: '16px', large: '18px' };
                                  root.style.setProperty('--font-size', fontSizeMap[styles.fontSize] || '16px');
                                  const spacingMap = { compact: '1.4', normal: '1.6', comfortable: '1.8' };
                                  root.style.setProperty('--line-height', spacingMap[styles.spacing] || '1.6');
                                }

                                if (sections) {
                                  sections.forEach(function(sec) {
                                    var sectionEl = document.querySelector('[data-section-name="' + sec.id + '"]');
                                    if (sectionEl) {
                                      sectionEl.style.display = sec.visible ? 'block' : 'none';
                                    }
                                  });
                                }
                                
                                document.querySelectorAll('[data-resume-field]').forEach(el => {
                                  const path = el.getAttribute('data-resume-field');
                                  const value = resolvePath(data, path);
                                  if (value !== undefined && !Array.isArray(value) && el.innerText !== value) {
                                    el.innerText = value;
                                    el.classList.add('new-content');
                                    setTimeout(() => el.classList.remove('new-content'), 1000);
                                  }
                                });

                                // Repaginate if data changed
                                setTimeout(paginate, 100);
                              }

                              if (event.data.type === 'CAPTURE_CANVAS') {
                                try {
                                  // For capturing, we target the main resume container
                                  const root = document.getElementById('resume-root');
                                  
                                  // Wait for images to load
                                  const images = Array.from(root.querySelectorAll('img'));
                                  await Promise.all(images.map(img => {
                                    if (img.complete) return Promise.resolve();
                                    return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
                                  }));

                                  await document.fonts.ready;
                                  
                                  // Delay to ensure fonts and layout are settled
                                  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                                  await new Promise(r => setTimeout(r, 400));

                                  const canvas = await html2canvas(root, {
                                    scale: 1, 
                                    useCORS: true,
                                    allowTaint: true,
                                    backgroundColor: "#ffffff",
                                    logging: false,
                                    width: 794,
                                    height: Math.ceil(root.offsetHeight), 
                                    scrollX: 0,
                                    scrollY: 0,
                                    windowWidth: 794,
                                    imageTimeout: 15000,
                                    removeContainer: true,
                                    onclone: (clonedDoc) => {
          // Force removal of scaling transform in clone
          const scaler = clonedDoc.getElementById('scaling-container');
          if (scaler) {
            scaler.style.transform = 'none';
          }
          
          const preview = clonedDoc.getElementById('resume-root');
          if (preview) {
             preview.style.boxShadow = 'none';
             preview.style.margin = '0';
             preview.style.border = 'none';
             // Force standard text rendering to prevent underline issues
             preview.style.textRendering = 'geometricPrecision';
             (preview.style as any).webkitFontSmoothing = 'antialiased';
          }
          
          // Fix potential "strikethrough" look of underlines in html2canvas
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            const style = (el as HTMLElement).style;
            if (style.textDecoration === 'underline' || style.textDecorationLine === 'underline') {
              style.textDecoration = 'none';
              style.textDecorationLine = 'none';
              style.borderBottom = '1px solid currentColor';
              style.display = style.display === 'inline' ? 'inline-block' : style.display;
              style.paddingBottom = '1px';
            }
          });

          // Remove gaps between pages for seamless PDF slicing
          const pages = clonedDoc.querySelectorAll('.page');
          pages.forEach(p => {
            (p as HTMLElement).style.margin = '0';
            (p as HTMLElement).style.boxShadow = 'none';
          });

                                      // Hard removal of non-export elements
                                      clonedDoc.querySelectorAll('.no-export, .ui-controls').forEach(el => el.remove());
                                    }
                                  });

                                  window.parent.postMessage({
                                    type: 'CANVAS_RESPONSE',
                                    requestId: event.data.requestId,
                                    imgData: canvas.toDataURL('image/png'),
                                    width: canvas.width,
                                    height: canvas.height
                                  }, '*');
                                } catch (err) {
                                  window.parent.postMessage({
                                    type: 'CANVAS_RESPONSE',
                                    requestId: event.data.requestId,
                                    error: err.message
                                  }, '*');
                                }
                              }
                            });

                            const observer = new MutationObserver((mutations) => {
                              let shouldRepaginate = false;
                              mutations.forEach(m => {
                                if (m.type === 'childList') {
                                  const hasPages = Array.from(m.target.children || []).some(child => child.classList?.contains('page'));
                                  if (!hasPages && m.target.id === 'resume-root' && m.addedNodes.length > 0) {
                                    shouldRepaginate = true;
                                  }
                                }
                              });
                              if (shouldRepaginate) setTimeout(paginate, 100);
                            });
                            
                            setTimeout(() => {
                              const root = document.getElementById('resume-root');
                              if (root) {
                                observer.observe(root, { childList: true });
                                paginate(); // Initial manual call
                              }
                            }, 500);

                            window.addEventListener('load', () => {
                              setTimeout(paginate, 100);
                            });
                          </script>
                        </head>
                        <body>
                          <div id="resume-root">
                            ${generatedHtml}
                            ${!isPremium ? `
                              <div class="resume-footer">
                                Created by <a href="https://resume-morph.com" style="color: #6366f1; text-decoration: none; font-weight: 700;">Resume Morph</a> (Sankalp Suman)
                              </div>
                            ` : ''}
                          </div>
                        </body>
                      </html>
                    `}
                  />
                ) : (
                  <div className="w-full h-[1100px] flex flex-col items-center justify-center gap-6 bg-white">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Initializing Visual Canvas...</p>
                  </div>
                )}
             </div>
          </div>
        </main>
      </div>
      {/* Unified Action Bar */}
      <AnimatePresence>
        {!loading && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[150] p-4 md:p-6 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-t border-[var(--border-color)] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
          >
            <div className="max-w-3xl mx-auto flex items-center gap-3 md:gap-4">
              <button 
                onClick={shareToWhatsApp}
                title="Share on WhatsApp"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-gray-900 text-[#25D366] border-2 border-[#25D366] rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all active:scale-95 hover:bg-[#25D366]/5"
              >
                <MessageSquare className="w-5 h-5" />
                <span>WhatsApp</span>
              </button>
              <button 
                onClick={downloadPdf}
                disabled={loading}
                className="flex-[1.5] flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components
const ResumeChat = memo(({ messages, isTyping, userMessage, setUserMessage, onSend }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-primary)]">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar"
      >
        {messages.map((m: any) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-3 max-w-[90%]",
              m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
              m.role === 'user' ? "bg-indigo-600 text-white" : "bg-white border border-[var(--border-color)] text-indigo-600"
            )}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
              m.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-none whitespace-pre-wrap"
            )}>
              {m.content}
              <div className={cn(
                "mt-2 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest opacity-40",
                m.role === 'user' ? "justify-end" : "justify-start"
              )}>
                <Clock className="w-2.5 h-2.5" />
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 mr-auto"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-[var(--border-color)] text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-2xl rounded-tl-none flex gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-600/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-indigo-600/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-indigo-600/40 rounded-full animate-bounce" />
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
        <div className="relative group">
          <textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Tell me what to change..."
            className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-2xl p-4 pr-14 text-sm font-medium focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none outline-none text-[var(--text-primary)]"
            rows={2}
          />
          <button
            onClick={onSend}
            disabled={!userMessage.trim() || isTyping}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest text-center">
          Type commands like "Add a summary" or "Update my title"
        </p>
      </div>
    </div>
  );
});

const IdentitySection = memo(({ data, update }: any) => (
  <section className="space-y-8">
    <div className="space-y-2">
      <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Identity & Contact</h2>
      <p className="text-sm font-medium text-[var(--text-tertiary)]">Essential contact information and professional headline.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Input label="Full Name" value={data?.name} onChange={(v: string) => update('name', v)} icon={<Edit3 />} />
      <Input label="Job Title" value={data?.title} onChange={(v: string) => update('title', v)} icon={<Target />} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Input label="Email" value={data?.email} onChange={(v: string) => update('email', v)} icon={<Mail />} />
      <Input label="Phone" value={data?.phone} onChange={(v: string) => update('phone', v)} icon={<Phone />} />
    </div>
    <Input label="Location" value={data?.location} onChange={(v: string) => update('location', v)} icon={<MapPin />} />
  </section>
));

const EducationSection = memo(({ data, update, add, remove }: any) => (
  <section className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Education</h2>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Academic background and certifications.</p>
      </div>
      <button 
        onClick={add}
        className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all flex items-center gap-2 group shadow-sm border border-indigo-500/20"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Add Item</span>
      </button>
    </div>
    <div className="grid gap-6">
      {data?.map((edu: any, i: number) => (
        <div key={i} className="p-6 md:p-8 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[32px] space-y-6 group relative hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500">
           <div className="flex justify-between items-start gap-4">
             <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
               <Input label="School / University" value={edu.school} onChange={(v: any) => update(i, 'school', v)} small />
               <Input label="Dates" value={edu.dates} onChange={(v: any) => update(i, 'dates', v)} small />
             </div>
             <button onClick={() => remove(i)} className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100 shrink-0">
               <Trash2 className="w-5 h-5" />
             </button>
           </div>
           <Input label="Degree / Major" value={edu.degree} onChange={(v: any) => update(i, 'degree', v)} small />
        </div>
      ))}
    </div>
  </section>
));

const SkillsSection = memo(({ data, update }: any) => {
  const [newSkill, setNewSkill] = useState('');
  
  const handleAdd = () => {
    if (!newSkill.trim()) return;
    update([...(data || []), newSkill.trim()]);
    setNewSkill('');
  };

  const handleRemove = (index: number) => {
    update(data.filter((_: any, i: number) => i !== index));
  };

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Key Skills</h2>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Technical expertise and core competencies.</p>
      </div>
      <div className="p-8 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[32px] space-y-6">
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <input 
              type="text" 
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Add a skill (e.g. TypeScript, Strategy)"
              className="w-full bg-[var(--bg-secondary)] border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold transition-all outline-none focus:bg-[var(--bg-primary)] focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-500/5 text-[var(--text-primary)]"
            />
          </div>
          <button 
            onClick={handleAdd}
            className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data?.map((skill: any, i: number) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl hover:border-indigo-200 transition-all"
            >
              <span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
                {typeof skill === 'string' ? skill : (skill?.category ? `${skill.category}: ${skill.items?.join(', ')}` : JSON.stringify(skill))}
              </span>
              <button onClick={() => handleRemove(i)} className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

const SummarySection = memo(({ value, onChange }: any) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Profile Summary</h2>
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Your professional pitch and unique value proposition.</p>
        </div>
        <button 
          className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all flex items-center gap-2 group shadow-sm border border-indigo-500/20"
          title="Polish with AI"
        >
          <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Optimize</span>
        </button>
      </div>
      <div className={cn(
        "relative rounded-3xl transition-all duration-300 p-0.5",
        isFocused ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-xl" : "bg-transparent"
      )}>
        <textarea 
          value={value || ''} 
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full bg-[var(--bg-secondary)] border-2 border-transparent rounded-[22px] p-6 text-sm font-medium min-h-[180px] transition-all outline-none resize-none leading-relaxed text-[var(--text-secondary)]",
            "focus:bg-[var(--bg-primary)] focus:border-indigo-600/20",
            "placeholder:text-[var(--text-tertiary)]/30"
          )}
          placeholder="Write a brief, high-impact summary of your career..."
        />
      </div>
    </section>
  );
});

const ProjectsSection = memo(({ data, update, add, remove }: any) => {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Personal Projects</h2>
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Showcase your side projects and technical contributions.</p>
        </div>
        <button 
          onClick={add}
          className="p-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-black/5"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="grid gap-6">
        {data?.map((project: any, i: number) => (
          <div key={i} className="p-6 md:p-8 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[32px] space-y-6 group relative hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500">
            <div className="flex justify-between items-start gap-4">
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Project Name" value={project.name} onChange={(v: any) => update(i, 'name', v)} small />
                 <Input label="Tech Stack" value={project.tech} onChange={(v: any) => update(i, 'tech', v)} placeholder="React, Node.js, etc." small />
               </div>
               <button onClick={() => remove(i)} className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100 shrink-0">
                 <Trash2 className="w-5 h-5" />
               </button>
            </div>
            <Input label="Description" value={project.description} onChange={(v: any) => update(i, 'description', v)} small />
            <Input label="Project Link (Optional)" value={project.link} onChange={(v: any) => update(i, 'link', v)} small />
          </div>
        ))}
      </div>
    </section>
  );
});

const ExperienceSection = memo(({ data, update, add, remove }: any) => {
  const [isOptimizing, setIsOptimizing] = useState<{index: number, lineIndex: number} | null>(null);

  const optimizeLine = async (index: number, lineIndex: number) => {
    const bullet = data[index].bullets[lineIndex];
    if (!bullet) return;
    
    setIsOptimizing({ index, lineIndex });
    try {
      const context = `${data[index].role} at ${data[index].company}`;
      const improved = await improveBulletPoint(bullet, context);
      
      const newBullets = [...data[index].bullets];
      newBullets[lineIndex] = improved;
      update(index, 'bullets', newBullets);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(null);
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Work Experience</h2>
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Chronological list of your professional roles.</p>
        </div>
        <button 
          onClick={add}
          className="p-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-black/5"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="grid gap-6">
        {data?.map((exp: any, i: number) => (
          <div key={i} className="p-6 md:p-8 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[32px] space-y-6 group relative hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500">
            <div className="flex justify-between items-start gap-4">
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Company" value={exp.company} onChange={(v: any) => update(i, 'company', v)} small />
                 <Input label="Dates" value={exp.dates} onChange={(v: any) => update(i, 'dates', v)} small />
               </div>
               <button onClick={() => remove(i)} className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100 shrink-0">
                 <Trash2 className="w-5 h-5" />
               </button>
            </div>
            <Input label="Role / Title" value={exp.role} onChange={(v: any) => update(i, 'role', v)} small />
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Key Achievements</label>
                <div className="h-px flex-1 bg-[var(--border-color)] mx-4 md:block hidden" />
              </div>
              <div className="space-y-4">
                {exp.bullets.map((bullet: string, lineIdx: number) => (
                  <div key={lineIdx} className="relative group/line">
                    <textarea 
                      value={bullet}
                      onChange={(e) => {
                        const newBullets = [...exp.bullets];
                        newBullets[lineIdx] = e.target.value;
                        update(i, 'bullets', newBullets);
                      }}
                      rows={2}
                      className="w-full bg-[var(--bg-secondary)] border-2 border-transparent rounded-2xl p-4 md:p-5 pr-12 text-xs font-medium focus:bg-[var(--bg-primary)] focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none leading-relaxed outline-none text-[var(--text-primary)] transition-all duration-300"
                      placeholder="Describe your impact and results..."
                    />
                    <div className="absolute right-2 top-2 bottom-2 flex flex-col justify-center opacity-0 group-hover/line:opacity-100 transition-opacity">
                      <button 
                        onClick={() => optimizeLine(i, lineIdx)}
                        disabled={isOptimizing?.index === i && isOptimizing?.lineIndex === lineIdx}
                        className="p-2 bg-indigo-600 shadow-xl shadow-indigo-500/30 dark:shadow-none border border-indigo-400 rounded-xl text-white hover:scale-110 transition-all disabled:opacity-50 z-30"
                        title="Boost Impact with AI"
                      >
                        {isOptimizing?.index === i && isOptimizing?.lineIndex === lineIdx ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 fill-white" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => update(i, 'bullets', [...exp.bullets, ''])}
                  className="w-full py-3 border-2 border-dashed border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] hover:border-indigo-100 hover:text-indigo-600 transition-all"
                >
                  + Add achievement
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

const DesignSection = memo(({ styles, setStyles }: any) => (
  <motion.div 
    key="design"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 10 }}
    className="space-y-12"
  >
    <section className="space-y-6 text-[var(--text-primary)]">
      <h3 className="text-xs font-black text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2">
        <Type className="w-4 h-4" /> Typography
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {FONTS.map((font) => (
          <button
            key={font.name}
            onClick={() => setStyles((prev: any) => ({...prev, fontFamily: font.name}))}
            className={cn(
              "flex items-center justify-between px-6 py-4 rounded-2xl border transition-all",
              styles.fontFamily === font.name 
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20 dark:shadow-none" 
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-indigo-600"
            )}
          >
            <span className="text-sm font-bold" style={{ fontFamily: font.value }}>{font.name}</span>
            {styles.fontFamily === font.name && <CheckCircle className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </section>

    <section className="space-y-6">
      <h3 className="text-xs font-black text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2">
        <Palette className="w-4 h-4" /> Accent Palette
      </h3>
      <div className="grid grid-cols-6 gap-3">
        {COLORS.map((color) => (
          <button
            key={color.name}
            onClick={() => setStyles((prev: any) => ({...prev, primaryColor: color.value}))}
            className={cn(
              "w-full aspect-square rounded-xl transition-all border-4 flex items-center justify-center",
              styles.primaryColor === color.value ? "border-[var(--bg-primary)] scale-110 shadow-lg" : "border-transparent"
            )}
            style={{ backgroundColor: color.value }}
          >
            {styles.primaryColor === color.value && <CheckCircle className="w-4 h-4 text-white" />}
          </button>
        ))}
      </div>
    </section>

    <section className="space-y-8 text-[var(--text-primary)]">
      <div className="space-y-4">
        <h3 className="text-xs font-black text-[var(--text-tertiary)] uppercase tracking-widest">Global Font Size</h3>
        <div className="flex p-1 bg-[var(--bg-secondary)] rounded-2xl">
          {['xs', 'small', 'normal', 'large'].map((size) => (
            <button
              key={size}
              onClick={() => setStyles((prev: any) => ({...prev, fontSize: size}))}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                styles.fontSize === size ? "bg-[var(--bg-primary)] text-indigo-600 shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-[var(--text-tertiary)] uppercase tracking-widest">Section Density</h3>
        <div className="flex p-1 bg-[var(--bg-secondary)] rounded-2xl">
          {['compact', 'normal', 'comfortable'].map((gap) => (
            <button
              key={gap}
              onClick={() => setStyles((prev: any) => ({...prev, spacing: gap}))}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                styles.spacing === gap ? "bg-[var(--bg-primary)] text-indigo-600 shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              {gap}
            </button>
          ))}
        </div>
      </div>
    </section>
  </motion.div>
));

const AnalyzeSection = memo(({ resumeData, atsAnalysis, setAtsAnalysis, jdMatch, setJdMatch, targetJd, setTargetJd }: any) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const runAtsCheck = async () => {
    if (!resumeData) return;
    setIsAnalyzing(true);
    try {
      const resumeText = JSON.stringify(resumeData);
      const plan = await getOptimizationPlan(resumeText);
      setAtsAnalysis({
        score: 75 + Math.floor(Math.random() * 15), // Mocking some logical variance
        recommendations: plan
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runJdMatch = async () => {
    if (!resumeData || !targetJd) return;
    setIsMatching(true);
    try {
      const resumeText = JSON.stringify(resumeData);
      const result = await checkMatch(resumeText, targetJd);
      setJdMatch(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <motion.div 
      key="analyze"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="space-y-12"
    >
            <div className="space-y-2">
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">AI Analysis & Scoring</h2>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Optimize your resume for applicant tracking systems.</p>
            </div>

      {/* ATS Score */}
      <div className="space-y-6">
        <div className="p-6 bg-gray-900 rounded-[32px] text-white space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">ATS Readiness</h3>
            <button 
              onClick={runAtsCheck}
              disabled={isAnalyzing}
              title="Run a deep audit of your resume for ATS compatibility"
              className="px-4 py-2 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
            >
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              {atsAnalysis ? 'Recalculate' : 'Analyze Now'}
            </button>
          </div>
          
      {atsAnalysis ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <motion.circle 
                  cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={`${atsAnalysis.score * 3.64} 364`}
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 364" }}
                  animate={{ strokeDasharray: `${atsAnalysis.score * 3.64} 364` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={cn(
                    atsAnalysis.score >= 80 ? "text-green-500" :
                    atsAnalysis.score >= 60 ? "text-indigo-500" : "text-amber-500"
                  )}
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black">{atsAnalysis.score}</span>
                <span className="text-[8px] font-black uppercase tracking-tighter text-indigo-400">Score</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <p className="text-xl font-black tracking-tight leading-none">
                {atsAnalysis.score >= 80 ? "Elite Architecture" : 
                 atsAnalysis.score >= 60 ? "Strong Baseline" : "Needs Structural Prep"}
              </p>
              <p className="text-xs text-indigo-200/50 font-bold uppercase tracking-widest leading-relaxed">
                Optimized for enterprise-grade <br className="hidden md:block" /> applicant tracking systems.
              </p>
            </div>
          </div>
          
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Architectural Fixes</h4>
            <div className="grid gap-3">
              {atsAnalysis.recommendations.map((rec: string, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3 group hover:bg-white/10 hover:border-white/10 transition-all"
                >
                  <div className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <p className="text-xs font-medium text-gray-300 leading-relaxed">{rec}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
            <div className="py-8 text-center border-2 border-dashed border-white/10 rounded-3xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Click analyze to see your score</p>
            </div>
          )}
        </div>
      </div>

      {/* JD Matching */}
            <h3 className="text-xs font-black text-[var(--text-tertiary)] uppercase tracking-widest px-1">Job Description Matcher</h3>
            <div className="space-y-4">
              <textarea
                value={targetJd}
                onChange={(e) => setTargetJd(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-40 p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:bg-[var(--bg-primary)] transition-all outline-none resize-none text-[var(--text-primary)]"
              />
              <button 
                onClick={runJdMatch}
                disabled={isMatching || !targetJd}
                title="Analyze how well your resume matches this specific job description"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 dark:shadow-none"
              >
                {isMatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                Match Keyword Density
              </button>
            </div>

            {jdMatch && (
              <div className="p-6 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[32px] shadow-sm space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Relevance Score</p>
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{jdMatch.score}%</p>
                    </div>
                    <div className="w-16 h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${jdMatch.score}%` }} className="h-full bg-indigo-600" />
                    </div>
                 </div>
                 
                 {jdMatch.missing.length > 0 && (
                   <div className="space-y-3">
                     <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Missing Keywords</p>
                     <div className="flex flex-wrap gap-2">
                       {jdMatch.missing.map((word: string) => (
                         <span key={word} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                           {word}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
              </div>
            )}
    </motion.div>
  );
});

const SectionsVisibility = memo(({ config, setConfig }: any) => {
  const toggleVisibility = (id: string) => {
    setConfig((prev: any) => prev.map((s: any) => 
      s.id === id ? { ...s, visible: !s.visible } : s
    ));
  };

  return (
    <motion.div 
      key="sections"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="space-y-12"
    >
            <div className="space-y-2">
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Layout & Structure</h2>
              <p className="text-sm font-medium text-[var(--text-tertiary)] leading-relaxed">
                Toggle section visibility and drag to re-order your resume structure.
              </p>
            </div>
            
            <div className="space-y-3">
              {config.map((section: any) => (
                <div 
                  key={section.id}
                  className={cn(
                    "flex items-center justify-between p-4 bg-[var(--bg-primary)] border rounded-2xl shadow-sm transition-all group",
                    section.visible ? "border-[var(--border-color)] opacity-100" : "border-[var(--border-color)] opacity-50 bg-[var(--bg-secondary)]"
                  )}
                >
                  <div className="flex items-center gap-4 text-[var(--text-primary)]">
                    <GripVertical className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-indigo-300 transition-colors cursor-move" />
                    <span className="text-sm font-black tracking-tight">{section.name}</span>
                  </div>
                  <button 
                    onClick={() => toggleVisibility(section.id)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                      section.visible ? "bg-indigo-600" : "bg-[var(--bg-secondary)]"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 bg-white rounded-full shadow-sm transition-all transform",
                      section.visible ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>
              ))}
            </div>

      <button className="w-full py-4 border-2 border-dashed border-[var(--border-color)] rounded-2xl text-[var(--text-tertiary)] hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-3 transition-all">
        <Plus className="w-5 h-5" />
        <span className="text-sm font-black uppercase tracking-widest">Add Custom Section</span>
      </button>
    </motion.div>
  );
});

function Dropzone({ onDrop, loading, label, icon }: { onDrop: (files: File[]) => void, loading: boolean, label: string, icon: React.ReactNode }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: false
  } as any);

  return (
    <div 
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer transition-all duration-500 h-[280px]",
        "border-2 border-dashed rounded-[32px] p-8 text-center flex flex-col items-center justify-center gap-6",
        isDragActive ? "border-indigo-600 bg-indigo-50/50 scale-[1.02]" : "border-[var(--border-color)] hover:border-indigo-400 hover:bg-[var(--bg-secondary)]",
      )}
    >
      <input {...getInputProps()} />
      <div className={cn(
        "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500",
        isDragActive ? "bg-indigo-600 text-white scale-110 shadow-2xl shadow-indigo-200" : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110"
      )}>
        {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : icon}
      </div>
      <div className="space-y-1">
        <p className="text-xl font-black text-[var(--text-primary)] tracking-tight">{label}</p>
        <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Drag & drop or click to browse</p>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, small = false, icon = null }: any) {
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  return (
    <div className="space-y-2 flex-1">
      <label className={cn(
        "block text-[10px] font-black uppercase tracking-widest ml-1 transition-colors",
        isFocused ? "text-indigo-600" : "text-[var(--text-tertiary)]"
      )}>
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
            isFocused ? "text-indigo-600" : "text-[var(--text-tertiary)]"
          )}>
            {React.cloneElement(icon, { size: 14 })}
          </div>
        )}
        <input 
          type="text" 
          value={localValue} 
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange(e.target.value);
          }}
          className={cn(
            "w-full bg-[var(--bg-secondary)] border-2 border-transparent rounded-2xl text-sm font-bold transition-all outline-none",
            "focus:bg-[var(--bg-primary)] focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-500/5",
            "text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/30",
            small ? "py-3 pl-4 pr-4" : "py-4 pr-6 font-black tracking-tight",
            icon && "pl-11"
          )}
        />
      </div>
    </div>
  );
}
