import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  title?: string;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export default function Tooltip({ 
  children, 
  content, 
  title, 
  shortcut, 
  position = 'top',
  delay = 300,
  className
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // We'll use fixed positioning to avoid overflow issues
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX + rect.width / 2
        });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-3';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-3';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-3';
      default: // top
        return 'bottom-full left-1/2 -translate-x-1/2 mb-3';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative group inline-block", className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0, x: position === 'left' ? 4 : position === 'right' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-[1000] pointer-events-none w-max max-w-[240px]",
              getPositionStyles()
            )}
          >
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-3 backdrop-blur-md">
              {title && (
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    {title}
                  </span>
                  {shortcut && (
                    <span className="text-[9px] font-mono font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase">
                      {shortcut}
                    </span>
                  )}
                </div>
              )}
              <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                {content}
              </p>
              
              {/* Arrow */}
              <div className={cn(
                "absolute w-2 h-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rotate-45 -z-10",
                position === 'top' ? "bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r" :
                position === 'bottom' ? "top-[-4px] left-1/2 -translate-x-1/2 border-t border-l" :
                position === 'left' ? "right-[-4px] top-1/2 -translate-y-1/2 border-t border-r" :
                "left-[-4px] top-1/2 -translate-y-1/2 border-b border-l"
              )} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
