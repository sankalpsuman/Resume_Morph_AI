import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Calendar, Star, Zap, FileText, Download, Eye, LogOut, Shield, Trophy, Activity, Clock, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

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
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!user || !userData) return null;

  const getLevel = (count: number) => {
    if (count >= 100) return { name: 'Grandmaster', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: Trophy };
    if (count >= 50) return { name: 'Expert', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: Star };
    if (count >= 10) return { name: 'Pro', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Zap };
    return { name: 'Novice', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: User };
  };

  const usedMorphs = userData.usedMorphs !== undefined ? userData.usedMorphs : (userData.morphCount || 0);
  const userLevel = getLevel(usedMorphs);
  const planLimit = userData.planLimit === -1 ? 100 : (userData.planLimit || 2);
  const progress = Math.min((usedMorphs / planLimit) * 100, 100);

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
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(resume.html);
      win.document.close();
    }
  };

  const content = (
    <>
      <div className={cn(
        "relative w-full bg-white flex flex-col",
        isTabMode ? "min-h-screen pt-24 pb-32" : "max-w-3xl rounded-[48px] shadow-2xl overflow-hidden border border-gray-100 max-h-[80vh]"
      )}>
        {/* Header - Only show in modal mode */}
        {!isTabMode && (
          <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center shadow-xl shadow-indigo-100">
                <User className="text-white w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Account Profile</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Manage your identity & history</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        )}

        <div className={cn(
          "flex-grow p-6 md:p-10 space-y-10",
          isTabMode ? "max-w-6xl mx-auto w-full" : "overflow-y-auto"
        )}>
          {/* Profile Section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Avatar & Basic Info */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 transition-all group-hover:bg-indigo-100" />
                
                <div className="relative shrink-0">
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName} 
                    className="w-32 h-32 rounded-[32px] border-4 border-white shadow-2xl object-cover relative z-10"
                  />
                  <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg z-20">
                    {userLevel.name}
                  </div>
                </div>

                <div className="flex-grow text-center md:text-left space-y-4 relative z-10">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 flex items-center justify-center md:justify-start gap-2">
                      {user.displayName}
                      {user.email === 'sankalpsmn@gmail.com' && <Shield className="w-5 h-5 text-indigo-600" />}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs font-bold">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold">Joined {joinedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      {userData.plan || 'Free'} Plan
                    </div>
                    {user.email === 'sankalpsmn@gmail.com' && (
                      <button
                        onClick={onOpenAdmin}
                        className="px-4 py-2 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gray-100 hover:bg-black transition-all flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Admin Panel
                      </button>
                    )}
                    {user.email !== 'sankalpsmn@gmail.com' && (!userData.plan || userData.plan === 'free') && (
                      <button
                        onClick={onUpgrade}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        Upgrade Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-[32px] border border-indigo-100/50 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-100 shrink-0">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-black text-indigo-600 leading-none">{usedMorphs}</p>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Total Morphs</p>
                </div>
              </div>
              
              <div className="p-6 bg-white border border-gray-100 rounded-[32px] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Usage Progress</p>
                  <p className="text-xs font-black text-indigo-600">{usedMorphs} / {userData.planLimit === -1 ? '∞' : (userData.planLimit || 2)}</p>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Free Credits</p>
                    <p className="text-sm font-black text-gray-700">{userData.freeMorphsUsed || 0}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mb-1">Premium Credits</p>
                    <p className="text-sm font-black text-indigo-600">{userData.premiumMorphsUsed || 0}</p>
                  </div>
                </div>

                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center">
                  {userData.planLimit === -1 ? 'Unlimited access enabled' : `${Math.max(0, (userData.planLimit || 2) - usedMorphs)} morphs remaining`}
                </p>
                {userData.lastResetAt && (
                  <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest text-center">
                    Last Reset: {userData.lastResetAt.toDate ? userData.lastResetAt.toDate().toLocaleDateString() : new Date(userData.lastResetAt).toLocaleDateString()}
                  </p>
                )}
                {userData.revokeReason && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-2xl">
                    <p className="text-[8px] text-red-400 font-black uppercase tracking-widest mb-1">Revocation Notice</p>
                    <p className="text-[10px] font-bold text-red-600 leading-tight">{userData.revokeReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent History */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Recent Activity</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Your latest resume transformations</p>
                </div>
              </div>
            </div>

            {recentResumes.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {recentResumes.map((resume: any) => (
                  <div 
                    key={resume.id}
                    className="group flex flex-col md:flex-row items-center justify-between p-6 bg-white hover:bg-gray-50/50 rounded-[32px] border border-gray-100 hover:border-indigo-100 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/20"
                  >
                    <div className="flex items-center gap-5 w-full md:w-auto mb-4 md:mb-0">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                        <FileText className="w-7 h-7 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-base">{resume.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {new Date(resume.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <div className="w-1 h-1 bg-gray-200 rounded-full" />
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {new Date(resume.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => handlePreview(resume)}
                        className="flex-grow md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-600 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button 
                        onClick={() => handleDownload(resume)}
                        className="flex-grow md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(resume.id)}
                        className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                        title="Delete Resume"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center bg-gray-50/30 rounded-[48px] border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <FileText className="w-10 h-10 text-gray-200" />
                </div>
                <h4 className="text-lg font-black text-gray-900 mb-2">No History Found</h4>
                <p className="text-gray-400 font-bold text-sm max-w-xs mx-auto">Start your first resume transformation to see your history here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          "p-8 bg-gray-50/50 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6",
          isTabMode && "max-w-6xl mx-auto w-full rounded-b-[48px] mb-20"
        )}>
          <button 
            onClick={onLogout}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Account
          </button>
          <div className="text-center sm:text-right">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
              Resume Morph v1.0.4
            </p>
            <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-1">
              Secure Cloud Infrastructure
            </p>
          </div>
        </div>
      </div>

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
              className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Delete Resume?</h3>
              <p className="text-sm text-gray-500 font-medium mb-8">
                This action is permanent and cannot be undone. Your saved resume will be cleared from our database.
              </p>
              <div className="flex gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-50"
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
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
            className="flex flex-col w-full max-w-3xl"
          >
            {content}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
