import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileText, CheckCircle, Loader2, Download, Eye, Layout, 
  RefreshCw, FileCode, FileType, Files, ShieldCheck, Target, Layers,
  Maximize2, Minimize2, Zap, AlertCircle, MousePointerClick, Hand, Star, X, Lock, Globe, Linkedin,
  Sparkles, Rocket, Code, Settings, LogIn, MessageSquare, Image as ImageIcon, ChevronDown, ChevronUp, Fingerprint, Check,
  Camera, Columns, Minus, Plus, Expand, History, Printer, Briefcase, BookOpen, HelpCircle, Search, Command, Save
} from 'lucide-react';
// Dynamic imports for heavy libraries
// These will be loaded on demand to reduce initial bundle size
const loadMammoth = () => import('mammoth').then(m => m.default || m);
const loadHtml2Canvas = () => import('html2canvas').then(m => (m as any).default || m);
const loadJsPDF = () => import('jspdf').then(m => (m as any).jsPDF || (m as any).default?.jsPDF || (m as any).default || m);
const loadHtmlToImage = () => import('html-to-image');
import { motion, AnimatePresence } from 'motion/react';
import { cn, checkIsPremium } from '../lib/utils';
import { auth, db, storage } from '../firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp, collection, addDoc, increment, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';
import { uploadWithRetry, deleteWithRetry } from '../lib/storage';
import { handleFirestoreError, OperationType } from '../lib/firestore';
import { 
  analyzeLayout, 
  extractTextFromAny, 
  generateResume, 
  checkMatch, 
  getOptimizationPlan 
} from '../lib/gemini';
import { wrapResumeHtml } from '../lib/resumeTemplates';

import Tooltip from './Tooltip';

import { PLANS, APP_VERSION } from '../constants';

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
  isLoginProgress?: boolean;
  isGuest?: boolean;
}

function extractRawHtml(wrappedHtml: string): string {
  if (!wrappedHtml) return '';
  // If it is already wrapped, try to parse with DOMParser to get contents of resume-preview element
  if (wrappedHtml.includes('id="resume-preview"')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(wrappedHtml, 'text/html');
      const previewEl = doc.getElementById('resume-preview');
      if (previewEl) {
        return previewEl.innerHTML.trim();
      }
    } catch (e) {
      console.error("DOMParser failed to extract raw html:", e);
    }
    
    // String split fallback if DOMParser fails
    const startIdx = wrappedHtml.indexOf('id="resume-preview"');
    if (startIdx !== -1) {
      const tagEndIdx = wrappedHtml.indexOf('>', startIdx);
      if (tagEndIdx !== -1) {
        const endContainerIdx = wrappedHtml.indexOf('</div>\n  </div>', tagEndIdx);
        if (endContainerIdx !== -1) {
          return wrappedHtml.substring(tagEndIdx + 1, endContainerIdx).trim();
        }
      }
    }
  }
  return wrappedHtml;
}

const StatsBar = React.memo(({ 
  isLimitReached, 
  usedMorphs, 
  planLimit, 
  progress, 
  userData, 
  strictLayout, 
  setStrictLayout, 
  onUpgrade 
}: { 
  isLimitReached: boolean, 
  usedMorphs: number, 
  planLimit: number | string, 
  progress: number, 
  userData: any, 
  strictLayout: boolean, 
  setStrictLayout: (val: boolean) => void,
  onUpgrade: () => void
}) => {
  return (
    <div className={cn(
      "flex flex-col lg:flex-row items-stretch lg:items-center gap-4 md:gap-8 bg-[var(--bg-primary)] border rounded-[24px] md:rounded-[32px] p-4 md:p-8 shadow-sm transition-colors",
      isLimitReached ? "border-rose-200 dark:border-rose-900/30" : "border-[var(--border-color)]"
    )}>
      <div className="flex items-center gap-4 md:gap-5">
        <Tooltip 
          title="Morph Engine" 
          content="The cognitive AI engine that powers your resume architecture and style cloning."
          position="bottom"
        >
          <div className={cn(
            "w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-[22px] flex items-center justify-center shadow-lg transition-all shrink-0",
            isLimitReached ? "bg-rose-500 shadow-rose-100 dark:shadow-none" : "bg-indigo-600 shadow-indigo-100 dark:shadow-none"
          )}>
            <Zap className="w-5 h-5 md:w-7 md:h-7 text-white fill-white" />
          </div>
        </Tooltip>
        <div className="flex-grow">
          <p className="text-[8px] md:text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-0.5 md:mb-1">Morph Engine Status</p>
          <div className="flex items-center gap-2 md:gap-3">
            <span className={cn(
              "text-lg md:text-2xl font-black tracking-tight",
              isLimitReached ? "text-rose-600" : "text-[var(--text-primary)]"
            )}>
              {planLimit === Infinity ? 'Unlimited' : `${usedMorphs} / ${planLimit}`}
            </span>
            <span className={cn(
              "px-2 py-0.5 md:px-3 md:py-1 rounded-lg md:rounded-xl text-[7px] md:text-[10px] font-black uppercase tracking-widest border transition-colors",
              isLimitReached 
                ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30" 
                : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30"
            )}>
              {(() => {
                const currentPlan = PLANS.find(p => p.id === (userData?.plan || 'free')) || PLANS[0];
                return `${currentPlan.name} Plan`;
              })()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block h-14 w-px bg-[var(--border-color)] mx-2" />
      
      <Tooltip 
        title="Strict Layout" 
        content="Enforces a pixel-perfect structural match between your content and the reference layout DNA."
        position="bottom"
      >
        <div className="flex items-center justify-between gap-4 bg-[var(--bg-tertiary)] px-4 md:px-5 py-2 md:py-2.5 rounded-[16px] md:rounded-[20px] border border-[var(--border-color)] hover:border-indigo-500/20 transition-all group">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-7 h-7 md:w-8 md:h-8 rounded-[10px] md:rounded-xl flex items-center justify-center transition-all",
              strictLayout ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" : "bg-[var(--bg-primary)] text-[var(--text-tertiary)]"
            )}>
              <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] md:text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest leading-none">Strict Layout</span>
              <span className="text-[6px] md:text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1 opacity-70 group-hover:opacity-100 transition-opacity">Structural Mirror</span>
            </div>
          </div>
          <button 
            onClick={() => setStrictLayout(!strictLayout)}
            className={cn(
              "w-9 h-5 md:w-12 md:h-6 rounded-full transition-all relative shrink-0",
              strictLayout ? "bg-indigo-600" : "bg-[var(--border-color)]"
            )}
          >
            <motion.div 
              initial={false}
              animate={{ x: strictLayout ? (window.innerWidth < 768 ? 18 : 24) : 4 }}
              className="absolute top-0.5 md:top-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-white rounded-full shadow-md"
            />
          </button>
        </div>
      </Tooltip>

      <div className="hidden lg:block h-14 w-px bg-gray-200/50 mx-2" />
      
      <div className="lg:flex-grow lg:max-w-md">
        <div className="flex items-center justify-between mb-1.5 md:mb-3">
          <p className="text-[8px] md:text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Credits</p>
          <p className={cn(
            "text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]",
            isLimitReached ? "text-rose-600" : "text-indigo-600"
          )}>
            {planLimit === Infinity ? '∞' : Math.max(0, (planLimit as number) - usedMorphs)} Morphs Left
          </p>
        </div>
        <div className="w-full h-2 md:h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-color)] shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${planLimit === Infinity ? 0 : progress}%` }}
            className={cn(
              "h-full rounded-full transition-colors",
              isLimitReached 
                ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]" 
                : "bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
            )}
          />
        </div>
      </div>

      {planLimit !== Infinity && usedMorphs >= (planLimit as number) && (
        <button 
          onClick={onUpgrade}
          className="lg:ml-4 py-4 md:py-5 px-6 md:px-10 bg-[var(--bg-primary)] border-2 border-indigo-600 text-indigo-600 rounded-[20px] md:rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl shadow-indigo-100 dark:shadow-none shrink-0"
        >
          Upgrade Now
        </button>
      )}
    </div>
  );
});

const ResumeIframe = React.memo(React.forwardRef<HTMLIFrameElement, { html: string, onLoad: () => void, isReady: boolean, height?: number }>(({ html, onLoad, isReady, height }, ref) => {
  return (
    <div className="relative w-full flex justify-center">
      <iframe 
        key={html.length} 
        ref={ref}
        style={height ? { height: `${height}px` } : { height: '1000px' }}
        className={cn(
          "w-full border-none transition-all duration-300",
          isReady ? "opacity-100" : "opacity-0"
        )}
        onLoad={onLoad}
        srcDoc={html}
        scrolling="no"
        title="Resume Preview Internal"
      ></iframe>

      {!isReady && (
        <div className="absolute inset-0 z-10 bg-[var(--card-bg)] flex flex-col items-center justify-center p-8 space-y-6 overflow-hidden">
          <div className="w-full max-w-md space-y-4">
            <div className="h-8 w-2/3 skeleton-shimmer rounded-xl mx-auto mb-8" />
            <div className="space-y-2.5">
              <div className="h-4 w-full skeleton-shimmer rounded-lg" />
              <div className="h-4 w-5/6 skeleton-shimmer rounded-lg" />
              <div className="h-4 w-4/6 skeleton-shimmer rounded-lg" />
            </div>
            <div className="pt-6 space-y-2">
              <div className="h-3 w-full skeleton-shimmer rounded" />
              <div className="h-3 w-11/12 skeleton-shimmer rounded" />
              <div className="h-3 w-9/12 skeleton-shimmer rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Rendering AI Canvas...</span>
          </div>
        </div>
      )}
    </div>
  );
}));

