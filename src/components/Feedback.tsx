import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Send, User, Trash2, Reply, CheckCircle, 
  AlertCircle, Loader2, LogIn, LogOut, Star
} from 'lucide-react';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, deleteDoc, doc, updateDoc, getDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged 
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { cn } from '../lib/utils';

interface FeedbackItem {
  id: string;
  name: string;
  message: string;
  reply?: string;
  createdAt: any;
  uid: string;
}

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if user is admin
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        if (userData?.role === 'admin' || user.email === 'sankalpsmn@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
    const unsubscribeFeedbacks = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FeedbackItem[];
      setFeedbacks(items);
    }, (error) => {
      console.error("Firestore Error: ", error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFeedbacks();
    };
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to log as a critical error
        console.log('Login popup closed by user');
      } else {
        console.error('Login failed:', error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        name,
        message,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      setName('');
      setMessage('');
    } catch (error) {
      console.error('Failed to add feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await deleteDoc(doc(db, 'feedbacks', id));
    } catch (error) {
      console.error('Failed to delete feedback:', error);
    }
  };

  const handleReply = async (id: string) => {
    if (!isAdmin || !replyText.trim()) return;
    setIsReplying(true);
    try {
      await updateDoc(doc(db, 'feedbacks', id), {
        reply: replyText
      });
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Failed to reply:', error);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] font-sans selection:bg-indigo-100 pt-24 md:pt-32 pb-16 md:pb-24">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-12"
        >
          <div className="text-center space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-[10px] md:text-xs font-black uppercase tracking-widest">
              <MessageSquare className="w-3 h-3" />
              Community Feedback
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 leading-tight md:leading-none">
              User <span className="text-indigo-600">Feedback.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
              We value your thoughts. Share your experience with Resume Morph and help us grow.
            </p>
          </div>

          {/* Submission Form */}
          <section className="bg-gray-50 rounded-[32px] md:rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-sm">
            {!user ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
                  <LogIn className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black tracking-tight">Sign in to share feedback</h3>
                  <p className="text-gray-500 font-medium">We use Google login to ensure authentic feedback.</p>
                </div>
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign in with Google
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full border-2 border-indigo-100" />
                    <div>
                      <p className="text-sm font-black text-gray-900">{user.displayName}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Logged in</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Your Name</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                      <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name..."
                        required
                        className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Your Message</label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you think..."
                      required
                      className="w-full p-6 bg-white border border-gray-200 rounded-[24px] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all h-32 resize-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Submit Feedback
                </button>
              </form>
            )}
          </section>

          {/* Feedback List */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">Recent Feedback</h2>
              <div className="flex items-center gap-2 text-gray-400">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-bold">{feedbacks.length} Reviews</span>
              </div>
            </div>

            <div className="grid gap-6">
              <AnimatePresence mode="popLayout">
                {feedbacks.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 md:p-8 bg-white border border-gray-100 rounded-[24px] md:rounded-[32px] shadow-sm hover:shadow-md transition-all space-y-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900">{item.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {item.createdAt?.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <p className="text-gray-600 font-medium leading-relaxed">
                      {item.message}
                    </p>

                    {item.reply && (
                      <div className="pl-6 border-l-4 border-indigo-100 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                          <Reply className="w-3 h-3" />
                          Admin Response
                        </div>
                        <p className="text-sm text-gray-500 font-medium italic">
                          "{item.reply}"
                        </p>
                      </div>
                    )}

                    {isAdmin && !item.reply && (
                      <div className="pt-4 border-t border-gray-50">
                        {replyingTo === item.id ? (
                          <div className="space-y-4">
                            <textarea 
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply..."
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 h-24 resize-none"
                            />
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleReply(item.id)}
                                disabled={isReplying}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                              >
                                {isReplying ? 'Sending...' : 'Send Reply'}
                              </button>
                              <button 
                                onClick={() => setReplyingTo(null)}
                                className="px-6 py-3 bg-gray-100 text-gray-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setReplyingTo(item.id)}
                            className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                          >
                            <Reply className="w-4 h-4" />
                            Reply to this feedback
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {feedbacks.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium">No feedback yet. Be the first to share!</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
