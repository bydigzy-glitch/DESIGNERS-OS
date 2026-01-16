import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, Project } from '../types';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Users,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskModal } from './modals/TaskModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CalendarPageProps {
    tasks: Task[];
    projects: Project[];
    onUpdateTask: (task: Task) => void;
    onAddTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
}

type CalendarView = 'day' | 'week' | 'month';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CalendarPage: React.FC<CalendarPageProps> = ({
    tasks,
    projects,
    onUpdateTask,
    onAddTask,
    onDeleteTask,
}) => {
    const [view, setView] = useState<CalendarView>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to current time
    useEffect(() => {
        if (view === 'month') return;

        const timer = setTimeout(() => {
            if (scrollContainerRef.current) {
                const now = new Date();
                const currentHour = now.getHours();
                const hourSelector = `#hour-${currentHour}`;
                const element = scrollContainerRef.current.querySelector(hourSelector);

                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 300); // Small delay to ensure render is complete

        return () => clearTimeout(timer);
    }, [view]);

    // Navigation helpers
    const navigatePrev = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') {
            newDate.setDate(newDate.getDate() - 1);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    };

    const navigateNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') {
            newDate.setDate(newDate.getDate() + 1);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get start of week
    const getWeekStart = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    };

    // Get days in current week
    const weekDays = useMemo(() => {
        const start = getWeekStart(currentDate);
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            return day;
        });
    }, [currentDate]);

    // Get days in current month
    const monthDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [currentDate]);

    // Filter tasks for current view
    const visibleTasks = useMemo(() => {
        if (view === 'day') {
            const dayStart = new Date(currentDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(currentDate);
            dayEnd.setHours(23, 59, 59, 999);

            return tasks.filter(t => {
                const taskDate = new Date(t.date);
                return taskDate >= dayStart && taskDate <= dayEnd;
            });
        } else if (view === 'week') {
            const weekStart = getWeekStart(currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            return tasks.filter(t => {
                const taskDate = new Date(t.date);
                return taskDate >= weekStart && taskDate < weekEnd;
            });
        } else {
            const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

            return tasks.filter(t => {
                const taskDate = new Date(t.date);
                return taskDate >= monthStart && taskDate <= monthEnd;
            });
        }
    }, [tasks, currentDate, view]);

    // Get tasks for a specific date
    const getTasksForDate = (date: Date) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        return tasks.filter(t => {
            const taskDate = new Date(t.date);
            return taskDate >= dayStart && taskDate <= dayEnd;
        });
    };

    // Get tasks for a specific hour
    const getTasksForHour = (date: Date, hour: number) => {
        return visibleTasks.filter(t => {
            const taskDate = new Date(t.date);
            return (
                taskDate.getDate() === date.getDate() &&
                taskDate.getMonth() === date.getMonth() &&
                taskDate.getFullYear() === date.getFullYear() &&
                taskDate.getHours() === hour
            );
        });
    };

    // Handle time slot click
    const handleTimeSlotClick = (date: Date, hour: number) => {
        const newDate = new Date(date);
        newDate.setHours(hour, 0, 0, 0);
        setSelectedDate(newDate);
        setSelectedTime(`${hour.toString().padStart(2, '0')}:00`);
        setSelectedTask(null);
        setIsTaskModalOpen(true);
    };

    // Handle task click
    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsTaskModalOpen(true);
    };

    // Format date header
    const getDateHeader = () => {
        if (view === 'day') {
            return currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else if (view === 'week') {
            const weekStart = getWeekStart(currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else {
            return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }
    };

    // Check if date is today
    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0 px-6 pt-6 pb-2 border-b border-border/20 backdrop-blur-[2px] bg-background/40"
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Title */}
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">
                            Calendar
                        </h1>
                        <div className="h-6 w-px bg-border/50 hidden md:block" />
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon size={18} className="text-primary/70" />
                            <h2 className="text-lg font-medium">{getDateHeader()}</h2>
                            {visibleTasks.length > 0 && (
                                <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1.5 font-bold">
                                    {visibleTasks.length}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        {/* View Switcher */}
                        <div className="flex p-1 bg-secondary/40 backdrop-blur-md rounded-xl border border-border/30 shadow-sm">
                            <Button
                                variant={view === 'day' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setView('day')}
                                className="text-xs font-bold px-4 rounded-lg transition-all"
                            >
                                Day
                            </Button>
                            <Button
                                variant={view === 'week' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setView('week')}
                                className="text-xs font-bold px-4 rounded-lg transition-all"
                            >
                                Week
                            </Button>
                            <Button
                                variant={view === 'month' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setView('month')}
                                className="text-xs font-bold px-4 rounded-lg transition-all"
                            >
                                Month
                            </Button>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-2 p-1 bg-secondary/40 backdrop-blur-md rounded-xl border border-border/30 shadow-sm">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={navigatePrev}
                                className="rounded-lg hover:bg-primary/10 transition-all"
                            >
                                <ChevronLeft size={18} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={goToToday}
                                className="text-xs font-bold px-4 hover:bg-primary/10 transition-all"
                            >
                                Today
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={navigateNext}
                                className="hover:bg-primary/10 transition-all"
                            >
                                <ChevronRight size={18} />
                            </Button>
                        </div>

                        {/* Add Event Button */}
                        <Button
                            onClick={() => {
                                setSelectedTask(null);
                                setSelectedDate(new Date());
                                setIsTaskModalOpen(true);
                            }}
                            className="gap-2"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">New Event</span>
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Calendar Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                <AnimatePresence mode="wait">
                    {/* Day View */}
                    {view === 'day' && (
                        <motion.div
                            key="day-view"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-full"
                        >
                            <Card className="h-full overflow-hidden border border-border/50 shadow-xl backdrop-blur-sm bg-card/50">
                                <div className="h-full overflow-y-auto" ref={scrollContainerRef}>
                                    {/* Time slots */}
                                    <div className="relative">
                                        {HOURS.map((hour) => {
                                            const hourTasks = getTasksForHour(currentDate, hour);
                                            return (
                                                <div
                                                    key={hour}
                                                    id={`hour-${hour}`}
                                                    className="flex border-b border-border/30 hover:bg-secondary/20 transition-colors group relative"
                                                >
                                                    {/* Time label */}
                                                    <div className="w-20 flex-shrink-0 p-4 text-sm font-medium text-muted-foreground border-r border-border/30">
                                                        {hour.toString().padStart(2, '0')}:00
                                                    </div>

                                                    {/* Event area */}
                                                    <div
                                                        onClick={() => handleTimeSlotClick(currentDate, hour)}
                                                        className="flex-1 min-h-[80px] p-2 cursor-pointer relative"
                                                    >
                                                        {/* Add button on hover */}
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                            <div className="bg-primary/10 text-primary rounded-lg p-2 border border-primary/20">
                                                                <Plus size={16} />
                                                            </div>
                                                        </div>

                                                        {/* Events */}
                                                        <div className="space-y-2 relative z-10">
                                                            {hourTasks.map((task) => (
                                                                <motion.div
                                                                    key={task.id}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleTaskClick(task);
                                                                    }}
                                                                    className="p-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-border/50 backdrop-blur-sm"
                                                                    style={{
                                                                        background: task.color
                                                                            ? `linear-gradient(135deg, ${task.color}15 0%, ${task.color}05 100%)`
                                                                            : 'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 100%)',
                                                                        borderLeftWidth: '4px',
                                                                        borderLeftColor: task.color || 'hsl(var(--primary))',
                                                                    }}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="font-bold text-sm truncate">{task.title}</h4>
                                                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                                <Clock size={12} />
                                                                                <span>{task.duration}m</span>
                                                                                {task.category && (
                                                                                    <>
                                                                                        <span>•</span>
                                                                                        <span className="capitalize">{task.category.toLowerCase()}</span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {task.priority === 'HIGH' && (
                                                                            <Badge variant="destructive" className="text-[9px] h-5 px-2">
                                                                                High
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Week View */}
                    {view === 'week' && (
                        <motion.div
                            key="week-view"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-full"
                        >
                            <Card className="h-full overflow-hidden border border-border/30 shadow-md backdrop-blur-sm bg-card/30">
                                <div className="h-full overflow-auto" ref={scrollContainerRef}>
                                    {/* Day headers */}
                                    <div className="sticky top-0 z-20 bg-secondary/60 backdrop-blur-md border-b border-border/30">
                                        <div className="flex">
                                            <div className="w-20 flex-shrink-0 border-r border-border/30" />
                                            {weekDays.map((day, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "flex-1 p-4 text-center border-r border-border/30 last:border-r-0",
                                                        isToday(day) && "bg-primary/10"
                                                    )}
                                                >
                                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                                        {DAYS[day.getDay()]}
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            "text-lg font-bold mt-1",
                                                            isToday(day) && "text-primary"
                                                        )}
                                                    >
                                                        {day.getDate()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time grid */}
                                    <div className="relative">
                                        {HOURS.map((hour) => (
                                            <div key={hour} id={`hour-${hour}`} className="flex border-b border-border/30 transition-colors">
                                                <div className="w-20 flex-shrink-0 p-4 text-xs font-medium text-muted-foreground border-r border-border/30">
                                                    {hour.toString().padStart(2, '0')}:00
                                                </div>
                                                {weekDays.map((day, i) => {
                                                    const hourTasks = getTasksForHour(day, hour);
                                                    return (
                                                        <div
                                                            key={i}
                                                            onClick={() => handleTimeSlotClick(day, hour)}
                                                            className={cn(
                                                                "flex-1 min-h-[80px] p-2 border-r border-border/30 last:border-r-0 cursor-pointer relative group hover:bg-secondary/20 transition-colors",
                                                                isToday(day) && "bg-primary/5"
                                                            )}
                                                        >
                                                            {/* Add button on hover */}
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                <div className="bg-primary/10 text-primary rounded p-1 border border-primary/20">
                                                                    <Plus size={12} />
                                                                </div>
                                                            </div>

                                                            {/* Events */}
                                                            <div className="space-y-1 relative z-10">
                                                                {hourTasks.map((task) => (
                                                                    <motion.div
                                                                        key={task.id}
                                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleTaskClick(task);
                                                                        }}
                                                                        className="p-2 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer text-xs border border-border/30 backdrop-blur-sm"
                                                                        style={{
                                                                            background: task.color
                                                                                ? `linear-gradient(135deg, ${task.color}20 0%, ${task.color}10 100%)`
                                                                                : 'linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--primary) / 0.1) 100%)',
                                                                            borderLeftWidth: '3px',
                                                                            borderLeftColor: task.color || 'hsl(var(--primary))',
                                                                        }}
                                                                    >
                                                                        <div className="font-bold truncate text-[10px]">{task.title}</div>
                                                                        <div className="text-[9px] text-muted-foreground mt-0.5">
                                                                            {task.duration}m
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Month View */}
                    {view === 'month' && (
                        <motion.div
                            key="month-view"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-full"
                        >
                            <Card className="h-full overflow-hidden border border-border/50 shadow-xl backdrop-blur-sm bg-card/50">
                                {/* Day headers */}
                                <div className="grid grid-cols-7 border-b border-border/50 bg-secondary/80 backdrop-blur-md">
                                    {DAYS.map((day) => (
                                        <div
                                            key={day}
                                            className="p-4 text-center text-xs font-bold text-muted-foreground uppercase border-r border-border/30 last:border-r-0"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar grid */}
                                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                                    {monthDays.map((day, i) => {
                                        if (!day) {
                                            return <div key={`empty-${i}`} className="border-r border-b border-border/30 bg-muted/20" />;
                                        }

                                        const dayTasks = getTasksForDate(day);
                                        const isTodayDate = isToday(day);

                                        return (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setCurrentDate(day);
                                                    setView('day');
                                                }}
                                                className={cn(
                                                    "border-r border-b border-border/30 p-3 min-h-[120px] cursor-pointer hover:bg-secondary/30 transition-all group relative",
                                                    isTodayDate && "bg-primary/10 border-primary/30"
                                                )}
                                            >
                                                {/* Date number */}
                                                <div
                                                    className={cn(
                                                        "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mb-2 transition-all",
                                                        isTodayDate
                                                            ? "bg-primary text-primary-foreground shadow-lg"
                                                            : "text-foreground group-hover:bg-secondary"
                                                    )}
                                                >
                                                    {day.getDate()}
                                                </div>

                                                {/* Events */}
                                                <div className="space-y-1">
                                                    {dayTasks.slice(0, 3).map((task) => (
                                                        <div
                                                            key={task.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTaskClick(task);
                                                            }}
                                                            className="px-2 py-1 rounded text-[10px] font-medium truncate shadow-sm hover:shadow-md transition-all border border-border/30 backdrop-blur-sm"
                                                            style={{
                                                                background: task.color
                                                                    ? `linear-gradient(135deg, ${task.color}20 0%, ${task.color}10 100%)`
                                                                    : 'linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--primary) / 0.1) 100%)',
                                                                borderLeftWidth: '2px',
                                                                borderLeftColor: task.color || 'hsl(var(--primary))',
                                                            }}
                                                        >
                                                            {task.title}
                                                        </div>
                                                    ))}
                                                    {dayTasks.length > 3 && (
                                                        <div className="text-[10px] text-muted-foreground font-medium pl-2">
                                                            +{dayTasks.length - 3} more
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Quick add on hover */}
                                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTimeSlotClick(day, 9); // Default to 9 AM
                                                        }}
                                                        className="bg-primary/20 text-primary rounded-full p-1.5 border border-primary/30 hover:bg-primary/30 transition-all"
                                                    >
                                                        <Plus size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >

            {/* Task Modal */}
            < TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => {
                    setIsTaskModalOpen(false);
                    setSelectedTask(null);
                    setSelectedDate(null);
                    setSelectedTime(null);
                }}
                onSave={(taskData) => {
                    if (selectedTask) {
                        onUpdateTask({ ...selectedTask, ...taskData });
                    } else {
                        const newTask: Task = {
                            id: Date.now().toString(),
                            date: selectedDate || new Date(),
                            duration: 60,
                            completed: false,
                            statusLabel: 'TODO',
                            category: 'MEETING',
                            ...taskData,
                        } as Task;
                        onAddTask(newTask);
                    }
                    setIsTaskModalOpen(false);
                    setSelectedTask(null);
                    setSelectedDate(null);
                    setSelectedTime(null);
                }}
                onDelete={onDeleteTask}
                initialTask={selectedTask}
                projects={projects}
            />
        </div >
    );
};
