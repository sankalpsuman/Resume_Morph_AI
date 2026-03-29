import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileText, CheckCircle, Loader2, Download, Eye, Layout, 
  RefreshCw, FileCode, FileType, Printer, 
  Maximize2, Minimize2, Zap, AlertCircle, MousePointerClick, Hand, Star, X, Lock
} from 'lucide-react';
import { analyzeLayout, generateResume, extractTextFromAny, getOptimizationPlan, checkMatch } from '../lib/gemini';
import mammoth from 'mammoth';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db, storage } from '../firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp, collection, addDoc, increment } from 'firebase/firestore';
import { ref, uploadString, deleteObject } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../lib/firestore';

interface FileData {
  file: File;
  base64?: string;
  text?: string;
  type: string;
}

interface ResumeBuilderProps {
  userData: any;
  onUpgrade: () => void;
}

export default function ResumeBuilder({ userData, onUpgrade }: ResumeBuilderProps) {
  const [referenceFile, setReferenceFile] = useState<FileData | null>(null);
  const [contentFile, setContentFile] = useState<FileData | null>(null);
  const [layoutAnalysis, setLayoutAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [resumeMetadata, setResumeMetadata] = useState<{ name: string; yoe: string; profile: string } | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsFeedback, setAtsFeedback] = useState<string | null>(null);
  const [optimizationPlan, setOptimizationPlan] = useState<string[] | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isPreviewFull, setIsPreviewFull] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [matchDescription, setMatchDescription] = useState('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  // New state for limits and feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // New state for Smart Save Flow
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingResume, setPendingResume] = useState<{ html: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      const apiKey = 
        (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined) || 
        (typeof process !== 'undefined' ? process.env?.API_KEY : undefined) ||
        ((import.meta as any).env?.VITE_GEMINI_API_KEY) ||
        (window as any).GEMINI_API_KEY ||
        "";
      
      if (!apiKey) {
        const hasKey = await (window as any).aistudio?.hasSelectedApiKey?.();
        if (!hasKey) {
          setNeedsApiKey(true);
          setError("Gemini API Key is missing. Please select your API key to enable the Morph Engine.");
        }
      } else {
        setNeedsApiKey(false);
        setError(null);
      }
    };
    
    checkKey();
  }, []);

  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const onDropReference = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setNeedsApiKey(false);
    try {
      let text = '';
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (file.type === 'text/plain') {
        text = await file.text();
      }
      
      const base64 = await fileToBase64(file);
      setReferenceFile({ file, base64, text, type: file.type });
      // Reset layout analysis and generated HTML when a new reference is uploaded
      setLayoutAnalysis(null);
      setGeneratedHtml(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load reference file. Please try again.");
    }
  };

  const onDropContent = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setNeedsApiKey(false);
    try {
      let text = '';
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (file.type === 'text/plain') {
        text = await file.text();
      } else {
        // For PDF/Images, we'll need to extract text later via AI
        // but we don't do it automatically now to save quota
      }

      const base64 = await fileToBase64(file);
      setContentFile({ file, base64, text, type: file.type });
      // Reset generated HTML when new content is uploaded
      setGeneratedHtml(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load content file. Please try again.");
    }
  };

  const saveResumeToHistory = async (html: string, name: string, replaceId?: string) => {
    if (!auth.currentUser || !userData) return;
    setIsSaving(true);
    
    // Optimistically close modal to make it feel instant
    setShowSaveModal(false);
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      let currentHistory = userData.resumeHistory || [];
      
      const resumeId = replaceId || crypto.randomUUID();
      const storagePath = `resumes/${auth.currentUser.uid}/${resumeId}.html`;
      const resumeRef = ref(storage, storagePath);

      const newResume = {
        id: resumeId,
        name: name || 'Untitled Resume',
        timestamp: new Date().toISOString(),
        html: html, // Keep HTML in Firestore for quick access as well
        storagePath: storagePath
      };

      let updatedHistory;
      if (replaceId) {
        // Replace existing
        updatedHistory = currentHistory.map((r: any) => r.id === replaceId ? newResume : r);
      } else {
        // Add new, but user should only call this if < 2
        updatedHistory = [newResume, ...currentHistory].slice(0, 2);
      }

      // Parallelize Storage and Firestore updates for maximum speed
      await Promise.all([
        uploadString(resumeRef, html, 'raw', { contentType: 'text/html' }),
        updateDoc(userRef, {
          morphCount: increment(1),
          resumeHistory: updatedHistory,
          lastActivityAt: serverTimestamp()
        })
      ]);
      
      setPendingResume(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      setError("Background save failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!auth.currentUser || rating === 0) return;
    
    setIsSubmittingFeedback(true);
    try {
      // 1. Save feedback to feedbacks collection
      await addDoc(collection(db, 'feedbacks'), {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName,
        email: auth.currentUser.email,
        photoURL: auth.currentUser.photoURL,
        rating,
        message: feedbackText || `Rating: ${rating} stars`,
        createdAt: serverTimestamp()
      });

      // 2. Update user status to unlock 2nd morph
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        hasReviewed: true
      });

      setShowFeedbackModal(false);
      // Now user can try morphing again
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'feedbacks/users');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleGenerate = async () => {
    if (!referenceFile || !contentFile) return;
    
    // Check limits
    if (userData) {
      const isAdmin = userData.email === 'sankalpsmn@gmail.com';
      if (!isAdmin) {
        if (userData.morphCount === 1 && !userData.hasReviewed) {
          setShowFeedbackModal(true);
          return;
        }
        const limit = userData.planLimit || 2;
        if (limit !== -1 && (userData.usedMorphs || 0) >= limit) {
          onUpgrade();
          return;
        }
      }
    }

    setIsGenerating(true);
    setError(null);
    setNeedsApiKey(false);
    
    try {
      // Unified call: Merges layout analysis, text extraction, JD matching, and resume generation
      const result = await generateResume(
        { base64: referenceFile.base64, mimeType: referenceFile.type, text: referenceFile.text },
        { base64: contentFile.base64, mimeType: contentFile.type, text: contentFile.text },
        jobDescription,
        false,
        layoutAnalysis
      );

      setGeneratedHtml(result.html);
      setResumeMetadata({ name: result.name, yoe: result.yoe, profile: result.profile });
      setAtsScore(result.atsScore);
      setAtsFeedback(result.atsFeedback);
      setMatchScore(result.matchScore);
      setMissingKeywords(result.missingKeywords);
      setLayoutAnalysis(result.layoutAnalysis);
      
      // If content text was extracted by AI, update it locally to avoid re-extraction
      if (!contentFile.text && result.extractedText) {
        setContentFile(prev => prev ? { ...prev, text: result.extractedText } : null);
      }

      // Trigger Smart Save Flow
      setPendingResume({ html: result.html, name: result.name });
      setShowSaveModal(true);

      // Deduct morph
      if (auth.currentUser && userData.email !== 'sankalpsmn@gmail.com') {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          usedMorphs: increment(1),
          remainingMorphs: userData.planLimit === -1 ? 999 : increment(-1),
          morphCount: increment(1) // Keep for level calculation
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING") {
        setNeedsApiKey(true);
        setError("API Key required. Please select your Gemini API key to continue.");
      } else if (err.message === "QUOTA_EXCEEDED") {
        setError("Daily AI limit reached. Please try again later or use a different API key.");
      } else {
        setError("Failed to generate resume. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
      setIsGenerating(false);
    }
  };

  const handleAnalyzeStyle = async () => {
    if (!referenceFile) return;
    
    setIsAnalyzing(true);
    setError(null);
    setNeedsApiKey(false);
    
    try {
      let currentLayout = layoutAnalysis;
      if (!currentLayout) {
        if (referenceFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || referenceFile.type === 'text/plain') {
          currentLayout = await analyzeLayout(undefined, undefined, referenceFile.text);
        } else if (referenceFile.base64) {
          currentLayout = await analyzeLayout(referenceFile.base64.split(',')[1], referenceFile.type);
        }
        setLayoutAnalysis(currentLayout);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING") {
        setNeedsApiKey(true);
        setError("API Key required. Please select your Gemini API key to continue.");
      } else if (err.message === "QUOTA_EXCEEDED") {
        setError("Daily AI limit reached. Please try again later.");
      } else {
        setError("Failed to analyze style. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!referenceFile || !contentFile) return;
    
    // Check limits
    if (userData) {
      const isAdmin = userData.email === 'sankalpsmn@gmail.com';
      if (!isAdmin) {
        if (userData.morphCount === 1 && !userData.hasReviewed) {
          setShowFeedbackModal(true);
          return;
        }
        const limit = userData.planLimit || 2;
        if (limit !== -1 && (userData.usedMorphs || 0) >= limit) {
          onUpgrade();
          return;
        }
      }
    }

    setIsGenerating(true);
    setError(null);
    setNeedsApiKey(false);
    try {
      const result = await generateResume(
        { base64: referenceFile.base64, mimeType: referenceFile.type, text: referenceFile.text },
        { base64: contentFile.base64, mimeType: contentFile.type, text: contentFile.text },
        jobDescription,
        false,
        layoutAnalysis
      );
      setGeneratedHtml(result.html);
      setResumeMetadata({ name: result.name, yoe: result.yoe, profile: result.profile });
      setAtsScore(result.atsScore);
      setAtsFeedback(result.atsFeedback);
      setMatchScore(result.matchScore);
      setMissingKeywords(result.missingKeywords);
      setLayoutAnalysis(result.layoutAnalysis);

      // Update content text if extracted
      if (!contentFile.text && result.extractedText) {
        setContentFile(prev => prev ? { ...prev, text: result.extractedText } : null);
      }

      // Trigger Smart Save Flow
      setPendingResume({ html: result.html, name: result.name });
      setShowSaveModal(true);

      // Deduct morph
      if (auth.currentUser && userData.email !== 'sankalpsmn@gmail.com') {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          usedMorphs: increment(1),
          remainingMorphs: userData.planLimit === -1 ? 999 : increment(-1),
          morphCount: increment(1) // Keep for level calculation
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING") {
        setNeedsApiKey(true);
        setError("API Key required. Please select your Gemini API key to continue.");
      } else if (err.message === "QUOTA_EXCEEDED") {
        setError("Daily AI limit reached. Please try again later.");
      } else {
        setError("Failed to re-optimize resume. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCheckMatch = async () => {
    if (!matchDescription) {
      setError("Please paste a job description first.");
      return;
    }
    if (!contentFile?.text) {
      setError("Please upload your resume first.");
      return;
    }

    setIsMatching(true);
    setError(null);
    try {
      const result = await checkMatch(contentFile.text, matchDescription);
      setMatchScore(result.score);
      setMissingKeywords(result.missing);
    } catch (err: any) {
      console.error(err);
      if (err.message === "QUOTA_EXCEEDED") {
        setError("Daily AI limit reached. Please try again later.");
      } else {
        setError("Failed to analyze match. Please try again.");
      }
    } finally {
      setIsMatching(false);
    }
  };

  const handleMaximizeAts = async () => {
    if (!layoutAnalysis || !contentFile?.text) return;
    
    setIsPlanning(true);
    setError(null);
    setNeedsApiKey(false);
    try {
      const plan = await getOptimizationPlan(contentFile.text, jobDescription);
      setOptimizationPlan(plan);
      setShowPlanModal(true);
    } catch (err: any) {
      console.error(err);
      if (err.message === "QUOTA_EXCEEDED") {
        setError("Daily AI limit reached. Please try again later.");
      } else {
        setError("Failed to generate optimization plan. Please try again.");
      }
    } finally {
      setIsPlanning(false);
    }
  };

  const confirmMaximizeAts = async () => {
    if (!referenceFile || !contentFile) return;
    
    // Check limits
    if (userData) {
      const isAdmin = userData.email === 'sankalpsmn@gmail.com';
      if (!isAdmin) {
        if (userData.morphCount === 1 && !userData.hasReviewed) {
          setShowFeedbackModal(true);
          return;
        }
        const limit = userData.planLimit || 2;
        if (limit !== -1 && (userData.usedMorphs || 0) >= limit) {
          onUpgrade();
          return;
        }
      }
    }

    setShowPlanModal(false);
    setIsGenerating(true);
    setError(null);
    setNeedsApiKey(false);
    try {
      const result = await generateResume(
        { base64: referenceFile.base64, mimeType: referenceFile.type, text: referenceFile.text },
        { base64: contentFile.base64, mimeType: contentFile.type, text: contentFile.text },
        jobDescription,
        true,
        layoutAnalysis
      );
      setGeneratedHtml(result.html);
      setResumeMetadata({ name: result.name, yoe: result.yoe, profile: result.profile });
      setAtsScore(result.atsScore);
      setAtsFeedback(result.atsFeedback);
      setMatchScore(result.matchScore);
      setMissingKeywords(result.missingKeywords);
      setLayoutAnalysis(result.layoutAnalysis);

      // Update content text if extracted
      if (!contentFile.text && result.extractedText) {
        setContentFile(prev => prev ? { ...prev, text: result.extractedText } : null);
      }

      // Trigger Smart Save Flow
      setPendingResume({ html: result.html, name: result.name });
      setShowSaveModal(true);

      // Deduct morph
      if (auth.currentUser && userData.email !== 'sankalpsmn@gmail.com') {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          usedMorphs: increment(1),
          remainingMorphs: userData.planLimit === -1 ? 999 : increment(-1),
          morphCount: increment(1) // Keep for level calculation
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING") {
        setNeedsApiKey(true);
        setError("API Key required. Please select your Gemini API key to continue.");
      } else if (err.message === "QUOTA_EXCEEDED") {
        setError("Daily AI limit reached. Please try again later.");
      } else {
        setError("Failed to maximize ATS score. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.openSelectKey) {
      try {
        await aistudio.openSelectKey();
        // After selection, we reload to ensure the new key is active
        window.location.reload();
      } catch (err) {
        console.error("Failed to open key selector", err);
      }
    } else {
      setError("Please configure your GEMINI_API_KEY in the Secrets panel.");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const getFileName = (ext: string) => {
    if (resumeMetadata) {
      const { name, yoe, profile } = resumeMetadata;
      return `${name}_${yoe}_${profile}.${ext}`;
    }
    return `morph-resume.${ext}`;
  };

  const handleDownloadHTML = () => {
    if (!generatedHtml) return;
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 2rem; background: white; }
            .resume-container { max-width: 800px; margin: 0 auto; }
            @media print {
              @page { margin: 0; size: auto; }
              body { margin: 1.6cm; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .resume-container { max-width: none; width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="resume-container">
            ${generatedHtml}
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName('html');
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const handleDownloadWord = () => {
    if (!generatedHtml) return;
    // Word can open HTML files if they have the right headers
    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Resume</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 2rem; background: white; }
            .resume-container { max-width: 800px; margin: 0 auto; }
            /* Word-specific overrides for layout */
            .grid { display: table !important; width: 100% !important; }
            .col-span-1, .col-span-2, .col-span-3, .col-span-4, .col-span-5, .col-span-6, .col-span-7, .col-span-8, .col-span-9, .col-span-10, .col-span-11, .col-span-12 { display: table-cell !important; }
          </style>
        </head>
        <body>
          <div class="resume-container">
            ${generatedHtml}
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', fullHtml], {
        type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName('doc');
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const handlePrintPDF = () => {
    if (iframeRef.current) {
      // Focus the iframe before printing
      iframeRef.current.contentWindow?.focus();
      iframeRef.current.contentWindow?.print();
    }
    setShowDownloadMenu(false);
  };

  const reset = () => {
    setReferenceFile(null);
    setContentFile(null);
    setLayoutAnalysis(null);
    setGeneratedHtml(null);
    setResumeMetadata(null);
    setAtsScore(null);
    setAtsFeedback(null);
    setJobDescription('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-300">
              <RefreshCw className="text-white w-5 h-5 md:w-7 md:h-7" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-black tracking-tight text-gray-900 leading-tight">Resume Morph</h1>
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold">AI Style Cloning Engine</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {generatedHtml && (
              <div className="relative hidden md:block">
                <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-gray-900 text-white rounded-xl md:rounded-2xl text-xs md:text-sm font-bold hover:bg-black transition-all active:scale-95 shadow-2xl shadow-gray-200"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden xs:inline">Export</span>
                  <span className="hidden sm:inline">Resume</span>
                  <Hand className={cn("w-3 h-3 md:w-4 md:h-4 transition-transform", showDownloadMenu && "rotate-12")} />
                </button>

                <AnimatePresence>
                  {showDownloadMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowDownloadMenu(false)} 
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 bg-white rounded-[24px] shadow-2xl border border-gray-100 p-2 z-20"
                      >
                        <button 
                          onClick={handleDownloadHTML}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-indigo-50 rounded-xl flex items-center gap-3 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                            <FileCode className="w-4 h-4 text-orange-600 group-hover:text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-700">Download HTML</span>
                            <span className="text-[10px] text-gray-400">Perfect for web viewing</span>
                          </div>
                        </button>
                        <button 
                          onClick={handleDownloadWord}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-indigo-50 rounded-xl flex items-center gap-3 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                            <FileType className="w-4 h-4 text-blue-600 group-hover:text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-700">Download Word</span>
                            <span className="text-[10px] text-gray-400">Editable .doc format</span>
                          </div>
                        </button>
                        <div className="h-px bg-gray-100 my-2 mx-2" />
                        <button 
                          onClick={handlePrintPDF}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-indigo-50 rounded-xl flex items-center gap-3 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                            <Printer className="w-4 h-4 text-purple-600 group-hover:text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-700">Save as PDF</span>
                            <span className="text-[10px] text-gray-400">High-fidelity print</span>
                          </div>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {(referenceFile || contentFile) && (
              <button 
                onClick={reset}
                disabled={isGenerating || isAnalyzing || isPlanning || isMatching}
                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-30"
                title="Reset All"
              >
                <MousePointerClick className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-200 shadow-sm space-y-8 md:space-y-10">
              
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-100">1</div>
                  <h2 className="font-black text-xl tracking-tight">Reference Style</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed font-medium">
                  Upload the resume layout you want to clone. We'll analyze its visual DNA.
                </p>
                
                <Dropzone 
                  onDrop={onDropReference} 
                  isProcessing={isAnalyzing} 
                  file={referenceFile?.file}
                  label="Drop reference resume"
                  color="indigo"
                />
                
                {referenceFile && !layoutAnalysis && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleAnalyzeStyle}
                    disabled={isAnalyzing || isGenerating}
                    className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <MousePointerClick className="w-3 h-3" />}
                    {isAnalyzing ? "Analyzing Style..." : "Analyze Style"}
                  </motion.button>
                )}
                
                {layoutAnalysis && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Style Captured</p>
                  </motion.div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-100">2</div>
                    <h2 className="font-black text-xl tracking-tight">Optimization</h2>
                  </div>
                  {jobDescription && (
                    <button 
                      onClick={() => setJobDescription('')}
                      className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  Target a specific role? Paste the job description or requirements below.
                </p>
                <div className="relative">
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    className={cn(
                      "w-full h-32 p-5 bg-gray-50 border border-gray-200 rounded-[24px] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all resize-none placeholder:text-gray-300",
                      jobDescription && "border-indigo-200 bg-indigo-50/20"
                    )}
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none">
                    {jobDescription ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
                        <RefreshCw className="w-2.5 h-2.5 text-white animate-spin-slow" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">AI Ready</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-50">Optional</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                  * AI will emphasize relevant skills without removing your original data or adding fake skills.
                </p>

                {generatedHtml && jobDescription && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleOptimize}
                    disabled={isGenerating}
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MousePointerClick className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    )}
                    {isGenerating ? "Optimizing..." : "Re-Morph with Optimization"}
                  </motion.button>
                )}
              </section>

              <section className="transition-all duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-100">3</div>
                  <h2 className="font-black text-xl tracking-tight">Your Content</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed font-medium">
                  Upload your data. We'll morph it into the reference style.
                </p>
                
                <Dropzone 
                  onDrop={onDropContent} 
                  isProcessing={isGenerating} 
                  file={contentFile?.file}
                  label="Drop your content file"
                  color="indigo"
                />

                {referenceFile && contentFile && !generatedHtml && (
                  (() => {
                    const isAdmin = userData?.email === 'sankalpsmn@gmail.com';
                    const limit = userData?.planLimit || 2;
                    const isOverLimit = !isAdmin && limit !== -1 && (userData?.usedMorphs || 0) >= limit;
                    return isOverLimit;
                  })() ? (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={onUpgrade}
                      className="w-full mt-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[24px] text-sm font-black uppercase tracking-[0.2em] hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group"
                    >
                      <Zap className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                      Upgrade to Premium
                    </motion.button>
                  ) : (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleGenerate}
                      disabled={isGenerating || isAnalyzing}
                      className="w-full mt-6 py-5 bg-indigo-600 text-white rounded-[24px] text-sm font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating || isAnalyzing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <MousePointerClick className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                      )}
                      {isGenerating ? "Morphing..." : isAnalyzing ? "Analyzing Style..." : "Generate Resume"}
                    </motion.button>
                  )
                )}
              </section>

              <section className={cn("transition-all duration-500 pt-6 border-t border-gray-100", !contentFile && "opacity-30 pointer-events-none blur-[1px]")}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-100">4</div>
                  <h2 className="font-black text-xl tracking-tight">Match Analysis</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed font-medium">
                  Paste a specific job description to check your match score.
                </p>
                <div className="space-y-4">
                  <textarea 
                    value={matchDescription}
                    onChange={(e) => setMatchDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                  />
                  <button 
                    onClick={handleCheckMatch}
                    disabled={isMatching || !matchDescription}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isMatching ? <Loader2 className="w-3 h-3 animate-spin" /> : <MousePointerClick className="w-3 h-3" />}
                    {isMatching ? "Analyzing Match..." : "Check Match Score"}
                  </button>

                  {matchScore !== null && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Match Score</span>
                        <span className={cn(
                          "text-2xl font-black",
                          matchScore >= 80 ? "text-green-600" : matchScore >= 50 ? "text-yellow-600" : "text-red-600"
                        )}>{matchScore}%</span>
                      </div>
                      
                      {missingKeywords.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Missing Keywords
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {missingKeywords.map((kw) => (
                              <span key={kw} className="px-2 py-1 bg-white border border-indigo-100 rounded-lg text-[9px] font-bold text-indigo-600">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </section>

              <section className="pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-green-100">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <h2 className="font-black text-lg tracking-tight">ATS Morph Engine</h2>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                    Our engine now automatically optimizes your resume for **Applicant Tracking Systems (ATS)**. 
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Standardized section headings",
                      "Linear HTML structure for parsing",
                      "Keyword density optimization",
                      "Clean, searchable typography"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <div className="w-1 h-1 rounded-full bg-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold uppercase tracking-wider text-center space-y-3"
                >
                  <p>{error}</p>
                  {needsApiKey && (
                    <button 
                      onClick={handleSelectKey}
                      className="w-full py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                      disabled={isGenerating || isAnalyzing || isPlanning || isMatching}
                    >
                      Select API Key
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className={cn(
            "transition-all duration-700 ease-in-out w-full",
            isPreviewFull 
              ? "fixed inset-0 z-[200] bg-[#F8F9FA] p-4 md:p-8 overflow-y-auto" 
              : "lg:col-span-8 lg:sticky lg:top-32"
          )}>
            <div className={cn(
              "bg-white rounded-[24px] md:rounded-[40px] border border-gray-200 shadow-2xl shadow-indigo-200/20 flex flex-col overflow-hidden group transition-all duration-500",
              isPreviewFull ? "min-h-screen w-full max-w-5xl mx-auto" : "min-h-[500px] md:min-h-[850px]"
            )}>
              <div className="h-14 md:h-16 border-b border-gray-100 px-4 md:px-10 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3 md:gap-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Preview</span>
                  </div>
                  
                  {atsScore !== null && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 md:gap-3 pl-3 md:pl-6 border-l border-gray-200"
                    >
                      <div className={cn(
                        "px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 md:gap-2",
                        atsScore >= 80 ? "bg-green-100 text-green-700" : 
                        atsScore >= 50 ? "bg-yellow-100 text-yellow-700" : 
                        "bg-red-100 text-red-700"
                      )}>
                        ATS: {atsScore}%
                      </div>
                      {atsFeedback && (
                        <span className="hidden sm:inline text-[10px] font-bold text-gray-400 truncate max-w-[100px] md:max-w-[200px]" title={atsFeedback}>
                          {atsFeedback}
                        </span>
                      )}
                      {atsScore < 100 && (
                        <button
                          onClick={handleMaximizeAts}
                          disabled={isGenerating || isPlanning}
                          className="px-2 md:px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 md:gap-1.5 shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                          {isPlanning ? (
                            <Loader2 className="w-2 h-2 md:w-2.5 md:h-2.5 animate-spin" />
                          ) : (
                            <Zap className="w-2 h-2 md:w-2.5 md:h-2.5 fill-white" />
                          )}
                          <span className="hidden xs:inline">{isPlanning ? "Analyzing..." : "Maximize"}</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  {generatedHtml && (
                    <button 
                      onClick={() => setIsPreviewFull(!isPreviewFull)}
                      className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-white border border-gray-200 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      {isPreviewFull ? (
                        <>
                          <Minimize2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Exit Full View</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Full View</span>
                        </>
                      )}
                    </button>
                  )}
                  <div className="hidden sm:flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200 group-hover:bg-red-400 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-gray-200 group-hover:bg-yellow-400 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-gray-200 group-hover:bg-green-400 transition-colors" />
                  </div>
                </div>
              </div>

              <div className={cn(
                "flex-1 p-0 bg-white relative",
                isPreviewFull ? "h-auto" : "overflow-hidden"
              )}>
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 bg-white z-10"
                    >
                      <div className="relative">
                        <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <RefreshCw className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
                      </div>
                      <div>
                        <p className="font-black text-2xl tracking-tight">Morphing Content...</p>
                        <p className="text-sm text-gray-400 font-medium mt-1">Applying visual DNA to your professional data</p>
                      </div>
                    </motion.div>
                  ) : generatedHtml ? (
                    <motion.iframe 
                      key="content"
                      ref={iframeRef}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "w-full border-none",
                        isPreviewFull ? "min-h-[1200px]" : "h-[500px] md:h-[784px]"
                      )}
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <script src="https://cdn.tailwindcss.com"></script>
                            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                            <style>
                              body { 
                                font-family: 'Inter', sans-serif; 
                                margin: 0; 
                                padding: 3rem; 
                                background: white; 
                                color: #1a1a1a; 
                                overflow-x: hidden;
                              }
                              .resume-container { 
                                max-width: 800px; 
                                margin: 0 auto; 
                                transform-origin: top center;
                                transition: transform 0.2s ease;
                              }
                              @media print {
                                @page { margin: 0; size: auto; }
                                body { margin: 1.6cm; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                .resume-container { max-width: none; width: 100%; transform: none !important; }
                              }
                              @media screen and (max-width: 800px) {
                                body { padding: 1.5rem; }
                                .resume-container { width: 800px; }
                              }
                            </style>
                          </head>
                          <body>
                            <div class="resume-container">
                              ${generatedHtml}
                            </div>
                            <script>
                              function adjustScale() {
                                const container = document.querySelector('.resume-container');
                                if (!container) return;
                                const width = window.innerWidth;
                                const padding = width < 800 ? 48 : 96; // 1.5rem vs 3rem total padding
                                if (width < 800) {
                                  const scale = (width - padding) / 800;
                                  container.style.transform = 'scale(' + scale + ')';
                                } else {
                                  container.style.transform = 'none';
                                }
                              }
                              window.addEventListener('resize', adjustScale);
                              window.addEventListener('load', adjustScale);
                              setTimeout(adjustScale, 100);
                            </script>
                          </body>
                        </html>
                      `}
                    />
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center p-12 min-h-[784px]"
                    >
                      <div className="w-40 h-40 bg-gray-50 rounded-[40px] flex items-center justify-center mb-8 rotate-3">
                        <Layout className="w-20 h-20 text-gray-200" />
                      </div>
                      <div className="max-w-sm">
                        <h3 className="font-black text-2xl tracking-tight text-gray-300">Awaiting Morph</h3>
                        <p className="text-sm text-gray-400 font-medium mt-3 leading-relaxed">
                          Complete the steps on the left to see your content transformed into a professional masterpiece.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </main>

      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlanModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 sm:p-12 flex flex-col h-full overflow-y-auto">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
                    <Zap className="w-8 h-8 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-3xl tracking-tight">Optimization Plan</h3>
                    <p className="text-base text-gray-500 font-medium">Proposed changes for 100% ATS score</p>
                  </div>
                </div>

                <div className="space-y-5 mb-12 flex-1">
                  {optimizationPlan?.map((step, i) => (
                    <motion.div 
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-5 p-6 bg-gray-50 rounded-3xl border border-gray-100"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-base font-bold text-gray-700 leading-relaxed">
                        {step}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-5 mt-auto">
                  <button 
                    onClick={() => setShowPlanModal(false)}
                    className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-3xl font-black text-sm uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmMaximizeAts}
                    className="flex-[2] py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Confirm & Apply
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {generatedHtml && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[150] md:hidden p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100 shadow-2xl"
          >
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl"
              >
                <Download className="w-5 h-5" />
                Export Resume
                <Hand className={cn("w-4 h-4 transition-transform", showDownloadMenu && "rotate-12")} />
              </button>
            </div>
            
            <AnimatePresence>
              {showDownloadMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-4 right-4 mb-4 bg-white rounded-[32px] shadow-2xl border border-gray-100 p-3 z-20"
                >
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => { handleDownloadHTML(); setShowDownloadMenu(false); }}
                      className="w-full px-4 py-4 text-left text-sm hover:bg-indigo-50 rounded-2xl flex items-center gap-4 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <FileCode className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700">HTML</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Web format</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => { handleDownloadWord(); setShowDownloadMenu(false); }}
                      className="w-full px-4 py-4 text-left text-sm hover:bg-indigo-50 rounded-2xl flex items-center gap-4 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <FileType className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700">Word</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Editable .doc</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => { handlePrintPDF(); setShowDownloadMenu(false); }}
                      className="w-full px-4 py-4 text-left text-sm hover:bg-indigo-50 rounded-2xl flex items-center gap-4 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Printer className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700">PDF</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Print ready</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Unlock Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedbackModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8 md:p-10 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-[28px] flex items-center justify-center mx-auto mb-8">
                  <Star className="w-10 h-10 text-indigo-600 fill-indigo-600" />
                </div>
                
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Unlock 1 More Morph!</h2>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                  You've used your free morph. Share your feedback to unlock one more resume morph for free!
                </p>

                <div className="flex justify-center gap-3 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star 
                        className={cn(
                          "w-10 h-10 transition-colors",
                          rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                        )} 
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you think... (optional)"
                  className="w-full h-32 px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[24px] text-sm font-medium transition-all outline-none resize-none mb-8"
                />

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={rating === 0 || isSubmittingFeedback}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                  >
                    {isSubmittingFeedback ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Unlock Now"
                    )}
                  </button>
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="w-full py-4 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-gray-600 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      {/* Smart Save Modal */}
      <AnimatePresence>
        {showSaveModal && pendingResume && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSaveModal(false);
                setPendingResume(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100 space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-100">
                  <Download className="w-10 h-10 text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">Save Resume?</h3>
                  <p className="text-gray-500 font-medium">Do you want to save this resume for later download? You can save up to 2 resumes.</p>
                </div>
              </div>

              {userData.resumeHistory?.length >= 2 ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center">Select a resume to replace</p>
                  <div className="grid gap-3">
                    {userData.resumeHistory.map((resume: any) => (
                      <button
                        key={resume.id}
                        onClick={() => saveResumeToHistory(pendingResume.html, pendingResume.name, resume.id)}
                        disabled={isSaving}
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                          <span className="text-sm font-bold text-gray-700">{resume.name}</span>
                        </div>
                        <RefreshCw className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => saveResumeToHistory(pendingResume.html, pendingResume.name)}
                    disabled={isSaving}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    Yes, Save it
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setPendingResume(null);
                }}
                disabled={isSaving}
                className="w-full py-4 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-gray-600 transition-colors"
              >
                No, Don't Save
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Dropzone({ onDrop, isProcessing, file, label, color }: { 
  onDrop: (files: File[]) => void, 
  isProcessing: boolean, 
  file?: File,
  label: string,
  color: string
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    disabled: isProcessing,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  } as any);

  return (
    <div 
      {...getRootProps()} 
      className={cn(
        "relative group cursor-pointer transition-all duration-500",
        "border-2 border-dashed rounded-[32px] p-10 text-center",
        isDragActive ? "border-indigo-500 bg-indigo-50/50 scale-[1.02]" : "border-gray-100 bg-gray-50/50 hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/20",
        isProcessing && "opacity-50 cursor-not-allowed",
        file && "border-indigo-200 bg-indigo-50/20"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-5">
        <div className={cn(
          "w-16 h-16 rounded-[20px] flex items-center justify-center transition-all duration-500 shadow-lg",
          file ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white text-gray-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-200"
        )}>
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : file ? (
            <CheckCircle className="w-8 h-8" />
          ) : (
            <MousePointerClick className="w-8 h-8" />
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-black tracking-tight">
            {isProcessing ? "Analyzing DNA..." : file ? file.name : label}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "PDF, DOCX, TXT or Image"}
          </p>
        </div>
      </div>
    </div>
  );
}
