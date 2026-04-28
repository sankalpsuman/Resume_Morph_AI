import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Linkedin, Github, Instagram, Mail, 
  Sparkles, Rocket, Globe, Zap, Heart,
  ArrowRight, CheckCircle2, MessageCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function CreatorWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<'welcome' | 'congrats'>('welcome');
  const [displayText, setDisplayText] = useState('');
  
  const welcomeMessage = "Hi, I'm Sankalp Suman, creator of this platform.";
  const congratsMessage = "Boom! That's your first professional Morph. Welcome to the elite tier.";
  const [congratsData, setCongratsData] = useState<{ title: string; content: string; points: string[] } | null>(null);
  
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('morph_creator_welcome_seen');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setModalType('welcome');
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleOpenAbout = () => {
      setModalType('welcome');
      setCongratsData(null);
      setIsOpen(true);
    };

    const handleMorphSuccess = (e?: any) => {
      const featureId = e?.detail?.feature || 'morph';
      const storageKey = `morph_congrats_seen_${featureId}`;
      const hasSeenCongrats = localStorage.getItem(storageKey);
      
      if (!hasSeenCongrats) {
        const featureConfig: Record<string, any> = {
          morph: {
            title: "Morph Engine Success",
            content: "You've just cloned your first elite layout. Your visual identity is now structurally superior.",
            points: ["AI Precision", "Visual Cloning", "Structural Mastery"]
          },
          portfolio: {
            title: "Portfolio Success",
            content: "Your digital storefront is live. You're no longer just applying; you're attracting.",
            points: ["Responsive Design", "SEO Ready", "Modern Stack"]
          },
          coverletter: {
            title: "Cover Letter Mastery",
            content: "That's a high-impact narrative. You've just replaced generic intro text with a calculated pitch.",
            points: ["Psychological Triggers", "ATS Proof", "Tailored Strategy"]
          },
          coach: {
            title: "AI Analysis Complete",
            content: "Your career roadmap is optimized. Data-driven strategy always beats guessing.",
            points: ["Skill Mapping", "Gap Analysis", "Market Fit"]
          },
          tracker: {
            title: "System Online",
            content: "Your first application is tracked. The difference between a job hunter and a career engineer is the system they use.",
            points: ["Application Funnel", "Interview Prep", "Status Mastery"]
          }
        };

        const config = featureConfig[featureId] || featureConfig.morph;
        setCongratsData(config);
        setModalType('congrats');
        setIsOpen(true);
        localStorage.setItem(storageKey, 'true');
      }
    };

    window.addEventListener('open-creator-about', handleOpenAbout);
    window.addEventListener('morph-success', handleMorphSuccess);
    window.addEventListener('feature-success', handleMorphSuccess);
    return () => {
      window.removeEventListener('open-creator-about', handleOpenAbout);
      window.removeEventListener('morph-success', handleMorphSuccess);
      window.removeEventListener('feature-success', handleMorphSuccess);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      let index = 0;
      const message = modalType === 'welcome' ? welcomeMessage : (congratsData?.content || congratsMessage);
      setDisplayText('');
      
      const timer = setInterval(() => {
        setDisplayText(message.slice(0, index));
        index++;
        if (index > message.length) clearInterval(timer);
      }, 30);
      
      return () => clearInterval(timer);
    }
  }, [isOpen, modalType, congratsData]);

  const handleClose = () => {
    setIsOpen(false);
    if (modalType === 'welcome') {
      localStorage.setItem('morph_creator_welcome_seen', 'true');
    }
  };

  const welcomeSteps = [
    {
      title: "The Vision",
      icon: <Rocket className="w-6 h-6 text-indigo-500" />,
      content: "Traditional resumes are dead. I built the Morph Engine to turn your static narrative into a high-performance career asset.",
      points: ["Solve real problems", "Save users time", "Modern engineering", "Elite UX"]
    }
  ];

  const congratsSteps = [
    {
      title: congratsData?.title || "Trust First",
      icon: <Heart className="w-6 h-6 text-pink-500" />,
      content: congratsData?.content || "Thank you for trusting the Morph AI Engine. You've just taken the first step toward total professional dominance.",
      points: congratsData?.points || ["AI Precision", "Visual Cloning", "Structural Mastery"]
    }
  ];

  const steps = modalType === 'welcome' ? welcomeSteps : congratsSteps;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-4xl bg-[var(--bg-primary)] sm:rounded-[32px] md:rounded-[48px] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] border border-[var(--border-color)] overflow-hidden flex flex-col md:flex-row max-h-screen sm:max-h-[90vh] my-auto"
          >
            {/* Left Sidebar (Desktop Only Branding) */}
            <div className="hidden md:flex w-72 bg-indigo-600 dark:bg-indigo-950 p-6 md:p-10 flex-col items-center text-center text-white relative shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              
              <div className="relative mb-6">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/20 p-1 overflow-hidden">
                  <img 
                    src="https://media.licdn.com/dms/image/v2/D5603AQF4O0y_H_L1_w/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718227652758?e=1751328000&v=beta&t=7l3uAn6v3S7X-T-Z_jX_k7P1_-n5S_9G7l_8X-C_i6U" 
                    alt="Sankalp Suman" 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-indigo-600">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white fill-white" />
                </div>
              </div>
              
              <h3 className="text-lg md:text-xl font-black tracking-tight leading-none mb-1 md:mb-2">Sankalp Suman</h3>
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/70 mb-6 md:mb-8">Architect & Creator</p>
              
              <div className="grid grid-cols-2 gap-2 md:gap-3 w-full">
                <a href="https://www.linkedin.com/in/sankalpsuman/" target="_blank" rel="noopener noreferrer" className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-xl md:rounded-2xl transition-colors flex items-center justify-center group">
                  <Linkedin className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a href="https://github.com/sankalpsmn" target="_blank" rel="noopener noreferrer" className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-xl md:rounded-2xl transition-colors flex items-center justify-center group">
                  <Github className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a href="https://instagram.com/sankalpsmn" target="_blank" rel="noopener noreferrer" className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-xl md:rounded-2xl transition-colors flex items-center justify-center group">
                  <Instagram className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a href="mailto:sankalpsmn@gmail.com" className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-xl md:rounded-2xl transition-colors flex items-center justify-center group">
                  <Mail className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                </a>
              </div>
              
              <div className="mt-auto pt-6 md:pt-8 flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-indigo-300">
                <Globe className="w-2.5 h-2.5 md:w-3 md:h-3" />
                Sankalp Suman
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-5 sm:p-8 md:p-14 flex flex-col overflow-y-auto custom-scrollbar">
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 space-y-8">
                <div>
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-4">
                    {modalType === 'welcome' ? <MessageCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    {modalType === 'welcome' ? 'Creator Greeting' : 'Morph Achieved'}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter leading-none mb-6">
                    {modalType === 'welcome' ? '👋 Greetings.' : '🎉 Congratulations!'}
                  </h2>
                  <div className="min-h-[80px] md:min-h-[100px]">
                    <p className="text-lg md:text-2xl font-bold text-[var(--text-secondary)] leading-relaxed">
                      {displayText}<span className="inline-block w-1.5 h-6 bg-indigo-600 ml-1 animate-pulse" />
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {steps.map((step, idx) => (
                    <div key={idx} className="p-6 md:p-8 bg-[var(--bg-secondary)] rounded-[24px] md:rounded-[32px] space-y-4 border border-[var(--border-color)]">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--border-color)]">
                          {step.icon}
                        </div>
                        <h4 className="text-xs md:text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">{step.title}</h4>
                      </div>
                      <p className="text-sm md:text-base font-medium text-[var(--text-secondary)] leading-relaxed">
                        {step.content}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {step.points.map((point, pIdx) => (
                          <div key={pIdx} className="px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full text-[9px] md:text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {point}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-8 mt-auto flex flex-col sm:flex-row items-center gap-4">
                  <button 
                    onClick={handleClose}
                    className="w-full sm:flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 group"
                  >
                    {modalType === 'welcome' ? 'Let\'s Begin' : 'Master Next Design'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a 
                    href="https://www.linkedin.com/in/sankalpsuman/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-8 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-center"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
