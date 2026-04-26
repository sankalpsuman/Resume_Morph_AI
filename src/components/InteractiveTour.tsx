import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, Layout, Globe, FileText, Briefcase, User, Info, CheckCircle, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

interface Step {
  targetId: string;
  title: string;
  content: string;
  icon: any;
  position: 'bottom' | 'top' | 'left' | 'right';
  switchToTab?: string;
}

const TOUR_STEPS: Step[] = [
  {
    targetId: 'tab-builder',
    title: 'Morph AI Engine',
    content: 'Start here. Clone any resume layout by uploading a reference layout. Our AI analyzes the visual DNA.',
    icon: Layout,
    position: 'bottom',
    switchToTab: 'builder'
  },
  {
    targetId: 'builder-reference-upload',
    title: 'Visual Cloning',
    content: 'Drop a PDF or image of a resume you love. We\'ll reconstruct it using your own professional data.',
    icon: Sparkles,
    position: 'top',
    switchToTab: 'builder'
  },
  {
    targetId: 'tab-smart-editor',
    title: 'Smart Editor',
    content: 'Fine-tune your resume with real-time design controls and AI-assisted content optimization.',
    icon: FileText,
    position: 'bottom',
    switchToTab: 'smart-editor'
  },
  {
    targetId: 'smart-editor-controls',
    title: 'Design Controls',
    content: 'Adjust fonts, colors, and layout sections instantly. Your changes sync live to the preview.',
    icon: Layout,
    position: 'right',
    switchToTab: 'smart-editor'
  },
  {
    targetId: 'smart-editor-preview',
    title: 'Live Preview',
    content: 'See your resume take shape in high-fidelity. What you see is exactly what you get.',
    icon: Eye,
    position: 'left',
    switchToTab: 'smart-editor'
  },
  {
    targetId: 'tab-portfolio',
    title: 'Portfolio Builder',
    content: 'Transform your static resume into a high-converting, professional website in one click.',
    icon: Globe,
    position: 'bottom',
    switchToTab: 'portfolio'
  },
  {
    targetId: 'resources-btn',
    title: 'Help & Knowledge',
    content: 'Access tutorials, feedback, and our comprehensive user guide here.',
    icon: Info,
    position: 'bottom'
  },
  {
    targetId: 'tab-account',
    title: 'Your Account',
    content: 'Manage your subscription, track your usage, and view your level and profile.',
    icon: User,
    position: 'bottom',
    switchToTab: 'account'
  }
];

