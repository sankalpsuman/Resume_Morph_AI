import React, { useState, useEffect } from 'react';
import { Image as CustomImage } from './Image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Linkedin, Github, Instagram, Mail, 
  Sparkles, Rocket, Globe, Zap, Heart,
  ArrowRight, CheckCircle2, MessageCircle,
  ExternalLink, Command, ShieldCheck, Target
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CreatorWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'welcome' | 'congrats';
}

export default function CreatorWelcomeModal({ isOpen, onClose, type = 'welcome' }: CreatorWelcomeModalProps) {
  const [modalType, setModalType] = useState<'welcome' | 'congrats'>(type);
  const [displayText, setDisplayText] = useState('');
  
  const welcomeMessage = "Hi, I'm Sankalp Suman, architect and creator of Resume Morph. My goal is to mathematically bridge the gap between your talent and elite visual standards.";
  const congratsMessage = "Strategic Victory! You've just executed your first professional Morph. Welcome to the elite tier of job seeking.";
  const [congratsData, setCongratsData] = useState<{ title: string; content: string; points: string[] } | null>(null);

  useEffect(() => {
    if (type) setModalType(type);
  }, [type]);
  
  useEffect(() => {
    const handleOpenAbout = () => {
      setModalType('welcome');
      setCongratsData(null);
    };

    const handleMorphSuccess = (e?: any) => {
      const featureId = e?.detail?.feature || 'morph';
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
          title: "Narrative Victory",
          content: "That's a high-impact story. You've just replaced generic text with a calculated strategic pitch.",
          points: ["Psychological Triggers", "ATS Proof", "Tailored Flow"]
        }
      };

      const config = featureConfig[featureId] || featureConfig.morph;
      setCongratsData(config);
      setModalType('congrats');
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
      }, 25);
      
      return () => clearInterval(timer);
    }
  }, [isOpen, modalType, congratsData]);

  const welcomeSteps = [
    {
      title: "The Architecture",
      icon: <Rocket className="w-5 h-5 text-indigo-500" />,
      content: "Traditional resumes are static data. Resume Morph is a living career asset designed for the modern algorithmic talent market.",
      points: ["Neural Layout Mapping", "ATS Pattern Safety", "Elite Typography"]
    }
  ];

  const congratsSteps = [
    {
      title: congratsData?.title || "System Online",
      icon: <Target className="w-5 h-5 text-pink-500" />,
      content: congratsData?.content || "Thank you for trusting the Morph AI Engine. You've just taken the first step toward total professional dominance.",
      points: congratsData?.points || ["AI Precision", "Visual Cloning", "Structural Mastery"]
    }
  ];

  const steps = modalType === 'welcome' ? welcomeSteps : congratsSteps;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="relative w-full max-w-5xl bg-[var(--bg-primary)] sm:rounded-[40px] md:rounded-[56px] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden flex flex-col md:flex-row max-h-screen sm:max-h-[85vh] my-auto"
          >
            {/* Left Sidebar - Creator Persona */}
            <div className="hidden md:flex w-80 bg-indigo-600 dark:bg-indigo-950/80 p-12 flex-col items-center text-center text-white relative shrink-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full -ml-20 -mb-20 blur-3xl opacity-50" />
              
              <div className="relative mb-8 group">
                <div className="w-28 h-28 rounded-[36px] border-4 border-white/20 p-1 overflow-hidden rotate-3 group-hover:rotate-0 transition-all duration-500 shadow-2xl">
                  <CustomImage 
                    src="https://media.licdn.com/dms/image/v2/D5603AQF4O0y_H_L1_w/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718227652758?e=1751328000&v=beta&t=7l3uAn6v3S7X-T-Z_jX_k7P1_-n5S_9G7l_8X-C_i6U" 
                    alt="Sankalp Suman" 
                    className="w-full h-full rounded-[30px] object-cover scale-110"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center border-4 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight leading-none">Sankalp Suman</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300/80">Architect & Founder</p>
              </div>

              <div className="w-full mt-12 grid grid-cols-2 gap-3">
                {[
                  { icon: Linkedin, href: "https://www.linkedin.com/in/sankalpsuman/", color: "hover:bg-[#0077b5]" },
                  { icon: Github, href: "https://github.com/sankalpsmn", color: "hover:bg-black" },
                  { icon: Instagram, href: "https://instagram.com/sankalpsmn", color: "hover:bg-[#E1306C]" },
                  { icon: Mail, href: "mailto:sankalpsmn@gmail.com", color: "hover:bg-emerald-600" }
                ].map((social, i) => (
                  <a 
                    key={i} 
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={cn("p-4 bg-white/5 rounded-2xl transition-all flex items-center justify-center group", social.color)}
                  >
                    <social.icon className="w-5 h-5 group-hover:scale-110 transition-transform text-indigo-100" />
                  </a>
                ))}
              </div>
              
              <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-indigo-300">
                <Globe className="w-3 h-3" />
                Sankalp Suman
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col overflow-y-auto custom-scrollbar relative">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-2xl transition-all z-20 group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>

              <div className="flex-1 space-y-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                    {modalType === 'welcome' ? <MessageCircle className="w-4 h-4 text-indigo-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                      {modalType === 'welcome' ? 'System Intelligence: Greeting' : 'Milestone Log: Success'}
                    </span>
                  </div>
                  
                  <h2 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] tracking-tighter leading-[0.9] max-w-md">
                    {modalType === 'welcome' ? 'Bridging the Gap.' : 'Mission Accomplished.'}
                  </h2>
                  
                  <div className="min-h-[120px] max-w-xl">
                    <p className="text-xl md:text-2xl font-bold text-[var(--text-secondary)] leading-tight tracking-tight">
                      {displayText}<span className="inline-block w-2 h-8 bg-indigo-600 ml-1 animate-pulse rounded-full" />
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {steps.map((step, idx) => (
                    <div key={idx} className="p-8 md:p-10 bg-[var(--bg-secondary)]/50 backdrop-blur-sm rounded-[32px] md:rounded-[40px] border border-white/5 space-y-6 group hover:border-indigo-500/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--bg-primary)] rounded-2xl shadow-xl border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {step.icon}
                        </div>
                        <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">{step.title}</h4>
                      </div>
                      <p className="text-base md:text-lg font-medium text-[var(--text-secondary)] leading-relaxed">
                        {step.content}
                      </p>
                      <div className="flex flex-wrap gap-2.5 pt-2">
                        {step.points.map((point, pIdx) => (
                          <div key={pIdx} className="px-4 py-2 bg-[var(--bg-primary)] border border-white/5 rounded-full text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {point}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-10 mt-auto flex flex-col sm:flex-row items-center gap-5">
                  <button 
                    onClick={onClose}
                    className="w-full sm:flex-1 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-4 group active:scale-95"
                  >
                    {modalType === 'welcome' ? 'Enter Workspace' : 'Continue Mission'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </button>
                  <a 
                    href="https://www.linkedin.com/in/sankalpsuman/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-10 py-6 bg-transparent border border-white/10 hover:bg-white/5 text-[var(--text-primary)] rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] transition-all text-center flex items-center justify-center gap-3 group"
                  >
                    Founders LinkedIn <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
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
