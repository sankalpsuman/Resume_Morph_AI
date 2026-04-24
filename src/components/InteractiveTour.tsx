import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, Layout, Globe, FileText, Briefcase, User, Info, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Step {
  targetId: string;
  title: string;
  content: string;
  icon: any;
  position: 'bottom' | 'top' | 'left' | 'right';
}

const TOUR_STEPS: Step[] = [
  {
    targetId: 'tab-builder',
    title: 'Morph Engine',
    content: 'The core AI engine. Clone any reference resume layout using your own professional data in seconds.',
    icon: Layout,
    position: 'bottom'
  },
  {
    targetId: 'tab-smart-editor',
    title: 'Smart Editor',
    content: 'A powerful markdown editor with AI-assisted rewriting and design controls for final polishing.',
    icon: Sparkles,
    position: 'bottom'
  },
  {
    targetId: 'tab-portfolio',
    title: 'Portfolio Gen',
    content: 'Transform your resume into a stunning, responsive web portfolio to share with recruiters.',
    icon: Globe,
    position: 'bottom'
  },
  {
    targetId: 'tab-cover-letter',
    title: 'Cover Letter',
    content: 'Generate tailored, high-impact cover letters synced perfectly with your resume content.',
    icon: FileText,
    position: 'bottom'
  },
  {
    targetId: 'tab-tracker',
    title: 'Applications',
    content: 'Keep your job search organized. Track your applications, interviews, and offers in one place.',
    icon: Briefcase,
    position: 'bottom'
  },
  {
    targetId: 'resources-btn',
    title: 'Resources Hub',
    content: 'Access our user guide, learn more about Morph, or see feedback from other users.',
    icon: Info,
    position: 'bottom'
  },
  {
    targetId: 'tab-account',
    title: 'Your Account',
    content: 'View your profile, track your level, and manage your usage stats and premium membership.',
    icon: User,
    position: 'bottom'
  }
];

export default function InteractiveTour() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('has_seen_tour_v1');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setCurrentStep(0);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleRestart = () => {
      setIsVisible(true);
      setCurrentStep(0);
    };
    window.addEventListener('restart-tour', handleRestart);
    return () => window.removeEventListener('restart-tour', handleRestart);
  }, []);

  useEffect(() => {
    const updateCoords = (isFirstLoad = false) => {
      if (currentStep >= 0 && currentStep < TOUR_STEPS.length && isVisible) {
        const step = TOUR_STEPS[currentStep];
        const element = document.getElementById(step.targetId);
        
        if (element) {
          const rect = element.getBoundingClientRect();
          setCoords({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });
          
          if (isFirstLoad) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          // If element not found (e.g. mobile hidden), skip step if it's the target but hidden
          if (isFirstLoad) {
            const nextTimer = setTimeout(handleNext, 100);
            return () => clearTimeout(nextTimer);
          }
        }
      }
    };

    updateCoords(true);

    window.addEventListener('resize', () => updateCoords(false));
    window.addEventListener('scroll', () => updateCoords(false));
    return () => {
      window.removeEventListener('resize', () => updateCoords(false));
      window.removeEventListener('scroll', () => updateCoords(false));
    };
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('has_seen_tour_v1', 'true');
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('has_seen_tour_v1', 'true');
  };

  if (!isVisible || currentStep === -1) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* Dimmed Background with Hole */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" style={{ 
        clipPath: `polygon(
          0% 0%, 
          0% 100%, 
          ${coords.left}px 100%, 
          ${coords.left}px ${coords.top}px, 
          ${coords.left + coords.width}px ${coords.top}px, 
          ${coords.left + coords.width}px ${coords.top + coords.height}px, 
          ${coords.left}px ${coords.top + coords.height}px, 
          ${coords.left}px 100%, 
          100% 100%, 
          100% 0%
        )`
      }} />

      {/* Target Highlight Ring */}
      <motion.div 
        animate={{ 
          top: coords.top - 4, 
          left: coords.left - 4, 
          width: coords.width + 8, 
          height: coords.height + 8 
        }}
        className="absolute border-2 border-indigo-400 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)] z-[1001]"
      />

      {/* Tooltip Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="absolute z-[1002] w-[320px] pointer-events-auto"
          style={{
            top: step.position === 'bottom' ? coords.top + coords.height + 16 : coords.top - 200,
            left: Math.max(16, Math.min(window.innerWidth - 336, coords.left + (coords.width / 2) - 160))
          }}
        >
          <div className="bg-white rounded-[32px] p-6 shadow-2xl border border-indigo-100/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <step.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none">{step.title}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Step {currentStep + 1} of {TOUR_STEPS.length}</p>
              </div>
              <button 
                onClick={handleSkip}
                className="ml-auto p-2 text-gray-300 hover:text-gray-900 transition-colors"
                title="Skip Tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 text-sm font-medium leading-relaxed mb-6">
              {step.content}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      i === currentStep ? "bg-indigo-600 w-4" : "bg-gray-200"
                    )} 
                  />
                ))}
              </div>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button 
                    onClick={handleBack}
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Arrow */}
          <div className={cn(
            "absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-indigo-100/50 rotate-45 -z-10",
            step.position === 'bottom' ? "-top-2 border-l-0 border-t-0 bg-white" : "-bottom-2 border-r-0 border-b-0 bg-white"
          )} style={{
            clipPath: step.position === 'bottom' ? 'polygon(0% 0%, 100% 0%, 50% 50%)' : 'polygon(50% 50%, 100% 100%, 0% 100%)',
            background: 'white',
            top: step.position === 'bottom' ? '-8px' : 'auto',
            bottom: step.position === 'bottom' ? 'auto' : '-8px'
          }} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
