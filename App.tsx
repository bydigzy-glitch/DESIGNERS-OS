
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeGemini, sendMessageToGemini, resetGeminiSession, sendToolResponseToGemini } from './services/geminiService';
import { storageService, Backend, TOKEN_COSTS } from './services/storageService';
import { db, supabase, subscribeToChanges } from './services/supabaseClient';
import { ChatInterface } from './components/ChatInterface';
import { Navigation } from './components/Navigation';
import { HQ } from './components/HQ';
import { TasksPage } from './components/TasksPage';
import { HabitsPage } from './components/HabitsPage';
import { Apps } from './components/Apps';
import { Calendar } from './components/Calendar';
import { FileManager } from './components/FileManager';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { ChatOverlay } from './components/ChatOverlay';
import { ManagerPage } from './components/ManagerPage';
import { TeamPage } from './components/TeamPage';
import { LoadingScreen } from './components/common/LoadingScreen';
import { ToastContainer, ToastMessage, ToastType } from './components/common/Toast';
import { Message, ViewMode, Task, FileAsset, Folder, User, ChatSession, Client, Project, Habit, CanvasItem, AppNotification } from './types';
import { RECOVERY_INSTRUCTION } from './constants';
import { TopBar } from './components/TopBar';

const DUMMY_USER: User = {
    id: 'admin-user',
    name: 'Digzy',
    email: 'bydigzy@gmail.com',
    password: 'Aa332211',
    isPro: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Digzy',
    preferences: {
        theme: 'dark',
        notifications: true,
        displayName: 'Digzy'
    },
    tokens: 10
};

