
import { User, Task, FileAsset, Folder, ChatSession, Client, Project, Habit, CanvasItem, Friend, DirectMessage, TokenTransaction, TeamMessage, Team } from '../types';

const STORAGE_KEYS = {
    VERSION: 'designpreneur_version',
    USERS: 'designpreneur_users',
    SESSION: 'designpreneur_session',
    DATA_PREFIX: 'designpreneur_data_',
    LEDGER: 'designpreneur_ledger',
    TEAMS: 'designpreneur_teams',
};

const CURRENT_VERSION = 'v3.2';

// Fixed Token Costs
export const TOKEN_COSTS = {
    CHAT_NORMAL: 0.10,
    CHAT_IGNITE: 0.60,
    CRUD_AI: 0.40,
    IMAGE_GEN: 0.90,
};

interface UserData {
    tasks: Task[];
    files: FileAsset[];
    folders: Folder[];
    chatSessions: ChatSession[];
    clients: Client[];
    projects: Project[];
    habits: Habit[];
    infinityItems: CanvasItem[];
}

// --- BACKEND LOGIC & DATA INTEGRITY ---
export const Backend = {
    _getData: (userId: string): UserData => {
        try {
            const data = localStorage.getItem(`${STORAGE_KEYS.DATA_PREFIX}${userId}`);
            if (data) return JSON.parse(data);
        } catch (e) { }
        return { tasks: [], files: [], folders: [], chatSessions: [], clients: [], projects: [], habits: [], infinityItems: [] };
    },

    _saveData: (userId: string, data: UserData) => {
        localStorage.setItem(`${STORAGE_KEYS.DATA_PREFIX}${userId}`, JSON.stringify(data));
        window.dispatchEvent(new StorageEvent('storage', { key: `${STORAGE_KEYS.DATA_PREFIX}${userId}` }));
    },

    // --- TEAMS BACKEND ---
    teams: {
        _getAll: (): Team[] => {
            try {
                const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
                return data ? JSON.parse(data) : [];
            } catch { return []; }
        },
        _saveAll: (teams: Team[]) => {
            localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
            window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEYS.TEAMS }));
        },

        create: (ownerId: string, name: string): Team => {
            const teams = Backend.teams._getAll();
            const users = storageService.getUsers();
            const owner = users.find(u => u.id === ownerId);

            const newTeam: Team = {
                id: Date.now().toString(),
                name,
                ownerId,
                createdDate: new Date(),
                members: owner ? [{
                    id: owner.id,
                    email: owner.email,
                    name: owner.name,
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    avatar: owner.avatar,
                    dailyStreak: 0
                }] : [],
                messages: [],
                tasks: [] // Shared tasks init
            };

            teams.push(newTeam);
            Backend.teams._saveAll(teams);

            // Link owner to team
            if (owner) {
                owner.teamId = newTeam.id;
                storageService.saveUser(owner);
            }

            return newTeam;
        },

        invite: (teamId: string, email: string): { success: boolean, message: string } => {
            const teams = Backend.teams._getAll();
            const teamIndex = teams.findIndex(t => t.id === teamId);
            if (teamIndex === -1) return { success: false, message: "Team not found." };

            const users = storageService.getUsers();
            const userToInvite = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

            if (userToInvite) {
                // User exists - add directly (Simulating "Accept" flow shortcut)
                if (teams[teamIndex].members.some(m => m.id === userToInvite.id)) {
                    return { success: false, message: "User already in team." };
                }

                teams[teamIndex].members.push({
                    id: userToInvite.id,
                    email: userToInvite.email,
                    name: userToInvite.name,
                    role: 'VIEWER',
                    status: 'ACTIVE',
                    avatar: userToInvite.avatar,
                    dailyStreak: 0
                });

                // Link user to this team
                userToInvite.teamId = teamId;
                storageService.saveUser(userToInvite);
            } else {
                // User doesn't exist - Add placeholder
                if (teams[teamIndex].members.some(m => m.email.toLowerCase() === email.toLowerCase().trim())) {
                    return { success: false, message: "Email already invited." };
                }

                teams[teamIndex].members.push({
                    id: "invite-" + Date.now(),
                    email: email,
                    role: 'VIEWER',
                    status: 'INVITED',
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                    dailyStreak: 0
                });
            }

            Backend.teams._saveAll(teams);
            return { success: true, message: "User invited." };
        },

        sendMessage: (teamId: string, senderId: string, text: string): TeamMessage | null => {
            const teams = Backend.teams._getAll();
            const teamIndex = teams.findIndex(t => t.id === teamId);
            if (teamIndex === -1) return null;

            const users = storageService.getUsers();
            const sender = users.find(u => u.id === senderId);
            if (!sender) return null;

            const msg: TeamMessage = {
                id: Date.now().toString(),
                senderId,
                senderName: sender.name,
                senderAvatar: sender.avatar || '',
                text,
                timestamp: new Date()
            };

            teams[teamIndex].messages.push(msg);
            Backend.teams._saveAll(teams);
            return msg;
        },

        get: (teamId: string): Team | undefined => {
            return Backend.teams._getAll().find(t => t.id === teamId);
        }
    },

    // --- TOKEN SYSTEM IMPLEMENTATION ---
    tokens: {
        _getLedger: (): TokenTransaction[] => {
            try {
                const data = localStorage.getItem(STORAGE_KEYS.LEDGER);
                return data ? JSON.parse(data) : [];
            } catch { return []; }
        },

        _saveLedger: (ledger: TokenTransaction[]) => {
            localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(ledger));
        },

        _getCurrentWeekStart: (): string => {
            const now = new Date();
            // Monday 00:00 UTC
            const day = now.getUTCDay();
            const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
            monday.setUTCHours(0, 0, 0, 0);
            return monday.toISOString();
        },

        /**
         * Checks balance, handles weekly reset, and deducts tokens atomically.
         * Throws error if insufficient funds.
         */
        deduct: (userId: string, cost: number, feature: string, requestId: string): { success: boolean, newBalance: number, message?: string } => {
            // 1. Load User (Simulate DB Fetch)
            const users = storageService.getUsers();
            const userIndex = users.findIndex(u => u.id === userId);

            if (userIndex === -1) throw new Error("User not found.");
            const user = users[userIndex];

            // 2. Weekly Reset Logic
            const currentWeekStart = Backend.tokens._getCurrentWeekStart();
            if (!user.tokenWeekStart || new Date(user.tokenWeekStart) < new Date(currentWeekStart)) {
                user.tokens = 10.00;
                user.tokenWeekStart = currentWeekStart;
            }

            // 3. Idempotency Check
            const ledger = Backend.tokens._getLedger();
            const existingTx = ledger.find(tx => tx.requestId === requestId);

            if (existingTx) {
                // Request already processed, return success without charging again
                return { success: true, newBalance: user.tokens };
            }

            // 4. Balance Check
            if (user.tokens < cost) {
                throw new Error("Insufficient tokens. Upgrade or wait for weekly reset.");
            }

            // 5. Atomic Deduction
            user.tokens = Number((user.tokens - cost).toFixed(2));

            // 6. Log Transaction
            const transaction: TokenTransaction = {
                id: Date.now().toString() + Math.random(),
                userId,
                requestId,
                feature,
                cost,
                timestamp: new Date()
            };
            ledger.push(transaction);

            // 7. Save State (Commit)
            users[userIndex] = user;
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            Backend.tokens._saveLedger(ledger);

            // Sync session if it's the current user
            const session = storageService.getSession();
            if (session && session.id === userId) {
                localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
                // Fire storage event manually? No need, 'users' key change might trigger it if we listened for it.
            }

            return { success: true, newBalance: user.tokens };
        }
    },

    tasks: {
        create: (userId: string, task: Task) => {
            const data = Backend._getData(userId);
            data.tasks.push(task);
            Backend._saveData(userId, data);
            return data.tasks;
        },
        update: (userId: string, task: Task) => {
            const data = Backend._getData(userId);
            data.tasks = data.tasks.map(t => t.id === task.id ? task : t);
            Backend._saveData(userId, data);
            return data.tasks;
        },
        delete: (userId: string, taskId: string) => {
            const data = Backend._getData(userId);
            data.tasks = data.tasks.filter(t => t.id !== taskId);
            Backend._saveData(userId, data);
            return data.tasks;
        }
    },

    projects: {
        create: (userId: string, project: Project) => {
            const data = Backend._getData(userId);
            data.projects.push(project);
            Backend._saveData(userId, data);
            return data.projects;
        },
        update: (userId: string, project: Project) => {
            const data = Backend._getData(userId);
            data.projects = data.projects.map(p => p.id === project.id ? project : p);
            Backend._saveData(userId, data);
            return data.projects;
        },
        delete: (userId: string, projectId: string) => {
            const data = Backend._getData(userId);
            data.projects = data.projects.filter(p => p.id !== projectId);
            data.tasks = data.tasks.map(t => t.projectId === projectId ? { ...t, projectId: undefined } : t);
            Backend._saveData(userId, data);
            return { projects: data.projects, tasks: data.tasks };
        }
    },

    clients: {
        create: (userId: string, client: Client, initialProjects: Project[] = []) => {
            const data = Backend._getData(userId);
            data.clients.push(client);
            if (initialProjects.length > 0) {
                data.projects.push(...initialProjects);
            }
            Backend._saveData(userId, data);
            return { clients: data.clients, projects: data.projects };
        },
        update: (userId: string, client: Client, newProjects: Project[] = []) => {
            const data = Backend._getData(userId);
            data.clients = data.clients.map(c => c.id === client.id ? client : c);
            if (newProjects.length > 0) {
                data.projects.push(...newProjects);
            }
            Backend._saveData(userId, data);
            return { clients: data.clients, projects: data.projects };
        },
        delete: (userId: string, clientId: string) => {
            const data = Backend._getData(userId);
            data.clients = data.clients.filter(c => c.id !== clientId);
            const clientProjectIds = data.projects.filter(p => p.clientId === clientId).map(p => p.id);
            data.projects = data.projects.filter(p => p.clientId !== clientId);
            data.tasks = data.tasks.map(t => t.projectId && clientProjectIds.includes(t.projectId) ? { ...t, projectId: undefined } : t);
            data.folders = data.folders.map(f => f.clientId === clientId ? { ...f, clientId: undefined } : f);
            Backend._saveData(userId, data);
            return { clients: data.clients, projects: data.projects, tasks: data.tasks, folders: data.folders };
        }
    },

    habits: {
        update: (userId: string, habits: Habit[]) => {
            const data = Backend._getData(userId);
            data.habits = habits;
            Backend._saveData(userId, data);
            return data.habits;
        }
    },

    saveAll: (userId: string, partialData: Partial<UserData>) => {
        const data = Backend._getData(userId);
        const updated = { ...data, ...partialData };
        Backend._saveData(userId, updated);
    }
};

