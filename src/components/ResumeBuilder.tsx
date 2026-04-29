import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileText, CheckCircle, Loader2, Download, Eye, Layout, 
  RefreshCw, FileCode, FileType, Printer, 
  Maximize2, Minimize2, Zap, AlertCircle, MousePointerClick, Hand, Star, X, Lock, Globe, Linkedin,
  Sparkles, Rocket, Code, Settings, LogIn
} from 'lucide-react';
import { analyzeLayout, generateResume, extractTextFromAny, getOptimizationPlan, checkMatch } from '../lib/gemini';
import mammoth from 'mammoth';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db, storage } from '../firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp, collection, addDoc, increment } from 'firebase/firestore';
import { ref, uploadString, deleteObject } from 'firebase/storage';
import { uploadWithRetry } from '../lib/storage';
import { handleFirestoreError, OperationType } from '../lib/firestore';

import { PLANS } from '../constants';

interface FileData {
  file: File;
  base64?: string;
  text?: string;
  type: string;
}

interface ResumeBuilderProps {
  userData: any;
  onUpgrade: () => void;
  user?: any;
  onLogin?: () => void;
}

export default function ResumeBuilder({ userData, onUpgrade, user, onLogin }: ResumeBuilderProps) {
  const [hasUsedFreeMorph, setHasUsedFreeMorph] = useState(() => {
    return localStorage.getItem('hasUsedFreeMorph') === 'true';
  });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isGuestBooting, setIsGuestBooting] = useState(false);
  const [guestLoadingStep, setGuestLoadingStep] = useState(0);
  const [isSyncingModal, setIsSyncingModal] = useState(false);
  const [isLoginPendingForDownload, setIsLoginPendingForDownload] = useState(false);
  const usedMorphs = userData?.usedMorphs !== undefined ? userData.usedMorphs : (userData?.morphCount || 0);
  const planLimit = userData?.planLimit === -1 ? Infinity : (userData?.planLimit || PLANS[0].limit);
  const progress = planLimit === Infinity ? 0 : Math.min((usedMorphs / (planLimit as number)) * 100, 100);
  const [referenceFile, setReferenceFile] = useState<FileData | null>(null);
  const [contentFile, setContentFile] = useState<FileData | null>(null);
  const [layoutAnalysis, setLayoutAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
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
  const [matchDescription, setMatchDescription] = useState('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [showSurprise, setShowSurprise] = useState(false);

  // Consolidated states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingResume, setPendingResume] = useState<{ html: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [strictLayout, setStrictLayout] = useState(true);
  const [lengthMode, setLengthMode] = useState<'1-page' | '2-page' | 'executive'>('1-page');
  const [linkedinText, setLinkedinText] = useState('');
  const [isImportingLinkedIn, setIsImportingLinkedIn] = useState(false);

  useEffect(() => {
    if (userData?.showResetSurprise) {
      setShowSurprise(true);
    }
  }, [userData?.showResetSurprise]);

  useEffect(() => {
    const checkAuthAndDismiss = () => {
      if ((user || auth.currentUser) && showLoginPrompt) {
        setShowLoginPrompt(false);
        setIsLoginPendingForDownload(false);
      }
    };
    checkAuthAndDismiss();
  }, [user, showLoginPrompt]);

  const dismissResetSurprise = async () => {
    if (!auth.currentUser) return;
    setShowSurprise(false);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        showResetSurprise: false
      });
    } catch (err) {
      console.error("Failed to dismiss reset surprise:", err);
    }
  };

  const dismissRevokeNotice = async () => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        showRevokeNotice: false,
        revokeReason: null
      });
    } catch (err) {
      console.error("Failed to dismiss revoke notice:", err);
    }
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const onDropReference = async (acceptedFiles: File[]) => {
    if (!checkUsageLimits('morph')) return;

    const file = acceptedFiles[0];
    if (!file) return;

    // Supported formats check
    const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isOldWord = file.type === 'application/msword' || file.name.endsWith('.doc');
    const isText = ['text/plain', 'text/html', 'application/json'].includes(file.type) || /\.(txt|html|htm|json)$/i.test(file.name);
    const isAiSupported = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type);

    if (!isWord && !isOldWord && !isText && !isAiSupported) {
      setError("Unsupported file format. Please upload PDF, Word, HTML, JSON, or Text files.");
      return;
    }

    setError(null);
    try {
      let text = '';
      if (isWord) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (isText) {
        text = await file.text();
      }

      // Fallback to server-side extraction for formats we can't parse locally (like .doc)
      if (!text && !['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        const formData = new FormData();
        formData.append('resume', file);
        try {
          const response = await fetch('/api/extract-text', {
            method: 'POST',
            body: formData
          });
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await response.json();
              text = data.text;
            } else {
              console.warn("Server preferred HTML/Text over JSON. Likely a session check.");
            }
          }
        } catch (fetchErr) {
          console.error("Server extraction fallback failed:", fetchErr);
        }
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
    if (!checkUsageLimits('morph')) return;

    const file = acceptedFiles[0];
    if (!file) return;

    // Supported formats check
    const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isOldWord = file.type === 'application/msword' || file.name.endsWith('.doc');
    const isText = ['text/plain', 'text/html', 'application/json'].includes(file.type) || /\.(txt|html|htm|json)$/i.test(file.name);
    const isAiSupported = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type);

    if (!isWord && !isOldWord && !isText && !isAiSupported) {
      setError("Unsupported file format. Please upload PDF, Word, HTML, JSON, or Text files.");
      return;
    }

    setError(null);
    try {
      let text = '';
      if (isWord) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (isText) {
        text = await file.text();
      } else {
        // Fallback for doc/pdf/images - we try server extraction for .doc specifically
        if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
          const formData = new FormData();
          formData.append('resume', file);
          try {
            const response = await fetch('/api/extract-text', {
              method: 'POST',
              body: formData
            });
            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                text = data.text;
              } else {
                console.warn("Server returned non-JSON response. Falling back.");
              }
            }
          } catch (fetchErr) {
            console.error("Server extraction fallback failed:", fetchErr);
          }
        }
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
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (!auth.currentUser || !userData) return;
    setIsSaving(true);
    
    // Optimistically close modal to make it feel instant
    setShowSaveModal(false);
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      let currentHistory = userData?.resumeHistory || [];
      
      const resumeId = replaceId || crypto.randomUUID();
      const storagePath = `resumes/${auth.currentUser.uid}/${resumeId}.html`;
      const resumeRef = ref(storage, storagePath);

      const newResume = {
        id: resumeId,
        name: name || 'Untitled Resume',
        timestamp: new Date().toISOString(),
        html: html, // Keep HTML in Firestore for quick access
        originalText: contentFile.text || '', // Save original text for diffing
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

      // Parallelize Storage and Firestore updates
      // We don't strictly need to await Storage upload for the UI to feel "saved"
      // because the HTML is already in Firestore.
      uploadWithRetry(resumeRef, html, 'raw', { contentType: 'text/html' }).catch(err => console.error("Background storage upload failed:", err));
      
      await updateDoc(userRef, {
        resumeHistory: updatedHistory,
        lastActivityAt: serverTimestamp()
      });
      
      setPendingResume(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      setError("Background save failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Helper Functions ---

  const checkUsageLimits = (actionType: 'morph' | 'check') => {
    if (!userData) return true;

    if (actionType === 'morph' && userData.morphCount === 1 && !userData.hasReviewed) {
      setShowFeedbackModal(true);
      return false;
    }

    const limit = userData?.planLimit || PLANS[0].limit;
    if (limit !== -1 && usedMorphs >= limit) {
      onUpgrade();
      return false;
    }

    return true;
  };

  const deductMorphCredit = async () => {
    if (!auth.currentUser || !userData) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const isPremium = userData?.plan && userData?.plan !== 'free';
      await updateDoc(userRef, {
        usedMorphs: increment(1),
        freeMorphsUsed: !isPremium ? increment(1) : (userData?.freeMorphsUsed || 0),
        premiumMorphsUsed: isPremium ? increment(1) : (userData?.premiumMorphsUsed || 0),
        remainingMorphs: userData?.planLimit === -1 ? 999 : increment(-1),
        morphCount: increment(1)
      });
    } catch (err) {
      console.error("Failed to deduct credit:", err);
    }
  };

  const handleAiError = (err: any, fallback: string) => {
    console.error(err);
    if (err.message === "API_KEY_MISSING") {
      return "AI configuration is missing. Please contact support.";
    }
    if (err.message === "QUOTA_EXCEEDED") {
      return "Daily AI limit reached. Please try again later.";
    }
    return fallback;
  };

  const applyGenerationResult = (result: any) => {
    setGeneratedHtml(result.html);
    setResumeMetadata({ name: result.name, yoe: result.yoe, profile: result.profile });
    setAtsScore(result.atsScore);
    setAtsFeedback(result.atsFeedback);
    setMatchScore(result.matchScore);
    setMissingKeywords(result.missingKeywords);
    setLayoutAnalysis(result.layoutAnalysis);

    if (!contentFile?.text && result.extractedText) {
      setContentFile(prev => prev ? { ...prev, text: result.extractedText } : null);
    }

    setPendingResume({ html: result.html, name: result.name });
    setShowSaveModal(true);
  };

  const runGuestBooting = async () => {
    if (user || hasUsedFreeMorph) return;
    
    setIsGuestBooting(true);
    const messages = ["Initializing Morph Core...", "Injecting Neural Processing...", "Calibrating Style Engine v2.0...", "Establishing Guest Workspace...", "Ready to Morph."];
    for (let i = 0; i < messages.length; i++) {
      setGuestLoadingStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsGuestBooting(false);
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

    if (!user && hasUsedFreeMorph) {
      setShowLoginPrompt(true);
      return;
    }

    await runGuestBooting();
    if (!user && hasUsedFreeMorph) {
      setShowLoginPrompt(true);
      return;
    }
    
    if (!checkUsageLimits('morph')) return;

    setIsGenerating(true);
    setGenerationStatus('Cloning layout...');
    setError(null);
    
    try {
      const result = await generateResume(
        { base64: referenceFile.base64, mimeType: referenceFile.type, text: referenceFile.text },
        { base64: contentFile.base64, mimeType: contentFile.type, text: contentFile.text },
        jobDescription,
        false,
        layoutAnalysis,
        strictLayout,
        { lengthMode }
      );

      setGenerationStatus('Optimizing content...');
      applyGenerationResult(result);

      if (!user) {
        setHasUsedFreeMorph(true);
        localStorage.setItem('hasUsedFreeMorph', 'true');
        setTimeout(() => {
          setShowLoginPrompt(true);
          setIsSyncingModal(true);
          setTimeout(() => setIsSyncingModal(false), 2000);
        }, 1500);
      } else {
        await deductMorphCredit();
      }
    } catch (err: any) {
      setError(handleAiError(err, "Failed to generate resume. Please try again."));
    } finally {
      setIsAnalyzing(false);
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleAnalyzeStyle = async () => {
    if (!referenceFile) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      let currentLayout = layoutAnalysis;
      if (!currentLayout) {
        if (referenceFile.text) {
          currentLayout = await analyzeLayout(undefined, undefined, referenceFile.text);
        } else if (referenceFile.base64) {
          currentLayout = await analyzeLayout(referenceFile.base64.split(',')[1], referenceFile.type);
        }
        setLayoutAnalysis(currentLayout);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING") {
        setError("AI configuration is missing. Please contact support.");
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
    if (!checkUsageLimits('morph')) return;

    setIsGenerating(true);
    setGenerationStatus('Tailoring resume...');
    setError(null);
    try {
      const result = await generateResume(
        { base64: referenceFile.base64, mimeType: referenceFile.type, text: referenceFile.text },
        { base64: contentFile.base64, mimeType: contentFile.type, text: contentFile.text },
        jobDescription,
        false,
        layoutAnalysis,
        strictLayout,
        { lengthMode }
      );
      setGenerationStatus('Perfecting layout...');
      applyGenerationResult(result);
      await deductMorphCredit();
    } catch (err: any) {
      setError(handleAiError(err, "Failed to re-optimize resume. Please try again."));
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleCheckMatch = async () => {
    if (!checkUsageLimits('check')) return;

    if (!matchDescription) {
      setError("Please paste a job description first.");
      return;
    }
    if (!contentFile?.text) {
      setError("Please upload your resume first.");
      return;
    }

    setIsMatching(true);
    setGenerationStatus('Scanning job description...');
    setError(null);
    try {
      const result = await checkMatch(contentFile.text, matchDescription);
      setMatchScore(result.score);
      setMissingKeywords(result.missing);
    } catch (err: any) {
      setError(handleAiError(err, "Failed to analyze match. Please try again."));
    } finally {
      setIsMatching(false);
      setGenerationStatus('');
    }
  };

  const handleMaximizeAts = async () => {
    if (!checkUsageLimits('morph')) return;
    setIsPlanning(true);
    setGenerationStatus('Developing ATS strategy...');
    setError(null);

    try {
      let currentLayout = layoutAnalysis;
      if (!currentLayout) {
        if (referenceFile?.base64) {
          currentLayout = await analyzeLayout(referenceFile.base64, referenceFile.type);
        } else if (referenceFile?.text) {
          currentLayout = await analyzeLayout(undefined, undefined, referenceFile.text);
        }
        if (currentLayout) setLayoutAnalysis(currentLayout);
      }

      let currentText = contentFile?.text;
      if (!currentText && contentFile?.base64) {
        currentText = await extractTextFromAny(contentFile.base64, contentFile.type);
        if (currentText) {
          setContentFile(prev => prev ? { ...prev, text: currentText } : null);
        }
      }

      if (!currentLayout || !currentText) {
        throw new Error("Missing structural analysis or content text. Please try generating a resume first.");
      }

      const plan = await getOptimizationPlan(currentText, jobDescription);
      setOptimizationPlan(plan);
      setShowPlanModal(true);
    } catch (err: any) {
      console.error("Maximize ATS error:", err);
      if (err.message === "QUOTA_EXCEEDED") {
        setError("Daily AI limit reached. Please try again later.");
      } else if (err.message === "API_KEY_MISSING") {
        setError("AI Engine is currently unavailable. Please check back later.");
      } else {
        setError(err.message || "Failed to generate optimization plan. Please try again.");
      }
    } finally {
      setIsPlanning(false);
      setGenerationStatus('');
    }
  };

  const confirmMaximizeAts = async () => {
    if (!referenceFile || !contentFile) return;
    if (!checkUsageLimits('morph')) return;

    setShowPlanModal(false);
    setIsGenerating(true);
    setGenerationStatus('Maximizing ATS score...');
    setError(null);
    try {
      const result = await generateResume(
        { base64: referenceFile.base64, mimeType: referenceFile.type, text: referenceFile.text },
        { base64: contentFile.base64, mimeType: contentFile.type, text: contentFile.text },
        jobDescription,
        true,
        layoutAnalysis,
        strictLayout,
        { lengthMode }
      );
      setGenerationStatus('Applying keywords...');
      applyGenerationResult(result);
      await deductMorphCredit();
    } catch (err: any) {
      setError(handleAiError(err, "An error occurred. Please try again."));
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };
  
  const handleLinkedInImport = async () => {
    if (!linkedinText) return;
    setIsImportingLinkedIn(false);
    setIsGenerating(true);
    try {
      // We'll treat the text as "content" - creating a minimal File-like object or adjusting the state
      setContentFile({
        file: new File([linkedinText], 'LinkedIn_Profile.txt', { type: 'text/plain' }),
        type: 'text/plain',
        text: linkedinText
      });
    } catch (e) {
      console.error(e);
      setError("Failed to import LinkedIn data.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    if (!generatedHtml) return;
    // In a real app we'd save to firebase and get a public ID
    // For now, we'll copy the current app URL or a mock share URL
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    alert("Share link copied! (Mock - would be a direct resume URL in production)");
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
    if (!user) {
      setShowLoginPrompt(true);
      setIsLoginPendingForDownload(true);
      return;
    }
    if (!generatedHtml) return;
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 2rem; background: white; }
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
    if (!user) {
      setShowLoginPrompt(true);
      setIsLoginPendingForDownload(true);
      return;
    }
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
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 2rem; background: white; }
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
    if (!user) {
      setShowLoginPrompt(true);
      setIsLoginPendingForDownload(true);
      return;
    }
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
    <div className="text-[#1A1A1A] font-sans selection:bg-indigo-100">
      {/* Notification Banners */}
      <AnimatePresence>
        {userData?.showRevokeNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-600 text-white overflow-hidden sticky top-0 z-[120]"
          >
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-black uppercase tracking-widest">
                  Premium Revoked: {userData?.revokeReason || 'Policy Violation'}
                </p>
              </div>
              <button 
                onClick={dismissRevokeNotice}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {userData?.adminMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-indigo-600 text-white overflow-hidden sticky top-0 z-[120]"
          >
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 shrink-0" />
                <p className="text-sm font-black uppercase tracking-widest">
                  {userData?.adminMessage}
                </p>
              </div>
              <button 
                onClick={async () => {
                  if (!auth.currentUser) return;
                  const userRef = doc(db, 'users', auth.currentUser.uid);
                  await updateDoc(userRef, { adminMessage: null });
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surprise Popup */}
      <AnimatePresence>
        {showSurprise && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissResetSurprise}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[var(--bg-primary)] rounded-[48px] shadow-2xl overflow-hidden border border-[var(--border-color)] text-center p-10"
            >
              <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-[32px] flex items-center justify-center mx-auto mb-8 relative">
                <Star className="w-12 h-12 text-amber-600 fill-amber-600 animate-bounce" />
                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  +2 Bonus
                </div>
              </div>
              
              <h2 className="text-4xl font-black text-[var(--text-primary)] mb-4 tracking-tight">Surprise! 🎁</h2>
              <p className="text-[var(--text-secondary)] font-medium mb-8 leading-relaxed">
                An administrator has reset your usage and added <span className="text-indigo-600 font-black">+2 bonus credits</span> to your plan! Enjoy your fresh start.
              </p>

              <button
                onClick={dismissResetSurprise}
                className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
              >
                Awesome, Thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header - Simplified for Global Header Context */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-10 py-5 md:py-6 flex flex-col sm:flex-row items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50 backdrop-blur-sm sticky top-[64px] md:top-[140px] z-40 rounded-b-2xl md:rounded-b-[40px] shadow-sm mb-6 md:mb-8 gap-4 sm:gap-2">
        <div className="flex items-center gap-3 md:gap-4 justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Engine Online</span>
          </div>
          <div className="h-3 w-px bg-[var(--border-color)] hidden sm:block" />
          <p className="text-[10px] md:text-[11px] font-bold text-[var(--text-tertiary)]">Structural Mirroring Active</p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto justify-end">
          {generatedHtml && (
            <div className="relative flex-grow sm:flex-grow-0">
              <button 
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                title="Export Resume: Download as PDF, Word, or HTML"
                className="w-full sm:w-auto flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black hover:opacity-90 hover:shadow-2xl transition-all active:scale-95 shadow-xl shadow-gray-200 dark:shadow-none uppercase tracking-widest sm:normal-case sm:tracking-normal"
              >
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Export</span>
                <span className="hidden sm:inline">Resume</span>
                <Hand className={cn("w-3.5 h-3.5 md:w-4 md:h-4 transition-transform", showDownloadMenu && "rotate-12")} />
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
                      className="absolute right-0 mt-3 w-64 bg-[var(--bg-primary)] rounded-[24px] shadow-2xl border border-[var(--border-color)] p-2 z-20 overflow-y-auto max-h-[80vh] scrollbar-hide"
                    >
                      <button 
                        onClick={handleDownloadHTML}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-secondary)] rounded-xl flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                          <FileCode className="w-4 h-4 text-orange-600 group-hover:text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[var(--text-primary)]">Download HTML</span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">Perfect for web viewing</span>
                        </div>
                      </button>
                      <button 
                        onClick={handleDownloadWord}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-secondary)] rounded-xl flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                          <FileType className="w-4 h-4 text-blue-600 group-hover:text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[var(--text-primary)]">Download Word</span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">Editable .doc format</span>
                        </div>
                      </button>
                      <div className="h-px bg-[var(--border-color)] my-2 mx-2" />
                      <button 
                        onClick={handlePrintPDF}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-secondary)] rounded-xl flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                          <Printer className="w-4 h-4 text-purple-600 group-hover:text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[var(--text-primary)]">Save as PDF</span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">High-fidelity print</span>
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
              title="Reset All: Clear current files and start fresh"
              className="p-3 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-sm rounded-2xl transition-all disabled:opacity-30 group"
            >
              <MousePointerClick className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          )}
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-1 sm:px-4 md:px-8 py-4">
        {/* Morph Stats Bar */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-3xl md:rounded-[32px] p-5 md:p-8 shadow-sm">
            <div className="flex items-center gap-4 md:gap-5 w-full lg:w-auto">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-[22px] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-100 dark:shadow-none shrink-0">
                <Zap className="w-6 h-6 md:w-7 md:h-7 text-white fill-white" />
              </div>
              <div className="flex-grow">
                <p className="text-[9px] md:text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-1">Morph Engine Status</p>
                <div className="flex items-center gap-3">
                  <span className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                    {planLimit === Infinity ? 'Unlimited' : `${usedMorphs} / ${planLimit}`}
                  </span>
                  <span className="px-2 py-0.5 md:px-3 md:py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
                    {(() => {
                      const currentPlan = PLANS.find(p => p.id === (userData?.plan || 'free')) || PLANS[0];
                      return `${currentPlan.name} Plan`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block h-14 w-px bg-[var(--border-color)] mx-2" />
            
            <div className="flex items-center justify-between w-full lg:w-auto gap-4 bg-[var(--bg-tertiary)] px-4 md:px-6 py-3 rounded-2xl border border-[var(--border-color)]">
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest leading-none">Strict Layout</span>
                <span className="text-[7px] md:text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Structural Mirror</span>
              </div>
              <button 
                onClick={() => setStrictLayout(!strictLayout)}
                className={cn(
                  "w-10 h-5 md:w-12 md:h-6 rounded-full transition-all relative shrink-0",
                  strictLayout ? "bg-indigo-600" : "bg-[var(--border-color)]"
                )}
              >
                <motion.div 
                  animate={{ x: strictLayout ? (window.innerWidth < 768 ? 20 : 24) : 4 }}
                  className="absolute top-0.5 md:top-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="hidden lg:block h-14 w-px bg-gray-200/50 mx-2" />
            
            <div className="w-full lg:flex-grow lg:max-w-md">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <p className="text-[9px] md:text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Credits</p>
                <p className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  {planLimit === Infinity ? '∞' : Math.max(0, (planLimit as number) - usedMorphs)} Morphs Left
                </p>
              </div>
              <div className="w-full h-2.5 md:h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-color)] shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${planLimit === Infinity ? 0 : progress}%` }}
                  className="h-full bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                />
              </div>
            </div>

            {planLimit !== Infinity && usedMorphs >= (planLimit as number) && (
              <button 
                onClick={onUpgrade}
                className="w-full lg:w-auto px-6 md:px-8 py-4 bg-indigo-600 text-white rounded-xl md:rounded-[20px] text-[10px] md:text-sm font-black uppercase tracking-widest md:tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group"
              >
                <Zap className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                Upgrade Now
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start px-2 sm:px-0">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="bg-[var(--bg-primary)] p-5 md:p-8 rounded-3xl md:rounded-[32px] border border-[var(--border-color)] shadow-sm space-y-6 md:space-y-10">
              
              <section>
                <div className="flex flex-col xs:flex-row xs:items-center gap-3 mb-5 md:mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-100 shrink-0">1</div>
                    <h2 className="font-black text-lg md:text-xl tracking-tight text-[var(--text-primary)]">The Content</h2>
                  </div>
                  <button
                    onClick={() => setIsImportingLinkedIn(true)}
                    title="Import your professional data directly from your LinkedIn profile to save time"
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-900/30 w-fit ml-auto xs:ml-0"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span className="xs:hidden">Linked</span>
                    <span className="hidden xs:inline">Import LinkedIn</span>
                  </button>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed font-medium">
                  Upload the resume layout you want to clone. We'll analyze its visual DNA.
                </p>
                
                <Dropzone 
                  id="builder-reference-upload"
                  onDrop={onDropReference} 
                  isProcessing={isAnalyzing} 
                  file={referenceFile?.file}
                  label="Upload Reference Layout (PDF/Image)"
                  color="indigo"
                  disabled={(() => {
                    const limit = userData?.planLimit || PLANS[0].limit;
                    return limit !== -1 && usedMorphs >= limit;
                  })()}
                />

                <div className="mt-4">
                  <a 
                    href="https://word.cloud.microsoft/create/en/resume-templates/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 border-2 border-dashed border-[var(--border-color)] hover:border-indigo-400 hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 group"
                  >
                    <Layout className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Browse Free Reference Layouts
                  </a>
                </div>
                
                {referenceFile && !layoutAnalysis && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleAnalyzeStyle}
                    disabled={isAnalyzing || isGenerating}
                    className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <MousePointerClick className="w-3 h-3" />}
                    {isAnalyzing ? "Analyzing Style..." : "Analyze Style"}
                  </motion.button>
                )}
                
                {layoutAnalysis && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Style Captured</p>
                  </motion.div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-100">2</div>
                    <h2 className="font-black text-xl tracking-tight text-[var(--text-primary)]">Optimization</h2>
                  </div>
                  {jobDescription && (
                    <button 
                      onClick={() => setJobDescription('')}
                      title="Clear the current job description"
                      className="text-[10px] font-bold text-[var(--text-tertiary)] hover:text-red-500 uppercase tracking-wider transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                  Target a specific role? Paste the job description or requirements below.
                </p>
                <div className="relative">
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    className={cn(
                      "w-full h-32 p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-[var(--bg-primary)] transition-all resize-none placeholder:text-[var(--text-tertiary)]",
                      jobDescription && "border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-900/10"
                    )}
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none">
                    {jobDescription ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
                        <RefreshCw className="w-2.5 h-2.5 text-white animate-spin-slow" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">AI Ready</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest opacity-50">Optional</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] font-bold leading-relaxed">
                  * AI will emphasize relevant skills without removing your original data or adding fake skills.
                </p>

                {generatedHtml && jobDescription && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleOptimize}
                    disabled={isGenerating}
                    title="Run the Morph Engine with Job Description matching"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 group border border-indigo-500"
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

              <section className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-amber-100">3</div>
                    <h2 className="font-black text-xl tracking-tight text-[var(--text-primary)]">Smart Length</h2>
                  </div>
                  <div className="flex p-1 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                    {[
                      { id: '1-page', label: '1 Page', sub: 'Standard' },
                      { id: '2-page', label: '2 Pages', sub: 'Senior' },
                      { id: 'executive', label: 'Executive', sub: 'Impact' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setLengthMode(mode.id as any)}
                        title={`Switch to ${mode.label} mode for ${mode.sub} profiles`}
                        className={cn(
                          "flex-1 py-3 px-2 rounded-xl transition-all flex flex-col items-center",
                          lengthMode === mode.id ? "bg-[var(--bg-primary)] text-indigo-600 shadow-sm ring-1 ring-indigo-50 dark:ring-indigo-900/30" : "text-[var(--text-tertiary)] hover:text-indigo-600"
                        )}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                        <span className="text-[8px] font-bold opacity-50">{mode.sub}</span>
                      </button>
                    ))}
                  </div>
              </section>

              <section className="transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-100">4</div>
                    <h2 className="font-black text-xl tracking-tight text-[var(--text-primary)]">Your Content</h2>
                  </div>
                  <button 
                    onClick={() => setIsImportingLinkedIn(true)}
                    className="flex items-center gap-2 group/btn"
                  >
                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover/btn:text-indigo-400 transition-colors">LinkedIn Import</span>
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </button>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed font-medium">
                  Upload your data. We'll morph it into the reference style.
                </p>
                
                <Dropzone 
                  onDrop={onDropContent} 
                  isProcessing={isGenerating} 
                  file={contentFile?.file}
                  label="Upload Your Content (Resume/Doc)"
                  color="indigo"
                  disabled={(() => {
                    const limit = userData?.planLimit || PLANS[0].limit;
                    return limit !== -1 && usedMorphs >= limit;
                  })()}
                />

                {referenceFile && contentFile && !generatedHtml && (
                  (() => {
                    const limit = userData?.planLimit || PLANS[0].limit;
                    const isOverLimit = limit !== -1 && usedMorphs >= limit;
                    return isOverLimit;
                  })() ? (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={onUpgrade}
                      title="Upgrade to Premium for unlimited morphs and advanced features"
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
                      title="Click to start the Morphing process using your data and the reference style"
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

              <section className={cn("transition-all duration-500 pt-6 border-t border-[var(--border-color)]", !contentFile && "opacity-30 pointer-events-none blur-[1px]")}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-100">5</div>
                  <h2 className="font-black text-xl tracking-tight text-[var(--text-primary)]">Match Analysis</h2>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed font-medium">
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
                      className="p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Match Score</span>
                        <span className={cn(
                          "text-2xl font-black",
                          matchScore >= 80 ? "text-green-600 dark:text-green-400" : matchScore >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
                        )}>{matchScore}%</span>
                      </div>
                      
                      {missingKeywords.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Missing Keywords
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {missingKeywords.map((kw) => (
                              <span key={kw} className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
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

              <section className="pt-6 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-green-100">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <h2 className="font-black text-lg tracking-tight text-[var(--text-primary)]">ATS Morph Engine</h2>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                    Our engine now automatically optimizes your resume for **Applicant Tracking Systems (ATS)**. 
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Standardized section headings",
                      "Linear HTML structure for parsing",
                      "Keyword density optimization",
                      "Clean, searchable typography"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
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
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider text-center space-y-3"
                >
                  <p>{error}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className={cn(
            "transition-all duration-700 ease-in-out w-full",
            isPreviewFull 
              ? "fixed inset-0 z-[200] bg-[var(--bg-primary)] p-4 md:p-8 overflow-y-auto" 
              : "lg:col-span-8 lg:sticky lg:top-32"
          )}>
            <div className={cn(
              "bg-[var(--bg-primary)] rounded-[24px] md:rounded-[40px] border border-[var(--border-color)] shadow-2xl shadow-indigo-200/20 flex flex-col overflow-hidden group transition-all duration-500",
              isPreviewFull ? "min-h-screen w-full max-w-5xl mx-auto" : "min-h-[500px] md:min-h-[850px]"
            )}>
              <div className="h-14 md:h-16 border-b border-[var(--border-color)] px-4 md:px-10 flex items-center justify-between bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3 md:gap-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-[10px] md:text-xs font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Preview</span>
                  </div>
                  
                  {atsScore !== null && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 md:gap-3 pl-3 md:pl-6 border-l border-[var(--border-color)]"
                    >
                      <div className={cn(
                        "px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 md:gap-2",
                        atsScore >= 80 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : 
                        atsScore >= 50 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" : 
                        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      )}>
                        ATS: {atsScore}%
                      </div>
                      {atsFeedback && (
                        <span className="hidden sm:inline text-[10px] font-bold text-[var(--text-tertiary)] truncate max-w-[100px] md:max-w-[200px]" title={atsFeedback}>
                          {atsFeedback}
                        </span>
                      )}
                      {atsScore < 100 && (
                        <button
                          onClick={handleMaximizeAts}
                          disabled={isGenerating || isPlanning}
                          title="Let AI optimize your resume structure for high ATS compatibility"
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
                      onClick={handleShare}
                      title="Generate a public link for your resume"
                      className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm text-[var(--text-primary)]"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Share Link</span>
                    </button>
                  )}
                  {generatedHtml && (
                    <button 
                      onClick={() => setIsPreviewFull(!isPreviewFull)}
                      title={isPreviewFull ? "Exit fullscreen" : "Full View"}
                      className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm text-[var(--text-primary)]"
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
                    <div className="w-3 h-3 rounded-full bg-[var(--border-color)] group-hover:bg-red-400 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-[var(--border-color)] group-hover:bg-yellow-400 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-[var(--border-color)] group-hover:bg-green-400 transition-colors" />
                  </div>
                </div>
              </div>

              <div className={cn(
                "flex-1 p-0 bg-white relative",
                isPreviewFull ? "h-auto" : "overflow-hidden"
              )}>
                {/* Watermark for guests */}
                {!user && generatedHtml && (
                  <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none opacity-[0.05] rotate-[-15deg] select-none scale-150 overflow-hidden">
                    <div className="flex flex-col items-center">
                      <h1 className="text-9xl font-black uppercase">Morph Engine</h1>
                      <h2 className="text-4xl font-black uppercase tracking-widest mt-4">Draft Preview</h2>
                      <div className="mt-20 flex flex-col items-center">
                        <h1 className="text-9xl font-black uppercase">Morph Engine</h1>
                        <h2 className="text-4xl font-black uppercase tracking-widest mt-4">Draft Preview</h2>
                      </div>
                    </div>
                  </div>
                )}
                <AnimatePresence mode="wait">
                  {isGuestBooting ? (
                    <motion.div
                      key="guest-booting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[200] bg-indigo-600 flex flex-col items-center justify-center p-6 text-white"
                    >
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                      
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full text-center"
                      >
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                          <RefreshCw className="w-10 h-10 text-white animate-spin-slow" />
                          <motion.div 
                            initial={{ top: '100%' }}
                            animate={{ top: '-100%' }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-white/20"
                          />
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                            Morph Engine <br/>
                            <span className="text-white/60 text-lg">Booting Intelligence...</span>
                          </h3>
                          
                          <div className="h-1 w-48 bg-white/20 rounded-full mx-auto overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${((guestLoadingStep + 1) / 5) * 100}%` }}
                              className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                            />
                          </div>

                          <AnimatePresence mode="wait">
                            <motion.p
                              key={guestLoadingStep}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="text-white/80 font-bold uppercase tracking-widest text-[8px]"
                            >
                              {[
                                "Initializing Morph Core...",
                                "Injecting Neural Processing...",
                                "Calibrating Style Engine v2.0...",
                                "Establishing Guest Workspace...",
                                "Ready to Morph."
                              ][guestLoadingStep]}
                            </motion.p>
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : isGenerating ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 bg-[var(--bg-primary)] z-10"
                    >
                      <div className="relative">
                        <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-900/30 border-t-indigo-600 rounded-full animate-spin" />
                        <RefreshCw className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
                      </div>
                      <div className="space-y-4 w-full max-w-sm px-6">
                        <div>
                          <p className="font-black text-2xl tracking-tight text-[var(--text-primary)]">{generationStatus || 'Morphing Content...'}</p>
                          <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">Applying visual DNA to your professional data</p>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden px-0 border border-[var(--border-color)]">
                          <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 15, ease: "linear" }}
                            className="h-full bg-indigo-600 rounded-full"
                          />
                        </div>
                        <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Est. time: 15-20 seconds</p>
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
                            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
                            <style>
                              body { 
                                font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; 
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
                              @media (max-width: 800px) {
                                body { padding: 1rem; }
                                .resume-container {
                                  transform: scale(var(--scale, 1));
                                }
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
                              .watermark {
                                position: fixed;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%) rotate(-45deg);
                                font-size: 120px;
                                font-weight: 900;
                                color: rgba(0, 0, 0, 0.05);
                                white-space: nowrap;
                                pointer-events: none;
                                z-index: 1000;
                                text-transform: uppercase;
                                letter-spacing: 0.2em;
                                user-select: none;
                              }
                            </style>
                          </head>
                          <body>
                            <div class="resume-container">
                              ${generatedHtml}
                            </div>
                            ${!user ? '<div class="watermark">MORPH ENGINE GUEST</div>' : ''}
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
                      className="h-full flex flex-col items-center justify-center text-center p-12 min-h-[784px] bg-[var(--bg-primary)]"
                    >
                      <div className="w-40 h-40 bg-[var(--bg-secondary)] rounded-[40px] flex items-center justify-center mb-8 rotate-3 border border-[var(--border-color)]">
                        <Layout className="w-20 h-20 text-[var(--text-tertiary)] opacity-20" />
                      </div>
                      <div className="max-w-sm">
                        <h3 className="font-black text-2xl tracking-tight text-[var(--text-tertiary)] opacity-30">Awaiting Morph</h3>
                        <p className="text-sm text-[var(--text-tertiary)] font-medium mt-3 leading-relaxed opacity-50">
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
              className="relative w-full max-w-2xl bg-[var(--bg-primary)] rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[var(--border-color)]"
            >
              <div className="p-8 sm:p-12 flex flex-col h-full overflow-y-auto">
                <div className="flex items-center gap-5 mb-10">
                   <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none shrink-0">
                    <Zap className="w-8 h-8 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-3xl tracking-tight text-[var(--text-primary)]">Optimization Plan</h3>
                    <p className="text-base text-[var(--text-secondary)] font-medium">Proposed changes for 100% ATS score</p>
                  </div>
                </div>

                <div className="space-y-5 mb-12 flex-1">
                  {optimizationPlan?.map((step, i) => (
                    <motion.div 
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-5 p-6 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)]"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-base font-bold text-[var(--text-primary)] leading-relaxed">
                        {step}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-5 mt-auto">
                  <button 
                    onClick={() => setShowPlanModal(false)}
                    className="flex-1 py-5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-3xl font-black text-sm uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmMaximizeAts}
                    className="flex-[2] py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-3"
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
            className="fixed bottom-0 left-0 right-0 z-[150] md:hidden p-4 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-t border-[var(--border-color)] shadow-2xl"
          >
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl"
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
                  className="absolute bottom-full left-4 right-4 mb-4 bg-[var(--bg-primary)] rounded-[32px] shadow-2xl border border-[var(--border-color)] p-3 z-20 overflow-y-auto max-h-[60vh] scrollbar-hide"
                >
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => { handleDownloadHTML(); setShowDownloadMenu(false); }}
                      className="w-full px-4 py-4 text-left text-sm hover:bg-[var(--bg-secondary)] rounded-2xl flex items-center gap-4 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <FileCode className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[var(--text-primary)]">HTML</span>
                        <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">Web format</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => { handleDownloadWord(); setShowDownloadMenu(false); }}
                      className="w-full px-4 py-4 text-left text-sm hover:bg-[var(--bg-secondary)] rounded-2xl flex items-center gap-4 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <FileType className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[var(--text-primary)]">Word</span>
                        <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">Editable .doc</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => { handlePrintPDF(); setShowDownloadMenu(false); }}
                      className="w-full px-4 py-4 text-left text-sm hover:bg-[var(--bg-secondary)] rounded-2xl flex items-center gap-4 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                        <Printer className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[var(--text-primary)]">PDF</span>
                        <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">Print ready</span>
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
              className="relative w-full max-w-lg bg-[var(--bg-primary)] rounded-[40px] shadow-2xl overflow-hidden border border-[var(--border-color)]"
            >
              <div className="p-8 md:p-10 text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[28px] flex items-center justify-center mx-auto mb-8">
                  <Star className="w-10 h-10 text-indigo-600 fill-indigo-600" />
                </div>
                
                <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4 tracking-tight">Unlock 1 More Morph!</h2>
                <p className="text-[var(--text-secondary)] font-medium mb-8 leading-relaxed">
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
                          rating >= star ? "text-yellow-400 fill-yellow-400" : "text-[var(--border-color)]"
                        )} 
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you think... (optional)"
                  className="w-full h-32 px-6 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-indigo-600 focus:bg-[var(--bg-primary)] rounded-[24px] text-sm font-medium transition-all outline-none resize-none mb-8 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                />

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={rating === 0 || isSubmittingFeedback}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                  >
                    {isSubmittingFeedback ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Unlock Now"
                    )}
                  </button>
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="w-full py-4 text-[var(--text-tertiary)] font-bold text-xs uppercase tracking-widest hover:text-[var(--text-secondary)] transition-colors"
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
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--bg-primary)] rounded-[2.5rem] shadow-2xl p-6 sm:p-10 border border-[var(--border-color)] space-y-6 sm:space-y-8 my-auto"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-indigo-100 dark:shadow-none">
                  <Download className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">Save Resume?</h3>
                  <p className="text-sm sm:text-base text-[var(--text-secondary)] font-medium">
                    {(() => {
                      const currentPlan = PLANS.find(p => p.id === (userData?.plan || 'free')) || PLANS[0];
                      return `Your ${currentPlan.name} plan allows up to ${currentPlan.historyLimit} saved resumes in your history.`;
                    })()}
                  </p>
                </div>
              </div>

              {userData?.resumeHistory?.length >= (PLANS.find(p => p.id === (userData?.plan || 'free'))?.historyLimit || 1) ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-widest text-center">Select a resume to replace</p>
                  <div className="grid gap-3">
                    {userData?.resumeHistory.map((resume: any) => (
                      <button
                        key={resume.id}
                        onClick={() => saveResumeToHistory(pendingResume.html, pendingResume.name, resume.id)}
                        disabled={isSaving}
                        className="flex items-center justify-between p-3 sm:p-4 bg-[var(--bg-secondary)] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl sm:rounded-2xl border border-[var(--border-color)] hover:border-indigo-200 transition-all group text-left"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-indigo-600 shrink-0" />
                          <span className="text-sm font-bold text-[var(--text-primary)] truncate">{resume.name}</span>
                        </div>
                        <RefreshCw className="w-4 h-4 text-[var(--border-color)] group-hover:text-indigo-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => saveResumeToHistory(pendingResume.html, pendingResume.name)}
                    disabled={isSaving}
                    className="w-full py-4 sm:py-5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
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
                className="w-full py-2 sm:py-4 text-[var(--text-tertiary)] font-bold text-xs uppercase tracking-widest hover:text-[var(--text-secondary)] transition-colors"
              >
                No, Don't Save
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LinkedIn Import Modal */}
      <AnimatePresence>
        {isImportingLinkedIn && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-y-auto bg-[var(--bg-primary)]/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-[var(--bg-primary)] rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden p-6 sm:p-10 space-y-6 sm:space-y-8 border border-[var(--border-color)] my-auto"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-[1rem] sm:rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-100 md:shadow-none">
                  <Linkedin className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">LinkedIn Import</h2>
                <p className="text-xs sm:text-sm font-medium text-[var(--text-tertiary)]">Paste your profile data or PDF text to convert it into a baseline resume.</p>
              </div>

              <div className="space-y-6">
                <textarea
                  value={linkedinText}
                  onChange={(e) => setLinkedinText(e.target.value)}
                  placeholder="Paste your 'About', 'Experience', and 'Skills' from LinkedIn profile..."
                  className="w-full h-40 sm:h-60 p-4 sm:p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[1.5rem] sm:rounded-[32px] text-[var(--text-primary)] text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:bg-[var(--bg-primary)] outline-none resize-none transition-all placeholder:text-[var(--text-tertiary)]"
                />
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => setIsImportingLinkedIn(false)}
                    className="flex-1 py-3 sm:py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLinkedInImport}
                    disabled={!linkedinText}
                    className="flex-1 sm:flex-[2] py-3 sm:py-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group order-1 sm:order-2"
                  >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Process & Import
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Redesigned Login Prompt Overlay */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] p-6 sm:p-10 md:p-12 lg:p-16 max-w-2xl w-full mx-auto shadow-[0_32px_120px_-15px_rgba(79,70,229,0.5)] relative overflow-hidden text-center my-auto"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />

              <button 
                onClick={() => setShowLoginPrompt(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 p-2 sm:p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all hover:rotate-90 z-20"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
                <div className="relative z-10">
                  {isSyncingModal ? (
                    <div className="py-8 sm:py-12 space-y-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-xl relative overflow-hidden">
                        <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin" />
                        <motion.div 
                          className="absolute inset-0 bg-white/20"
                          animate={{ top: ['100%', '-100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg sm:text-xl font-black uppercase italic text-slate-800 dark:text-white">Processing Intelligence</h4>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px] sm:text-[10px]">Syncing with Morph Cloud...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/40 mb-6 sm:mb-8 md:mb-10 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                      </div>
                      
                      <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 md:mb-12">
                        <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight italic">
                          {isLoginPendingForDownload ? "Ready to Download" : "Draft Complete"} <br/>
                          <span className="text-indigo-600 not-italic">Claim Your Morph.</span>
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-base sm:text-lg leading-relaxed max-w-sm mx-auto">
                          Log in now to remove watermarks, enable PDF downloads, and unlock advanced ATS optimization.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10 md:mb-12 text-left">
                        {[
                          { icon: <Download className="w-4 h-4 sm:w-5 h-5" />, label: "PDF Download", color: "text-indigo-500", bg: "bg-indigo-500/10" },
                          { icon: <Lock className="w-4 h-4 sm:w-5 h-5" />, label: "No Watermark", color: "text-purple-500", bg: "bg-purple-500/10" },
                          { icon: <Settings className="w-4 h-4 sm:w-5 h-5" />, label: "Full Editing", color: "text-blue-500", bg: "bg-blue-500/10" },
                          { icon: <Rocket className="w-4 h-4 sm:w-5 h-5" />, label: "Cloud Storage", color: "text-emerald-500", bg: "bg-emerald-500/10" }
                        ].map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 transition-all">
                            <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${benefit.bg} ${benefit.color} group-hover:scale-110 transition-transform`}>
                              {benefit.icon}
                            </div>
                            <span className="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-200">{benefit.label}</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={async () => {
                          if (onLogin) {
                            await onLogin();
                            if (auth.currentUser) {
                              setShowLoginPrompt(false);
                              setIsLoginPendingForDownload(false);
                            }
                          }
                        }}
                        className="group relative w-full py-5 sm:py-6 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] sm:rounded-[2rem] font-black text-sm sm:text-base uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-500/20 dark:shadow-white/10 flex items-center justify-center gap-3 overflow-hidden border border-slate-800 dark:border-slate-200"
                      >
                        <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                          <LogIn className="w-4 h-4 sm:w-5 h-5 group-hover:animate-pulse" />
                          Continue with Google
                        </span>
                      </button>
                    </>
                  )}
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Dropzone({ onDrop, isProcessing, file, label, color, disabled, id }: { 
  onDrop: (files: File[]) => void, 
  isProcessing: boolean, 
  file?: File,
  label: string,
  color: string,
  disabled?: boolean,
  id?: string
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    disabled: isProcessing || disabled,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/html': ['.html', '.htm'],
      'application/json': ['.json'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  } as any);

  return (
    <div 
      {...getRootProps()} 
      id={id}
      className={cn(
        "relative group cursor-pointer transition-all duration-500",
        "border-2 border-dashed rounded-[32px] p-10 text-center",
        isDragActive ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-[1.02]" : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-indigo-200 hover:bg-[var(--bg-primary)] hover:shadow-xl hover:shadow-indigo-100/20",
        (isProcessing || disabled) && "opacity-50 cursor-not-allowed",
        file && "border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-900/10",
        disabled && "grayscale grayscale-0 hover:grayscale-0"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-5">
        <div className={cn(
          "w-16 h-16 rounded-[20px] flex items-center justify-center transition-all duration-500 shadow-lg",
          file ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-[var(--bg-primary)] text-[var(--text-tertiary)] group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-200",
          disabled && "bg-[var(--bg-secondary)] text-[var(--text-tertiary)] group-hover:bg-[var(--bg-secondary)] group-hover:text-[var(--text-tertiary)]"
        )}>
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : disabled ? (
            <Lock className="w-8 h-8" />
          ) : file ? (
            <CheckCircle className="w-8 h-8" />
          ) : (
            <MousePointerClick className="w-8 h-8" />
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-black tracking-tight text-[var(--text-primary)]">
            {isProcessing ? "Analyzing DNA..." : disabled ? "Limit Reached" : file ? file.name : label}
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">
            {disabled ? "Upgrade to continue" : file ? `${(file.size / 1024).toFixed(1)} KB` : "PDF, DOCX, TXT or Image"}
          </p>
        </div>
      </div>
    </div>
  );
}
