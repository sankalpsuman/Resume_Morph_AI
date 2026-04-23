import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Zap, FileText, CheckCircle, Loader2, AlertCircle, Sparkles, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function SmartEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatedResume, setUpdatedResume] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
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

  const handleSmartInsert = async () => {
    if (!file || !title || !description) {
      setError('Please provide a resume, title, and description.');
      return;
    }

    setLoading(true);
    setError(null);
    setUpdatedResume(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('title', title);
    formData.append('description', description);

    try {
      const response = await fetch('/api/smart-insert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process resume');
      }

      const data = await response.json();
      setUpdatedResume(data.updatedResume);
    } catch (err) {
      console.error(err);
      setError('An error occurred while processing your resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-black uppercase tracking-widest mb-4"
        >
          <Zap className="w-4 h-4 fill-indigo-600" />
          AI Insert Mode
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
          Smart Resume Editor
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">
          Instantly insert new experiences, projects, or skills into your existing resume using AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-indigo-100/20 border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              Upload & Details
            </h3>

            <div className="space-y-6">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  "relative group cursor-pointer transition-all duration-500",
                  "border-2 border-dashed rounded-[24px] p-8 text-center",
                  isDragActive ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50/50",
                  file && "border-green-500 bg-green-50/30"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                    file ? "bg-green-100 text-green-600" : "bg-indigo-50 text-indigo-600 group-hover:scale-110"
                  )}>
                    {file ? <CheckCircle className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900">
                      {file ? file.name : "Drop your resume here"}
                    </p>
                    <p className="text-sm text-gray-400 font-bold mt-1 uppercase tracking-widest">
                      PDF, DOCX, or TXT
                    </p>
                  </div>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                  Entry Title (e.g. Senior Developer)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What is the role or project title?"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                  Description / Details
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your achievements, responsibilities, or skills..."
                  rows={5}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <button
                onClick={handleSmartInsert}
                disabled={loading || !file || !title || !description}
                className={cn(
                  "w-full py-5 rounded-[22px] text-sm font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 shadow-xl",
                  loading || !file || !title || !description
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Smart Insert
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:sticky lg:top-32 h-fit">
          <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-indigo-100/20 border border-gray-100 min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                Preview
              </h3>
              {updatedResume && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle className="w-3 h-3" />
                  Updated
                </div>
              )}
            </div>

            <div className="flex-grow bg-gray-50/50 rounded-[24px] p-6 border border-gray-100 overflow-y-auto max-h-[700px] relative">
              <AnimatePresence mode="wait">
                {updatedResume ? (
                  <motion.div
                    key="updated"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-sm max-w-none"
                  >
                    <div 
                      className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-700"
                      dangerouslySetInnerHTML={{ __html: updatedResume }}
                    />
                  </motion.div>
                ) : loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
                    <h4 className="text-lg font-black text-gray-900 mb-2">AI is working...</h4>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
                      Parsing resume & inserting content
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 mb-6">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-black text-gray-400 mb-2">No Preview Available</h4>
                    <p className="text-sm text-gray-300 font-bold uppercase tracking-widest">
                      Upload a resume and click Smart Insert
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {updatedResume && (
              <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  Tip: Highlighted text shows new additions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .new-content {
          background-color: #e0e7ff;
          color: #4338ca;
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: 700;
          border: 1px solid #c7d2fe;
        }
      `}} />
    </div>
  );
}
