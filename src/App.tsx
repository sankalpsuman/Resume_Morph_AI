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
import Login from './components/Login';
import { RefreshCw, Layout, Info, Shield, Send, Menu, X, MessageSquare, LogOut, User as UserIcon, ChevronDown, Calendar, FileText, Download, Eye } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import AccountModal from './components/AccountModal';
import { handleFirestoreError, OperationType } from './lib/firestore';
import { Zap, CheckCircle, Star, Loader2 } from 'lucide-react';

type Tab = 'builder' | 'about' | 'privacy' | 'contact' | 'feedback';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);

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

  const handleLogout = () => {
    signOut(auth);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'builder', label: 'Morph Engine', icon: Layout },
    { id: 'about', label: 'About & Founder', icon: Info },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'contact', label: 'Contact', icon: Send },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

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

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Global Navigation */}
      <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] md:w-auto">
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

            {/* Resources Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-[22px] text-sm font-black transition-all duration-500 whitespace-nowrap",
                  ['about', 'privacy', 'contact', 'feedback'].includes(activeTab)
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
                    className="absolute top-full left-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl p-1.5 overflow-hidden"
                  >
                    {[
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
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 rounded-full">
                    <Star className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                      {userData.morphCount}/2 Morphs
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500">{user.displayName}</span>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="relative group focus:outline-none"
                  >
                    <img 
                      src={user.photoURL || ''} 
                      alt={user.displayName || ''} 
                      className="w-10 h-10 rounded-xl border-2 border-white shadow-lg group-hover:border-indigo-100 transition-all"
                    />
                  </button>

                  <AnimatePresence>
                    {isUserDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl p-1.5 overflow-hidden"
                      >
                        <button
                          onClick={() => { setIsAccountOpen(true); setIsUserDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                        >
                          <UserIcon className="w-4 h-4 text-indigo-600" />
                          Account Settings
                        </button>
                        <div className="h-px bg-gray-100 my-1 mx-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
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
              className="absolute top-full left-0 right-0 mt-3 bg-white/90 backdrop-blur-2xl rounded-[32px] border border-gray-200/50 shadow-2xl p-3 md:hidden overflow-hidden"
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

                <div className="py-2">
                  <p className="px-5 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">Resources</p>
                  {[
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
                  <div className="flex items-center justify-between mb-4 px-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.photoURL || ''} 
                        alt={user.displayName || ''} 
                        className="w-12 h-12 rounded-2xl border-2 border-white shadow-md"
                      />
                      <div>
                        <p className="text-sm font-black text-gray-900">{user.displayName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-full">
                      <Star className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                        {userData.morphCount}/2
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setIsAccountOpen(true); setIsMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                    >
                      <UserIcon className="w-4 h-4" />
                      Account
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all"
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

      {/* Main Content Area */}
      <main className="flex-grow relative">
        <div className={cn(activeTab !== 'builder' && "hidden")}>
          <ResumeBuilder userData={userData} onUpgrade={() => setShowUpgradeModal(true)} />
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
      </main>

      {/* Account Modal */}
      <AccountModal 
        isOpen={isAccountOpen} 
        onClose={() => setIsAccountOpen(false)} 
        user={user}
        userData={userData}
        onLogout={handleLogout}
        onUpgrade={() => {
          setIsAccountOpen(false);
          setShowUpgradeModal(true);
        }}
      />

      {/* Premium Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8 md:p-10 text-center">
                <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100">
                  <Zap className="w-10 h-10 text-white fill-white" />
                </div>
                
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                  🚀 Unlimited Downloads & Unlimited Morphs – Coming Soon
                </h2>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                  Premium plans with unlimited resume downloads, unlimited morphing, and priority features will be available soon.
                </p>

                <div className="flex flex-col gap-3">
                  {!hasNotified ? (
                    <button
                      onClick={handleNotifyMe}
                      disabled={isNotifying}
                      className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                    >
                      {isNotifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />}
                      Notify Me
                    </button>
                  ) : (
                    <div className="w-full py-5 bg-green-50 text-green-600 rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                      <CheckCircle className="w-5 h-5" />
                      We'll Notify You!
                    </div>
                  )}
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full py-4 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-gray-600 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

