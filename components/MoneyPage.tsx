
import React, { useMemo } from 'react';
import { Project, Client } from '../types';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Clock,
    Calendar,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    CreditCard,
    AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface MoneyPageProps {
    projects: Project[];
    clients: Client[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MoneyPage: React.FC<MoneyPageProps> = ({
    projects,
    clients,
}) => {
    // Calculate financial stats
    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const next60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        const next90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        // Completed projects = earned income
        const completedProjects = projects.filter(p => p.status === 'COMPLETED');
        const totalEarned = completedProjects.reduce((s, p) => s + (p.price || 0), 0);

        // Active projects = pipeline
        const activeProjects = projects.filter(p => p.status === 'ACTIVE' || p.status === 'REVISION');
        const pipelineValue = activeProjects.reduce((s, p) => s + (p.price || 0), 0);

        // Forecasting based on deadlines
        const forecast30 = activeProjects
            .filter(p => p.deadline && new Date(p.deadline) <= next30)
            .reduce((s, p) => s + (p.price || 0), 0);
        const forecast60 = activeProjects
            .filter(p => p.deadline && new Date(p.deadline) > next30 && new Date(p.deadline) <= next60)
            .reduce((s, p) => s + (p.price || 0), 0);
        const forecast90 = activeProjects
            .filter(p => p.deadline && new Date(p.deadline) > next60 && new Date(p.deadline) <= next90)
            .reduce((s, p) => s + (p.price || 0), 0);

        // Overdue invoices (simplified - projects past deadline but not completed)
        const overdueProjects = projects.filter(p =>
            p.status === 'ACTIVE' &&
            p.deadline &&
            new Date(p.deadline) < now &&
            p.invoiceStatus !== 'PAID'
        );
        const overdueAmount = overdueProjects.reduce((s, p) => s + (p.price || 0), 0);

        // Average project value
        const avgProjectValue = projects.length > 0
            ? Math.round(projects.reduce((s, p) => s + (p.price || 0), 0) / projects.length)
            : 0;

        // Monthly expenses estimate (30% of income)
        const estimatedExpenses = Math.round(totalEarned * 0.3);
        const safeToSpend = Math.max(0, totalEarned - estimatedExpenses - (pipelineValue * 0.2));

        // Income by client type
        const incomeByClient: { name: string; amount: number; color: string }[] = clients
            .map(c => ({
                name: c.name,
                amount: projects.filter(p => p.clientId === c.id).reduce((s, p) => s + (p.price || 0), 0),
                color: `hsl(210, 70%, 50%)` // Standardized to a blue hue for consistency
            }))
            .filter(c => c.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        return {
            totalEarned,
            pipelineValue,
            forecast30,
            forecast60,
            forecast90,
            overdueAmount,
            overdueProjects,
            avgProjectValue,
            estimatedExpenses,
            safeToSpend,
            incomeByClient,
            activeProjects
        };
    }, [projects, clients]);

    // Check for pricing warnings
    const pricingWarnings = useMemo(() => {
        const warnings: string[] = [];

        if (stats.avgProjectValue < 500) {
            warnings.push("Average project value is low. Consider raising your rates.");
        }

        if (stats.overdueAmount > 0) {
            warnings.push(`$${stats.overdueAmount.toLocaleString()} in overdue payments needs attention.`);
        }

        if (stats.forecast30 === 0 && stats.pipelineValue > 0) {
            warnings.push("No projects due in the next 30 days. Check your timelines.");
        }

        return warnings;
    }, [stats]);

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-col h-full w-full space-y-6 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2">

                {/* Header */}
                <FadeIn>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Money</h1>
                        <p className="text-sm text-muted-foreground mt-1">Financial reality check, not accounting</p>
                    </div>
                </FadeIn>

                {/* Top Row: Key Metrics */}
                <FadeIn delay={0.1}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Earned */}
                        <Card className="p-6 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Earned</span>
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                    <ArrowUpRight size={20} />
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-foreground mb-2">
                                $<CountUp value={stats.totalEarned} />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                From {projects.filter(p => p.status === 'COMPLETED').length} completed projects
                            </div>
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-10 bg-green-500" />
                        </Card>

                        {/* Pipeline */}
                        <Card className="p-6 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pipeline</span>
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-foreground mb-2">
                                $<CountUp value={stats.pipelineValue} />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {stats.activeProjects.length} active projects
                            </div>
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-10 bg-primary" />
                        </Card>

                        {/* Safe to Spend */}
                        <Card className="p-6 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Safe to Spend</span>
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <Wallet size={20} />
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-foreground mb-2">
                                $<CountUp value={stats.safeToSpend} />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                After taxes & buffer
                            </div>
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-10 bg-blue-500" />
                        </Card>
                    </div>
                </FadeIn>

                {/* Pricing Warnings */}
                {pricingWarnings.length > 0 && (
                    <FadeIn delay={0.15}>
                        <Card className="border-orange-500/30 bg-orange-500/5">
                            <CardContent className="py-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-foreground">Pricing Intelligence</h3>
                                        {pricingWarnings.map((warning, idx) => (
                                            <p key={idx} className="text-sm text-muted-foreground">{warning}</p>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>
                )}

                {/* Forecast + Income by Client */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Income Forecast */}
                    <FadeIn delay={0.2}>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Calendar size={16} />
                                    Income Forecast
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* 30 Days */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">Next 30 days</span>
                                            <span className="font-bold text-foreground">${stats.forecast30.toLocaleString()}</span>
                                        </div>
                                        <Progress value={(stats.forecast30 / (stats.pipelineValue || 1)) * 100} className="h-3" />
                                    </div>

                                    {/* 60 Days */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">30-60 days</span>
                                            <span className="font-bold text-foreground">${stats.forecast60.toLocaleString()}</span>
                                        </div>
                                        <Progress value={(stats.forecast60 / (stats.pipelineValue || 1)) * 100} className="h-3 [&>div]:bg-blue-500" />
                                    </div>

                                    {/* 90 Days */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">60-90 days</span>
                                            <span className="font-bold text-foreground">${stats.forecast90.toLocaleString()}</span>
                                        </div>
                                        <Progress value={(stats.forecast90 / (stats.pipelineValue || 1)) * 100} className="h-3 [&>div]:bg-purple-500" />
                                    </div>

                                    <div className="pt-4 border-t border-border flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Total 90-day forecast</span>
                                        <span className="text-lg font-bold text-foreground">
                                            ${(stats.forecast30 + stats.forecast60 + stats.forecast90).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>

                    {/* Income by Client */}
                    <FadeIn delay={0.3}>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <PieChart size={16} />
                                    Top Clients by Revenue
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {stats.incomeByClient.map((client, idx) => (
                                        <div key={client.name} className="flex items-center gap-3">
                                            <div className="w-6 text-sm font-bold text-muted-foreground">{idx + 1}</div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-medium text-foreground">{client.name}</span>
                                                    <span className="font-mono font-bold">${client.amount.toLocaleString()}</span>
                                                </div>
                                                <Progress
                                                    value={(client.amount / (stats.incomeByClient[0]?.amount || 1)) * 100}
                                                    className="h-1.5"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {stats.incomeByClient.length === 0 && (
                                        <div className="text-center py-6 text-muted-foreground text-sm">
                                            No client revenue data yet
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>
                </div>

                {/* Overdue Payments */}
                {stats.overdueAmount > 0 && (
                    <FadeIn delay={0.4}>
                        <Card className="border-red-500/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-red-500">
                                    <AlertTriangle size={16} />
                                    Overdue Payments
                                    <Badge variant="destructive" className="ml-2">${stats.overdueAmount.toLocaleString()}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {stats.overdueProjects.map(project => {
                                        const client = clients.find(c => c.id === project.clientId);
                                        const daysOverdue = Math.floor((new Date().getTime() - new Date(project.deadline!).getTime()) / (24 * 60 * 60 * 1000));

                                        return (
                                            <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center font-bold text-sm text-red-500">
                                                        {project.title.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">{project.title}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {client?.name || 'Unknown'} • {daysOverdue} days overdue
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono font-bold text-red-500">${(project.price || 0).toLocaleString()}</div>
                                                    <Badge variant="outline" className="text-[10px] text-red-500 border-red-500/30">
                                                        {project.invoiceStatus || 'UNPAID'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>
                )}

                {/* Bottom Stats */}
                <FadeIn delay={0.5}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                    <DollarSign size={18} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">${stats.avgProjectValue.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">Avg Project</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">${stats.estimatedExpenses.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">Est. Expenses</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                    <TrendingUp size={18} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold"><CountUp value={projects.filter(p => p.status === 'COMPLETED').length} /></div>
                                    <div className="text-xs text-muted-foreground">Completed</div>
                                </div>
                            </div>
                        </Card>
                        <Card className={`p-4 ${stats.overdueAmount > 0 ? 'border-red-500/30' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">${stats.overdueAmount.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">Overdue</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </FadeIn>
            </div>
        </TooltipProvider>
    );
};
