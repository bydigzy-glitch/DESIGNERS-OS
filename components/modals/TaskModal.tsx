
import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, Project, TeamMember } from '../../types';
import { X, Calendar as CalendarIcon, Clock, Trash2, FileText, Plus, Check, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: (id: string) => void;
  initialTask?: Task | null;
  initialDate?: Date;
  projects?: Project[];
  defaultStatus?: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  teamMembers?: TeamMember[];
}

// Initial Preset Categories
const INITIAL_CATEGORIES: { id: string; color: string }[] = [
  { id: 'PRODUCT', color: '#6366f1' },
  { id: 'CONTENT', color: '#ec4899' },
  { id: 'MONEY', color: '#10b981' },
  { id: 'ADMIN', color: '#64748b' },
  { id: 'MEETING', color: '#f59e0b' },
];

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, onDelete, initialTask, initialDate, projects = [], defaultStatus, teamMembers = [] }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('PRODUCT');
  const [date, setDate] = useState('');
  // const [time, setTime] = useState('09:00'); // Removed Time
  const [duration, setDuration] = useState(60);
  const [color, setColor] = useState('#6366f1');
  const [projectId, setProjectId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'>('TODO');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [assignedTo, setAssignedTo] = useState<string>('');

  // Custom Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [availableCategories, setAvailableCategories] = useState(INITIAL_CATEGORIES);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setCategory(initialTask.category);
      setDate(initialTask.date.toISOString().split('T')[0]);
      // setTime(initialTask.date.toTimeString().slice(0, 5));
      setDuration(initialTask.duration);
      setColor(initialTask.color || '#6366f1');
      setProjectId(initialTask.projectId || '');
      setNotes(initialTask.notes || '');
      setStatus(initialTask.statusLabel || 'TODO');
      setPriority(initialTask.priority || 'MEDIUM');
      setAssignedTo(initialTask.assignedTo || '');

      // Ensure custom category is in the list
      if (initialTask.category && !availableCategories.find(c => c.id === initialTask.category)) {
        setAvailableCategories(prev => [...prev, { id: initialTask.category, color: '#94a3b8' }]);
      }
    } else {
      setTitle('');
      setCategory('PRODUCT');
      if (initialDate) {
        setDate(initialDate.toISOString().split('T')[0]);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
      }
      // setTime('09:00');
      setDuration(60);
      setColor('#6366f1');
      setProjectId('');
      setNotes('');
      setStatus(defaultStatus || 'TODO');
      setPriority('MEDIUM');
      setAssignedTo('');
    }
  }, [initialTask, initialDate, isOpen, defaultStatus]);

  const handleSave = () => {
    if (!title.trim() || !date) return;

    // Default to 09:00 if strictly needed by date obj, or keep existing time
    const startDateTime = new Date(`${date}T09:00:00`);

    onSave({
      ...(initialTask ? { id: initialTask.id } : {}),
      title,
      category,
      date: startDateTime,
      duration,
      color,
      completed: status === 'DONE',
      statusLabel: status,
      priority,
      projectId: projectId || undefined,
      notes,
      assignedTo: assignedTo || undefined
    });
    onClose();
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newId = newCategoryName.toUpperCase().replace(/\s+/g, '_');
    // Check duplicate
    if (!availableCategories.find(c => c.id === newId)) {
      // Generate a random-ish pastel color
      const colors = ['#f472b6', '#22d3ee', '#a78bfa', '#fbbf24', '#34d399'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setAvailableCategories(prev => [...prev, { id: newId, color: randomColor }]);
    }
    setCategory(newId);
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'HIGH': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'MEDIUM': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 'LOW': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border/50 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-foreground">{initialTask ? 'Edit Task' : 'New Task'}</h2>
              <div className="flex items-center gap-2">
                {initialTask && onDelete && (
                  <button onClick={() => { onDelete(initialTask.id); onClose(); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Due Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:outline-none focus:border-primary pl-10 text-sm transition-colors"
                    />
                    <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Priority</label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className={`w-full bg-secondary border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-primary appearance-none font-bold transition-colors ${priority === 'HIGH' ? 'text-red-400' : priority === 'MEDIUM' ? 'text-orange-400' : 'text-blue-400'
                        }`}
                    >
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* ASSIGNEE SELECTOR */}
              {teamMembers.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assign to</label>
                  <div className="relative">
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:outline-none focus:border-primary appearance-none pl-10 text-sm transition-colors"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name || m.email}</option>
                      ))}
                    </select>
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </div>
              )}

              {projects.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assign Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:outline-none focus:border-primary appearance-none text-sm transition-colors"
                  >
                    <option value="">No Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Category</label>
                  <button
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="text-[10px] font-bold text-accent-primary hover:underline flex items-center gap-1"
                  >
                    <Plus size={10} /> {isAddingCategory ? 'Cancel' : 'New'}
                  </button>
                </div>

                {isAddingCategory && (
                  <div className="flex gap-2 mb-3 animate-in fade-in slide-in-from-top-1">
                    <input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="Category Name"
                      autoFocus
                    />
                    <button onClick={handleAddCategory} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-colors">Add</button>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {availableCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${category === cat.id ? 'bg-white/10 text-white border-white/20 shadow-inner' : 'bg-transparent text-gray-500 border-transparent hover:bg-white/5'}`}
                    >
                      {cat.id}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color Label</label>
                <div className="flex gap-3">
                  {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notes</label>
                <div className="relative">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:outline-none focus:border-primary pl-10 min-h-[100px] resize-none text-sm transition-colors"
                    placeholder="Additional details..."
                  />
                  <FileText size={16} className="absolute left-3 top-4 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border/50 flex justify-between items-center shrink-0">
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-sm">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm text-sm">
                {initialTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
