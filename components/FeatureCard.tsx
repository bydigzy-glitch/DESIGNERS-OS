import React from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  noPadding?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  children, 
  className = '', 
  delay = 0, 
  onClick,
  noPadding = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 20,
        delay: delay 
      }}
      whileHover={{ 
        scale: 1.01,
        boxShadow: "0 0 30px -5px rgba(0, 119, 255, 0.15)",
        borderColor: "rgba(0, 119, 255, 0.3)"
      }}
      onClick={onClick}
      className={`
        relative
        bg-white/5 backdrop-blur-xl 
        rounded-[2rem] 
        border border-white/10
        overflow-hidden
        transition-colors duration-300
        ${noPadding ? '' : 'p-6 md:p-8'}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Subtle Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};