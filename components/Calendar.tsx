import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskCategory } from '../types';
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Calendar as CalendarIcon, Clock, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { TaskModal } from './modals/TaskModal';
import { FadeIn } from './common/AnimatedComponents';

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

export const Calendar: React.FC<CalendarProps> = ({ tasks, onUpdateTask, onDeleteTask, onChangeColor, onAddTask, onAddTasks }) => {
    const [view, setView] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedSlotTime, setSelectedSlotTime] = useState<Date | undefined>(undefined);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string } | null>(null);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentDate);
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1) + i;
        d.setDate(diff);
        return d;
    });

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Add padding days from previous month
        const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        for (let i = startPadding; i > 0; i--) {
            const d = new Date(year, month, 1 - i);
            days.push({ date: d, isCurrentMonth: false });
        }

        // Add current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        // Add padding days for next month to fill 6 rows (42 days)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }

        return days;
    };

    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    const handleDrop = (e: React.DragEvent, hour: number, dayDate: Date) => {
        e.preventDefault();
        if (draggedTask) {
            const newDate = new Date(dayDate);
            newDate.setHours(hour, 0, 0, 0);
            onUpdateTask({ ...draggedTask, date: newDate });
            setDraggedTask(null);
        }
    };

    const handleSyncGoogle = async () => {
        if (!window.gapi) return;
        try {
            await window.gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'maxResults': 10,
                'orderBy': 'startTime'
            }).then((response: any) => {
                const events = response.result.items;
                const newTasks: Task[] = events.map((ev: any) => ({
                    id: ev.id,
                    title: ev.summary,
                    category: 'MEETING',
                    completed: false,
                    date: new Date(ev.start.dateTime || ev.start.date),
                    duration: 60,
                    color: '#6366f1',
                    statusLabel: 'TODO'
                }));
                onAddTasks(newTasks);
            });
        } catch (e) {
            console.error("Sync Error", e);
        }
    };

    const handleSlotClick = (date: Date, hour?: number) => {
        const newDate = new Date(date);
        if (hour !== undefined) newDate.setHours(hour, 0, 0, 0);
        setSelectedSlotTime(newDate);
        setSelectedTask(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        setSelectedTask(task);
        setSelectedSlotTime(undefined);
        setIsModalOpen(true);
    };

    const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, taskId });
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (view === 'MONTH') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        } else if (view === 'WEEK') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
    };

    // Helper for Day/Week View Grid
    const renderTimeGrid = (daysToRender: Date[]) => (
        <div className="flex-1 overflow-y-auto relative scrollbar-thin">
            <div className="flex relative min-h-[1440px] min-w-[600px] md:min-w-0">
                {/* Time Column */}
                <div className="w-16 border-r border-border bg-card z-10 sticky left-0 flex-shrink-0">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="h-[60px] border-b border-border text-xs font-medium text-muted-foreground p-2 text-right relative">
                            <span className="relative -top-3">{i}:00</span>
                        </div>
                    ))}
                </div>

                {/* Day Columns */}
                {daysToRender.map((day, dayIndex) => (
                    <div
                        key={dayIndex}
                        className="border-r border-border relative group flex-1 min-w-[100px]"
                    >
                        {/* Grid Lines */}
                        {Array.from({ length: 24 }).map((_, hour) => (
                            <div
                                key={hour}
                                className="h-[60px] border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, hour, day)}
                                onClick={() => handleSlotClick(day, hour)}
                            ></div>
                        ))}

                        {/* Events */}
                        {tasks
                            .filter(t => new Date(t.date).getDate() === day.getDate() && new Date(t.date).getMonth() === day.getMonth() && new Date(t.date).getFullYear() === day.getFullYear())
                            .map(task => {
                                const startHour = new Date(task.date).getHours();
                                const startMin = new Date(task.date).getMinutes();
                                const topPos = (startHour * 60) + startMin;
                                const durationHeight = (task.duration / 60) * 60;
                                return (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={() => handleDragStart(task)}
                                        onClick={(e) => handleEventClick(e, task)}
                                        onContextMenu={(e) => handleContextMenu(e, task.id)}
                                        className="absolute w-[90%] left-[5%] rounded-xl p-2 text-xs font-bold text-white shadow-lg cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all z-10 overflow-hidden"
                                        style={{
                                            top: `${topPos}px`,
                                            height: `${Math.max(durationHeight, 30)}px`,
                                            backgroundColor: task.color || '#6366f1'
                                        }}
                                    >
                                        <div className="truncate">{task.title}</div>
                                        {durationHeight > 40 && (
                                            <div className="opacity-70 text-[10px]">{new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                ))}

                {/* Current Time Line */}
                {daysToRender.some(d => d.toDateString() === new Date().toDateString()) && (
                    <div
                        className="absolute left-16 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                        style={{ top: `${(new Date().getHours() * 60) + new Date().getMinutes()}px` }}
                    >
                        <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <FadeIn className="flex flex-col h-full w-full overflow-hidden relative pb-20 md:pb-0" onClick={() => setContextMenu(null)}>
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Calendar</h1>
                    <p className="text-sm text-muted-foreground">Manage your schedule</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl border border-border">
                        {['DAY', 'WEEK', 'MONTH'].map((v) => (
                            <Button
                                key={v}
                                variant={view === v ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setView(v as any)}
                                className="text-xs font-bold"
                            >
                                {v}
                            </Button>
                        ))}
                    </div>

                    {/* Date Navigation */}
                    <div className="flex items-center gap-2 bg-secondary p-1.5 rounded-xl border border-border">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigateDate('prev')}
                            className="h-8 w-8"
                        >
                            <ChevronLeft size={18} />
                        </Button>
                        <span className="text-sm font-bold w-28 md:w-32 text-center text-foreground truncate">
                            {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigateDate('next')}
                            className="h-8 w-8"
                        >
                            <ChevronRight size={18} />
                        </Button>
                    </div>

                    {/* Sync Google */}
                    <Button
                        variant="outline"
                        onClick={handleSyncGoogle}
                        className="hidden md:flex"
                    >
                        Sync Google
                    </Button>

                    {/* Add Event */}
                    <Button
                        onClick={() => handleSlotClick(new Date(), new Date().getHours())}
                        className="gap-2"
                    >
                        <Plus size={16} /> Add Event
                    </Button>
                </div>
            </div>

            {/* CALENDAR BODY */}
            <div className="flex-1 bg-card rounded-2xl border border-border relative shadow-soft overflow-hidden flex flex-col w-full">

                {view === 'DAY' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-border text-center bg-secondary/30">
                            <div className="text-xs font-bold text-muted-foreground uppercase">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                            <div className="text-xl font-bold text-foreground">{currentDate.getDate()}</div>
                        </div>
                        {renderTimeGrid([currentDate])}
                    </div>
                )}

                {view === 'WEEK' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Header Row - Scrollable horizontally if needed */}
                        <div className="flex border-b border-border overflow-x-auto scrollbar-hide min-w-[600px] md:min-w-0">
                            <div className="w-16 border-r border-border flex-shrink-0"></div>
                            {weekDays.map((d, i) => (
                                <div key={i} className={`flex-1 min-w-[100px] p-4 text-center border-r border-border flex-shrink-0 ${d.getDate() === new Date().getDate() ? 'bg-secondary/30' : ''}`}>
                                    <div className="text-xs font-bold text-muted-foreground uppercase mb-1">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                    <div className={`text-xl font-bold ${d.getDate() === new Date().getDate() ? 'text-primary' : 'text-foreground'}`}>{d.getDate()}</div>
                                </div>
                            ))}
                        </div>
                        {renderTimeGrid(weekDays)}
                    </div>
                )}

                {view === 'MONTH' && (
                    // MONTH VIEW
                    <div className="flex-1 overflow-auto">
                        <div className="grid grid-cols-7 min-w-[800px] h-full">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="p-4 border-b border-r border-border text-xs font-bold text-muted-foreground uppercase text-center bg-secondary/30">
                                    {d}
                                </div>
                            ))}
                            {getDaysInMonth(currentDate).map((dayObj, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleSlotClick(dayObj.date, 9)}
                                    className={`p-2 border-b border-r border-border relative group hover:bg-secondary/30 transition-colors cursor-pointer flex flex-col gap-1 overflow-hidden min-h-[100px] ${!dayObj.isCurrentMonth ? 'opacity-30 bg-secondary/10' : ''}`}
                                >
                                    <div className={`text-sm font-bold mb-1 ${dayObj.date.toDateString() === new Date().toDateString() ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {dayObj.date.getDate()}
                                    </div>
                                    {tasks
                                        .filter(t => new Date(t.date).toDateString() === dayObj.date.toDateString())
                                        .slice(0, 3)
                                        .map(task => (
                                            <div key={task.id} onClick={(e) => handleEventClick(e, task)} className="px-1.5 py-0.5 rounded text-[10px] font-bold truncate text-white" style={{ backgroundColor: task.color || '#6366f1' }}>
                                                {task.title}
                                            </div>
                                        ))
                                    }
                                    {tasks.filter(t => new Date(t.date).toDateString() === dayObj.date.toDateString()).length > 3 && (
                                        <div className="text-[9px] text-muted-foreground pl-1">+ {tasks.filter(t => new Date(t.date).toDateString() === dayObj.date.toDateString()).length - 3} more</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(updated) => {
                    if (selectedTask) onUpdateTask({ ...selectedTask, ...updated });
                    else onAddTask({
                        id: Date.now().toString(),
                        title: 'New Event',
                        category: 'PRODUCT',
                        date: new Date(),
                        duration: 60,
                        completed: false,
                        statusLabel: 'TODO',
                        ...updated
                    } as Task);
                    setIsModalOpen(false);
                }}
                onDelete={onDeleteTask}
                initialTask={selectedTask}
                initialDate={selectedSlotTime}
            />

            {/* Mobile FAB */}
            <Button
                onClick={() => handleSlotClick(new Date(), new Date().getHours())}
                size="icon"
                className="md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-2xl z-40"
            >
                <Plus size={28} />
            </Button>

            {/* Context Menu */}
            {contextMenu && (
                <div className="fixed bg-card border border-border rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 w-40" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <Button
                        variant="ghost"
                        onClick={() => { onDeleteTask(contextMenu.taskId); setContextMenu(null); }}
                        className="flex items-center gap-2 justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 size={14} /> Delete
                    </Button>
                    <div className="h-px bg-border my-1"></div>
                    <div className="flex gap-1 p-1">
                        {['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'].map(c => (
                            <button key={c} onClick={() => { onChangeColor(contextMenu.taskId, c); setContextMenu(null); }} className="w-5 h-5 rounded-full hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </div>
            )}
        </FadeIn>
    );
};
