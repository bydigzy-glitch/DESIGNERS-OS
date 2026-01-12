
import React, { useState } from 'react';
import { Task } from '../types';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskModal } from './modals/TaskModal';
import { FadeIn } from './common/AnimatedComponents';

interface CalendarViewProps {
    tasks: Task[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onChangeColor: (taskId: string, color: string) => void;
    onAddTask: (task: Task) => void;
    onAddTasks: (tasks: Task[]) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onUpdateTask, onDeleteTask, onChangeColor, onAddTask, onAddTasks }) => {
    const [view, setView] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedSlotTime, setSelectedSlotTime] = useState<Date | undefined>(undefined);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentDate);
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1) + i;
        d.setDate(diff);
        return d;
    });

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

    const renderTimeGrid = (daysToRender: Date[]) => (
        <div className="flex-1 overflow-y-auto relative scrollbar-thin">
            <div className="flex relative min-h-[1440px] min-w-[600px] md:min-w-0">
                <div className="w-16 border-r border-border bg-card z-10 sticky left-0 flex-shrink-0">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="h-[60px] border-b border-border text-xs font-medium text-muted-foreground p-2 text-right relative">
                            <span className="relative -top-3">{i}:00</span>
                        </div>
                    ))}
                </div>

                {daysToRender.map((day, dayIndex) => (
                    <div key={dayIndex} className="border-r border-border relative group flex-1 min-w-[100px]">
                        {Array.from({ length: 24 }).map((_, hour) => (
                            <div
                                key={hour}
                                className="h-[60px] border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                                onClick={() => handleSlotClick(day, hour)}
                                title={`Add task at ${hour}:00`}
                                aria-label={`Add task at ${hour}:00 on ${day.toLocaleDateString()}`}
                            ></div>
                        ))}

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
                                        onClick={(e) => handleEventClick(e, task)}
                                        className="absolute w-[90%] left-[5%] rounded-xl p-2 text-xs font-bold text-white shadow-lg cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all z-10 overflow-hidden"
                                        title={`${task.title} (${task.duration}m)`}
                                        aria-label={`${task.title} starting at ${new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                        style={{
                                            top: `${topPos}px`,
                                            height: `${Math.max(durationHeight, 30)}px`,
                                            backgroundColor: task.color || '#6366f1'
                                        }}
                                    >
                                        <div className="truncate">{task.title}</div>
                                    </div>
                                );
                            })}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 gap-4 p-4 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')} title="Previous" aria-label="Previous date"><ChevronLeft size={18} /></Button>
                    <span className="text-sm font-bold w-32 text-center">
                        {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => navigateDate('next')} title="Next" aria-label="Next date"><ChevronRight size={18} /></Button>
                </div>
                <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl">
                    {['DAY', 'WEEK', 'MONTH'].map((v) => (
                        <Button
                            key={v}
                            variant={view === v ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setView(v as any)}
                            className="text-[10px] h-7"
                            title={`Switch to ${v.toLowerCase()} view`}
                            aria-label={`Switch to ${v.toLowerCase()} view`}
                        >
                            {v}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden flex flex-col relative">
                {view === 'WEEK' && renderTimeGrid(weekDays)}
                {view === 'DAY' && renderTimeGrid([currentDate])}
                {view === 'MONTH' && (
                    <div className="p-4 text-center text-muted-foreground">Month view simplifies...</div>
                )}
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(updated) => {
                    if (selectedTask) onUpdateTask({ ...selectedTask, ...updated });
                    else onAddTask({ id: Date.now().toString(), title: 'New Event', category: 'PRODUCT', date: new Date(), duration: 60, completed: false, statusLabel: 'TODO', ...updated } as Task);
                }}
                onDelete={onDeleteTask}
                initialTask={selectedTask}
                initialDate={selectedSlotTime}
            />
        </div>
    );
};
