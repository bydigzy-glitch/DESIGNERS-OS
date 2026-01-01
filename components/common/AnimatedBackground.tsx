import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBackgroundProps {
  className?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ className }) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none -z-10", className)}>
      {/* Ripple Effect Layers */}
      <div className="absolute inset-0 opacity-30">
        {/* Ripple 1 - Slow expanding circle */}
        <div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
            animation: 'ripple 8s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />

        {/* Ripple 2 - Medium speed */}
        <div
          className="absolute top-2/3 right-1/3 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary) / 0.12) 0%, transparent 70%)',
            animation: 'ripple 12s ease-in-out infinite',
            animationDelay: '2s'
          }}
        />

        {/* Ripple 3 - Slowest */}
        <div
          className="absolute bottom-1/4 left-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
            animation: 'ripple 15s ease-in-out infinite',
            animationDelay: '4s'
          }}
        />
      </div>

      {/* Flicker Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"
        style={{
          animation: 'flicker 6s ease-in-out infinite'
        }}
      />

      {/* Subtle moving gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'linear-gradient(45deg, hsl(var(--primary) / 0.1), transparent, hsl(var(--secondary) / 0.1))',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 20s ease infinite'
        }}
      />

      {/* CSS Animations - moved to index.css for build compatibility */}
    </div>
  );
};
