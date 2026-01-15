
import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, Project, TeamMember } from '../../types';
import { X, Calendar as CalendarIcon, Clock, Trash2, FileText, Plus, Check, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  { id: 'MEETING', color: '#6366f1' },
];

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, onDelete, initialTask, initialDate, projects = [], defaultStatus, teamMembers = [] }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('PRODUCT');
  const [date, setDate] = useState('');
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setCategory(initialTask.category);
      setDate(new Date(initialTask.date).toISOString().split('T')[0]);
      setDuration(initialTask.duration);
      setColor(initialTask.color || '#6366f1');
      setProjectId(initialTask.projectId || '');
      setNotes(initialTask.notes || '');
      setStatus(initialTask.statusLabel || 'TODO');
      setPriority(initialTask.priority || 'MEDIUM');
      setAssignedTo(initialTask.assignedTo || '');

      if (initialTask.category && !availableCategories.find(c => c.id === initialTask.category)) {
        setAvailableCategories(prev => [...prev, { id: initialTask.category, color: '#94a3b8' }]);
      }
    } else {
      setTitle('');
      setCategory('PRODUCT');
      setDate((initialDate || new Date()).toISOString().split('T')[0]);
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
    if (!availableCategories.find(c => c.id === newId)) {
      setAvailableCategories(prev => [...prev, { id: newId, color: '#6366f1' }]);
    }
    setCategory(newId);
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-[#12141a] border border-white/10 rounded-[28px] w-full max-w-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col max-h-[92vh] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-center shrink-0">
              <h2 className="text-[22px] font-bold text-white tracking-tight">
                {initialTask ? 'Edit Task' : 'New Task'}
              </h2>
              <div className="flex items-center gap-3">
                {initialTask && onDelete && (
                  <button
                    onClick={() => {
                      if (isConfirmingDelete) {
                        onDelete(initialTask.id);
                        onClose();
                      } else {
                        setIsConfirmingDelete(true);
                      }
                    }}
                    onMouseLeave={() => setIsConfirmingDelete(false)}
                    className={cn(
                      "p-2 rounded-full transition-all flex items-center gap-2",
                      isConfirmingDelete ? "bg-red-500 text-white px-4" : "text-white/40 hover:text-red-400 hover:bg-red-500/10"
                    )}
                  >
                    <Trash2 size={20} />
                    {isConfirmingDelete && <span className="text-[11px] font-bold">Confirm</span>}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  title="Close"
                  aria-label="Close modal"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="px-8 py-4 space-y-8 overflow-y-auto custom-scrollbar flex-1 pb-10">
              {/* Title Section */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black tracking-[0.1em] text-white/40 uppercase">Title</Label>
                <div className="relative group">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#1c212c] border border-white/5 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-lg font-medium"
                    placeholder="Task title..."
                    autoFocus
                    title="Task Title"
                    aria-label="Task Title"
                  />
                </div>
              </div>

              {/* Date & Priority */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black tracking-[0.1em] text-white/40 uppercase">Due Date</Label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#1c212c] border border-white/5 rounded-2xl p-4 text-white text-[15px] focus:outline-none focus:border-primary/50 transition-all pl-12 appearance-none"
                      title="Due Date"
                      aria-label="Due Date"
                    />
                    <CalendarIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black tracking-[0.1em] text-white/40 uppercase">Priority</Label>
                  <div className="relative group">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      title="Select Priority"
                      aria-label="Select Priority"
                      className={cn(
                        "w-full bg-[#1c212c] border border-white/5 rounded-2xl p-4 text-[15px] focus:outline-none focus:border-primary/50 appearance-none font-bold transition-all pr-10",
                        priority === 'HIGH' ? "text-red-400" : priority === 'MEDIUM' ? "text-orange-400" : "text-blue-400"
                      )}
                    >
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-transform group-hover:scale-110" />
                  </div>
                </div>
              </div>

              {/* Project Assignment */}
              {projects.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-[10px] font-black tracking-[0.1em] text-white/40 uppercase">Assign Project</Label>
                  <div className="relative group">
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      title="Select Project"
                      aria-label="Select Project"
                      className="w-full bg-[#1c212c] border border-white/5 rounded-2xl p-4 text-white/70 text-[15px] focus:outline-none focus:border-primary/50 appearance-none transition-all pr-10"
                    >
                      <option value="">No Project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black tracking-[0.1em] text-white/40 uppercase">Category</Label>
                  <button
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> {isAddingCategory ? 'Cancel' : 'New'}
                  </button>
                </div>

                {isAddingCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2"
                  >
                    <input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 bg-[#1c212c] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:border-primary/50 transition-all"
                      placeholder="Category name..."
                      autoFocus
                    />
                    <button
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      Add
                    </button>
                  </motion.div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {availableCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "px-5 py-2.5 rounded-2xl text-[11px] font-black tracking-wider uppercase transition-all duration-300",
                        category === cat.id
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                      )}
                    >
                      {cat.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Labels */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black tracking-[0.1em] text-white/40 uppercase">Color Label</Label>
                <div className="flex gap-4">
                  {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all duration-300 relative group",
                        color === c ? "ring-2 ring-white ring-offset-4 ring-offset-[#12141a] scale-110" : "hover:scale-110"
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check size={16} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black tracking-[0.1em] text-white/40 uppercase">Notes</Label>
                <div className="relative group">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#1c212c] border border-white/5 rounded-2xl p-4 text-white/90 placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all pl-12 min-h-[140px] resize-none text-[15px] leading-relaxed"
                    placeholder="Check notes..."
                  />
                  <FileText size={18} className="absolute left-4 top-4 text-white/20 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-8 border-t border-white/5 flex justify-between items-center bg-[#12141a]">
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white font-bold transition-all text-[15px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 text-[16px]"
              >
                {initialTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

