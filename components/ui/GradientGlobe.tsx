import React from 'react';
import { cn } from '@/lib/utils';

interface GradientGlobeProps {
    className?: string;
    size?: number; // Size in pixels for scaling calculations
}

export const GradientGlobe: React.FC<GradientGlobeProps> = ({ className, size = 120 }) => {
    return (
        <div
            className={cn("relative flex items-center justify-center rounded-full select-none bg-transparent", className)}
            style={{ width: size, height: size, fontSize: size }} // fontSize = size allows em units to be relative to container
        >
            <style>
                {`
          @keyframes loader-rotate {
            0% {
              transform: rotate(90deg);
              box-shadow:
                0 0.05em 0.1em 0 rgba(255,255,255,0.5) inset,
                0 0.1em 0.16em 0 hsl(var(--primary)) inset,
                0 0.33em 0.33em 0 hsl(var(--primary) / 0.6) inset;
            }
            50% {
              transform: rotate(270deg);
              box-shadow:
                0 0.05em 0.1em 0 rgba(255,255,255,0.5) inset,
                0 0.1em 0.05em 0 hsl(var(--destructive)) inset,
                0 0.22em 0.33em 0 hsl(var(--secondary)) inset;
            }
            100% {
              transform: rotate(450deg);
              box-shadow:
                0 0.05em 0.1em 0 rgba(255,255,255,0.5) inset,
                0 0.1em 0.16em 0 hsl(var(--primary)) inset,
                0 0.33em 0.33em 0 hsl(var(--primary) / 0.6) inset;
            }
          }
        `}
            </style>
            <div
                className="absolute inset-0 w-full h-full rounded-full bg-transparent z-0 overflow-hidden"
                style={{
                    animation: 'loader-rotate 2s linear infinite',
                    // Fallback initial state matching 0%
                    boxShadow: '0 0.05em 0.1em 0 rgba(255,255,255,0.5) inset, 0 0.1em 0.16em 0 hsl(var(--primary)) inset, 0 0.33em 0.33em 0 hsl(var(--primary) / 0.6) inset'
                }}
            />
        </div>
    );
};