export const storageService = {
    /**
     * Check and update version WITHOUT clearing user data.
     * IMPORTANT: This function MUST NEVER delete STORAGE_KEYS.USERS, STORAGE_KEYS.DATA_PREFIX, 
     * STORAGE_KEYS.TEAMS, or STORAGE_KEYS.LEDGER to prevent data loss on updates.
     */
    checkVersion: (): boolean => {
        const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
        if (storedVersion !== CURRENT_VERSION) {
            // Only update the version marker, DO NOT clear any user data
            localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
            console.log(`[Storage] Version updated from ${storedVersion || 'unset'} to ${CURRENT_VERSION}. User data preserved.`);
        }
        return false;
    },

    getUsers: (): User[] => {
        try {
            const users = localStorage.getItem(STORAGE_KEYS.USERS);
            return users ? JSON.parse(users) : [];
        } catch (e) {
            return [];
        }
    },

    getUser: (userId: string): User | undefined => {
        const users = storageService.getUsers();
        return users.find(u => u.id === userId);
    },

    saveUser: (user: User) => {
        try {
            const users = storageService.getUsers();
            const existingIndex = users.findIndex(u => u.id === user.id || u.email.toLowerCase().trim() === user.email.toLowerCase().trim());

            if (existingIndex >= 0) {
                const existing = users[existingIndex];
                users[existingIndex] = { ...existing, ...user, preferences: { ...existing.preferences, ...user.preferences }, friends: user.friends || existing.friends, teamChat: user.teamChat || existing.teamChat };
            } else {
                users.push(user);
            }
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

            const session = storageService.getSession();
            if (session && (session.id === user.id || session.email === user.email)) {
                localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(users[existingIndex >= 0 ? existingIndex : users.length - 1]));
            }
        } catch (e) { }
    },

    login: (email: string, password?: string): User | null => {
        const cleanEmail = email.toLowerCase().trim();
        const users = storageService.getUsers();
        const user = users.find(u => u.email.toLowerCase().trim() === cleanEmail);
        if (user && (!password || user.password === password)) {
            // Init token start date if missing
            if (!user.tokenWeekStart) {
                user.tokenWeekStart = Backend.tokens._getCurrentWeekStart();
                user.tokens = 10;
            }
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
            return user;
        }
        return null;
    },

    register: (user: User): boolean => {
        const cleanEmail = user.email.toLowerCase().trim();
        const users = storageService.getUsers();
        if (users.some(u => u.email.toLowerCase().trim() === cleanEmail)) return false;

        const finalUser = {
            ...user,
            email: cleanEmail,
            tokens: 10,
            tokenWeekStart: Backend.tokens._getCurrentWeekStart(),
            teamChat: [{
                id: 'init-1',
                senderId: 'system',
                senderName: 'System',
                senderAvatar: '',
                text: 'Welcome to your team channel. Start collaborating!',
                timestamp: new Date(),
                isSystem: true
            }]
        };

        users.push(finalUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(finalUser));

        Backend._saveData(finalUser.id, {
            tasks: [{
                id: 'welcome-task',
                title: 'Explore TaskNovaPro Features',
                completed: false,
                category: 'ADMIN',
                date: new Date(Date.now() + 1000 * 60 * 60),
                duration: 30,
                color: '#f97316',
                priority: 'HIGH',
                statusLabel: 'IN_PROGRESS',
                assignee: 'System'
            }],
            files: [], folders: [], chatSessions: [], clients: [], projects: [], habits: [], infinityItems: []
        });
        return true;
    },

    updatePassword: (email: string, newPassword: string): boolean => {
        const cleanEmail = email.toLowerCase().trim();
        const users = storageService.getUsers();
        const index = users.findIndex(u => u.email.toLowerCase().trim() === cleanEmail);
        if (index === -1) return false;
        users[index].password = newPassword;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return true;
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    },

    getSession: (): User | null => {
        try {
            const session = localStorage.getItem(STORAGE_KEYS.SESSION);
            return session ? JSON.parse(session) : null;
        } catch (e) { return null; }
    },

    getUserData: (userId: string): UserData => {
        const data = Backend._getData(userId);
        const hydrateDates = (obj: any, keys: string[]) => {
            if (!obj) return;
            keys.forEach(key => { if (obj[key]) obj[key] = new Date(obj[key]); });
        };
        data.tasks.forEach((t: any) => hydrateDates(t, ['date']));
        data.files.forEach((f: any) => hydrateDates(f, ['dateModified']));
        data.projects.forEach((p: any) => hydrateDates(p, ['deadline']));
        data.chatSessions.forEach((s: any) => {
            hydrateDates(s, ['lastModified']);
            s.messages.forEach((m: any) => hydrateDates(m, ['timestamp']));
        });
        return data;
    },

    saveUserData: (userId: string, data: Partial<UserData>) => {
        Backend.saveAll(userId, data);
    },

    addFriendConnection: (userId: string, friendEmail: string): { success: boolean; message?: string; friend?: Friend } => {
        const users = storageService.getUsers();
        const currentUserIndex = users.findIndex(u => u.id === userId);
        const friendIndex = users.findIndex(u => u.email.toLowerCase() === friendEmail.toLowerCase().trim());

        if (currentUserIndex === -1) return { success: false, message: "User not found." };
        if (friendIndex === -1) return { success: false, message: "User with this email does not exist." };
        if (users[currentUserIndex].id === users[friendIndex].id) return { success: false, message: "You cannot add yourself." };

        const currentUser = users[currentUserIndex];
        const friendAccount = users[friendIndex];

        if (!currentUser.friends) currentUser.friends = [];
        if (!friendAccount.friends) friendAccount.friends = [];

        if (currentUser.friends.some(f => f.id === friendAccount.id)) return { success: false, message: "Already friends." };

        const newFriendForUser: Friend = { id: friendAccount.id, name: friendAccount.name, email: friendAccount.email, avatar: friendAccount.avatar || "", status: 'OFFLINE', messages: [] };
        const meAsFriend: Friend = { id: currentUser.id, name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar || "", status: 'ONLINE', messages: [] };

        currentUser.friends.push(newFriendForUser);
        friendAccount.friends.push(meAsFriend);

        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        const session = storageService.getSession();
        if (session && session.id === userId) localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));

        return { success: true, friend: newFriendForUser };
    },

    sendDirectMessage: (userId: string, friendId: string, text: string) => {
        const users = storageService.getUsers();
        const currentUserIndex = users.findIndex(u => u.id === userId);
        const friendIndex = users.findIndex(u => u.id === friendId);

        if (currentUserIndex === -1 || friendIndex === -1) return;

        const currentUser = users[currentUserIndex];
        const friendUser = users[friendIndex];

        if (!currentUser.friends) currentUser.friends = [];
        if (!friendUser.friends) friendUser.friends = [];

        const msg: DirectMessage = { id: Date.now().toString(), senderId: userId, text, timestamp: new Date(), status: 'SENT', reactions: [] };

        const friendInMyList = currentUser.friends.find(f => f.id === friendId);
        if (friendInMyList) friendInMyList.messages.push(msg);

        const meInFriendList = friendUser.friends.find(f => f.id === userId);
        if (meInFriendList) meInFriendList.messages.push(msg);

        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        const session = storageService.getSession();
        if (session && session.id === userId) localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
    },

    sendTeamMessage: (userId: string, message: TeamMessage) => {
        const users = storageService.getUsers();
        const currentUserIndex = users.findIndex(u => u.id === userId);

        if (currentUserIndex === -1) return;

        const currentUser = users[currentUserIndex];
        if (!currentUser.teamChat) currentUser.teamChat = [];

        currentUser.teamChat.push(message);

        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        const session = storageService.getSession();
        if (session && session.id === userId) localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
    }
};
