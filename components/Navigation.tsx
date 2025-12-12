
import React, { useEffect, useState } from 'react';
import { ViewMode, User, AppNotification } from '../types';
import { LayoutGrid, Layers, Calendar as CalendarIcon, MessageSquare, FolderOpen, Settings, Hexagon, CheckSquare, Sun, Moon, Flame, Bell, Briefcase } from 'lucide-react';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Static definition of all available items
  const allNavItems: Record<string, { id: ViewMode; label: string; icon: React.ReactNode }> = {
    'HQ': { id: 'HQ', label: 'Workspace', icon: <LayoutGrid size={18} /> },
    'MANAGER': { id: 'MANAGER', label: 'Manager', icon: <Briefcase size={18} /> },
    'TASKS': { id: 'TASKS', label: 'Tasks', icon: <CheckSquare size={18} /> },
    'HABITS': { id: 'HABITS', label: 'Habits', icon: <Flame size={18} /> },
    'APPS': { id: 'APPS', label: 'Apps', icon: <Layers size={18} /> },
    'CALENDAR': { id: 'CALENDAR', label: 'Schedule', icon: <CalendarIcon size={18} /> },
    'CHAT': { id: 'CHAT', label: 'Mentor', icon: <MessageSquare size={18} /> },
    'FILES': { id: 'FILES', label: 'Assets', icon: <FolderOpen size={18} /> },
  };

  // Determine order based on user prefs or default
  const navOrder = user?.preferences?.navOrder && user.preferences.navOrder.length > 0 
    ? user.preferences.navOrder 
    : DEFAULT_ORDER;

  const currentTheme = user?.preferences?.theme || 'dark';

  const toggleTheme = () => {
    const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('user_preferences_theme', newTheme);
    
    if (user) {
        user.preferences.theme = newTheme as 'light' | 'dark';
    }
  };

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
             <div className="relative">
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary/50 ${showNotifications ? 'bg-secondary text-foreground' : ''}`}
                 >
                     <div className="relative">
                         <Bell size={18} />
                         {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-background"></span>}
                     </div>
                     <span className="text-sm font-medium">Notifications</span>
                 </button>

                 {/* Notifications Dropdown */}
                 {showNotifications && (
                     <div className="absolute bottom-full left-0 w-80 mb-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[60] flex flex-col max-h-[400px]">
                         <div className="p-3 border-b border-border flex justify-between items-center bg-secondary/50">
                             <span className="text-xs font-bold text-foreground">Activity</span>
                             {notifications.length > 0 && (
                                <button onClick={onClearAll} className="text-[10px] text-primary hover:underline">Clear All</button>
                             )}
                         </div>
                         <div className="overflow-y-auto flex-1 p-2 space-y-2">
                             {notifications.length === 0 ? (
                                 <div className="text-center py-8 text-muted-foreground text-xs">No new notifications</div>
                             ) : (
                                 notifications.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(n => (
                                     <div key={n.id} onClick={() => onMarkRead(n.id)} className={`p-3 rounded-xl border transition-colors cursor-pointer flex flex-col gap-1 ${n.read ? 'bg-transparent border-transparent opacity-60' : 'bg-secondary/30 border-border hover:bg-secondary/50'}`}>
                                         <div className="flex justify-between items-start">
                                             <span className="text-xs font-bold text-foreground">{n.title}</span>
                                             <span className="text-[9px] text-muted-foreground">{n.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                         </div>
                                         <p className="text-[10px] text-muted-foreground leading-relaxed">{n.message}</p>
                                     </div>
                                 ))
                             )}
                         </div>
                     </div>
                 )}
             </div>

            <button 
                onClick={toggleTheme}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary/50`}
             >
                 <Sun size={18} className="hidden dark:block" />
                 <Moon size={18} className="block dark:hidden" />
                 <span className="text-sm font-medium">Theme</span>
             </button>
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
