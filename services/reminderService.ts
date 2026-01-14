import { Task, Project, AppNotification } from '../types';

interface ReminderConfig {
    tasks: Task[];
    projects: Project[];
    onNotification: (notification: AppNotification) => void;
}

// Track which reminders have already been triggered to avoid duplicates
const triggeredReminders = new Set<string>();

// Notification sound (using Web Audio API for reliability)
let audioContext: AudioContext | null = null;

const playNotificationSound = () => {
    try {
        // Create audio context lazily (must be after user interaction)
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Create a pleasant notification sound using oscillators
        const now = audioContext.currentTime;

        // First tone
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.frequency.value = 587.33; // D5
        osc1.type = 'sine';
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc1.start(now);
        osc1.stop(now + 0.3);

        // Second tone (slightly delayed)
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 880; // A5
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.45);

        // Third tone
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.frequency.value = 1174.66; // D6
        osc3.type = 'sine';
        gain3.gain.setValueAtTime(0.25, now + 0.3);
        gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc3.start(now + 0.3);
        osc3.stop(now + 0.6);

    } catch (e) {
        console.warn('Could not play notification sound:', e);
    }
};

// Request browser notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

// Show browser notification
const showBrowserNotification = (title: string, body: string, icon?: string) => {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body,
            icon: icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'reminder',
            requireInteraction: true,
        });

        // Auto-close after 10 seconds
        setTimeout(() => notification.close(), 10000);

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
};

// Check for upcoming task reminders
export const checkTaskReminders = (config: ReminderConfig) => {
    const now = new Date();
    const { tasks, onNotification } = config;

    tasks.forEach(task => {
        // Skip completed tasks or tasks without reminders
        if (task.completed || !task.reminder || !task.date) return;

        const taskDate = new Date(task.date);
        const reminderTime = new Date(taskDate.getTime() - task.reminder * 60 * 1000);
        const reminderId = `task-reminder-${task.id}-${task.reminder}`;

        // Check if we're within the reminder window (within 1 minute of reminder time)
        const timeDiff = reminderTime.getTime() - now.getTime();
        const isInReminderWindow = timeDiff <= 60000 && timeDiff > -60000; // ±1 minute

        if (isInReminderWindow && !triggeredReminders.has(reminderId)) {
            triggeredReminders.add(reminderId);

            // Determine notification type based on category
            const isMeeting = task.category === 'MEETING';
            const title = isMeeting ? '📅 Meeting Starting Soon' : '⏰ Task Reminder';
            const timeUntil = formatTimeUntil(taskDate);

            const notification: AppNotification = {
                id: reminderId,
                title,
                message: `"${task.title}" starts ${timeUntil}`,
                type: 'WARNING',
                timestamp: new Date(),
                read: false,
                actionData: {
                    type: 'TASK_MODAL',
                    taskId: task.id,
                    taskTitle: task.title
                }
            };

            // Trigger in-app notification
            onNotification(notification);

            // Play sound
            playNotificationSound();

            // Show browser notification
            showBrowserNotification(title, `"${task.title}" starts ${timeUntil}`);
        }
    });
};

// Check for upcoming project deadlines
export const checkDeadlineReminders = (config: ReminderConfig) => {
    const now = new Date();
    const { projects, onNotification } = config;

    // Reminder thresholds: 1 day, 3 days, 7 days before deadline
    const thresholds = [
        { hours: 24, label: '1 day' },
        { hours: 72, label: '3 days' },
        { hours: 168, label: '7 days' }
    ];

    projects.forEach(project => {
        // Skip completed/archived projects or projects without deadlines
        if (project.status === 'COMPLETED' || project.status === 'ARCHIVED' || !project.deadline) return;

        const deadline = new Date(project.deadline);

        thresholds.forEach(threshold => {
            const reminderTime = new Date(deadline.getTime() - threshold.hours * 60 * 60 * 1000);
            const reminderId = `deadline-${project.id}-${threshold.hours}h`;

            // Check if we're within the reminder window
            const timeDiff = reminderTime.getTime() - now.getTime();
            const isInReminderWindow = timeDiff <= 60000 && timeDiff > -60000;

            if (isInReminderWindow && !triggeredReminders.has(reminderId)) {
                triggeredReminders.add(reminderId);

                const notification: AppNotification = {
                    id: reminderId,
                    title: '🚨 Deadline Approaching',
                    message: `"${project.title}" is due in ${threshold.label}`,
                    type: 'WARNING',
                    timestamp: new Date(),
                    read: false,
                    actionData: {
                        type: 'DEADLINE'
                    }
                };

                onNotification(notification);
                playNotificationSound();
                showBrowserNotification('🚨 Deadline Approaching', `"${project.title}" is due in ${threshold.label}`);
            }
        });

        // Check for overdue projects (past deadline)
        const overdueId = `overdue-${project.id}`;
        if (deadline < now && !triggeredReminders.has(overdueId)) {
            triggeredReminders.add(overdueId);

            const notification: AppNotification = {
                id: overdueId,
                title: '⚠️ Project Overdue',
                message: `"${project.title}" deadline has passed!`,
                type: 'WARNING',
                timestamp: new Date(),
                read: false,
                actionData: {
                    type: 'DEADLINE'
                }
            };

            onNotification(notification);
            playNotificationSound();
            showBrowserNotification('⚠️ Project Overdue', `"${project.title}" deadline has passed!`);
        }
    });
};

// Format time until event
const formatTimeUntil = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins <= 0) return 'now';
    if (diffMins < 60) return `in ${diffMins} minute${diffMins === 1 ? '' : 's'}`;

    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;

    const diffDays = Math.round(diffHours / 24);
    return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
};

// Main reminder check function - call this periodically
export const runReminderCheck = (config: ReminderConfig) => {
    checkTaskReminders(config);
    checkDeadlineReminders(config);
};

// Clear triggered reminders for a specific task (e.g., when task is updated)
export const clearTaskReminders = (taskId: string) => {
    const keysToDelete: string[] = [];
    triggeredReminders.forEach(key => {
        if (key.includes(taskId)) {
            keysToDelete.push(key);
        }
    });
    keysToDelete.forEach(key => triggeredReminders.delete(key));
};

// Clear all triggered reminders (useful for logout/login)
export const clearAllReminders = () => {
    triggeredReminders.clear();
};

// Test notification sound (useful for settings)
export const testNotificationSound = () => {
    playNotificationSound();
};
