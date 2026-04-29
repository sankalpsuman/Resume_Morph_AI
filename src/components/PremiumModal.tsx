import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Check, MessageCircle, Star, Trophy, Sparkles } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

import { PLANS, ADMIN_WHATSAPP } from '../constants';

export default function PremiumModal({ isOpen, onClose, user }: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const freeClaimed = user?.metadata?.freeClaimed || false;
  const currentPlanId = user?.plan || 'free';

  const handleRequest = async () => {
    if (!selectedPlan || !user) return;
    
    if (selectedPlan === 'free' && freeClaimed) {
      alert("Free plan has already been claimed once.");
      return;
    }
    
    setIsSubmitting(true);
    const plan = PLANS.find(p => p.id === selectedPlan);
    
    try {
      await addDoc(collection(db, 'premium_requests'), {
        userId: user.uid,
        name: user.displayName || 'Anonymous',
        email: user.email,
        selectedPlan: plan?.name,
        price: plan?.price,
        status: 'Pending',
        timestamp: serverTimestamp()
      });
      
      setRequestSubmitted(true);
    } catch (error) {
      console.error("Error creating premium request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    if (!user) {
      // If no user, we might want to alert or just return.
      // Given the context, the user should be logged in to request premium usually,
      // but if the modal is open, we should at least not crash.
      return;
    }
    const plan = PLANS.find(p => p.id === selectedPlan);
    const message = `Hi Admin, I'm interested in the ${plan?.name} (₹${plan?.price}).\nName: ${user.displayName || 'Guest'}\nEmail: ${user.email || 'N/A'}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodedMessage}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-[var(--bg-primary)] sm:rounded-[40px] shadow-2xl overflow-hidden border border-[var(--border-color)] flex flex-col max-h-screen sm:max-h-[90vh] my-auto"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-[var(--border-color)] flex items-center justify-between bg-gradient-to-br from-indigo-50/50 dark:from-indigo-900/10 to-[var(--bg-primary)] sticky top-0 z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none shrink-0">
                  <Zap className="text-white w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">Upgrade to Premium</h2>
                  <p className="text-[8px] sm:text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest leading-none mt-1">Unlock the full power of AI</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 sm:p-3 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors shadow-sm"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-tertiary)]" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 sm:p-8">
              {!requestSubmitted ? (
                <div className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PLANS.map((plan) => {
                      const idDisabled = plan.id === 'free' && freeClaimed;
                      const isCurrent = currentPlanId === plan.id;
                      
                      return (
                        <button
                          key={plan.id}
                          onClick={() => !idDisabled && setSelectedPlan(plan.id)}
                          className={cn(
                            "relative p-6 rounded-[32px] border-2 transition-all duration-300 text-left flex flex-col h-full",
                            selectedPlan === plan.id 
                              ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/20 shadow-xl shadow-indigo-100/50 dark:shadow-none" 
                              : idDisabled
                                ? "border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40"
                                : "border-[var(--border-color)] hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-[var(--bg-secondary)]/50",
                            isCurrent && "ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-950"
                          )}
                        >
                          {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                              Most Popular
                            </div>
                          )}
                          <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg", plan.color)}>
                            <plan.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-black text-[var(--text-primary)]">{plan.name}</h3>
                            {isCurrent && <span className="text-[8px] font-black uppercase text-indigo-600">Current</span>}
                            {idDisabled && <span className="text-[8px] font-black uppercase text-slate-400">Used Once</span>}
                          </div>
                          <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest mb-4">{plan.description}</p>
                          <div className="mt-auto">
                            <p className="text-2xl font-black text-[var(--text-primary)]">
                              {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                            </p>
                            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">
                              {plan.morphs === -1 ? 'Unlimited' : `${plan.morphs} Morphs`}
                              {plan.portfolios > 0 && ` + ${plan.portfolios} Portfolios`}
                            </p>
                          </div>
                          {selectedPlan === plan.id && !idDisabled && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-6 bg-[var(--bg-secondary)] rounded-[32px] border border-[var(--border-color)]">
                    <h4 className="text-sm font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      What's included:
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        'Premium AI Templates',
                        'High-Priority Processing',
                        'No Watermarks',
                        'Unlimited History',
                        'Expert Support',
                        'Future Feature Access'
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    disabled={!selectedPlan || isSubmitting}
                    onClick={handleRequest}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-white" />
                        {selectedPlan === currentPlanId ? "Renew Access" : "Request Access"}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 space-y-8">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-green-50 dark:shadow-none">
                    <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mb-2">Request Submitted!</h3>
                    <p className="text-[var(--text-tertiary)] font-medium max-w-xs mx-auto">
                      Your request is pending. Please contact us on WhatsApp to complete your payment and activate your plan.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <button
                      onClick={handleWhatsApp}
                      className="w-full py-5 bg-[#25D366] text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-green-100 dark:shadow-none hover:bg-[#128C7E] transition-all flex items-center justify-center gap-3"
                    >
                      <MessageCircle className="w-6 h-6 fill-white" />
                      Contact on WhatsApp
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full py-4 text-[var(--text-tertiary)] font-bold text-xs uppercase tracking-widest hover:text-[var(--text-secondary)] transition-colors"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
