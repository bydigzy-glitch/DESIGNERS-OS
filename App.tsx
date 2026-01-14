
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeGemini, resetGeminiSession, sendToolResponseToGemini } from './services/geminiService';
import { sendMessageToGeminiProxy as sendMessageToGemini } from './services/geminiProxy';
import { cn } from "@/lib/utils";
import { storageService, Backend, TOKEN_COSTS } from './services/storageService';
import { db, supabase, subscribeToChanges, dbNotifications, subscribeToNotifications, dbTeamMembers } from './services/supabaseClient';
import { ChatInterface } from './components/ChatInterface';
import { Navigation } from './components/Navigation';
import { HQ } from './components/HQ';
import { HabitsPage } from './components/HabitsPage';
import { QuickActionsSidebar } from './components/QuickActionsSidebar';
import { Apps } from './components/Apps';
import { FileManager } from './components/FileManager';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { ChatOverlay } from './components/ChatOverlay';
import { ManagerPage } from './components/ManagerPage';
import { TeamPage } from './components/TeamPage';
import { LoadingScreen } from './components/common/LoadingScreen';
import { AnimatedBackground } from './components/common/AnimatedBackground';
import { ToastContainer, ToastMessage, ToastType } from './components/common/Toast';
import { Message, ViewMode, Task, FileAsset, Folder, User, ChatSession, Client, Project, Habit, CanvasItem, AppNotification, AutopilotMode, ApprovalRequest, RiskAlert, HandledAction } from './types';
import { RECOVERY_INSTRUCTION } from './constants';
import { TopBar } from './components/TopBar';
import { CommandCenter } from './components/CommandCenter';
import { ClientsPage } from './components/ClientsPage';
import { WorkPage } from './components/WorkPage';
import { CalendarPage } from './components/CalendarPage';
import { MoneyPage } from './components/MoneyPage';
import { BrainOverlay } from './components/BrainOverlay';
import { BrainPage } from './components/BrainPage';
import { AutomationEngine } from './services/automationEngine';
import { analyzeIntakeSubmission } from './services/geminiService';
import { IntakeForm } from './components/IntakeForm';
import { IntakeSubmission } from './types';
import { AICommandPalette } from './components/ai/AICommandPalette';
import { AIContext } from './services/ai/types';
import { runReminderCheck, requestNotificationPermission, clearAllReminders } from './services/reminderService';

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

    // Designers Hub State
    const [autopilotMode, setAutopilotMode] = useState<AutopilotMode>('CONFIDENT');
    const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
    const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
    const [handledToday, setHandledToday] = useState<HandledAction[]>([]);
    const [isBrainOpen, setIsBrainOpen] = useState(false);
    const [isIntakeFormOpen, setIsIntakeFormOpen] = useState(false);
    const [isAICommandOpen, setIsAICommandOpen] = useState(false);


    const activeRequestRef = useRef(false);

    // Designers Hub: Automation Diagnostic
    const runAutomation = useCallback(async () => {
        const engine = new AutomationEngine({
            autopilotMode,
            pendingApprovals,
            riskAlerts,
            handledToday,
            brainOpen: isBrainOpen,
            projects,
            clients,
            tasks
        }, autopilotMode);

        const { handled, approvals, risks } = await engine.runDiagnostic();

        if (handled.length > 0) {
            setHandledToday(prev => {
                // Deduplicate handled actions if needed, or just append
                const newHandled = handled.filter(h => !prev.some(p => p.id === h.id));
                return [...newHandled, ...prev].slice(0, 20);
            });
        }

        if (approvals.length > 0) {
            const newApprovals = approvals.filter(a => !pendingApprovals.some(existing => existing.id === a.id));
            if (newApprovals.length > 0) {
                setPendingApprovals(prev => [...newApprovals, ...prev]);
            }
        }

        if (risks.length > 0) {
            const newRisks = risks.filter(r => !riskAlerts.some(existing => existing.id === r.id));
            if (newRisks.length > 0) {
                setRiskAlerts(prev => [...newRisks, ...prev]);
            }
        }
    }, [autopilotMode, pendingApprovals, riskAlerts, handledToday, isBrainOpen, projects, clients, tasks]);

    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            runAutomation();
        }, 1000 * 60 * 5); // Every 5 minutes
        runAutomation();
        return () => clearInterval(interval);
    }, [user, runAutomation]);

    const handleIntakeSubmit = async (submission: IntakeSubmission) => {
        setIsLoading(true);
        try {
            const analysis = await analyzeIntakeSubmission(submission.data);

            const newClient: Client = {
                id: `client-${Date.now()}`,
                name: submission.data.name,
                email: submission.data.email,
                revenue: 0,
                status: analysis.recommendation === 'REJECT' ? 'RED_FLAG' : 'ACTIVE',
                source: (submission.data.source.toUpperCase() as any) || 'REFERRAL',
                scores: {
                    paymentReliability: analysis.paymentReliability,
                    scopeCreepRisk: analysis.scopeCreepRisk,
                    stressCost: analysis.stressCost,
                    lifetimeValue: 0
                },
                notes: analysis.summary
            };

            await handleClientAdd(newClient, []);
            addToast('SUCCESS', `Lead processed: ${analysis.recommendation}`);

            if (analysis.redFlags && analysis.redFlags.length > 0) {
                setRiskAlerts(prev => [{
                    id: `intake-risk-${newClient.id}`,
                    timestamp: new Date(),
                    type: 'CLIENT_SILENT',
                    severity: 'WARNING',
                    title: 'Intake Red Flags',
                    message: analysis.redFlags.join(', '),
                    acknowledged: false
                }, ...prev]);
            }
        } catch (error) {
            console.error("Intake analysis failed", error);
            addToast('ERROR', "Brain failed to analyze lead.");
        } finally {
            setIsLoading(false);
        }
    };


    // --- INITIALIZATION & AUTHENTICATION ---
    useEffect(() => {
        storageService.checkVersion();

        const validateSession = async () => {
            const existingUsers = storageService.getUsers();
            const adminExists = existingUsers.some(u => u.email === DUMMY_USER.email);
            if (!adminExists) storageService.saveUser(DUMMY_USER);

            const sessionUser = storageService.getSession();
            if (sessionUser) {
                // CRITICAL FIX: Verify Supabase Session Matches
                if (!sessionUser.isGuest) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                        console.warn("[Auth Mismatch] Local user found but Supabase session missing. Forcing logout.");
                        storageService.logout();
                        setUser(null);
                        return; // Stop loading data
                    }
                }

                const freshUser = storageService.getUser(sessionUser.id);
                const safeUser = freshUser ? { ...freshUser, tokens: freshUser.tokens ?? 10 } : { ...sessionUser, tokens: sessionUser.tokens ?? 10 };

                // Self-Repair: If user exists in session but not in main storage, restore them immediately
                if (!freshUser) {
                    console.warn("[Self-Repair] User found in session but missing from registry. Restoring...", safeUser.id);
                    storageService.saveUser(safeUser);
                }

                setUser(safeUser);
                // Load notifications on session restore
                if (safeUser.notifications) {
                    setNotifications(safeUser.notifications.map(n => ({ ...n, timestamp: new Date(n.timestamp) })));
                }
            }
            setIsAppLoading(false);
        };

        validateSession();

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

    // AI Command Palette keyboard shortcut (⌘K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsAICommandOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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
                    const mappedTasks: Task[] = tasksData.map(t => {
                        // Ensure date is always a Date object
                        let taskDate: Date;
                        try {
                            taskDate = t.date instanceof Date ? t.date : new Date(t.date);
                            // Validate the date is valid
                            if (isNaN(taskDate.getTime())) {
                                taskDate = new Date(); // Fallback to today
                            }
                        } catch (e) {
                            taskDate = new Date(); // Fallback to today
                        }

                        return {
                            id: t.id,
                            title: t.title,
                            date: taskDate,
                            category: t.category as Task['category'],
                            priority: t.priority as Task['priority'],
                            statusLabel: t.status_label,
                            duration: t.duration,
                            completed: t.completed,
                            color: t.color,
                            projectId: t.project_id,
                            notes: t.notes
                        };
                    });
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
                } else {
                    // MIGRATION: If no habits in Supabase, check localStorage and migrate
                    try {
                        const localData = storageService.getUserData(user.id);
                        if (localData.habits && localData.habits.length > 0) {
                            console.log('[Migration] Found', localData.habits.length, 'habits in localStorage, migrating to Supabase...');

                            // Migrate each habit to Supabase
                            for (const habit of localData.habits) {
                                try {
                                    await db.habits.create({
                                        id: habit.id,
                                        user_id: user.id,
                                        title: habit.title,
                                        category: habit.category,
                                        frequency: habit.frequency,
                                        streak: habit.streak,
                                        completed_dates: habit.completedDates || []
                                    });
                                } catch (e) {
                                    console.error('[Migration] Failed to migrate habit:', habit.id, e);
                                }
                            }

                            // Set the migrated habits
                            setHabits(localData.habits);
                            console.log('[Migration] Habits migrated successfully');
                        }
                    } catch (e) {
                        console.error('[Migration] Failed to migrate habits:', e);
                    }
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

                // Load notifications
                try {
                    const { data: notificationsData } = await dbNotifications.getByUser(user.id);
                    if (notificationsData) {
                        const mappedNotifications: AppNotification[] = notificationsData.map(n => ({
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
                        }));
                        setNotifications(mappedNotifications);
                    }
                } catch (e) {
                    console.error('[Supabase] Notifications load failed:', e);
                }

                // Check for pending team invitations and create notifications
                try {
                    const { data: pendingInvites } = await dbTeamMembers.getByUser(user.id);

                    if (pendingInvites) {
                        const pendingTeams = pendingInvites.filter((m: any) => m.status === 'PENDING');

                        for (const invite of pendingTeams) {
                            // Check if notification already exists for this invite
                            const existingNotif = notifications.find(n =>
                                n.actionData?.type === 'TEAM_INVITE' &&
                                n.actionData?.teamId === invite.team_id
                            );

                            if (!existingNotif) {
                                // Create notification for pending invite
                                const newNotif: AppNotification = {
                                    id: `team-invite-${invite.team_id}-${Date.now()}`,
                                    title: 'Team Invitation',
                                    message: `You've been invited to join ${invite.team_name || 'a team'}`,
                                    type: 'SYSTEM',
                                    timestamp: new Date(),
                                    read: false,
                                    actionData: {
                                        type: 'TEAM_INVITE',
                                        teamId: invite.team_id,
                                        teamName: invite.team_name
                                    }
                                };

                                addNotification(newNotif);
                                console.log('[Team] Created notification for pending invite:', invite.team_id);
                            }
                        }
                    }
                } catch (e) {
                    console.error('[Team] Failed to check pending invites:', e);
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

        // Subscribe to notifications
        const unsubNotifications = subscribeToNotifications(user.id, (payload: any) => {
            console.log('[Realtime] Notification change:', payload.eventType);
            if (payload.eventType === 'INSERT') {
                const n = payload.new;
                addNotification({
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
            } else if (payload.eventType === 'UPDATE') {
                const n = payload.new;
                setNotifications(prev => prev.map(x => x.id === n.id ? {
                    ...x,
                    read: n.read
                } : x));
            } else if (payload.eventType === 'DELETE') {
                setNotifications(prev => prev.filter(x => x.id !== payload.old.id));
            }
        });

        return () => {
            unsubscribe();
            unsubNotifications();
        };
    }, [user?.id, user?.isGuest]);


    // --- DATA SAVING ---
    useEffect(() => {
        if (user && !user.isGuest) {
            // Strip images from chat sessions to prevent localStorage quota exceeded
            const chatSessionsWithoutImages = chatSessions.map(session => ({
                ...session,
                messages: session.messages.map(msg => ({
                    ...msg,
                    image: undefined // Remove images to save space
                }))
            }));

            // Limit to 10 most recent chat sessions
            const sortedSessions = [...chatSessionsWithoutImages].sort((a, b) =>
                new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
            );
            const limitedSessions = sortedSessions.slice(0, 10);

            storageService.saveUserData(user.id, {
                tasks, files, folders, clients, projects, chatSessions: limitedSessions, habits: habits as any, infinityItems: infinityItems as any
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

    // Apply saved theme color (only primary - light/dark mode handles the rest)
    useEffect(() => {
        if (user?.preferences?.themeColor) {
            document.documentElement.style.setProperty('--primary', user.preferences.themeColor);
            document.documentElement.style.setProperty('--ring', user.preferences.themeColor);
        }
    }, [user?.preferences?.themeColor]);

    // Apply saved theme class (light/dark/uber)
    useEffect(() => {
        if (user?.preferences?.theme) {
            document.documentElement.classList.remove('light', 'dark', 'uber');
            document.documentElement.classList.add(user.preferences.theme);
        }
    }, [user?.preferences?.theme]);

    const addToast = (type: ToastType, message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, message }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const addNotification = useCallback((note: AppNotification) => {
        setNotifications(prev => [note, ...prev]);
    }, []);

    // Reminder notification system - checks for upcoming tasks/meetings/deadlines
    useEffect(() => {
        if (!user) return;

        // Request notification permission on first interaction
        const requestPermission = () => {
            requestNotificationPermission();
            window.removeEventListener('click', requestPermission);
        };
        window.addEventListener('click', requestPermission);

        // Run reminder check every 30 seconds
        const checkReminders = () => {
            runReminderCheck({
                tasks,
                projects,
                onNotification: addNotification
            });
        };

        // Initial check
        checkReminders();

        // Set up interval
        const interval = setInterval(checkReminders, 30000); // Every 30 seconds

        return () => {
            clearInterval(interval);
            window.removeEventListener('click', requestPermission);
        };
    }, [user, tasks, projects, addNotification]);


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
            // Self-repair: If user is missing from storage, add them and retry
            if (e.message && e.message.includes("User not found")) {
                console.warn("User missing from storage during token deduction. Attempting self-repair...");
                try {
                    storageService.saveUser(user);
                    // Retry deduction
                    const retryResult = Backend.tokens.deduct(user.id, amount, feature, requestId);
                    if (retryResult.success) {
                        const updatedUser = { ...user, tokens: retryResult.newBalance };
                        setUser(updatedUser);
                        return true;
                    }
                } catch (retryError) {
                    console.error("Token deduction failed after repair:", retryError);
                }
            }

            addToast('ERROR', e.message || "Insufficient tokens.");
            return false;
        }
        return false;
    };

    const handleToggleTheme = () => {
        if (!user) return;
        const themes: ('light' | 'dark' | 'uber')[] = ['light', 'dark', 'uber'];
        const currentIndex = themes.indexOf(user.preferences.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];

        document.documentElement.classList.remove('light', 'dark', 'uber');
        document.documentElement.classList.add(nextTheme);
        localStorage.setItem('user_preferences_theme', nextTheme);

        const updated = { ...user, preferences: { ...user.preferences, theme: nextTheme } };
        setUser(updated);
        storageService.saveUser(updated);
    };

    const handleToggleHabit = async (id: string) => {
        const today = new Date().toISOString().split('T')[0];

        // Update local state first for immediate UI feedback
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

        // Sync to Supabase for non-guest users
        if (user && !user.isGuest) {
            try {
                const habit = habits.find(h => h.id === id);
                if (habit) {
                    const isCompleted = habit.completedDates.includes(today);
                    let newDates = [...habit.completedDates];
                    let newStreak = habit.streak;

                    if (isCompleted) {
                        newDates = newDates.filter(d => d !== today);
                        if (newStreak > 0) newStreak--;
                    } else {
                        newDates.push(today);
                        newStreak++;
                    }

                    await db.habits.update(id, {
                        streak: newStreak,
                        completed_dates: newDates
                    });
                }
            } catch (e) {
                console.error('[Supabase] Habit update failed:', e);
            }
        }
    };

    const handleTaskCreate = async (task: Task) => {
        if (!user) return;
        // Update local state immediately
        const updatedTasks = Backend.tasks.create(user.id, task);
        setTasks(updatedTasks);
        addToast('SUCCESS', 'Task created');

        // Sync to cloud for non-guest users
        if (!user.isGuest) {
            try {
                const { error } = await db.tasks.create({
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
                if (error) throw error;
            } catch (e: any) {
                console.error('[Supabase] Task create failed:', e);
                addToast('ERROR', `Save Failed: ${e.message || 'Unknown error'}`);
            }
        }
    };

    const handleTaskUpdate = async (task: Task) => {
        if (!user) return;

        // Ensure date is a Date object
        const validatedTask = {
            ...task,
            date: task.date instanceof Date ? task.date : new Date(task.date)
        };

        const updatedTasks = Backend.tasks.update(user.id, validatedTask);
        setTasks(updatedTasks);

        if (!user.isGuest) {
            try {
                const { error } = await db.tasks.update(validatedTask.id, {
                    title: validatedTask.title,
                    date: validatedTask.date.toISOString(),
                    category: validatedTask.category,
                    priority: validatedTask.priority,
                    status_label: validatedTask.statusLabel,
                    duration: validatedTask.duration,
                    completed: validatedTask.completed,
                    color: validatedTask.color,
                    project_id: validatedTask.projectId,
                    notes: validatedTask.notes
                });
                if (error) throw error;
            } catch (e: any) {
                console.error('[Supabase] Task update failed:', e);
                addToast('ERROR', `Update Failed: ${e.message}`);
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
                const { error } = await db.tasks.delete(id);
                if (error) throw error;
            } catch (e: any) {
                console.error('[Supabase] Task delete failed:', e);
                addToast('ERROR', `Delete Failed: ${e.message}`);
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
                const { error } = await db.projects.create({
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
                if (error) throw error;
            } catch (e: any) {
                console.error('[Supabase] Project create failed:', e);
                addToast('ERROR', `Project Save Failed: ${e.message}`);
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
                const { error } = await db.projects.update(project.id, {
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
                if (error) throw error;
            } catch (e: any) {
                console.error('[Supabase] Project update failed:', e);
                addToast('ERROR', `Project Update Failed: ${e.message}`);
            }
        }
    };

    const handleProjectDelete = async (id: string) => {
        if (!user) return;
        const result = Backend.projects.delete(user.id, id);
        setProjects(result.projects);
        setTasks(result.tasks);
        addToast('INFO', 'Project deleted');

        if (!user.isGuest) {
            try {
                const { error } = await db.projects.delete(id);
                if (error) throw error;
            } catch (e: any) {
                console.error('[Supabase] Project delete failed:', e);
                addToast('ERROR', `Project Delete Failed: ${e.message}`);
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

    // Helper to sync chat session to Supabase
    const syncChatSessionToSupabase = useCallback(async (session: ChatSession) => {
        if (!user || user.isGuest) return;

        try {
            // Convert messages to Supabase format (timestamps as strings)
            const messagesForSupabase = session.messages.map(msg => ({
                id: msg.id,
                role: msg.role,
                text: msg.text,
                timestamp: msg.timestamp.toISOString()
            }));

            // Check if session exists
            const { data: existing } = await db.chatSessions.getAll(user.id);
            const sessionExists = existing?.some(s => s.id === session.id);

            if (sessionExists) {
                // Update existing session
                await db.chatSessions.update(session.id, {
                    title: session.title,
                    messages: messagesForSupabase,
                    last_modified: session.lastModified.toISOString()
                });
            } else {
                // Create new session
                await db.chatSessions.create({
                    id: session.id,
                    user_id: user.id,
                    title: session.title,
                    messages: messagesForSupabase,
                    last_modified: session.lastModified.toISOString()
                });
            }
        } catch (e) {
            console.error('[Supabase] Chat session sync failed:', e);
        }
    }, [user]);

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
                    const args = call.args as any;
                    let result: any = { success: false, error: "Action blocked or failed" };

                    if (user) {
                        try {
                            // CREATE TASK
                            if (call.name === 'createTask') {
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
                                    await handleTaskCreate(newTask);
                                    result = { success: true, taskId: newTask.id };
                                    addToast('SUCCESS', `Task created: ${newTask.title}`);
                                } else if (args.action === 'UPDATE') {
                                    const target = tasks.find(t => t.id === args.id || (args.title && t.title.toLowerCase().includes(args.title.toLowerCase())));
                                    if (target) {
                                        const updated = {
                                            ...target,
                                            ...args,
                                            date: args.date ? new Date(args.date) : target.date,
                                            completed: args.status === 'DONE' ? true : (args.status ? false : target.completed),
                                            statusLabel: args.status || target.statusLabel
                                        };
                                        await handleTaskUpdate(updated);
                                        result = { success: true };
                                        addToast('SUCCESS', `Task updated: ${updated.title}`);
                                    } else {
                                        result = { success: false, error: "Task not found" };
                                    }
                                } else if (args.action === 'DELETE') {
                                    const target = tasks.find(t => t.id === args.id || (args.title && t.title.toLowerCase().includes(args.title.toLowerCase())));
                                    if (target) {
                                        await handleTaskDelete(target.id);
                                        result = { success: true };
                                    } else {
                                        result = { success: false, error: "Task not found" };
                                    }
                                }
                            }
                            // MANAGE PROJECT
                            else if (call.name === 'manageProject') {
                                if (args.action === 'CREATE') {
                                    const newProject: Project = {
                                        id: Date.now().toString() + Math.random(),
                                        title: args.title,
                                        client: args.clientName || 'Unassigned',
                                        clientId: undefined,
                                        status: args.status || 'ACTIVE',
                                        price: args.price || 0,
                                        progress: args.progress || 0,
                                        tags: [],
                                        color: '#f97316',
                                        notes: ''
                                    };
                                    await handleProjectCreate(newProject);
                                    result = { success: true, projectId: newProject.id };
                                }
                            }
                            // MANAGE CLIENT
                            else if (call.name === 'manageClient') {
                                if (args.action === 'CREATE') {
                                    const newClient: Client = {
                                        id: Date.now().toString() + Math.random(),
                                        name: args.name,
                                        email: args.email || '',
                                        revenue: 0,
                                        status: 'ACTIVE',
                                        notes: args.notes || '',
                                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${args.name}`
                                    };
                                    await handleClientAdd(newClient, []);
                                    result = { success: true, clientId: newClient.id };
                                }
                            }
                        } catch (e: any) {
                            console.error("Tool Execution Failed", e);
                            result = { success: false, error: e.message || "Unknown error" };
                        }
                    }

                    if (activeRequestRef.current) {
                        // Pass dummy ID for functionId since new SDK handles mapping implicitly via sequence or name
                        await sendToolResponseToGemini(call.name, "call_id_placeholder", result);
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
                            // Limit to 10 most recent sessions
                            const sorted = updatedSessions.sort((a, b) =>
                                new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
                            );
                            const limited = sorted.slice(0, 10);

                            // Sync to Supabase for authenticated users
                            syncChatSessionToSupabase(updatedSessions[targetSessionIndex]);

                            return limited;
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
                setChatSessions(prev => prev.map(s => s.id === recoveryId ? {
                    ...s,
                    messages: [...s.messages, aiMsg],
                    lastModified: new Date()
                } : s));
            }
        } catch (error: any) {
            console.error('Recovery failed:', error);
            addToast('ERROR', 'Recovery failed to start');
        } finally {
            setIsLoading(false);
            activeRequestRef.current = false;
        }
    };

    // AI Action Event Listener - connects action buttons (WorkPage) to chat sidebar
    useEffect(() => {
        const handleAIAction = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { tool, content, prompt, itemType } = customEvent.detail || {};

            // Open chat overlay
            setIsChatOverlayOpen(true);

            // Format message based on action type
            let message = '';
            if (tool === 'summarize') {
                message = `Summarize this:\n\n${content}`;
            } else if (tool === 'generate_items') {
                message = prompt || `Generate ${itemType} for this item`;
            } else if (tool === 'classify_tags') {
                message = `Suggest tags for:\n\n${content}`;
            } else {
                message = content || prompt || '';
            }

            // Auto-send after sidebar opens (small delay for UI transition)
            if (message) {
                setTimeout(() => {
                    handleSendMessage(message);
                }, 400);
            }
        };

        window.addEventListener('ai-action', handleAIAction);
        return () => window.removeEventListener('ai-action', handleAIAction);
    }, [handleSendMessage]);

    const handleUpdateUser = async (updatedUser: User) => {
        setUser(updatedUser);
        storageService.saveUser(updatedUser);

        // Sync to Supabase for cross-device sync
        if (!updatedUser.isGuest) {
            try {
                await db.users.upsert({
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    avatar: updatedUser.avatar,
                    preferences: updatedUser.preferences,
                    ai_memory: updatedUser.aiMemory,
                    tokens: updatedUser.tokens
                } as any);
            } catch (error) {
                console.error('Failed to sync user to Supabase:', error);
            }
        }

        addToast('SUCCESS', 'Profile updated');
    };

    const renderView = () => {
        switch (currentView) {
            // DESIGNERS HUB ROUTES
            case 'COMMAND_CENTER':
                return <CommandCenter
                    user={user}
                    tasks={tasks}
                    projects={projects}
                    clients={clients}
                    pendingApprovals={pendingApprovals}
                    riskAlerts={riskAlerts}
                    handledToday={handledToday}
                    autopilotMode={autopilotMode}
                    onOpenBrain={() => setIsBrainOpen(true)}
                    onApprove={(approval) => setPendingApprovals(prev => prev.filter(a => a.id !== approval.id))}
                    onReject={(approval) => setPendingApprovals(prev => prev.filter(a => a.id !== approval.id))}
                    onAcknowledgeRisk={(alert) => setRiskAlerts(prev => prev.map(r => r.id === alert.id ? { ...r, acknowledged: true } : r))}
                    onTaskClick={(task) => { /* Open task modal */ }}
                    onProjectClick={(project) => { /* Open project modal */ }}
                    onOpenIntake={() => setIsIntakeFormOpen(true)}
                />;
            case 'CLIENTS':
                return <ClientsPage
                    clients={clients}
                    projects={projects}
                    onAddClient={handleClientAdd}
                    onUpdateClient={handleClientUpdate}
                    onDeleteClient={handleClientDelete}
                />;
            case 'WORK':
                return <WorkPage
                    tasks={tasks}
                    projects={projects}
                    clients={clients}
                    onAddTask={handleTaskCreate}
                    onUpdateTask={handleTaskUpdate}
                    onDeleteTask={handleTaskDelete}
                    onAddProject={handleProjectCreate}
                    onUpdateProject={handleProjectUpdate}
                    onDeleteProject={handleProjectDelete}
                />;
            case 'CALENDAR':
                return <CalendarPage
                    tasks={tasks}
                    projects={projects}
                    onUpdateTask={handleTaskUpdate}
                    onAddTask={handleTaskCreate}
                    onDeleteTask={handleTaskDelete}
                />;
            case 'MONEY':
                return <MoneyPage
                    projects={projects}
                    clients={clients}
                />;
            // LEGACY ROUTES (kept for transition)
            case 'HQ':
                return <HQ
                    user={user}
                    tasks={tasks}
                    clients={clients}
                    projects={projects}
                    habits={habits}
                    pendingApprovals={pendingApprovals}
                    riskAlerts={riskAlerts}
                    handledToday={handledToday}
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
                    onApprove={(approval) => setPendingApprovals(prev => prev.filter(a => a.id !== approval.id))}
                    onReject={(approval) => setPendingApprovals(prev => prev.filter(a => a.id !== approval.id))}
                    onAcknowledgeRisk={(alert) => setRiskAlerts(prev => prev.map(r => r.id === alert.id ? { ...r, acknowledged: true } : r))}
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
            // case 'DEMO':
            //     return <ShadcnDemo />;
            case 'BRAIN':
                return <BrainPage
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
                    projects={projects}
                    clients={clients}
                    autopilotMode={autopilotMode}
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
                    projects={projects}
                    clients={clients}
                />;
        }
    };

    // AI Action Event Listener - connects action buttons (WorkPage) to chat sidebar
    useEffect(() => {
        const handleAIAction = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { tool, content, prompt, itemType } = customEvent.detail || {};

            // Open chat overlay
            setIsChatOverlayOpen(true);

            // Format message based on action type
            let message = '';
            if (tool === 'summarize') {
                message = `Summarize this:\n\n${content}`;
            } else if (tool === 'generate_items') {
                message = prompt || `Generate ${itemType} for this item`;
            } else if (tool === 'classify_tags') {
                message = `Suggest tags for:\n\n${content}`;
            } else {
                message = content || prompt || '';
            }

            // Auto-send after sidebar opens (small delay for UI transition)
            if (message) {
                setTimeout(() => {
                    handleSendMessage(message);
                }, 400);
            }
        };

        window.addEventListener('ai-action', handleAIAction);
        return () => window.removeEventListener('ai-action', handleAIAction);
    }, [handleSendMessage]);

    // We've removed the full-screen LoadingScreen to prioritize an immediate shell render.
    // Components like HQ will handle data-fetch states gracefully.
    // if (isAppLoading) return <LoadingScreen />;

    if (!user) return <Auth onLogin={handleLogin} />;

    return (
        <div className="flex flex-col md:flex-row h-[100dvh] bg-app-bg text-text-primary overflow-hidden animate-in fade-in duration-500 relative">
            <AnimatedBackground />
            <Navigation
                currentView={currentView}
                onNavigate={setCurrentView}
                user={user}
                notifications={notifications}
                onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
                onClearAll={() => setNotifications([])}
                autopilotMode={autopilotMode}
                onChangeAutopilotMode={setAutopilotMode}
                onOpenAI={() => setIsAICommandOpen(true)}
                pendingApprovalsCount={pendingApprovals.length}
                riskAlertsCount={riskAlerts.filter(r => !r.acknowledged).length}
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
                    onNavigate={setCurrentView}
                    currentView={currentView}
                    onOpenAI={() => setIsChatOverlayOpen(true)}
                    tasks={tasks}
                    projects={projects}
                    clients={clients}
                    files={files}
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
                    projects={projects}
                    clients={clients}
                />

                <IntakeForm
                    isOpen={isIntakeFormOpen}
                    onClose={() => setIsIntakeFormOpen(false)}
                    onSubmit={handleIntakeSubmit}
                />

                {/* AI Command Palette (⌘K) */}
                <AICommandPalette
                    open={isAICommandOpen}
                    onOpenChange={setIsAICommandOpen}
                    context={{
                        userId: user.id,
                        permissions: { canRead: true, canWrite: true, canDelete: false }
                    }}
                    tasks={tasks}
                    projects={projects}
                    clients={clients}
                    onApplyResult={(toolName, result) => {
                        // Handle AI results - create tasks, update items, etc.
                        if (toolName === 'generate_items' && result?.items) {
                            result.items.forEach((item: any) => {
                                if (item.title) {
                                    handleTaskCreate({
                                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                        title: item.title,
                                        completed: false,
                                        category: item.category || 'ADMIN',
                                        date: new Date(),
                                        duration: item.estimatedMinutes || 30,
                                        priority: item.priority || 'MEDIUM'
                                    });
                                }
                            });
                            addToast('SUCCESS', `Created ${result.items.length} tasks from AI`);
                        }
                    }}
                />
            </main>

            {/* Quick Actions Sidebar */}
            <div className="hidden xl:block h-full">
                <QuickActionsSidebar />
            </div>
        </div>
    );
}

export default App;
