import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, Plus, Search, Filter, Calendar, MapPin, 
  ChevronRight, Trash2, Clock, CheckCircle2, XCircle, 
  MessageSquare, MoreHorizontal, Loader2, Sparkles, Target
} from 'lucide-react';
import { db, auth } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore';

type Status = 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Wishlist';

interface JobApplication {
  id: string;
  company: string;
  role: string;
  location: string;
  status: Status;
  date: any;
  salary?: string;
  notes?: string;
  link?: string;
}

const STATUS_COLORS: Record<Status, { bg: string, text: string, dot: string }> = {
  'Applied': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  'Interview': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  'Offer': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' },
  'Rejected': { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  'Wishlist': { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-500' }
};

export default function ApplyTracker() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<Status | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [newApp, setNewApp] = useState({
    company: '',
    role: '',
    location: '',
    status: 'Applied' as Status,
    salary: '',
    notes: '',
    link: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'applications'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JobApplication[];
      setApps(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newApp.company || !newApp.role) return;

    try {
      await addDoc(collection(db, 'applications'), {
        ...newApp,
        uid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        date: new Date().toISOString()
      });
      setShowAddModal(false);
      setNewApp({
        company: '',
        role: '',
        location: '',
        status: 'Applied',
        salary: '',
        notes: '',
        link: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'applications');
    }
  };

  const updateStatus = async (id: string, status: Status) => {
    try {
      await updateDoc(doc(db, 'applications', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${id}`);
    }
  };

  const deleteApp = async (id: string) => {
    if (!confirm('Are you sure you want to remove this application?')) return;
    try {
      await deleteDoc(doc(db, 'applications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `applications/${id}`);
    }
  };

  const filteredApps = apps.filter(app => {
    const matchesFilter = filter === 'All' || app.status === filter;
    const matchesSearch = app.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         app.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: apps.length,
    interviews: apps.filter(a => a.status === 'Interview').length,
    offers: apps.filter(a => a.status === 'Offer').length,
    active: apps.filter(a => ['Applied', 'Interview'].includes(a.status)).length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-indigo-500/20 dark:shadow-none">
            <Briefcase className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Apply Tracker</h1>
          <p className="text-[var(--text-secondary)] font-medium max-w-md leading-relaxed">
            Organize your job search. Track applications, interviews, and offers in one professional dashboard.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 p-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[32px] shadow-sm">
          {[
            { label: 'Total', count: stats.total, color: 'text-[var(--text-primary)]' },
            { label: 'Active', count: stats.active, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Interviews', count: stats.interviews, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Offers', count: stats.offers, color: 'text-green-600 dark:text-green-400' }
          ].map((stat, i) => (
            <div key={i} className="px-6 py-4 rounded-3xl hover:bg-[var(--bg-secondary)] transition-all text-center">
              <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={cn("text-2xl font-black tabular-nums", stat.color)}>{stat.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[24px] text-sm font-bold text-[var(--text-primary)] shadow-sm focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-[var(--text-tertiary)]"
          />
        </div>

        <div className="flex flex-wrap p-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[24px] shadow-sm">
          {['All', 'Applied', 'Interview', 'Offer', 'Rejected', 'Wishlist'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={cn(
                "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                filter === s ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-[var(--text-tertiary)] hover:text-indigo-600 hover:bg-[var(--bg-secondary)]"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          title="Add a new job application to your tracker"
          className="px-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Plus className="w-5 h-5" />
          Add Job
        </button>
      </div>

      {/* List */}
      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center gap-4 text-[var(--text-tertiary)]">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest">Loading Dashboard...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-40 text-center space-y-6 bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] rounded-[48px]">
              <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-[32px] flex items-center justify-center mx-auto">
                <Target className="text-[var(--text-tertiary)] w-10 h-10" />
              </div>
              <p className="text-sm font-black text-[var(--text-tertiary)] uppercase tracking-widest">No matching applications found</p>
            </div>
          ) : (
            filteredApps.map((app) => (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[36px] p-6 hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-none transition-all duration-500 flex flex-col md:flex-row items-center gap-8"
              >
                <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-3xl flex items-center justify-center shrink-0 text-[var(--text-tertiary)] group-hover:bg-indigo-600 group-hover:shadow-lg group-hover:shadow-indigo-500/20 group-hover:text-white transition-all duration-300">
                  <Briefcase className="w-8 h-8" />
                </div>
                
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{app.role}</h3>
                    <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5", STATUS_COLORS[app.status].bg, STATUS_COLORS[app.status].text)}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_COLORS[app.status].dot)} />
                      {app.status}
                    </div>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-bold text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                      {app.company}
                    </span>
                    {app.location && (
                      <span className="flex items-center gap-1.5 italic">
                        <MapPin className="w-3.5 h-3.5" />
                        {app.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Applied {new Date(app.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select 
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value as Status)}
                    className="px-4 py-3 bg-[var(--bg-secondary)] border-none rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                  >
                    {['Applied', 'Interview', 'Offer', 'Rejected', 'Wishlist'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => deleteApp(app.id)}
                    className="p-3 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-[var(--bg-primary)] rounded-[48px] shadow-2xl overflow-hidden p-10 space-y-10 border border-[var(--border-color)]"
            >
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Add New Job</h2>
                <p className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-widest">Keep your search focused</p>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Company</label>
                    <input 
                      required
                      type="text" 
                      value={newApp.company}
                      onChange={(e) => setNewApp({...newApp, company: e.target.value})}
                      className="w-full p-4 bg-[var(--bg-secondary)] rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-[var(--bg-primary)] transition-all border border-transparent focus:border-indigo-100 dark:focus:border-indigo-800 text-[var(--text-primary)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Role</label>
                    <input 
                      required
                      type="text" 
                      value={newApp.role}
                      onChange={(e) => setNewApp({...newApp, role: e.target.value})}
                      className="w-full p-4 bg-[var(--bg-secondary)] rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-[var(--bg-primary)] transition-all border border-transparent focus:border-indigo-100 dark:focus:border-indigo-800 text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Location</label>
                    <input 
                      type="text" 
                      value={newApp.location}
                      onChange={(e) => setNewApp({...newApp, location: e.target.value})}
                      className="w-full p-4 bg-[var(--bg-secondary)] rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-[var(--bg-primary)] transition-all border border-transparent focus:border-indigo-100 dark:focus:border-indigo-800 text-[var(--text-primary)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Status</label>
                    <select 
                      value={newApp.status}
                      onChange={(e) => setNewApp({...newApp, status: e.target.value as Status})}
                      className="w-full p-4 bg-[var(--bg-secondary)] rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-[var(--bg-primary)] transition-all border border-transparent focus:border-indigo-100 dark:focus:border-indigo-800 text-[var(--text-primary)]"
                    >
                      {['Applied', 'Interview', 'Offer', 'Rejected', 'Wishlist'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ) as any)}
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  title="Store this application in your personal job board"
                  className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 dark:shadow-none hover:bg-indigo-700 transition-all"
                >
                  Save Application
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
