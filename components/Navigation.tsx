
import React, { useEffect, useState } from 'react';
import { ViewMode, User, AppNotification } from '../types';
import { LayoutGrid, Layers, Calendar as CalendarIcon, MessageSquare, FolderOpen, Settings, Hexagon, CheckSquare, Sun, Moon, Flame, Bell, Briefcase, Users } from 'lucide-react';

interface NavigationProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  user: User | null;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

const DEFAULT_ORDER: ViewMode[] = ['HQ', 'TEAMS', 'MANAGER', 'TASKS', 'HABITS', 'APPS', 'CALENDAR', 'CHAT', 'FILES'];

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, user, notifications, onMarkRead, onClearAll }) => {
  // Static definition of all available items
  const allNavItems: Record<string, { id: ViewMode; label: string; icon: React.ReactNode }> = {
    'HQ': { id: 'HQ', label: 'Workspace', icon: <LayoutGrid size={18} /> },
    'TEAMS': { id: 'TEAMS', label: 'Teams', icon: <Users size={18} /> },
    'MANAGER': { id: 'MANAGER', label: 'Manager', icon: <Briefcase size={18} /> },
    'TASKS': { id: 'TASKS', label: 'Tasks', icon: <CheckSquare size={18} /> },
    'HABITS': { id: 'HABITS', label: 'Habits', icon: <Flame size={18} /> },
    'APPS': { id: 'APPS', label: 'Apps', icon: <Layers size={18} /> },
    'CALENDAR': { id: 'CALENDAR', label: 'Schedule', icon: <CalendarIcon size={18} /> },
    'CHAT': { id: 'CHAT', label: 'Ignite', icon: <MessageSquare size={18} /> },
    'FILES': { id: 'FILES', label: 'Assets', icon: <FolderOpen size={18} /> },
  };

  // Determine order: Use user prefs but ensure all default items are present (for new features)
  const navOrder = user?.preferences?.navOrder && user.preferences.navOrder.length > 0
    ? Array.from(new Set([...user.preferences.navOrder, ...DEFAULT_ORDER]))
    : DEFAULT_ORDER;

  useEffect(() => {
    const storedTheme = localStorage.getItem('user_preferences_theme');
    if (storedTheme) {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(storedTheme);
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <nav className="hidden md:flex flex-col w-64 h-full bg-background border-r border-border p-4 justify-between flex-shrink-0 z-50">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2 py-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow">
              <Hexagon size={18} className="text-white" strokeWidth={3} />
            </div>
            <div>
              <span className="block text-sm font-bold text-foreground tracking-tight">TaskNovaPro</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">v3.2</span>
            </div>
          </div>

          {/* Nav Items (Ordered) */}
          <div className="space-y-1">
            {navOrder.map(id => {
              const item = allNavItems[id];
              if (!item) return null;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                ${currentView === item.id
                      ? 'bg-secondary text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }
                            `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-1">
          <button
            onClick={() => onNavigate('SETTINGS')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${currentView === 'SETTINGS' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </button>

          <div className="pt-4 mt-2 border-t border-border">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden ring-1 ring-border">
                <img src={user?.avatar} alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{user?.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.isGuest ? 'Guest Access' : 'View Profile'}</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM DOCK */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-[64px] bg-background/80 backdrop-blur-xl border border-border rounded-full shadow-2xl z-50 flex items-center justify-between px-2 pb-safe">
        {navOrder.slice(0, 5).map(id => {
          const item = allNavItems[id];
          if (!item) return null;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                        relative p-3 rounded-full transition-all duration-300 flex items-center justify-center
                        ${currentView === item.id
                  ? 'text-white bg-primary shadow-glow'
                  : 'text-muted-foreground hover:text-foreground'
                }
                    `}
            >
              {item.icon}
            </button>
          );
        })}
        <button
          onClick={() => onNavigate('SETTINGS')}
          className="p-1 rounded-full overflow-hidden border border-border"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src={user?.avatar} alt="User" className="w-full h-full object-cover" />
          </div>
        </button>
      </nav>
    </>
  );
};
