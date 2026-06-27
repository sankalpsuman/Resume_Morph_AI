/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

// Resilient wrapper for lazy loaded components to recover from stale/rebuilding chunks gracefully
function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn("Dynamic import failed, retrying once...", error);
      try {
        return await componentImport();
      } catch (retryError) {
        console.error("Dynamic import retry failed. Reloading the page...", retryError);
        window.location.reload();
        return new Promise(() => {}); // keeps suspension state active during reload
      }
    }
  });
}

const ResumeBuilder = lazyWithRetry(() => import('./components/ResumeBuilder'));
const About = lazyWithRetry(() => import('./components/About'));
const PrivacyPolicy = lazyWithRetry(() => import('./components/PrivacyPolicy'));
const Contact = lazyWithRetry(() => import('./components/Contact'));
const Feedback = lazyWithRetry(() => import('./components/Feedback'));
const PortfolioGenerator = lazyWithRetry(() => import('./components/PortfolioGenerator'));
const Login = lazyWithRetry(() => import('./components/Login'));
const SmartEditor = lazyWithRetry(() => import('./components/SmartEditor'));
const CoverLetterGenerator = lazyWithRetry(() => import('./components/CoverLetterGenerator'));
const ApplyTracker = lazyWithRetry(() => import('./components/ApplyTracker'));
const AccountModal = lazyWithRetry(() => import('./components/AccountModal'));
const UserGuide = lazyWithRetry(() => import('./components/UserGuide'));
const Resources = lazyWithRetry(() => import('./components/Resources'));
const ResumeAIAssistant = lazyWithRetry(() => import('./components/ResumeAIAssistant'));
const GreetingModal = lazyWithRetry(() => import('./components/GreetingModal'));

const Analyzer = lazyWithRetry(() => import('./components/Analyzer'));
const Careers = lazyWithRetry(() => import('./components/Careers'));
const Blog = lazyWithRetry(() => import('./components/Blog'));
const Terms = lazyWithRetry(() => import('./components/Terms'));
const Cookies = lazyWithRetry(() => import('./components/Cookies'));
const Security = lazyWithRetry(() => import('./components/Security'));
const HelpCenter = lazyWithRetry(() => import('./components/HelpCenter'));
const Status = lazyWithRetry(() => import('./components/Status'));
const API = lazyWithRetry(() => import('./components/API'));

import { RefreshCw, Layout, Info, Shield, Send, Menu, X, MessageSquare, LogOut, User as UserIcon, ChevronDown, Calendar, FileText, Download, Eye, Trash2, Globe, Sparkles, Briefcase, LifeBuoy, LogIn } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, storage, ensureConnection } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { loginWithGoogle } from './lib/auth';

// Pre-initialized GoogleAuthProvider moved to lib/auth.ts
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { ref } from 'firebase/storage';
import { deleteWithRetry } from './lib/storage';
import AdminPanel from './components/AdminPanel';
import PremiumModal from './components/PremiumModal';
import CreatorWelcomeModal from './components/CreatorWelcomeModal';
import InteractiveTour from './components/InteractiveTour';
import AppChatbot from './components/AppChatbot';
import LoginModal from './components/LoginModal';
import { handleFirestoreError, OperationType } from './lib/firestore';
import { Zap, CheckCircle, Star, Loader2, BookOpen, BrainCircuit, Sun, Moon, AlertTriangle, Lock } from 'lucide-react';

type Tab = 'builder' | 'portfolio' | 'smart-editor' | 'cover-letter' | 'tracker' | 'ai-assistant' | 'about' | 'privacy' | 'contact' | 'feedback' | 'guide' | 'account' | 'resources' | 'analyzer' | 'careers' | 'blog' | 'terms' | 'cookies' | 'security' | 'help-center' | 'status' | 'api';