function ResumeBuilder({ userData, onUpgrade, user, onLogin, isLoginProgress, isGuest }: ResumeBuilderProps) {
  const [hasUsedFreeMorph, setHasUsedFreeMorph] = useState(() => {
    return localStorage.getItem('hasUsedFreeMorph') === 'true';
  });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isGuestBooting, setIsGuestBooting] = useState(false);
  const [guestLoadingStep, setGuestLoadingStep] = useState(0);
  const [isSyncingModal, setIsSyncingModal] = useState(false);
  const [isLoginPendingForDownload, setIsLoginPendingForDownload] = useState(false);
  const [isPendingGeneration, setIsPendingGeneration] = useState(false);
  const usedMorphs = userData?.usedMorphs !== undefined ? userData.usedMorphs : (userData?.morphCount || 0);
  const planLimit = userData?.planLimit === -1 ? Infinity : (userData?.planLimit || PLANS[0].limit);
  const isLimitReached = planLimit !== Infinity && usedMorphs >= (planLimit as number);
  const progress = planLimit === Infinity ? 0 : Math.min((usedMorphs / (planLimit as number)) * 100, 100);
  const isPremium = checkIsPremium(userData);
  const [referenceFile, setReferenceFile] = useState<FileData | null>(null);
  const [isDnaValidated, setIsDnaValidated] = useState(false);
  const [dnaAnalysisStatus, setDnaAnalysisStatus] = useState<string | null>(null);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(1000);
  const [reportedZoom, setReportedZoom] = useState(100);
  const [isValidationInProgress, setIsValidationInProgress] = useState(false);
  const [contentFile, setContentFile] = useState<FileData | null>(null);
  const [layoutAnalysis, setLayoutAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [jobDescription, setJobDescription] = useState('');
  const [optimizeForAts, setOptimizeForAts] = useState(true);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [showSurprise, setShowSurprise] = useState(false);
  const [isStyleMatcherActive, setIsStyleMatcherActive] = useState(false);
  const [styleMatcherReference, setStyleMatcherReference] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Consolidated states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [commandSelectedIndex, setCommandSelectedIndex] = useState(0);
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');
  const [pendingResume, setPendingResume] = useState<{ html: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [strictLayout, setStrictLayout] = useState(true);
  const [lengthMode, setLengthMode] = useState<'1-page' | '2-page' | 'executive' | 'no-limit'>('no-limit');
  const [linkedinText, setLinkedinText] = useState('');
  const [isImportingLinkedIn, setIsImportingLinkedIn] = useState(false);
  const [isLoadingHistoryItem, setIsLoadingHistoryItem] = useState(false);

  // Measure Left Panel Height
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [leftPanelHeight, setLeftPanelHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!leftPanelRef.current) return;
    const element = leftPanelRef.current;
    
    if (element.clientHeight > 0) {
      setLeftPanelHeight(element.clientHeight);
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.target.clientHeight;
        if (height > 0) {
          setLeftPanelHeight(height);
        }
      }
    });
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, []);

  useEffect(() => {
    if (userData?.showResetSurprise) {
      setShowSurprise(true);
    }
  }, [userData?.showResetSurprise]);

  useEffect(() => {
    const checkAuthAndDismiss = () => {
      if ((user || auth.currentUser) && showLoginPrompt) {
        setShowLoginPrompt(false);
        if (isLoginPendingForDownload) {
          setIsLoginPendingForDownload(false);
          // Small delay to let modal close before showing next UI
          setTimeout(() => setShowDownloadMenu(true), 300);
        }
      }
    };
    checkAuthAndDismiss();
  }, [user, showLoginPrompt, isLoginPendingForDownload]);

  // Handle auto-continuation after login
  useEffect(() => {
    if (user && isPendingGeneration && referenceFile && contentFile) {
      setIsPendingGeneration(false);
      handleGenerate();
    }
  }, [user, isPendingGeneration]);

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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'RESUME_ZOOM_UPDATE') {
        setReportedZoom(event.data.zoom);
      }
      if (event.data?.type === 'RESUME_HEIGHT_UPDATE') {
        setIframeHeight(event.data.height);
        if (event.data.totalPages) setTotalPages(event.data.totalPages);
      }
      if (event.data?.type === 'REQUEST_PARENT_SCROLL') {
        const scrollArea = document.getElementById('preview-scroll-area');
        if (scrollArea) {
          scrollArea.scrollTo({ top: event.data.top, behavior: 'smooth' });
        }
      }
      if (event.data?.type === 'PAGINATION_COMPLETE') {
        setTotalPages(event.data.totalPages);
      }
      if (event.data?.type === 'CURRENT_PAGE_UPDATE') {
        setCurrentPage(event.data.page);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [totalPages]);

  const scrollToPage = (pageNumber: number) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SCROLL_TO_PAGE', page: pageNumber }, '*');
    }
  };

  // Scroll tracking for parent container
  useEffect(() => {
    const scrollArea = document.getElementById('preview-scroll-area');
    if (!scrollArea) return;

    const handleScroll = () => {
      const scrollPos = scrollArea.scrollTop;
      const pageHeight = 1123;
      const GAP = 60;
      const scale = reportedZoom / 100;
      const scaledPageTotal = (pageHeight + GAP) * scale;
      
      const newPage = Math.max(1, Math.min(totalPages, Math.round((scrollPos + 200) / scaledPageTotal) + 1));
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    };

    scrollArea.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, [reportedZoom, totalPages, currentPage]);

  const previewHtml = useMemo(() => {
    if (!generatedHtml) return '';
    const cleanHtml = extractRawHtml(generatedHtml);
    return wrapResumeHtml(cleanHtml, { 
      name: resumeMetadata?.name, 
      isGuest: !user, 
      previewMode: true, 
      isPremium,
      showA4Border: showPrintPreview
    });
  }, [generatedHtml, resumeMetadata?.name, user, isPremium, showPrintPreview]);

  // Safety timeout for preview ready state
  useEffect(() => {
    if (generatedHtml && !isPreviewReady) {
      const timer = setTimeout(() => {
        setIsPreviewReady(true);
      }, 3000); // Reduced timeout
      return () => clearTimeout(timer);
    }
  }, [generatedHtml, isPreviewReady]);

  useEffect(() => {
    // When generatedHtml changes, reset ready state to show loader briefly
    if (generatedHtml) {
      setIsPreviewReady(false);
    }
  }, [generatedHtml]);

  const onDropReference = async (acceptedFiles: File[]) => {
    if (!checkUsageLimits('morph')) return;

    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large (max 10MB). Please upload a smaller file.");
      return;
    }

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
        const mammoth = await loadMammoth();
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

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large (max 10MB). Please upload a smaller file.");
      return;
    }

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
        const mammoth = await loadMammoth();
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
      const contentData = { file, base64, text, type: file.type };
      setContentFile(contentData);
      
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
    setActiveMobileTab('preview');
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      let currentHistory = userData?.resumeHistory || [];
      
      const resumesCollection = collection(db, 'users', auth.currentUser.uid, 'resumes');
      const resumeId = replaceId || doc(resumesCollection).id;
      const storagePath = `resumes/${auth.currentUser.uid}/${resumeId}.html`;
      const resumeRef = ref(storage, storagePath);
      const cleanHtml = extractRawHtml(html);
      const wrappedHtml = wrapResumeHtml(cleanHtml, { name: name || 'Untitled Resume', isGuest: false, isPremium });

      // Save full content to subcollection
      const resumeDocRef = doc(db, 'users', auth.currentUser.uid, 'resumes', resumeId);
      const saveContentPromise = setDoc(resumeDocRef, {
        html: wrappedHtml,
        originalText: contentFile?.text || '',
        updatedAt: serverTimestamp()
      });

      // Create metadata entry for history (WITHOUT HTML to avoid 1MB limit)
      const newResumeMetadata = {
        id: resumeId,
        name: name || 'Untitled Resume',
        timestamp: new Date().toISOString(),
        storagePath: storagePath,
        isMetadataOnly: true // Mark that HTML is in subcollection
      };

      const currentPlan = PLANS.find(p => p.id === (userData?.plan || 'free')) || PLANS[0];
      const historyLimit = currentPlan.historyLimit || 2;

      let updatedHistory;
      if (replaceId) {
        // Replace existing
        updatedHistory = currentHistory.map((r: any) => r.id === replaceId ? newResumeMetadata : r);
      } else {
        // Add new
        updatedHistory = [newResumeMetadata, ...currentHistory].slice(0, historyLimit);
      }

      // Parallelize everything for speed and reliability
      await Promise.all([
        saveContentPromise,
        updateDoc(userRef, {
          resumeHistory: updatedHistory,
          lastActivityAt: serverTimestamp()
        }),
        uploadWithRetry(resumeRef, cleanHtml, 'raw', { contentType: 'text/html' })
          .catch(err => console.warn("Background storage backup failed:", err))
      ]);
      
      setPendingResume(null);
    } catch (err) {
      console.error("Save failure:", err);
      setError("Background save failed. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Helper Functions ---

  const checkUsageLimits = (actionType: 'morph' | 'check') => {
    if (!userData) return true;

    const hasSubmittedFeedback = userData.hasReviewed || localStorage.getItem('morph_user_submitted_feedback') === 'true';

    if (actionType === 'morph' && userData.morphCount === 1 && !hasSubmittedFeedback && !isPremium) {
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
      
      const updateData: any = {
        usedMorphs: increment(1),
        freeMorphsUsed: !isPremium ? increment(1) : (userData?.freeMorphsUsed || 0),
        premiumMorphsUsed: isPremium ? increment(1) : (userData?.premiumMorphsUsed || 0),
        remainingMorphs: userData?.planLimit === -1 ? 999 : increment(-1),
        morphCount: increment(1)
      };

      // Mark free plan as claimed if using it
      if (!isPremium) {
        updateData.freeClaimed = true;
        updateData['metadata.freeClaimed'] = true;
      }

      await updateDoc(userRef, updateData);
    } catch (err) {
      console.error("Failed to deduct credit:", err);
    }
  };

  const handleAiError = (err: any, fallback: string) => {
    console.error("AI Error Details:", err);
    const message = err?.message || "";
    
    if (message === "API_KEY_MISSING") {
      return "AI configuration is missing. Please contact support.";
    }
    if (message === "QUOTA_EXCEEDED" || message.includes("429")) {
      return "Daily AI limit reached or service is busy. Please try again later.";
    }
    if (message === "AI_CALL_TIMEOUT") {
      return "The Morph Engine is overloaded. Please try again in a few moments.";
    }
    
    // If it's one of our custom descriptive errors, show it
    if (message.includes("Failed to process resume DNA") || 
        message.includes("Parsing Error") || 
        message.includes("CLONING_FAILED") ||
        message.includes("INSUFFICIENT_DNA")) {
      return message;
    }

    return fallback;
  };

  const applyGenerationResult = (result: any) => {
    setSelectedResumeId("");
    setGeneratedHtml(result.html);
    setResumeMetadata({ name: result.name, yoe: result.yoe, profile: result.profile });
    setAtsScore(result.atsScore);
    setAtsFeedback(result.atsFeedback);
    setMatchScore(result.matchScore);
    setMissingKeywords(result.missingKeywords);
    setLayoutAnalysis(result.layoutAnalysis);

    if (result.integrityMetrics && result.integrityMetrics.omittedFields?.length > 0) {
      console.warn("⚠️ Morph Engine Warning: Some data could not be mapped perfectly:", result.integrityMetrics.omittedFields);
    }

    if (!contentFile?.text && result.extractedText) {
      setContentFile(prev => prev ? { ...prev, text: result.extractedText } : null);
    }

    setPendingResume({ html: result.html, name: result.name });
    setShowSaveModal(true);
  };

  const runGuestBooting = async () => {
    if (user || hasUsedFreeMorph) return;
    
    setIsGuestBooting(true);
    const messages = ["Initializing Morph Core...", "Injecting Neural Processing...", `Calibrating ${APP_VERSION} AI...`, "Establishing Guest Workspace...", "Ready to Morph."];
    for (let i = 0; i < messages.length; i++) {
      setGuestLoadingStep(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    await new Promise(resolve => setTimeout(resolve, 50));
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

      // 3. Mark in local storage to prevent redundancy
      localStorage.setItem('morph_user_submitted_feedback', 'true');

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

    if (!user) {
      if (isGuest) {
        // Guest mode one-time check
        const hasUsedFreeMorph = localStorage.getItem('morph_guest_free_used') === 'true';
        if (hasUsedFreeMorph) {
          setIsPendingGeneration(true);
          if (onLogin) onLogin();
          return;
        }
      } else {
        setIsPendingGeneration(true);
        setShowLoginPrompt(true);
        if (onLogin) onLogin(); // Trigger the main login dialog in App.tsx
        return;
      }
    }

    if (!checkUsageLimits('morph')) return;

    setIsGenerating(true);
    setGenerationStatus('Cloning layout...');
    setError(null);
    
    try {
      setGenerationStatus('Scanning reference & extracting facts...');
      
      const analysisPromise = (!layoutAnalysis && (referenceFile.base64 || referenceFile.text))
        ? analyzeLayout(referenceFile.base64, referenceFile.type, referenceFile.text)
        : Promise.resolve(layoutAnalysis);
        
      const extractionPromise = (!contentFile.text && contentFile.base64)
        ? extractTextFromAny(contentFile.base64, contentFile.type).catch(() => null)
        : Promise.resolve(contentFile.text);

      const [finalLayout, finalText] = await Promise.all([analysisPromise, extractionPromise]);
      
      if (finalLayout) setLayoutAnalysis(finalLayout);
      if (finalText && !contentFile.text) {
        setContentFile(prev => prev ? { ...prev, text: finalText } : null);
      }

      setGenerationStatus('Forensic mapping content to DNA...');
      const result = await generateResume(
        { base64: referenceFile.base64, mimeType: referenceFile.type, text: referenceFile.text },
        { base64: contentFile.base64, mimeType: contentFile.type, text: finalText || contentFile.text },
        jobDescription,
        optimizeForAts,
        finalLayout,
        strictLayout,
        { lengthMode }
      );

      setGenerationStatus('Verifying Pixel-Perfect Parity...');
      applyGenerationResult(result);
      
      setIsPreviewReady(true);

      if (!user) {
        // Guest just used their one free morph
        if (isGuest) {
          localStorage.setItem('morph_guest_free_used', 'true');
        }
        
        // Post-morph login trigger as per requirement
        setTimeout(() => {
          if (onLogin) onLogin();
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
    setDnaAnalysisStatus('Forensic Scan Initiated...');
    
    try {
      let currentLayout = null;
      if (referenceFile.text) {
        currentLayout = await analyzeLayout(undefined, undefined, referenceFile.text);
      } else if (referenceFile.base64) {
        currentLayout = await analyzeLayout(referenceFile.base64.split(',')[1], referenceFile.type);
      }

      // Quality check on the manifest string
      if (!currentLayout || currentLayout.length < 50) {
        throw new Error("INSUFFICIENT_DNA_QUALITY");
      }

      setDnaAnalysisStatus('Validating Structural Integrity...');
      await new Promise(resolve => setTimeout(resolve, 200)); // Snappy delay
      
      setLayoutAnalysis(currentLayout);
      setIsDnaValidated(true);
      setDnaAnalysisStatus('DNA Extraction Complete');
    } catch (err: any) {
      console.error(err);
      setIsDnaValidated(false);
      if (err.message === "INSUFFICIENT_DNA_QUALITY") {
        setError("Reference image quality is too low for forensic cloning. Please upload a clearer resume layout.");
      } else if (err.message === "API_KEY_MISSING") {
        setError("AI configuration is missing. Please contact support.");
      } else {
        setError("DNA Analysis failed. System could not extract a precise structural blueprint.");
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

    if (!jobDescription) {
      setError("Please paste a job description in Step 2 first.");
      return;
    }
    
    // Ensure we have current text
    let currentText = contentFile?.text;
    if (!currentText && contentFile?.base64) {
      setIsMatching(true);
      try {
        currentText = await extractTextFromAny(contentFile.base64, contentFile.type);
        if (currentText) {
          setContentFile(prev => prev ? { ...prev, text: currentText } : null);
        }
      } catch (err) {
        console.error("Text extraction failed:", err);
      }
    }

    if (!currentText) {
      setError("Please upload your resume content first.");
      return;
    }

    setIsMatching(true);
    setGenerationStatus('Scanning job description...');
    setError(null);
    try {
      const result = await checkMatch(currentText, jobDescription);
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

  const [showShareToast, setShowShareToast] = useState(false);

  const handleShare = () => {
    if (!generatedHtml) return;
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      }).catch(err => {
        console.error('Clipboard error:', err);
        // Fallback for non-secure or restricted contexts
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setShowShareToast(true);
          setTimeout(() => setShowShareToast(false), 3000);
        } catch (e) {}
        document.body.removeChild(textArea);
      });
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
    if (resumeMetadata?.name) {
      const firstName = resumeMetadata.name.split(' ')[0] || 'Resume';
      return `${firstName}.${ext}`;
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
    const cleanHtml = extractRawHtml(generatedHtml);
    const fullHtml = wrapResumeHtml(cleanHtml, { name: resumeMetadata?.name, isGuest: false, isPremium });
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName('html');
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const capturePagesAsPDF = async () => {
    const iframe = iframeRef.current;
    if (!iframe) return null;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error("Preview doc inaccessible");
    const iframeWin = iframe.contentWindow;
    if (!iframeWin) throw new Error("Preview window inaccessible");

    // 1. Wait for everything to be ready (fonts, images, etc.)
    if (iframeWin.document.fonts) {
      await iframeWin.document.fonts.ready;
    }

    const images = Array.from(iframeDoc.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));

    // 2. Identify all pages
    const pages = Array.from(iframeDoc.querySelectorAll('.page'));
    if (pages.length === 0) throw new Error("No pages found");

    // 3. IMPORTANT: Reset scale transform temporarily for exact 1:1 capture
    const root = iframeDoc.getElementById('resume-preview');
    const originalTransform = root?.style.transform || '';
    if (root) root.style.transform = 'none';

    // Add temporary style to hide indicators during capture
    const styleHide = iframeDoc.createElement('style');
    styleHide.id = 'temp-hide-indicators';
    styleHide.innerHTML = '.page-break-indicator { display: none !important; }';
    iframeDoc.head.appendChild(styleHide);

    // Find and temporarily disable cross-origin stylesheets to prevent html-to-image from crashing on security restrictions
    const disabledLinks: { link: HTMLLinkElement; originalDisabled: boolean }[] = [];
    const disableCrossOriginLinks = (doc: Document) => {
      const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      for (const link of links) {
        try {
          if (link.sheet) {
            // Access sheet.cssRules to trigger a SecurityError if restricted
            const _rules = link.sheet.cssRules;
          }
        } catch (e) {
          disabledLinks.push({ link, originalDisabled: link.disabled });
          link.disabled = true;
        }
      }
    };

    disableCrossOriginLinks(document);
    disableCrossOriginLinks(iframeDoc);

    // Wait a moment for layout to settle after removing transform
    await new Promise(r => setTimeout(r, 300));

    try {
      const htmlToImage = await loadHtmlToImage();
      const jsPDF = await loadJsPDF();
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true // Enable compression for production-grade optimization
      });
      
      const pageWidth = 210;
      const pageHeight = 297;
      const standardA4HeightPx = 1123; // at 96dpi

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const realHeight = page.offsetHeight;
        
        // Use optimized JPEG for massive size reduction (1-3MB target)
        const imgData = await htmlToImage.toJpeg(page, {
          quality: 0.85, // Production-grade compression balance
          pixelRatio: 2, // 2x is perfect for crisp text without bloated size
          backgroundColor: '#ffffff',
          width: 794,
          height: realHeight,
          style: {
            margin: '0',
            boxShadow: 'none',
            border: 'none',
            transform: 'none',
            textRendering: 'optimizeLegibility'
          } as any,
          cacheBust: true,
          skipFonts: false 
        });

        const pagesNeeded = Math.max(1, Math.ceil(realHeight / (standardA4HeightPx + 2)));

        for (let j = 0; j < pagesNeeded; j++) {
           if (i > 0 || j > 0) pdf.addPage();
           const position = -(j * pageHeight);
           const totalPdfHeight = (realHeight * pageWidth) / 794;
           // Use FAST compression for JPEG stream optimization
           pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, totalPdfHeight, undefined, 'FAST');
        }
      }
      
      return pdf;
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? (err.message || String(err)) : String(err));
      console.warn("Modern export failed, falling back to legacy...", errMsg);
      // Fallback to legacy html2canvas if modern export fails
      const html2canvas = await loadHtml2Canvas();
      const jsPDF = await loadJsPDF();
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pageWidth = 210;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, {
          scale: 2, // Optimized from 4
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 794
        });

        // Use JPEG for fallback as well
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, 297, undefined, 'FAST');
        
        canvas.width = 0;
        canvas.height = 0;
      }
      return pdf;
    } finally {
      // Restore disabled cross-origin stylesheets
      for (const item of disabledLinks) {
        item.link.disabled = item.originalDisabled;
      }
      // Restore transform
      if (root) root.style.transform = originalTransform;
      const hideEl = iframeDoc.getElementById('temp-hide-indicators');
      if (hideEl) hideEl.remove();
    }
  };

  const handleDownloadPDF = async () => {
    if (isExporting) return;
    if (!user) {
      setShowLoginPrompt(true);
      setIsLoginPendingForDownload(true);
      return;
    }
    setShowDownloadMenu(false);
    setIsExporting(true);
    
    try {
      const pdf = await capturePagesAsPDF();
      if (pdf) {
        pdf.save(getFileName('pdf'));
      }
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? (err.message || String(err)) : String(err));
      console.error("PDF download failed:", errMsg);
      setError("High-quality PDF export failed. Please try printing to PDF instead.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDirectPrint = () => {
    if (!user) {
      setShowLoginPrompt(true);
      setIsLoginPendingForDownload(true);
      return;
    }
    if (!iframeRef.current) return;
    
    try {
      const iframe = iframeRef.current;
      if (iframe.contentWindow) {
        iframe.contentWindow.print();
        setShowDownloadMenu(false);
      }
    } catch (err) {
      console.error("Print failed:", err);
    }
  };

  const handleDownloadWord = () => {
    if (isExporting) return;
    if (!user) {
      setShowLoginPrompt(true);
      setIsLoginPendingForDownload(true);
      return;
    }
    if (!generatedHtml) return;
    
    // Construct HTML with Word-specific fixes
    const cleanHtml = extractRawHtml(generatedHtml);
    const wrapped = wrapResumeHtml(cleanHtml, { name: resumeMetadata?.name, isGuest: false, isPremium });
    const fullHtml = wrapped.replace('</style>', `
      /* Word-specific overrides for layout */
      .grid { display: table !important; width: 100% !important; }
      [class*="col-span-"] { display: table-cell !important; }
    </style>`);
    
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

  const captureResume = async (): Promise<HTMLCanvasElement | null> => {
    if (!generatedHtml || !iframeRef.current) return null;
    setIsExporting(true);
    
    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Preview doc inaccessible");

      if (iframe.contentWindow?.document.fonts) {
        await iframe.contentWindow.document.fonts.ready;
      }

      const images = Array.from(iframeDoc.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const target = iframeDoc.getElementById('resume-preview') || iframeDoc.body;
      if (!target) throw new Error("Capture target not found");
      
      const root = iframeDoc.getElementById('resume-preview');
      const originalTransform = root?.style.transform || '';
      if (root) root.style.transform = 'none';

      // Add temporary style to hide indicators during capture
      const styleHide = iframeDoc.createElement('style');
      styleHide.id = 'temp-hide-indicators-img';
      styleHide.innerHTML = '.page-break-indicator { display: none !important; }';
      iframeDoc.head.appendChild(styleHide);

      const originalBodyOverflow = iframeDoc.body.style.overflow;
      const originalBodyHeight = iframeDoc.body.style.height;
      iframeDoc.body.style.overflow = 'visible';
      iframeDoc.body.style.height = 'auto';

      try {
        const html2canvas = await loadHtml2Canvas();
        return await html2canvas(target as HTMLElement, {
          scale: 2, // Optimized from 3
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 20000,
          removeContainer: true,
          windowWidth: 794,
        });
      } finally {
        iframeDoc.body.style.overflow = originalBodyOverflow;
        iframeDoc.body.style.height = originalBodyHeight;
        if (root) root.style.transform = originalTransform;
        const hideEl = iframeDoc.getElementById('temp-hide-indicators-img');
        if (hideEl) hideEl.remove();
      }
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? (err.message || String(err)) : String(err));
      console.error("Capture failed:", errMsg);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadImage = async (format: 'png' | 'jpeg') => {
    if (isExporting) return;
    if (!user) {
      setShowLoginPrompt(true);
      setIsLoginPendingForDownload(true);
      return;
    }
    const canvas = await captureResume();
    if (!canvas) return;

    try {
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpeg' ? 0.95 : undefined;
      const dataUrl = canvas.toDataURL(mimeType, quality);
      
      const link = document.createElement('a');
      link.download = getFileName(format);
      link.href = dataUrl;
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        link.target = '_blank';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowDownloadMenu(false);
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? (err.message || String(err)) : String(err));
      console.error("Image download failed:", errMsg);
    }
  };

  const handleShareWhatsApp = async () => {
    if (isExporting) return;
    if (!user) {
      setShowLoginPrompt(true);
      setIsLoginPendingForDownload(true);
      return;
    }
    setShowDownloadMenu(false);
    setIsExporting(true);

    try {
      const pdf = await capturePagesAsPDF();
      if (!pdf) {
        setIsExporting(false);
        return;
      }

      const pdfBlob = pdf.output('blob');
      const filename = getFileName('pdf');
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      const shareUrl = window.location.href;
      const shareText = "Hi, check out my professional resume generated with Morph Engine! 🚀";

      // 1. PRIMARY METHOD (BEST UX): Use Native Share API
      // This is the cleanest implementation for mobile devices
      if (navigator.share) {
        try {
          const shareData: any = {
            title: "My Resume",
            text: shareText,
            url: shareUrl
          };

          // Try to include the actual file if browser supports it
          if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            shareData.files = [pdfFile];
          }

          await navigator.share(shareData);
          setIsExporting(false);
          return;
        } catch (shareErr: any) {
          // If user cancelled, just stop
          if (shareErr.name === 'AbortError') {
            setIsExporting(false);
            return;
          }
          const errMsg = shareErr instanceof Error ? shareErr.message : String(shareErr);
          console.warn("Native share failed, following fallback:", errMsg);
        }
      }

      // 2. SECONDARY FALLBACK: Direct WhatsApp Deep Link
      // We also trigger a download so the user has the file ready to attach manually
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // WhatsApp redirection using wa.me as it avoids common redirect issues on iOS/Android
      const message = encodeURIComponent(shareText + " " + shareUrl);
      const waUrl = `https://wa.me/?text=${message}`;
      
      // Delay to ensure download starts before context switch
      setTimeout(() => {
        window.open(waUrl, "_blank");
        URL.revokeObjectURL(pdfUrl);
        setIsExporting(false);
      }, 800);
      
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? (err.message || String(err)) : String(err));
      console.error("WhatsApp share failed:", errMsg);
      setIsExporting(false);
    }
  };

  const reset = () => {
    setReferenceFile(null);
    setContentFile(null);
    setLayoutAnalysis(null);
    setIsDnaValidated(false);
    setDnaAnalysisStatus(null);
    setGeneratedHtml(null);
    setResumeMetadata(null);
    setAtsScore(null);
    setAtsFeedback(null);
    setJobDescription('');
    setError(null);
  };

  // Keyboard Shortcuts and Command Palette Configuration
  const commandItems = useMemo(() => {
    const items: {
      id: string;
      title: string;
      subtitle?: string;
      category: 'Actions' | 'Saved Resumes' | 'Sections';
      icon: any;
      shortcut?: string;
      action: () => void;
    }[] = [];

    // Category: Actions
    if (generatedHtml) {
      items.push({
        id: 'save-resume',
        title: 'Save Resume Version',
        subtitle: 'Save current layout to database history',
        category: 'Actions',
        icon: Save,
        shortcut: 'Ctrl+S',
        action: () => {
          setPendingResume({ html: generatedHtml, name: resumeMetadata?.name || 'Untitled Resume' });
          setShowSaveModal(true);
          setShowCommandPalette(false);
        }
      });

      items.push({
        id: 'export-pdf',
        title: 'Export High-Quality PDF',
        subtitle: 'Capture current layout pages as standard PDF file',
        category: 'Actions',
        icon: Download,
        shortcut: 'Ctrl+P',
        action: () => {
          handleDownloadPDF();
          setShowCommandPalette(false);
        }
      });

      items.push({
        id: 'print-resume',
        title: 'Standard Browser Print',
        subtitle: 'Open native printing and PDF system options',
        category: 'Actions',
        icon: Printer,
        action: () => {
          handleDirectPrint();
          setShowCommandPalette(false);
        }
      });
    }

    if (generatedHtml && jobDescription) {
      items.push({
        id: 're-morph',
        title: 'Re-Morph with AI',
        subtitle: 'Optimize layout against your pasted job description',
        category: 'Actions',
        icon: Sparkles,
        action: () => {
          handleOptimize();
          setShowCommandPalette(false);
        }
      });
    }

    // Category: Saved Resumes
    const history = userData?.resumeHistory || [];
    history.forEach((resume: any) => {
      items.push({
        id: `resume-${resume.id}`,
        title: resume.name || 'Untitled Resume',
        subtitle: `Saved on ${resume.savedAt ? new Date(resume.savedAt.toDate?.() || resume.savedAt).toLocaleDateString() : 'N/A'}`,
        category: 'Saved Resumes',
        icon: FileText,
        action: async () => {
          setSelectedResumeId(resume.id);
          const historyItem = history.find((r: any) => r.id === resume.id);
          if (historyItem) {
            if (historyItem.isMetadataOnly || !historyItem.html) {
              try {
                const resumeDoc = await getDoc(doc(db, 'users', auth!.currentUser!.uid, 'resumes', resume.id));
                if (resumeDoc.exists()) {
                  setGeneratedHtml(extractRawHtml(resumeDoc.data().html));
                } else {
                  setError("Could not load resume content. It may have been removed.");
                }
              } catch (err) {
                console.error("History fetch failed:", err);
                setError("Failed to load resume version.");
              }
            } else {
              setGeneratedHtml(extractRawHtml(historyItem.html));
            }
            if (historyItem.metadata) {
              setResumeMetadata(historyItem.metadata);
            } else {
              setResumeMetadata({ name: historyItem.name, yoe: 'N/A', profile: 'N/A' });
            }
          }
          setShowCommandPalette(false);
        }
      });
    });

    // Category: Sections
    const sections = [
      { id: 'smart-editor', label: 'Smart AI Editor', desc: 'Direct X-Y-Z resume achievement optimizer', icon: Code },
      { id: 'assistant', label: 'AI Career Assistant', desc: 'Smarter coaching and feedback companion', icon: RefreshCw },
      { id: 'tracker', label: 'Application Tracker', desc: 'Track and organize job pipeline in real-time', icon: Briefcase },
      { id: 'portfolio', label: 'Portfolio Gen', desc: 'Turn your resume into a stunning custom web portfolio', icon: Globe },
      { id: 'guide', label: 'Interactive User Guide', desc: 'Learn to master the entire Morph ecosystem', icon: BookOpen },
      { id: 'feedback', label: 'Share App Feedback', desc: 'Help us improve the product experience', icon: MessageSquare },
      { id: 'help', label: 'FAQ Support Center', desc: 'Browse resources or contact administrators', icon: HelpCircle }
    ];

    sections.forEach(sec => {
      items.push({
        id: `section-${sec.id}`,
        title: sec.label,
        subtitle: sec.desc,
        category: 'Sections',
        icon: sec.icon,
        action: () => {
          window.dispatchEvent(new CustomEvent('set-tab', { detail: sec.id }));
          setShowCommandPalette(false);
        }
      });
    });

    return items;
  }, [generatedHtml, resumeMetadata, jobDescription, userData?.resumeHistory, handleDownloadPDF, handleOptimize, handleDirectPrint]);

  const filteredCommandItems = useMemo(() => {
    if (!commandSearch.trim()) return commandItems;
    const query = commandSearch.toLowerCase();
    return commandItems.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.subtitle?.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [commandItems, commandSearch]);

  // Global Keydown Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      
      const isMeta = e.ctrlKey || e.metaKey;

      if (isMeta && e.key?.toLowerCase() === 's') {
        e.preventDefault();
        if (generatedHtml) {
          setPendingResume({ html: generatedHtml, name: resumeMetadata?.name || 'Untitled Resume' });
          setShowSaveModal(true);
        }
      } else if (isMeta && e.key?.toLowerCase() === 'p') {
        e.preventDefault();
        if (generatedHtml) {
          handleDownloadPDF();
        }
      } else if (isMeta && e.key?.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        setCommandSearch('');
        setCommandSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [generatedHtml, resumeMetadata, handleDownloadPDF]);

  // Command Palette Keyboard Navigation
  useEffect(() => {
    if (!showCommandPalette) return;

    const handlePaletteKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCommandSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommandItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCommandSelectedIndex(prev => (prev - 1 + filteredCommandItems.length) % Math.max(1, filteredCommandItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommandItems[commandSelectedIndex]) {
          filteredCommandItems[commandSelectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handlePaletteKeys);
    return () => {
      window.removeEventListener('keydown', handlePaletteKeys);
    };
  }, [showCommandPalette, filteredCommandItems, commandSelectedIndex]);

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
          <button
            onClick={() => { setShowCommandPalette(true); setCommandSearch(''); setCommandSelectedIndex(0); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-indigo-400 rounded-xl text-[10px] font-bold text-[var(--text-tertiary)] hover:text-indigo-600 transition-all shadow-sm shrink-0"
            title="Open Command & Actions Palette (Ctrl+K)"
          >
            <Command className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <span>Command Center</span>
            <kbd className="hidden sm:inline-block px-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[8px] font-mono font-bold leading-none text-[var(--text-tertiary)]">Ctrl+K</kbd>
          </button>
          
          {/* Action buttons unified into sticky bottom bar at viewport bottom */}
          
          {referenceFile && (
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
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-4">
        {/* Morph Stats Bar */}
        {user && (
          <div className="mb-6 md:mb-12">
            <StatsBar 
              isLimitReached={isLimitReached}
              usedMorphs={usedMorphs}
              planLimit={planLimit}
              progress={progress}
              userData={userData}
              strictLayout={strictLayout}
              setStrictLayout={setStrictLayout}
              onUpgrade={onUpgrade}
            />
          </div>
        )}
        <div className="flex lg:hidden mb-6 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <button 
            onClick={() => setActiveMobileTab('edit')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeMobileTab === 'edit' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "text-[var(--text-tertiary)] hover:text-indigo-600"
            )}
          >
            <Settings className="w-4 h-4" />
            Morph DNA
          </button>
          <button 
            onClick={() => {
              setActiveMobileTab('preview');
            }}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeMobileTab === 'preview' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "text-[var(--text-tertiary)] hover:text-indigo-600"
            )}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start px-4 sm:px-0">
          {/* Left Column: Controls */}
          <div className={cn(
            "lg:col-span-4 xl:col-span-3 space-y-6 md:space-y-8",
            activeMobileTab !== 'edit' && "hidden lg:block"
          )}>
            <div 
              ref={leftPanelRef}
              className="bg-[var(--bg-primary)] p-5 md:p-8 rounded-3xl md:rounded-[32px] border border-[var(--border-color)] shadow-sm space-y-6 md:space-y-10"
            >
              
              <section>
                <div className="flex flex-col xs:flex-row xs:items-center gap-3 mb-5 md:mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-100 shrink-0">1</div>
                    <h2 className="font-black text-lg md:text-xl tracking-tight text-[var(--text-primary)]">Layout DNA</h2>
                  </div>
                  <button
                    onClick={() => {
                      if (!user) {
                        if (onLogin) onLogin();
                        return;
                      }
                      setIsImportingLinkedIn(true);
                    }}
                    title="Import your professional data directly from your LinkedIn profile to save time"
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-900/30 w-fit ml-auto xs:ml-0"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span className="xs:hidden">Linked</span>
                    <span className="hidden xs:inline">Import LinkedIn</span>
                  </button>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed font-medium">
                  Upload the resume layout you want to clone. We'll analyze its visual structure and DNA.
                </p>
                
                <Dropzone 
                  id="builder-reference-upload"
                  onDrop={onDropReference} 
                  isProcessing={isAnalyzing} 
                  file={referenceFile?.file}
                  label="Upload Reference Layout (PDF/Image)"
                  color="indigo"
                  disabled={isLimitReached}
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
                
                {referenceFile && !isDnaValidated && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleAnalyzeStyle}
                    disabled={isAnalyzing || isGenerating}
                    className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Fingerprint className="w-3 h-3" />}
                    {isAnalyzing ? dnaAnalysisStatus || "Analyzing DNA..." : "Analyze DNA"}
                  </motion.button>
                )}
                
                {isDnaValidated && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-center gap-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-1">
                      <Lock className="w-3 h-3 text-green-300" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">DNA Captured</p>
                      <p className="text-[9px] text-green-600/70 font-black uppercase">Layout Locked & Validated</p>
                    </div>
                    <button 
                      onClick={reset}
                      className="ml-auto text-[9px] font-black text-indigo-600 uppercase hover:underline"
                    >
                      Reset
                    </button>
                  </motion.div>
                )}
              </section>

              <div className={cn(
                "space-y-6 md:space-y-10 transition-all duration-500",
                !isDnaValidated && "opacity-30 pointer-events-none grayscale blur-[1px]"
              )}>
                <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-100">2</div>
                    <h2 className="font-black text-xl tracking-tight text-[var(--text-primary)]">Optimization</h2>
                  </div>
                  {jobDescription && (
                    <button 
                      onClick={() => setJobDescription('')}
                      className="text-[10px] font-bold text-[var(--text-tertiary)] hover:text-red-500 uppercase tracking-wider transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                  Target a specific role? Paste the job description below.
                </p>

                {jobDescription && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl"
                  >
                    <div 
                      onClick={() => setOptimizeForAts(!optimizeForAts)}
                      className={cn(
                        "w-10 h-5 rounded-full relative cursor-pointer transition-all duration-300 shrink-0",
                        optimizeForAts ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-700"
                      )}
                    >
                      <motion.div 
                        animate={{ x: optimizeForAts ? 22 : 2 }}
                        className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-300">ATS High-Impact Mode</span>
                      <span className="text-[9px] text-indigo-600/70 dark:text-indigo-400/60 font-medium tracking-tight">Auto-inject keywords & structure optimization</span>
                    </div>
                  </motion.div>
                )}
                <div className="relative">
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    className={cn(
                      "w-full h-32 p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-[var(--bg-primary)] transition-all resize-none placeholder:text-[var(--text-tertiary)]",
                      jobDescription && "border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-900/10"
                    )}
                  ></textarea>
                </div>

                {generatedHtml && jobDescription && (
                  <motion.div className="space-y-3">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleOptimize}
                      disabled={isGenerating}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 group border border-indigo-500"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MousePointerClick className="w-4 h-4 group-hover:scale-110" />}
                      {isGenerating ? "Optimizing..." : "Re-Morph with AI"}
                    </motion.button>

                    {!matchScore && !isGenerating && (
                      <motion.button
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleCheckMatch}
                        disabled={isMatching}
                        className="w-full py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group"
                      >
                        {isMatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
                        {isMatching ? "Analyzing..." : "Quick Match Check"}
                      </motion.button>
                    )}
                  </motion.div>
                )}

                {matchScore !== null && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] text-white shadow-xl shadow-indigo-200 overflow-hidden relative"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">ATS Match Score</p>
                         <h3 className="text-3xl font-black">{matchScore}%</h3>
                       </div>
                       <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                         <Target className="w-6 h-6" />
                       </div>
                    </div>
                    {missingKeywords?.length > 0 && (
                      <div className="space-y-2 relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Missing Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {missingKeywords.map((kw, i) => (
                            <span key={kw + i} className="px-2 py-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-[9px] font-bold border border-white/5 break-words max-w-full">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </section>

              <section className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-amber-100 dark:shadow-none">3</div>
                    <h2 className="font-black text-xl tracking-tight text-[var(--text-primary)]">Target Length</h2>
                  </div>
                  <div className="grid grid-cols-4 gap-2 bg-[var(--bg-tertiary)] p-1.5 rounded-[22px] border border-[var(--border-color)]">
                    {[
                      { id: '1-page', label: 'Classic', icon: FileText, desc: '1 Page' },
                      { id: '2-page', label: 'Detail', icon: Files, desc: '2 Pages' },
                      { id: 'executive', label: 'Impact', icon: ShieldCheck, desc: 'Exec' },
                      { id: 'no-limit', label: 'Full', icon: Layers, desc: 'No Limit' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setLengthMode(mode.id as any)}
                        className={cn(
                          "py-2.5 px-1 rounded-[18px] transition-all flex flex-col items-center gap-1 group",
                          lengthMode === mode.id 
                            ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none" 
                            : "text-[var(--text-tertiary)] hover:text-indigo-600 hover:bg-[var(--bg-primary)]"
                        )}
                      >
                        <mode.icon className={cn("w-4 h-4 mb-0.5", lengthMode === mode.id ? "text-white" : "group-hover:scale-110 transition-transform")} />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">{mode.label}</span>
                        <span className={cn("text-[7px] font-bold uppercase tracking-tight", lengthMode === mode.id ? "text-white/60" : "text-[var(--text-tertiary)]")}>{mode.desc}</span>
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
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed font-medium">
                  Upload your professional content. We'll map it to the DNA above.
                </p>
                
                <Dropzone 
                  onDrop={onDropContent} 
                  isProcessing={isGenerating} 
                  file={contentFile?.file}
                  label="Upload Your Content (Resume/Doc)"
                  color="indigo"
                  disabled={isLimitReached}
                />

                {referenceFile && contentFile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="sticky bottom-4 left-0 right-0 z-50 py-4 bg-white/80 backdrop-blur-xl border border-indigo-100 dark:bg-slate-900/80 dark:border-indigo-900/30 rounded-3xl mt-6 px-4 shadow-2xl md:static md:bg-transparent md:border-none md:p-0 md:shadow-none"
                  >
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || isAnalyzing}
                      className="w-full py-5 bg-indigo-600 text-white rounded-[24px] text-sm font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group disabled:opacity-50"
                    >
                      {isGenerating || isAnalyzing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Zap className="w-5 h-5 fill-white" />
                      )}
                      {generatedHtml ? (isGenerating ? "Updating..." : "Regenerate Resume") : (isGenerating ? "Morphing..." : "Generate Resume")}
                    </button>
                    {generatedHtml && (
                      <p className="text-[10px] text-center mt-3 font-bold text-indigo-500 uppercase tracking-widest animate-pulse">
                        Ready to reprocess with current settings
                      </p>
                    )}
                  </motion.div>
                )}
              </section>
            </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider text-center"
                >
                  {error}
                </motion.div>
              )}
          </div>
        </div>

          {/* Right Column: Preview */}
          <div className={cn(
            "transition-all duration-700 ease-in-out w-full mt-8 lg:mt-0 flex flex-col min-h-0",
            isPreviewFull 
              ? "fixed inset-0 z-[500] bg-[#020617] p-0 sm:p-6 overflow-hidden" 
              : "lg:col-span-8 xl:col-span-9 lg:sticky lg:top-24 xl:top-32",
            !isPreviewFull && activeMobileTab !== 'preview' && "hidden lg:flex"
          )}>
            {!isPreviewFull && user && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-secondary)] p-4 rounded-3xl border border-[var(--border-color)] shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Saved Versions</h3>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Load from History</p>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-[260px] max-w-full">
                    <select
                      value={selectedResumeId}
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (!val) {
                          setSelectedResumeId('');
                          return;
                        }
                        
                        setSelectedResumeId(val);
                        const selected = (userData?.resumeHistory || []).find((r: any) => r.id === val);
                        if (selected) {
                          // Handle On-Demand Fetching for Metadata-Only entries
                          if (selected.isMetadataOnly || !selected.html) {
                            setIsLoadingHistoryItem(true);
                            try {
                              const resumeDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid, 'resumes', selected.id));
                              if (resumeDoc.exists()) {
                                const fullData = resumeDoc.data();
                                setGeneratedHtml(extractRawHtml(fullData.html));
                              } else {
                                setError("Could not load resume content. It may have been removed.");
                              }
                            } catch (err) {
                              console.error("History fetch failed:", err);
                              setError("Failed to load resume version. Check your network.");
                            } finally {
                              setIsLoadingHistoryItem(false);
                            }
                          } else {
                            // Backward compatibility: load directly from history if present
                            setGeneratedHtml(extractRawHtml(selected.html));
                          }
                          
                          setResumeMetadata({
                            name: selected.name || 'Untitled Resume',
                            yoe: '',
                            profile: ''
                          });
                        }
                      }}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs py-3 pl-5 pr-10 rounded-2xl cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none font-sans shadow-inner disabled:opacity-50"
                      disabled={!userData?.resumeHistory?.length || isLoadingHistoryItem}
                    >
                      <option value="">{isLoadingHistoryItem ? 'Fetching content...' : (userData?.resumeHistory?.length ? `Select a saved resume (${userData.resumeHistory.length})` : 'No saved resumes')}</option>
                      {(userData?.resumeHistory || []).map((resume: any) => (
                        <option key={resume.id} value={resume.id}>
                          {resume.name} ({new Date(resume.timestamp || resume.savedAt?.toDate?.() || Date.now()).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--text-tertiary)]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (generatedHtml) {
                        setPendingResume({ html: generatedHtml, name: resumeMetadata?.name || 'Untitled Resume' });
                        setShowSaveModal(true);
                      }
                    }}
                    disabled={!generatedHtml || isSaving}
                    className="flex-shrink-0 h-[42px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                    title="Save Current Version"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </div>
              </div>
            )}
            <div 
              className={cn(
                "bg-[var(--bg-primary)] rounded-[24px] md:rounded-[48px] border border-[var(--border-color)] shadow-2xl shadow-indigo-200/5 flex flex-col group transition-all duration-500",
                isPreviewFull 
                  ? "h-full w-full max-w-[1400px] mx-auto border-slate-800" 
                  : "h-[calc(100vh-280px)] lg:h-[calc(100vh-160px)] w-full"
              )}
            >
              <div className="h-14 md:h-16 border-b border-[var(--border-color)] px-4 md:px-10 flex items-center justify-between bg-[var(--bg-secondary)] shrink-0 z-30">
                <div className="flex items-center gap-2 md:gap-6 min-w-0 flex-1">
                  <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-500" />
                    <span className="text-[9px] md:text-xs font-black text-[var(--text-tertiary)] uppercase tracking-[0.15em] md:tracking-[0.2em]">Preview</span>
                  </div>
                  
                  {atsScore !== null && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 md:gap-3 pl-2 md:pl-6 border-l border-[var(--border-color)] min-w-0"
                    >
                      <div className={cn(
                        "px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 md:gap-2 shrink-0",
                        atsScore >= 80 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : 
                        atsScore >= 50 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" : 
                        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      )}>
                        ATS: {atsScore}%
                      </div>
                      <button
                        onClick={handleMaximizeAts}
                        disabled={isGenerating || isPlanning}
                        title="Optimize resume structure"
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all shadow-sm shrink-0"
                      >
                        {isPlanning ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <Zap className="w-2.5 h-2.5 fill-white" />
                        )}
                      </button>
                    </motion.div>
                  )}

                  {/* Saved Resume select dropdown (Removed - moved to outer container) */}
                </div>
                <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsStyleMatcherActive(!isStyleMatcherActive)}
                      title="Style Matcher: Compare side-by-side with a reference image"
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border",
                        isStyleMatcherActive 
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-100" 
                          : "bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-indigo-500"
                      )}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Style Matcher</span>
                    </button>
                  {/* Share button kept here for accessibility */}
                  {generatedHtml && (
                    <button 
                      onClick={() => {
                        if (!user) {
                          if (onLogin) onLogin();
                          return;
                        }
                        handleShare();
                      }}
                      title="Share link"
                      className="p-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm text-[var(--text-primary)]"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className={cn(
                "flex-1 relative min-h-0 bg-[var(--bg-secondary)] flex flex-col",
                isPreviewFull ? "p-4 md:p-8" : "p-0"
              )}>
                {isPreviewFull && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setIsPreviewFull(false)}
                     className="absolute inset-0 z-[-1] bg-black/40 backdrop-blur-sm"
                   />
                )}

                <div className={cn(
                  "bg-[var(--bg-primary)] border-[var(--border-color)] shadow-2xl flex flex-col transition-all duration-500 mx-auto relative h-full w-full",
                  isPreviewFull ? "rounded-[32px] md:rounded-[48px] border" : "rounded-none border-t md:border-t-0"
                )}>
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
                                `Calibrating ${APP_VERSION} AI...`,
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
                      className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-8 bg-[var(--bg-primary)]/90 backdrop-blur-2xl z-10 p-6"
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-36 h-36 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse-glow" />
                        <div className="w-24 h-24 border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-400 border-r-purple-500 rounded-full animate-spin shadow-xl" />
                        <Sparkles className="absolute w-9 h-9 text-indigo-600 dark:text-indigo-400 animate-bounce" />
                      </div>
                      <div className="space-y-4 w-full max-w-sm">
                        <div className="space-y-1.5">
                          <p className="font-black text-2xl md:text-3xl tracking-tight text-[var(--text-primary)] saas-gradient-text inline-block">{generationStatus || 'Morphing Content...'}</p>
                          <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium">Synthesizing visual hierarchy and ATS semantics</p>
                        </div>
                        <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden p-0.5 border border-[var(--border-color)] shadow-inner">
                          <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity }}
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                          <span>AI Engine Active</span>
                          <span className="text-indigo-500 animate-pulse">~5s remaining</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (generatedHtml || (userData?.resumeHistory && userData.resumeHistory.length > 0)) ? (
                    <div className="relative flex-1 flex flex-col min-h-0 bg-[#f8fafc]">
                      {/* Minimalist Preview Toolbar */}
                      <div className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 z-40 shrink-0 shadow-sm">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-sm shrink-0">
                          <div className="text-[12px] font-bold text-indigo-600 flex items-center gap-1">
                            {currentPage} <span className="text-slate-300 font-medium">/</span> {totalPages}
                          </div>
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-tight">PAGES</div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <button 
                            onClick={() => setIsPreviewFull(!isPreviewFull)}
                            className={cn(
                              "p-2.5 rounded-xl transition-colors border",
                              isPreviewFull ? "text-indigo-600 bg-indigo-50 border-indigo-100 shadow-sm" : "text-slate-400 hover:bg-slate-50 border-transparent"
                            )}
                            title="Toggle Full Preview"
                          >
                            <Expand className="w-5 h-5" />
                          </button>
                          
                          <div className="w-px h-6 bg-slate-100 mx-1" />
                          
                          <button 
                            onClick={handleGenerate} 
                            disabled={isGenerating}
                            className="h-10 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-200/50"
                          >
                            <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                            <span className="hidden sm:inline uppercase">{isGenerating ? "Morphing..." : "Regenerate"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 flex min-h-0 overflow-hidden">
                        <div className={cn(
                          "relative flex-1 flex min-h-0",
                          isStyleMatcherActive ? "flex-row divide-x divide-slate-200" : "flex-col"
                        )}>
                          {isStyleMatcherActive && (
                            <div className="w-1/2 bg-slate-100 relative overflow-hidden flex flex-col">
                              {styleMatcherReference ? (
                                <div className="flex-1 relative p-4 md:p-8">
                                  <img 
                                    src={styleMatcherReference} 
                                    alt="Reference Layout" 
                                    className="w-full h-full object-contain shadow-2xl rounded-lg"
                                    referrerPolicy="no-referrer"
                                  />
                                  <button 
                                    onClick={() => setStyleMatcherReference(null)}
                                    className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur shadow-lg rounded-full text-slate-500 hover:text-red-500 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6 border border-slate-200">
                                    <ImageIcon className="w-10 h-10 text-slate-300" />
                                  </div>
                                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">No Reference Captured</h4>
                                  <p className="text-[10px] text-slate-400 font-medium max-w-[200px] mb-6">
                                    Use your camera or upload an image to compare your layout against a target structure.
                                  </p>
                                  <div className="flex flex-col gap-3 w-full max-w-[200px]">
                                    <button 
                                      onClick={() => setIsCameraOpen(true)}
                                      className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                                    >
                                      <Camera className="w-3.5 h-3.5" />
                                      Open Camera
                                    </button>
                                    <label className="w-full py-3 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
                                      <Upload className="w-3.5 h-3.5" />
                                      Upload Image
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const base64 = await fileToBase64(file);
                                            setStyleMatcherReference(base64);
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <div className={cn(
                            "relative flex-1 flex flex-col min-h-0 bg-slate-100/50 overflow-y-auto overflow-x-hidden scroll-smooth touch-pan-y",
                            isStyleMatcherActive ? "w-1/2" : "w-full"
                          )} id="preview-scroll-area" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
                            <div className="flex flex-col items-center py-8 md:py-12 min-h-full w-full">
                              {generatedHtml ? (
                                <ResumeIframe 
                                  html={previewHtml} 
                                  onLoad={() => setIsPreviewReady(true)} 
                                  isReady={isPreviewReady} 
                                  height={iframeHeight}
                                  ref={iframeRef}
                                />
                              ) : (
                                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-[#f8fafc] min-h-0 py-12">
                                  <FileText className="w-16 h-16 text-indigo-200 mb-4 stroke-1 animate-pulse" />
                                  <h3 className="font-extrabold text-base tracking-tight text-slate-500 uppercase">Select a Saved Resume</h3>
                                  <p className="text-xs text-slate-400 max-w-xs mt-2 font-medium">
                                    Choose one of your saved resumes from the dropdown above to load and view its layout on the screen.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {generatedHtml && totalPages > 0 && (
                          <div className="w-[140px] bg-slate-50 border-l border-slate-200 hidden lg:flex flex-col items-center py-6 gap-6 overflow-y-auto no-scrollbar">
                            <div className="px-4 w-full flex flex-col gap-4">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Outline</div>
                              <div className="flex flex-col gap-6 w-full">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                  <button 
                                    key={i}
                                    onClick={() => scrollToPage(i + 1)}
                                    className="flex flex-col items-center gap-2 group transition-all"
                                  >
                                    <div className={cn(
                                      "w-full aspect-[1/1.41] bg-white rounded shadow-sm transition-all overflow-hidden relative border",
                                      currentPage === i + 1 
                                        ? "border-indigo-500 ring-4 ring-indigo-500/10 scale-105" 
                                        : "border-slate-200 group-hover:border-slate-300 group-hover:shadow-md"
                                    )}>
                                      <div className="absolute inset-0 bg-slate-50 flex flex-col p-2 gap-1 opacity-20 group-hover:opacity-30 transition-opacity">
                                        <div className="h-1 w-3/4 bg-slate-400 rounded-full" />
                                        <div className="h-1 w-full bg-slate-300 rounded-full" />
                                        <div className="h-1 w-5/6 bg-slate-300 rounded-full" />
                                        <div className="mt-2 h-1 w-1/2 bg-slate-400 rounded-full" />
                                        <div className="h-1 w-full bg-slate-300 rounded-full" />
                                      </div>
                                      {currentPage === i + 1 && (
                                        <div className="absolute top-1 right-1 w-3 h-3 bg-indigo-500 rounded-full flex items-center justify-center">
                                          <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                                        </div>
                                      )}
                                    </div>
                                    <span className={cn(
                                      "text-[10px] font-bold tracking-tight uppercase",
                                      currentPage === i + 1 ? "text-indigo-600" : "text-slate-400"
                                    )}>Page {i + 1}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--bg-primary)] min-h-0"
                    >
                      <div className="w-32 h-32 md:w-40 md:h-40 bg-[var(--bg-secondary)] rounded-[40px] flex items-center justify-center mb-6 md:mb-8 rotate-3 border border-[var(--border-color)]">
                        <Layout className="w-16 h-16 md:w-20 md:h-20 text-[var(--text-tertiary)] opacity-20" />
                      </div>
                      <div className="max-w-sm">
                        <h3 className="font-black text-xl md:text-2xl tracking-tight text-[var(--text-tertiary)] opacity-30">Awaiting Morph</h3>
                        <p className="text-xs md:text-sm text-[var(--text-tertiary)] font-medium mt-2 md:mt-3 leading-relaxed opacity-50">
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
  </div>

      <AnimatePresence>
        {isCameraOpen && (
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Capture Reference</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Style Matcher Input</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCameraOpen(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 bg-black relative aspect-video sm:aspect-square max-h-[60vh] flex items-center justify-center overflow-hidden">
                <CameraPreview 
                  onCapture={(base64) => {
                    setStyleMatcherReference(base64);
                    setIsCameraOpen(false);
                  }} 
                />
              </div>

              <div className="p-6 bg-slate-900/50 flex items-center justify-center gap-4">
                <p className="text-[10px] text-slate-500 font-medium text-center max-w-xs">
                  Position the resume clearly in the frame. Captured images are processed locally and never stored.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Floating Actions */}
      <AnimatePresence>
        {generatedHtml && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-[150] flex flex-col gap-4"
          >
            {/* WhatsApp share */}
            <button 
              onClick={handleShareWhatsApp}
              disabled={isExporting || !isPreviewReady || isValidationInProgress}
              title="Share on WhatsApp"
              className="w-12 h-12 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white flex items-center justify-center shadow-2xl shadow-[#25D366]/30 transition-all hover:scale-110 active:scale-95 group relative disabled:opacity-50"
            >
              {isExporting || isValidationInProgress ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
              <div className="absolute left-full ml-4 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap">
                WhatsApp Share
              </div>
            </button>

            {/* Download Resume Link with Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={isExporting || !isPreviewReady || isValidationInProgress}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/30 transition-all hover:scale-110 active:scale-95 group relative disabled:opacity-50"
                title="Download Resume"
              >
                {isExporting || isValidationInProgress ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {showDownloadMenu && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping" />}
                
                <div className="absolute left-full ml-4 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap">
                  Download Options
                </div>
              </button>

              <AnimatePresence>
                {showDownloadMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10, x: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10, x: 10 }}
                    style={{ transformOrigin: 'bottom left' }}
                    className="absolute bottom-full left-0 mb-4 w-64 bg-[var(--bg-primary)] rounded-[32px] shadow-2xl border border-[var(--border-color)] p-3 z-20 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-1">
                      <button 
                        onClick={() => { handleDirectPrint(); setShowDownloadMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl flex items-center justify-between gap-3 transition-colors border border-dashed border-indigo-200 dark:border-indigo-800"
                      >
                        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                            <Zap className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs text-glow">Fast Print / PDF</span>
                            <span className="text-[8px] text-indigo-400 uppercase tracking-widest truncate">Instant High-Quality</span>
                          </div>
                        </div>
                      </button>
                      <button 
                        onClick={() => { handleDownloadPDF(); setShowDownloadMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[var(--text-primary)] text-xs">PDF Document</span>
                            <span className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-widest truncate">A4 Blueprint</span>
                          </div>
                        </div>
                        <kbd className="hidden sm:inline-block px-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[8px] font-mono font-bold leading-none text-[var(--text-tertiary)] uppercase shrink-0">Ctrl+P</kbd>
                      </button>
                      <button 
                        onClick={() => { handleDownloadImage('png'); setShowDownloadMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-secondary)] rounded-2xl flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[var(--text-primary)] text-xs">PNG Image</span>
                          <span className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-widest truncate">High Res Image</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => { handleDownloadImage('jpeg'); setShowDownloadMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-secondary)] rounded-2xl flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-4 h-4 text-pink-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[var(--text-primary)] text-xs">JPEG Image</span>
                          <span className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-widest truncate">Optimized Image</span>
                        </div>
                      </button>
                      <div className="h-px bg-[var(--border-color)] my-1 mx-2" />
                      <button 
                        onClick={() => { handleDownloadHTML(); setShowDownloadMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-secondary)] rounded-2xl flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                          <FileCode className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[var(--text-primary)] text-xs">HTML Source</span>
                          <span className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-widest truncate">Web format</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => { handleDownloadWord(); setShowDownloadMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-secondary)] rounded-2xl flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                          <FileType className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[var(--text-primary)] text-xs">Word Document</span>
                          <span className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-widest truncate">Editable .docx</span>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                ></textarea>

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
                  setActiveMobileTab('preview');
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

      {/* Universal Command Palette (Spotlight Search) */}
      <AnimatePresence>
        {showCommandPalette && (
          <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-24 px-4 bg-slate-950/60 backdrop-blur-md">
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={() => setShowCommandPalette(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              className="relative w-full max-w-xl bg-[var(--bg-primary)] rounded-3xl shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden max-h-[480px] z-10"
            >
              <div className="relative border-b border-[var(--border-color)]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  autoFocus
                  value={commandSearch}
                  onChange={(e) => {
                    setCommandSearch(e.target.value);
                    setCommandSelectedIndex(0);
                  }}
                  placeholder="Search actions, sections, or saved resumes..."
                  className="w-full py-5 pl-14 pr-12 bg-transparent text-sm font-bold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
                />
                <button 
                  onClick={() => setShowCommandPalette(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-tertiary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar py-2 divide-y divide-[var(--border-color)]/30">
                {filteredCommandItems.length > 0 ? (
                  (() => {
                    // Group elements by category
                    const categories: { [key: string]: typeof filteredCommandItems } = {};
                    filteredCommandItems.forEach(item => {
                      if (!categories[item.category]) categories[item.category] = [];
                      categories[item.category].push(item);
                    });

                    let globalIndex = 0;

                    return Object.entries(categories).map(([categoryName, items]) => (
                      <div key={categoryName} className="py-2">
                        <div className="px-5 py-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] opacity-60">
                          {categoryName}
                        </div>
                        <div className="space-y-0.5 mt-1 px-2">
                          {items.map((item) => {
                            const currentIndex = globalIndex++;
                            const isSelected = currentIndex === commandSelectedIndex;
                            const IconComponent = item.icon;

                            return (
                              <button
                                key={item.id}
                                onClick={item.action}
                                onMouseEnter={() => setCommandSelectedIndex(currentIndex)}
                                className={cn(
                                  "w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all text-left group",
                                  isSelected 
                                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold" 
                                    : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50"
                                )}
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className={cn(
                                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                    isSelected 
                                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none" 
                                      : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)]"
                                  )}>
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold truncate leading-snug">{item.title}</span>
                                    {item.subtitle && (
                                      <span className="text-[9px] text-[var(--text-tertiary)] opacity-80 truncate leading-none mt-0.5 font-medium">
                                        {item.subtitle}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {item.shortcut ? (
                                  <kbd className={cn(
                                    "hidden sm:inline-block px-2 py-0.5 rounded text-[8px] font-mono font-black border transition-colors",
                                    isSelected
                                      ? "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                                      : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-tertiary)]"
                                  )}>
                                    {item.shortcut}
                                  </kbd>
                                ) : (
                                  isSelected && (
                                    <span className="text-[10px] text-indigo-500 font-black tracking-widest uppercase shrink-0">Select</span>
                                  )
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()
                ) : (
                  <div className="p-10 text-center">
                    <AlertCircle className="w-10 h-10 text-[var(--text-tertiary)] opacity-30 mx-auto mb-3" />
                    <p className="text-xs font-bold text-[var(--text-secondary)]">No results match "{commandSearch}"</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Try searching for alternative keywords or actions.</p>
                  </div>
                )}
              </div>

              {/* Status bar help */}
              <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-secondary)]/80 border-t border-[var(--border-color)] text-[8px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
                  <span>ESC Close</span>
                </div>
                <div>
                  <span>{APP_VERSION} AI Engine</span>
                </div>
              </div>
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
                ></textarea>
                
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
                          if (onLogin && !isLoginProgress) {
                            await onLogin();
                            if (auth.currentUser) {
                              setShowLoginPrompt(false);
                              setIsLoginPendingForDownload(false);
                            }
                          }
                        }}
                        disabled={isLoginProgress}
                        className="group relative w-full py-5 sm:py-6 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] sm:rounded-[2rem] font-black text-sm sm:text-base uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-500/20 dark:shadow-white/10 flex items-center justify-center gap-3 overflow-hidden border border-slate-800 dark:border-slate-200 disabled:opacity-50"
                      >
                        <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                          {isLoginProgress ? (
                            <Loader2 className="w-4 h-4 sm:w-5 h-5 animate-spin" />
                          ) : (
                            <LogIn className="w-4 h-4 sm:w-5 h-5 group-hover:animate-pulse" />
                          )}
                          {isLoginProgress ? 'Connecting...' : 'Continue with Google'}
                        </span>
                      </button>
                    </>
                  )}
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Share link copied successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}

function CameraPreview({ onCapture }: { onCapture: (base64: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsActive(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Could not access camera. Please check permissions.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(base64);
      }
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black group">
      {error ? (
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white text-sm font-bold uppercase tracking-widest">{error}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {isActive && (
            <div className="absolute inset-0 border-2 border-white/20 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 border-2 border-dashed border-indigo-400/50 rounded-2xl" />
            </div>
          )}

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
            <button 
              onClick={capture}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group/btn"
            >
              <div className="w-16 h-16 border-4 border-slate-900 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-indigo-600 rounded-full group-hover/btn:bg-indigo-700 transition-colors" />
              </div>
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-black/40 backdrop-blur px-4 py-1.5 rounded-full">
              Click to capture DNA
            </span>
          </div>
        </>
      )}
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

export default memo(ResumeBuilder);
