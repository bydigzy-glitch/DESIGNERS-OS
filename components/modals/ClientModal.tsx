
import React, { useState, useEffect } from 'react';
import { Client, Project } from '../../types';
import { X, Trash2, Plus, Briefcase, DollarSign, Mail } from 'lucide-react';

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
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#141416] border border-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[65vh] md:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">{initialClient ? 'Edit Client' : 'New Client'}</h2>
          <div className="flex items-center gap-2">
            {initialClient && onDelete && (
              <button onClick={() => { onDelete(initialClient.id); onClose(); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Client Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary"
                  placeholder="Agency Name / Contact"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                <div className="relative">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary pl-10"
                    placeholder="contact@client.com"
                  />
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                <div className="flex gap-2">
                  {['ACTIVE', 'INACTIVE'].map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s as any)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${status === s ? (s === 'ACTIVE' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30') : 'bg-secondary text-muted-foreground border-transparent'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary resize-none"
                placeholder="Payment terms, key contacts..."
                style={{ minHeight: '180px' }}
              />
            </div>
          </div>

          {/* Projects Section */}
          <div className="pt-6 border-t border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase size={16} className="text-accent-primary" /> Projects
              </h3>
              <div className="text-xs text-muted-foreground font-mono">
                Total Value: <span className="text-white font-bold">${(existingTotal + newProjectsTotal).toLocaleString()}</span>
              </div>
            </div>

            {/* Existing Projects List */}
            {initialClient && existingProjects.filter(p => p.clientId === initialClient.id).length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase">Existing Projects</div>
                {existingProjects.filter(p => p.clientId === initialClient.id).map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl border border-white/5">
                    <span className="text-sm font-medium text-gray-300">{p.title}</span>
                    <span className="text-sm font-mono text-green-400">${p.price?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Projects Inputs */}
            <div className="space-y-3">
              {pendingProjects.map((p, i) => (
                <div key={i} className="flex gap-3 items-center animate-in slide-in-from-left-2">
                  <input
                    value={p.title}
                    onChange={(e) => updatePendingProject(i, 'title', e.target.value)}
                    placeholder="New Project Title"
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-accent-primary"
                  />
                  <div className="relative w-32">
                    <input
                      type="number"
                      value={p.price || ''}
                      onChange={(e) => updatePendingProject(i, 'price', parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 pl-8 text-sm text-white focus:outline-none focus:border-accent-primary"
                    />
                    <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                  <button onClick={() => removePendingProject(i)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button onClick={handleAddProject} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                <Plus size={14} /> Add Project Pricing
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-bold bg-accent-primary text-white hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20">
            Save Client
          </button>
        </div>
      </div>
    </div>
  );
};
