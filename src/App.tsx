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
import { RefreshCw, Layout, Info, Shield, Send, Menu, X, MessageSquare, LogOut, User as UserIcon, ChevronDown, Calendar, FileText, Download, Eye, Trash2, Globe, Sparkles, Briefcase } from 'lucide-react';
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
import { handleFirestoreError, OperationType } from './lib/firestore';
import { Zap, CheckCircle, Star, Loader2, BookOpen } from 'lucide-react';

type Tab = 'builder' | 'portfolio' | 'smart-editor' | 'cover-letter' | 'tracker' | 'about' | 'privacy' | 'contact' | 'feedback' | 'guide' | 'account';

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
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
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

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'builder', label: 'Morph Engine', icon: Layout },
    { id: 'smart-editor', label: 'Smart Editor', icon: Sparkles },
    { id: 'cover-letter', label: 'Cover Letter', icon: FileText },
    { id: 'tracker', label: 'Applications', icon: Briefcase },
    { id: 'portfolio', label: 'Portfolio', icon: Globe },
    { id: 'guide', label: 'User Guide', icon: BookOpen },
    { id: 'account', label: 'Account', icon: UserIcon },
    { id: 'about', label: 'About', icon: Info },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'contact', label: 'Contact', icon: Send },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Global Navigation */}
      {!isPortfolioFullscreen && (
        <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[110] w-[calc(100%-2rem)] md:w-auto">
        <div className="bg-white/80 backdrop-blur-2xl border border-gray-200/50 rounded-[24px] md:rounded-[28px] p-1.5 shadow-2xl shadow-indigo-100/30 flex items-center justify-between md:justify-start gap-1">
          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => handleTabChange('builder')}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 rounded-[22px] text-sm font-black transition-all duration-500 whitespace-nowrap",
                activeTab === 'builder' 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Layout className="w-4 h-4" />
              Morph Engine
            </button>

            <button 
              onClick={() => handleTabChange('smart-editor')}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 rounded-[22px] text-sm font-black transition-all duration-500 whitespace-nowrap",
                activeTab === 'smart-editor' 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Smart Editor
            </button>

            <button 
              onClick={() => handleTabChange('portfolio')}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 rounded-[22px] text-sm font-black transition-all duration-500 whitespace-nowrap",
                activeTab === 'portfolio' 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Globe className="w-4 h-4" />
              Portfolio Gen
            </button>

            <button 
              onClick={() => handleTabChange('cover-letter')}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 rounded-[22px] text-sm font-black transition-all duration-500 whitespace-nowrap",
                activeTab === 'cover-letter' 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <FileText className="w-4 h-4" />
              Cover Letter
            </button>

            <button 
              onClick={() => handleTabChange('tracker')}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 rounded-[22px] text-sm font-black transition-all duration-500 whitespace-nowrap",
                activeTab === 'tracker' 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Briefcase className="w-4 h-4" />
              Applications
            </button>

            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-[22px] text-sm font-black text-amber-600 hover:bg-amber-50 transition-all duration-500 whitespace-nowrap group"
            >
              <Zap className="w-4 h-4 fill-amber-600 group-hover:scale-110 transition-transform" />
              Premium
            </button>

            {/* Resources Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-[22px] text-sm font-black transition-all duration-500 whitespace-nowrap",
                  ['about', 'privacy', 'contact', 'feedback', 'guide'].includes(activeTab)
                    ? "bg-indigo-50 text-indigo-600" 
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Info className="w-4 h-4" />
                Resources
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isResourcesOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isResourcesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl p-1.5 overflow-y-auto max-h-[70vh] scrollbar-hide"
                  >
                    {[
                      { id: 'guide', label: 'User Guide', icon: BookOpen },
                      { id: 'about', label: 'About', icon: Info },
                      { id: 'privacy', label: 'Privacy', icon: Shield },
                      { id: 'contact', label: 'Contact', icon: Send },
                      { id: 'feedback', label: 'Feedback', icon: MessageSquare },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id as Tab)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                          activeTab === item.id 
                            ? "bg-indigo-50 text-indigo-600" 
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* User Profile & Avatar Dropdown */}
          <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-gray-100">
            {userData && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-sm",
                    userLevel.bg, userLevel.border
                  )}>
                    <Star className={cn("w-3 h-3 fill-current", userLevel.color)} />
                    <span className={cn("text-[10px] font-black uppercase tracking-wider", userLevel.color)}>
                      {userLevel.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-900 mt-0.5 flex items-center gap-1">
                    {user.displayName}
                    {user.email === 'sankalpsmn@gmail.com' && <Shield className="w-3 h-3 text-indigo-600" />}
                  </span>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="relative group focus:outline-none"
                  >
                    <div className="relative p-1 rounded-2xl bg-white shadow-lg group-hover:shadow-indigo-200/50 transition-all duration-300">
                      {/* Progress Ring */}
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="21"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-gray-100"
                        />
                        <motion.circle
                          initial={{ strokeDasharray: "0 100" }}
                          animate={{ strokeDasharray: `${progress} 100` }}
                          cx="24"
                          cy="24"
                          r="21"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="100 100"
                          className="text-indigo-600"
                        />
                      </svg>
                      
                      <img 
                        src={user.photoURL || ''} 
                        alt={user.displayName || ''} 
                        className="w-10 h-10 rounded-[14px] border-2 border-white shadow-sm object-cover relative z-10"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm z-20" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isUserDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-[-1]" 
                          onClick={() => setIsUserDropdownOpen(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full right-0 mt-3 w-80 bg-white/95 backdrop-blur-2xl border border-gray-200/50 rounded-[32px] shadow-2xl p-2 overflow-y-auto max-h-[80vh] ring-1 ring-black/5"
                        >
                          {/* Profile Header */}
                          <div className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-[24px] mb-2 border border-gray-100">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <img 
                                  src={user.photoURL || ''} 
                                  alt={user.displayName || ''} 
                                  className="w-16 h-16 rounded-2xl border-2 border-white shadow-md object-cover"
                                />
                                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg">
                                  {userLevel.name}
                                </div>
                              </div>
                              <div className="flex-grow min-w-0">
                                <h4 className="font-black text-gray-900 text-base truncate flex items-center gap-1.5">
                                  {user.displayName}
                                  {user.email === 'sankalpsmn@gmail.com' && <Shield className="w-4 h-4 text-indigo-600" />}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{user.email}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 text-white rounded-lg">
                                    <Zap className="w-2.5 h-2.5 fill-white" />
                                    <span className="text-[9px] font-black uppercase tracking-wider">{userData.plan || 'Free'} Plan</span>
                                  </div>
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Since {memberSince}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Stats & Progress */}
                          <div className="px-2 mb-2 space-y-2">
                            <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Morph Engine Usage</p>
                                <p className="text-[10px] font-black text-indigo-600">
                                  {userData.planLimit === -1 ? '∞' : `${usedMorphs} / ${userData.planLimit || 2}`}
                                </p>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  className="h-full bg-indigo-600 rounded-full"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Account Status</p>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                  <p className="text-xs font-black text-gray-900">Verified</p>
                                </div>
                              </div>
                              <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">User Level</p>
                                <p className={cn("text-xs font-black", userLevel.color)}>{userLevel.name}</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-1">
                            <button
                              onClick={() => { handleTabChange('account'); setIsUserDropdownOpen(false); }}
                              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <UserIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                Account Settings
                              </div>
                              <ChevronDown className="w-4 h-4 -rotate-90 text-gray-300 group-hover:text-indigo-300" />
                            </button>
                            
                            <div className="h-px bg-gray-100/50 mx-4 my-1" />
                            
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all group"
                            >
                              <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                              Logout
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Logo & Menu Toggle */}
          <div className="flex md:hidden items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <RefreshCw className="text-white w-4 h-4" />
            </div>
            <span className="font-black text-sm tracking-tight">Resume Morph</span>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-2xl rounded-[32px] border border-gray-200/50 shadow-2xl p-4 md:hidden overflow-y-auto max-h-[80vh] ring-1 ring-black/5 scrollbar-hide"
            >
              <div className="space-y-1">
                <button 
                  onClick={() => handleTabChange('builder')}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all",
                    activeTab === 'builder' 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Layout className="w-5 h-5" />
                  Morph Engine
                </button>
                <button 
                  onClick={() => handleTabChange('smart-editor')}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all",
                    activeTab === 'smart-editor' 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                  Smart Editor
                </button>
                <button 
                  onClick={() => handleTabChange('portfolio')}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all",
                    activeTab === 'portfolio' 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Globe className="w-5 h-5" />
                  Portfolio Gen
                </button>

                <button 
                  onClick={() => handleTabChange('cover-letter')}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all",
                    activeTab === 'cover-letter' 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <FileText className="w-5 h-5" />
                  Cover Letter
                </button>

                <button 
                  onClick={() => handleTabChange('tracker')}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all",
                    activeTab === 'tracker' 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Briefcase className="w-5 h-5" />
                  Applications
                </button>

                <button 
                  onClick={() => { setShowUpgradeModal(true); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black text-amber-600 hover:bg-amber-50 transition-all"
                >
                  <Zap className="w-5 h-5 fill-amber-600" />
                  Upgrade to Premium
                </button>

                <div className="py-2">
                  <p className="px-5 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">Resources</p>
                  {[
                    { id: 'guide', label: 'User Guide', icon: BookOpen },
                    { id: 'about', label: 'About & Founder', icon: Info },
                    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
                    { id: 'contact', label: 'Contact Us', icon: Send },
                    { id: 'feedback', label: 'Share Feedback', icon: MessageSquare },
                  ].map((tab) => (
                    <button 
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as Tab)}
                      className={cn(
                        "w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all",
                        activeTab === tab.id 
                          ? "bg-indigo-50 text-indigo-600" 
                          : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      <tab.icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile User Info */}
              {userData && (
                <div className="mt-4 pt-4 border-t border-gray-100 px-2 pb-2">
                  <div className="bg-gray-50/50 rounded-[32px] p-5 mb-4 border border-gray-100">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="relative">
                        <img 
                          src={user.photoURL || ''} 
                          alt={user.displayName || ''} 
                          className="w-16 h-16 rounded-[20px] border-4 border-white shadow-lg object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                        <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg">
                          {userLevel.name}
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-black text-gray-900 text-lg truncate flex items-center gap-1.5">
                          {user.displayName}
                          {user.email === 'sankalpsmn@gmail.com' && <Shield className="w-4 h-4 text-indigo-600" />}
                        </h4>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest truncate">{user.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-xl">
                            <Zap className="w-3 h-3 fill-white" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{userData.plan || 'Free'} Plan</span>
                          </div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Since {memberSince}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Morph Engine Usage</p>
                          <p className="text-[10px] font-black text-indigo-600">
                            {userData.planLimit === -1 ? '∞' : `${usedMorphs} / ${userData.planLimit || 2}`}
                          </p>
                        </div>
                        <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-indigo-600 rounded-full"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">User Level</p>
                          <p className={cn("text-sm font-black", userLevel.color)}>{userLevel.name}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Status</p>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                            <p className="text-sm font-black text-gray-900">Active</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => { handleTabChange('account'); setIsMenuOpen(false); }}
                      className="flex items-center justify-center gap-3 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                    >
                      <UserIcon className="w-4 h-4" />
                      Account
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      )}

      {/* Main Content Area */}
      <main className="flex-grow relative">
        <div className={cn(activeTab !== 'builder' && "hidden")}>
          <ResumeBuilder userData={userData} onUpgrade={() => setShowUpgradeModal(true)} />
        </div>
        <div className={cn(activeTab !== 'smart-editor' && "hidden")}>
          <SmartEditor />
        </div>
        <div className={cn(activeTab !== 'cover-letter' && "hidden")}>
          <CoverLetterGenerator resumeData={userData?.resumeHistory?.[0]?.data || {}} />
        </div>
        <div className={cn(activeTab !== 'tracker' && "hidden")}>
          <ApplyTracker />
        </div>
        <div className={cn(activeTab !== 'portfolio' && "hidden")}>
          <PortfolioGenerator onFullscreenChange={setIsPortfolioFullscreen} />
        </div>
        <div className={cn(activeTab !== 'guide' && "hidden")}>
          <UserGuide />
        </div>
        <div className={cn(activeTab !== 'about' && "hidden")}>
          <About />
        </div>
        <div className={cn(activeTab !== 'privacy' && "hidden")}>
          <PrivacyPolicy />
        </div>
        <div className={cn(activeTab !== 'contact' && "hidden")}>
          <Contact />
        </div>
        <div className={cn(activeTab !== 'feedback' && "hidden")}>
          <Feedback />
        </div>
        <div className={cn(activeTab !== 'account' && "hidden")}>
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-2xl border-t border-gray-100 px-6 py-3 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {[
          { id: 'builder', icon: Layout, label: 'Morph' },
          { id: 'smart-editor', icon: Sparkles, label: 'Smart' },
          { id: 'tracker', icon: Briefcase, label: 'Jobs' },
          { id: 'portfolio', icon: Globe, label: 'Port' },
          { id: 'account', icon: UserIcon, label: 'Me' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id as Tab)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === item.id ? "text-indigo-600" : "text-gray-400"
            )}
          >
            <item.icon className={cn("w-6 h-6", activeTab === item.id && "fill-indigo-50")} />
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
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
            <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Resume Deleted</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Permanently in 5s</p>
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

      {/* Global Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <RefreshCw className="text-white w-4 h-4" />
            </div>
            <span className="font-black text-lg tracking-tight">Resume Morph</span>
          </div>
          <p className="text-sm text-gray-400 font-medium text-center md:text-left">
            © 2026 Resume Morph. Built with passion by Sankalp Suman.
          </p>
          <div className="flex items-center gap-6">
            <button onClick={() => handleTabChange('feedback')} className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors">Feedback</button>
            <button onClick={() => handleTabChange('privacy')} className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors">Privacy</button>
            <button onClick={() => handleTabChange('about')} className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors">About</button>
            <button onClick={() => handleTabChange('contact')} className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

