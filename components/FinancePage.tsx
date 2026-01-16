
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
    AlertCircle,
    BarChart3,
    Activity,
    CheckCircle2,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import { motion } from 'framer-motion';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface FinancePageProps {
    projects: Project[];
    clients: Client[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const FinancePage: React.FC<FinancePageProps> = ({
    projects,
    clients,
}) => {
    // Calculate financial stats
    const stats = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();

        // Completed projects = earned income
        const completedProjects = projects.filter(p => p.status === 'COMPLETED');
        const totalEarned = completedProjects.reduce((s, p) => s + (p.price || 0), 0);

        // Active projects = pipeline
        const activeProjects = projects.filter(p => p.status === 'ACTIVE' || p.status === 'REVISION');
        const pipelineValue = activeProjects.reduce((s, p) => s + (p.price || 0), 0);

        // Monthly trends (last 6 months)
        const monthlyTrends = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            const monthLabel = MONTHS[d.getMonth()];
            const monthYear = d.getFullYear();
            const monthMonth = d.getMonth();

            const monthlyIncome = completedProjects.filter(p => {
                if (!p.deadline) return false;
                const pDate = new Date(p.deadline);
                return pDate.getMonth() === monthMonth && pDate.getFullYear() === monthYear;
            }).reduce((s, p) => s + (p.price || 0), 0);

            return { label: monthLabel, amount: monthlyIncome };
        });

        // Quarterly data
        const quarterlyData = [
            { label: 'Q1', months: [0, 1, 2] },
            { label: 'Q2', months: [3, 4, 5] },
            { label: 'Q3', months: [6, 7, 8] },
            { label: 'Q4', months: [9, 10, 11] }
        ].map(q => {
            const amount = completedProjects.filter(p => {
                if (!p.deadline) return false;
                const pDate = new Date(p.deadline);
                return pDate.getFullYear() === currentYear && q.months.includes(pDate.getMonth());
            }).reduce((s, p) => s + (p.price || 0), 0);
            return { label: q.label, amount };
        });

        // Current quarter logic
        const currentMonth = now.getMonth();
        const currentQIdx = Math.floor(currentMonth / 3);
        const filteredQuarterlyData = quarterlyData.slice(0, currentQIdx + 1);

        // Overdue invoices
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

        return {
            totalEarned,
            pipelineValue,
            overdueAmount,
            overdueProjects,
            avgProjectValue,
            estimatedExpenses,
            safeToSpend,
            activeProjects,
            monthlyTrends,
            quarterlyData,
            filteredQuarterlyData
        };
    }, [projects, clients]);

    // Graph helper: Max value for scaling
    const maxMonthlyIncome = Math.max(...stats.monthlyTrends.map(d => d.amount), 1000);
    const maxQuarterlyIncome = Math.max(...stats.quarterlyData.map(d => d.amount), 1000);

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-col h-full w-full space-y-6 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2">

                {/* Header */}
                <FadeIn>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Finance</h1>
                        <p className="text-sm text-muted-foreground mt-1">Strategic revenue management and insights</p>
                    </div>
                </FadeIn>

                {/* Top Row: Key Metrics */}
                <FadeIn delay={0.1}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Earned */}
                        <Card className="p-6 relative overflow-hidden group hover:border-green-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Earned</span>
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform">
                                    <ArrowUpRight size={20} />
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-foreground mb-2">
                                $<CountUp value={stats.totalEarned} />
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-green-500" />
                                From {projects.filter(p => p.status === 'COMPLETED').length} settled accounts
                            </div>
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-20 bg-green-500 group-hover:opacity-30 transition-opacity" />
                        </Card>

                        {/* Pipeline */}
                        <Card className="p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pipeline</span>
                                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-foreground mb-2">
                                $<CountUp value={stats.pipelineValue} />
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock size={12} className="text-primary" />
                                {stats.activeProjects.length} projects in progress
                            </div>
                            {/* Enhanced glow effect based on user feedback */}
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-[50px] opacity-30 bg-blue-500 group-hover:opacity-50 transition-all duration-700" />
                        </Card>

                        {/* Safe to Spend */}
                        <Card className="p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Safe to Spend</span>
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                                    <Wallet size={20} />
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-foreground mb-2">
                                $<CountUp value={stats.safeToSpend} />
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Shield size={12} className="text-blue-500" />
                                Post-tax, buffer-adjusted
                            </div>
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-20 bg-blue-500 group-hover:opacity-30 transition-opacity" />
                        </Card>
                    </div>
                </FadeIn>

                {/* Graphs Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Total Income Trend */}
                    <FadeIn delay={0.2}>
                        <Card className="overflow-hidden">
                            <CardHeader className="pb-3 border-b border-border/50">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity size={16} className="text-green-500" />
                                        Monthly Revenue
                                    </CardTitle>
                                    <Badge variant="outline" className="font-mono bg-green-500/5 border-green-500/20 text-green-500">
                                        Last 6 Months
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[200px] w-full flex items-end gap-2 group">
                                    {stats.monthlyTrends.map((d, i) => (
                                        <div key={d.label} className="flex-1 flex flex-col items-center gap-2 group/bar">
                                            <div className="w-full relative flex items-end justify-center group">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${(d.amount / maxMonthlyIncome) * 160}px` }}
                                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                                    className={`w-full max-w-[40px] rounded-t-lg transition-all relative z-10 ${d.amount > 0 ? 'bg-gradient-to-t from-green-500/80 to-green-400 group-hover:from-green-500 group-hover:to-green-300' : 'bg-secondary/30 h-1'
                                                        }`}
                                                />
                                                {/* Tooltip on hover */}
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover border border-border p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 min-w-[80px] text-center">
                                                    <span className="text-[10px] font-bold">${d.amount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{d.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>

                    {/* Quarterly Performance */}
                    <FadeIn delay={0.3}>
                        <Card className="overflow-hidden">
                            <CardHeader className="pb-3 border-b border-border/50">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <BarChart3 size={16} className="text-blue-500" />
                                        Quarterly Earnings
                                    </CardTitle>
                                    <Badge variant="outline" className="font-mono bg-blue-500/5 border-blue-500/20 text-blue-500">
                                        Current Year
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[200px] w-full flex items-end gap-6 group">
                                    {stats.filteredQuarterlyData.map((d, i) => {
                                        const now = new Date();
                                        const currentQIdx = Math.floor(now.getMonth() / 3);
                                        const isCurrentQ = i === currentQIdx;

                                        return (
                                            <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                                                <div className="w-full relative flex items-end justify-center group">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${(d.amount / maxQuarterlyIncome) * 160}px` }}
                                                        transition={{ duration: 0.8, delay: i * 0.15 }}
                                                        className={`w-full max-w-[60px] rounded-t-xl transition-all relative z-10 ${isCurrentQ
                                                            ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                                            : d.amount > 0 ? 'bg-secondary group-hover:bg-secondary/60' : 'bg-secondary/20 h-1'
                                                            }`}
                                                    />
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover border border-border p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 min-w-[80px] text-center">
                                                        <span className="text-[10px] font-bold">${d.amount.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <span className={`text-[11px] font-black tracking-widest ${isCurrentQ ? 'text-blue-500' : 'text-muted-foreground'}`}>{d.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>
                </div>

                {/* Overdue Payments */}
                {stats.overdueAmount > 0 && (
                    <FadeIn delay={0.4}>
                        <Card className="border-red-500/30 bg-red-500/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-red-500">
                                    <AlertTriangle size={16} />
                                    Account Delinquency
                                    <Badge variant="destructive" className="ml-2">${stats.overdueAmount.toLocaleString()}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {stats.overdueProjects.map(project => {
                                        const client = clients.find(c => c.id === project.clientId);
                                        const daysOverdue = Math.floor((new Date().getTime() - new Date(project.deadline!).getTime()) / (24 * 60 * 60 * 1000));

                                        return (
                                            <div key={project.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-red-500/20 hover:border-red-500/40 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center font-bold text-sm text-red-500">
                                                        {project.title.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-foreground">{project.title}</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                                            {client?.name || 'Unknown Client'} • {daysOverdue} Days Past Due
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono font-bold text-red-500">${(project.price || 0).toLocaleString()}</div>
                                                    <Badge variant="outline" className="text-[10px] text-red-500 bg-red-500/5 border-red-500/30 px-1 py-0">
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

                {/* Pricing Intelligence Alert */}
                {stats.avgProjectValue < 500 && (
                    <FadeIn delay={0.45}>
                        <Card className="border-orange-500/30 bg-orange-500/5">
                            <CardContent className="py-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground">Revenue Optimization Alert</h3>
                                        <p className="text-sm text-muted-foreground">Your average project value is below the $500 threshold. Brain suggests reviewing your pricing tiers.</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="border-orange-500/30 hover:bg-orange-500/10 text-orange-500">Review Pricing</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>
                )}

                {/* Bottom Stats Grid */}
                <FadeIn delay={0.5}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 border-l-4 border-l-purple-500">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="text-overline text-muted-foreground">Avg Value</div>
                                    <div className="text-2xl font-bold font-mono tracking-tight">${stats.avgProjectValue.toLocaleString()}</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-orange-500">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="text-overline text-muted-foreground">Est. Expenses</div>
                                    <div className="text-2xl font-bold font-mono tracking-tight">${stats.estimatedExpenses.toLocaleString()}</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-green-500">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="text-overline text-muted-foreground">Projects Done</div>
                                    <div className="text-2xl font-bold font-mono tracking-tight">{projects.filter(p => p.status === 'COMPLETED').length}</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-red-500">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="text-overline text-muted-foreground">Arrears</div>
                                    <div className="text-2xl font-bold font-mono tracking-tight">${stats.overdueAmount.toLocaleString()}</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </FadeIn>
            </div>
        </TooltipProvider>
    );
};

// Re-export as FinancePage for clarity, while keeping the file named FinancePage.tsx
export default FinancePage;
