import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, LogIn, Sparkles, Rocket, Zap, 
  ArrowRight, ShieldCheck, Star, 
  ChevronRight, Command, Layout, Fingerprint
} from 'lucide-react';

interface GreetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function GreetingModal({ isOpen, onClose, userName }: GreetingModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-xl bg-[var(--bg-primary)] rounded-[40px] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
          >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full -ml-24 -mb-24 blur-2xl pointer-events-none" />
            
            <div className="relative z-10 p-10 md:p-14 text-center space-y-10">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20 rotate-3 group-hover:rotate-12 transition-transform">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">
                    {userName ? "Workspace Authenticated" : "Intelligence Activated"}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] leading-none">
                    {userName ? (
                      <>Welcome Back, <br /><span className="text-indigo-600">{userName.split(' ')[0]}.</span></>
                    ) : (
                      <>ResumeMorph <br /><span className="text-indigo-600">Intelligence.</span></>
                    )}
                  </h2>
                </div>
                
                <p className="text-base text-[var(--text-secondary)] font-medium leading-relaxed max-w-sm mx-auto">
                  {userName 
                    ? "Your intelligent career engine is synchronized and ready for the next evolution."
                    : "Experience the world's most advanced AI-powered resume cloning and career architect engine."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] text-left group hover:border-indigo-500/40 transition-all cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Fingerprint className="w-4 h-4 text-indigo-500" />
                  </div>
                  <h4 className="font-black text-[var(--text-primary)] text-xs mb-0.5">DNA Cloning</h4>
                  <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Visual Parity</p>
                </div>
                <div className="p-5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] text-left group hover:border-purple-500/40 transition-all cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  </div>
                  <h4 className="font-black text-[var(--text-primary)] text-xs mb-0.5">AI Morphing</h4>
                  <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Neural Precision</p>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={onClose}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 group"
                >
                  {userName ? "Resume My Progress" : "Initialize Workspace"} 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="pt-6 border-t border-[var(--border-color)] flex items-center justify-center gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter">99.8%</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Uptime</span>
                </div>
                <div className="w-px h-8 bg-[var(--border-color)]" />
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter">v2.5</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">AI Core</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
