
import React, { useMemo } from 'react';
import {
    Task,
    Project,
    Client,
    ApprovalRequest,
    RiskAlert,
    HandledAction,
    AutopilotMode
} from '../types';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    Brain,
    Zap,
    Shield,
    HelpCircle,
    Check,
    X,
    ChevronRight,
    Flame,
    DollarSign,
    AlertCircle,
    Calendar,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from './common/AnimatedComponents';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface CommandCenterProps {
    user: { name: string } | null;
    tasks: Task[];
    projects: Project[];
    clients: Client[];
    pendingApprovals: ApprovalRequest[];
    riskAlerts: RiskAlert[];
    handledToday: HandledAction[];
    autopilotMode: AutopilotMode;
    onOpenBrain: () => void;
    onApprove: (approval: ApprovalRequest) => void;
    onReject: (approval: ApprovalRequest) => void;
    onAcknowledgeRisk: (alert: RiskAlert) => void;
    onTaskClick: (task: Task) => void;
    onProjectClick: (project: Project) => void;
    onOpenIntake: () => void;
}

const MODE_CONFIG: Record<AutopilotMode, { label: string; icon: React.ReactNode; color: string }> = {
    ASSIST: { label: 'Assist', icon: <HelpCircle size={14} />, color: 'text-blue-400' },
    CONFIDENT: { label: 'Confident', icon: <Zap size={14} />, color: 'text-primary' },
    STRICT: { label: 'Strict', icon: <Shield size={14} />, color: 'text-orange-400' },
};

