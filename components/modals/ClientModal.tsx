
import React, { useState, useEffect } from 'react';
import { Client, Project } from '../../types';
import { X, Trash2, Plus, Briefcase, DollarSign, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>, newProjects: Partial<Project>[]) => void;
  onDelete?: (id: string) => void;
  initialClient?: Client | null;
  existingProjects?: Project[];
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen, onClose, onSave, onDelete, initialClient, existingProjects = []
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Client['status']>('ACTIVE');
  const [pendingProjects, setPendingProjects] = useState<Partial<Project>[]>([]);

  useEffect(() => {
    if (initialClient) {
      setName(initialClient.name);
      setEmail(initialClient.email || '');
      setNotes(initialClient.notes || '');
      setStatus(initialClient.status);
      setPendingProjects([]);
    } else {
      setName('');
      setEmail('');
      setNotes('');
      setStatus('ACTIVE');
      setPendingProjects([]);
    }
  }, [initialClient, isOpen]);

  const handleAddProject = () => {
    setPendingProjects(prev => [...prev, {
      id: `temp-${Date.now()}`,
      title: '',
      price: 0,
      status: 'ACTIVE',
      progress: 0,
      color: '#6366f1',
      tags: []
    }]);
  };

  const updatePendingProject = (index: number, field: keyof Project, value: any) => {
    setPendingProjects(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removePendingProject = (index: number) => {
    setPendingProjects(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const clientData: Partial<Client> = {
      id: initialClient ? initialClient.id : Date.now().toString(),
      name,
      email,
      notes,
      status,
      revenue: initialClient ? initialClient.revenue : 0,
      avatar: initialClient?.avatar || undefined
    };

    onSave(clientData, pendingProjects);
    onClose();
  };

  // Calculate total value of new projects
  const newProjectsTotal = pendingProjects.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  const existingTotal = initialClient ? existingProjects.filter(p => p.clientId === initialClient.id).reduce((sum, p) => sum + (p.price || 0), 0) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.23, ease: [0, 0, 0.2, 1] }}
            className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border/50 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-foreground">{initialClient ? 'Edit Client' : 'New Client'}</h2>
              <div className="flex items-center gap-2">
                {initialClient && onDelete && (
                  <button onClick={() => { onDelete(initialClient.id); onClose(); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors" title="Delete Client" aria-label="Delete Client">
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors" title="Close Modal" aria-label="Close Modal">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
              {/* Client Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Client Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      placeholder="Agency Name / Contact"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Email</label>
                    <div className="relative">
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pl-10 text-sm"
                        placeholder="contact@client.com"
                      />
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Status</label>
                    <div className="flex gap-3">
                      {['ACTIVE', 'INACTIVE', 'RED_FLAG'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s as any)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${status === s ? 'bg-secondary text-foreground border-border shadow-sm' : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/50'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes</label>
                  <div className="relative h-full">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-full bg-secondary/50 border border-border rounded-xl p-3 pl-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm min-h-[160px]"
                      placeholder="Payment terms, key contacts..."
                      title="Client notes"
                      aria-label="Client notes"
                    />
                    <FileText size={16} className="absolute left-3 top-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  </div>
                </div>
              </div>

              {/* Projects Section */}
              <div className="pt-6 border-t border-border/50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Briefcase size={16} className="text-primary" /> Projects
                  </h3>
                  <div className="text-xs text-muted-foreground font-mono">
                    Total Value: <span className="text-foreground font-bold">${(existingTotal + newProjectsTotal).toLocaleString()}</span>
                  </div>
                </div>

                {/* Existing Projects List */}
                {initialClient && existingProjects.filter(p => p.clientId === initialClient.id).length > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Existing Projects</div>
                    {existingProjects.filter(p => p.clientId === initialClient.id).map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl border border-border/50">
                        <span className="text-sm font-medium text-foreground">{p.title}</span>
                        <span className="text-sm font-mono font-bold text-primary">${p.price?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending Projects Inputs */}
                <div className="space-y-3">
                  {pendingProjects.map((p, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input
                        value={p.title}
                        onChange={(e) => updatePendingProject(i, 'title', e.target.value)}
                        placeholder="New Project Title"
                        className="flex-1 bg-secondary/50 border border-border rounded-xl p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <div className="relative w-32">
                        <input
                          type="number"
                          value={p.price || ''}
                          onChange={(e) => updatePendingProject(i, 'price', parseFloat(e.target.value))}
                          placeholder="0.00"
                          className="w-full bg-secondary/50 border border-border rounded-xl p-2.5 pl-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <button
                        onClick={() => removePendingProject(i)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                        title="Remove project"
                        aria-label="Remove project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  <button onClick={handleAddProject} className="w-full py-3 border border-dashed border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all flex items-center justify-center gap-2">
                    <Plus size={14} /> Add Project Pricing
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border/50 flex justify-between items-center shrink-0">
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-8 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                {initialClient ? 'Save Changes' : 'Create Client'}
              </button>
            </div>
          </motion.div>
        </div >
      )}
    </AnimatePresence >
  );
};
