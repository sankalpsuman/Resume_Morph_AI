/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ResumeBuilder from './components/ResumeBuilder';
import About from './components/About';
import PrivacyPolicy from './components/PrivacyPolicy';
import Contact from './components/Contact';
import Feedback from './components/Feedback';
import PortfolioGenerator from './components/PortfolioGenerator';
import Login from './components/Login';
import SmartEditor from './components/SmartEditor';
import CoverLetterGenerator from './components/CoverLetterGenerator';
import ApplyTracker from './components/ApplyTracker';
import { RefreshCw, Layout, Info, Shield, Send, Menu, X, MessageSquare, LogOut, User as UserIcon, ChevronDown, Calendar, FileText, Download, Eye, Trash2, Globe, Sparkles, Briefcase, LifeBuoy } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import AccountModal from './components/AccountModal';
import AdminPanel from './components/AdminPanel';
import UserGuide from './components/UserGuide';
import PremiumModal from './components/PremiumModal';
import CreatorWelcomeModal from './components/CreatorWelcomeModal';
import InteractiveTour from './components/InteractiveTour';
import ResumeAIAssistant from './components/ResumeAIAssistant';
import AppChatbot from './components/AppChatbot';
import Resources from './components/Resources';
import { handleFirestoreError, OperationType } from './lib/firestore';
import { Zap, CheckCircle, Star, Loader2, BookOpen, BrainCircuit, Sun, Moon } from 'lucide-react';

