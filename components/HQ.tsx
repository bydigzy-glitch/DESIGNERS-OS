
import React, { useState, useEffect } from 'react';
import { Task, ViewMode } from '../types';
import { Plus, Activity, Zap, Pause, Play, Calendar, FileText, Clock, ArrowRight, Grid } from 'lucide-react';

interface HQProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onStartRecovery: (energy: number) => void;
  onNavigate: (view: ViewMode) => void;
}

export const HQ: React.FC<HQProps> = ({ tasks, setTasks, onStartRecovery, onNavigate }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [energyInput, setEnergyInput] = useState(5);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) setIsTimerRunning(false);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = { id: Date.now().toString(), title: newTaskTitle, completed: false, category: 'PRODUCT', date: new Date(), duration: 60 };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  // Filter for today's tasks
  const today = new Date();
  const todaysTasks = tasks.filter(t => 
    t.date.getDate() === today.getDate() && 
    t.date.getMonth() === today.getMonth() && 
    t.date.getFullYear() === today.getFullYear()
  ).sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full relative">
      <div className="flex justify-between items-end mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h2 className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em]">Command Center</h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter uppercase leading-none">Designpreneur OS</h1>
        </div>
        <div className="w-14 h-14 rounded-full bg-[#1C1C1E] border border-white/5 flex items-center justify-center shadow-2xl">
            <Activity size={20} className={`text-white opacity-80 ${isTimerRunning ? 'animate-pulse' : ''}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
            
            {/* Today's Schedule (Replaces Active Projects) */}
            <div className="bg-[#1C1C1E] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Calendar size={20} className="text-accent-blue" />
                      Today's Schedule
                    </h3>
                    <button onClick={() => onNavigate('CALENDAR')} className="text-xs font-bold uppercase tracking-wider text-accent-blue hover:text-white transition-colors">Full Timeline</button>
                </div>
                
                {todaysTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tasks scheduled for today.</p>
                    <button onClick={() => onNavigate('CALENDAR')} className="text-accent-blue text-sm font-bold mt-2">Plan your day</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-accent-blue/30 transition-all group">
                         <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-white/10 pr-4">
                            <span className="text-xs font-bold text-gray-400">{t.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </div>
                         <div className="flex-1">
                            <h4 className="text-sm font-bold text-white group-hover:text-accent-blue transition-colors">{t.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                               <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${t.category === 'MEETING' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {t.category}
                               </span>
                               <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                  <Clock size={10} /> {t.duration}m
                               </span>
                            </div>
                         </div>
                         <div className={`w-3 h-3 rounded-full ${t.color === 'blue' ? 'bg-accent-blue' : t.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'}`}></div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* The Grid (Quick Tasks) */}
            <div className="bg-[#1C1C1E] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white tracking-tight">Quick Capture</h3>
                </div>
                <form onSubmit={addTask} className="relative group mb-4">
                    <Plus size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Add new task..." className="w-full bg-[#141416] text-white rounded-2xl pl-12 h-14 focus:outline-none focus:ring-1 focus:ring-accent-blue transition-all" />
                </form>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4">
               {[
                 { label: 'New Invoice', icon: <FileText size={18} />, action: () => onNavigate('FILES') },
                 { label: 'Upload', icon: <Plus size={18} />, action: () => onNavigate('FILES') },
                 { label: 'Apps', icon: <Grid size={18} />, action: () => onNavigate('APPS') },
                 { label: 'Schedule', icon: <Calendar size={18} />, action: () => onNavigate('CALENDAR') },
               ].map((a, i) => (
                  <button key={i} onClick={a.action} className="bg-[#1C1C1E] p-4 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors group">
                     <div className="text-gray-400 group-hover:text-white transition-colors">{a.icon}</div>
                     <span className="text-[10px] font-bold uppercase text-gray-500 group-hover:text-accent-blue transition-colors">{a.label}</span>
                  </button>
               ))}
            </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#1C1C1E] rounded-[2.5rem] p-8 border border-white/5 flex flex-col items-center justify-center relative shadow-2xl gap-4 min-h-[300px]">
                 <div className="absolute top-6 left-6 text-xs font-bold uppercase text-gray-500 tracking-wider">Focus Timer</div>
                 <div className="text-6xl font-bold text-white tracking-tighter tabular-nums">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2,'0')}</div>
                 <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/20">
                    {isTimerRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                 </button>
            </div>

            <div 
               onClick={() => setShowRecoveryModal(true)}
               className="bg-gradient-to-b from-[#2a1a1a] to-[#1C1C1E] rounded-[2.5rem] p-8 border border-red-500/10 cursor-pointer shadow-2xl relative overflow-hidden group min-h-[200px] flex flex-col justify-end"
             >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-600/20 rounded-full blur-[60px] group-hover:bg-red-600/30 transition-all"></div>
                <div className="relative z-10">
                   <h3 className="text-2xl font-bold text-white mb-1">System Reboot</h3>
                   <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Recover Inspiration</p>
                   <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                      <ArrowRight size={20} />
                   </div>
                </div>
            </div>
        </div>
      </div>
      
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
             <div className="bg-[#141416] w-full max-w-md rounded-3xl p-8 border border-gray-800">
                 <h3 className="text-2xl font-bold text-white mb-6">Energy Level: {energyInput}</h3>
                 <input type="range" min="1" max="10" value={energyInput} onChange={e => setEnergyInput(Number(e.target.value))} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer mb-8" />
                 <button onClick={() => { setShowRecoveryModal(false); onStartRecovery(energyInput); }} className="w-full bg-white text-black py-4 rounded-xl font-bold">INITIATE RECOVERY</button>
             </div>
        </div>
      )}
    </div>
  );
};
