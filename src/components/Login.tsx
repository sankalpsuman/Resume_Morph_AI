import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, ShieldCheck, Zap, Target, Star, 
  MessageSquare, User, Info, Heart, Code, Layout, 
  Sparkles, Globe, Brain, Rocket, UserCircle, Sun, 
  Moon, CheckCircle2, ArrowRight, Cpu, Layers, Activity,
  ChevronRight, Command, Fingerprint, Shield, ZapOff,
  Github, Loader2, LogIn
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db, ensureConnection } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import ProjectDeepDive from './ProjectDeepDive';
import OwnerProfile from './OwnerProfile';

interface FeedbackItem {
  id: string;
  name: string;
  message: string;
  rating?: number;
  createdAt: any;
}

interface LoginProps {
  onTryGuest?: () => void;
  onLogin?: () => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
  isLoginProgress?: boolean;
}

export default function Login({ onTryGuest, onLogin, theme, toggleTheme, isLoginProgress }: LoginProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [showNewFeaturePopup, setShowNewFeaturePopup] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [showOwnerProfile, setShowOwnerProfile] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const loginCardRef = React.useRef<HTMLDivElement>(null);

  const typewriterWords = ["Resume Style", "Portfolio Site", "Visual DNA", "ATS Layout"];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % typewriterWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    ensureConnection();
    // Disabled auto-popup for cleaner Welcome experience
    /*
    const hasSeenPopup = localStorage.getItem('hasSeenNewFeaturePopup');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => setShowNewFeaturePopup(true), 2000);
      return () => clearTimeout(timer);
    }
    */
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    // Defer the feedback subscription slightly to prioritize the core auth & render path
    const timer = setTimeout(() => {
      const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(6));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FeedbackItem[];
        setFeedbacks(items);
      }, (error) => {
        // Silent handling for expected idle stream disconnects
        if (error.code === 'cancelled' || error.message?.includes('CANCELLED') || String(error.code) === '1') {
          return;
        }
        console.error("Error fetching feedbacks:", error);
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const scrollToLogin = () => {
    loginCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans selection:bg-indigo-500/30 transition-colors duration-500 relative overflow-x-hidden">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Navigation / Header - Hidden as we use global header from App.tsx */}
      {/* <nav className="fixed top-0 left-0 right-0 h-20 z-[80] flex items-center justify-between px-6 md:px-12 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
            <RefreshCw className="text-white w-5 h-5 animate-spin-slow" />
          </div>
          <span className="text-xl font-black tracking-tighter text-[var(--text-primary)]">Resume<span className="text-indigo-600">Morph</span></span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-indigo-500 border border-[var(--border-color)] transition-all active:scale-90"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button 
            onClick={scrollToLogin}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav> */}

      {/* Modals */}
      <ProjectDeepDive isOpen={showDeepDive} onClose={() => setShowDeepDive(false)} />
      <OwnerProfile isOpen={showOwnerProfile} onClose={() => setShowOwnerProfile(false)} />

      {/* New Feature Modal */}
      <AnimatePresence>
        {showNewFeaturePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
              onClick={() => { setShowNewFeaturePopup(false); localStorage.setItem('hasSeenNewFeaturePopup', 'true'); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative bg-[var(--bg-primary)] rounded-[40px] p-8 md:p-12 max-w-xl w-full shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl" />
              <div className="relative z-10 text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl rotate-6">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">System Upgrade</span>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--text-primary)] leading-none">
                    Portfolio <span className="text-indigo-600">Generator.</span>
                  </h2>
                </div>
                <p className="text-base text-[var(--text-secondary)] font-medium leading-relaxed">
                  Convert any resume into a high-converting digital storefront. No coding required, just pure visual dominance.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] text-left group hover:border-indigo-500/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Layout className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h4 className="font-black text-[var(--text-primary)] text-xs mb-0.5">Premium Templates</h4>
                    <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Minimal & Pro</p>
                  </div>
                  <div className="p-5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] text-left group hover:border-purple-500/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Code className="w-4 h-4 text-purple-500" />
                    </div>
                    <h4 className="font-black text-[var(--text-primary)] text-xs mb-0.5">Clean Exports</h4>
                    <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">JSON Schema</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowNewFeaturePopup(false); localStorage.setItem('hasSeenNewFeaturePopup', 'true'); }}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
                >
                  Enter Workspace
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6 md:px-12 z-10 flex flex-col items-center">
        <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Column 1 - Login Card (First on Mobile) */}
          <div className="relative order-first" ref={loginCardRef}>
            <div className="absolute inset-0 bg-indigo-600/10 blur-[100px] rounded-full scale-75 animate-pulse" />
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative glass-card-premium rounded-[48px] p-8 md:p-14 border border-white/10 shadow-2xl overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-700" />
              
              <div className="relative z-10 space-y-10">
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20 mb-6 group-hover:rotate-12 transition-transform">
                    <Fingerprint className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--text-primary)]">Welcome Back.</h3>
                  <p className="text-[var(--text-secondary)] font-medium">Access your intelligent career workspace</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setShowDeepDive(true)}
                      className="flex items-center justify-center gap-2 py-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl font-black text-[10px] uppercase tracking-widest border border-[var(--border-color)] transition-all"
                    >
                      <Command className="w-4 h-4 text-indigo-500" /> Intelligence
                    </button>
                    <button 
                      onClick={() => setShowOwnerProfile(true)}
                      className="flex items-center justify-center gap-2 py-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl font-black text-[10px] uppercase tracking-widest border border-[var(--border-color)] transition-all"
                    >
                      <UserCircle className="w-4 h-4 text-purple-500" /> Founder
                    </button>
                  </div>

                  <div className="relative flex items-center justify-center py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                    <span className="relative px-4 bg-[var(--bg-primary)] text-[8px] font-black uppercase tracking-[0.3em] text-[var(--text-tertiary)]">Elite Access</span>
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={onLogin}
                      disabled={isLoginProgress}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                    >
                      {isLoginProgress ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <LogIn className="w-5 h-5" />
                      )}
                      {isLoginProgress ? 'Connecting...' : 'Morph Sign in with Google'}
                    </button>

                    <button 
                      onClick={onTryGuest}
                      className="w-full py-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl font-black text-[10px] uppercase tracking-widest border border-[var(--border-color)] transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Zap className="w-4 h-4 text-indigo-500" /> Continue as Guest
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 text-center space-y-4">
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-amber-500 text-amber-400" />)}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                    99.8% Success Rate among Pro Users
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Column 2 - Hero Text */}
          <div className="space-y-8 text-center lg:text-left order-last lg:order-last">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-full">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Live: Version 2.5 Active</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl xl:text-8xl font-black tracking-tighter text-[var(--text-primary)] leading-[0.9]">
                Clone your <br />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={typewriterWords[wordIdx]}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="saas-gradient-text block"
                  >
                    {typewriterWords[wordIdx]}
                  </motion.span>
                </AnimatePresence>
                <span className="text-3xl md:text-5xl text-[var(--text-tertiary)] font-bold">in milliseconds.</span>
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                The world's first AI-architected career engine. Bridge the gap between your experience and the elite visual standards of top-tier companies.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button 
                onClick={scrollToLogin}
                className="px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--bg-primary)] bg-[var(--bg-secondary)] overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-[var(--bg-primary)] bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                  +10k
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 max-w-lg mx-auto lg:mx-0">
              {[
                { icon: Zap, text: "Style Morph", desc: "Visual DNA Cloning", color: "text-amber-500" },
                { icon: Shield, text: "ATS Secure", desc: "99.9% Parser Safety", color: "text-emerald-500" }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-[var(--bg-secondary)]/50 backdrop-blur-sm rounded-2xl border border-[var(--border-color)]">
                  <f.icon className={cn("w-5 h-5", f.color)} />
                  <div className="text-left">
                    <span className="block text-xs font-black text-[var(--text-primary)] uppercase">{f.text}</span>
                    <span className="block text-[10px] font-medium text-[var(--text-tertiary)]">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Features Grid */}
        <section className="mt-32 w-full max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Morph Engine", desc: "Clones any visual structure using AI neural mapping.", icon: Layers, color: "text-blue-500" },
              { title: "ATS Validator", desc: "Real-time diagnostic score for parser compatibility.", icon: ShieldCheck, color: "text-emerald-500" },
              { title: "Smart Content", desc: "AI-driven text optimization for high-impact roles.", icon: Cpu, color: "text-purple-500" }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 bg-[var(--bg-secondary)]/40 rounded-[32px] border border-white/5 hover:bg-indigo-600/5 hover:border-indigo-500/20 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className={cn("w-6 h-6", feature.color)} />
                </div>
                <h3 className="text-xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tight">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Feedback Section */}
        <section className="mt-32 w-full max-w-7xl">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Wall of Love</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--text-primary)]">User Feedbacks.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedbacks.length > 0 ? feedbacks.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="p-8 bg-[var(--bg-secondary)]/60 rounded-[32px] border border-white/5 space-y-6 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs">
                      {f.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-[var(--text-primary)]">{f.name}</h4>
                      <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">Verified User</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] font-medium italic leading-relaxed">"{f.message}"</p>
              </motion.div>
            )) : (
              <div className="col-span-full text-center py-20 text-[var(--text-tertiary)] font-bold uppercase tracking-widest animate-pulse">
                Synchronizing feedback stream...
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-20 border-t border-white/5 text-center">
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <RefreshCw className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-black tracking-tighter text-[var(--text-primary)]">ResumeMorph</span>
          </div>
          <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.4em]">
            &copy; 2026 Architected by Sankalp Suman. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
