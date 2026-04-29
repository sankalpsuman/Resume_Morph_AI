import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Shield, User, Zap, Check, Trash2, Loader2, Save, RotateCcw, ArrowRight, MessageCircle, Clock, Ban, RefreshCw, Crown, Users, Star } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, where, orderBy, limit, deleteDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  photo: string;
  morphCount: number;
  usedMorphs?: number;
  remainingMorphs?: number;
  freeMorphsUsed?: number;
  premiumMorphsUsed?: number;
  adminMessage?: string | null;
  revokeReason?: string | null;
  lastResetAt?: any;
  plan?: string;
  planLimit?: number;
  premiumExpiryDate?: any;
  createdAt: any;
}

interface PremiumRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  selectedPlan: string;
  price: number;
  status: string;
  timestamp: any;
}

import { PLANS } from '../constants';

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'admin' | 'users' | 'requests'>('admin');
  const [users, setUsers] = useState<UserData[]>([]);
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, { planId: string; limit: number }>>({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMorphs: 0,
    pendingRequests: 0,
    activePremium: 0
  });

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'users') fetchUsers();
      else fetchRequests();
    }
  }, [isOpen, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(userData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'premium_requests'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const requestData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PremiumRequest[];
      setRequests(requestData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'premium_requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (request: PremiumRequest) => {
    setUpdating(request.id);
    try {
      const plan = PLANS.find(p => p.name === request.selectedPlan) || PLANS[1];
      const expiryDate = plan.id === 'unlimited' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
        : null;

      const targetUser = users.find(u => u.id === request.userId);
      const usedMorphs = targetUser?.usedMorphs || 0;

      // Update user
      const isFreePlan = plan.id === 'free';
      const updateData: any = {
        plan: plan.id,
        planLimit: plan.limit,
        usedMorphs: 0, // Reset usage on new plan activation/repurchase
        remainingMorphs: plan.limit === -1 ? 999999 : plan.limit,
        premiumExpiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null
      };

      if (isFreePlan) {
        updateData['metadata.freeClaimed'] = true;
        updateData['freeClaimed'] = true;
      }

      await updateDoc(doc(db, 'users', request.userId), updateData);

      // Update request status
      await updateDoc(doc(db, 'premium_requests', request.id), {
        status: 'Approved'
      });

      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'Approved' } : r));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `premium_requests/${request.id}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setUpdating(requestId);
    try {
      await updateDoc(doc(db, 'premium_requests', requestId), {
        status: 'Rejected'
      });
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Rejected' } : r));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `premium_requests/${requestId}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleResetFreePlan = async (userId: string) => {
    setUpdating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        'metadata.freeClaimed': false,
        'freeClaimed': false // Just in case
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { 
        ...u, 
        freeClaimed: false,
        metadata: { ...(u as any).metadata, freeClaimed: false }
      } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleResetUsage = async (userId: string) => {
    setUpdating(userId);
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const newLimit = (user.planLimit || PLANS[0].limit) + 2;
      const now = new Date();
      
      await updateDoc(doc(db, 'users', userId), {
        usedMorphs: 0,
        freeMorphsUsed: 0,
        premiumMorphsUsed: 0,
        planLimit: newLimit,
        remainingMorphs: newLimit,
        lastResetAt: serverTimestamp(),
        showResetSurprise: true,
        adminMessage: null
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { 
        ...u, 
        usedMorphs: 0, 
        freeMorphsUsed: 0,
        premiumMorphsUsed: 0,
        planLimit: newLimit,
        remainingMorphs: newLimit,
        lastResetAt: Timestamp.fromDate(now),
        showResetSurprise: true,
        adminMessage: null
      } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleRevokePremium = async (userId: string, reason: string = "Premium access revoked due to policy violation.") => {
    setUpdating(userId);
    try {
      const user = users.find(u => u.id === userId);
      const currentUsed = user?.usedMorphs !== undefined ? user.usedMorphs : (user?.morphCount || 0);

      await updateDoc(doc(db, 'users', userId), {
        plan: 'free',
        planLimit: PLANS[0].limit,
        remainingMorphs: Math.max(0, PLANS[0].limit - currentUsed),
        premiumExpiryDate: null,
        revokeReason: reason,
        showRevokeNotice: true
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { 
        ...u, 
        plan: 'free', 
        planLimit: PLANS[0].limit, 
        remainingMorphs: Math.max(0, PLANS[0].limit - currentUsed), 
        premiumExpiryDate: null,
        revokeReason: reason,
        showRevokeNotice: true
      } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setUpdating(null);
    }
  };

  const handlePlanSelect = (userId: string, planId: string, limit: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentPlanId = user.plan || 'free';
    if (currentPlanId === planId) {
      const newPending = { ...pendingChanges };
      delete newPending[userId];
      setPendingChanges(newPending);
    } else {
      setPendingChanges({
        ...pendingChanges,
        [userId]: { planId, limit }
      });
    }
  };

  const handleSaveChanges = async (userId: string) => {
    const change = pendingChanges[userId];
    if (!change) return;

    setUpdating(userId);
    try {
      const user = users.find(u => u.id === userId);
      const currentUsed = user?.usedMorphs !== undefined ? user.usedMorphs : (user?.morphCount || 0);

      const expiryDate = change.planId === 'unlimited' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
        : null;

      await updateDoc(doc(db, 'users', userId), {
        plan: change.planId,
        planLimit: change.limit,
        remainingMorphs: change.limit === -1 ? 999999 : Math.max(0, change.limit - currentUsed),
        premiumExpiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { 
        ...u, 
        plan: change.planId, 
        planLimit: change.limit,
        remainingMorphs: change.limit === -1 ? 999999 : Math.max(0, change.limit - currentUsed),
        premiumExpiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null
      } : u));
      
      const newPending = { ...pendingChanges };
      delete newPending[userId];
      setPendingChanges(newPending);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    if (users.length > 0 || requests.length > 0) {
      setStats({
        totalUsers: users.length,
        totalMorphs: users.reduce((acc, user) => acc + (user.usedMorphs !== undefined ? user.usedMorphs : (user.morphCount || 0)), 0),
        pendingRequests: requests.filter(r => r.status === 'Pending').length,
        activePremium: users.filter(u => u.plan && u.plan !== 'free').length
      });
    }
  }, [users, requests]);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRequests = requests.filter(r => 
    r.email.toLowerCase().includes(search.toLowerCase()) || 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl bg-[var(--bg-primary)] sm:rounded-[40px] shadow-2xl overflow-hidden border border-[var(--border-color)] flex flex-col max-h-screen sm:max-h-[90vh] my-auto"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border-color)] flex flex-col gap-4 bg-[var(--bg-secondary)]/50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none shrink-0">
                    <Shield className="text-white w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">Admin Dashboard</h2>
                    <p className="hidden sm:block text-[8px] md:text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-widest mt-1">Manage user plans & permissions</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 md:p-3 hover:bg-[var(--bg-primary)] rounded-xl transition-colors shadow-sm text-[var(--text-primary)]"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-[var(--bg-primary)] p-1 rounded-2xl shadow-sm border border-[var(--border-color)] overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('admin')}
                  className={cn(
                    "flex-shrink-0 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'admin' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  Admin
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={cn(
                    "flex-shrink-0 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'users' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={cn(
                    "flex-shrink-0 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all relative",
                    activeTab === 'requests' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  Requests
                  {requests.filter(r => r.status === 'Pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center border-2 border-[var(--bg-primary)]">
                      {requests.filter(r => r.status === 'Pending').length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Search Bar - Only for Users and Requests */}
            {activeTab !== 'admin' && (
              <div className="p-4 md:p-8 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
                <div className="relative max-w-2xl">
                  <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[var(--text-tertiary)]" />
                  <input 
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={activeTab === 'users' ? "Search users..." : "Search requests..."}
                    className="w-full pl-11 md:pl-14 pr-4 md:pr-6 py-3 md:py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
              </div>
            )}

            {/* Content List */}
            <div className="flex-grow overflow-y-auto p-4 md:p-8 bg-[var(--bg-secondary)]/30">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-xs">Loading Data...</p>
                </div>
              ) : activeTab === 'admin' ? (
                <div className="space-y-8">
                  {/* Admin Profile Card */}
                  <div className="bg-[var(--bg-primary)] rounded-2xl md:rounded-[32px] p-6 md:p-8 border border-[var(--border-color)] shadow-sm">
                    <div className="flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-6 text-center md:text-left">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl md:rounded-3xl flex items-center justify-center">
                        <Shield className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)]">Super Admin Profile</h3>
                        <p className="text-sm text-[var(--text-secondary)] font-medium break-all">{auth.currentUser?.email}</p>
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                          <Crown className="w-3 h-3" />
                          {users.find(u => u.email === auth.currentUser?.email)?.plan || 'Free'} Access
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-[var(--bg-primary)] p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-[var(--border-color)] shadow-sm">
                      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                          <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                        </div>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Total Users</span>
                      </div>
                      <div className="text-xl md:text-3xl font-black text-[var(--text-primary)]">{stats.totalUsers}</div>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-[var(--border-color)] shadow-sm">
                      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                          <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                        </div>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Total Morphs</span>
                      </div>
                      <div className="text-xl md:text-3xl font-black text-[var(--text-primary)]">{stats.totalMorphs}</div>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-[var(--border-color)] shadow-sm">
                      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                          <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                        </div>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Pending Requests</span>
                      </div>
                      <div className="text-xl md:text-3xl font-black text-[var(--text-primary)]">{stats.pendingRequests}</div>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-[var(--border-color)] shadow-sm">
                      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-green-50 dark:bg-green-900/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                          <Crown className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                        </div>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Premium Users</span>
                      </div>
                      <div className="text-xl md:text-3xl font-black text-[var(--text-primary)]">{stats.activePremium}</div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'users' ? (
                <div className="grid gap-6">
                  {filteredUsers.map((user) => {
                    const pending = pendingChanges[user.id];
                    const currentPlanId = user.plan || 'free';
                    const activePlanId = pending ? pending.planId : currentPlanId;

                    return (
                      <motion.div 
                        layout
                        key={user.id}
                        className={cn(
                          "p-4 md:p-6 bg-[var(--bg-primary)] rounded-2xl md:rounded-[32px] border transition-all duration-300",
                          pending ? "border-indigo-200 dark:border-indigo-800 shadow-xl shadow-indigo-50/50 dark:shadow-none ring-1 ring-indigo-100 dark:ring-indigo-900/20" : "border-[var(--border-color)] shadow-sm hover:shadow-md"
                        )}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                          {/* User Info */}
                          <div className="flex items-center gap-4 md:gap-5 min-w-0 md:min-w-[280px]">
                            <div className="relative flex-shrink-0">
                              <img 
                                src={user.photo} 
                                alt={user.name} 
                                className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl border-4 border-[var(--bg-secondary)] shadow-sm object-cover"
                              />
                              {pending && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-[var(--bg-primary)] shadow-sm">
                                  <RotateCcw className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-[var(--text-primary)] text-sm md:text-base flex items-center gap-2 truncate">
                                {user.name}
                                {user.email === 'sankalpsmn@gmail.com' && (
                                  <Shield className="w-3 h-3 md:w-4 md:h-4 text-indigo-600 flex-shrink-0" />
                                )}
                              </h4>
                              <p className="text-[10px] md:text-[11px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest truncate">{user.email}</p>
                              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1.5 md:mt-2">
                                <span className="text-[8px] md:text-[10px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg font-black uppercase tracking-widest">
                                  {user.usedMorphs !== undefined ? user.usedMorphs : (user.morphCount || 0)}/{user.planLimit === -1 ? '∞' : (user.planLimit || PLANS[0].limit)}
                                </span>
                                <span className={cn(
                                  "text-[8px] md:text-[10px] px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1",
                                  user.planLimit === -1 ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                                )}>
                                  <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" />
                                  {user.plan || 'Free'}
                                </span>
                                {user.premiumExpiryDate && (
                                  <span className="text-[8px] md:text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                    {user.premiumExpiryDate.toDate().toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              
                              {/* New: Usage Breakdown */}
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                <div className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                                  Free: {user.freeMorphsUsed || 0}
                                </div>
                                <div className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg text-[8px] font-black uppercase tracking-widest text-indigo-400">
                                  Premium: {user.premiumMorphsUsed || 0}
                                </div>
                                {user.lastResetAt && (
                                  <div className="px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg text-[8px] font-black uppercase tracking-widest text-green-600">
                                    Last Reset: {user.lastResetAt.toDate ? user.lastResetAt.toDate().toLocaleDateString() : new Date(user.lastResetAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Plan Selection */}
                          <div className="flex flex-col gap-3 md:gap-4 flex-grow max-w-xl">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-[8px] md:text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-[0.2em]">Assign New Plan</p>
                              <div className="flex items-center gap-3 md:gap-4">
                                <button
                                  onClick={() => handleResetUsage(user.id)}
                                  disabled={updating === user.id}
                                  className="text-[9px] md:text-[10px] text-indigo-600 font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline disabled:opacity-30"
                                  title="Reset Usage & Add 2 Credits"
                                >
                                  <RefreshCw className={cn("w-3 h-3", updating === user.id && "animate-spin")} />
                                  Reset Usage
                                </button>
                                <button
                                  onClick={() => handleResetFreePlan(user.id)}
                                  disabled={updating === user.id}
                                  className="text-[9px] md:text-[10px] text-green-600 font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline disabled:opacity-30"
                                  title="Reset Free Plan Eligibility"
                                >
                                  <RotateCcw className={cn("w-3 h-3", updating === user.id && "animate-spin")} />
                                  Reset Free
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt("Enter revocation reason:", "Premium access revoked due to policy violation.");
                                    if (reason !== null) handleRevokePremium(user.id, reason);
                                  }}
                                  disabled={updating === user.id || user.plan === 'free'}
                                  className="text-[8px] md:text-[10px] text-red-600 font-black uppercase tracking-widest flex items-center gap-1 hover:underline disabled:opacity-30"
                                >
                                  <Ban className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                  Revoke
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {PLANS.map((plan) => {
                                const isSelected = activePlanId === plan.id;
                                return (
                                  <button
                                    key={plan.id}
                                    onClick={() => handlePlanSelect(user.id, plan.id, plan.limit)}
                                    className={cn(
                                      "px-2 md:px-3 py-2 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-0.5 md:gap-1 border-2",
                                      isSelected
                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]"
                                        : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-tertiary)] hover:border-[var(--border-hover)] hover:text-indigo-600"
                                    )}
                                  >
                                    <span>{plan.name}</span>
                                    <span className={cn(
                                      "text-[7px] md:text-[8px] opacity-60",
                                      isSelected ? "text-white" : "text-[var(--text-tertiary)]"
                                    )}>
                                      ₹{plan.price}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center justify-end min-w-0 md:min-w-[140px]">
                            <AnimatePresence mode="wait">
                              {pending ? (
                                <motion.button
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  onClick={() => handleSaveChanges(user.id)}
                                  disabled={updating === user.id}
                                  className="w-full py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                                >
                                  {updating === user.id ? (
                                    <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Save className="w-3 h-3 md:w-4 md:h-4" />
                                      Apply
                                    </>
                                  )}
                                </motion.button>
                              ) : (
                                <div className="text-[9px] md:text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-widest flex items-center gap-2 px-4 py-3 md:py-4 border-2 border-dashed border-[var(--border-color)] rounded-xl md:rounded-2xl w-full justify-center">
                                  <Check className="w-3 h-3 md:w-4 md:h-4" />
                                  Active
                                </div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid gap-6">
                  {filteredRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="p-4 md:p-6 bg-[var(--bg-primary)] rounded-2xl md:rounded-[32px] border border-[var(--border-color)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                          <Zap className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-[var(--text-primary)] text-sm md:text-base truncate">{request.name}</h4>
                          <p className="text-[9px] md:text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest truncate">{request.email}</p>
                          <p className="text-[9px] md:text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5 md:mt-1">
                            {request.selectedPlan} • ₹{request.price}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3">
                        {request.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleApproveRequest(request)}
                              disabled={updating === request.id}
                              className="flex-grow md:flex-grow-0 px-4 md:px-6 py-2.5 md:py-3 bg-green-600 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100 dark:shadow-none flex items-center justify-center gap-2"
                            >
                              {updating === request.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              disabled={updating === request.id}
                              className="flex-grow md:flex-grow-0 px-4 md:px-6 py-2.5 md:py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                              <X className="w-3 h-3" />
                              Reject
                            </button>
                            <a
                              href={`https://wa.me/919540446448?text=${encodeURIComponent(`Hi ${request.name}, regarding your ${request.selectedPlan} request...`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 md:p-3 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] transition-all flex-shrink-0"
                            >
                              <MessageCircle className="w-4 h-4 md:w-5 md:h-5 fill-white" />
                            </a>
                          </>
                        ) : (
                          <span className={cn(
                            "px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest",
                            request.status === 'Approved' ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-red-50 dark:bg-red-900/20 text-red-600"
                          )}>
                            {request.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredRequests.length === 0 && (
                    <div className="text-center py-20 bg-[var(--bg-primary)] rounded-[40px] border border-dashed border-[var(--border-color)]">
                      <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-xs">No requests found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 md:p-8 bg-[var(--bg-primary)] border-t border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
                <div className="flex flex-col">
                  <span className="text-[8px] md:text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-widest">
                    {activeTab === 'users' ? 'Total Users' : 'Total Requests'}
                  </span>
                  <span className="text-lg md:text-xl font-black text-[var(--text-primary)]">
                    {activeTab === 'users' ? users.length : requests.length}
                  </span>
                </div>
                <div className="w-px h-8 bg-[var(--border-color)]" />
                <div className="flex flex-col">
                  <span className="text-[8px] md:text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-widest">Pending</span>
                  <span className={cn(
                    "text-lg md:text-xl font-black",
                    requests.filter(r => r.status === 'Pending').length > 0 ? "text-red-500" : "text-[var(--text-tertiary)]"
                  )}>
                    {requests.filter(r => r.status === 'Pending').length}
                  </span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-full md:w-auto px-6 md:px-10 py-3 md:py-4 bg-gray-900 dark:bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black dark:hover:bg-indigo-700 transition-all shadow-xl shadow-gray-200 dark:shadow-none"
              >
                Exit Admin Panel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
