import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, RefreshCw, ShieldCheck, Zap, Target, Star, MessageSquare, User, Info, Heart, Code, Layout, Sparkles, Globe, Brain, Rocket, UserCircle, Sun, Moon } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { cn } from '../lib/utils';
import { auth, db, ensureConnection } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore';
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
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
}

export default function Login({ onTryGuest, theme, toggleTheme }: LoginProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [showNewFeaturePopup, setShowNewFeaturePopup] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [showOwnerProfile, setShowOwnerProfile] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState<string | null>(null);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('hasSeenNewFeaturePopup');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => setShowNewFeaturePopup(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closePopup = () => {
    setShowNewFeaturePopup(false);
    localStorage.setItem('hasSeenNewFeaturePopup', 'true');
  };

  useEffect(() => {
    const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(6));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FeedbackItem[];
      setFeedbacks(items);
    }, (error) => {
      console.error("Error fetching feedbacks:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn('google');
    try {
      // Use locally imported classes to ensure type consistency and avoid argument-error
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ 
        prompt: 'select_account',
        // Optional: Hint at host if it helps with iframe contexts
        // auth_type: 'popup'
      });
      
      console.log('DEBUG: Auth Instance:', auth);
      console.log('DEBUG: Provider Instance:', provider);
      
      if (!auth || typeof auth.signOut !== 'function') {
        throw new Error('INTERNAL_AUTH_INVALID');
      }

      // Ensure firestore is reachable before attempting login
      await ensureConnection();
      
      console.log('Attempting login with Google popup...');
      const result = await signInWithPopup(auth, provider);
      console.log('Login successful for user:', result.user.email);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.warn('Login popup closed or cancelled by user');
      } else {
        console.error('Login Error Object:', error);
        if (error.code === 'auth/argument-error') {
          console.error('CRITICAL: Argument Error detected. This usually means the Auth instance or Provider is invalid for the current library version.');
        }
        if (error.message?.includes('Pending promise')) {
          console.error('ASSERTION FAILURE: A previous login attempt is still pending or the Auth state is inconsistent.');
        }
      }
    } finally {
      setIsLoggingIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans selection:bg-indigo-100 transition-colors duration-300 relative">
      {/* Theme Toggle Button */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={toggleTheme}
        className="fixed top-4 right-4 md:top-6 md:right-6 z-[80] p-2.5 rounded-xl bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] hover:text-indigo-600 transition-all active:scale-95 border border-[var(--border-color)] shadow-sm"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
      </motion.button>

      {/* Project Intelligence Report Modal */}
      <ProjectDeepDive isOpen={showDeepDive} onClose={() => setShowDeepDive(false)} />

      {/* Owner Profile Modal */}
      <OwnerProfile isOpen={showOwnerProfile} onClose={() => setShowOwnerProfile(false)} />

      {/* New Feature Popup */}
      <AnimatePresence>
        {showNewFeaturePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[var(--bg-primary)] rounded-[48px] p-10 md:p-16 max-w-2xl w-full shadow-2xl shadow-indigo-100 dark:shadow-none border border-[var(--border-color)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
              
              <div className="relative z-10 text-center space-y-8">
                <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center mx-auto shadow-xl shadow-indigo-200 dark:shadow-none rotate-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                    <Zap className="w-3 h-3" />
                    Major Update Available
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] leading-[0.9]">
                    Portfolio <br />
                    <span className="text-indigo-600">Generator.</span>
                  </h2>
                  <p className="text-lg text-[var(--text-secondary)] font-medium leading-relaxed">
                    We've just launched our most requested feature. Convert any resume into a premium SaaS-style portfolio website in seconds.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)] text-left">
                    <Layout className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-3" />
                    <h4 className="font-black text-[var(--text-primary)] text-sm mb-1">3 Templates</h4>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Minimal, Dev, Pro</p>
                  </div>
                  <div className="p-6 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)] text-left">
                    <Code className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-3" />
                    <h4 className="font-black text-[var(--text-primary)] text-sm mb-1">Source Code</h4>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Full JSON Export</p>
                  </div>
                </div>

                <button 
                  onClick={closePopup}
                  className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-2xl shadow-indigo-100 dark:shadow-none"
                >
                  Explore Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="flex items-center justify-center p-4 md:p-12 lg:p-24 overflow-x-hidden">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left Side: Branding & Features */}
          <div className="space-y-6 md:space-y-10">
            <div className="flex items-center gap-3 md:gap-4 justify-center lg:justify-start">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-100 dark:shadow-none rotate-3 shrink-0">
                <RefreshCw className="text-white w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-[var(--text-primary)] leading-none">Resume Morph</h1>
            </div>

            <div className="space-y-4 md:space-y-6 text-center lg:text-left">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl xs:text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] text-[var(--text-primary)]"
              >
                Clone any <span className="text-indigo-600 block sm:inline">Resume Style</span> in seconds.
              </motion.h2>
              <p className="text-base md:text-xl text-[var(--text-secondary)] font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                The world's first AI-powered resume morphing engine. Upload a style, drop your content, and get a professional result instantly.
              </p>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 gap-3 md:gap-4 px-2 sm:px-0">
              {[
                { id: 'morphing', icon: Zap, text: "Morph", color: "text-amber-500", bg: "bg-amber-50", darkBg: "dark:bg-amber-900/20" },
                { id: 'smart-editor', icon: Sparkles, text: "Smart", color: "text-purple-500", bg: "bg-purple-50", darkBg: "dark:bg-purple-900/20" },
                { id: 'portfolio', icon: Globe, text: "Portfolio", color: "text-blue-500", bg: "bg-blue-50", darkBg: "dark:bg-blue-900/20" },
                { id: 'ats', icon: ShieldCheck, text: "ATS", color: "text-green-500", bg: "bg-green-50", darkBg: "dark:bg-green-900/20" }
              ].map((feature, i) => (
                <motion.div 
                  key={feature.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center gap-2 md:gap-4 p-3 md:p-5 bg-[var(--bg-primary)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all sm:justify-start justify-center"
                >
                  <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0", feature.bg, feature.darkBg)}>
                    <feature.icon className={cn("w-4 h-4 md:w-5 md:h-5", feature.color)} />
                  </div>
                  <span className="text-[10px] md:text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Side: Login Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-primary)] rounded-[40px] md:rounded-[48px] p-8 md:p-16 shadow-2xl shadow-indigo-100 dark:shadow-none border border-[var(--border-color)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-24 -mt-24 md:-mr-32 md:-mt-32 blur-3xl opacity-50" />
            
            <div className="relative z-10 space-y-8 md:space-y-10 text-center">
              <div className="space-y-2 md:space-y-3">
                <h3 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)]">Get Started</h3>
                <p className="text-[var(--text-secondary)] font-medium text-base md:text-lg">Sign in to start morphing your resume</p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleLogin()}
                  disabled={!!isLoggingIn}
                  className="w-full flex items-center justify-center gap-3 md:gap-4 px-6 md:px-8 py-5 md:py-6 bg-gray-900 dark:bg-indigo-600 text-white rounded-2xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-black dark:hover:bg-indigo-700 transition-all active:scale-95 shadow-2xl shadow-gray-200 dark:shadow-none group disabled:opacity-50 disabled:cursor-not-allowed border border-transparent dark:border-indigo-500/30"
                >
                  {isLoggingIn === 'google' ? (
                    <RefreshCw className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                  ) : (
                    <LogIn className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                  )}
                  {isLoggingIn === 'google' ? 'Connecting...' : 'Continue with Google'}
                </button>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <button 
                    onClick={() => setShowDeepDive(true)}
                    className="w-full flex flex-col items-center justify-center gap-2 px-2 py-6 md:px-4 md:py-8 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl md:rounded-3xl font-black text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all border-2 border-indigo-200 dark:border-indigo-800 shadow-lg shadow-indigo-100 dark:shadow-none group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-indigo-600/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <Rocket className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform relative z-10" />
                    <span className="relative z-10">Deep Dive</span>
                  </button>

                  <button 
                    onClick={() => setShowOwnerProfile(true)}
                    className="w-full flex flex-col items-center justify-center gap-2 px-2 py-6 md:px-4 md:py-8 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl md:rounded-3xl font-black text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all border-2 border-amber-100 dark:border-amber-800 shadow-lg shadow-amber-100 dark:shadow-none group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-amber-600/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <UserCircle className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform relative z-10" />
                    <span className="relative z-10">Founder</span>
                  </button>
                </div>

                <button 
                  onClick={() => onTryGuest?.()}
                  disabled={!!isLoggingIn}
                  className="w-full flex items-center justify-center gap-3 md:gap-4 px-6 md:px-8 py-5 md:py-6 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-2xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 border-2 border-slate-200 dark:border-slate-700 group shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                  Try Morph as Guest
                </button>
              </div>

              <div className="pt-8 md:pt-10 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-[8px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] text-[var(--text-tertiary)] font-black px-4">
                  Trusted by 10,000+ Job Seekers Worldwide
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Feedback Section */}
      <section className="py-16 md:py-24 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
              <MessageSquare className="w-3 h-3" />
              What Users Say
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] leading-none">Real Feedback. <span className="text-indigo-600">Real Results.</span></h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {feedbacks.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 md:p-8 bg-[var(--bg-secondary)] rounded-[28px] md:rounded-[32px] border border-[var(--border-color)] space-y-4 md:space-y-6 hover:bg-[var(--bg-primary)] hover:shadow-xl hover:shadow-indigo-50 dark:hover:shadow-none transition-all duration-500 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg md:rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs md:text-sm">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--text-primary)] text-xs md:text-sm">{item.name}</h4>
                      <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Verified User</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <Star key={`${item.id}-star-${i}`} className="w-2.5 h-2.5 md:w-3 md:h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm md:text-[var(--text-secondary)] font-medium leading-relaxed italic line-clamp-4 group-hover:line-clamp-none transition-all">
                  "{item.message}"
                </p>
              </motion.div>
            ))}
          </div>
          
          {feedbacks.length === 0 && (
            <div className="text-center py-12 text-[var(--text-tertiary)] font-medium">
              Loading community feedback...
            </div>
          )}
        </div>
      </section>

      {/* Owner & Story Section */}
      <section className="py-16 md:py-24 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="space-y-6 md:space-y-8 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] rounded-full text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest shadow-sm mx-auto md:mx-0 border border-[var(--border-color)]">
                <Info className="w-3 h-3" />
                The Story
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)] leading-tight">
                Built to solve the <span className="text-indigo-600">Resume Struggle.</span>
              </h2>
              <div className="space-y-4 text-[var(--text-secondary)] text-sm md:text-base font-medium leading-relaxed">
                <p>
                  Resume Morph was born out of a simple frustration: why is it so hard to make a resume look professional without spending hours on formatting?
                </p>
                <p>
                  We realized that job seekers often have the right content but struggle with the "visual language" of their industry. Our Morph Engine solves this by separating style from content.
                </p>
              </div>
            </div>

            <div className="bg-[var(--bg-primary)] p-8 md:p-12 rounded-[40px] md:rounded-[48px] shadow-xl shadow-gray-200 dark:shadow-none border border-[var(--border-color)] space-y-6 md:space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
              
              <div className="flex items-center gap-4 md:gap-6 relative z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none shrink-0">
                  <User className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)]">Sankalp</h3>
                  <p className="text-[10px] md:text-sm text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">Founder & Creator</p>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6 relative z-10">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-[var(--bg-secondary)] rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                  </div>
                  <p className="text-xs md:text-sm text-[var(--text-tertiary)] font-medium italic leading-relaxed">
                    "My goal is to level the playing field for every job seeker. Your resume should be a reflection of your potential, not your design skills."
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] rounded-lg text-[8px] md:text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest border border-[var(--border-color)]">
                    <Code className="w-3 h-3" />
                    Built with AI
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] rounded-lg text-[8px] md:text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest border border-[var(--border-color)]">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Morph Engine v2.0
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-[var(--border-color)] text-center transition-colors duration-300">
        <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.3em]">
          &copy; 2026 Resume Morph. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
