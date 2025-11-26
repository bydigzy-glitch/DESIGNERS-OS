
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { ChevronLeft, ChevronRight, RefreshCw, Calendar as CalIcon, Trash2, Edit2, Bell, X, CheckCircle, AlertTriangle } from 'lucide-react';

declare global {
  interface Window {
    gapi: any;
  }
}

interface CalendarProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onChangeColor: (taskId: string, color: string) => void;
  onAddTask: (task: Task) => void;
  onAddTasks: (tasks: Task[]) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_HEIGHT = 80;

type CalendarView = 'DAY' | 'WEEK' | 'MONTH';

// Placeholder Keys - In a real app, these would be user-provided via Settings
const CLIENT_ID = ''; 
const API_KEY = ''; 
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

export const Calendar: React.FC<CalendarProps> = ({ tasks, onUpdateTask, onDeleteTask, onChangeColor, onAddTask, onAddTasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('WEEK');
  const [currentTimePos, setCurrentTimePos] = useState(0);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  
  // Google Auth State
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [gapiInited, setGapiInited] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; taskId: string | null }>({ visible: false, x: 0, y: 0, taskId: null });
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Initialize GAPI
  useEffect(() => {
    const initClient = () => {
      window.gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      }).then(() => {
        setGapiInited(true);
        // Check if already signed in
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance.isSignedIn.get()) {
            const user = authInstance.currentUser.get();
            setConnectedEmail(user.getBasicProfile().getEmail());
        }
      }).catch((err: any) => {
        console.log("GAPI Init Error (Expected if no keys provided):", err);
      });
    };

    if (window.gapi) {
        window.gapi.load('client:auth2', initClient);
    }
  }, []);

  const handleAuthClick = () => {
    if (!gapiInited) {
        setSyncError("API Keys missing in code. Add CLIENT_ID & API_KEY to Calendar.tsx to enable real sync.");
        return;
    }
    
    if (connectedEmail) {
        window.gapi.auth2.getAuthInstance().signOut().then(() => {
            setConnectedEmail(null);
        });
        return;
    }

    window.gapi.auth2.getAuthInstance().signIn().then(() => {
        const user = window.gapi.auth2.getAuthInstance().currentUser.get();
        setConnectedEmail(user.getBasicProfile().getEmail());
        listUpcomingEvents();
    }).catch((err: any) => {
        setSyncError("Login failed. Check console.");
        console.error(err);
    });
  };

  const listUpcomingEvents = () => {
    setIsSyncing(true);
    window.gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 10,
      'orderBy': 'startTime'
    }).then((response: any) => {
      const events = response.result.items;
      if (events && events.length > 0) {
        const newTasks: Task[] = events.map((event: any) => ({
            id: event.id,
            title: event.summary || 'No Title',
            completed: false,
            category: 'MEETING',
            date: new Date(event.start.dateTime || event.start.date),
            duration: 60, // Default duration if simple date
            color: 'blue'
        }));
        onAddTasks(newTasks);
      }
      setIsSyncing(false);
    }).catch((err: any) => {
       console.error("Fetch Events Error", err);
       setIsSyncing(false);
    });
  };

  // Calculate current time line
  useEffect(() => {
    const updateTimePos = () => {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(8, 0, 0, 0);
      const minutesPassed = (now.getTime() - startOfDay.getTime()) / 1000 / 60;
      setCurrentTimePos((minutesPassed / 60) * HOUR_HEIGHT);
    };
    updateTimePos();
    const interval = setInterval(updateTimePos, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close context menu
  useEffect(() => {
    const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  // View Helpers
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getWeekRangeString = () => {
    if (view === 'MONTH') {
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const start = getStartOfWeek(currentDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'MONTH') newDate.setMonth(newDate.getMonth() - 1);
    else if (view === 'WEEK') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'MONTH') newDate.setMonth(newDate.getMonth() + 1);
    else if (view === 'WEEK') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // Rendering Dates
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(getStartOfWeek(currentDate));
    d.setDate(d.getDate() + i);
    return d;
  });

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Fill previous month days
    const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startPad; i > 0; i--) {
        const d = new Date(year, month, 1 - i);
        days.push({ date: d, isCurrentMonth: false });
    }
    
    // Fill current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Fill next month to complete grid (up to 35 or 42 cells)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const isSameDate = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  const getTaskStyle = (task: Task) => {
    const startHour = task.date.getHours();
    const startMin = task.date.getMinutes();
    const hoursFromStart = startHour - 8 + (startMin / 60);
    return {
      top: `${hoursFromStart * HOUR_HEIGHT}px`,
      height: `${(task.duration / 60) * HOUR_HEIGHT}px`,
    };
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const dropY = e.clientY - rect.top;
    let newHour = 8 + Math.floor(dropY / HOUR_HEIGHT);
    const newDate = new Date(targetDate);
    newDate.setHours(newHour, 0, 0, 0); // Simplified drop logic
    onUpdateTask({ ...task, date: newDate });
    setDraggedTaskId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      taskId
    });
  };

  const handleEditSave = () => {
    if (editingTask) {
        onUpdateTask(editingTask);
        setEditingTask(null);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-6 md:p-8 overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-1">Production Schedule</h2>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             The Timeline
          </h1>
        </div>
        
        <div className="flex items-center gap-2 bg-[#141416] p-1 rounded-xl border border-white/5">
            {['DAY', 'WEEK', 'MONTH'].map((v) => (
                <button
                    key={v}
                    onClick={() => setView(v as CalendarView)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${view === v ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >
                    {v}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-2 rounded-full hover:bg-white/5"><ChevronLeft size={20} /></button>
            <span className="text-sm font-bold w-32 text-center select-none">{getWeekRangeString()}</span>
            <button onClick={handleNext} className="p-2 rounded-full hover:bg-white/5"><ChevronRight size={20} /></button>
            
            <button 
                onClick={handleAuthClick} 
                className={`ml-2 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border ${connectedEmail ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-card-bg text-white border-gray-700'}`}
            >
                {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <CalIcon size={16} />}
                {connectedEmail ? 'Synced' : 'Sync G-Cal'}
            </button>
        </div>
      </div>

      {syncError && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm">
              <AlertTriangle size={16} />
              {syncError}
              <button onClick={() => setSyncError(null)} className="ml-auto"><X size={14} /></button>
          </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto bg-card-bg rounded-4xl border border-gray-800 relative shadow-2xl">
         
         {view === 'MONTH' ? (
             <div className="grid grid-cols-7 h-full">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                     <div key={d} className="p-4 border-b border-r border-gray-800 text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
                 ))}
                 {getMonthDays().map((day, i) => {
                     const dayTasks = tasks.filter(t => isSameDate(t.date, day.date));
                     return (
                         <div key={i} className={`border-b border-r border-gray-800 p-2 min-h-[100px] ${!day.isCurrentMonth ? 'bg-black/20 text-gray-700' : ''}`}>
                             <div className={`text-sm font-bold mb-2 ${isSameDate(day.date, new Date()) ? 'text-accent-blue' : 'text-gray-400'}`}>{day.date.getDate()}</div>
                             <div className="space-y-1">
                                 {dayTasks.map(t => (
                                     <div key={t.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${t.color === 'blue' ? 'bg-accent-blue text-white' : 'bg-gray-800 text-gray-300'}`}>
                                         {t.title}
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )
                 })}
             </div>
         ) : (
            // Week/Day View Logic
            <div className={`grid ${view === 'DAY' ? 'grid-cols-1' : 'grid-cols-8'} relative min-w-[800px]`}>
                {/* Time Column */}
                <div className="border-r border-gray-800 bg-card-bg z-10 sticky left-0">
                    {HOURS.map(hour => (
                        <div key={hour} className="h-20 border-b border-gray-800/50 text-xs text-gray-500 text-right pr-4 pt-2">{hour}:00</div>
                    ))}
                </div>

                {/* Day Columns */}
                {(view === 'DAY' ? [currentDate] : weekDates).map((date, i) => (
                    <div 
                        key={i} 
                        className="border-r border-gray-800/50 relative"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, date)}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-card-bg z-20 border-b border-gray-800 p-4 text-center">
                            <div className="text-xs font-bold text-gray-500 uppercase">{DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]}</div>
                            <div className={`text-xl font-bold ${isSameDate(date, new Date()) ? 'text-accent-blue' : 'text-white'}`}>{date.getDate()}</div>
                        </div>

                        {HOURS.map(h => <div key={h} className="h-20 border-b border-gray-800/50"></div>)}
                        
                        {tasks.filter(t => isSameDate(t.date, date)).map(task => (
                            <div 
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                onClick={() => setEditingTask(task)}
                                onContextMenu={(e) => handleContextMenu(e, task.id)}
                                className={`absolute inset-x-1 rounded-xl p-3 text-xs font-bold shadow-lg overflow-hidden cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform z-10
                                    ${task.color === 'blue' ? 'bg-accent-blue text-white' : 'bg-gray-700 text-gray-200'}
                                `}
                                style={getTaskStyle(task)}
                            >
                                <div className="flex justify-between items-start">
                                    <span>{task.title}</span>
                                    {task.reminder && <Bell size={10} className="opacity-70" />}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
         )}
      </div>
      
      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
            className="fixed bg-[#141416] border border-gray-800 rounded-xl shadow-2xl p-2 z-[60] w-48"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
        >
            <button onClick={() => { 
                const t = tasks.find(t => t.id === contextMenu.taskId);
                if(t) setEditingTask(t);
                setContextMenu(prev => ({...prev, visible: false}));
             }} className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg text-sm text-white flex items-center gap-2">
                <Edit2 size={14} /> Edit Task
            </button>
            <div className="h-px bg-gray-800 my-1"></div>
            <button onClick={() => { onDeleteTask(contextMenu.taskId!); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-4 py-2 hover:bg-red-500/10 rounded-lg text-sm text-red-500 flex items-center gap-2">
                <Trash2 size={14} /> Delete
            </button>
            
            <div className="p-2 grid grid-cols-5 gap-1 mt-1">
                {['blue', 'purple', 'green', 'orange', 'red'].map(c => (
                    <button 
                        key={c} 
                        onClick={() => { onChangeColor(contextMenu.taskId!, c); setContextMenu({ ...contextMenu, visible: false }); }}
                        className={`w-6 h-6 rounded-full ${
                            c === 'blue' ? 'bg-accent-blue' : 
                            c === 'purple' ? 'bg-purple-500' : 
                            c === 'green' ? 'bg-green-500' : 
                            c === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                    />
                ))}
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1C1C1E] border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Edit Task</h3>
                    <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Task Title</label>
                        <input 
                            type="text" 
                            value={editingTask.title} 
                            onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                            className="w-full bg-black/50 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-accent-blue"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Start Time (Hour)</label>
                            <input 
                                type="number" 
                                min="0" max="23"
                                value={editingTask.date.getHours()} 
                                onChange={(e) => {
                                    const d = new Date(editingTask.date);
                                    d.setHours(parseInt(e.target.value));
                                    setEditingTask({...editingTask, date: d});
                                }}
                                className="w-full bg-black/50 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-accent-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Duration (Min)</label>
                            <input 
                                type="number" 
                                min="15" step="15"
                                value={editingTask.duration} 
                                onChange={(e) => setEditingTask({...editingTask, duration: parseInt(e.target.value)})}
                                className="w-full bg-black/50 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-accent-blue"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-2">
                            <Bell size={12} /> Reminder
                        </label>
                        <select 
                            value={editingTask.reminder || ''} 
                            onChange={(e) => setEditingTask({...editingTask, reminder: e.target.value ? parseInt(e.target.value) : undefined})}
                            className="w-full bg-black/50 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-accent-blue"
                        >
                            <option value="">No Reminder</option>
                            <option value="5">5 minutes before</option>
                            <option value="10">10 minutes before</option>
                            <option value="15">15 minutes before</option>
                            <option value="30">30 minutes before</option>
                            <option value="60">1 hour before</option>
                            <option value="1440">1 day before</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button onClick={handleEditSave} className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
