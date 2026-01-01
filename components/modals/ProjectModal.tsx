
import React, { useState, useEffect } from 'react';
import { Project, Task, Client } from '../../types';
import { X, Trash2, Calendar as CalendarIcon, CheckSquare, FileText, DollarSign } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => void;
  onDelete?: (id: string) => void;
  initialProject?: Project | null;
  allTasks?: Task[];
  clients?: Client[];
  onLinkTasks?: (taskIds: string[], projectId: string) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen, onClose, onSave, onDelete, initialProject, allTasks = [], clients = [], onLinkTasks
}) => {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [customClientName, setCustomClientName] = useState(''); // Fallback if no client ID
  const [status, setStatus] = useState<Project['status']>('ACTIVE');
  const [deadline, setDeadline] = useState('');
  const [tags, setTags] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState<string>('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialProject) {
      setTitle(initialProject.title);
      setClientId(initialProject.clientId || '');
      setCustomClientName(initialProject.client || '');
      setStatus(initialProject.status);
      setDeadline(initialProject.deadline ? new Date(initialProject.deadline).toISOString().split('T')[0] : '');
      setTags(initialProject.tags.join(', '));
      setColor(initialProject.color);
      setNotes(initialProject.notes || '');
      setPrice(initialProject.price ? initialProject.price.toString() : '');
      // Only set initial linked tasks once when opening
      setSelectedTaskIds(allTasks.filter(t => t.projectId === initialProject.id).map(t => t.id));
    } else {
      setTitle('');
      setClientId('');
      setCustomClientName('');
      setStatus('ACTIVE');
      setDeadline('');
      setTags('');
      setColor('#6366f1');
      setNotes('');
      setPrice('');
      setSelectedTaskIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProject, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    const finalId = initialProject ? initialProject.id : Date.now().toString();

    if (onLinkTasks && selectedTaskIds.length > 0) {
      onLinkTasks(selectedTaskIds, finalId);
    }

    let computedProgress = initialProject ? initialProject.progress : 0;

    if (selectedTaskIds.length > 0) {
      const linkedTasks = allTasks.filter(t => selectedTaskIds.includes(t.id));
      const completed = linkedTasks.filter(t => t.completed).length;
      computedProgress = Math.round((completed / linkedTasks.length) * 100);
    }

    // Resolve client name
    const resolvedClientName = clientId
      ? clients.find(c => c.id === clientId)?.name || 'Unknown'
      : customClientName || 'Unassigned';

    onSave({
      ...(initialProject ? { id: initialProject.id } : { id: finalId }),
      title,
      client: resolvedClientName,
      clientId: clientId || undefined,
      status,
      deadline: deadline ? new Date(deadline) : undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      color,
      progress: computedProgress,
      notes,
      price: parseFloat(price) || 0
    });
    onClose();
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const availableTasks = allTasks.filter(t => !t.projectId || (initialProject && t.projectId === initialProject.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#141416] border border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[65vh] md:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">{initialProject ? 'Edit Project' : 'New Project'}</h2>
          <div className="flex items-center gap-2">
            {initialProject && onDelete && (
              <button onClick={() => { onDelete(initialProject.id); onClose(); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors" title="Delete Project" aria-label="Delete Project">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors" title="Close Modal" aria-label="Close Modal">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <div>
            <label htmlFor="project-title" className="block text-xs font-bold text-gray-500 uppercase mb-2">Project Title</label>
            <input
              id="project-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary"
              placeholder="Ex. Nike Rebrand"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Client</label>
              {clients.length > 0 ? (
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary appearance-none"
                  aria-label="Select Client"
                >
                  <option value="">Select Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary"
                  placeholder="Client Name"
                  aria-label="Client Name"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Value</label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-8 text-white focus:outline-none focus:border-accent-primary"
                  placeholder="0.00"
                  aria-label="Project Value"
                />
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary appearance-none"
                aria-label="Project Status"
              >
                <option value="INTAKE">Intake</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="REVISION">Revision</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Deadline</label>
              <div className="relative">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary pl-10"
                  aria-label="Project Deadline"
                />
                <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Link Tasks</label>
            <div className="bg-black/30 border border-white/10 rounded-xl p-2 max-h-40 overflow-y-auto">
              {availableTasks.length > 0 ? availableTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => toggleTaskSelection(t.id)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedTaskIds.includes(t.id) ? 'bg-accent-primary/20' : 'hover:bg-white/5'}`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedTaskIds.includes(t.id) ? 'bg-accent-primary border-accent-primary' : 'border-gray-600'}`}>
                    {selectedTaskIds.includes(t.id) && <CheckSquare size={10} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-300 truncate">{t.title}</span>
                </div>
              )) : (
                <div className="text-xs text-gray-500 text-center py-2">No unlinked tasks available.</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tags (comma separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary"
              placeholder="Design, Strategy, Web"
              aria-label="Project Tags"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color Label</label>
            <div className="flex gap-2">
              {[
                { hex: '#f97316', cls: 'bg-orange-500' },
                { hex: '#3b82f6', cls: 'bg-blue-500' },
                { hex: '#10b981', cls: 'bg-emerald-500' },
                { hex: '#ef4444', cls: 'bg-red-500' },
                { hex: '#8b5cf6', cls: 'bg-violet-500' },
                { hex: '#ec4899', cls: 'bg-pink-500' }
              ].map((item) => (
                <button
                  key={item.hex}
                  type="button"
                  onClick={() => setColor(item.hex)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${item.cls} ${color === item.hex ? 'ring-2 ring-offset-2 ring-offset-[#1a1b1e] ring-white' : ''}`}
                  title={`Select color ${item.hex}`}
                  aria-label={`Select color ${item.hex}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="project-notes" className="block text-xs font-bold text-gray-500 uppercase mb-2">Notes</label>
            <div className="relative">
              <textarea
                id="project-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary pl-10 min-h-[100px] resize-none"
                placeholder="Additional project details..."
              />
              <FileText size={16} className="absolute left-3 top-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-bold bg-accent-primary text-white hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20">
            {initialProject ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
