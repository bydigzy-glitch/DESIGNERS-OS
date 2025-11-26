
import React from 'react';
import { ViewMode, User } from '../types';
import { MessageSquare, LayoutGrid, Zap, Calendar as CalendarIcon, FolderOpen, Settings, Grid } from 'lucide-react';

interface NavigationProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  user: User | null;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, user }) => {
  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'CHAT', label: 'Mentor', icon: <MessageSquare size={18} /> },
    { id: 'HQ', label: 'War Room', icon: <LayoutGrid size={18} /> },
    { id: 'CALENDAR', label: 'Timeline', icon: <CalendarIcon size={18} /> },
    { id: 'FILES', label: 'Assets', icon: <FolderOpen size={18} /> },
    { id: 'APPS', label: 'Apps', icon: <Grid size={18} /> },
  ];

  return (
    <nav className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-[95%] md:w-auto max-w-4xl">
      <div className="bg-[#141416]/90 backdrop-blur-2xl flex items-center justify-between gap-1 p-2 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
        
        {/* Main Nav Items */}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex items-center justify-center md:justify-start gap-2 px-4 md:px-6 py-3 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-wide transition-all duration-300 flex-1 md:flex-none whitespace-nowrap
              ${currentView === item.id 
                ? 'bg-white text-black shadow-lg shadow-white/10 scale-105' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
              }
            `}
          >
            {item.icon}
            <span className={currentView === item.id ? 'inline-block' : 'hidden md:inline-block'}>
              {item.label}
            </span>
          </button>
        ))}

        {/* Separator */}
        <div className="w-px h-6 bg-white/10 mx-1"></div>

        {/* Profile/Settings Button */}
        <button
          onClick={() => onNavigate('SETTINGS')}
          className={`
             w-10 h-10 rounded-full flex items-center justify-center transition-all overflow-hidden border
             ${currentView === 'SETTINGS' ? 'border-accent-blue ring-2 ring-accent-blue/30' : 'border-transparent hover:border-gray-500'}
          `}
        >
           {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
           ) : (
              <Settings size={18} className="text-gray-400" />
           )}
        </button>

      </div>
    </nav>
  );
};
