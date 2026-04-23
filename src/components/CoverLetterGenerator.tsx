import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Send, Loader2, Copy, Check, Download, Wand2 } from 'lucide-react';
import { generateCoverLetter } from '../lib/gemini';
import { cn } from '../lib/utils';

export default function CoverLetterGenerator({ resumeData }: { resumeData: any }) {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!jobTitle) return;
    setIsGenerating(true);
    try {
      const resumeText = JSON.stringify(resumeData);
      const letter = await generateCoverLetter(resumeText, jobTitle, company, jobDescription);
      setGeneratedLetter(letter);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    if (!generatedLetter) return;
    const blob = new Blob([generatedLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover_Letter_${jobTitle.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-12 md:py-20">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Left: Input Form */}
        <div className="w-full md:w-1/3 space-y-10">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-[24px] flex items-center justify-center shadow-2xl shadow-indigo-200">
              <FileText className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">AI Cover Letter</h1>
            <p className="text-gray-500 font-medium leading-relaxed">
              Generate a tailored, high-conversion cover letter based on your resume and target role.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Job Title</label>
              <input 
                type="text" 
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Product Designer"
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Name</label>
              <input 
                type="text" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Job Description (Optional)</label>
              <textarea 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the JD for better tailoring..."
                className="w-full h-40 p-4 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all outline-none resize-none"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !jobTitle}
              title="AI will analyze your profile and the job description to craft a unique cover letter"
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Wand2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Generate Letter
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Output */}
        <div className="flex-1 bg-white border border-gray-100 rounded-[48px] p-8 md:p-12 shadow-2xl relative min-h-[600px] flex flex-col">
          <AnimatePresence mode="wait">
            {generatedLetter ? (
              <motion.div 
                key="letter"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Output Ready</p>
                      <p className="font-black text-gray-900 tracking-tight">Tailored Cover Letter</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={downloadTxt}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Download .txt
                    </button>
                  </div>
                </div>

                <div className="flex-1 whitespace-pre-wrap text-gray-700 leading-relaxed font-serif text-lg p-4">
                  {generatedLetter}
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center">
                  <Send className="w-10 h-10 text-gray-200" />
                </div>
                <div className="max-w-xs">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Awaiting Input</p>
                  <p className="text-sm text-gray-400 font-medium">Your professional cover letter will appear here once you provide the job details.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
