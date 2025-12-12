
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 rounded-[2rem] border border-white/5 bg-surface/30 border-dashed ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-text-secondary mb-4">
        <Icon size={24} />
      </div>
      <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
      <p className="text-text-secondary text-sm max-w-xs mb-6">{description}</p>
      
      {action && (
        <button 
          onClick={action.onClick}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors border border-white/5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
