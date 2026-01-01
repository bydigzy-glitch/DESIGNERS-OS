
import React from 'react';
import { ViewMode, User, AppNotification, AutopilotMode } from '../types';
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
  HelpCircle
} from 'lucide-react';
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
  autopilotMode: AutopilotMode;
  onChangeAutopilotMode: (mode: AutopilotMode) => void;
  onOpenBrain: () => void;
  pendingApprovalsCount: number;
  riskAlertsCount: number;
}

const NAV_ITEMS: { id: ViewMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'COMMAND_CENTER', label: 'Command Center', icon: <LayoutGrid size={18} />, description: 'Your daily focus and system status' },
  { id: 'CLIENTS', label: 'Clients', icon: <Users size={18} />, description: 'Client management and scoring' },
  { id: 'WORK', label: 'Work', icon: <Briefcase size={18} />, description: 'Projects and tasks unified' },
  { id: 'TIME', label: 'Time', icon: <Clock size={18} />, description: 'Calendar and time protection' },
  { id: 'MONEY', label: 'Money', icon: <DollarSign size={18} />, description: 'Finances and forecasting' },
];

const SECONDARY_ITEMS: { id: ViewMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'FILES', label: 'Assets', icon: <FolderOpen size={18} />, description: 'File storage and management' },
];

const MODE_CONFIG: Record<AutopilotMode, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  ASSIST: {
    label: 'Assist',
    icon: <HelpCircle size={14} />,
    color: 'text-blue-400',
    description: 'Suggests actions, never acts alone'
  },
  CONFIDENT: {
    label: 'Confident',
    icon: <Zap size={14} />,
    color: 'text-primary',
    description: 'Acts + notifies, you can override'
  },
  STRICT: {
    label: 'Strict',
    icon: <Shield size={14} />,
    color: 'text-orange-400',
    description: 'Enforces rules automatically'
  },
};

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  user,
  notifications,
  onMarkRead,
  onClearAll,
  autopilotMode,
  onChangeAutopilotMode,
  onOpenBrain,
  pendingApprovalsCount,
  riskAlertsCount
}) => {
  const modeConfig = MODE_CONFIG[autopilotMode];
  const hasAlerts = pendingApprovalsCount > 0 || riskAlertsCount > 0;

  return (
    <TooltipProvider delayDuration={300}>
      {/* DESKTOP SIDEBAR */}
      <nav className="hidden md:flex flex-col w-64 h-full bg-background border-r border-border p-4 justify-between flex-shrink-0 z-50">
        <div>
          {/* Logo & Mode */}
          <div className="flex items-center justify-between mb-8 px-2 py-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-calm-pulse">
                <Hexagon size={20} className="text-white" strokeWidth={3} />
              </div>
              <div>
                <span className="block text-sm font-bold text-foreground tracking-tight leading-none mb-1">Designers Hub</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none">V2.0.0</span>
              </div>
            </div>
          </div>

          {/* Autopilot Mode Selector */}
          <div className="mb-6 px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-xs h-9 border-dashed"
                >
                  <span className="flex items-center gap-2">
                    <span className={modeConfig.color}>{modeConfig.icon}</span>
                    <span>Mode: {modeConfig.label}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Autopilot Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(MODE_CONFIG).map(([mode, config]) => (
                  <DropdownMenuItem
                    key={mode}
                    onClick={() => onChangeAutopilotMode(mode as AutopilotMode)}
                    className={autopilotMode === mode ? 'bg-secondary' : ''}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className={config.color}>{config.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{config.label}</div>
                        <div className="text-[10px] text-muted-foreground">{config.description}</div>
                      </div>
                      {autopilotMode === mode && <span className="text-primary">✓</span>}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Primary Nav Items */}
          <div className="space-y-1">
            {NAV_ITEMS.map(item => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentView === item.id ? "secondary" : "ghost"}
                    onClick={() => onNavigate(item.id)}
                    className="w-full justify-start gap-4 relative h-10 px-3"
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                    {/* Alert badge for Command Center */}
                    {item.id === 'COMMAND_CENTER' && hasAlerts && (
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
                variant="outline"
                onClick={onOpenBrain}
                className="w-full justify-start gap-4 border-primary/20 hover:border-primary/40 hover:bg-primary/5 group h-10 px-3"
              >
                <Brain size={18} className="text-primary animate-calm-pulse" />
                <span className="text-primary font-bold text-sm tracking-wide">Ask Brain</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>AI assistant with system authority</p>
            </TooltipContent>
          </Tooltip>

          {/* Secondary Nav Items */}
          <div className="mt-4 space-y-1">
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
                <div className="text-sm font-bold text-foreground truncate">{user?.name}</div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest truncate">{user?.isGuest ? 'Guest Access' : 'Profile'}</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM DOCK */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-[68px] bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 flex items-center justify-around px-4">
        {/* Command Center */}
        <Button
          variant={currentView === 'COMMAND_CENTER' ? "default" : "ghost"}
          onClick={() => onNavigate('COMMAND_CENTER')}
          className="flex flex-col items-center justify-center gap-1 h-auto py-3 relative"
        >
          <LayoutGrid size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">HQ</span>
          {hasAlerts && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>

        {/* Work */}
        <Button
          variant={currentView === 'WORK' ? "default" : "ghost"}
          onClick={() => onNavigate('WORK')}
          className="flex flex-col items-center justify-center gap-1 h-auto py-3"
        >
          <Briefcase size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">WORK</span>
        </Button>

        {/* Brain */}
        <Button
          variant="ghost"
          onClick={onOpenBrain}
          className="flex flex-col items-center justify-center gap-1 h-auto py-3 text-primary"
        >
          <Brain size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">BRAIN</span>
        </Button>

        {/* Time */}
        <Button
          variant={currentView === 'TIME' ? "default" : "ghost"}
          onClick={() => onNavigate('TIME')}
          className="flex flex-col items-center justify-center gap-1 h-auto py-3"
        >
          <Clock size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">TIME</span>
        </Button>
      </nav>
    </TooltipProvider >
  );
};
