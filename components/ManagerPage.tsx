
import React, { useState, useMemo, useEffect } from 'react';
import { Client, Project, Task } from '../types';
import { Plus, Users, Briefcase, TrendingUp, Edit2, Trash2, Power, MoreHorizontal, Wallet, ArrowUpRight, ArrowDownRight, DollarSign, PieChart, Activity, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import { ClientModal } from './modals/ClientModal';
import { ProjectModal } from './modals/ProjectModal';

interface ManagerPageProps {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  onAddClient: (client: Client, newProjects: Partial<Project>[]) => void;
  onUpdateClient: (client: Client, newProjects: Partial<Project>[]) => void;
  onDeleteClient: (id: string) => void;
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

// --- SUB-COMPONENTS FOR FINANCE DASHBOARD ---

const BalanceCard: React.FC<{ title: string, amount: number, trend: number, isExpense?: boolean }> = ({ title, amount, trend, isExpense }) => (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-primary/20 transition-all">
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
                <div className={`p-2 rounded-lg ${isExpense ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {isExpense ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">
                $<CountUp value={amount} />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
                <span className={`${trend >= 0 ? 'text-emerald-500' : 'text-red-500'} bg-secondary/50 px-1.5 py-0.5 rounded`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
                <span className="text-muted-foreground">vs last month</span>
            </div>
        </div>
        {/* Decorative BG */}
        <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-10 ${isExpense ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
    </div>
);

const MoneyFlowChart: React.FC<{ projects: Project[] }> = ({ projects }) => {
    // Group projects by month (Mock data simulation for visual structure)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Simple pseudo-random distribution based on real total to make chart look active
    const total = projects.reduce((s, p) => s + (p.price || 0), 0);
    const data = useMemo(() => {
        return months.map((m, i) => {
            // Seeded random-ish value
            const val = (total / 12) * (0.5 + Math.abs(Math.sin(i + total))); 
            return { month: m, value: val, income: true };
        });
    }, [total]);

    const maxVal = Math.max(...data.map(d => d.value)) * 1.2;

    return (
        <div className="h-64 flex items-end gap-2 sm:gap-4 mt-6">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full relative flex items-end h-full bg-secondary/20 rounded-t-lg overflow-hidden group-hover:bg-secondary/30 transition-colors">
                        <div 
                            className="w-full bg-emerald-500 opacity-80 group-hover:opacity-100 transition-all duration-500 rounded-t-lg relative min-h-[4px]"
                            style={{ height: `${(d.value / maxVal) * 100}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-10 pointer-events-none">
                                ${d.value.toFixed(0)}
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{d.month}</span>
                </div>
            ))}
        </div>
    );
};

const TransactionList: React.FC<{ projects: Project[] }> = ({ projects }) => {
    // Sort by "date" (using deadline or random logic for demo sort)
    const sorted = [...projects].sort((a,b) => (b.price || 0) - (a.price || 0)).slice(0, 6);

    return (
        <div className="space-y-4">
            {sorted.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 hover:bg-secondary/30 rounded-xl transition-colors group cursor-default">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${p.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-secondary border-border text-muted-foreground'}`}>
                            {p.status === 'COMPLETED' ? <ArrowDownRight size={18} /> : <Briefcase size={18} />}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-foreground">{p.title}</div>
                            <div className="text-xs text-muted-foreground">{p.client} • {new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div className={`text-sm font-mono font-bold ${p.status === 'COMPLETED' ? 'text-emerald-500' : 'text-foreground'}`}>
                        {p.status === 'COMPLETED' ? '+' : ''}${p.price?.toLocaleString()}
                    </div>
                </div>
            ))}
            {sorted.length === 0 && <div className="text-center text-muted-foreground text-sm py-4">No transactions yet.</div>}
        </div>
    );
};

// --- NEW BUDGET COMPONENTS ---

interface BudgetItem {
    id: string;
    category: string;
    limit: number;
    spent: number;
}

interface ExpenseItem {
    id: string;
    name: string;
    amount: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    paid: boolean;
}

