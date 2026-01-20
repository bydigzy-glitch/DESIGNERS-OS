import React, { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Project, Client, FinancialGoal, PlannedPurchase, Subscription, PurchasePriority, PurchaseStatus, SubscriptionFrequency } from '../types';
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
    Shield,
    Target,
    ShoppingCart,
    Repeat,
    ArrowRight,
    Plus,
    Pencil,
    Trash2,
    Check,
    X,
    Pause,
    Play,
    Sparkles,
    TrendingDown as TrendDown,
    Package,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface FinancePageProps {
    projects: Project[];
    clients: Client[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Storage keys for finance data
const FINANCE_STORAGE_KEYS = {
    GOAL: 'finance_goal',
    PURCHASES: 'finance_purchases',
    SUBSCRIPTIONS: 'finance_subscriptions'
};

// Default values
const DEFAULT_GOAL: FinancialGoal = {
    id: 'default-goal',
    target: 15000,
    label: 'Revenue Target',
    deadline: 'Dec 2026',
    createdAt: new Date()
};

// Helper to load from localStorage
const loadFinanceData = <T,>(key: string, defaultValue: T): T => {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Hydrate dates
            if (Array.isArray(parsed)) {
                return parsed.map((item: any) => ({
                    ...item,
                    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
                    nextBilling: item.nextBilling ? new Date(item.nextBilling) : undefined
                })) as T;
            }
            return {
                ...parsed,
                createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date()
            };
        }
    } catch (e) {
        console.error('Failed to load finance data:', e);
    }
    return defaultValue;
};

// Helper to save to localStorage
const saveFinanceData = <T,>(key: string, data: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save finance data:', e);
    }
};

