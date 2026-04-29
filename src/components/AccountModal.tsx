import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Calendar, Star, Zap, FileText, Download, Eye, LogOut, Shield, Trophy, Activity, Clock, Trash2, AlertCircle, MessageSquare, Reply, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { PLANS } from '../constants';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { compareResumes } from '../lib/gemini';
import { Loader2, Diff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userData: any;
  onLogout: () => void;
  onUpgrade: () => void;
  onOpenAdmin: () => void;
  onDeleteResume: (resumeId: string) => Promise<void>;
  isTabMode?: boolean;
}

export default function AccountModal({ 
  isOpen, 
  onClose, 
  user, 
  userData, 
  onLogout, 
  onUpgrade, 
  onOpenAdmin, 
  onDeleteResume,
  isTabMode = false
}: AccountModalProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userFeedback, setUserFeedback] = useState<any[]>([]);
  const [diffData, setDiffData] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparingResume, setComparingResume] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'feedbacks'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserFeedback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  if (!user || !userData) return null;

  const getLevel = (count: number) => {
    if (count >= 100) return { name: 'Grandmaster', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-900/30', icon: Trophy };
    if (count >= 50) return { name: 'Expert', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-900/30', icon: Star };
    if (count >= 10) return { name: 'Pro', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-900/30', icon: Zap };
    return { name: 'Novice', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20', border: 'border-gray-200 dark:border-gray-900/30', icon: User };
  };

  const usedMorphs = userData.usedMorphs !== undefined ? userData.usedMorphs : (userData.morphCount || 0);
  const userLevel = getLevel(usedMorphs);
  const currentPlan = PLANS.find(p => p.id === (userData.plan || 'free')) || PLANS[0];
  const planLimit = userData.planLimit === -1 ? Infinity : (userData.planLimit || currentPlan.limit);
  const progress = planLimit === Infinity ? 0 : Math.min((usedMorphs / (planLimit as number)) * 100, 100);

  const joinedDate = userData.createdAt?.toDate 
    ? userData.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const recentResumes = userData.resumeHistory ? [...userData.resumeHistory].sort((a: any, b: any) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 3) : [];

  const handleDownload = (resume: any) => {
    if (!resume.html) return;
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
    if (!resume.html) return;
    try {
      const blob = new Blob([resume.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      // Fallback for some browsers
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(resume.html);
        win.document.close();
      }
    }
  };

  const handleCompare = async (resume: any) => {
    if (!resume.html) return;
    setIsComparing(true);
    setComparingResume(resume);
    try {
      // Create a plain text version for AI comparison
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = resume.html;
      const cleanText = tempDiv.innerText || tempDiv.textContent || "";
      
      // Use original text if available, otherwise fallback to generic label
      const originalText = resume.originalText || "Original Content (Not Available)";
      
      const comparison = await compareResumes(originalText, cleanText);
      setDiffData(comparison);
    } catch (err) {
      console.error("Comparison failed:", err);
      setDiffData("Failed to generate comparison. Please try again.");
    } finally {
      setIsComparing(false);
    }
  };

  const content = (
    <>
      <div className={cn(
        "relative w-full bg-[var(--bg-primary)] flex flex-col",
        isTabMode 
          ? "w-full pb-32 rounded-[32px] md:rounded-[40px] shadow-sm border border-[var(--border-color)] overflow-y-auto overflow-x-hidden min-h-[60vh] max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-160px)]" 
          : "w-full sm:max-w-3xl sm:rounded-[48px] shadow-2xl overflow-y-auto overflow-x-hidden border border-[var(--border-color)] max-h-screen sm:max-h-[85vh] my-auto"
      )}>
        {/* Header - Only show in modal mode */}
        {!isTabMode && (
          <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border-color)] flex items-center justify-between bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] sticky top-0 z-10">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-600 rounded-xl sm:rounded-[20px] flex items-center justify-center shadow-xl shadow-indigo-500/20 dark:shadow-none shrink-0">
                <User className="text-white w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight leading-none">Account Profile</h2>
                <p className="text-[8px] sm:text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-[0.2em] mt-1">Manage your identity & history</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 sm:p-3 hover:bg-[var(--bg-secondary)] rounded-2xl transition-all active:scale-90"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-tertiary)]" />
            </button>
          </div>
        )}

        <div className={cn(
          "flex-grow p-4 sm:p-6 md:p-12 space-y-6 sm:space-y-8 md:space-y-12",
          isTabMode ? "w-full" : "overflow-y-auto"
        )}>
          {/* Profile Section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
            {/* Left: Avatar & Basic Info */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 p-6 md:p-8 bg-[var(--bg-primary)] rounded-[32px] md:rounded-[40px] border border-[var(--border-color)] shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 transition-all group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30" />
                
                  <div className="relative shrink-0">
                  <img 
                    src={userData.photo || user.photoURL} 
                    alt={userData.name || user.displayName} 
                    className="w-24 h-24 md:w-32 md:h-32 rounded-[24px] md:rounded-[32px] border-4 border-[var(--bg-primary)] shadow-2xl object-cover relative z-10"
                  />
                  <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg z-20">
                    {userLevel.name}
                  </div>
                </div>

                <div className="flex-grow text-center md:text-left space-y-4 relative z-10 w-full md:w-auto">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)] flex items-center justify-center md:justify-start gap-2">
                      {userData.name || user.displayName}
                      {user.email === 'sankalpsmn@gmail.com' && <Shield className="w-5 h-5 text-indigo-600" />}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                      <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs font-bold truncate max-w-[200px]">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold">Joined {joinedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
                      {currentPlan.name} Plan
                    </div>
                    {user.email === 'sankalpsmn@gmail.com' && (
                      <button
                        onClick={onOpenAdmin}
                        className="px-4 py-2 bg-gray-900 dark:bg-neutral-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black dark:hover:bg-neutral-700 transition-all flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Admin
                      </button>
                    )}
                    {user.email !== 'sankalpsmn@gmail.com' && (!userData.plan || userData.plan === 'free') && (
                      <button
                        onClick={onUpgrade}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 dark:shadow-none hover:shadow-indigo-500/40 transition-all flex items-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 h-fit">
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-[var(--bg-primary)] dark:from-indigo-900/10 dark:to-[var(--bg-primary)] rounded-[32px] border border-indigo-100/50 dark:border-indigo-900/30 flex items-center gap-4 md:gap-5 shadow-sm">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 dark:shadow-none shrink-0">
                  <Activity className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{usedMorphs}</p>
                  <p className="text-[9px] md:text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Total Morphs</p>
                </div>
              </div>
              
              <div className="p-6 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[32px] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-widest">Usage Progress</p>
                  <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{usedMorphs} / {planLimit === Infinity ? '∞' : planLimit}</p>
                </div>
                <div className="w-full h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-color)] shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${planLimit === Infinity ? 0 : progress}%` }}
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                  />
                </div>
                <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mt-3">
                  {planLimit === Infinity ? 'Unlimited access enabled' : `${Math.max(0, (planLimit as number) - usedMorphs)} morphs remaining`}
                </p>
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[8px] text-[var(--text-tertiary)] font-black uppercase tracking-widest mb-1">Free Credits</p>
                    <p className="text-sm font-black text-[var(--text-secondary)]">{userData.freeMorphsUsed || 0}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                    <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mb-1">Premium Credits</p>
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{userData.premiumMorphsUsed || 0}</p>
                  </div>
                </div>

                <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-center">
                  {planLimit === Infinity ? 'Unlimited access enabled' : `${Math.max(0, (planLimit as number) - usedMorphs)} morphs remaining`}
                </p>
                {userData.lastResetAt && (
                  <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest text-center">
                    Last Reset: {userData.lastResetAt.toDate ? userData.lastResetAt.toDate().toLocaleDateString() : new Date(userData.lastResetAt).toLocaleDateString()}
                  </p>
                )}
                {userData.revokeReason && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
                    <p className="text-[8px] text-red-400 font-black uppercase tracking-widest mb-1">Revocation Notice</p>
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 leading-tight">{userData.revokeReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent History */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center border border-[var(--border-color)]">
                  <Clock className="w-5 h-5 text-[var(--text-tertiary)]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Recent Activity</h3>
                  <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Your latest resume transformations</p>
                </div>
              </div>
            </div>

            {recentResumes.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {recentResumes.map((resume: any) => (
                  <div 
                    key={resume.id}
                    className="group flex flex-col md:flex-row items-center justify-between p-6 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]/50 rounded-[32px] border border-[var(--border-color)] hover:border-indigo-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-none"
                  >
                    <div className="flex items-center gap-5 w-full md:w-auto mb-4 md:mb-0">
                      <div className="w-14 h-14 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-[var(--bg-primary)] group-hover:shadow-md transition-all">
                        <FileText className="w-7 h-7 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-black text-[var(--text-primary)] text-base">{resume.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">
                            {new Date(resume.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <div className="w-1 h-1 bg-[var(--border-color)] rounded-full" />
                          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">
                            {new Date(resume.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
                      <button 
                        onClick={() => handleCompare(resume)}
                        className="flex-grow md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-indigo-100 dark:border-indigo-900/20 shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-all active:scale-95"
                      >
                        <Diff className="w-4 h-4" />
                        Differences
                      </button>
                      <button 
                        onClick={() => handlePreview(resume)}
                        className="flex-grow md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-[var(--bg-primary)] text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-widest rounded-2xl border border-[var(--border-color)] shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button 
                        onClick={() => handleDownload(resume)}
                        className="flex-grow md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-500/20 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(resume.id)}
                        className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all active:scale-90"
                        title="Delete Resume"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center bg-[var(--bg-secondary)]/30 rounded-[48px] border-2 border-dashed border-[var(--border-color)]">
                <div className="w-20 h-20 bg-[var(--bg-primary)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <FileText className="w-10 h-10 text-[var(--border-color)]" />
                </div>
                <h4 className="text-lg font-black text-[var(--text-primary)] mb-2">No History Found</h4>
                <p className="text-[var(--text-tertiary)] font-bold text-sm max-w-xs mx-auto">Start your first resume transformation to see your history here.</p>
              </div>
            )}
          </div>

          {/* User Feedback History */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/20">
                  <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Your Feedback</h3>
                  <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">History of your shared thoughts</p>
                </div>
              </div>
              <div className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/20">
                {userFeedback.length} Submissions
              </div>
            </div>

            {userFeedback.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {userFeedback.map((feedback: any) => (
                  <div 
                    key={feedback.id}
                    className="p-6 bg-[var(--bg-primary)] rounded-[32px] border border-[var(--border-color)] space-y-4 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {feedback.createdAt?.toDate ? feedback.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                      {feedback.reply && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[8px] font-black uppercase tracking-widest">
                          <CheckCircle className="w-3 h-3" />
                          Responded
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">"{feedback.message}"</p>
                    {feedback.reply && (
                      <div className="pl-4 border-l-2 border-indigo-100 dark:border-indigo-900/30 pt-1">
                        <div className="flex items-center gap-2 text-[8px] font-black text-indigo-400 dark:text-indigo-400 uppercase tracking-widest mb-1">
                          <Reply className="w-3 h-3" />
                          Team Reply
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] font-medium italic">"{feedback.reply}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-[var(--bg-secondary)]/30 rounded-[40px] border-2 border-dashed border-[var(--border-color)]">
                <p className="text-[var(--text-tertiary)] font-bold text-sm">No feedback submitted yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          "p-8 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-6",
          isTabMode && "w-full rounded-b-[40px] mb-20"
        )}>
          <button 
            onClick={onLogout}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Account
          </button>
          <div className="text-center sm:text-right">
            <p className="text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-[0.2em]">
              Resume Morph v1.0.4
            </p>
            <p className="text-[9px] text-[var(--border-color)] font-bold uppercase tracking-widest mt-1">
              Secure Cloud Infrastructure
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Modal Overlay */}
      <AnimatePresence>
        {(isComparing || diffData) && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto bg-gray-900/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-2xl bg-[var(--bg-primary)] sm:rounded-[48px] shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-screen sm:max-h-[85vh] my-auto"
            >
              {/* Header */}
              <div className="p-4 sm:p-8 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)] sticky top-0 z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-[1rem] sm:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 dark:shadow-none shrink-0">
                    {isComparing ? (
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
                    ) : (
                      <Diff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight leading-none">
                      {isComparing ? 'Analyzing...' : 'Morph Analysis'}
                    </h3>
                    <p className="text-[8px] sm:text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest mt-1 sm:mt-2">
                       AI textual evolution evolution
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setDiffData(null); setComparingResume(null); }}
                  className="p-2 sm:p-3 hover:bg-[var(--bg-secondary)] rounded-2xl transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-tertiary)]" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-8 overflow-y-auto prose dark:prose-invert max-w-none flex-grow">
                {isComparing ? (
                  <div className="py-20 text-center space-y-6">
                    <div className="flex justify-center gap-2">
                      <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <p className="text-[var(--text-secondary)] font-black text-xs uppercase tracking-widest animate-pulse">Running Deep Difference Analysis...</p>
                    <p className="text-[var(--text-tertiary)] text-sm font-medium">Comparing original intent with generated narrative fidelity.</p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[32px] border border-indigo-100 dark:border-indigo-900/20 mb-8">
                       <div className="flex items-center gap-3 mb-2">
                          <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Target Integrity: 100%</span>
                       </div>
                       <p className="text-xs text-indigo-800 dark:text-indigo-200 font-medium leading-relaxed">
                         Our Morph Engine has processed the content from <b>{comparingResume?.name}</b> and optimized it for higher ATS impact while maintaining strict structural harmony.
                       </p>
                    </div>
                    <div className="markdown-content prose-neutral dark:prose-invert dark:prose-p:text-gray-300 dark:prose-strong:text-white dark:prose-code:text-indigo-400">
                      <ReactMarkdown>
                        {diffData || ''}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              {!isComparing && (
                <div className="p-8 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex justify-end">
                  <button
                    onClick={() => { setDiffData(null); setComparingResume(null); }}
                    className="px-10 py-4 bg-neutral-900 dark:bg-neutral-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 dark:shadow-none"
                  >
                    Done Reviewing
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[var(--bg-primary)] rounded-[32px] p-8 shadow-2xl border border-[var(--border-color)] text-center"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">Delete Resume?</h3>
              <p className="text-sm text-[var(--text-tertiary)] font-medium mb-8">
                This action is permanent and cannot be undone. Your saved resume will be cleared from our database.
              </p>
              <div className="flex gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[var(--border-color)] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={async () => {
                    try {
                      setIsDeleting(true);
                      await onDeleteResume(deleteConfirm);
                    } catch (err) {
                      console.error("Delete failed:", err);
                    } finally {
                      setIsDeleting(false);
                      setDeleteConfirm(null);
                    }
                  }}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-100 dark:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  if (isTabMode) return content;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="flex flex-col w-full max-w-3xl my-auto"
          >
            {content}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
