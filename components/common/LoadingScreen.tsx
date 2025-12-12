
import React, { useEffect, useState } from 'react';
import { Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';

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
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-glow animate-pulse">
            <Hexagon size={32} className="text-white" strokeWidth={3} />
        </div>
      </motion.div>
      
      <div className="w-64 h-1 bg-secondary rounded-full overflow-hidden relative">
        <motion.div 
          className="h-full bg-primary absolute left-0 top-0"
          style={{ width: `${Math.min(progress, 100)}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      
      <div className="mt-4 font-mono text-xs text-muted-foreground">
        INITIALIZING SYSTEM... {Math.round(Math.min(progress, 100))}%
      </div>
    </div>
  );
};