export const FinancePage: React.FC<FinancePageProps> = ({
    projects,
    clients,
}) => {
    // ============================================
    // STATE: Financial Goal
    // ============================================
    const [goal, setGoal] = useState<FinancialGoal>(() =>
        loadFinanceData(FINANCE_STORAGE_KEYS.GOAL, DEFAULT_GOAL)
    );
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

    // ============================================
    // STATE: Planned Purchases
    // ============================================
    const [purchases, setPurchases] = useState<PlannedPurchase[]>(() =>
        loadFinanceData(FINANCE_STORAGE_KEYS.PURCHASES, [])
    );
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState<PlannedPurchase | null>(null);

    // ============================================
    // STATE: Subscriptions
    // ============================================
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
        loadFinanceData(FINANCE_STORAGE_KEYS.SUBSCRIPTIONS, [])
    );
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);

    // ============================================
    // PERSISTENCE: Auto-save on changes
    // ============================================
    const updateGoal = useCallback((newGoal: FinancialGoal) => {
        setGoal(newGoal);
        saveFinanceData(FINANCE_STORAGE_KEYS.GOAL, newGoal);
    }, []);

    const updatePurchases = useCallback((newPurchases: PlannedPurchase[]) => {
        setPurchases(newPurchases);
        saveFinanceData(FINANCE_STORAGE_KEYS.PURCHASES, newPurchases);
    }, []);

    const updateSubscriptions = useCallback((newSubs: Subscription[]) => {
        setSubscriptions(newSubs);
        saveFinanceData(FINANCE_STORAGE_KEYS.SUBSCRIPTIONS, newSubs);
    }, []);

    // ============================================
    // COMPUTED: Financial Statistics
    // ============================================
    const stats = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();

        const completedProjects = projects.filter(p => p.status === 'COMPLETED');
        const totalEarned = completedProjects.reduce((s, p) => s + (p.price || 0), 0);

        const activeProjects = projects.filter(p => p.status === 'ACTIVE' || p.status === 'REVISION');
        const pipelineValue = activeProjects.reduce((s, p) => s + (p.price || 0), 0);

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

        const currentMonth = now.getMonth();
        const currentQIdx = Math.floor(currentMonth / 3);
        const filteredQuarterlyData = quarterlyData.slice(0, currentQIdx + 1);

        const overdueProjects = projects.filter(p =>
            p.status === 'ACTIVE' &&
            p.deadline &&
            new Date(p.deadline) < now &&
            p.invoiceStatus !== 'PAID'
        );
        const overdueAmount = overdueProjects.reduce((s, p) => s + (p.price || 0), 0);

        const avgProjectValue = projects.length > 0
            ? Math.round(projects.reduce((s, p) => s + (p.price || 0), 0) / projects.length)
            : 0;

        // Monthly subscriptions cost
        const monthlySubCost = subscriptions
            .filter(s => s.status === 'ACTIVE')
            .reduce((sum, s) => {
                if (s.frequency === 'MONTHLY') return sum + s.price;
                if (s.frequency === 'YEARLY') return sum + (s.price / 12);
                if (s.frequency === 'WEEKLY') return sum + (s.price * 4.33);
                return sum;
            }, 0);

        const estimatedExpenses = Math.round((totalEarned * 0.3) + monthlySubCost);
        const safeToSpend = Math.max(0, totalEarned - estimatedExpenses - (pipelineValue * 0.2));

        // Purchases analysis
        const availablePurchases = purchases.filter(p => p.status !== 'PURCHASED');
        const totalWishlist = availablePurchases.reduce((s, p) => s + p.price, 0);

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
            filteredQuarterlyData,
            monthlySubCost,
            totalWishlist,
            goalProgress: goal.target > 0 ? (totalEarned / goal.target) * 100 : 0,
            remainingToGoal: Math.max(0, goal.target - totalEarned)
        };
    }, [projects, subscriptions, purchases, goal.target]);

    // Graph helpers
    const maxMonthlyIncome = Math.max(...stats.monthlyTrends.map(d => d.amount), 1000);
    const maxQuarterlyIncome = Math.max(...stats.quarterlyData.map(d => d.amount), 1000);

    // ============================================
    // HANDLERS: Goal CRUD
    // ============================================
    const handleSaveGoal = () => {
        if (editingGoal) {
            updateGoal(editingGoal);
            setIsGoalModalOpen(false);
            setEditingGoal(null);
        }
    };

    // ============================================
    // HANDLERS: Purchase CRUD
    // ============================================
    const handleAddPurchase = () => {
        setEditingPurchase({
            id: '',
            name: '',
            price: 0,
            priority: 'STRATEGIC',
            status: 'WISHLIST',
            createdAt: new Date()
        });
        setIsPurchaseModalOpen(true);
    };

    const handleEditPurchase = (purchase: PlannedPurchase) => {
        setEditingPurchase({ ...purchase });
        setIsPurchaseModalOpen(true);
    };

    const handleSavePurchase = () => {
        if (!editingPurchase || !editingPurchase.name.trim()) return;

        if (editingPurchase.id) {
            // Update existing
            updatePurchases(purchases.map(p => p.id === editingPurchase.id ? editingPurchase : p));
        } else {
            // Create new
            const newPurchase = { ...editingPurchase, id: `purchase-${Date.now()}` };
            updatePurchases([...purchases, newPurchase]);
        }
        setIsPurchaseModalOpen(false);
        setEditingPurchase(null);
    };

    const handleDeletePurchase = (id: string) => {
        updatePurchases(purchases.filter(p => p.id !== id));
    };

    const handleMarkPurchased = (id: string) => {
        updatePurchases(purchases.map(p =>
            p.id === id ? { ...p, status: 'PURCHASED' as PurchaseStatus } : p
        ));
    };

    // ============================================
    // HANDLERS: Subscription CRUD
    // ============================================
    const handleAddSubscription = () => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        setEditingSub({
            id: '',
            name: '',
            price: 0,
            frequency: 'MONTHLY',
            nextBilling: nextMonth,
            status: 'ACTIVE',
            createdAt: new Date()
        });
        setIsSubModalOpen(true);
    };

    const handleEditSubscription = (sub: Subscription) => {
        setEditingSub({ ...sub });
        setIsSubModalOpen(true);
    };

    const handleSaveSubscription = () => {
        if (!editingSub || !editingSub.name.trim()) return;

        if (editingSub.id) {
            updateSubscriptions(subscriptions.map(s => s.id === editingSub.id ? editingSub : s));
        } else {
            const newSub = { ...editingSub, id: `sub-${Date.now()}` };
            updateSubscriptions([...subscriptions, newSub]);
        }
        setIsSubModalOpen(false);
        setEditingSub(null);
    };

    const handleToggleSubscription = (id: string) => {
        updateSubscriptions(subscriptions.map(s =>
            s.id === id ? { ...s, status: s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : s
        ));
    };

    const handleDeleteSubscription = (id: string) => {
        updateSubscriptions(subscriptions.filter(s => s.id !== id));
    };

    // ============================================
    // COMPUTED: Smart Insights
    // ============================================
    const getGoalInsight = () => {
        if (stats.totalEarned >= goal.target) {
            return "🎉 Congratulations! You've hit your target. Time to set a new goal.";
        }
        if (stats.goalProgress >= 75) {
            return `Almost there! ${Math.round(stats.remainingToGoal / stats.avgProjectValue) || 1} more project${stats.avgProjectValue > stats.remainingToGoal ? '' : 's'} to go.`;
        }
        if (stats.goalProgress >= 50) {
            return "Solid progress. Keep the momentum going with consistent project delivery.";
        }
        if (stats.pipelineValue > stats.remainingToGoal) {
            return "Your pipeline can cover the remaining gap. Focus on closing active deals.";
        }
        return `${Math.ceil(stats.remainingToGoal / (stats.avgProjectValue || 1000))} projects at your average rate to reach target.`;
    };

    // Sort purchases by priority and status
    const sortedPurchases = useMemo(() => {
        const priorityOrder = { CRITICAL: 0, STRATEGIC: 1, LUXURY: 2 };
        const statusOrder = { AVAILABLE: 0, SAVING: 1, WISHLIST: 2, PURCHASED: 3 };

        return [...purchases].sort((a, b) => {
            if (a.status === 'PURCHASED' && b.status !== 'PURCHASED') return 1;
            if (b.status === 'PURCHASED' && a.status !== 'PURCHASED') return -1;
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return statusOrder[a.status] - statusOrder[b.status];
        });
    }, [purchases]);

    // Calculate which purchases are affordable
    const affordablePurchases = useMemo(() => {
        let budget = stats.safeToSpend;
        return sortedPurchases
            .filter(p => p.status !== 'PURCHASED')
            .map(p => {
                const canAfford = p.price <= budget;
                if (canAfford) budget -= p.price;
                return { ...p, canAfford };
            });
    }, [sortedPurchases, stats.safeToSpend]);

    // Active subscriptions for display
    const activeSubscriptions = subscriptions.filter(s => s.status !== 'CANCELLED');
    const monthlySubTotal = activeSubscriptions
        .filter(s => s.status === 'ACTIVE')
        .reduce((sum, s) => {
            if (s.frequency === 'MONTHLY') return sum + s.price;
            if (s.frequency === 'YEARLY') return sum + Math.round(s.price / 12);
            if (s.frequency === 'WEEKLY') return sum + Math.round(s.price * 4.33);
            return sum;
        }, 0);

    // ============================================
    // RENDER: Empty States
    // ============================================
    const renderEmptyProjects = () => (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <DollarSign size={28} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">No Revenue Data Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
                Complete projects to see your financial metrics. Add clients and mark projects as completed to track your earnings.
            </p>
        </div>
    );

    const renderEmptyPurchases = () => (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package size={32} className="text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No purchases planned yet</p>
            <Button size="sm" variant="outline" onClick={handleAddPurchase} className="gap-2">
                <Plus size={14} /> Add Your First Item
            </Button>
        </div>
    );

    const renderEmptySubscriptions = () => (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <Repeat size={32} className="text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No subscriptions tracked</p>
            <Button size="sm" variant="outline" onClick={handleAddSubscription} className="gap-2">
                <Plus size={14} /> Add Subscription
            </Button>
        </div>
    );

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-col h-full w-full space-y-6 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2">

                {/* Header */}
                <FadeIn>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">Finance</h1>
                            <p className="text-sm text-muted-foreground mt-1">Strategic revenue management and insights</p>
                        </div>
                        {projects.length > 0 && (
                            <Badge variant="outline" className="font-mono text-xs">
                                {projects.filter(p => p.status === 'COMPLETED').length} projects completed
                            </Badge>
                        )}
                    </div>
                </FadeIn>

                {/* Empty State Check */}
                {projects.length === 0 ? (
                    <FadeIn delay={0.1}>
                        <Card className="p-8">{renderEmptyProjects()}</Card>
                    </FadeIn>
                ) : (
                    <>
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
                                        From {projects.filter(p => p.status === 'COMPLETED').length} completed projects
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
                                        {stats.activeProjects.length} project{stats.activeProjects.length !== 1 ? 's' : ''} in progress
                                    </div>
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
                                        After expenses & buffer
                                    </div>
                                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-20 bg-blue-500 group-hover:opacity-30 transition-opacity" />
                                </Card>
                            </div>
                        </FadeIn>

                        {/* Graphs Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Monthly Revenue */}
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
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="w-full relative flex items-end justify-center cursor-pointer">
                                                                <motion.div
                                                                    initial={{ height: 0 }}
                                                                    animate={{ height: `${Math.max((d.amount / maxMonthlyIncome) * 160, d.amount > 0 ? 8 : 4)}px` }}
                                                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                                                    className={cn(
                                                                        "w-full max-w-[40px] rounded-t-lg transition-all relative z-10",
                                                                        d.amount > 0
                                                                            ? 'bg-gradient-to-t from-green-500/80 to-green-400 hover:from-green-500 hover:to-green-300'
                                                                            : 'bg-secondary/30'
                                                                    )}
                                                                />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <span className="font-bold">${d.amount.toLocaleString()}</span>
                                                        </TooltipContent>
                                                    </Tooltip>
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
                                                {new Date().getFullYear()}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="h-[200px] w-full flex items-end gap-6 group">
                                            {stats.filteredQuarterlyData.map((d, i) => {
                                                const currentQIdx = Math.floor(new Date().getMonth() / 3);
                                                const isCurrentQ = i === currentQIdx;

                                                return (
                                                    <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="w-full relative flex items-end justify-center cursor-pointer">
                                                                    <motion.div
                                                                        initial={{ height: 0 }}
                                                                        animate={{ height: `${Math.max((d.amount / maxQuarterlyIncome) * 160, d.amount > 0 ? 8 : 4)}px` }}
                                                                        transition={{ duration: 0.8, delay: i * 0.15 }}
                                                                        className={cn(
                                                                            "w-full max-w-[60px] rounded-t-xl transition-all relative z-10",
                                                                            isCurrentQ
                                                                                ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                                                                : d.amount > 0 ? 'bg-secondary hover:bg-secondary/60' : 'bg-secondary/20'
                                                                        )}
                                                                    />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <span className="font-bold">${d.amount.toLocaleString()}</span>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <span className={cn(
                                                            "text-[11px] font-black tracking-widest",
                                                            isCurrentQ ? 'text-blue-500' : 'text-muted-foreground'
                                                        )}>{d.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </FadeIn>
                        </div>

                        {/* Overdue Payments Alert */}
                        <AnimatePresence>
                            {stats.overdueAmount > 0 && (
                                <FadeIn delay={0.4}>
                                    <Card className="border-red-500/30 bg-red-500/5">
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
                                                        <div key={project.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-red-500/20 hover:border-red-500/40 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center font-bold text-sm text-red-500">
                                                                    {project.title.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-foreground">{project.title}</div>
                                                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                                                        {client?.name || 'Unknown'} • {daysOverdue} days overdue
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-mono font-bold text-red-500">${(project.price || 0).toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </FadeIn>
                            )}
                        </AnimatePresence>
                    </>
                )}

                {/* Strategic Planning Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Financial Goals & Priority */}
                    <FadeIn delay={0.5}>
                        <div className="space-y-6">
                            {/* Financial Goal Card */}
                            <Card className="overflow-hidden border-primary/20 bg-primary/5">
                                <CardHeader className="pb-3 border-b border-primary/10">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Target size={16} className="text-primary" />
                                            Financial Goal
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs gap-1.5"
                                            onClick={() => {
                                                setEditingGoal({ ...goal });
                                                setIsGoalModalOpen(true);
                                            }}
                                        >
                                            <Pencil size={12} /> Edit
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">{goal.label}</div>
                                            <div className="text-3xl font-black text-foreground tracking-tighter">
                                                $<CountUp value={stats.totalEarned} />
                                                <span className="text-lg text-muted-foreground font-medium ml-2">/ ${goal.target.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Target</div>
                                            <div className="text-sm font-bold text-primary">{goal.deadline}</div>
                                        </div>
                                    </div>
                                    <Progress value={Math.min(stats.goalProgress, 100)} className="h-3 bg-primary/10" />
                                    <div className="mt-4 p-3 rounded-xl bg-background/50 border border-primary/10 text-xs text-muted-foreground flex items-start gap-2">
                                        <Sparkles size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                        <span>{getGoalInsight()}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Purchase Priority List */}
                            <Card>
                                <CardHeader className="pb-3 border-b border-border/50">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <ShoppingCart size={16} className="text-orange-500" />
                                            Purchase Priority
                                        </CardTitle>
                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleAddPurchase}>
                                            <Plus size={12} /> Add
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Budget:</span>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px]",
                                            stats.safeToSpend > 1000 ? "border-green-500/30 text-green-500 bg-green-500/5" : "border-orange-500/30 text-orange-500 bg-orange-500/5"
                                        )}>
                                            ${stats.safeToSpend.toLocaleString()} available
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 px-0">
                                    {purchases.length === 0 ? (
                                        <div className="px-6">{renderEmptyPurchases()}</div>
                                    ) : (
                                        <div className="space-y-1">
                                            {affordablePurchases.map(item => (
                                                <div key={item.id} className={cn(
                                                    "flex items-center justify-between px-6 py-3 hover:bg-secondary/30 transition-colors group",
                                                    item.status === 'PURCHASED' && "opacity-50"
                                                )}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "p-2 rounded-lg",
                                                            item.priority === 'CRITICAL' ? "bg-red-500/10 text-red-500" :
                                                                item.priority === 'STRATEGIC' ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                                                        )}>
                                                            {item.priority === 'CRITICAL' ? <Zap size={14} /> :
                                                                item.priority === 'STRATEGIC' ? <TrendingUp size={14} /> : <ShoppingCart size={14} />}
                                                        </div>
                                                        <div>
                                                            <div className={cn(
                                                                "text-sm font-bold text-foreground group-hover:text-primary transition-colors",
                                                                item.status === 'PURCHASED' && "line-through"
                                                            )}>{item.name}</div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">${item.price.toLocaleString()}</span>
                                                                <span className="text-[10px] text-muted-foreground opacity-50">•</span>
                                                                <span className={cn(
                                                                    "text-[10px] font-black tracking-widest uppercase",
                                                                    item.canAfford && item.status !== 'PURCHASED' ? "text-green-500" :
                                                                        item.status === 'PURCHASED' ? "text-muted-foreground" : "text-orange-500"
                                                                )}>
                                                                    {item.status === 'PURCHASED' ? 'PURCHASED' : item.canAfford ? 'AFFORDABLE' : 'SAVING'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {item.status !== 'PURCHASED' && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleMarkPurchased(item.id)}>
                                                                        <Check size={14} className="text-green-500" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Mark as Purchased</TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditPurchase(item)}>
                                                                    <Pencil size={14} />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeletePurchase(item.id)}>
                                                                    <Trash2 size={14} className="text-red-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Remove</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </FadeIn>

                    {/* Subscription Management */}
                    <FadeIn delay={0.6}>
                        <Card className="h-full flex flex-col">
                            <CardHeader className="pb-3 border-b border-border/50">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Repeat size={16} className="text-primary" />
                                        Subscriptions
                                    </CardTitle>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleAddSubscription}>
                                        <Plus size={12} /> Add
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 flex-1 flex flex-col">
                                {activeSubscriptions.length === 0 ? (
                                    renderEmptySubscriptions()
                                ) : (
                                    <div className="space-y-4 flex-1">
                                        {/* Monthly Burn Card */}
                                        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 relative overflow-hidden group">
                                            <div className="flex justify-between items-center relative z-10">
                                                <div>
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Monthly Recurring</div>
                                                    <div className="text-2xl font-black text-foreground">
                                                        ${monthlySubTotal.toLocaleString()}
                                                        <span className="text-sm text-muted-foreground font-medium ml-1">/mo</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Yearly</div>
                                                    <div className="text-lg font-bold text-foreground">${(monthlySubTotal * 12).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-primary/5 blur-2xl" />
                                        </div>

                                        {/* Subscription List */}
                                        <div className="space-y-2 flex-1">
                                            {activeSubscriptions.map(sub => {
                                                const nextBillingDate = new Date(sub.nextBilling);
                                                const daysUntil = Math.ceil((nextBillingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                const isUpcoming = daysUntil <= 7 && daysUntil >= 0;

                                                return (
                                                    <div key={sub.id} className={cn(
                                                        "flex items-center justify-between p-3 rounded-xl border transition-all group",
                                                        sub.status === 'PAUSED' ? "border-orange-500/20 bg-orange-500/5" : "border-border/30 hover:border-primary/30"
                                                    )}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border",
                                                                sub.status === 'PAUSED' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-secondary text-muted-foreground border-border/50"
                                                            )}>
                                                                {sub.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                                                                    {sub.name}
                                                                    {sub.status === 'PAUSED' && (
                                                                        <Badge variant="outline" className="text-[8px] h-4 px-1 border-orange-500/30 text-orange-500">PAUSED</Badge>
                                                                    )}
                                                                </div>
                                                                <div className={cn(
                                                                    "text-[10px] uppercase tracking-wider",
                                                                    isUpcoming ? "text-orange-500 font-bold" : "text-muted-foreground"
                                                                )}>
                                                                    {isUpcoming ? `Due in ${daysUntil} days` : `Next: ${MONTHS[nextBillingDate.getMonth()]} ${nextBillingDate.getDate()}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-right mr-2">
                                                                <div className="text-sm font-black text-foreground">${sub.price}</div>
                                                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                                    {sub.frequency.toLowerCase()}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleToggleSubscription(sub.id)}>
                                                                            {sub.status === 'PAUSED' ? <Play size={14} className="text-green-500" /> : <Pause size={14} className="text-orange-500" />}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{sub.status === 'PAUSED' ? 'Resume' : 'Pause'}</TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditSubscription(sub)}>
                                                                            <Pencil size={14} />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit</TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteSubscription(sub.id)}>
                                                                            <Trash2 size={14} className="text-red-500" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Remove</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </FadeIn>
                </div>

                <div className="h-12" />
            </div>

            {/* ============================================ */}
            {/* MODALS */}
            {/* ============================================ */}

            {/* Goal Edit Modal */}
            <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Financial Goal</DialogTitle>
                        <DialogDescription>Set your revenue target to track progress</DialogDescription>
                    </DialogHeader>
                    {editingGoal && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="goal-label">Goal Name</Label>
                                <Input
                                    id="goal-label"
                                    value={editingGoal.label}
                                    onChange={(e) => setEditingGoal({ ...editingGoal, label: e.target.value })}
                                    placeholder="e.g., Annual Revenue Target"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="goal-target">Target Amount ($)</Label>
                                <Input
                                    id="goal-target"
                                    type="number"
                                    value={editingGoal.target}
                                    onChange={(e) => setEditingGoal({ ...editingGoal, target: parseInt(e.target.value) || 0 })}
                                    placeholder="15000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="goal-deadline">Deadline</Label>
                                <Input
                                    id="goal-deadline"
                                    value={editingGoal.deadline}
                                    onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
                                    placeholder="e.g., Dec 2026"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGoalModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveGoal}>Save Goal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Purchase Modal */}
            <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPurchase?.id ? 'Edit Purchase' : 'Add Purchase'}</DialogTitle>
                        <DialogDescription>Track items you're saving for or planning to buy</DialogDescription>
                    </DialogHeader>
                    {editingPurchase && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="purchase-name">Item Name</Label>
                                <Input
                                    id="purchase-name"
                                    value={editingPurchase.name}
                                    onChange={(e) => setEditingPurchase({ ...editingPurchase, name: e.target.value })}
                                    placeholder="e.g., MacBook Pro"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="purchase-price">Price ($)</Label>
                                <Input
                                    id="purchase-price"
                                    type="number"
                                    value={editingPurchase.price}
                                    onChange={(e) => setEditingPurchase({ ...editingPurchase, price: parseInt(e.target.value) || 0 })}
                                    placeholder="2499"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                    value={editingPurchase.priority}
                                    onValueChange={(v) => setEditingPurchase({ ...editingPurchase, priority: v as PurchasePriority })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CRITICAL">Critical (Essential)</SelectItem>
                                        <SelectItem value="STRATEGIC">Strategic (Growth)</SelectItem>
                                        <SelectItem value="LUXURY">Luxury (Nice to Have)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPurchaseModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSavePurchase}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Subscription Modal */}
            <Dialog open={isSubModalOpen} onOpenChange={setIsSubModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSub?.id ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
                        <DialogDescription>Track your recurring expenses</DialogDescription>
                    </DialogHeader>
                    {editingSub && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="sub-name">Service Name</Label>
                                <Input
                                    id="sub-name"
                                    value={editingSub.name}
                                    onChange={(e) => setEditingSub({ ...editingSub, name: e.target.value })}
                                    placeholder="e.g., Figma"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sub-price">Price ($)</Label>
                                    <Input
                                        id="sub-price"
                                        type="number"
                                        value={editingSub.price}
                                        onChange={(e) => setEditingSub({ ...editingSub, price: parseInt(e.target.value) || 0 })}
                                        placeholder="15"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Frequency</Label>
                                    <Select
                                        value={editingSub.frequency}
                                        onValueChange={(v) => setEditingSub({ ...editingSub, frequency: v as SubscriptionFrequency })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                                            <SelectItem value="YEARLY">Yearly</SelectItem>
                                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sub-next">Next Billing Date</Label>
                                <Input
                                    id="sub-next"
                                    type="date"
                                    value={editingSub.nextBilling instanceof Date
                                        ? editingSub.nextBilling.toISOString().split('T')[0]
                                        : new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setEditingSub({ ...editingSub, nextBilling: new Date(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sub-category">Category (optional)</Label>
                                <Input
                                    id="sub-category"
                                    value={editingSub.category || ''}
                                    onChange={(e) => setEditingSub({ ...editingSub, category: e.target.value })}
                                    placeholder="e.g., Design Tools"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSubscription}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
};

export default FinancePage;