const APP_VERSION = 'v3.2';

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<ViewMode>('HQ');
    const [isChatOverlayOpen, setIsChatOverlayOpen] = useState(false);
    const [isAppLoading, setIsAppLoading] = useState(true);

    const [folders, setFolders] = useState<Folder[]>([]);
    const [files, setFiles] = useState<FileAsset[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [infinityItems, setInfinityItems] = useState<CanvasItem[]>([]);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState<string | undefined>(undefined);
    const [isDriveConnected, setIsDriveConnected] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const activeRequestRef = useRef(false);

    // --- INITIALIZATION & AUTHENTICATION ---
    useEffect(() => {
        setTimeout(() => setIsAppLoading(false), 2500);
        storageService.checkVersion();

        const existingUsers = storageService.getUsers();
        const adminExists = existingUsers.some(u => u.email === DUMMY_USER.email);
        if (!adminExists) storageService.saveUser(DUMMY_USER);

        const sessionUser = storageService.getSession();
        if (sessionUser) {
            const freshUser = storageService.getUser(sessionUser.id);
            const safeUser = freshUser ? { ...freshUser, tokens: freshUser.tokens ?? 10 } : { ...sessionUser, tokens: sessionUser.tokens ?? 10 };
            setUser(safeUser);
            // Load notifications on session restore
            if (safeUser.notifications) {
                setNotifications(safeUser.notifications.map(n => ({ ...n, timestamp: new Date(n.timestamp) })));
            }
        }

        const lastVersion = localStorage.getItem('app_last_version');
        if (lastVersion !== APP_VERSION) {
            addNotification({
                id: 'sys-update-' + Date.now(),
                title: `System Updated to ${APP_VERSION}`,
                message: 'TaskNovaPro v3.2: Performance Improvements & Backend Integrity.',
                type: 'SYSTEM',
                timestamp: new Date(),
                read: false
            });
            localStorage.setItem('app_last_version', APP_VERSION);
        }
    }, []);

    const handleLogin = useCallback((loggedInUser: User) => {
        const safeUser = { ...loggedInUser, tokens: loggedInUser.tokens ?? 10 };
        setUser(safeUser);
        setCurrentView('HQ');
        // Load notifications if user has any
        if (safeUser.notifications) {
            setNotifications(safeUser.notifications.map(n => ({ ...n, timestamp: new Date(n.timestamp) })));
        }
    }, []);

    // --- CROSS-TAB SYNC LISTENER ---
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (!user) return;
            if (e.key === `designpreneur_data_${user.id}`) {
                const data = storageService.getUserData(user.id);
                if (data) {
                    setTasks(data.tasks);
                    setProjects(data.projects);
                    setClients(data.clients);
                    setHabits(data.habits);
                    setFiles(data.files);
                    setFolders(data.folders);
                    setInfinityItems(data.infinityItems);
                    if (data.chatSessions.length > 0) setChatSessions(data.chatSessions);
                }
            }
            if (e.key === 'designpreneur_users' || e.key === 'designpreneur_session') {
                const users = storageService.getUsers();
                const updatedUser = users.find(u => u.id === user.id);
                if (updatedUser) {
                    // Deep merge or update to ensure chat updates reflect
                    setUser(updatedUser);
                    // Sync notifications from updated user
                    if (updatedUser.notifications) {
                        setNotifications(updatedUser.notifications.map(n => ({ ...n, timestamp: new Date(n.timestamp) })));
                    }
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user?.id]); // Only re-attach if ID changes

    // --- DATA LOADING (Cloud for authenticated users, localStorage for guests) ---
    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;

            // Guest users use localStorage
            if (user.isGuest) {
                try {
                    const data = storageService.getUserData(user.id);
                    setFolders(data.folders || []);
                    setFiles(data.files || []);
                    setTasks(data.tasks || []);
                    setClients(data.clients || []);
                    setProjects(data.projects || []);
                    setHabits((data as any).habits || []);
                    setInfinityItems((data as any).infinityItems || []);
                    if (data.chatSessions && data.chatSessions.length > 0) {
                        setChatSessions(data.chatSessions);
                        const sorted = [...data.chatSessions].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
                        setCurrentSessionId(sorted[0].id);
                    } else if (chatSessions.length === 0) {
                        createNewSession();
                    }
                } catch (e) {
                    console.error("Guest data load error", e);
                }
                return;
            }

            // Cloud users use Supabase
            try {
                console.log('[Supabase] Loading data for user:', user.id);

                // Load tasks
                const { data: tasksData } = await db.tasks.getAll(user.id);
                if (tasksData) {
                    const mappedTasks: Task[] = tasksData.map(t => ({
                        id: t.id,
                        title: t.title,
                        date: new Date(t.date),
                        category: t.category as Task['category'],
                        priority: t.priority as Task['priority'],
                        statusLabel: t.status_label,
                        duration: t.duration,
                        completed: t.completed,
                        color: t.color,
                        projectId: t.project_id,
                        notes: t.notes
                    }));
                    setTasks(mappedTasks);
                }

                // Load clients
                const { data: clientsData } = await db.clients.getAll(user.id);
                if (clientsData) {
                    const mappedClients: Client[] = clientsData.map(c => ({
                        id: c.id,
                        name: c.name,
                        email: c.email || '',
                        revenue: Number(c.revenue) || 0,
                        status: c.status as Client['status'],
                        notes: c.notes,
                        avatar: c.avatar
                    }));
                    setClients(mappedClients);
                }

                // Load projects
                const { data: projectsData } = await db.projects.getAll(user.id);
                if (projectsData) {
                    const mappedProjects: Project[] = projectsData.map(p => ({
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
                    }));
                    setProjects(mappedProjects);
                }

                // Load habits
                const { data: habitsData } = await db.habits.getAll(user.id);
                if (habitsData) {
                    const mappedHabits: Habit[] = habitsData.map(h => ({
                        id: h.id,
                        title: h.title,
                        streak: h.streak,
                        completedDates: h.completed_dates || [],
                        frequency: h.frequency as Habit['frequency'],
                        category: h.category as Habit['category']
                    }));
                    setHabits(mappedHabits);
                }

                // Load chat sessions
                const { data: sessionsData } = await db.chatSessions.getAll(user.id);
                if (sessionsData && sessionsData.length > 0) {
                    const mappedSessions: ChatSession[] = sessionsData.map(s => ({
                        id: s.id,
                        title: s.title,
                        messages: (s.messages || []).map((m: any) => ({
                            ...m,
                            timestamp: new Date(m.timestamp)
                        })),
                        lastModified: new Date(s.last_modified)
                    }));
                    setChatSessions(mappedSessions);
                    const sorted = [...mappedSessions].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
                    setCurrentSessionId(sorted[0].id);
                } else if (chatSessions.length === 0) {
                    createNewSession();
                }

                console.log('[Supabase] Data loaded successfully');

            } catch (e) {
                console.error("[Supabase] Data load error", e);
                addToast('ERROR', 'Failed to load data from cloud. Using local fallback.');
                // Fallback to localStorage
                try {
                    const data = storageService.getUserData(user.id);
                    setTasks(data.tasks || []);
                    setClients(data.clients || []);
                    setProjects(data.projects || []);
                } catch (e2) {
                    console.error("Fallback also failed", e2);
                }
            }
        };

        loadData();
    }, [user?.id]);

    // --- REAL-TIME SUBSCRIPTIONS FOR CROSS-DEVICE SYNC ---
    useEffect(() => {
        if (!user?.id || user.isGuest) return;

        console.log('[Realtime] Setting up subscriptions for user:', user.id);

        const unsubscribe = subscribeToChanges(
            user.id,
            // Task changes
            (payload: any) => {
                console.log('[Realtime] Task change:', payload.eventType);
                if (payload.eventType === 'INSERT') {
                    const t = payload.new;
                    setTasks(prev => {
                        if (prev.find(x => x.id === t.id)) return prev;
                        return [...prev, {
                            id: t.id, title: t.title, date: new Date(t.date), category: t.category,
                            priority: t.priority, statusLabel: t.status_label, duration: t.duration,
                            completed: t.completed, color: t.color, projectId: t.project_id, notes: t.notes
                        }];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    const t = payload.new;
                    setTasks(prev => prev.map(x => x.id === t.id ? {
                        ...x, title: t.title, date: new Date(t.date), category: t.category,
                        priority: t.priority, statusLabel: t.status_label, duration: t.duration,
                        completed: t.completed, color: t.color, projectId: t.project_id, notes: t.notes
                    } : x));
                } else if (payload.eventType === 'DELETE') {
                    setTasks(prev => prev.filter(x => x.id !== payload.old.id));
                }
            },
            // Client changes
            (payload: any) => {
                console.log('[Realtime] Client change:', payload.eventType);
                if (payload.eventType === 'INSERT') {
                    const c = payload.new;
                    setClients(prev => prev.find(x => x.id === c.id) ? prev : [...prev, {
                        id: c.id, name: c.name, email: c.email || '', revenue: Number(c.revenue) || 0,
                        status: c.status, notes: c.notes, avatar: c.avatar
                    }]);
                } else if (payload.eventType === 'UPDATE') {
                    const c = payload.new;
                    setClients(prev => prev.map(x => x.id === c.id ? {
                        ...x, name: c.name, email: c.email || '', revenue: Number(c.revenue) || 0,
                        status: c.status, notes: c.notes, avatar: c.avatar
                    } : x));
                } else if (payload.eventType === 'DELETE') {
                    setClients(prev => prev.filter(x => x.id !== payload.old.id));
                }
            },
            // Project changes
            (payload: any) => {
                console.log('[Realtime] Project change:', payload.eventType);
                if (payload.eventType === 'INSERT') {
                    const p = payload.new;
                    setProjects(prev => prev.find(x => x.id === p.id) ? prev : [...prev, {
                        id: p.id, title: p.title, client: p.client_name, clientId: p.client_id,
                        status: p.status, price: Number(p.price) || 0, progress: p.progress,
                        tags: p.tags || [], color: p.color, notes: p.notes,
                        deadline: p.deadline ? new Date(p.deadline) : undefined
                    }]);
                } else if (payload.eventType === 'UPDATE') {
                    const p = payload.new;
                    setProjects(prev => prev.map(x => x.id === p.id ? {
                        ...x, title: p.title, client: p.client_name, clientId: p.client_id,
                        status: p.status, price: Number(p.price) || 0, progress: p.progress,
                        tags: p.tags || [], color: p.color, notes: p.notes,
                        deadline: p.deadline ? new Date(p.deadline) : undefined
                    } : x));
                } else if (payload.eventType === 'DELETE') {
                    setProjects(prev => prev.filter(x => x.id !== payload.old.id));
                }
            },
            // Habit changes
            (payload: any) => {
                console.log('[Realtime] Habit change:', payload.eventType);
                if (payload.eventType === 'INSERT') {
                    const h = payload.new;
                    setHabits(prev => prev.find(x => x.id === h.id) ? prev : [...prev, {
                        id: h.id, title: h.title, streak: h.streak,
                        completedDates: h.completed_dates || [], frequency: h.frequency, category: h.category
                    }]);
                } else if (payload.eventType === 'UPDATE') {
                    const h = payload.new;
                    setHabits(prev => prev.map(x => x.id === h.id ? {
                        ...x, title: h.title, streak: h.streak,
                        completedDates: h.completed_dates || [], frequency: h.frequency, category: h.category
                    } : x));
                } else if (payload.eventType === 'DELETE') {
                    setHabits(prev => prev.filter(x => x.id !== payload.old.id));
                }
            }
        );

        return unsubscribe;
    }, [user?.id, user?.isGuest]);


    // --- DATA SAVING ---
    useEffect(() => {
        if (user && !user.isGuest) {
            storageService.saveUserData(user.id, {
                tasks, files, folders, clients, projects, chatSessions, habits: habits as any, infinityItems: infinityItems as any
            });
        }
    }, [tasks, files, folders, clients, projects, chatSessions, habits, infinityItems, user?.id]); // Only save if user ID is stable

    useEffect(() => {
        try {
            initializeGemini(user?.aiMemory || "");
        } catch (error) {
            console.error("Gemini Initialization Error:", error);
        }
    }, [user?.aiMemory]);

    const addToast = (type: ToastType, message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, message }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const addNotification = (note: AppNotification) => {
        setNotifications(prev => [note, ...prev]);
    };

    const handleTeamInviteResponse = (teamId: string, accept: boolean, notificationId: string) => {
        if (!user) return;

        const result = Backend.teams.respondToInvite(teamId, user.id, accept);

        if (result.success) {
            // Remove the notification
            setNotifications(prev => prev.filter(n => n.id !== notificationId));

            if (accept) {
                // Update user state with new teamId
                const updatedUser = storageService.getUser(user.id);
                if (updatedUser) setUser(updatedUser);

                addNotification({
                    id: `team-accepted-${Date.now()}`,
                    title: 'Team Joined',
                    message: result.message,
                    type: 'SUCCESS',
                    timestamp: new Date(),
                    read: false
                });
            }
        } else {
            alert(result.message);
        }
    };


    // --- TOKEN HANDLER (BACKEND ENFORCED) ---
    const handleUseToken = (amount: number, feature: string): boolean => {
        if (!user) return false;
        const requestId = crypto.randomUUID(); // Unique ID for this specific transaction
        try {
            // Backend call to check balance and deduct
            const result = Backend.tokens.deduct(user.id, amount, feature, requestId);
            if (result.success) {
                const updatedUser = { ...user, tokens: result.newBalance };
                setUser(updatedUser);
                return true;
            }
        } catch (e: any) {
            addToast('ERROR', e.message || "Insufficient tokens.");
            return false;
        }
        return false;
    };

    const handleToggleTheme = () => {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(newTheme);
        localStorage.setItem('user_preferences_theme', newTheme);
        if (user) {
            const updated = { ...user, preferences: { ...user.preferences, theme: newTheme as 'light' | 'dark' } };
            setUser(updated);
            storageService.saveUser(updated);
        }
    };

    const handleToggleHabit = (id: string) => {
        const today = new Date().toISOString().split('T')[0];
        setHabits(prev => prev.map(h => {
            if (h.id === id) {
                const isCompleted = h.completedDates.includes(today);
                let newDates = [...h.completedDates];
                let newStreak = h.streak;

                if (isCompleted) {
                    newDates = newDates.filter(d => d !== today);
                    if (newStreak > 0) newStreak--;
                } else {
                    newDates.push(today);
                    newStreak++;
                }
                return { ...h, completedDates: newDates, streak: newStreak };
            }
            return h;
        }));
    };

    const handleTaskCreate = async (task: Task) => {
        if (!user) return;
        // Update local state immediately
        const updatedTasks = Backend.tasks.create(user.id, task);
        setTasks(updatedTasks);
        addToast('SUCCESS', 'Task created successfully');

        // Sync to cloud for non-guest users
        if (!user.isGuest) {
            try {
                await db.tasks.create({
                    id: task.id,
                    user_id: user.id,
                    title: task.title,
                    date: task.date.toISOString(),
                    category: task.category,
                    priority: task.priority,
                    status_label: task.statusLabel,
                    duration: task.duration,
                    completed: task.completed,
                    color: task.color,
                    project_id: task.projectId,
                    notes: task.notes
                });
            } catch (e) {
                console.error('[Supabase] Task create failed:', e);
            }
        }
    };

    const handleTaskUpdate = async (task: Task) => {
        if (!user) return;
        const updatedTasks = Backend.tasks.update(user.id, task);
        setTasks(updatedTasks);

        if (!user.isGuest) {
            try {
                await db.tasks.update(task.id, {
                    title: task.title,
                    date: task.date.toISOString(),
                    category: task.category,
                    priority: task.priority,
                    status_label: task.statusLabel,
                    duration: task.duration,
                    completed: task.completed,
                    color: task.color,
                    project_id: task.projectId,
                    notes: task.notes
                });
            } catch (e) {
                console.error('[Supabase] Task update failed:', e);
            }
        }
    };

    const handleTaskDelete = async (id: string) => {
        if (!user) return;
        const updatedTasks = Backend.tasks.delete(user.id, id);
        setTasks(updatedTasks);
        addToast('INFO', 'Task deleted');

        if (!user.isGuest) {
            try {
                await db.tasks.delete(id);
            } catch (e) {
                console.error('[Supabase] Task delete failed:', e);
            }
        }
    };

    const handleProjectCreate = async (project: Project) => {
        if (!user) return;
        const updatedProjects = Backend.projects.create(user.id, project);
        setProjects(updatedProjects);
        addToast('SUCCESS', 'Project created');

        if (!user.isGuest) {
            try {
                await db.projects.create({
                    id: project.id,
                    user_id: user.id,
                    title: project.title,
                    client_id: project.clientId,
                    client_name: project.client,
                    status: project.status,
                    price: project.price,
                    progress: project.progress,
                    tags: project.tags,
                    color: project.color,
                    notes: project.notes,
                    deadline: project.deadline?.toISOString()
                });
            } catch (e) {
                console.error('[Supabase] Project create failed:', e);
            }
        }
    };

    const handleProjectUpdate = async (project: Project) => {
        if (!user) return;
        const updatedProjects = Backend.projects.update(user.id, project);
        setProjects(updatedProjects);
        addToast('SUCCESS', 'Project updated');

        if (!user.isGuest) {
            try {
                await db.projects.update(project.id, {
                    title: project.title,
                    client_id: project.clientId,
                    client_name: project.client,
                    status: project.status,
                    price: project.price,
                    progress: project.progress,
                    tags: project.tags,
                    color: project.color,
                    notes: project.notes,
                    deadline: project.deadline?.toISOString()
                });
            } catch (e) {
                console.error('[Supabase] Project update failed:', e);
            }
        }
    };

    const handleProjectDelete = async (id: string) => {
        if (!user) return;
        const result = Backend.projects.delete(user.id, id);
        setProjects(result.projects);
        setTasks(result.tasks);
        addToast('INFO', 'Project deleted (tasks unlinked)');

        if (!user.isGuest) {
            try {
                await db.projects.delete(id);
            } catch (e) {
                console.error('[Supabase] Project delete failed:', e);
            }
        }
    };

    const handleClientAdd = async (client: Client, newProjects: Partial<Project>[]) => {
        if (!user) return;
        const finalProjects = newProjects.map(p => ({
            ...p,
            id: Date.now().toString() + Math.random(),
            clientId: client.id,
            client: client.name
        } as Project));

        const result = Backend.clients.create(user.id, client, finalProjects);
        setClients(result.clients);
        setProjects(result.projects);
        addToast('SUCCESS', 'Client added');

        if (!user.isGuest) {
            try {
                await db.clients.create({
                    id: client.id,
                    user_id: user.id,
                    name: client.name,
                    email: client.email,
                    revenue: client.revenue,
                    status: client.status,
                    notes: client.notes,
                    avatar: client.avatar
                });
                // Also create the projects
                for (const p of finalProjects) {
                    await db.projects.create({
                        id: p.id,
                        user_id: user.id,
                        title: p.title,
                        client_id: client.id,
                        client_name: client.name,
                        status: p.status,
                        price: p.price,
                        progress: p.progress,
                        tags: p.tags,
                        color: p.color,
                        notes: p.notes,
                        deadline: p.deadline?.toISOString()
                    });
                }
            } catch (e) {
                console.error('[Supabase] Client create failed:', e);
            }
        }
    };

    const handleClientUpdate = async (client: Client, newProjects: Partial<Project>[]) => {
        if (!user) return;
        const finalProjects = newProjects.map(p => ({
            ...p,
            id: Date.now().toString() + Math.random(),
            clientId: client.id,
            client: client.name
        } as Project));

        const result = Backend.clients.update(user.id, client, finalProjects);
        setClients(result.clients);
        setProjects(result.projects);
        addToast('SUCCESS', 'Client updated');

        if (!user.isGuest) {
            try {
                await db.clients.update(client.id, {
                    name: client.name,
                    email: client.email,
                    revenue: client.revenue,
                    status: client.status,
                    notes: client.notes,
                    avatar: client.avatar
                });
            } catch (e) {
                console.error('[Supabase] Client update failed:', e);
            }
        }
    };

    const handleClientDelete = async (id: string) => {
        if (!user) return;
        const result = Backend.clients.delete(user.id, id);
        setClients(result.clients);
        setProjects(result.projects);
        setTasks(result.tasks);
        setFolders(result.folders);
        addToast('INFO', 'Client and associated data removed');

        if (!user.isGuest) {
            try {
                await db.clients.delete(id);
            } catch (e) {
                console.error('[Supabase] Client delete failed:', e);
            }
        }
    };

    const createNewSession = useCallback(() => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Conversation',
            messages: [],
            lastModified: new Date()
        };
        setChatSessions(prev => [...prev, newSession]);
        setCurrentSessionId(newSession.id);
    }, [setCurrentSessionId, setChatSessions]);

    const deleteSession = useCallback((id: string) => {
        setChatSessions(prev => prev.filter(s => s.id !== id));
        if (currentSessionId === id) {
            setCurrentSessionId(null);
            setChatSessions(prev => {
                if (prev.length > 0) {
                    const sorted = [...prev].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
                    setCurrentSessionId(sorted[0].id);
                    return prev;
                } else {
                    createNewSession();
                    return prev;
                }
            });
        }
    }, [currentSessionId, createNewSession, setCurrentSessionId, setChatSessions]);

    const handleStopGeneration = useCallback(() => {
        if (activeRequestRef.current) {
            activeRequestRef.current = false;
            setIsLoading(false);
            setLoadingStep(undefined);
            resetGeminiSession();
            addToast('INFO', 'AI generation stopped.');
        }
    }, [addToast]);

    const handleSendMessage = useCallback(async (text: string, image?: string, isIgnite?: boolean, mentionedTaskIds?: string[]) => {
        if (!currentSessionId) createNewSession();
        const activeId = currentSessionId || (chatSessions.length > 0 ? chatSessions[0].id : Date.now().toString());

        let actualActiveId = activeId;
        if (!chatSessions.find(s => s.id === actualActiveId)) {
            createNewSession();
            actualActiveId = chatSessions.length > 0 ? chatSessions[chatSessions.length - 1].id : Date.now().toString();
        }

        // --- SECURE TOKEN CHECK ---
        // Deduct tokens strictly before processing.
        const cost = isIgnite ? TOKEN_COSTS.CHAT_IGNITE : TOKEN_COSTS.CHAT_NORMAL;
        const hasTokens = handleUseToken(cost, isIgnite ? 'chat_ignite' : 'chat_normal');

        if (!hasTokens) return; // Block execution

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text, timestamp: new Date(), image: image };

        setChatSessions(prev => {
            const targetSessionIndex = prev.findIndex(s => s.id === actualActiveId);
            if (targetSessionIndex !== -1) {
                const updatedSessions = [...prev];
                updatedSessions[targetSessionIndex] = {
                    ...updatedSessions[targetSessionIndex],
                    messages: [...updatedSessions[targetSessionIndex].messages, userMsg],
                    lastModified: new Date(),
                    title: updatedSessions[targetSessionIndex].messages.length === 0 ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : updatedSessions[targetSessionIndex].title
                };
                return updatedSessions;
            } else {
                return prev;
            }
        });

        setCurrentSessionId(actualActiveId);
        setIsLoading(true);
        activeRequestRef.current = true;

        // START IGNITE SIMULATION LOOP
        let stepInterval: ReturnType<typeof setInterval> | null = null;
        if (isIgnite) {
            const steps = ['Initializing Super Agent...', 'Reading Task Context...', 'Analyzing Requirements...', 'Formulating Strategy...', 'Executing Tools...'];
            let stepIdx = 0;
            setLoadingStep(steps[0]);
            stepInterval = setInterval(() => {
                stepIdx++;
                if (stepIdx < steps.length) {
                    setLoadingStep(steps[stepIdx]);
                }
            }, 1500);
        }

        try {
            // --- AI CONTEXT GENERATION ---
            const totalRevenue = projects.filter(p => p.status === 'COMPLETED').reduce((acc, p) => acc + (p.price || 0), 0);
            const completedTasksCount = tasks.filter(t => t.completed).length;
            const bestHabitStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

            let contextSummary = `
        CURRENT TIME: ${new Date().toLocaleString()}
        
        [USER ACHIEVEMENTS & PROGRESS]:
        - Total Lifetime Revenue: $${totalRevenue.toLocaleString()}
        - Tasks Completed: ${completedTasksCount}
        - Highest Habit Streak: ${bestHabitStreak} days
        - Active Projects: ${projects.filter(p => p.status === 'ACTIVE').length}
        
        [CURRENT TASKS]: ${tasks.filter(t => !t.completed).map(t => `[ID: ${t.id}] ${t.title} (Due: ${new Date(t.date).toLocaleString()})`).join('\n')}.
        [PROJECTS]: ${projects.map(p => p.title).join(', ')}.
        [CLIENTS]: ${clients.map(c => c.name).join(', ')}.
        [HABITS STREAK]: ${habits.reduce((acc, h) => acc + h.streak, 0)}.
      `;

            if (mentionedTaskIds && mentionedTaskIds.length > 0) {
                const detailedTasks = tasks.filter(t => mentionedTaskIds.includes(t.id));
                const detailedContext = detailedTasks.map(t => JSON.stringify(t)).join('\n');
                contextSummary += `\n\n[USER EXPLICITLY MENTIONED THESE TASKS VIA @ - PRIORITIZE THEM]:\n${detailedContext}`;
            }

            const response = await sendMessageToGemini(text, image, contextSummary, user?.aiMemory, isIgnite);
            let responseText = response.text;

            if (response.functionCalls && response.functionCalls.length > 0) {
                // If Ignite, update status to "Executing..."
                if (isIgnite) setLoadingStep("Executing Tools...");

                for (const call of response.functionCalls) {
                    if (call.name === 'createTask' && user) {
                        // Tool calls here are technically covered by the initial chat cost in this architecture
                        // unless we strictly want to charge CRUD separately. For now, chat cost covers interaction.
                        const args = call.args;
                        if (args.action === 'CREATE') {
                            const newTask: Task = {
                                id: Date.now().toString() + Math.random(),
                                title: args.title,
                                category: args.category || 'PRODUCT',
                                priority: args.priority || 'MEDIUM',
                                duration: 60,
                                date: args.date ? new Date(args.date) : new Date(),
                                completed: false,
                                statusLabel: 'TODO'
                            };
                            const newTasks = Backend.tasks.create(user.id, newTask);
                            setTasks(newTasks);
                            addToast('SUCCESS', `Task created: ${newTask.title}`);
                            if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: true, taskId: newTask.id });
                        }
                        else if (args.action === 'UPDATE') {
                            const target = tasks.find(t => t.id === args.id || (args.title && t.title.toLowerCase().includes(args.title.toLowerCase())));
                            if (target) {
                                const updated = {
                                    ...target,
                                    ...args,
                                    date: args.date ? new Date(args.date) : target.date,
                                    completed: args.status === 'DONE' ? true : (args.status ? false : target.completed),
                                    statusLabel: args.status || target.statusLabel
                                };
                                const newTasks = Backend.tasks.update(user.id, updated);
                                setTasks(newTasks);
                                addToast('SUCCESS', `Task updated: ${updated.title}`);
                                if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: true });
                            } else {
                                if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: false, error: "Task not found" });
                            }
                        }
                        else if (args.action === 'DELETE') {
                            const target = tasks.find(t => t.id === args.id || (args.title && t.title.toLowerCase().includes(args.title.toLowerCase())));
                            if (target) {
                                const newTasks = Backend.tasks.delete(user.id, target.id);
                                setTasks(newTasks);
                                addToast('INFO', 'Task deleted');
                                if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: true });
                            } else {
                                if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: false, error: "Task not found" });
                            }
                        }
                    }
                }
            }

            if (activeRequestRef.current) {
                if (responseText) {
                    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
                    setChatSessions(prev => {
                        const targetSessionIndex = prev.findIndex(s => s.id === actualActiveId);
                        if (targetSessionIndex !== -1) {
                            const updatedSessions = [...prev];
                            updatedSessions[targetSessionIndex] = {
                                ...updatedSessions[targetSessionIndex],
                                messages: [...updatedSessions[targetSessionIndex].messages, aiMsg],
                                lastModified: new Date()
                            };
                            return updatedSessions;
                        }
                        return prev;
                    });
                }
            }
        } catch (error) {
            if (activeRequestRef.current) {
                setChatSessions(prev => {
                    const targetSessionIndex = prev.findIndex(s => s.id === actualActiveId);
                    if (targetSessionIndex !== -1) {
                        const updatedSessions = [...prev];
                        updatedSessions[targetSessionIndex] = {
                            ...updatedSessions[targetSessionIndex],
                            messages: [...updatedSessions[targetSessionIndex].messages, { id: Date.now().toString(), role: 'model', text: "System Failure: Unable to process request.", timestamp: new Date() }],
                        };
                        return updatedSessions;
                    }
                    return prev;
                });
            }
            addToast('ERROR', 'AI Request Failed');
        } finally {
            if (stepInterval) clearInterval(stepInterval);
            if (activeRequestRef.current) {
                setIsLoading(false);
                setLoadingStep(undefined);
                activeRequestRef.current = false;
            }
        }
    }, [currentSessionId, createNewSession, chatSessions, addToast, tasks, projects, clients, habits, user]);

    const handleRecoverySession = async (energyLevel: number) => {
        setIsChatOverlayOpen(true);
        const recoveryId = Date.now().toString();
        const startMsg: Message = { id: Date.now().toString(), role: 'user', text: `[SYSTEM TRIGGER]: Energy Level: ${energyLevel}/10.`, timestamp: new Date() };
        setChatSessions(prev => [...prev, {
            id: recoveryId,
            title: 'System Recovery',
            messages: [startMsg],
            lastModified: new Date()
        }]);
        setCurrentSessionId(recoveryId);

        // Recovery implies basic chat unless specified
        const hasTokens = handleUseToken(TOKEN_COSTS.CHAT_NORMAL, 'recovery_session');
        if (!hasTokens) return;

        setIsLoading(true);
        activeRequestRef.current = true;
        try {
            const response = await sendMessageToGemini(`IMPORTANT: ${RECOVERY_INSTRUCTION.replace('{{ENERGY_LEVEL}}', String(energyLevel))}`, undefined, undefined, user?.aiMemory);
            if (activeRequestRef.current) {
                const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: response.text, timestamp: new Date() };
                setChatSessions(prev => prev.map(s => s.id === recoveryId ? { ...s, messages: [...s.messages, aiMsg] } : s));
            }
        } finally {
            if (activeRequestRef.current) {
                setIsLoading(false);
                activeRequestRef.current = false;
            }
        }
    };

    const handleUpdateUser = (updatedUser: User) => {
        setUser(updatedUser);
        storageService.saveUser(updatedUser);
        addToast('SUCCESS', 'Profile updated');
    };

    const renderView = () => {
        switch (currentView) {
            case 'HQ':
                return <HQ
                    user={user}
                    tasks={tasks}
                    clients={clients}
                    projects={projects}
                    habits={habits}
                    setTasks={setTasks}
                    onStartRecovery={handleRecoverySession}
                    onNavigate={setCurrentView}
                    onSendMessage={handleSendMessage}
                    onOpenAiSidebar={() => setIsChatOverlayOpen(true)}
                    onAddTask={handleTaskCreate}
                    onUpdateTask={handleTaskUpdate}
                    onDeleteTask={handleTaskDelete}
                    onAddProject={handleProjectCreate}
                    onUpdateProject={handleProjectUpdate}
                    onDeleteProject={handleProjectDelete}
                    onToggleHabit={handleToggleHabit}
                />;
            case 'MANAGER':
                return <ManagerPage
                    clients={clients}
                    projects={projects}
                    tasks={tasks}
                    onAddClient={handleClientAdd}
                    onUpdateClient={handleClientUpdate}
                    onDeleteClient={handleClientDelete}
                    onAddProject={handleProjectCreate}
                    onUpdateProject={handleProjectUpdate}
                    onDeleteProject={handleProjectDelete}
                />;
            case 'TEAMS':
                return <TeamPage
                    user={user as User}
                    tasks={tasks}
                    projects={projects}
                    habits={habits}
                    onUpdateTask={handleTaskUpdate}
                    onDeleteTask={handleTaskDelete}
                    onAddTask={handleTaskCreate}
                    onUpdateUser={handleUpdateUser}
                    onChangeColor={(taskId, color) => {
                        const t = tasks.find(t => t.id === taskId);
                        if (t) handleTaskUpdate({ ...t, color });
                    }}
                    onAddTasks={(newTasks) => newTasks.forEach(handleTaskCreate)}
                />;
            case 'TASKS':
                return <TasksPage
                    tasks={tasks}
                    projects={projects}
                    onUpdateTask={handleTaskUpdate}
                    onDeleteTask={handleTaskDelete}
                    onAddTask={handleTaskCreate}
                    onUpdateProject={handleProjectUpdate}
                    onAddProject={handleProjectCreate}
                    onDeleteProject={handleProjectDelete}
                />;
            case 'HABITS':
                return <HabitsPage
                    habits={habits}
                    setHabits={setHabits}
                />;
            case 'APPS':
                return <Apps
                    items={infinityItems}
                    setItems={setInfinityItems}
                    userTokens={user?.tokens || 0}
                    onUseToken={(amount) => handleUseToken(amount, 'app_action')}
                />;
            case 'FILES':
                return <FileManager files={files} setFiles={setFiles} folders={folders} setFolders={setFolders} clients={clients} isDriveConnected={isDriveConnected} />;
            case 'CALENDAR':
                return <Calendar
                    tasks={tasks}
                    onUpdateTask={handleTaskUpdate}
                    onDeleteTask={handleTaskDelete}
                    onChangeColor={(id, c) => handleTaskUpdate({ ...tasks.find(t => t.id === id)!, color: c })}
                    onAddTask={handleTaskCreate}
                    onAddTasks={(tl) => {
                        tl.forEach(t => handleTaskCreate(t));
                        addToast('SUCCESS', `${tl.length} events added`);
                    }}
                />;
            case 'SETTINGS':
                return <Settings
                    user={user as User}
                    onLogout={() => {
                        storageService.logout();
                        setUser(null);
                        setCurrentView('HQ');
                    }}
                    onClose={() => setCurrentView('HQ')}
                    onConnectDrive={() => setIsDriveConnected(true)}
                    isDriveConnected={isDriveConnected}
                    onUpdateUser={handleUpdateUser}
                />;
            case 'CHAT':
            default:
                return <ChatInterface
                    user={user}
                    messages={chatSessions.find(s => s.id === currentSessionId)?.messages || []}
                    isLoading={isLoading}
                    loadingStep={loadingStep}
                    onSendMessage={handleSendMessage}
                    onStopGeneration={handleStopGeneration}
                    sessions={chatSessions}
                    currentSessionId={currentSessionId}
                    onSelectSession={setCurrentSessionId}
                    onCreateSession={createNewSession}
                    onDeleteSession={deleteSession}
                    tasks={tasks}
                />;
        }
    };

    if (isAppLoading) return <LoadingScreen />;

    if (!user) return <Auth onLogin={handleLogin} />;

    return (
        <div className="flex flex-col md:flex-row h-[100dvh] bg-app-bg text-text-primary overflow-hidden animate-in fade-in duration-500">
            <Navigation
                currentView={currentView}
                onNavigate={setCurrentView}
                user={user}
                notifications={notifications}
                onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
                onClearAll={() => setNotifications([])}
            />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <TopBar
                    user={user}
                    notifications={notifications}
                    onToggleTheme={handleToggleTheme}
                    onToggleNotifications={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                    showNotificationsDropdown={showNotificationsDropdown}
                    onClearNotifications={() => setNotifications([])}
                    onMarkNotificationRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
                    onTeamInviteResponse={handleTeamInviteResponse}
                />
                <div className="flex-1 h-full w-full max-w-[1920px] mx-auto overflow-hidden p-4 md:p-8 transition-all">
                    {renderView()}
                </div>
                <ToastContainer toasts={toasts} onDismiss={removeToast} />

                <ChatOverlay
                    isOpen={isChatOverlayOpen}
                    onClose={() => setIsChatOverlayOpen(false)}
                    user={user}
                    messages={chatSessions.find(s => s.id === currentSessionId)?.messages || []}
                    isLoading={isLoading}
                    loadingStep={loadingStep}
                    onSendMessage={handleSendMessage}
                    onStopGeneration={handleStopGeneration}
                    sessions={chatSessions}
                    currentSessionId={currentSessionId}
                    onSelectSession={setCurrentSessionId}
                    onCreateSession={createNewSession}
                    onDeleteSession={deleteSession}
                    tasks={tasks}
                />
            </main>
        </div>
    );
}

export default App;
