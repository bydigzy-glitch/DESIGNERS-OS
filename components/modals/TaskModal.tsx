
import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, Project } from '../../types';
import { X, Calendar as CalendarIcon, Clock, Trash2, FileText } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: (id: string) => void;
  initialTask?: Task | null;
  initialDate?: Date;
  projects?: Project[];
  defaultStatus?: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
}

const CATEGORIES: { id: TaskCategory; color: string }[] = [
  { id: 'PRODUCT', color: '#6366f1' },
  { id: 'CONTENT', color: '#ec4899' },
  { id: 'MONEY', color: '#10b981' },
  { id: 'ADMIN', color: '#64748b' },
  { id: 'MEETING', color: '#f59e0b' },
];

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, onDelete, initialTask, initialDate, projects = [], defaultStatus }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('PRODUCT');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [color, setColor] = useState('#6366f1');
  const [projectId, setProjectId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'>('TODO');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setCategory(initialTask.category);
      setDate(initialTask.date.toISOString().split('T')[0]);
      setTime(initialTask.date.toTimeString().slice(0, 5));
      setDuration(initialTask.duration);
      setColor(initialTask.color || '#6366f1');
      setProjectId(initialTask.projectId || '');
      setNotes(initialTask.notes || '');
      setStatus(initialTask.statusLabel || 'TODO');
    } else {
      setTitle('');
      setCategory('PRODUCT');
      if (initialDate) {
          setDate(initialDate.toISOString().split('T')[0]);
      } else {
          setDate(new Date().toISOString().split('T')[0]);
      }
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, '0')}:00`);
      setDuration(60);
      setColor('#6366f1');
      setProjectId('');
      setNotes('');
      setStatus(defaultStatus || 'TODO');
    }
  }, [initialTask, initialDate, isOpen, defaultStatus]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !date || !time) return;

    const startDateTime = new Date(`${date}T${time}`);
    
    onSave({
      ...(initialTask ? { id: initialTask.id } : {}),
      title,
      category,
      date: startDateTime,
      duration,
      color,
      completed: status === 'DONE',
      statusLabel: status,
      projectId: projectId || undefined,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#141416] border border-gray-800 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">{initialTask ? 'Edit Task' : 'New Task'}</h2>
          <div className="flex items-center gap-2">
            {initialTask && onDelete && (
              <button onClick={() => { onDelete(initialTask.id); onClose(); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
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
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date</label>
              <div className="relative">
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary pl-10"
                />
                <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Time</label>
              <div className="relative">
                <input 
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary pl-10"
                />
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>
          
          {projects.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assign Project</label>
                <select 
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary appearance-none"
                >
                    <option value="">No Project</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </select>
              </div>
          )}

          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
             <div className="flex gap-2 flex-wrap">
               {CATEGORIES.map(cat => (
                 <button
                   key={cat.id}
                   onClick={() => setCategory(cat.id)}
                   className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${category === cat.id ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-gray-500 border-transparent hover:bg-white/5'}`}
                 >
                   {cat.id}
                 </button>
               ))}
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color Label</label>
            <div className="flex gap-3">
              {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
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
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary pl-10 min-h-[100px] resize-none"
                    placeholder="Additional details..."
                />
                <FileText size={16} className="absolute left-3 top-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
           <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-bold bg-accent-primary text-white hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20">
             {initialTask ? 'Save Changes' : 'Create Task'}
           </button>
        </div>
      </div>
    </div>
  );
};
