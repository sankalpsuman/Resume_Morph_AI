import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Info, 
  MessageSquare, 
  Send, 
  HelpCircle, 
  ExternalLink, 
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  FileText,
  Star,
  Shield,
  LifeBuoy
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ResourcesProps {
  onTabChange: (tab: any) => void;
}

export default function Resources({ onTabChange }: ResourcesProps) {
  const resourceCards = [
    {
      id: 'guide',
      title: 'User Guide',
      description: 'Master the Morph Engine with our comprehensive documentation and tutorials.',
      icon: BookOpen,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      details: ['Morph Engine Basics', 'Pro Layout Tips', 'ATS Secrets']
    },
    {
      id: 'about',
      title: 'About Morph',
      description: 'Learn about our mission, the technology behind the engine, and the founder-story.',
      icon: Info,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      details: ['AI Technology', 'Data Integrity', 'Mission Vision']
    },
    {
      id: 'feedback',
      title: 'Community Feedback',
      description: 'See what others are saying or share your own experience to help us improve.',
      icon: MessageSquare,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      details: ['Public Reviews', 'Feature Requests', 'Admin Replies']
    },
    {
      id: 'contact',
      title: 'Contact Support',
      description: 'Need help? Our dedicated support team is here to assist you with any questions.',
      icon: Send,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      details: ['WhatsApp Support', 'Email Support', 'Plan Activation']
    }
  ];

  const quickLinks = [
    { title: 'Privacy Policy', id: 'privacy', icon: Shield },
    { title: 'FAQs', id: 'faq', icon: HelpCircle },
    { title: 'App Status', id: 'status', icon: Zap },
    { title: 'LinkedIn Community', id: 'community', icon: Globe },
  ];

  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-indigo-100 py-12 md:py-20 rounded-[32px] md:rounded-[40px] shadow-sm border border-[var(--border-color)] transition-colors duration-300 overflow-hidden relative">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] right-[-10%] w-[500px] h-[500px] bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] left-[-5%] w-[400px] h-[400px] bg-purple-50/50 dark:bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="mb-20 md:mb-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-800 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-8"
          >
            <LifeBuoy className="w-4 h-4" />
            Strategic Knowledge Hub
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-7xl lg:text-8xl font-black text-[var(--text-primary)] tracking-tighter mb-8 leading-[1.1] md:leading-[0.85]"
          >
            Everything you need <br className="hidden lg:block" />
            to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600">Succeed.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto font-medium leading-relaxed px-4"
          >
            Explore deep tutorials, master the Morph Engine technology, and join our growing community of professionals scaling their careers.
          </motion.p>
        </div>

        {/* Main Resources Grid - Enhanced Visuals */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 mb-32">
          {resourceCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onTabChange(card.id)}
              className="group cursor-pointer p-10 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[56px] shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 dark:hover:shadow-none dark:hover:border-indigo-500/50 transition-all relative overflow-hidden flex flex-col h-full"
            >
              <div className={cn(
                "absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150",
                card.color
              )} />
              
              <div className={cn(
                "w-16 h-16 rounded-[28px] flex items-center justify-center mb-10 shadow-lg group-hover:scale-110 transition-transform duration-500 shrink-0",
                card.lightColor,
                "dark:bg-opacity-10"
              )}>
                <card.icon className={cn("w-8 h-8", card.textColor)} />
              </div>
              
              <div className="flex-grow flex flex-col">
                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4 tracking-tight flex items-center justify-between">
                  {card.title}
                  <ArrowRight className="w-5 h-5 text-indigo-400 opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </h3>
                <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-10 text-sm md:text-base">
                  {card.description}
                </p>
                
                <div className="mt-auto flex flex-wrap gap-2">
                  {card.details.map(detail => (
                    <span key={detail} className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest whitespace-nowrap">
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Secondary Resources / Strategic Links */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 mb-32">
          <div className="lg:col-span-2 space-y-8 flex flex-col justify-center">
            <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight leading-tight">Advanced <br />Support Stack.</h2>
            <p className="text-lg text-[var(--text-secondary)] font-medium leading-relaxed">Access legal frameworks, interactive FAQs, and real-time system status indicators instantly.</p>
            <div className="grid grid-cols-2 gap-4">
              {quickLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => ['privacy', 'guide', 'feedback', 'contact'].includes(link.id) ? onTabChange(link.id) : null}
                  className="flex flex-col items-center text-center gap-4 p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[40px] hover:bg-[var(--bg-primary)] hover:shadow-2xl hover:shadow-indigo-100 transition-all group"
                >
                  <div className="w-12 h-12 bg-[var(--bg-primary)] rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <link.icon className="w-6 h-6 text-[var(--text-tertiary)] group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <span className="text-[10px] font-black text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] uppercase tracking-widest leading-none">{link.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 p-12 md:p-20 bg-gray-950 rounded-[64px] relative overflow-hidden group flex flex-col justify-center border border-white/5 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[140px] opacity-20 -mr-40 -mt-40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600 rounded-full blur-[140px] opacity-10 -ml-40 -mb-40 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
              <div className="flex-grow space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Career Evolution
                </div>
                <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1]">Join the Beta <br className="hidden md:block" />Community.</h3>
                <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-md mx-auto md:mx-0">Get exclusive industry news, success stories, and AI optimization tips directly from our community.</p>
                <a 
                  href="https://in.linkedin.com/in/sankalpsuman" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 px-8 py-5 bg-white text-gray-950 rounded-[28px] text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-900/40"
                >
                  Follow on LinkedIn
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
              <div className="shrink-0 w-56 h-56 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[56px] flex items-center justify-center rotate-6 group-hover:rotate-0 transition-transform duration-1000 relative">
                <div className="absolute inset-0 bg-indigo-600/20 blur-2xl rounded-full scale-50 group-hover:scale-100 transition-transform duration-1000" />
                <Globe className="w-24 h-24 text-indigo-400 opacity-50 relative z-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Expert Review Banner */}
        <div className="p-10 md:p-16 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[64px] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-10 hover:shadow-2xl hover:shadow-indigo-100/50 dark:hover:shadow-none dark:hover:border-indigo-500/50 transition-all border-b-4 border-b-indigo-600">
          <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[32px] flex items-center justify-center shadow-sm shrink-0">
              <Star className="w-10 h-10 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <h4 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mb-2 leading-tight">Need a professional review?</h4>
              <p className="text-[var(--text-secondary)] text-lg font-medium leading-relaxed max-w-xl">Join our community channel and get your resume grade assessed by executive hiring experts.</p>
            </div>
          </div>
          <button 
            onClick={() => onTabChange('feedback')}
            className="px-12 py-6 bg-indigo-600 text-white rounded-[32px] text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-2xl shadow-indigo-100 whitespace-nowrap active:scale-95"
          >
            Initiate Review
          </button>
        </div>
      </div>
    </div>
  );
}
