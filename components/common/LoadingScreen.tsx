
import React, { useEffect, useState } from 'react';
import { Hexagon, Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center ${progress >= 100 ? 'animate-out fade-out duration-500 fill-mode-forwards' : ''}`}>

      <div className="relative mb-8 animate-in fade-in zoom-in-50 duration-500">
        <div className="gradient-blob absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg relative z-10">
          <Hexagon size={32} className="text-primary-foreground animate-spin-slow" strokeWidth={3} />
        </div>
      </div>

      <div className="w-64 space-y-2">
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground uppercase tracking-widest">
          <span>Loading System</span>
          <span>{Math.round(Math.min(progress, 100))}%</span>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};
