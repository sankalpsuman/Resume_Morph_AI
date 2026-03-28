import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Calendar, Star, Zap, FileText, Download, Eye, LogOut, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userData: any;
  onLogout: () => void;
  onUpgrade: () => void;
}

export default function AccountModal({ isOpen, onClose, user, userData, onLogout, onUpgrade }: AccountModalProps) {
  if (!user || !userData) return null;

  const joinedDate = userData.createdAt?.toDate 
    ? userData.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const recentResumes = userData.resumeHistory ? [...userData.resumeHistory].sort((a: any, b: any) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 2) : [];

  const handleDownload = (resume: any) => {
    if (!resume.html) {
      alert("Resume content not found in history.");
      return;
    }
    const blob = new Blob([resume.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreview = (resume: any) => {
    if (!resume.html) {
      alert("Resume content not found in history.");
      return;
    }
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(resume.html);
      win.document.close();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <User className="text-white w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Account Settings</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Manage your profile & history</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white rounded-xl transition-colors shadow-sm"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-10">
              {/* Profile Info */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex items-center gap-6 p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName} 
                    className="w-20 h-20 rounded-[24px] border-4 border-white shadow-xl"
                  />
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-gray-900">{user.displayName}</h3>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">Joined {joinedDate}</span>
                    </div>
                    <button
                      onClick={onUpgrade}
                      className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 w-fit"
                    >
                      <Zap className="w-3 h-3 fill-white" />
                      Upgrade to Premium
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100/50 flex flex-col justify-center items-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                      <Star className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-indigo-600">{userData.morphCount}</p>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Total Morphs</p>
                    </div>
                  </div>
                  <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100/50 flex flex-col justify-center items-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-100">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-amber-600">{Math.max(0, 2 - userData.morphCount)}</p>
                      <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Free Credits</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Resumes */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">My Recent Resumes</h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last 2 conversions</span>
                </div>

                {recentResumes.length > 0 ? (
                  <div className="grid gap-4">
                    {recentResumes.map((resume: any) => (
                      <div 
                        key={resume.id}
                        className="group flex items-center justify-between p-5 bg-gray-50/50 hover:bg-white rounded-[24px] border border-transparent hover:border-indigo-100 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-100/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-indigo-50 transition-colors">
                            <FileText className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-sm">{resume.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              {new Date(resume.timestamp).toLocaleDateString()} • {new Date(resume.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handlePreview(resume)}
                            className="p-2.5 bg-white text-gray-400 hover:text-indigo-600 rounded-xl shadow-sm border border-gray-100 transition-all hover:scale-110"
                            title="Quick Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDownload(resume)}
                            className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 transition-all hover:scale-110 active:scale-95"
                            title="Download HTML"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <FileText className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-bold text-sm">No resume history yet.</p>
                    <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">Start morphing to see your history here.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
              <button 
                onClick={onLogout}
                className="flex items-center gap-3 px-6 py-3 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Resume Morph v1.0
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
