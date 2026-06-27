import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, LogIn, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => Promise<void>;
  isProgress: boolean;
}

export default function LoginModal({ isOpen, onClose, onLogin, isProgress }: LoginModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-md bg-[var(--bg-primary)] rounded-[40px] p-10 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
          >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 text-center space-y-8">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20 rotate-3 transition-transform">
                  <RefreshCw className="text-white w-8 h-8 animate-spin-slow" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Security Gate</span>
                  <h3 className="text-3xl font-black tracking-tighter text-[var(--text-primary)] leading-none">Resume<span className="text-indigo-600">Morph</span></h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-xs mx-auto">
                  Access your intelligent career workspace. Synchronize your visual DNA across all devices.
                </p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={async () => {
                    await onLogin();
                    // We don't close here, App.tsx will close on user state change
                  }}
                  disabled={isProgress}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                >
                  {isProgress ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                  {isProgress ? 'Connecting...' : 'Morph Sign in with Google'}
                </button>
                
                <div className="flex items-center justify-center gap-6 pt-2">
                  <div className="flex items-center gap-1.5 opacity-60">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">ATS Secure</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-60">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">AI Powered</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
