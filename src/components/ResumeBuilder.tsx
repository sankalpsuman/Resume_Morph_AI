import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileText, CheckCircle, Loader2, Download, Eye, Layout, 
  FileUp, RefreshCw, ChevronDown, FileCode, FileType, Printer, 
  Maximize2, Minimize2 
} from 'lucide-react';
import { analyzeLayout, generateResume, extractTextFromAny } from '../lib/gemini';
import mammoth from 'mammoth';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface FileData {
  file: File;
  base64?: string;
  text?: string;
  type: string;
}

export default function ResumeBuilder() {
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
  const [error, setError] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isPreviewFull, setIsPreviewFull] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  useEffect(() => {
    // Check if API key is missing on mount
    const apiKey = 
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined) || 
      (typeof process !== 'undefined' ? process.env?.API_KEY : undefined) ||
      ((import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      (window as any).GEMINI_API_KEY ||
      "";
    
    if (!apiKey) {
      setNeedsApiKey(true);
      setError("Gemini API Key is missing. Please configure it to use the Morph Engine.");
    }
  }, []);

  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const onDropReference = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setNeedsApiKey(false);
    try {
      const base64 = await fileToBase64(file);
      const analysis = await analyzeLayout(base64.split(',')[1], file.type);
      setReferenceFile({ file, base64, type: file.type });
      setLayoutAnalysis(analysis);
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING" || err.message?.includes("API key not valid")) {
        setNeedsApiKey(true);
        setError("API Key required. Please select your Gemini API key to continue.");
      } else {
        setError("Failed to analyze reference resume. Please try a different file.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDropContent = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsGenerating(true);
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
        // For PDF/Images, we'll let Gemini extract the content text too
        const base64 = await fileToBase64(file);
        text = await extractTextFromAny(base64.split(',')[1], file.type);
      }

      setContentFile({ file, text, type: file.type });
      
      if (layoutAnalysis) {
        const result = await generateResume(layoutAnalysis, text, jobDescription);
        setGeneratedHtml(result.html);
        setResumeMetadata({ name: result.name, yoe: result.yoe, profile: result.profile });
        setAtsScore(result.atsScore);
        setAtsFeedback(result.atsFeedback);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING" || err.message?.includes("API key not valid")) {
        setNeedsApiKey(true);
        setError("API Key required. Please select your Gemini API key to continue.");
      } else {
        setError("Failed to process your content. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimize = async () => {
    if (!layoutAnalysis || !contentFile?.text) return;
    
    setIsGenerating(true);
    setError(null);
    setNeedsApiKey(false);
    try {
      const result = await generateResume(layoutAnalysis, contentFile.text, jobDescription);
      setGeneratedHtml(result.html);
      setResumeMetadata({ name: result.name, yoe: result.yoe, profile: result.profile });
      setAtsScore(result.atsScore);
      setAtsFeedback(result.atsFeedback);
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING" || err.message?.includes("API key not valid")) {
        setNeedsApiKey(true);
        setError("API Key required. Please select your Gemini API key to continue.");
      } else {
        setError("Failed to re-optimize resume. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.openSelectKey) {
      await aistudio.openSelectKey();
      // After selecting, the app will refresh or the key will be injected
      // In AI Studio, it usually refreshes the preview.
      setError(null);
      setNeedsApiKey(false);
    } else {
      alert("Please configure your GEMINI_API_KEY in the Secrets panel.");
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
              @page { margin: 0; }
              body { margin: 1.6cm; padding: 0; }
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
        <div className="max-w-[1440px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-300">
              <RefreshCw className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">Resume Morph</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold">AI Style Cloning Engine</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {generatedHtml && (
              <div className="relative">
                <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="flex items-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all active:scale-95 shadow-2xl shadow-gray-200"
                >
                  <Download className="w-4 h-4" />
                  Export Resume
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showDownloadMenu && "rotate-180")} />
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
                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                title="Reset All"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[32px] border border-gray-200 shadow-sm space-y-10">
              
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
                      <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    )}
                    {isGenerating ? "Optimizing..." : "Re-Morph with Optimization"}
                  </motion.button>
                )}
              </section>

              <section className={cn("transition-all duration-500", !layoutAnalysis && "opacity-30 pointer-events-none blur-[1px]")}>
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
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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
                      className="w-full py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
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
            "transition-all duration-700 ease-in-out",
            isPreviewFull 
              ? "fixed inset-0 z-[200] bg-[#F8F9FA] p-8 overflow-y-auto" 
              : "lg:col-span-8 sticky top-32"
          )}>
            <div className={cn(
              "bg-white rounded-[40px] border border-gray-200 shadow-2xl shadow-indigo-200/20 flex flex-col overflow-hidden group transition-all duration-500",
              isPreviewFull ? "min-h-screen w-full max-w-5xl mx-auto" : "min-h-[850px]"
            )}>
              <div className="h-16 border-b border-gray-100 px-10 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Live Preview Engine</span>
                  </div>
                  
                  {atsScore !== null && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 pl-6 border-l border-gray-200"
                    >
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                        atsScore >= 80 ? "bg-green-100 text-green-700" : 
                        atsScore >= 50 ? "bg-yellow-100 text-yellow-700" : 
                        "bg-red-100 text-red-700"
                      )}>
                        ATS Score: {atsScore}%
                      </div>
                      {atsFeedback && (
                        <span className="text-[10px] font-bold text-gray-400 truncate max-w-[200px]" title={atsFeedback}>
                          {atsFeedback}
                        </span>
                      )}
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {generatedHtml && (
                    <button 
                      onClick={() => setIsPreviewFull(!isPreviewFull)}
                      className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      {isPreviewFull ? (
                        <>
                          <Minimize2 className="w-3 h-3" />
                          Exit Full View
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3 h-3" />
                          Full View
                        </>
                      )}
                    </button>
                  )}
                  <div className="flex gap-2">
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
                        isPreviewFull ? "min-h-[1200px]" : "h-[784px]"
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
                              body { font-family: 'Inter', sans-serif; margin: 0; padding: 3rem; background: white; color: #1a1a1a; }
                              .resume-container { max-width: 800px; margin: 0 auto; }
                              @media print {
                                @page { margin: 0; }
                                body { margin: 1.6cm; padding: 0; }
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
            <FileUp className="w-8 h-8" />
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
