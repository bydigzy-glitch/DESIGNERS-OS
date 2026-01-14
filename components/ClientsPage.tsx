
import React, { useState, useMemo } from 'react';
import { Client, Project } from '../types';
import {
    Plus,
    Users,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    DollarSign,
    Clock,
    Star,
    MoreHorizontal,
    Edit2,
    Pause,
    Power,
    Flag,
    ChevronRight,
    Mail,
    Phone,
    Instagram,
    Globe,
    MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ClientModal } from './modals/ClientModal';

interface ClientsPageProps {
    clients: Client[];
    projects: Project[];
    onAddClient: (client: Partial<Client>, newProjects: Partial<Project>[]) => void;
    onUpdateClient: (client: Partial<Client>, newProjects: Partial<Project>[]) => void;
    onDeleteClient: (id: string) => void;
}

const SCORE_COLORS = {
    good: 'text-green-500 bg-green-500/10',
    warning: 'text-orange-500 bg-orange-500/10',
    bad: 'text-red-500 bg-red-500/10',
};

const getScoreColor = (score: number) => {
    if (score >= 70) return SCORE_COLORS.good;
    if (score >= 40) return SCORE_COLORS.warning;
    return SCORE_COLORS.bad;
};

// For risk scores: high is bad, low is good
const getRiskColor = (risk: number) => {
    if (risk >= 70) return SCORE_COLORS.bad;
    if (risk >= 40) return SCORE_COLORS.warning;
    return SCORE_COLORS.good;
};

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-green-500/10 text-green-500 border-green-500/20',
    INACTIVE: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    PAUSED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    RED_FLAG: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const SOURCE_ICONS: Record<string, React.ReactNode> = {
    INSTAGRAM: <Instagram size={12} />,
    WEBSITE: <Globe size={12} />,
    EMAIL: <Mail size={12} />,
    REFERRAL: <Users size={12} />,
    OTHER: <MessageCircle size={12} />,
};

