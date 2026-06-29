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
    const pausedStep = localStorage.getItem('tour_paused_step');
    
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setCurrentStep(pausedStep ? parseInt(pausedStep) : 0);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleRestart = () => {
      setIsVisible(true);
      setCurrentStep(0);
      localStorage.removeItem('tour_paused_step');
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
    localStorage.removeItem('tour_paused_step');
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('has_seen_tour_v1', 'true');
    localStorage.removeItem('tour_paused_step');
  };

  const handlePause = () => {
    setIsVisible(false);
    localStorage.setItem('tour_paused_step', currentStep.toString());
  };

  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [tooltipHeight, setTooltipHeight] = useState(200);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipHeight(tooltipRef.current.offsetHeight);
    }
  }, [currentStep, windowSize]);

  if (!isVisible || currentStep === -1) return null;

  const step = TOUR_STEPS[currentStep];
  const isMobile = windowSize.width < 768;
  const isBottomNavTarget = isMobile && step.targetId.startsWith('tab-');
  
  // Smart Positioning
  let position = isBottomNavTarget ? 'top' : step.position;
  
  // If at bottom of screen and position is bottom, flip to top
  if (position === 'bottom' && coords.top + coords.height + tooltipHeight + 32 > windowSize.height) {
    position = 'top';
  }
  // If at top and position is top, flip to bottom
  if (position === 'top' && coords.top - tooltipHeight - 32 < 0) {
    position = 'bottom';
  }

  const tooltipStyle = {
    top: position === 'bottom' 
      ? coords.top + coords.height + 16 
      : position === 'top' 
        ? coords.top - tooltipHeight - 16
        : Math.max(16, Math.min(windowSize.height - tooltipHeight - 16, coords.top - (tooltipHeight / 2) + (coords.height / 2))),
    left: isMobile 
      ? 16 
      : position === 'right'
        ? Math.min(windowSize.width - 320 - 16, coords.left + coords.width + 16)
        : position === 'left'
          ? Math.max(16, coords.left - 320 - 16)
          : Math.max(16, Math.min(windowSize.width - 320 - 16, coords.left + (coords.width / 2) - 160))
  };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none transition-all duration-300">
      {/* Dimmed Background with Hole */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-[2px] pointer-events-auto" style={{ 
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
        initial={false}
        animate={{
          top: coords.top - 8,
          left: coords.left - (isMobile ? 4 : 8),
          width: coords.width + (isMobile ? 8 : 16),
          height: coords.height + 16
        }}
        className="absolute border-2 border-indigo-500/50 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.3)] z-[1001] pointer-events-none"
      />

      {/* Tooltip Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="absolute z-[1002] w-fit min-w-[260px] max-w-[calc(100vw-2rem)] md:max-w-[320px] pointer-events-auto"
          style={tooltipStyle}
        >
          <div className="bg-white dark:bg-gray-900 rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 ring-1 ring-black/5 dark:ring-white/5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm border border-indigo-100/50 dark:border-indigo-900/50">
                  <step.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{step.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em]">Step {currentStep + 1} of {TOUR_STEPS.length}</span>
                    <div className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Tutorial</span>
                  </div>
                </div>
              </div>
                <button 
                  onClick={handlePause}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
                  title="Pause Tour"
                >
                  <Clock className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSkip}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
                  title="Dismiss Forever"
                >
                  <X className="w-5 h-5" />
                </button>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base font-medium leading-relaxed mb-8">
              {step.content}
            </p>

            <div className="flex items-center justify-between gap-6">
              <div className="flex gap-1.5 shrink-0">
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      i === currentStep ? "bg-indigo-600 w-6" : "bg-gray-100 dark:bg-gray-800 w-1.5"
                    )} 
                  />
                ))}
              </div>
              
              <div className="flex gap-3 items-center">
                {currentStep > 0 && (
                  <button 
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button 
                  onClick={handleNext}
                  className="group flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:translate-y-[-2px] active:translate-y-0"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next Step'}
                  {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Arrow */}
          {!isMobile && (
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-900 border-l border-t border-gray-100 dark:border-gray-800 rotate-45 -z-10",
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
