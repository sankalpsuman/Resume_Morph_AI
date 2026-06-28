import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

export function Image({ src, alt, className, fallbackSrc, ...props }: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-slate-200 dark:bg-slate-800',
        !isLoaded && 'animate-pulse',
        className
      )}
    >
      <img
        src={error && fallbackSrc ? fallbackSrc : src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'w-full h-full object-cover transition-all duration-700 ease-in-out',
          isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'
        )}
        {...props}
      />
    </div>
  );
}