const URGENCY_COLORS = {
    LOW: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    MEDIUM: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    HIGH: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const SEVERITY_COLORS = {
    INFO: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    WARNING: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const SEVERITY_ICONS = {
    INFO: <AlertCircle size={16} />,
    WARNING: <AlertTriangle size={16} />,
    CRITICAL: <Flame size={16} />,
};

export const CommandCenter: React.FC<CommandCenterProps> = ({
    user,
    tasks,
    projects,
    clients,
    pendingApprovals,
    riskAlerts,
    handledToday,
    autopilotMode,
    onOpenBrain,
    onApprove,
    onReject,
    onAcknowledgeRisk,
    onTaskClick,
    onProjectClick,
    onOpenIntake,
}) => {
    const modeConfig = MODE_CONFIG[autopilotMode];
    const firstName = user?.name?.split(' ')[0] || 'Designer';

    // Calculate Today's Focus - max 3 most urgent items
    const todaysFocus = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        // Get overdue tasks
        const overdueTasks = tasks.filter(t =>
            !t.completed && new Date(t.date) < now
        ).map(t => ({ type: 'OVERDUE' as const, task: t, priority: 100 }));

        // Get today's tasks
        const todayTasks = tasks.filter(t => {
            const taskDate = new Date(t.date);
            return !t.completed && taskDate >= today && taskDate < tomorrow;
        }).map(t => ({
            type: 'TODAY' as const,
            task: t,
            priority: t.priority === 'HIGH' ? 80 : t.priority === 'MEDIUM' ? 50 : 30
        }));

        // Get pending approvals as focus items
        const approvalFocus = pendingApprovals
            .slice(0, 1)
            .map(a => ({ type: 'APPROVAL' as const, approval: a, priority: 90 }));

        // Get critical risks as focus items
        const criticalRisks = riskAlerts
            .filter(r => r.severity === 'CRITICAL' && !r.acknowledged)
            .slice(0, 1)
            .map(r => ({ type: 'RISK' as const, risk: r, priority: 95 }));

        return [...overdueTasks, ...todayTasks, ...approvalFocus, ...criticalRisks]
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 3);
    }, [tasks, pendingApprovals, riskAlerts]);

    // Active risks (unacknowledged)
    const activeRisks = riskAlerts.filter(r => !r.acknowledged);

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-col h-full w-full space-y-6 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2">

                {/* Header */}
                <FadeIn>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">
                                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {todaysFocus.length === 0
                                    ? "You're all caught up. The system is handling things."
                                    : `${todaysFocus.length} item${todaysFocus.length > 1 ? 's' : ''} need${todaysFocus.length === 1 ? 's' : ''} your attention.`
                                }
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={onOpenIntake}
                                variant="outline"
                                className="gap-2 border-green-500/30 hover:border-green-500/50 text-green-500"
                            >
                                <Zap size={16} />
                                <span className="hidden md:inline">New Intake</span>
                            </Button>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-xs font-medium ${modeConfig.color}`}>
                                {modeConfig.icon}
                                <span>Mode: {modeConfig.label}</span>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={onOpenBrain}
                                        variant="outline"
                                        className="gap-2 border-primary/30 hover:border-primary/50 text-primary"
                                    >
                                        <Brain size={16} />
                                        <span className="hidden md:inline">Ask Brain</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Get AI assistance with decisions</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </FadeIn>

                {/* TODAY'S FOCUS - Hero Section */}
                <FadeIn delay={0.1}>
                    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                Today's Focus
                                <span className="text-xs text-muted-foreground font-normal ml-2">(max 3 auto-selected)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {todaysFocus.length === 0 ? (
                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                    <CheckCircle2 size={20} className="mr-2 text-green-500" />
                                    <span>Nothing urgent. Enjoy your calm day.</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {todaysFocus.map((item, idx) => {
                                        if (item.type === 'OVERDUE' || item.type === 'TODAY') {
                                            const task = item.task;
                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => onTaskClick(task)}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${item.type === 'OVERDUE' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                                                            }`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                                {task.title}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                                <Clock size={10} />
                                                                {item.type === 'OVERDUE' ? (
                                                                    <span className="text-red-500">Overdue</span>
                                                                ) : (
                                                                    new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                )}
                                                                {task.priority && (
                                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                        {task.priority}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            );
                                        }
                                        if (item.type === 'APPROVAL') {
                                            const approval = item.approval;
                                            return (
                                                <div
                                                    key={approval.id}
                                                    className={`flex items-center justify-between p-4 rounded-xl bg-card border ${URGENCY_COLORS[approval.urgency]}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                                            <AlertCircle size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground">{approval.title}</div>
                                                            <div className="text-xs text-muted-foreground mt-0.5">Needs your decision</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline" onClick={() => onReject(approval)}>
                                                            <X size={14} />
                                                        </Button>
                                                        <Button size="sm" onClick={() => onApprove(approval)}>
                                                            <Check size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (item.type === 'RISK') {
                                            const risk = item.risk;
                                            return (
                                                <div
                                                    key={risk.id}
                                                    className={`flex items-center justify-between p-4 rounded-xl bg-card border ${SEVERITY_COLORS[risk.severity]}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${risk.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                                                            }`}>
                                                            {SEVERITY_ICONS[risk.severity]}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground">{risk.title}</div>
                                                            <div className="text-xs text-muted-foreground mt-0.5">{risk.message}</div>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" variant="ghost" onClick={() => onAcknowledgeRisk(risk)}>
                                                        Dismiss
                                                    </Button>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </FadeIn>

                {/* System status remains integrated into the top bar alerts and brain sidebar */}

                {/* Quick Stats Row */}
                <FadeIn delay={0.5}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {tasks.filter(t => !t.completed && new Date(t.date).toDateString() === new Date().toDateString()).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Tasks Today</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <User size={18} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {clients.filter(c => c.status === 'ACTIVE').length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Active Clients</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {projects.filter(p => p.status === 'ACTIVE').length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Active Projects</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                    <DollarSign size={18} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">
                                        ${projects.filter(p => p.status === 'ACTIVE').reduce((s, p) => s + (p.price || 0), 0).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Pipeline Value</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </FadeIn>
            </div>
        </TooltipProvider>
    );
};