export const ClientsPage: React.FC<ClientsPageProps> = ({
    clients,
    projects,
    onAddClient,
    onUpdateClient,
    onDeleteClient,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);

    // Calculate stats
    const stats = useMemo(() => {
        const active = clients.filter(c => c.status === 'ACTIVE').length;
        const paused = clients.filter(c => c.status === 'PAUSED').length;
        const redFlags = clients.filter(c => c.status === 'RED_FLAG').length;
        const totalLTV = clients.reduce((sum, c) => {
            const clientProjects = projects.filter(p => p.clientId === c.id);
            return sum + clientProjects.reduce((s, p) => s + (p.price || 0), 0);
        }, 0);
        const avgScore = clients.length > 0
            ? clients.reduce((sum, c) => sum + (c.scores?.paymentReliability || 50), 0) / clients.length
            : 0;

        return { active, paused, redFlags, totalLTV, avgScore };
    }, [clients, projects]);

    // Calculate LTV for a client
    const getClientLTV = (clientId: string) => {
        return projects
            .filter(p => p.clientId === clientId)
            .reduce((sum, p) => sum + (p.price || 0), 0);
    };

    // Get active projects count
    const getActiveProjectsCount = (clientId: string) => {
        return projects.filter(p => p.clientId === clientId && p.status === 'ACTIVE').length;
    };

    // Filter clients
    const filteredClients = filterStatus
        ? clients.filter(c => c.status === filterStatus)
        : clients;

    const handleEditClient = (client: Client) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleStatusChange = (client: Client, newStatus: Client['status']) => {
        onUpdateClient({ ...client, status: newStatus }, []);
    };

    return (
        <div className="flex flex-col h-full w-full space-y-6 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2">

            {/* Header */}
            <FadeIn>
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Clients</h1>
                        <p className="text-sm text-muted-foreground mt-1">Client intelligence and relationship management</p>
                    </div>
                    <Button onClick={() => { setSelectedClient(null); setIsModalOpen(true); }} className="gap-2">
                        <Plus size={16} />
                        Add Client
                    </Button>
                </div>
            </FadeIn>

            {/* Stats Row */}
            <FadeIn delay={0.1}>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="p-4 border border-border hover:border-primary/30 transition-all duration-200" onClick={() => setFilterStatus(null)}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <Users size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-foreground"><CountUp value={clients.length} /></div>
                                <div className="text-xs text-muted-foreground">Total Clients</div>
                            </div>
                        </div>
                    </Card>

                    <Card className={`p-4 border border-border hover:border-primary/30 transition-all duration-200 ${filterStatus === 'ACTIVE' ? 'border-green-500/50' : ''}`} onClick={() => setFilterStatus('ACTIVE')}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                <TrendingUp size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-foreground"><CountUp value={stats.active} /></div>
                                <div className="text-xs text-muted-foreground">Active</div>
                            </div>
                        </div>
                    </Card>

                    <Card className={`p-4 border border-border hover:border-primary/30 transition-all duration-200 ${filterStatus === 'RED_FLAG' ? 'border-red-500/50' : ''}`} onClick={() => setFilterStatus('RED_FLAG')}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-foreground"><CountUp value={stats.redFlags} /></div>
                                <div className="text-xs text-muted-foreground">Red Flags</div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <DollarSign size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-foreground">$<CountUp value={stats.totalLTV} /></div>
                                <div className="text-xs text-muted-foreground">Total LTV</div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                <Star size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-foreground"><CountUp value={Math.round(stats.avgScore)} /></div>
                                <div className="text-xs text-muted-foreground">Avg Score</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </FadeIn>

            {/* Filter Pills */}
            {filterStatus && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filtering:</span>
                    <Badge variant="secondary" className="gap-1">
                        {filterStatus}
                        <button onClick={() => setFilterStatus(null)} className="ml-1 hover:text-foreground">×</button>
                    </Badge>
                </div>
            )}

            {/* Client Cards */}
            <FadeIn delay={0.2}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map((client) => {
                        const ltv = getClientLTV(client.id);
                        const activeProjects = getActiveProjectsCount(client.id);
                        const paymentScore = client.scores?.paymentReliability || 50;
                        const scopeRisk = client.scores?.scopeCreepRisk || 0;
                        const stressCost = client.scores?.stressCost || 0;

                        return (
                            <Card
                                key={client.id}
                                className={`overflow-hidden border border-border hover:border-primary/30 transition-all duration-200 group ${client.status === 'RED_FLAG' ? 'border-red-500/30' : ''
                                    }`}
                            >
                                <CardContent className="p-5">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-lg text-foreground border border-border">
                                                {client.avatar ? (
                                                    <img src={client.avatar} alt={client.name} className="w-full h-full rounded-xl object-cover" />
                                                ) : (
                                                    client.name.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground leading-none mb-1">{client.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[client.status]}`}>
                                                        {client.status}
                                                    </Badge>
                                                    {client.source && (
                                                        <span className="text-muted-foreground">
                                                            {SOURCE_ICONS[client.source]}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditClient(client)}>
                                                    <Edit2 size={14} className="mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleStatusChange(client, 'ACTIVE')}>
                                                    <Power size={14} className="mr-2" /> Set Active
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(client, 'PAUSED')}>
                                                    <Pause size={14} className="mr-2" /> Pause
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(client, 'RED_FLAG')} className="text-red-500">
                                                    <Flag size={14} className="mr-2" /> Flag as Risk
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Scores Grid */}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className={`p-2 rounded-lg text-center ${getScoreColor(paymentScore)}`}>
                                            <div className="text-lg font-bold">{paymentScore}</div>
                                            <div className="text-[9px] uppercase tracking-wide opacity-80">Payment</div>
                                        </div>
                                        <div className={`p-2 rounded-lg text-center ${getRiskColor(scopeRisk)}`}>
                                            <div className="text-lg font-bold">{scopeRisk}</div>
                                            <div className="text-[9px] uppercase tracking-wide opacity-80">Scope Risk</div>
                                        </div>
                                        <div className={`p-2 rounded-lg text-center ${getRiskColor(stressCost)}`}>
                                            <div className="text-lg font-bold">{stressCost}</div>
                                            <div className="text-[9px] uppercase tracking-wide opacity-80">Stress</div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-sm border-t border-border pt-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <DollarSign size={14} className="text-green-500" />
                                                <span className="font-mono font-bold">${ltv.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Clock size={14} />
                                                <span>{activeProjects} active</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-7 px-2">
                                            <ChevronRight size={14} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {filteredClients.length === 0 && (
                        <div className="col-span-full text-center py-20 border-2 border-dashed border-border rounded-2xl flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                                <Users size={20} className="text-muted-foreground" />
                            </div>
                            <h3 className="font-bold text-foreground mb-1">No Clients Listed</h3>
                            <p className="text-sm text-muted-foreground max-w-[280px]">
                                Your network is quiet. Use this time to refine your craft or let the system scan for leads.
                            </p>
                        </div>
                    )}
                </div>
            </FadeIn>

            {/* Client Modal */}
            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={selectedClient ? (c, p) => onUpdateClient(c, p) : onAddClient}
                onDelete={onDeleteClient}
                initialClient={selectedClient}
                existingProjects={projects}
            />
        </div>
    );
};
