
import React from 'react';
import { cn } from '@/lib/utils';
import { ViewMode, User, AppNotification } from '../types';
import {
  LayoutGrid,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  FolderOpen,
  Settings,
  Hexagon,
  Brain,
  Zap,
  Shield,
  Grid,
} from 'lucide-react';
import { Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  user: User | null;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;

  onOpenAI?: () => void;
  pendingApprovalsCount: number;
  riskAlertsCount: number;
}

const NAV_ITEMS: { id: ViewMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'HQ', label: 'Dashboard', icon: <LayoutGrid size={18} />, description: 'Your daily focus and system status' },
  { id: 'CLIENTS', label: 'Clients', icon: <Users size={18} />, description: 'Client management and scoring' },
  { id: 'WORK', label: 'Projects', icon: <Briefcase size={18} />, description: 'Projects and tasks unified' },
  { id: 'CALENDAR', label: 'Calendar', icon: <Clock size={18} />, description: 'Calendar and time protection' },
  { id: 'MONEY', label: 'Finance', icon: <DollarSign size={18} />, description: 'Revenue and financial overview' },
];

const SECONDARY_ITEMS: { id: ViewMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'APPS', label: 'Apps', icon: <Grid size={18} />, description: 'Tools and utilities' },
  { id: 'FILES', label: 'Assets', icon: <FolderOpen size={18} />, description: 'File storage and management' },
];


export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  user,
  notifications,
  onMarkRead,
  onClearAll,

  onOpenAI,
  pendingApprovalsCount,
  riskAlertsCount
}) => {
  const hasAlerts = pendingApprovalsCount > 0 || riskAlertsCount > 0;

  return (
    <TooltipProvider delayDuration={300}>
      {/* DESKTOP SIDEBAR */}
      <nav className="hidden md:flex flex-col w-64 h-full bg-background border-r border-border p-4 justify-between flex-shrink-0 z-[var(--z-overlay)]">
        <div>
          {/* Logo & Mode */}
          <div className="flex items-center justify-between mb-8 px-2 py-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-calm-pulse">
                <Hexagon size={20} className="text-white" strokeWidth={3} />
              </div>
              <div>
                <span className="block text-body-emphasis leading-none mb-1 text-foreground font-bold italic tracking-tighter">DESIGNERS OS</span>
                <span className="text-overline opacity-40 leading-none">V3.2.0</span>
              </div>
            </div>
          </div>


          {/* Primary Nav Items */}
          <div className="space-y-2">
            {NAV_ITEMS.map(item => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentView === item.id ? "secondary" : "ghost"}
                    onClick={() => onNavigate(item.id)}
                    className="w-full justify-start gap-4 relative h-10 px-3"
                  >
                    {item.icon}
                    <span className="text-body-emphasis">{item.label}</span>
                    {/* Alert badge for HQ */}
                    {item.id === 'HQ' && hasAlerts && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Brain Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === 'BRAIN' ? "secondary" : "outline"}
                onClick={() => onNavigate('BRAIN')}
                className={cn(
                  "w-full justify-start gap-4 border-primary/20 hover:border-primary/40 hover:bg-primary/5 group h-10 px-3 transition-all duration-300",
                  currentView === 'BRAIN' && "border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                )}
              >
                <Brain size={18} className={cn("text-primary", currentView === 'BRAIN' ? "animate-pulse" : "animate-calm-pulse")} />
                <span className="text-primary text-body-emphasis tracking-wide font-bold">Ask Brain</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>AI assistant with system authority</p>
            </TooltipContent>
          </Tooltip>

          {/* AI Command Button */}
          {onOpenAI && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={onOpenAI}
                  className="w-full justify-start gap-4 text-muted-foreground hover:text-foreground h-10 px-3 group"
                >
                  <Sparkles size={18} className="group-hover:text-primary transition-colors" />
                  <span className="text-body font-medium">AI Actions</span>
                  <span className="ml-auto text-overline opacity-40 bg-secondary px-1.5 py-0.5 rounded">⌘K</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Summarize, generate, rewrite, and more</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Secondary Nav Items */}
          <div className="mt-4 space-y-2">
            {SECONDARY_ITEMS.map(item => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentView === item.id ? "secondary" : "ghost"}
                    onClick={() => onNavigate(item.id)}
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === 'SETTINGS' ? "secondary" : "ghost"}
                onClick={() => onNavigate('SETTINGS')}
                className="w-full justify-start gap-4 h-10 px-3"
              >
                <Settings size={18} />
                <span className="text-sm font-medium">Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Customize preferences and autopilot rules</p>
            </TooltipContent>
          </Tooltip>

          <div className="pt-4 mt-2 border-t border-border">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/20 border border-transparent hover:border-border transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden ring-1 ring-border shadow-sm">
                <img src={user?.avatar} alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-body-emphasis truncate">{user?.name}</div>
                <div className="text-overline opacity-40 truncate">{user?.isGuest ? 'Guest Access' : 'Profile'}</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM DOCK */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-[68px] bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-[var(--z-overlay)] flex items-center justify-around px-4">
        {/* HQ */}
        <Button
          variant={currentView === 'HQ' ? "default" : "ghost"}
          onClick={() => onNavigate('HQ')}
          className="flex flex-col items-center justify-center gap-1 h-auto py-3 relative"
        >
          <LayoutGrid size={20} />
          <span className="text-overline">HQ</span>
          {hasAlerts && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>

        {/* Projects */}
        <Button
          variant={currentView === 'WORK' ? "default" : "ghost"}
          onClick={() => onNavigate('WORK')}
          className="flex flex-col items-center justify-center gap-1 h-auto py-3"
        >
          <Briefcase size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">PROJECTS</span>
        </Button>

        {/* Brain */}
        <Button
          variant={currentView === 'BRAIN' ? "secondary" : "ghost"}
          onClick={() => onNavigate('BRAIN')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-auto py-3 text-primary transition-all",
            currentView === 'BRAIN' && "bg-primary/10"
          )}
        >
          <Brain size={20} className={currentView === 'BRAIN' ? "animate-pulse" : ""} />
          <span className="text-overline font-bold">BRAIN</span>
        </Button>

        {/* Calendar */}
        <Button
          variant={currentView === 'CALENDAR' ? "default" : "ghost"}
          onClick={() => onNavigate('CALENDAR')}
          className="flex flex-col items-center justify-center gap-1 h-auto py-3"
        >
          <Clock size={20} />
          <span className="text-overline">CALENDAR</span>
        </Button>
      </nav>
    </TooltipProvider >
  );
};
