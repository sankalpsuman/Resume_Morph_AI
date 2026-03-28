import React from 'react';
import { motion } from 'motion/react';
import { LogIn, RefreshCw, ShieldCheck, Zap, Target } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore';

export default function Login() {
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
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 font-sans">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side: Branding & Features */}
        <div className="space-y-8">
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
              className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.9] text-gray-900"
            >
              Clone any <span className="text-indigo-600">Resume Style</span> in seconds.
            </motion.h2>
            <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-md">
              The world's first AI-powered resume morphing engine. Upload a style, drop your content, and get a professional result instantly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Zap, text: "Instant Morphing", color: "text-amber-500" },
              { icon: ShieldCheck, text: "ATS Optimized", color: "text-green-500" },
              { icon: Target, text: "JD Alignment", color: "text-indigo-500" },
              { icon: RefreshCw, text: "Style Cloning", color: "text-blue-500" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
                <span className="text-sm font-bold text-gray-700">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[40px] p-10 md:p-16 shadow-2xl shadow-indigo-100 border border-gray-50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          
          <div className="relative z-10 space-y-8 text-center">
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tight text-gray-900">Welcome Back</h3>
              <p className="text-gray-500 font-medium">Sign in to start morphing your resume</p>
            </div>

            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-4 px-8 py-5 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-2xl shadow-gray-200 group"
            >
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              Continue with Google
            </button>

            <div className="pt-8 border-t border-gray-100">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                Trusted by 10,000+ Job Seekers Worldwide
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
