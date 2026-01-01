
import React, { useState, useMemo } from 'react';
import { Task, Project } from '../types';
import {
    Clock,
    Calendar as CalendarIcon,
    AlertTriangle,
    Shield,
    ChevronLeft,
    ChevronRight,
    Plus,
    Flame,
    Coffee,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { TaskModal } from './modals/TaskModal';

interface TimePageProps {
    tasks: Task[];
    projects: Project[];
    onUpdateTask: (task: Task) => void;
    onAddTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
}

const MAX_HEALTHY_HOURS = 45;
const BURNOUT_THRESHOLD = 50;

export const TimePage: React.FC<TimePageProps> = ({
    tasks,
    projects,
    onUpdateTask,
    onAddTask,
    onDeleteTask,
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Calculate weekly hours
    const weeklyStats = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        const weekTasks = tasks.filter(t => {
            const taskDate = new Date(t.date);
            return taskDate >= startOfWeek && taskDate < endOfWeek && !t.completed;
        });

        const totalMinutes = weekTasks.reduce((sum, t) => sum + (t.duration || 60), 0);
        const totalHours = Math.round(totalMinutes / 60);

        // Count meetings
        const meetings = weekTasks.filter(t => t.category === 'MEETING').length;

        // Check for back-to-back
        const sorted = [...weekTasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let backToBack = 0;
        for (let i = 1; i < sorted.length; i++) {
            const prevEnd = new Date(sorted[i - 1].date).getTime() + (sorted[i - 1].duration || 60) * 60000;
            const currStart = new Date(sorted[i].date).getTime();
            if (currStart - prevEnd < 15 * 60000) backToBack++;
        }

        const burnoutRisk = totalHours >= BURNOUT_THRESHOLD ? 'HIGH' : totalHours >= MAX_HEALTHY_HOURS ? 'MEDIUM' : 'LOW';

        return { totalHours, meetings, backToBack, burnoutRisk, weekTasks };
    }, [tasks, currentDate]);

    // Get tasks for selected date
    const selectedDateTasks = useMemo(() => {
        if (!selectedDate) return [];
        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        return tasks
            .filter(t => {
                const taskDate = new Date(t.date);
                return taskDate >= dayStart && taskDate < dayEnd;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [tasks, selectedDate]);

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const getBurnoutColor = (risk: string) => {
        if (risk === 'HIGH') return 'text-red-500 bg-red-500/10';
        if (risk === 'MEDIUM') return 'text-orange-500 bg-orange-500/10';
        return 'text-green-500 bg-green-500/10';
    };

    return (
        <div className="flex flex-col h-full w-full space-y-6 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2">

            {/* Header */}
            <FadeIn>
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Time</h1>
                        <p className="text-sm text-muted-foreground mt-1">Protect your time, prevent burnout</p>
                    </div>
                    <Button onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }} className="gap-2">
                        <Plus size={16} />
                        Block Time
                    </Button>
                </div>
            </FadeIn>

            {/* Week Stats with Burnout Warning */}
            <FadeIn delay={0.1}>
                <Card className={weeklyStats.burnoutRisk === 'HIGH' ? 'border-red-500/50' : weeklyStats.burnoutRisk === 'MEDIUM' ? 'border-orange-500/30' : ''}>
                    <CardContent className="py-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-6">
                                {/* Week Navigator */}
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
                                        <ChevronLeft size={18} />
                                    </Button>
                                    <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
                                        Week of {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
                                        <ChevronRight size={18} />
                                    </Button>
                                </div>

                                {/* Hours Bar */}
                                <div className="flex-1 max-w-[300px]">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">Weekly Hours</span>
                                        <span className={weeklyStats.totalHours > MAX_HEALTHY_HOURS ? 'text-red-500 font-bold' : 'font-medium'}>
                                            {weeklyStats.totalHours}h / {MAX_HEALTHY_HOURS}h
                                        </span>
                                    </div>
                                    <Progress
                                        value={Math.min(100, (weeklyStats.totalHours / BURNOUT_THRESHOLD) * 100)}
                                        className={`h-2 ${weeklyStats.totalHours > MAX_HEALTHY_HOURS ? '[&>div]:bg-red-500' : ''}`}
                                    />
                                </div>
                            </div>

                            {/* Burnout Risk Badge */}
                            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${getBurnoutColor(weeklyStats.burnoutRisk)}`}>
                                {weeklyStats.burnoutRisk === 'HIGH' ? <Flame size={18} /> :
                                    weeklyStats.burnoutRisk === 'MEDIUM' ? <AlertTriangle size={18} /> :
                                        <Shield size={18} />}
                                <div>
                                    <div className="text-sm font-bold">
                                        {weeklyStats.burnoutRisk === 'HIGH' ? 'Burnout Risk!' :
                                            weeklyStats.burnoutRisk === 'MEDIUM' ? 'Watch Your Time' :
                                                'Healthy Week'}
                                    </div>
                                    <div className="text-[10px] opacity-80">
                                        {weeklyStats.meetings} meetings • {weeklyStats.backToBack} back-to-back
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </FadeIn>

            {/* Calendar + Day Detail */}
            <FadeIn delay={0.2}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <Card className="lg:col-span-1">
                        <CardContent className="p-4">
                            <ShadcnCalendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                className="rounded-md border-0"
                                modifiers={{
                                    hasTasks: (date) => {
                                        return tasks.some(t => {
                                            const taskDate = new Date(t.date);
                                            return taskDate.toDateString() === date.toDateString();
                                        });
                                    }
                                }}
                                modifiersStyles={{
                                    hasTasks: { fontWeight: 'bold', textDecoration: 'underline' }
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Day Schedule */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>
                                    {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </span>
                                <Badge variant="secondary">{selectedDateTasks.length} events</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedDateTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Coffee size={32} className="mb-3 opacity-50" />
                                    <p className="text-sm">No events scheduled</p>
                                    <Button
                                        variant="link"
                                        className="mt-2"
                                        onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }}
                                    >
                                        Add a focus block
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                                    {selectedDateTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => { setSelectedTask(task); setIsTaskModalOpen(true); }}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-transparent hover:border-primary/30 cursor-pointer transition-all group"
                                        >
                                            <div className="flex flex-col items-center min-w-[50px]">
                                                <span className="text-sm font-bold text-foreground">
                                                    {new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">{task.duration}m</span>
                                            </div>
                                            <div className="w-1 h-10 rounded-full" style={{ backgroundColor: task.color || 'hsl(var(--primary))' }} />
                                            <div className="flex-1">
                                                <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                    {task.title}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-[10px]">{task.category}</Badge>
                                                    {task.priority && (
                                                        <Badge variant="outline" className="text-[10px]">{task.priority}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </FadeIn>

            {/* Quick Stats Row */}
            <FadeIn delay={0.3}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <CalendarIcon size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold"><CountUp value={weeklyStats.meetings} /></div>
                                <div className="text-xs text-muted-foreground">Meetings</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                <Zap size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold"><CountUp value={weeklyStats.weekTasks.filter(t => t.category !== 'MEETING').length} /></div>
                                <div className="text-xs text-muted-foreground">Focus Blocks</div>
                            </div>
                        </div>
                    </Card>
                    <Card className={`p-4 ${weeklyStats.backToBack > 0 ? 'border-orange-500/30' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold"><CountUp value={weeklyStats.backToBack} /></div>
                                <div className="text-xs text-muted-foreground">Back-to-Back</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                <Shield size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold"><CountUp value={Math.max(0, MAX_HEALTHY_HOURS - weeklyStats.totalHours)} />h</div>
                                <div className="text-xs text-muted-foreground">Buffer Left</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </FadeIn>

            {/* Task Modal */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={(t) => {
                    if (selectedTask) onUpdateTask({ ...selectedTask, ...t });
                    else onAddTask({
                        id: Date.now().toString(),
                        date: selectedDate || new Date(),
                        duration: 60,
                        completed: false,
                        ...t
                    } as Task);
                }}
                onDelete={onDeleteTask}
                initialTask={selectedTask}
                projects={projects}
            />
        </div>
    );
};
