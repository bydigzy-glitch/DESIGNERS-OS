


import React, { useState } from 'react';
import { Search, Moon, Sun, Bell, Coins, Menu, X, Briefcase, Flame, Layers, FolderOpen, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { User, AppNotification, ViewMode } from '../types';
import { CountUp } from './common/AnimatedComponents';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface TopBarProps {
    user: User | null;
    notifications: AppNotification[];
    onToggleTheme: () => void;
    onToggleNotifications: () => void;
    showNotificationsDropdown: boolean;
    onClearNotifications: () => void;
    onMarkNotificationRead: (id: string) => void;
    onTeamInviteResponse?: (teamId: string, accept: boolean, notificationId: string) => void;
    onNavigate?: (view: ViewMode) => void;
    currentView?: ViewMode;
}

export const TopBar: React.FC<TopBarProps> = ({
    user,
    notifications,
    onToggleTheme,
    onToggleNotifications,
    showNotificationsDropdown,
    onClearNotifications,
    onMarkNotificationRead,
    onTeamInviteResponse,
    onNavigate,
    currentView
}) => {
    const unreadCount = notifications.filter(n => !n.read).length;
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const mobileMenuItems = [
        { id: 'MANAGER' as ViewMode, label: 'Manager', icon: <Briefcase size={20} /> },
        { id: 'HABITS' as ViewMode, label: 'Habits', icon: <Flame size={20} /> },
        { id: 'APPS' as ViewMode, label: 'Apps', icon: <Layers size={20} /> },
        { id: 'FILES' as ViewMode, label: 'Files', icon: <FolderOpen size={20} /> },
        { id: 'SETTINGS' as ViewMode, label: 'Settings', icon: <Settings size={20} /> },
    ];

    return (
        <TooltipProvider delayDuration={300}>
            <div className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border transition-all duration-300">
                <div className="flex items-center justify-between px-6 py-3 gap-4">

                    {/* Mobile Hamburger Menu */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="md:hidden"
                            >
                                {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{showMobileMenu ? 'Close menu' : 'Open menu'}</p>
                        </TooltipContent>
                    </Tooltip>

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

                        {/* User Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2">
                                    <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-lg border border-primary/20 text-primary">
                                        <Coins size={14} fill="currentColor" />
                                        <span className="text-xs font-bold font-mono tracking-tight">
                                            <CountUp value={user?.tokens || 0} duration={0.5} decimals={1} />
                                        </span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <UserIcon size={16} className="text-primary" />
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{user?.name || 'User'}</span>
                                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="flex items-center gap-2">
                                    <Coins size={14} />
                                    <span className="flex-1">Tokens</span>
                                    <span className="text-xs font-mono font-bold text-primary">
                                        {(user?.tokens || 0).toFixed(1)}
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onNavigate?.('SETTINGS')} className="flex items-center gap-2">
                                    <Settings size={14} />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="flex items-center gap-2 text-destructive focus:text-destructive">
                                    <LogOut size={14} />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Theme Toggle */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onToggleTheme}
                                    className="relative"
                                >
                                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle theme</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Notifications */}
                        <div className="relative">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onToggleNotifications}
                                        className="relative"
                                    >
                                        <Bell size={20} />
                                        {notifications.filter(n => !n.read).length > 0 && (
                                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{notifications.filter(n => !n.read).length > 0 ? `${notifications.filter(n => !n.read).length} new notifications` : 'No new notifications'}</p>
                                </TooltipContent>
                            </Tooltip>
                            {showNotificationsDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[60] flex flex-col max-h-[400px]">
                                    <div className="p-3 border-b border-border flex justify-between items-center bg-secondary/50">
                                        <span className="text-xs font-bold text-foreground">Activity</span>
                                        {notifications.length > 0 && (
                                            <Button variant="link" onClick={onClearNotifications} className="text-[10px] p-0 h-auto">Clear All</Button>
                                        )}
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                                        {notifications.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground text-xs">No new notifications</div>
                                        ) : (
                                            notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map(n => (
                                                <div key={n.id} className={`p-3 rounded-xl border transition-colors flex flex-col gap-2 ${n.read ? 'bg-transparent border-transparent opacity-60' : 'bg-secondary/30 border-border hover:bg-secondary/50'}`}>
                                                    <div onClick={() => onMarkNotificationRead(n.id)} className="cursor-pointer flex flex-col gap-1">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-xs font-bold text-foreground">{n.title}</span>
                                                            <span className="text-[9px] text-muted-foreground">{n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-relaxed">{n.message}</p>
                                                    </div>

                                                    {/* Team Invite Actions */}
                                                    {n.actionData?.type === 'TEAM_INVITE' && !n.read && onTeamInviteResponse && (
                                                        <div className="flex gap-2 mt-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onTeamInviteResponse(n.actionData!.teamId, true, n.id);
                                                                }}
                                                                className="flex-1 px-3 py-1.5 text-[10px] font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onTeamInviteResponse(n.actionData!.teamId, false, n.id);
                                                                }}
                                                                className="flex-1 px-3 py-1.5 text-[10px] font-bold bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors border border-border"
                                                            >
                                                                Decline
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile User Avatar */}
                        <button
                            onClick={() => onNavigate?.('SETTINGS')}
                            className="md:hidden w-8 h-8 rounded-full overflow-hidden border border-border hover:border-primary transition-colors"
                        >
                            <img src={user?.avatar} alt="User" className="w-full h-full object-cover" />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {showMobileMenu && onNavigate && (
                    <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
                        <div className="p-4 space-y-2">
                            {mobileMenuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onNavigate(item.id);
                                        setShowMobileMenu(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                                        }`}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
};
