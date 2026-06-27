import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Blog() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const blogUrl = 'https://sankalp-suman.vercel.app/blog';

  useEffect(() => {
    // Add a fallback timeout in case iframe fails to load silently
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col relative bg-[var(--bg-primary)]">
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[var(--bg-primary)]">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-[var(--text-secondary)] font-medium animate-pulse">Loading Blog...</p>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[var(--bg-primary)] p-4 text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Unable to load blog</h2>
          <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
            We're having trouble connecting to the blog. You can try refreshing or open it directly in a new tab.
          </p>
          <a 
            href={blogUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            <span>Open Blog in New Tab</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      <iframe
        src={blogUrl}
        className={cn(
          "w-full flex-1 border-0 transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100",
          hasError ? "hidden" : "block"
        )}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title="Morph Blog"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}
