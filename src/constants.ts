import { Star, Trophy, Sparkles, Zap } from 'lucide-react';

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    limit: 2, // Resume Morphs
    morphs: 2,
    portfolios: 0,
    historyLimit: 1,
    price: 0,
    description: 'Basic access to Morph Engine',
    icon: Zap,
    color: 'from-slate-400 to-slate-500',
    bg: 'bg-slate-50',
    textColor: 'text-slate-600'
  },
  {
    id: 'starter',
    name: 'Starter',
    limit: 7,
    morphs: 7,
    portfolios: 2,
    historyLimit: 3,
    price: 299,
    description: 'Perfect for freshers',
    icon: Star,
    color: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
    textColor: 'text-blue-600',
    popular: false
  },
  {
    id: 'pro',
    name: 'Professional',
    limit: 12,
    morphs: 12,
    portfolios: 5,
    historyLimit: 7,
    price: 999,
    description: 'Best for professionals',
    icon: Trophy,
    color: 'from-indigo-500 to-purple-500',
    bg: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    popular: true
  },
  {
    id: 'unlimited',
    name: 'Master Combo',
    limit: -1,
    morphs: -1,
    portfolios: 10,
    historyLimit: 15,
    price: 1499,
    description: 'Morph Engine + Portfolio Gen',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50',
    textColor: 'text-purple-600',
    popular: false
  }
];

export const ADMIN_WHATSAPP = "919540446448";