export default function InteractiveTour() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const requestRef = React.useRef<number>(null);

  const updateCoords = React.useCallback(() => {
    if (currentStep >= 0 && currentStep < TOUR_STEPS.length && isVisible) {
      const step = TOUR_STEPS[currentStep];
      let target = step.targetId;
      const isMobile = window.innerWidth < 768;
      
      if (isMobile && target.startsWith('tab-')) {
        const tabId = target.replace('tab-', '');
        const mobileTarget = document.getElementById(`mobile-tab-${tabId}`);
        if (mobileTarget) target = `mobile-tab-${tabId}`;
      }

      const element = document.getElementById(target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setCoords(prev => {
          // Only update if changes are significant to prevent flicker
          if (
            Math.abs(prev.top - rect.top) < 0.5 && 
            Math.abs(prev.left - rect.left) < 0.5 &&
            Math.abs(prev.width - rect.width) < 0.5 &&
            Math.abs(prev.height - rect.height) < 0.5
          ) return prev;
          
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          };
        });
      }
    }
    requestRef.current = requestAnimationFrame(updateCoords);
  }, [currentStep, isVisible]);

  useEffect(() => {
    if (isVisible) {
      requestRef.current = requestAnimationFrame(updateCoords);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isVisible, updateCoords]);

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
    if (isVisible && currentStep >= 0 && currentStep < TOUR_STEPS.length) {
      const step = TOUR_STEPS[currentStep];
      if (step.switchToTab) {
        window.dispatchEvent(new CustomEvent('set-tab', { detail: step.switchToTab }));
      }
      
      // Auto-scroll to target
      setTimeout(() => {
        let targetId = step.targetId;
        const isMobile = window.innerWidth < 768;
        if (isMobile && targetId.startsWith('tab-')) {
          const tabId = targetId.replace('tab-', '');
          const mobileTarget = document.getElementById(`mobile-tab-${tabId}`);
          if (mobileTarget) targetId = `mobile-tab-${tabId}`;
        }
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400); // Slightly more delay to allow tab transitions
    }
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

  // Measurement ref for the tooltip height calculation
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [tooltipHeight, setTooltipHeight] = useState(200);

  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipHeight(tooltipRef.current.offsetHeight);
    }
  }, [currentStep]);

  if (!isVisible || currentStep === -1) return null;

  const step = TOUR_STEPS[currentStep];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isBottomNavTarget = isMobile && step.targetId.startsWith('tab-');
  const position = isBottomNavTarget ? 'top' : step.position;

  const tooltipStyle = {
    top: position === 'bottom' 
      ? coords.top + coords.height + 16 
      : position === 'top' 
        ? coords.top - tooltipHeight - 16
        : Math.max(16, coords.top - (tooltipHeight / 2) + (coords.height / 2)),
    left: isMobile 
      ? 16 
      : position === 'right'
        ? coords.left + coords.width + 16
        : position === 'left'
          ? coords.left - 336 - 16
          : Math.max(16, Math.min(window.innerWidth - 336, coords.left + (coords.width / 2) - 160))
  };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none transition-all duration-300">
      {/* Dimmed Background with Hole */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/85 pointer-events-auto" style={{ 
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
      <div 
        style={{ 
          top: coords.top - 4, 
          left: coords.left - (isMobile ? 2 : 4), 
          width: coords.width + (isMobile ? 4 : 8), 
          height: coords.height + 8 
        }}
        className="absolute border-2 border-indigo-400 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)] z-[1001] transition-all duration-100"
      />

      {/* Tooltip Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="absolute z-[1002] w-[calc(100vw-2rem)] xs:w-[320px] pointer-events-auto"
          style={tooltipStyle}
        >
          <div className="bg-[var(--bg-primary)] rounded-[28px] md:rounded-[32px] p-5 md:p-6 shadow-2xl border border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <step.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex-grow">
                <h3 className="text-base md:text-lg font-black text-[var(--text-primary)] tracking-tight leading-none">{step.title}</h3>
                <p className="text-[9px] md:text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest mt-1">Step {currentStep + 1} of {TOUR_STEPS.length}</p>
              </div>
              <button 
                onClick={handleSkip}
                className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                title="Skip Tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[var(--text-secondary)] text-xs md:text-sm font-medium leading-relaxed mb-6 line-clamp-3 md:line-clamp-none">
              {step.content}
            </p>

            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-1 shrink-0">
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1 md:w-1.5 h-1 md:h-1.5 rounded-full transition-all duration-300",
                      i === currentStep ? "bg-indigo-600 w-3 md:w-4" : "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                    )} 
                  />
                ))}
              </div>
              
              <div className="flex gap-2 items-center">
                {currentStep > 0 && (
                  <button 
                    onClick={handleBack}
                    className="p-1.5 md:p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-indigo-600 text-white rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Arrow */}
          {!isMobile && (
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--bg-primary)] border-l border-t border-[var(--border-color)] rotate-45 -z-10",
              position === 'bottom' ? "-top-2 border-l-0 border-t-0" : "-bottom-2 border-r-0 border-b-0"
            )} style={{
              clipPath: position === 'bottom' ? 'polygon(0% 0%, 100% 0%, 50% 50%)' : 'polygon(50% 50%, 100% 100%, 0% 100%)',
              top: position === 'bottom' ? '-8px' : 'auto',
              bottom: position === 'bottom' ? 'auto' : '-8px'
            }} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
