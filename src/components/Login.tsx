import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, RefreshCw, ShieldCheck, Zap, Target, Star, MessageSquare, User, Info, Heart, Code, Layout, Sparkles } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore';

interface FeedbackItem {
  id: string;
  name: string;
  message: string;
  rating?: number;
  createdAt: any;
}

export default function Login() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [showNewFeaturePopup, setShowNewFeaturePopup] = useState(false);

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
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not create
      const userRef = doc(db, 'users', user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        return;
      }

      if (!userSnap.exists()) {
        try {
          await setDoc(userRef, {
            userId: user.uid,
            name: user.displayName,
            email: user.email,
            photo: user.photoURL,
            createdAt: serverTimestamp(),
            morphCount: 0,
            usedMorphs: 0,
            remainingMorphs: 2,
            plan: 'free',
            planLimit: 2,
            hasReviewed: false,
            resumeHistory: []
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user');
      } else {
        console.error('Login failed:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-indigo-100">
      {/* New Feature Popup */}
      <AnimatePresence>
        {showNewFeaturePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[48px] p-10 md:p-16 max-w-2xl w-full shadow-2xl shadow-indigo-200 border border-indigo-50 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
              
              <div className="relative z-10 text-center space-y-8">
                <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center mx-auto shadow-xl shadow-indigo-200 rotate-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                    <Zap className="w-3 h-3" />
                    Major Update Available
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 leading-[0.9]">
                    Portfolio <br />
                    <span className="text-indigo-600">Generator.</span>
                  </h2>
                  <p className="text-lg text-gray-500 font-medium leading-relaxed">
                    We've just launched our most requested feature. Convert any resume into a premium SaaS-style portfolio website in seconds.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-left">
                    <Layout className="w-6 h-6 text-indigo-600 mb-3" />
                    <h4 className="font-black text-gray-900 text-sm mb-1">3 Templates</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Minimal, Dev, Pro</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-left">
                    <Code className="w-6 h-6 text-purple-600 mb-3" />
                    <h4 className="font-black text-gray-900 text-sm mb-1">Source Code</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Full JSON Export</p>
                  </div>
                </div>

                <button 
                  onClick={closePopup}
                  className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-2xl shadow-indigo-200"
                >
                  Explore Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="flex items-center justify-center p-6 md:p-12 lg:p-24">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side: Branding & Features */}
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-3">
                <RefreshCw className="text-white w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900">Resume Morph</h1>
            </div>

            <div className="space-y-6">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] text-gray-900"
              >
                Clone any <span className="text-indigo-600">Resume Style</span> in seconds.
              </motion.h2>
              <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed max-w-lg">
                The world's first AI-powered resume morphing engine. Upload a style, drop your content, and get a professional result instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'morphing', icon: Zap, text: "Instant Morphing", color: "text-amber-500", bg: "bg-amber-50" },
                { id: 'ats', icon: ShieldCheck, text: "ATS Optimized", color: "text-green-500", bg: "bg-green-50" },
                { id: 'jd', icon: Target, text: "JD Alignment", color: "text-indigo-500", bg: "bg-indigo-50" },
                { id: 'cloning', icon: RefreshCw, text: "Style Cloning", color: "text-blue-500", bg: "bg-blue-50" }
              ].map((feature, i) => (
                <motion.div 
                  key={feature.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className={`w-10 h-10 ${feature.bg} rounded-xl flex items-center justify-center`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <span className="text-sm font-black text-gray-700 uppercase tracking-wider">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Side: Login Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[48px] p-10 md:p-16 shadow-2xl shadow-indigo-100 border border-gray-50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
            
            <div className="relative z-10 space-y-10 text-center">
              <div className="space-y-3">
                <h3 className="text-4xl font-black tracking-tight text-gray-900">Get Started</h3>
                <p className="text-gray-500 font-medium text-lg">Sign in to start morphing your resume</p>
              </div>

              <button 
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-gray-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-2xl shadow-gray-200 group"
              >
                <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                Continue with Google
              </button>

              <div className="pt-10 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black">
                  Trusted by 10,000+ Job Seekers Worldwide
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Feedback Section */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              <MessageSquare className="w-3 h-3" />
              What Users Say
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">Real Feedback. <span className="text-indigo-600">Real Results.</span></h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {feedbacks.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 space-y-6 hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all duration-500 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verified User</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <Star key={`${item.id}-star-${i}`} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 font-medium leading-relaxed italic">
                  "{item.message}"
                </p>
              </motion.div>
            ))}
          </div>
          
          {feedbacks.length === 0 && (
            <div className="text-center py-12 text-gray-400 font-medium">
              Loading community feedback...
            </div>
          )}
        </div>
      </section>

      {/* Owner & Story Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-gray-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                <Info className="w-3 h-3" />
                The Story
              </div>
              <h2 className="text-4xl font-black tracking-tight text-gray-900 leading-tight">
                Built to solve the <span className="text-indigo-600">Resume Struggle.</span>
              </h2>
              <div className="space-y-4 text-gray-600 font-medium leading-relaxed">
                <p>
                  Resume Morph was born out of a simple frustration: why is it so hard to make a resume look professional without spending hours on formatting?
                </p>
                <p>
                  We realized that job seekers often have the right content but struggle with the "visual language" of their industry. Our Morph Engine solves this by separating style from content.
                </p>
                <p>
                  Today, we help thousands of users clone top-tier resume styles and align their content with job descriptions using advanced AI, giving them the confidence to apply for their dream roles.
                </p>
              </div>
            </div>

            <div className="bg-white p-10 md:p-12 rounded-[48px] shadow-xl shadow-gray-200 border border-gray-100 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Sankalp</h3>
                  <p className="text-sm text-indigo-600 font-black uppercase tracking-widest">Founder & Creator</p>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium italic">
                    "My goal is to level the playing field for every job seeker. Your resume should be a reflection of your potential, not your design skills."
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Code className="w-3 h-3" />
                    Built with AI
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Morph Engine v2.0
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
          &copy; 2026 Resume Morph. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