import { PLANS } from './constants';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const path = window.location.pathname.replace(/^\//, '');
    const firstPart = path.split('/')[0] as Tab;
    const validTabs: Tab[] = ['builder', 'portfolio', 'smart-editor', 'cover-letter', 'tracker', 'ai-assistant', 'about', 'privacy', 'contact', 'feedback', 'guide', 'account', 'resources', 'analyzer', 'careers', 'blog', 'terms', 'cookies', 'security', 'help-center', 'status', 'api'];
    
    if (firstPart && validTabs.includes(firstPart)) {
      return firstPart;
    }
    
    if (path && !validTabs.includes(firstPart)) {
      console.warn(`[Routing] Invalid path detected: /${path}. Falling back to builder.`);
    }
    
    return 'builder';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('morph_is_guest') === 'true';
    }
    return false;
  });
  const [userData, setUserData] = useState<any>(null);
  const [isAuthProgress, setIsAuthProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [splashStatus, setSplashStatus] = useState('Initializing Morph Engine...');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showGreetingModal, setShowGreetingModal] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const mountTimeRef = React.useRef(Date.now());
  const sendingWelcomeEmailRef = React.useRef("");

  // Route Protection & Guest Enforcement
  useEffect(() => {
    if (loading) return;
    
    const protectedTabs: Tab[] = ['portfolio', 'smart-editor', 'cover-letter', 'tracker', 'ai-assistant', 'account'];
    if (!user && protectedTabs.includes(activeTab)) {
      setActiveTab('builder');
      triggerLogin();
    }
  }, [user, loading, activeTab]);

  useEffect(() => {
    let isMounted = true;

    // Proactively preload lazy-loaded components' bundles in background
    const preload = async () => {
      try {
        const components = [
          () => import('./components/ResumeBuilder'),
          () => import('./components/ResumeAIAssistant'),
          () => import('./components/SmartEditor'),
          () => import('./components/ApplyTracker'),
          () => import('./components/AccountModal'),
          () => import('./components/PortfolioGenerator'),
          () => import('./components/CoverLetterGenerator'),
          () => import('./components/UserGuide'),
          () => import('./components/Resources'),
          () => import('./components/About'),
          () => import('./components/Contact'),
          () => import('./components/Feedback'),
          () => import('./components/PrivacyPolicy')
        ];
        
        // Execute dynamic imports concurrently
        components.forEach((importFn) => {
          importFn().catch((err) => console.log('Preload chunk failed:', err));
        });
        console.log('[Morph Preload] Background preloading of lazy dynamic modules launched successfully.');
      } catch (err) {
        console.warn('[Morph Preload] Module preload error:', err);
      }
    };
    
    preload();

    // Ensure the splash stays for at least 2500ms to reveal the brand banner,
    // and wait until `loading` is false (firebase auth + database profile synchronization is complete).
    if (!loading) {
      const elapsed = Date.now() - mountTimeRef.current;
      const remaining = Math.max(0, 2500 - elapsed);
      const timer = setTimeout(() => {
        if (isMounted) {
          setShowSplash(false);
        }
      }, remaining);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [loading]);

  useEffect(() => {
    if (!showSplash) return;
    const stages = [
      { delay: 0, text: 'Mapping cognitive structures...' },
      { delay: 500, text: 'Constructing AI career pathways...' },
      { delay: 1000, text: 'Synchronizing interactive dashboards...' },
      { delay: 1500, text: 'Optimizing real-time career systems...' },
      { delay: 2000, text: 'System initialized successfully.' }
    ];

    const timeouts = stages.map(stage => {
      return setTimeout(() => {
        setSplashStatus(stage.text);
      }, stage.delay);
    });

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [showSplash]);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState<Record<string, NodeJS.Timeout>>({});
  const [showUndoToast, setShowUndoToast] = useState<string | null>(null);
  const [isPortfolioFullscreen, setIsPortfolioFullscreen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [isOffline, setIsOffline] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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
    const handlePopState = (event: PopStateEvent) => {
      const path = window.location.pathname.replace(/^\//, '');
      const firstPart = path.split('/')[0] as Tab;
      const validTabs: Tab[] = ['builder', 'portfolio', 'smart-editor', 'cover-letter', 'tracker', 'ai-assistant', 'about', 'privacy', 'contact', 'feedback', 'guide', 'account', 'resources', 'analyzer', 'careers', 'blog', 'terms', 'cookies', 'security', 'help-center', 'status', 'api'];
      
      const targetTab = validTabs.includes(firstPart) ? firstPart : 'builder';
      
      // Log for production diagnostics
      console.log(`[Routing] PopState triggered. Path: ${path || 'root'} -> Tab: ${targetTab}`);
      
      setActiveTab(targetTab);
    };

    window.addEventListener('popstate', handlePopState);
    
    // Initial routing log with environment check
    console.log(`[Routing] App initialized. Tab: ${activeTab}, Origin: ${window.location.origin}, UA: ${navigator.userAgent}`);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    ensureConnection().catch(console.error);
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setIsGuest(false);
        sessionStorage.removeItem('morph_is_guest');
      } else {
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
      const isFromCache = docSnap.metadata.fromCache;
      
      // If we have data, update state immediately (even if from cache)
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Subscription Protection:
        // If we have an existing plan in state and it's premium, but the snapshot data
        // is somehow reverted (which happens during transient network states or cache issues),
        // we PROTECT the state until we are certain the data is from the server.
        // This stops the UI from "flickering" back to Free on reload.
        if (userData?.plan && userData.plan !== 'free' && data.plan === 'free' && isFromCache) {
          console.log(`[Subscription] Protecting premium state ${userData.plan} against cached revert for ${user.uid}`);
          setLoading(false);
          return;
        }

        setUserData(data);
        console.log(`[Subscription] Snapshot updated for ${user.uid}. Plan: ${data.plan} (Cache: ${isFromCache})`);

        // Handle Expiry check only if we are relatively sure we have fresh-ish data
        // We also check that plan is NOT actually 'free' already to avoid redundant updates.
        if (data.plan && data.plan !== 'free' && data.premiumExpiryDate && !isFromCache) {
          try {
            const expiry = data.premiumExpiryDate.toDate ? data.premiumExpiryDate.toDate() : new Date(data.premiumExpiryDate);
            if (expiry instanceof Date && !isNaN(expiry.getTime())) {
              const isExpired = Date.now() >= expiry.getTime(); 
              if (isExpired) {
                const currentPlan = data.plan; // Capture current plan for logging
                const freePlan = PLANS.find(p => p.id === 'free') || PLANS[0];
                const currentUsed = data.usedMorphs !== undefined ? data.usedMorphs : (data.morphCount || 0);

                console.warn(`[Subscription] Plan ${currentPlan} expired for user ${user.uid}. Reverting.`);
                // Only update if we're sure this wasn't just a glitchy snapshot
                await updateDoc(userRef, {
                  plan: freePlan.id,
                  planLimit: freePlan.limit,
                  remainingMorphs: Math.max(0, freePlan.limit - currentUsed),
                  premiumExpiryDate: null,
                  showExpiryNotice: true,
                  lastExpiryCheck: Date.now()
                });
              }
            }
          } catch (err) {
            console.error("[Subscription] Expiry error:", err);
          }
        }
        setLoading(false);
      } else if (!isFromCache) {
        // ONLY initialize if the SERVER confirms the document is actually missing.
        // We add an extra layer of verification with getDocFromServer to prevent 
        // accidental overwrites during network/stream glitches on reload.
        try {
          const serverCheck = await getDocFromServer(userRef);
          if (serverCheck.exists()) {
            console.log(`[Subscription] Server check FOUND document for ${user.uid} despite onSnapshot miss. Skipping initialization.`);
            setUserData(serverCheck.data());
            setLoading(false);
            return;
          }

          console.log(`[Subscription] Initializing NEW user profile: ${user.uid}`);
          const initialData = {
            userId: user.uid,
            email: user.email,
            name: user.displayName || 'Morph User',
            photo: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'MU')}&background=6366f1&color=fff`,
            morphCount: 0,
            usedMorphs: 0,
            freeMorphsUsed: 0,
            premiumMorphsUsed: 0,
            remainingMorphs: PLANS[0].limit,
            plan: PLANS[0].id,
            planLimit: PLANS[0].limit,
            hasReviewed: false,
            hasSeenWelcome: false,
            role: 'user',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastActivityAt: serverTimestamp(),
            resumeHistory: [],
            freeClaimed: false,
            metadata: { freeClaimed: false },
            welcomeEmailSent: false,
            welcomeEmailSentAt: null
          };
          
          await setDoc(userRef, initialData);
          setUserData(initialData);
          setLoading(false);
        } catch (err) {
          console.error("Failed to initialize user data:", err);
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          setLoading(false);
        }
      }
      // Note: if docSnap doesn't exist AND it's from cache, we wait for the next fire (server fire)
      // We don't set loading to false yet to avoid showing guest mode prematurely
    }, (error) => {
      // Silent handling for expected idle stream disconnects (Code: 1 CANCELLED) 
      // This is common in proxied or high-latency environments like development containers.
      if (error.code === 'cancelled' || error.message?.includes('CANCELLED') || String(error.code) === '1') {
        console.warn("Morph: Firestore idle stream disconnected. SDK will automatically reconnect.");
        return;
      }

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

  // Automatic Subscription Expiry Watcher
  useEffect(() => {
    if (!userData || !userData.plan || userData.plan === 'free' || !userData.premiumExpiryDate || !user?.uid) return;

    const expiry = userData.premiumExpiryDate.toDate ? userData.premiumExpiryDate.toDate() : new Date(userData.premiumExpiryDate);
    if (!(expiry instanceof Date) || isNaN(expiry.getTime())) return;

    const timeUntilExpiry = expiry.getTime() - Date.now();
    
    // Max timeout is 2147483647 (24.8 days).
    if (timeUntilExpiry > 2147483647) return;

    const downgrade = async () => {
      const freePlan = PLANS.find(p => p.id === 'free') || PLANS[0];
      const currentUsed = userData.usedMorphs !== undefined ? userData.usedMorphs : (userData.morphCount || 0);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        plan: freePlan.id,
        planLimit: freePlan.limit,
        remainingMorphs: Math.max(0, freePlan.limit - currentUsed),
        premiumExpiryDate: null,
        showExpiryNotice: true,
        lastExpiryCheck: Date.now()
      }).catch(console.error);
    };

    if (timeUntilExpiry <= 0) {
      downgrade();
      return;
    }

    const timeout = setTimeout(downgrade, timeUntilExpiry);
    return () => clearTimeout(timeout);
  }, [userData?.plan, userData?.premiumExpiryDate, user?.uid]);

  // Automatic Welcome Email Trigger Effect
  useEffect(() => {
    if (!userData || !userData.email) return;

    // Trigger ONLY if welcomeEmailSent is explicitly false, or missing (e.g. for existing users)
    if (userData.welcomeEmailSent === true) return;

    // Use a ref lock to avoid any duplicate simultaneous running tasks in the same session
    if (sendingWelcomeEmailRef.current === userData.email) return;
    sendingWelcomeEmailRef.current = userData.email;

    const triggerWelcomeEmail = async () => {
      let subDetails: any = null;
      try {
        console.log(`[Welcome Email Trigger] Dispatching trigger for ${userData.email} (${userData.name})`);
        
        // Dynamic subscription plan mapping
        const currentPlanId = userData.plan || 'free';
        const activePlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0];
        const planNameStr = activePlan.name;
        
        let planBenefits: string[] = [];
        if (currentPlanId === 'free') {
          planBenefits = [
            "Access to base design morph matching templates",
            "1 standard high-fidelity ATS layout style cloner use"
          ];
        } else if (currentPlanId === 'pulse') {
          planBenefits = [
            "3 standard high-fidelity ATS layout style cloner uses",
            "Access to responsive preview dashboard",
            "Standard priority build execution"
          ];
        } else if (currentPlanId === 'starter') {
          planBenefits = [
            "7 high-fidelity ATS layout style cloner uses",
            "2 customized responsive portfolio outputs",
            "Clearance of background credits & watermark signatures"
          ];
        } else if (currentPlanId === 'pro') {
          planBenefits = [
            "12 high-fidelity ATS layout style cloner uses",
            "5 customized responsive portfolio outputs",
            "Premium cover letter builder mirroring layout templates",
            "Advanced ATS keywords scanning diagnostic score reports"
          ];
        } else {
          planBenefits = [
            "Unlimited workspace style cloner operations without bounds",
            "10 custom live portfolio generator pages",
            "High-priority multi-page parsing formatting",
            "Direct consultative support priority channels with our founders"
          ];
        }
 
        const remainingCreditsNum = userData.remainingMorphs !== undefined 
          ? userData.remainingMorphs 
          : (activePlan.limit === -1 ? undefined : Math.max(0, activePlan.limit - (userData.usedMorphs || userData.morphCount || 0)));
        
        const upgradeInstructionsStr = currentPlanId === 'unlimited'
          ? "You are already mapped to our ultimate unlimited master combo plan. No further actions needed."
          : `Upgrade instantly of your plan ${planNameStr} by visiting the user menu tab inside your ResumeMorph dashboard panel and select from Starter, Pro, or Master Combo plans via our automated payment channels.`;
 
        subDetails = {
          planName: planNameStr,
          planBenefits: planBenefits,
          remainingCredits: remainingCreditsNum,
          upgradeInstructions: upgradeInstructionsStr
        };

        const isUserAdmin = userData?.role === "admin" || userData?.email === "sankalpsmn@gmail.com";
        const emailToSubmit = (userData.email || "").toLowerCase();
        const userRef = doc(db, 'users', userData.userId || user?.uid);

        // Firestore-first trigger - perfect for cookieless sandboxed iframe environments
        const triggerData = {
          email: emailToSubmit,
          name: userData.name || "Morph User",
          subscriptionDetails: subDetails,
          simulate: false, // Send real automated dispatch
          isAdmin: isUserAdmin,
          timestamp: Date.now(),
          status: "pending"
        };

        console.log(`[Auto Welcome Email] Queueing automated dispatch for ${emailToSubmit} via Firestore...`);

        await updateDoc(userRef, {
          welcomeEmailTrigger: triggerData
        });

        // Real-time listener to wait for completion
        let unsubscribe: (() => void) | null = null;
        const waitForResult = new Promise<{ success: boolean; error?: string }>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            if (unsubscribe) unsubscribe();
            reject(new Error("Onboarding trigger response timed out."));
          }, 15000);

          unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const trigger = data?.welcomeEmailTrigger;
              if (trigger && trigger.status !== "pending" && trigger.status !== "processing") {
                clearTimeout(timeoutId);
                if (unsubscribe) unsubscribe();
                if (trigger.status === "success") {
                  resolve({ success: true });
                } else {
                  resolve({ success: false, error: trigger.error });
                }
              }
            }
          }, (error) => {
            // Silent handling for expected idle stream disconnects (Code: 1 CANCELLED)
            if (error.code === 'cancelled' || error.message?.includes('CANCELLED') || String(error.code) === '1') {
              return;
            }
            clearTimeout(timeoutId);
            if (unsubscribe) unsubscribe();
            reject(error);
          });
        });

        const result = await waitForResult;

        if (result.success) {
          console.log(`[Auto Welcome Email] Onboarding welcome email delivered to ${emailToSubmit} via Firestore.`);
        } else {
          console.warn(`[Auto Welcome Email] Firestore dispatch returned failure: ${result.error || "Unknown"}`);
          throw new Error(result.error);
        }

      } catch (err: any) {
        console.warn("[Auto Welcome Email] Firestore trigger failed or timed out. Falling back to HTTP endpoint...", err);

        // Fallback to HTTP POST
        try {
          const response = await fetch("/api/send-welcome-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: userData.email,
              name: userData.name || "Morph User",
              subscriptionDetails: subDetails,
              isAdmin: userData?.role === "admin" || userData?.email === "sankalpsmn@gmail.com"
            })
          });

          const responseText = await response.text();
          const isHtmlResponse = responseText.trim().startsWith("<") || (response.headers.get("content-type") || "").includes("text/html");

          if (isHtmlResponse) {
            console.warn("[Auto Welcome Email Fallback] Fetch blocked by browser security/cookie parameters (returned HTML instead of JSON).");
            setTimeout(() => {
              if (sendingWelcomeEmailRef.current === userData.email) {
                sendingWelcomeEmailRef.current = "";
              }
            }, 35000);
            return;
          }

          if (response.ok) {
            console.log(`[Auto Welcome Email Fallback] Successfully dispatched welcome email to ${userData.email}`);
            
            // Update Firestore model
            const userRef = doc(db, 'users', userData.userId || user?.uid);
            await updateDoc(userRef, {
              welcomeEmailSent: true,
              welcomeEmailSentAt: serverTimestamp()
            }).catch((dbErr) => {
              console.error("[Auto Welcome Email Fallback] Failed to update Firestore with welcomeEmailSent flag:", dbErr);
            });
          } else {
            let errData: any = {};
            try {
              errData = JSON.parse(responseText);
            } catch (e) {}
            console.error(`[Auto Welcome Email Fallback] Failed dispatch: ${errData.error || response.statusText}`);
            setTimeout(() => {
              if (sendingWelcomeEmailRef.current === userData.email) {
                sendingWelcomeEmailRef.current = "";
              }
            }, 35000);
          }
        } catch (fetchErr: any) {
          console.error("[Auto Welcome Email Fallback] Fetch exception occurred:", fetchErr);
          setTimeout(() => {
            if (sendingWelcomeEmailRef.current === userData.email) {
              sendingWelcomeEmailRef.current = "";
            }
          }, 35000);
        }
      }
    };

    triggerWelcomeEmail();
  }, [userData?.userId, userData?.welcomeEmailSent, userData?.email, user?.uid]);

  // Popup Logic for Welcome & Greeting
  useEffect(() => {
    if (showSplash) return;

    const checkPopups = () => {
      // Intro Popup (GreetingModal) for everyone on first visit
      const introKey = `morph_intro_seen_v1`;
      const hasSeenIntro = localStorage.getItem(introKey);
      
      if (!hasSeenIntro) {
        setShowGreetingModal(true);
        localStorage.setItem(introKey, 'true');
        return;
      }

      // Welcome popup for first-timers (only if not seen before and logged in)
      if (user && userData && userData.hasSeenWelcome === false) {
        setShowWelcomeModal(true);
        return;
      }
    };

    const timer = setTimeout(checkPopups, 2000);
    return () => clearTimeout(timer);
  }, [userData?.hasSeenWelcome, user?.uid, showSplash]);

  const handleCloseWelcome = async () => {
    setShowWelcomeModal(false);
    if (user?.uid) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { hasSeenWelcome: true }).catch(console.error);
    }
  };

  useEffect(() => {
    const handleSetTab = (e: any) => {
      if (e.detail) {
        handleTabChange(e.detail as Tab);
      }
    };
    window.addEventListener('set-tab', handleSetTab);
    
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '') as Tab;
      const validTabs: Tab[] = ['builder', 'portfolio', 'smart-editor', 'cover-letter', 'tracker', 'ai-assistant', 'about', 'privacy', 'contact', 'feedback', 'guide', 'account', 'resources', 'analyzer', 'careers', 'blog', 'terms', 'cookies', 'security', 'help-center', 'status', 'api'];
      setActiveTab(validTabs.includes(path) ? path : 'builder');
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('set-tab', handleSetTab);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); 

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
              await deleteWithRetry(resumeRef).catch(() => {});
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
    setIsGuest(false);
    localStorage.removeItem('morph_is_guest');
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
          deletePromises.push(deleteWithRetry(storageRef).catch(err => console.error("Storage delete failed (final):", err)));
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

  const performGoogleLogin = async () => {
    if (isAuthProgress) return;
    
    // Force immediate visual update of auth progress state
    setIsAuthProgress(true);

    try {
      console.log('Attempting login with Google popup...');
      const result = await loginWithGoogle();
      if (result.user) {
        console.log('Login successful for user:', result.user.email);
        setUser(result.user);
        setIsLoginModalOpen(false);
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        alert("The login popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.warn('Login popup closed by user or cancelled');
      } else {
        console.error('Login error:', error);
      }
    } finally {
      setIsAuthProgress(false);
    }
  };

  const triggerLogin = () => {
    if (user || isAuthProgress) return;
    setIsLoginModalOpen(true);
  };

  const handleTabChange = (tab: Tab) => {
    // Protected Tabs for Guest
    const protectedTabs: Tab[] = ['ai-assistant', 'smart-editor', 'portfolio', 'cover-letter', 'tracker', 'account'];
    
    if (!user && protectedTabs.includes(tab)) {
      triggerLogin();
      return;
    }

    setActiveTab(tab);
    setIsMenuOpen(false);
    setIsResourcesOpen(false);
    setIsUserDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update URL without full page reload
    const newPath = tab === 'builder' ? '/' : `/${tab}`;
    if (window.location.pathname !== newPath) {
      console.log(`[Routing] Navigating: ${window.location.pathname} -> ${newPath}`);
      window.history.pushState({ tab }, '', newPath);
    }
  };

  // Branded Morph Splash Screen immediately visible on App launch
  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#070913] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
        {/* Ambient blurred glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
        
        {/* Subtle background tech grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60" />

        <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
          {/* Branded Icon Container */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl scale-125 animate-pulse" />
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[1.75rem] flex items-center justify-center shadow-2xl relative border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <RefreshCw className="text-white w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            {/* Live Indicator blink */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          {/* Typography */}
          <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent mb-1 uppercase">
            Morph Engine
          </h1>
          <p className="text-[9px] uppercase tracking-[0.3em] text-indigo-400 font-extrabold mb-8 text-center w-full">
            Cognitive Career Architect
          </p>

          {/* Loading status card */}
          <div className="w-64 bg-white/[0.03] border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl mb-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <p className="text-[9px] font-mono font-bold text-slate-300 uppercase tracking-wider truncate w-52">
                {splashStatus}
              </p>
            </div>
            
            {/* Dynamic Progress Bar */}
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{
                  width: splashStatus.includes('successfully') ? '100%' :
                         splashStatus.includes('cognitive') || splashStatus.includes('Cognitive') ? '25%' :
                         splashStatus.includes('pathways') ? '50%' :
                         splashStatus.includes('dashboards') ? '75%' :
                         splashStatus.includes('systems') ? '90%' : '15%'
                }}
              />
            </div>
          </div>

          <p className="text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-slate-500 animate-pulse">
            Preloading modules & engine dependencies
          </p>
        </div>
      </div>
    );
  }


  const userLevel = getLevel(userData?.morphCount || 0);
  const isAdmin = user?.email === 'sankalpsmn@gmail.com';
  const usedMorphs = userData?.usedMorphs !== undefined ? userData.usedMorphs : (userData?.morphCount || 0);
  const planLimit = userData?.planLimit === -1 ? Infinity : (userData?.planLimit || PLANS[0].limit);
  const progress = planLimit === Infinity ? 0 : Math.min((usedMorphs / (planLimit as number)) * 100, 100);
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
        
        {userData?.showExpiryNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest text-center py-2 z-[200] flex items-center justify-center gap-3"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Your Premium Subscription has expired. You are now on the Free Plan.
            <button 
              onClick={async () => {
                if (user?.uid) {
                  await updateDoc(doc(db, 'users', user.uid), { showExpiryNotice: false });
                }
              }}
              className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[9px] transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Top Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 h-16 md:h-18 bg-[var(--bg-primary)]/80 backdrop-blur-2xl border-b border-[var(--border-color)] z-[120] shadow-sm transition-all duration-500",
        isPortfolioFullscreen && activeTab === 'portfolio' && "-translate-y-full hover:translate-y-0" 
      )}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
            {/* Logo Section */}
            <div className="flex items-center gap-3 shrink-0 cursor-pointer group" onClick={() => handleTabChange('builder')}>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-6">
                <RefreshCw className="text-white w-4 h-4 md:w-5 md:h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm md:text-base font-black tracking-tight text-[var(--text-primary)] leading-none">Resume<span className="saas-gradient-text">Morph</span></h1>
                  <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[9px] uppercase rounded tracking-wider hidden sm:inline-block">v2.5</span>
                </div>
                <p className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold mt-0.5">AI Career OS</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-[var(--bg-secondary)]/80 border border-[var(--border-color)] rounded-2xl">
              {mainTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isLocked = !user && tab.id !== 'builder';
                return (
                  <div key={tab.id} className="relative group">
                    <button 
                      id={`tab-${tab.id}`}
                      onClick={() => handleTabChange(tab.id as Tab)}
                      className={cn(
                        "relative flex items-center gap-2 px-3 xl:px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap z-10",
                        isActive 
                          ? "text-white dark:text-white" 
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        isLocked && "opacity-60 cursor-not-allowed group-hover:opacity-100"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="desktopNavIndicator"
                          className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md shadow-indigo-500/25 -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                      <tab.icon className={cn(
                        "w-3.5 h-3.5 transition-transform group-hover:scale-110", 
                        isActive ? "text-white" : "text-[var(--text-tertiary)] group-hover:text-indigo-500 dark:group-hover:text-indigo-400",
                        isLocked && "grayscale"
                      )} />
                      <span className={isActive ? "inline" : "hidden lg:inline"}>{tab.label}</span>
                      {isLocked && <Lock className="w-2.5 h-2.5 ml-1 text-gray-400" />}
                    </button>

                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-[150]">
                      <div className="bg-gray-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-white/10 relative">
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-t border-l border-white/10" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">{tab.label}</p>
                        <p className="text-[10px] font-medium text-gray-300 leading-snug">{tab.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                {user ? (
                  <>
                    <div className="relative group">
                      <button 
                        id="tab-account"
                        onClick={() => handleTabChange('account')}
                        className="relative p-0.5 rounded-xl bg-[var(--bg-primary)] shadow-lg border border-[var(--border-color)] transition-transform active:scale-95 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img 
                          src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || '')}&background=6366f1&color=fff`} 
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
                ) : (
                  <button
                    onClick={triggerLogin}
                    disabled={isAuthProgress}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    {isAuthProgress ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogIn className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">{isAuthProgress ? 'Connecting...' : 'Login'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

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
                    {mainTabs.map((item) => {
                      const isLocked = !user && ['ai-assistant', 'smart-editor', 'portfolio', 'cover-letter', 'tracker', 'account'].includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => { handleTabChange(item.id as Tab); setIsMenuOpen(false); }}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                            activeTab === item.id 
                              ? "bg-indigo-600 text-white" 
                              : "text-[var(--text-secondary)] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600",
                            isLocked && "opacity-70"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            {item.label}
                          </div>
                          {isLocked && <Lock className="w-4 h-4 text-zinc-400" />}
                        </button>
                      );
                    })}
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
                  onClick={() => { 
                    if (!user) {
                      triggerLogin();
                      return;
                    }
                    setShowUpgradeModal(true); 
                    setIsMenuOpen(false); 
                  }}
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
        !isPortfolioFullscreen && "pt-20 md:pt-28 pb-32"
      )}>
        <React.Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        }>
          {activeTab === 'builder' && (
            !user && !isGuest ? (
              <Login 
                onTryGuest={() => {
                  setIsGuest(true);
                  localStorage.setItem('morph_is_guest', 'true');
                }} 
                onLogin={performGoogleLogin}
                theme={theme} 
                toggleTheme={toggleTheme}
                isLoginProgress={isAuthProgress}
              />
            ) : (
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <ResumeBuilder 
                  userData={userData} 
                  onUpgrade={() => setShowUpgradeModal(true)} 
                  user={user}
                  onLogin={triggerLogin}
                  isLoginProgress={isAuthProgress}
                  isGuest={isGuest}
                />
              </div>
            )
          )}

          {activeTab === 'ai-assistant' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ResumeAIAssistant user={user} onLogin={triggerLogin} />
            </div>
          )}
          
          {activeTab === 'smart-editor' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SmartEditor 
                userData={userData} 
                user={user}
                onUpgrade={() => setShowUpgradeModal(true)}
                onLogin={triggerLogin}
                isLoginProgress={isAuthProgress}
                isAdmin={isAdmin}
              />
            </div>
          )}
          
          {activeTab === 'cover-letter' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <CoverLetterGenerator 
                resumeData={userData?.resumeHistory?.[0]?.originalText || ""} 
                user={user}
                onLogin={triggerLogin}
              />
            </div>
          )}
          
          {activeTab === 'tracker' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ApplyTracker user={user} onLogin={triggerLogin} />
            </div>
          )}
          
          {activeTab === 'portfolio' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <PortfolioGenerator 
                onFullscreenChange={setIsPortfolioFullscreen} 
                user={user}
                onLogin={triggerLogin}
              />
            </div>
          )}
          
          {activeTab === 'guide' && (
            <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
              <UserGuide />
            </div>
          )}
          
          {activeTab === 'about' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <About />
            </div>
          )}
          
          {activeTab === 'privacy' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <PrivacyPolicy />
            </div>
          )}
          
          {activeTab === 'contact' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Contact />
            </div>
          )}
          
          {activeTab === 'feedback' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Feedback user={user} isAdmin={isAdmin} />
            </div>
          )}
          
          {activeTab === 'resources' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Resources onTabChange={handleTabChange} />
            </div>
          )}

          {activeTab === 'analyzer' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Analyzer user={user} onLogin={triggerLogin} />
            </div>
          )}
          {activeTab === 'careers' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Careers />
            </div>
          )}
          {activeTab === 'blog' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Blog />
            </div>
          )}
          {activeTab === 'terms' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Terms />
            </div>
          )}
          {activeTab === 'cookies' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Cookies />
            </div>
          )}
          {activeTab === 'security' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Security />
            </div>
          )}
          {activeTab === 'help-center' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <HelpCenter />
            </div>
          )}
          {activeTab === 'status' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Status />
            </div>
          )}
          {activeTab === 'api' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <API />
            </div>
          )}
          
          {activeTab === 'account' && (
            <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
              {user && userData ? (
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
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[28px] flex items-center justify-center mb-6 shadow-lg shadow-indigo-100 dark:shadow-none">
                    <UserIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4 tracking-tight">Access Your Profile</h2>
                  <p className="text-[var(--text-secondary)] mb-8 max-w-md font-medium text-lg leading-relaxed">Sign in to view your saved resumes, manage your subscription, and track your career growth.</p>
                  <button 
                    onClick={triggerLogin}
                    disabled={isAuthProgress}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center gap-3 disabled:opacity-50"
                  >
                    {isAuthProgress ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                    {isAuthProgress ? 'Connecting...' : 'Sign In with Google'}
                  </button>
                </div>
              )}
            </div>
          )}
        </React.Suspense>
      </main>

      {/* Premium Floating Bottom Navigation (Mobile-first Redesign) */}
      {!isPortfolioFullscreen && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-sm">
          <div className="bg-[#0b0f19]/90 dark:bg-black/90 backdrop-blur-2xl border border-white/15 rounded-full p-1.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
            {[
              { id: 'builder', icon: Layout, label: 'Morph' },
              { id: 'ai-assistant', icon: BrainCircuit, label: 'Coach' },
              { id: 'smart-editor', icon: Sparkles, label: 'Smart' },
              { id: 'tracker', icon: Briefcase, label: 'Jobs' },
              { id: 'account', icon: UserIcon, label: 'Profile' },
            ].map((item) => {
              const isActive = activeTab === item.id;
              const isLocked = !user && item.id !== 'builder';
              return (
                <button
                  key={item.id}
                  id={`mobile-tab-${item.id}`}
                  onClick={() => handleTabChange(item.id as Tab)}
                  className={cn(
                    "relative py-2 px-3 rounded-full flex flex-col items-center justify-center transition-all focus:outline-none flex-1 select-none cursor-pointer",
                    isLocked && "opacity-50"
                  )}
                >
                  {/* Fluid sliding background pill on active */}
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveIndicator"
                      className="absolute inset-x-1 inset-y-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  {/* Tab Icon and Indicator */}
                  <div className="relative z-10 flex flex-col items-center">
                    {item.id === 'account' && user ? (
                      <div className="relative">
                        <img 
                          src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || '')}&background=6366f1&color=fff`} 
                          alt="Profile" 
                          className={cn(
                            "w-5 h-5 rounded-full object-cover border transition-all duration-300",
                            isActive ? "border-white scale-110 shadow-sm" : "border-white/30"
                          )}
                          referrerPolicy="no-referrer"
                        />
                        {/* Interactive Notification live active dot */}
                        <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                        </span>
                      </div>
                    ) : (
                      <div className="relative">
                        <item.icon className={cn(
                          "w-5 h-5 transition-transform duration-300",
                          isActive ? "text-white scale-110" : "text-zinc-400 hover:text-zinc-200",
                          isLocked && "grayscale"
                        )} />
                        {isLocked && <Lock className="absolute -top-1 -right-1 w-2.5 h-2.5 text-zinc-500" />}
                      </div>
                    )}
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-wider mt-1 transition-colors duration-300",
                      isActive ? "text-white font-black" : "text-zinc-400 font-bold"
                    )}>
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
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
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-md"
          >
            <div className="bg-gray-900/95 dark:bg-black/95 backdrop-blur-2xl text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                  <Trash2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[11px] font-black tracking-wide text-white">Resume Archived</p>
                  <p className="text-[9px] text-gray-400 font-mono font-medium uppercase tracking-wider">Self-destruct in 5s</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUndoToast(null)}
                  className="px-3.5 py-1.5 border border-white/15 text-gray-300 hover:bg-white/10 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all active:scale-95"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleUndoDelete(showUndoToast)}
                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all active:scale-95 shadow-lg shadow-indigo-500/25"
                >
                  Undo
                </button>
              </div>
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

      <CreatorWelcomeModal 
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcome}
        type="welcome"
      />

      <GreetingModal
        isOpen={showGreetingModal}
        onClose={() => {
          setShowGreetingModal(false);
          if (!user && !isGuest) {
            setActiveTab('builder');
          }
        }}
        userName={user?.displayName || userData?.name}
      />

      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={performGoogleLogin}
        isProgress={isAuthProgress}
      />

      <InteractiveTour />
      <AppChatbot />

      {/* Global Footer */}
      <footer className="py-16 md:py-24 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12 md:gap-16">
          {/* Top Section: Logo & Links */}
          <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-between gap-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <RefreshCw className="text-white w-5 h-5 animate-spin-slow" />
                </div>
                <span className="font-black text-xl md:text-2xl tracking-tight text-[var(--text-primary)]">Resume<span className="saas-gradient-text">Morph</span></span>
              </div>
              <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium text-center md:text-left max-w-xs leading-relaxed">
                Empowering high-trajectory careers through AI-architected resume synthesis and portfolio generation.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 sm:gap-x-12 md:gap-y-8 text-center sm:text-left w-full md:w-auto">
              {[
                { title: 'Product', links: [
                  { label: 'Builder', id: 'builder' },
                  { label: 'Analyzer', id: 'analyzer' },
                  { label: 'Tracker', id: 'tracker' },
                  { label: 'Assistant', id: 'ai-assistant' }
                ] },
                { title: 'Company', links: [
                  { label: 'About', id: 'about' },
                  { label: 'Careers', id: 'careers' },
                  { label: 'Contact', id: 'contact' },
                  { label: 'Blog', id: 'blog' }
                ] },
                { title: 'Legal', links: [
                  { label: 'Privacy', id: 'privacy' },
                  { label: 'Terms', id: 'terms' },
                  { label: 'Cookies', id: 'cookies' },
                  { label: 'Security', id: 'security' }
                ] },
                { title: 'Support', links: [
                  { label: 'Help Center', id: 'help-center' },
                  { label: 'Feedback', id: 'feedback' },
                  { label: 'Status', id: 'status' },
                  { label: 'API', id: 'api' }
                ] },
              ].map((group) => (
                <div key={group.title} className="space-y-4">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{group.title}</h4>
                  <ul className="space-y-3">
                    {group.links.map(link => (
                      <li key={link.id}>
                        <button 
                          onClick={() => handleTabChange(link.id as Tab)} 
                          className="text-xs font-semibold text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left sm:text-left inline-block"
                        >
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-[var(--border-color)]" />

          {/* Bottom Section: Legal & Version */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[11px] sm:text-xs text-[var(--text-tertiary)] font-medium text-center sm:text-left">
              © 2026 ResumeMorph Inc. Crafted with <span className="text-red-500">♥</span> by <button onClick={() => window.dispatchEvent(new CustomEvent('open-creator-about'))} className="text-[var(--text-primary)] font-bold hover:text-indigo-600 transition-colors">Sankalp Suman</button>. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">v2.5 AI Engine</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

