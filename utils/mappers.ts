// Utility functions to map database records to application types
import { Task, Client, Project, Habit, ChatSession, AppNotification } from '../types';
import { DbTask, DbClient, DbProject, DbHabit, DbChatSession, DbNotification } from '../services/supabaseClient';

export const mapDbTaskToTask = (t: DbTask): Task => {
    let taskDate: Date;
    try {
        // DbTask.date is always a string from the database
        taskDate = new Date(t.date);
        if (isNaN(taskDate.getTime())) {
            taskDate = new Date();
        }
    } catch {
        taskDate = new Date();
    }

    return {
        id: t.id,
        title: t.title,
        date: taskDate,
        category: t.category as Task['category'],
        priority: t.priority as Task['priority'],
        statusLabel: t.status_label as Task['statusLabel'],
        duration: t.duration,
        completed: t.completed,
        color: t.color,
        projectId: t.project_id,
        notes: t.notes
    };
};

export const mapDbClientToClient = (c: DbClient): Client => ({
    id: c.id,
    name: c.name,
    email: c.email || '',
    revenue: Number(c.revenue) || 0,
    status: c.status as Client['status'],
    notes: c.notes,
    avatar: c.avatar
});

export const mapDbProjectToProject = (p: DbProject): Project => ({
    id: p.id,
    title: p.title,
    client: p.client_name,
    clientId: p.client_id,
    status: p.status as Project['status'],
    price: Number(p.price) || 0,
    progress: p.progress,
    tags: p.tags || [],
    color: p.color,
    notes: p.notes,
    deadline: p.deadline ? new Date(p.deadline) : undefined
});

export const mapDbHabitToHabit = (h: DbHabit): Habit => ({
    id: h.id,
    title: h.title,
    streak: h.streak,
    completedDates: h.completed_dates || [],
    frequency: h.frequency as Habit['frequency'],
    category: h.category as Habit['category']
});

export const mapDbChatSessionToSession = (s: DbChatSession): ChatSession => ({
    id: s.id,
    title: s.title,
    messages: (s.messages || []).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
    })),
    lastModified: new Date(s.last_modified)
});

export const mapDbNotificationToNotification = (n: DbNotification): AppNotification => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    timestamp: new Date(n.created_at),
    read: n.read,
    actionData: n.action_type ? {
        type: n.action_type,
        teamId: n.team_id,
        teamName: n.team_name,
        taskId: n.task_id,
        taskTitle: n.task_title
    } : undefined
});
