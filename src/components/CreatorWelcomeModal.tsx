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
  const [currentStep, setCurrentStep] = useState(0);
  const [displayText, setDisplayText] = useState('');
  
  const welcomeMessage = "Hi, I'm Sankalp Suman, creator of this platform.";
  
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('morph_creator_welcome_seen');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      let index = 0;
      const timer = setInterval(() => {
        setDisplayText(welcomeMessage.slice(0, index));
        index++;
        if (index > welcomeMessage.length) clearInterval(timer);
      }, 50);
      
      const autoClose = setTimeout(() => {
        // Optional auto-close disabled by default for accessibility, but logic is here
      }, 15000);

      return () => {
        clearInterval(timer);
        clearTimeout(autoClose);
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('morph_creator_welcome_seen', 'true');
  };

  const steps = [
    {
      title: "The Vision",
      icon: <Rocket className="w-6 h-6 text-indigo-500" />,
      content: "I built this website to help users with professional identity transformation in a simple, smart, and modern way. Traditional resumes are dead; high-performance data is the future.",
      points: ["Solve real problems", "Save users time", "Give smart tools", "Better user experience"]
    },
    {
      title: "What's Next?",
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      content: "We're continuously improving features and adding updates regularly based on your feedback. This is a long-term evolution of career engineering.",
      points: ["Improving features", "Regular updates", "User feedback driven", "Long-term platform"]
    }
  ];

  return (
    <>
      {/* Global re-open listener handle */}
      {useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-creator-about', handleOpen);
        return () => window.removeEventListener('open-creator-about', handleOpen);
      }, [])}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--bg-primary)] rounded-[40px] shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Profile Sidebar (Mobile Hidden) */}
              <div className="w-full md:w-1/3 bg-indigo-600 dark:bg-indigo-950 p-8 flex flex-col items-center text-center text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full border-4 border-white/20 p-1">
                    <img 
                      src="https://media.licdn.com/dms/image/v2/D5603AQF4O0y_H_L1_w/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718227652758?e=1751328000&v=beta&t=7l3uAn6v3S7X-T-Z_jX_k7P1_-n5S_9G7l_8X-C_i6U" 
                      alt="Sankalp Suman" 
                      className="w-full h-full rounded-full object-cover shadow-xl"
                    />
                  </div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-indigo-600 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 text-white fill-white" />
                  </motion.div>
                </div>
                
                <h3 className="text-xl font-black tracking-tight leading-none mb-2">Sankalp Suman</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/70 mb-8">Architect & Creator</p>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  <a href="https://linkedin.com/in/sankalpsmn" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors flex items-center justify-center group">
                    <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                  <a href="https://github.com/sankalpsmn" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors flex items-center justify-center group">
                    <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                  <a href="https://instagram.com/sankalpsmn" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors flex items-center justify-center group">
                    <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                  <a href="mailto:sankalpsmn@gmail.com" className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors flex items-center justify-center group">
                    <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
                
                <div className="mt-auto pt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-300">
                  <Globe className="w-3 h-3" />
                  Built for the World
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-8 md:p-12 flex flex-col max-h-[70vh] md:max-h-none overflow-y-auto custom-scrollbar">
                <button 
                  onClick={handleClose}
                  className="absolute top-6 right-6 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-4">
                      <MessageCircle className="w-4 h-4" />
                      Welcome to Morph
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tighter leading-none mb-6">
                      👋 Greetings.
                    </h2>
                    <p className="text-lg md:text-xl font-bold text-[var(--text-secondary)] leading-relaxed h-[60px]">
                      {displayText}<span className="inline-block w-1 h-6 bg-indigo-600 ml-1 animate-pulse" />
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {steps.map((step, idx) => (
                      <div key={idx} className="p-6 bg-[var(--bg-secondary)] rounded-3xl space-y-4 border border-[var(--border-color)]">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-[var(--border-color)]">
                            {step.icon}
                          </div>
                          <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">{step.title}</h4>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                          {step.content}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {step.points.map((point, pIdx) => (
                            <div key={pIdx} className="px-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              {point}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 mt-auto border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center gap-4">
                    <button 
                      onClick={handleClose}
                      className="w-full sm:flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-3 group"
                    >
                      Explore Platform
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <a 
                      href="https://linkedin.com/in/sankalpsmn"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-8 py-4 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-center"
                    >
                      Connect With Me
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
