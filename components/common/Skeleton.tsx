
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", variant = "rectangular" }) => {
  const baseClasses = "animate-pulse bg-white/5 rounded-none";

  const variantClasses = {
    text: "h-4 w-full rounded-none",
    circular: "rounded-none",
    rectangular: "h-full w-full rounded-none",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};
