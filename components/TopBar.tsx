import React, { useState, useEffect, useRef } from 'react';
import {
    Search, Moon, Sun, Bell, Coins, Menu, X,
    Briefcase, Flame, Layers, FolderOpen, Settings,
    LogOut, User as UserIcon, Sparkles,
    CheckSquare, Users, FileText, Zap, ChevronRight, CornerDownLeft
} from 'lucide-react';
import { User, AppNotification, ViewMode, Task, Project, Client, FileAsset } from '../types';
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
    onOpenAI?: () => void;
    tasks?: Task[];
    projects?: Project[];
    clients?: Client[];
    files?: FileAsset[];
}

type SearchResult = {
    id: string;
    type: 'TASK' | 'PROJECT' | 'CLIENT' | 'FILE' | 'ACTION';
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    view?: ViewMode;
    action?: () => void;
};

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
    currentView,
    onOpenAI,
    tasks,
    projects,
    clients,
    files
}) => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Command + K listener
    useEffect(() => {
        const handleDown = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        document.addEventListener("keydown", handleDown);
        return () => document.removeEventListener("keydown", handleDown);
    }, []);

    const mobileMenuItems = [
        { id: 'MANAGER' as ViewMode, label: 'Manager', icon: <Briefcase size={20} /> },
        { id: 'HABITS' as ViewMode, label: 'Habits', icon: <Flame size={20} /> },
        { id: 'APPS' as ViewMode, label: 'Apps', icon: <Layers size={20} /> },
        { id: 'FILES' as ViewMode, label: 'Files', icon: <FolderOpen size={20} /> },
        { id: 'SETTINGS' as ViewMode, label: 'Settings', icon: <Settings size={20} /> },
    ];

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            setSelectedIndex(-1);
            return;
        }

        const q = query.toLowerCase();
        const results: SearchResult[] = [];

        // Search Tasks
        tasks?.filter(t => t.title.toLowerCase().includes(q)).slice(0, 3).forEach(t => {
            results.push({
                id: `task-${t.id}`,
                type: 'TASK',
                title: t.title,
                subtitle: t.category || 'Task',
                icon: <CheckSquare size={14} className="text-blue-500" />,
                view: 'WORK'
            });
        });

        // Search Projects
        projects?.filter(p => p.title.toLowerCase().includes(q)).slice(0, 3).forEach(p => {
            results.push({
                id: `project-${p.id}`,
                type: 'PROJECT',
                title: p.title,
                subtitle: `Project: ${p.status}`,
                icon: <Briefcase size={14} className="text-purple-500" />,
                view: 'WORK'
            });
        });

        // Search Clients
        clients?.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3).forEach(c => {
            results.push({
                id: `client-${c.id}`,
                type: 'CLIENT',
                title: c.name,
                subtitle: `Client: ${c.status}`,
                icon: <Users size={14} className="text-orange-500" />,
                view: 'CLIENTS'
            });
        });

        // Search Files
        files?.filter(f => f.name.toLowerCase().includes(q)).slice(0, 3).forEach(f => {
            results.push({
                id: `file-${f.id}`,
                type: 'FILE',
                title: f.name,
                subtitle: `File: ${f.type}`,
                icon: <FileText size={14} className="text-emerald-500" />,
                view: 'FILES'
            });
        });

        // Smart Actions
        if ('settings'.includes(q)) {
            results.push({
                id: 'action-settings',
                type: 'ACTION',
                title: 'Open Settings',
                subtitle: 'Customize preferences',
                icon: <Settings size={14} className="text-muted-foreground" />,
                view: 'SETTINGS'
            });
        }
        if ('dark mode'.includes(q) || 'light mode'.includes(q) || 'theme'.includes(q)) {
            results.push({
                id: 'action-theme',
                type: 'ACTION',
                title: 'Toggle Theme',
                subtitle: 'Switch light/dark/uber',
                icon: <Sparkles size={14} className="text-primary" />,
                action: onToggleTheme
            });
        }

        setSearchResults(results);
        setSelectedIndex(results.length > 0 ? 0 : -1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isSearchFocused || searchResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelectResult(searchResults[selectedIndex]);
        } else if (e.key === 'Escape') {
            setIsSearchFocused(false);
        }
    };

    const handleSelectResult = (result: SearchResult) => {
        if (result.action) {
            result.action();
        } else if (result.view && onNavigate) {
            onNavigate(result.view);
        }
        setSearchQuery('');
        setSearchResults([]);
        setIsSearchFocused(false);
    };

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

                    <div className="flex-1 max-w-xl relative">
                        <div className="relative group">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}`} size={16} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search tasks, projects, or use '⌘K'..."
                                className="w-full h-10 bg-secondary/50 rounded-xl pl-10 pr-12 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all placeholder:text-muted-foreground border border-transparent focus:border-border"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {searchQuery ? (
                                    <button
                                        onClick={() => handleSearch('')}
                                        className="text-muted-foreground hover:text-foreground"
                                        title="Clear search"
                                    >
                                        <X size={14} />
                                    </button>
                                ) : (
                                    <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-bold text-muted-foreground opacity-50">
                                        <span>⌘</span>
                                        <span>K</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search Results Dropdown */}
                        {isSearchFocused && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                                    {searchQuery.length < 2 ? (
                                        <div className="py-2">
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/30 rounded-lg mb-1 mx-1">
                                                Quick Navigation
                                            </div>
                                            {[
                                                { id: 'nav-hq', type: 'ACTION', title: 'Dashboard', subtitle: 'View system oversight', icon: <Layers size={14} />, view: 'HQ' as ViewMode },
                                                { id: 'nav-work', type: 'ACTION', title: 'Projects & Tasks', subtitle: 'Manage your workload', icon: <Briefcase size={14} />, view: 'WORK' as ViewMode },
                                                { id: 'nav-money', type: 'ACTION', title: 'Financials', subtitle: 'Track revenue and costs', icon: <Coins size={14} />, view: 'MONEY' as ViewMode },
                                                { id: 'nav-files', type: 'ACTION', title: 'Asset Manager', subtitle: 'Access files and folders', icon: <FolderOpen size={14} />, view: 'FILES' as ViewMode },
                                            ].map((action, idx) => (
                                                <div
                                                    key={action.id}
                                                    onClick={() => handleSelectResult(action as SearchResult)}
                                                    onMouseEnter={() => setSelectedIndex(idx)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${idx === selectedIndex ? 'bg-primary/10 border-primary/20' : 'hover:bg-secondary/50 border-transparent'} border mx-1`}
                                                >
                                                    <div className={`p-2 rounded-lg ${idx === selectedIndex ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                                                        {action.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-bold ${idx === selectedIndex ? 'text-primary' : 'text-foreground'}`}>{action.title}</p>
                                                        <p className="text-[10px] text-muted-foreground">{action.subtitle}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map((result, index) => (
                                            <div
                                                key={result.id}
                                                onClick={() => handleSelectResult(result)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${index === selectedIndex ? 'bg-primary/10 border-primary/20 shadow-sm' : 'hover:bg-secondary/50 border-transparent'} border mb-1 mx-1`}
                                            >
                                                <div className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                                                    {result.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${index === selectedIndex ? 'text-primary' : 'text-foreground'}`}>
                                                        {result.title}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                                        {result.subtitle}
                                                    </p>
                                                </div>
                                                {index === selectedIndex && (
                                                    <div className="flex items-center gap-1.5 opacity-60">
                                                        <CornerDownLeft size={10} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                                            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground mb-4">
                                                <Search size={24} />
                                            </div>
                                            <p className="text-sm font-bold text-foreground mb-1">No matches found</p>
                                            <p className="text-xs text-muted-foreground">Try searching for tasks, projects, or settings.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-2.5 bg-secondary/30 border-t border-border flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                            <div className="flex bg-background rounded border border-border shadow-sm divide-x divide-border">
                                                <div className="p-0.5"><ChevronRight size={10} className="rotate-90" /></div>
                                                <div className="p-0.5"><ChevronRight size={10} className="-rotate-90" /></div>
                                            </div>
                                            Select
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                            <div className="px-1 py-0.5 bg-background rounded border border-border shadow-sm">Esc</div>
                                            Close
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground/60 font-medium italic">
                                        {searchQuery.length < 2 ? 'Quick navigation menu' : `Found ${searchResults.length} smart matches`}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">

                        {/* Assist AI Button */}
                        {onOpenAI && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={onOpenAI}
                                        className="gap-2 border-primary/30 hover:border-primary/50 bg-primary/5 hover:bg-primary/10"
                                    >
                                        <Sparkles size={16} className="text-primary" />
                                        <span className="hidden sm:inline text-xs font-bold text-primary">Assist</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Open AI Assistant</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

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
                                    <Sun className={`h-5 w-5 transition-all ${user?.preferences.theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
                                    <Moon className={`absolute h-5 w-5 transition-all ${user?.preferences.theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
                                    <Sparkles className={`absolute h-5 w-5 transition-all ${user?.preferences.theme === 'uber' ? 'rotate-0 scale-100' : 'rotate-90 scale-0 text-primary'}`} />
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
                                                                title="Accept invitation"
                                                                className="flex-1 px-3 py-1.5 text-[10px] font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onTeamInviteResponse(n.actionData!.teamId, false, n.id);
                                                                }}
                                                                title="Decline invitation"
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
