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

const PLANS = [
  {
    id: 'premium',
    name: 'Premium Pack',
    morphs: 4,
    price: 39,
    description: 'Perfect for quick updates',
    icon: Star,
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'gold',
    name: 'Gold Pack',
    morphs: 10,
    price: 79,
    description: 'Best for job seekers',
    icon: Trophy,
    color: 'from-indigo-500 to-purple-500',
    popular: true
  },
  {
    id: 'unlimited',
    name: 'Unlimited Access',
    morphs: -1,
    price: 499,
    description: '30 days of total freedom',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500'
  }
];

const ADMIN_WHATSAPP = "919540446448"; // Updated admin contact number

export default function PremiumModal({ isOpen, onClose, user }: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const handleRequest = async () => {
    if (!selectedPlan || !user) return;
    
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
    const plan = PLANS.find(p => p.id === selectedPlan);
    const message = `Hi Admin, I'm interested in the ${plan?.name} (₹${plan?.price}).\nName: ${user.displayName}\nEmail: ${user.email}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodedMessage}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gradient-to-br from-indigo-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <Zap className="text-white w-6 h-6 fill-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Upgrade to Premium</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Unlock the full power of AI</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white rounded-xl transition-colors shadow-sm"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-8">
              {!requestSubmitted ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLANS.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={cn(
                          "relative p-6 rounded-[32px] border-2 transition-all duration-300 text-left flex flex-col h-full",
                          selectedPlan === plan.id 
                            ? "border-indigo-600 bg-indigo-50/30 shadow-xl shadow-indigo-100/50" 
                            : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50/50"
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
                        <h3 className="font-black text-gray-900 mb-1">{plan.name}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">{plan.description}</p>
                        <div className="mt-auto">
                          <p className="text-2xl font-black text-gray-900">₹{plan.price}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {plan.morphs === -1 ? 'Unlimited Morphs' : `${plan.morphs} Morphs`}
                          </p>
                        </div>
                        {selectedPlan === plan.id && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                    <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
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
                        <li key={feature} className="flex items-center gap-2 text-xs font-bold text-gray-500">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    disabled={!selectedPlan || isSubmitting}
                    onClick={handleRequest}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-white" />
                        Request Access
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 space-y-8">
                  <div className="w-20 h-20 bg-green-100 rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-green-50">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Request Submitted!</h3>
                    <p className="text-gray-500 font-medium max-w-xs mx-auto">
                      Your request is pending. Please contact us on WhatsApp to complete your payment and activate your plan.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <button
                      onClick={handleWhatsApp}
                      className="w-full py-5 bg-[#25D366] text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-[#128C7E] transition-all flex items-center justify-center gap-3"
                    >
                      <MessageCircle className="w-6 h-6 fill-white" />
                      Contact on WhatsApp
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full py-4 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-gray-600 transition-colors"
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
