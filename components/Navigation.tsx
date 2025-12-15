

import React, { useEffect, useState } from 'react';
import { ViewMode, User, AppNotification } from '../types';
import { LayoutGrid, Layers, Calendar as CalendarIcon, MessageSquare, FolderOpen, Settings, Hexagon, CheckSquare, Sun, Moon, Flame, Bell, Briefcase, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavigationProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  user: User | null;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

const DEFAULT_ORDER: ViewMode[] = ['HQ', 'MANAGER', 'TASKS', 'HABITS', 'APPS', 'CALENDAR', 'CHAT', 'FILES'];

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, user, notifications, onMarkRead, onClearAll }) => {
  // Static definition of all available items
  const allNavItems: Record<string, { id: ViewMode; label: string; icon: React.ReactNode }> = {
    'HQ': { id: 'HQ', label: 'Workspace', icon: <LayoutGrid size={18} /> },
    'MANAGER': { id: 'MANAGER', label: 'Manager', icon: <Briefcase size={18} /> },
    'TASKS': { id: 'TASKS', label: 'Tasks', icon: <CheckSquare size={18} /> },
    'HABITS': { id: 'HABITS', label: 'Habits', icon: <Flame size={18} /> },
    'APPS': { id: 'APPS', label: 'Apps', icon: <Layers size={18} /> },
    'CALENDAR': { id: 'CALENDAR', label: 'Schedule', icon: <CalendarIcon size={18} /> },
    'CHAT': { id: 'CHAT', label: 'Ignite', icon: <MessageSquare size={18} /> },
    'FILES': { id: 'FILES', label: 'Assets', icon: <FolderOpen size={18} /> },
  };

  // Determine order: ALWAYS show all DEFAULT items, but respect user's custom order if they have one
  // This ensures new features like TEAMS are never hidden by old preferences
  const navOrder = user?.preferences?.navOrder && user.preferences.navOrder.length > 0
    ? [
      // First, show user's preferred items in their order (if they exist in defaults)
      ...user.preferences.navOrder.filter(id => DEFAULT_ORDER.includes(id)),
      // Then, add any new default items that user doesn't have yet
      ...DEFAULT_ORDER.filter(id => !user.preferences.navOrder.includes(id))
    ]
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
    <TooltipProvider delayDuration={300}>
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

              const tooltipText = {
                'HQ': 'Your main workspace dashboard',
                'MANAGER': 'Manage clients and projects',
                'TASKS': 'View and organize your tasks',
                'HABITS': 'Track your daily habits',
                'APPS': 'Browse available apps',
                'CALENDAR': 'Schedule and events',
                'CHAT': 'AI-powered assistant',
                'FILES': 'Manage your assets and files'
              }[item.id] || item.label;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentView === item.id ? "secondary" : "ghost"}
                      onClick={() => onNavigate(item.id)}
                      className="w-full justify-start gap-3"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{tooltipText}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === 'SETTINGS' ? "secondary" : "ghost"}
                onClick={() => onNavigate('SETTINGS')}
                className="w-full justify-start gap-3"
              >
                <Settings size={18} />
                <span>Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Customize your preferences</p>
            </TooltipContent>
          </Tooltip>

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


      {/* MOBILE BOTTOM DOCK - 4 Main Items */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-[68px] bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 flex items-center justify-around px-4">
        {/* HQ */}
        <Button
          variant={currentView === 'HQ' ? "default" : "ghost"}
          onClick={() => onNavigate('HQ')}
          className="flex flex-col items-center justify-center gap-1 h-auto py-3"
        >
          <LayoutGrid size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">HQ</span>
        </Button>

        {/* TASKS */}
        <Button
          variant={currentView === 'TASKS' ? "default" : "ghost"}
          onClick={() => onNavigate('TASKS')}
          className="flex flex-col items-center justify-center gap-1 h-auto py-3"
        >
          <CheckSquare size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">TASK</span>
        </Button>

        {/* AI CHAT */}
        <Button
          variant={currentView === 'CHAT' ? "default" : "ghost"}
          onClick={() => onNavigate('CHAT')}
          className="flex flex-col items-center justify-center gap-1 h-auto py-3"
        >
          <MessageSquare size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">AI</span>
        </Button>

        {/* CALENDAR */}
        <Button
          variant={currentView === 'CALENDAR' ? "default" : "ghost"}
          onClick={() => onNavigate('CALENDAR')}
          className="flex flex-col items-center justify-center gap-1 h-auto py-3"
        >
          <CalendarIcon size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">CALE</span>
        </Button>
      </nav>
    </TooltipProvider>
  );
};