const BudgetTool: React.FC = () => {
    const [budgets, setBudgets] = useState<BudgetItem[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newCat, setNewCat] = useState('');
    const [newLimit, setNewLimit] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('tasknovapro_budget');
        if (stored) setBudgets(JSON.parse(stored));
        else setBudgets([
            { id: '1', category: 'Software', limit: 200, spent: 145 },
            { id: '2', category: 'Marketing', limit: 1000, spent: 350 }
        ]);
    }, []);

    const saveBudgets = (newBudgets: BudgetItem[]) => {
        setBudgets(newBudgets);
        localStorage.setItem('tasknovapro_budget', JSON.stringify(newBudgets));
    };

    const handleAdd = () => {
        if (!newCat || !newLimit) return;
        const newItem: BudgetItem = {
            id: Date.now().toString(),
            category: newCat,
            limit: parseFloat(newLimit),
            spent: 0
        };
        saveBudgets([...budgets, newItem]);
        setIsAdding(false);
        setNewCat('');
        setNewLimit('');
    };

    const handleDelete = (id: string) => {
        saveBudgets(budgets.filter(b => b.id !== id));
    };

    const handleUpdateSpent = (id: string, amount: number) => {
        // Simple prompt for now
        saveBudgets(budgets.map(b => b.id === id ? { ...b, spent: amount } : b));
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground">Monthly Budget</h3>
                <button onClick={() => setIsAdding(!isAdding)} className="p-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-foreground transition-colors">
                    {isAdding ? <X size={16} /> : <Plus size={16} />}
                </button>
            </div>

            {isAdding && (
                <div className="mb-4 p-3 bg-secondary/30 rounded-xl border border-border animate-in slide-in-from-top-2">
                    <div className="flex gap-2 mb-2">
                        <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Category Name" className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm outline-none focus:border-primary" />
                        <input value={newLimit} onChange={e => setNewLimit(e.target.value)} type="number" placeholder="Limit" className="w-20 bg-background border border-border rounded px-2 py-1 text-sm outline-none focus:border-primary" />
                    </div>
                    <button onClick={handleAdd} className="w-full bg-primary text-primary-foreground text-xs font-bold py-1.5 rounded">Add Budget</button>
                </div>
            )}

            <div className="space-y-5 flex-1 overflow-y-auto pr-1">
                {budgets.map(b => {
                    const percent = Math.min(100, Math.round((b.spent / b.limit) * 100));
                    const colorClass = percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-orange-500' : 'bg-emerald-500';
                    
                    return (
                        <div key={b.id} className="group relative">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-bold text-foreground">{b.category}</span>
                                <div className="text-xs font-mono">
                                    <span className="text-foreground font-bold">${b.spent}</span>
                                    <span className="text-muted-foreground"> / ${b.limit}</span>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden relative">
                                <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${percent}%` }}></div>
                            </div>
                            
                            {/* Controls on hover */}
                            <div className="absolute right-0 -top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-card border border-border p-1 rounded shadow-lg">
                                <button onClick={() => { const val = prompt("Update spent amount:", b.spent.toString()); if(val) handleUpdateSpent(b.id, parseFloat(val)); }} className="p-1 hover:bg-secondary rounded text-xs"><Edit2 size={10} /></button>
                                <button onClick={() => handleDelete(b.id)} className="p-1 hover:bg-red-500/10 text-red-500 rounded text-xs"><Trash2 size={10} /></button>
                            </div>
                        </div>
                    );
                })}
                {budgets.length === 0 && <div className="text-center text-muted-foreground text-sm py-4">No budgets set.</div>}
            </div>
        </div>
    );
};

const PriorityExpensePlanner: React.FC = () => {
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

    useEffect(() => {
        const stored = localStorage.getItem('tasknovapro_expenses');
        if (stored) setExpenses(JSON.parse(stored));
    }, []);

    const saveExpenses = (newExpenses: ExpenseItem[]) => {
        setExpenses(newExpenses);
        localStorage.setItem('tasknovapro_expenses', JSON.stringify(newExpenses));
    };

    const addExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;
        
        const newItem: ExpenseItem = {
            id: Date.now().toString(),
            name,
            amount: parseFloat(amount),
            priority,
            paid: false
        };
        // Add and sort by priority (High first)
        const updated = [...expenses, newItem].sort((a,b) => {
            const pMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
            return pMap[b.priority] - pMap[a.priority];
        });
        saveExpenses(updated);
        setName('');
        setAmount('');
    };

    const togglePaid = (id: string) => {
        saveExpenses(expenses.map(e => e.id === id ? { ...e, paid: !e.paid } : e));
    };

    const deleteExpense = (id: string) => {
        saveExpenses(expenses.filter(e => e.id !== id));
    };

    const totalRequired = expenses.filter(e => !e.paid).reduce((acc, e) => acc + e.amount, 0);

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Priority Planner</h3>
                    <div className="text-xs text-muted-foreground">Upcoming: <span className="text-foreground font-bold">${totalRequired}</span></div>
                </div>
            </div>

            <form onSubmit={addExpense} className="flex gap-2 mb-4">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Expense Name" className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary" />
                <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="$" className="w-16 bg-secondary border border-border rounded-lg px-2 py-2 text-xs outline-none focus:border-primary" />
                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-20 bg-secondary border border-border rounded-lg px-1 py-2 text-[10px] font-bold outline-none">
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Med</option>
                    <option value="LOW">Low</option>
                </select>
                <button type="submit" className="bg-primary text-primary-foreground rounded-lg px-3 py-2"><Plus size={16} /></button>
            </form>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[300px]">
                {expenses.map(exp => (
                    <div key={exp.id} className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${exp.paid ? 'opacity-50 bg-secondary/20 border-transparent' : 'bg-secondary/10 border-border hover:border-primary/30'}`}>
                        <div className="flex items-center gap-3">
                            <button onClick={() => togglePaid(exp.id)} className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${exp.paid ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground hover:border-primary'}`}>
                                {exp.paid && <CheckCircle2 size={12} />}
                            </button>
                            <div>
                                <div className={`text-xs font-bold ${exp.paid ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{exp.name}</div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${exp.priority === 'HIGH' ? 'bg-red-500/10 text-red-500' : exp.priority === 'MEDIUM' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>{exp.priority}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold">${exp.amount}</span>
                            <button onClick={() => deleteExpense(exp.id)} className="text-muted-foreground hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
                {expenses.length === 0 && <div className="text-center text-muted-foreground text-xs py-4">No expenses planned.</div>}
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

export const ManagerPage: React.FC<ManagerPageProps> = ({
    clients, projects, tasks,
    onAddClient, onUpdateClient, onDeleteClient,
    onAddProject, onUpdateProject, onDeleteProject
}) => {
  const [view, setView] = useState<'BUSINESS' | 'FINANCE'>('BUSINESS');
  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Business Stats
  const activeClientsCount = clients.filter(c => c.status === 'ACTIVE').length;
  const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length;
  
  // Financial Stats
  const completedProjects = projects.filter(p => p.status === 'COMPLETED');
  const totalIncome = completedProjects.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalPipeline = projects.reduce((sum, p) => sum + (p.price || 0), 0);
  
  // Simulated Expenses (e.g. 30% overhead)
  const totalExpenses = Math.round(totalIncome * 0.3);
  const currentBalance = totalIncome - totalExpenses;

  // Helper to calculate total spent per client
  const getClientTotal = (clientId: string) => {
      return projects.filter(p => p.clientId === clientId).reduce((sum, p) => sum + (p.price || 0), 0);
  };

  return (
    <div className="flex flex-col h-full w-full space-y-8 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2">
      
      {/* Header & Tabs */}
      <FadeIn>
          <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
              <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Manager</h1>
                  <p className="text-sm text-muted-foreground">Keep track, access, and enhance performance.</p>
              </div>
              <div className="flex bg-card p-1 rounded-xl border border-border">
                  <button 
                    onClick={() => setView('BUSINESS')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'BUSINESS' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                      Business
                  </button>
                  <button 
                    onClick={() => setView('FINANCE')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'FINANCE' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                      Finances
                  </button>
              </div>
          </div>
      </FadeIn>

      {view === 'BUSINESS' ? (
          <>
            {/* BUSINESS VIEW */}
            {/* Graphs / Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FadeIn delay={0.1} className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={20} /></div>
                        <span className="text-xs font-bold text-muted-foreground">ACTIVE CLIENTS</span>
                    </div>
                    <div className="text-4xl font-bold text-foreground relative z-10">
                        <CountUp value={activeClientsCount} />
                    </div>
                    {/* Simple decorative graph line */}
                    <div className="absolute bottom-0 left-0 w-full h-12 flex items-end opacity-20">
                        <div className="w-1/5 h-[40%] bg-blue-500 mx-1 rounded-t"></div>
                        <div className="w-1/5 h-[60%] bg-blue-500 mx-1 rounded-t"></div>
                        <div className="w-1/5 h-[50%] bg-blue-500 mx-1 rounded-t"></div>
                        <div className="w-1/5 h-[80%] bg-blue-500 mx-1 rounded-t"></div>
                        <div className="w-1/5 h-[100%] bg-blue-500 mx-1 rounded-t"></div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.2} className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Briefcase size={20} /></div>
                        <span className="text-xs font-bold text-muted-foreground">ACTIVE PROJECTS</span>
                    </div>
                    <div className="text-4xl font-bold text-foreground relative z-10">
                        <CountUp value={activeProjectsCount} />
                    </div>
                    {/* Simple decorative graph line */}
                    <div className="absolute bottom-0 left-0 w-full h-12 flex items-end opacity-20">
                        <div className="w-1/5 h-[30%] bg-purple-500 mx-1 rounded-t"></div>
                        <div className="w-1/5 h-[50%] bg-purple-500 mx-1 rounded-t"></div>
                        <div className="w-1/5 h-[70%] bg-purple-500 mx-1 rounded-t"></div>
                        <div className="w-1/5 h-[60%] bg-purple-500 mx-1 rounded-t"></div>
                        <div className="w-1/5 h-[90%] bg-purple-500 mx-1 rounded-t"></div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.3} className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><TrendingUp size={20} /></div>
                        <span className="text-xs font-bold text-muted-foreground">TOTAL PIPELINE</span>
                    </div>
                    <div className="text-4xl font-bold text-foreground relative z-10">
                        <CountUp value={totalPipeline} prefix="$" />
                    </div>
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
                </FadeIn>
            </div>

            {/* Clients Table */}
            <FadeIn delay={0.4}>
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="text-lg font-bold text-foreground">Clients</h3>
                        <button 
                            onClick={() => { setSelectedClient(null); setIsClientModalOpen(true); }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-glow"
                        >
                            <Plus size={14} /> Add Client
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/30 text-muted-foreground font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Client Name</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Total Spent</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {clients.map(client => (
                                    <tr key={client.id} className="hover:bg-secondary/20 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-foreground">{client.name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{client.email || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${client.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                {client.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-foreground">${getClientTotal(client.id).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setSelectedClient(client); setIsClientModalOpen(true); }} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => onUpdateClient({ ...client, status: client.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }, [])} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground" title="Toggle Active">
                                                    <Power size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {clients.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-muted-foreground">No clients added.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </FadeIn>

            {/* Projects Table */}
            <FadeIn delay={0.5}>
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="text-lg font-bold text-foreground">Projects</h3>
                        <button 
                            onClick={() => { setSelectedProject(null); setIsProjectModalOpen(true); }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-foreground text-xs font-bold rounded-lg hover:bg-secondary/80 border border-border transition-colors"
                        >
                            <Plus size={14} /> Add Project
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/30 text-muted-foreground font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Project Title</th>
                                    <th className="px-6 py-3">Client</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Value</th>
                                    <th className="px-6 py-3">Deadline</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {projects.map(project => (
                                    <tr key={project.id} className="hover:bg-secondary/20 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-foreground">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }}></div>
                                                {project.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">{project.client}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${project.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-foreground">${project.price?.toLocaleString() || '0'}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{project.deadline ? new Date(project.deadline).toLocaleDateString() : '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setSelectedProject(project); setIsProjectModalOpen(true); }} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => onDeleteProject(project.id)} className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {projects.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-muted-foreground">No projects found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </FadeIn>
          </>
      ) : (
          /* FINANCE VIEW */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Top Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <BalanceCard title="Total Balance" amount={currentBalance} trend={12.5} />
                  <BalanceCard title="Total Income" amount={totalIncome} trend={8.2} />
                  <BalanceCard title="Total Expenses" amount={totalExpenses} trend={-2.4} isExpense />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Money Flow Chart */}
                  <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-center">
                          <div>
                              <h3 className="text-lg font-bold text-foreground">Money Flow</h3>
                              <div className="flex items-center gap-4 mt-2 text-xs font-bold">
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Income
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                      <div className="w-2 h-2 rounded-full bg-secondary"></div> Expense
                                  </div>
                              </div>
                          </div>
                          <select className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground outline-none">
                              <option>Monthly</option>
                              <option>Yearly</option>
                          </select>
                      </div>
                      <MoneyFlowChart projects={projects} />
                  </div>

                  {/* Transaction History (Moved here for better layout balance) */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-foreground">History</h3>
                          <button className="text-xs font-bold text-emerald-500 hover:underline">View All</button>
                      </div>
                      <div className="grid grid-cols-2 text-xs font-bold text-muted-foreground uppercase mb-4 pl-3">
                          <div>Name</div>
                          <div className="text-right">Amount</div>
                      </div>
                      <TransactionList projects={projects} />
                  </div>
              </div>

              {/* Budget & Planning Row - NEW FEATURE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BudgetTool />
                  <PriorityExpensePlanner />
              </div>
          </div>
      )}

      <ClientModal 
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSave={onAddClient}
          onDelete={onDeleteClient}
          initialClient={selectedClient}
          existingProjects={projects}
      />

      <ProjectModal 
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onSave={(p) => {
              if (selectedProject) onUpdateProject({ ...selectedProject, ...p });
              else onAddProject({ id: Date.now().toString(), tags: [], progress: 0, ...p } as Project);
          }}
          onDelete={onDeleteProject}
          initialProject={selectedProject}
          allTasks={tasks}
          clients={clients}
      />
    </div>
  );
};