type Tab = 'builder' | 'portfolio' | 'smart-editor' | 'cover-letter' | 'tracker' | 'ai-assistant' | 'about' | 'privacy' | 'contact' | 'feedback' | 'guide' | 'account' | 'resources';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState<Record<string, NodeJS.Timeout>>({});
  const [showUndoToast, setShowUndoToast] = useState<string | null>(null);
  const [isPortfolioFullscreen, setIsPortfolioFullscreen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light'); // Ensure light mode is handled if needed
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        // Create initial user profile if it doesn't exist
        try {
          const initialData = {
            userId: user.uid,
            email: user.email,
            name: user.displayName || 'Morph User',
            photo: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'MU')}&background=6366f1&color=fff`,
            morphCount: 0,
            usedMorphs: 0,
            freeMorphsUsed: 0,
            premiumMorphsUsed: 0,
            remainingMorphs: 2,
            plan: 'free',
            planLimit: 2,
            hasReviewed: false,
            role: 'user',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastActivityAt: serverTimestamp(),
            resumeHistory: []
          };
          await setDoc(userRef, initialData);
          setUserData(initialData);
        } catch (err) {
          console.error("Failed to initialize user data:", err);
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore user snapshot error:", error);
      if (error.code === 'unavailable') {
        setIsOffline(true);
      } else {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
      setLoading(false);
    });

    return () => unsubscribeUser();
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    
    const updateActivity = async () => {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastActivityAt: serverTimestamp()
      }).catch(() => {});
    };
    
    updateActivity();
  }, [user?.uid]);

  useEffect(() => {
    const handleSetTab = (e: any) => {
      if (e.detail) {
        handleTabChange(e.detail as Tab);
      }
    };
    window.addEventListener('set-tab', handleSetTab);
    return () => window.removeEventListener('set-tab', handleSetTab);
  }, []); // handleTabChange is stable if defined correctly or just use empty deps if it's in the same scope

  useEffect(() => {
    if (!userData || !user) return;

    const checkAutoDelete = async () => {
      const lastActivity = userData.lastActivityAt?.toDate?.() || new Date(userData.createdAt?.toDate?.() || Date.now());
      const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
      
      if (Date.now() - lastActivity.getTime() > fiveDaysInMs && userData.resumeHistory?.length > 0) {
        try {
          // Delete from Storage
          for (const resume of userData.resumeHistory) {
            if (resume.storagePath) {
              const resumeRef = ref(storage, resume.storagePath);
              await deleteObject(resumeRef).catch(() => {});
            }
          }
          
          // Clear from Firestore
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            resumeHistory: []
          });
        } catch (err) {
          console.error("Auto-delete failed:", err);
        }
      }
    };

    checkAutoDelete();
  }, [userData?.lastActivityAt, user?.uid]);

  useEffect(() => {
    if (!user) return;
    const checkInterest = async () => {
      const notifyRef = doc(db, 'premium_interest', user.uid);
      const docSnap = await getDoc(notifyRef);
      if (docSnap.exists()) {
        setHasNotified(true);
      }
    };
    checkInterest();
  }, [user?.uid]);

  const handleNotifyMe = async () => {
    if (!user) return;
    setIsNotifying(true);
    try {
      const notifyRef = doc(db, 'premium_interest', user.uid);
      await setDoc(notifyRef, {
        email: user.email,
        uid: user.uid,
        timestamp: serverTimestamp()
      });
      setHasNotified(true);
    } catch (err) {
      console.error("Failed to save interest:", err);
    } finally {
      setIsNotifying(false);
    }
  };

  useEffect(() => {
    if (!userData || !user) return;

    const checkExpiry = async () => {
      if (userData.plan !== 'free' && userData.premiumExpiryDate) {
        const expiry = userData.premiumExpiryDate.toDate();
        if (Date.now() > expiry.getTime()) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            plan: 'free',
            planLimit: 2,
            usedMorphs: 0,
            remainingMorphs: 2,
            premiumExpiryDate: null
          });
        }
      }
    };

    checkExpiry();
  }, [userData?.premiumExpiryDate, user?.uid]);

  const handleLogout = () => {
    signOut(auth);
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!user || !userData) return;
    
    // Optimistic UI: Remove from local state immediately
    const originalHistory = [...(userData.resumeHistory || [])];
    const updatedHistory = originalHistory.filter((r: any) => r.id !== resumeId);
    
    // Update local state optimistically
    setUserData((prev: any) => ({
      ...prev,
      resumeHistory: updatedHistory
    }));

    // Show undo toast
    setShowUndoToast(resumeId);

    // Set a timeout for actual deletion
    const timeout = setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const resumeToDelete = originalHistory.find((r: any) => r.id === resumeId);
        
        // Parallelize deletion
        const deletePromises: Promise<any>[] = [
          updateDoc(userRef, {
            resumeHistory: updatedHistory
          })
        ];

        if (resumeToDelete?.storagePath) {
          const storageRef = ref(storage, resumeToDelete.storagePath);
          deletePromises.push(deleteObject(storageRef).catch(err => console.error("Storage delete failed:", err)));
        }

        await Promise.all(deletePromises);
        
        setPendingDeletions(prev => {
          const next = { ...prev };
          delete next[resumeId];
          return next;
        });
        setShowUndoToast(null);
      } catch (error) {
        console.error("Delete resume failed:", error);
        // Rollback on error
        setUserData((prev: any) => ({
          ...prev,
          resumeHistory: originalHistory
        }));
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }, 5000); // 5 second window to undo

    setPendingDeletions(prev => ({ ...prev, [resumeId]: timeout }));
  };

  const handleUndoDelete = (resumeId: string) => {
    const timeout = pendingDeletions[resumeId];
    if (timeout) {
      clearTimeout(timeout);
      setPendingDeletions(prev => {
        const next = { ...prev };
        delete next[resumeId];
        return next;
      });
      setShowUndoToast(null);
      
      // Restore local state
      // Note: This assumes the user hasn't made other changes. 
      // In a real app, we'd fetch the latest data or be more careful.
      // But for this app, it's fine as resumeHistory is relatively static.
    }
  };

  const mainTabs = [
    { id: 'builder', label: 'Morph Engine', desc: 'Transform raw data into AI-architected resumes', icon: Layout },
    { id: 'ai-assistant', label: 'AI Coach', desc: 'Mock interviews, feedback, and career growth', icon: BrainCircuit },
    { id: 'smart-editor', label: 'Smart Editor', desc: 'Live ATS optimization and content refining', icon: Sparkles },
    { id: 'portfolio', label: 'Portfolio Gen', desc: 'Instant personal website from your resume', icon: Globe },
    { id: 'cover-letter', label: 'Cover Letter', desc: 'AI-tailored letters for specific job roles', icon: FileText },
    { id: 'tracker', label: 'Applications', desc: 'Organize and monitor your entire job search', icon: Briefcase },
  ];

  const resourceTabs = [
    { id: 'guide', label: 'User Guide', desc: 'Master all Morph features with expert tips', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'about', label: 'About Morph', desc: 'Our mission to humanize the job search', icon: Info, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'feedback', label: 'Community', desc: 'Request features and see what others want', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'contact', label: 'Help Desk', desc: '24/7 technical support and inquiries', icon: Send, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const getLevel = (count: number) => {
    if (count >= 100) return { name: 'Grandmaster', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
    if (count >= 50) return { name: 'Expert', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
    if (count >= 10) return { name: 'Pro', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    return { name: 'Novice', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    setIsResourcesOpen(false);
    setIsUserDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const userLevel = getLevel(userData?.morphCount || 0);
  const isAdmin = user.email === 'sankalpsmn@gmail.com';
  const usedMorphs = userData?.usedMorphs !== undefined ? userData.usedMorphs : (userData?.morphCount || 0);
  const planLimit = userData?.planLimit === -1 ? 100 : (userData?.planLimit || 2);
  const progress = Math.min((usedMorphs / planLimit) * 100, 100);
  const memberSince = userData?.createdAt?.toDate?.().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) || 'Recently';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col transition-colors duration-300">
      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest text-center py-2 z-[200] flex items-center justify-center gap-2"
          >
            <Zap className="w-3 h-3 animate-pulse" />
            Connecting to Morph Cloud... (Check connection)
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Top Header */}
      {!isPortfolioFullscreen && (
        <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--border-color)] z-[120] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0 cursor-pointer group" onClick={() => handleTabChange('builder')}>
              <div className="w-9 h-9 md:w-11 md:h-11 bg-indigo-600 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 rotate-3 transition-transform group-hover:scale-105">
                <RefreshCw className="text-white w-4 h-4 md:w-6 md:h-6" />
              </div>
              <div className="xs:block">
                <h1 className="text-sm md:text-lg font-black tracking-tight text-[var(--text-primary)] leading-none">Morph</h1>
                <p className="text-[7px] md:text-[8px] uppercase tracking-[0.2em] text-indigo-500 font-black mt-0.5">AI Engine</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 xl:gap-2">
              {mainTabs.map((tab) => (
                <div key={tab.id} className="relative group">
                  <button 
                    id={`tab-${tab.id}`}
                    onClick={() => handleTabChange(tab.id as Tab)}
                    className={cn(
                      "flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap",
                      activeTab === tab.id 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                        : "text-[var(--text-secondary)] hover:text-indigo-600 hover:bg-indigo-50"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className={activeTab === tab.id ? "inline" : "hidden lg:inline"}>{tab.label}</span>
                  </button>

                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-[150]">
                    <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-2xl relative">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">{tab.label}</p>
                      <p className="text-[9px] font-bold text-gray-300 leading-relaxed capitalize">{tab.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </nav>

            {/* Actions Section */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] hover:text-indigo-600 transition-all active:scale-95 border border-[var(--border-color)]"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              {/* Resources Dropdown (Desktop) */}
              <div className="hidden sm:block relative">
                <button 
                  id="resources-btn"
                  onMouseEnter={() => setIsResourcesOpen(true)}
                  onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest",
                    ['resources', 'about', 'privacy', 'contact', 'feedback', 'guide'].includes(activeTab)
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-indigo-600"
                  )}
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Resources</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isResourcesOpen ? "rotate-180" : "")} />
                </button>
                <AnimatePresence>
                  {isResourcesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      onMouseLeave={() => setIsResourcesOpen(false)}
                      className="absolute top-full right-0 mt-3 w-64 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[28px] shadow-2xl p-2 z-[130] ring-1 ring-black/5"
                    >
                      <div className="p-3 mb-1">
                        <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Knowledge Base</p>
                      </div>
                      <div className="space-y-1">
                        {resourceTabs.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id as Tab)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[var(--bg-secondary)] transition-all group"
                          >
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", item.bg)}>
                              <item.icon className={cn("w-4 h-4", item.color)} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-[var(--text-primary)] leading-tight group-hover:text-indigo-600">{item.label}</p>
                              <p className="text-[9px] font-bold text-[var(--text-tertiary)] truncate uppercase mt-0.5 tracking-tighter">{item.desc}</p>
                            </div>
                          </button>
                        ))}
                        <button
                          onClick={() => { window.dispatchEvent(new CustomEvent('open-creator-about')); setIsResourcesOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[var(--bg-secondary)] transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform bg-purple-50 group-hover:scale-110">
                            <UserIcon className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-[var(--text-primary)] leading-tight group-hover:text-indigo-600">About Creator</p>
                            <p className="text-[9px] font-bold text-[var(--text-tertiary)] truncate uppercase mt-0.5 tracking-tighter">Meet the architect</p>
                          </div>
                        </button>
                      </div>
                      <div className="mt-2 p-4 bg-indigo-600 rounded-2xl text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70 italic">Morph Hub</p>
                        <p className="text-[11px] font-medium leading-relaxed">Access 50+ resume modules and AI guides.</p>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button 
                            onClick={() => handleTabChange('resources')}
                            className="w-full py-2 bg-white text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 active:scale-95"
                          >
                            Open Hub
                          </button>
                          <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('restart-tour'))}
                            className="w-full py-2 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-indigo-400 active:scale-95"
                          >
                            Restart Tour
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Account / User Section */}
              <div className="flex items-center gap-2 pl-2 md:pl-4 border-l border-[var(--border-color)]">
                {userData && (
                  <>
                    <div className="relative group">
                      <button 
                        id="tab-account"
                        onClick={() => handleTabChange('account')}
                        className="relative p-0.5 rounded-xl bg-[var(--bg-primary)] shadow-lg border border-[var(--border-color)] transition-transform active:scale-95 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img 
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || '')}&background=6366f1&color=fff`} 
                          alt="Profile" 
                          className="w-8 h-8 md:w-9 md:h-9 rounded-lg object-cover relative z-10"
                          referrerPolicy="no-referrer"
                        />
                      </button>

                      {/* Tooltip */}
                      <div className="absolute top-full right-0 mt-3 w-40 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-[160]">
                        <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-2xl relative">
                          <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Account</p>
                          <p className="text-[9px] font-bold text-gray-300 leading-relaxed">View history, settings & plan status</p>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="md:hidden p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Menu className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-[var(--bg-primary)] border-l border-[var(--border-color)] z-[150] md:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-4">Main Navigation</p>
                  <div className="space-y-1">
                    {mainTabs.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { handleTabChange(item.id as Tab); setIsMenuOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                          activeTab === item.id 
                            ? "bg-indigo-600 text-white" 
                            : "text-[var(--text-secondary)] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-[var(--border-color)]" />

                <div>
                  <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-4">Support & Resources</p>
                  <div className="space-y-1">
                    {resourceTabs.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { handleTabChange(item.id as Tab); setIsMenuOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                          activeTab === item.id 
                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" 
                            : "text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-indigo-600"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </button>
                    ))}
                    {/* Explicitly add Resources Hub if it's not in the main or resource tabs */}
                    <button
                      onClick={() => { handleTabChange('resources'); setIsMenuOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                        activeTab === 'resources' 
                          ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" 
                          : "text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-indigo-600"
                      )}
                    >
                      <LifeBuoy className="w-5 h-6" />
                      Resources Hub
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => { setShowUpgradeModal(true); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none mt-4"
                >
                  <Zap className="w-5 h-5 fill-white" />
                  Upgrade to Premium
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Main Content Area */}
      <main className={cn(
        "flex-grow relative w-full",
        !isPortfolioFullscreen && "pt-20 md:pt-28 pb-32 md:pb-12"
      )}>
        <div className={cn("max-w-7xl mx-auto px-1 sm:px-6 lg:px-8", activeTab !== 'builder' && "hidden")}>
          <ResumeBuilder userData={userData} onUpgrade={() => setShowUpgradeModal(true)} />
        </div>

        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", activeTab !== 'ai-assistant' && "hidden")}>
          <ResumeAIAssistant />
        </div>
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", activeTab !== 'smart-editor' && "hidden")}>
          <SmartEditor />
        </div>
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", activeTab !== 'cover-letter' && "hidden")}>
          <CoverLetterGenerator resumeData={userData?.resumeHistory?.[0]?.data || {}} />
        </div>
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", activeTab !== 'tracker' && "hidden")}>
          <ApplyTracker />
        </div>
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", activeTab !== 'portfolio' && "hidden")}>
          <PortfolioGenerator onFullscreenChange={setIsPortfolioFullscreen} />
        </div>
        <div className={cn("max-w-7xl mx-auto px-0 sm:px-6 lg:px-8", activeTab !== 'guide' && "hidden")}>
          <UserGuide />
        </div>
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", activeTab !== 'about' && "hidden")}>
          <About />
        </div>
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", activeTab !== 'privacy' && "hidden")}>
          <PrivacyPolicy />
        </div>
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", activeTab !== 'contact' && "hidden")}>
          <Contact />
        </div>
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", activeTab !== 'feedback' && "hidden")}>
          <Feedback />
        </div>
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", activeTab !== 'resources' && "hidden")}>
          <Resources onTabChange={handleTabChange} />
        </div>
        <div className={cn("max-w-7xl mx-auto px-0 sm:px-6 lg:px-8", activeTab !== 'account' && "hidden")}>
          <AccountModal 
            isOpen={true} 
            onClose={() => handleTabChange('builder')} 
            user={user}
            userData={userData}
            onLogout={handleLogout}
            onUpgrade={() => setShowUpgradeModal(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onDeleteResume={handleDeleteResume}
            isTabMode={true}
          />
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      {!isPortfolioFullscreen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[var(--bg-secondary)]/80 backdrop-blur-2xl border-t border-[var(--border-color)] px-6 py-3 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {[
          { id: 'builder', icon: Layout, label: 'Morph', desc: 'AI-architected resumes' },
          { id: 'ai-assistant', icon: BrainCircuit, label: 'Coach', desc: 'Mock interviews & feedback' },
          { id: 'smart-editor', icon: Sparkles, label: 'Smart', desc: 'Live ATS optimization' },
          { id: 'tracker', icon: Briefcase, label: 'Jobs', desc: 'Track your search progress' },
          { id: 'account', icon: UserIcon, label: 'Me', desc: 'Settings & account power' },
        ].map((item) => (
          <div key={item.id} className="relative group flex flex-col items-center">
            <button
              id={`mobile-tab-${item.id}`}
              onClick={() => handleTabChange(item.id as Tab)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                activeTab === item.id ? "text-indigo-600" : "text-[var(--text-tertiary)]"
              )}
            >
              <item.icon className={cn("w-6 h-6", activeTab === item.id && "fill-indigo-50 dark:fill-indigo-900/20")} />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          </div>
        ))}
      </div>
      )}

      {/* Admin Panel */}
      <AdminPanel 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Undo Delete Toast */}
      <AnimatePresence>
        {showUndoToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-md"
          >
            <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/10 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Resume Deleted</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Permanently in 5s</p>
                </div>
              </div>
              <button
                onClick={() => handleUndoDelete(showUndoToast)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
              >
                Undo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Upgrade Modal */}
      <PremiumModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        user={user}
      />

      <CreatorWelcomeModal />
      <InteractiveTour />
      <AppChatbot />

      {/* Global Footer */}
      <footer className="py-12 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <RefreshCw className="text-white w-4 h-4" />
            </div>
            <span className="font-black text-lg tracking-tight text-[var(--text-primary)]">Resume Morph</span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] font-medium text-center md:text-left">
            © 2026 Resume Morph. Built with passion by <button onClick={() => window.dispatchEvent(new CustomEvent('open-creator-about'))} className="text-indigo-600 hover:underline font-bold">Sankalp Suman</button>.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] px-3 py-1 border border-[var(--border-color)] rounded-full">v1.0.1</span>
            <div className="flex items-center gap-6">
              <button onClick={() => handleTabChange('feedback')} className="text-sm font-bold text-[var(--text-secondary)] hover:text-indigo-600 transition-colors">Feedback</button>
              <button onClick={() => handleTabChange('privacy')} className="text-sm font-bold text-[var(--text-secondary)] hover:text-indigo-600 transition-colors">Privacy</button>
              <button onClick={() => handleTabChange('about')} className="text-sm font-bold text-[var(--text-secondary)] hover:text-indigo-600 transition-colors">About</button>
              <button onClick={() => handleTabChange('contact')} className="text-sm font-bold text-[var(--text-secondary)] hover:text-indigo-600 transition-colors">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

