
import React from 'react';
import { Search, Moon, Sun, Bell, Coins } from 'lucide-react';
import { User, AppNotification } from '../types';
import { CountUp } from './common/AnimatedComponents';

interface TopBarProps {
  user: User | null;
  notifications: AppNotification[];
  onToggleTheme: () => void;
  onToggleNotifications: () => void;
  showNotificationsDropdown: boolean;
  onClearNotifications: () => void;
  onMarkNotificationRead: (id: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
    user, 
    notifications, 
    onToggleTheme, 
    onToggleNotifications, 
    showNotificationsDropdown,
    onClearNotifications,
    onMarkNotificationRead
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                <input 
                    type="text" 
                    placeholder="Search tasks, projects, or assets..." 
                    className="w-full h-10 bg-secondary/50 rounded-xl pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all placeholder:text-muted-foreground border border-transparent focus:border-border"
                />
            </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
            
            {/* Tokens */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20 text-primary">
                <Coins size={14} fill="currentColor" />
                <span className="text-xs font-bold font-mono tracking-tight">
                    <CountUp value={user?.tokens || 0} duration={0.5} decimals={1} />
                </span>
            </div>

            {/* Theme Toggle */}
            <button 
                onClick={onToggleTheme}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                title="Toggle Theme"
            >
                <Sun size={18} className="hidden dark:block" />
                <Moon size={18} className="block dark:hidden" />
            </button>

            {/* Notifications */}
            <div className="relative">
                <button 
                    onClick={onToggleNotifications}
                    className={`p-2 rounded-lg transition-colors relative ${showNotificationsDropdown ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                >
                    <Bell size={18} />
                    {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>}
                </button>

                {/* Dropdown */}
                {showNotificationsDropdown && (
                     <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[60] flex flex-col max-h-[400px]">
                         <div className="p-3 border-b border-border flex justify-between items-center bg-secondary/50">
                             <span className="text-xs font-bold text-foreground">Activity</span>
                             {notifications.length > 0 && (
                                <button onClick={onClearNotifications} className="text-[10px] text-primary hover:underline">Clear All</button>
                             )}
                         </div>
                         <div className="overflow-y-auto flex-1 p-2 space-y-2">
                             {notifications.length === 0 ? (
                                 <div className="text-center py-8 text-muted-foreground text-xs">No new notifications</div>
                             ) : (
                                 notifications.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(n => (
                                     <div key={n.id} onClick={() => onMarkNotificationRead(n.id)} className={`p-3 rounded-xl border transition-colors cursor-pointer flex flex-col gap-1 ${n.read ? 'bg-transparent border-transparent opacity-60' : 'bg-secondary/30 border-border hover:bg-secondary/50'}`}>
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

            {/* Mobile User Avatar (Usually in Nav, but good fallback) */}
            <div className="md:hidden w-8 h-8 rounded-full overflow-hidden border border-border">
                <img src={user?.avatar} alt="User" className="w-full h-full object-cover" />
            </div>
        </div>
      </div>
    </div>
  );
};
