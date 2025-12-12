

import { User, Task, FileAsset, Folder, ChatSession, Client, Project, Habit, CanvasItem, Friend, DirectMessage } from '../types';

const STORAGE_KEYS = {
  VERSION: 'designpreneur_version',
  USERS: 'designpreneur_users',
  SESSION: 'designpreneur_session',
  DATA_PREFIX: 'designpreneur_data_',
};

const CURRENT_VERSION = 'v3.2'; // Bumped version

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

export const storageService = {
  // --- VERSION CONTROL ---
  checkVersion: (): boolean => {
      const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (storedVersion !== CURRENT_VERSION) {
          localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
      }
      return false; 
  },

  // --- AUTHENTICATION ---
  
  getUsers: (): User[] => {
    try {
      const users = localStorage.getItem(STORAGE_KEYS.USERS);
      return users ? JSON.parse(users) : [];
    } catch (e) {
      console.warn("Storage access failed", e);
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
        // Merge existing user with new data to prevent data loss.
        // We prioritize existing data for critical fields if 'user' argument is partial.
        const existing = users[existingIndex];
        users[existingIndex] = { 
            ...existing, 
            ...user, 
            // Deep merge preferences
            preferences: { ...existing.preferences, ...user.preferences },
            // Ensure friends are preserved if not passed
            friends: user.friends || existing.friends
        };
      } else {
        users.push(user);
      }
      
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Update session if it's the current user
      const session = storageService.getSession();
      if (session && (session.id === user.id || session.email === user.email)) {
          // Use the FULL merged user object
          localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(users[existingIndex >= 0 ? existingIndex : users.length - 1]));
      }
    } catch (e) {
      console.warn("Failed to save user", e);
    }
  },

  login: (email: string, password?: string): User | null => {
    const cleanEmail = email.toLowerCase().trim();
    const users = storageService.getUsers();
    const user = users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    
    if (user) {
        if (!password || user.password === password) {
            try {
              localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
            } catch (e) { console.warn("Session save failed", e); }
            return user;
        }
    }
    return null;
  },

  register: (user: User): boolean => {
    const cleanEmail = user.email.toLowerCase().trim();
    const users = storageService.getUsers();
    
    if (users.some(u => u.email.toLowerCase().trim() === cleanEmail)) {
      return false;
    }
    
    const finalUser = { ...user, email: cleanEmail };
    
    users.push(finalUser);
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(finalUser));
    } catch (e) {
      console.warn("Register save failed", e);
      return false;
    }
    
    // Seed Data for NEW users only
    const welcomeTask: Task = {
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
    };
    
    storageService.saveUserData(finalUser.id, { 
        tasks: [welcomeTask], 
        files: [], 
        folders: [],
        chatSessions: [],
        clients: [],
        projects: [],
        habits: [],
        infinityItems: []
    });
    
    return true;
  },

  updatePassword: (email: string, newPassword: string): boolean => {
    const cleanEmail = email.toLowerCase().trim();
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.email.toLowerCase().trim() === cleanEmail);
    
    if (index === -1) return false;

    users[index].password = newPassword;
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch(e) { console.warn("Password save failed", e); return false; }
    return true;
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch(e) { console.warn("Logout failed", e); }
  },

  getSession: (): User | null => {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      return session ? JSON.parse(session) : null;
    } catch(e) {
      return null;
    }
  },

  // --- DATA PERSISTENCE ---

  getUserData: (userId: string): UserData => {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.DATA_PREFIX}${userId}`);
      if (data) {
          try {
              const parsed = JSON.parse(data);
              const hydrateDates = (obj: any, keys: string[]) => {
                  if (!obj) return;
                  keys.forEach(key => {
                      if (obj[key]) obj[key] = new Date(obj[key]);
                  });
              };

              if (parsed.tasks) parsed.tasks.forEach((t: any) => hydrateDates(t, ['date']));
              if (parsed.files) parsed.files.forEach((f: any) => hydrateDates(f, ['dateModified']));
              if (parsed.projects) parsed.projects.forEach((p: any) => hydrateDates(p, ['deadline']));
              if (parsed.chatSessions) {
                  parsed.chatSessions.forEach((s: any) => {
                      hydrateDates(s, ['lastModified']);
                      s.messages.forEach((m: any) => hydrateDates(m, ['timestamp']));
                  });
              }
              
              return { 
                  tasks: parsed.tasks || [], 
                  files: parsed.files || [], 
                  folders: parsed.folders || [],
                  chatSessions: parsed.chatSessions || [],
                  clients: parsed.clients || [],
                  projects: parsed.projects || [],
                  habits: parsed.habits || [],
                  infinityItems: parsed.infinityItems || []
              };
          } catch (e) {
              console.error("Data parse error", e);
              // Fallback to empty if parse fails, but we prefer not to crash
              return { tasks: [], files: [], folders: [], chatSessions: [], clients: [], projects: [], habits: [], infinityItems: [] };
          }
      }
    } catch (e) {
      console.warn("Data load failed", e);
    }
    return { tasks: [], files: [], folders: [], chatSessions: [], clients: [], projects: [], habits: [], infinityItems: [] };
  },

  saveUserData: (userId: string, data: Partial<UserData>) => {
    try {
      const current = storageService.getUserData(userId);
      const updated = { ...current, ...data };
      localStorage.setItem(`${STORAGE_KEYS.DATA_PREFIX}${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn("Save user data failed", e);
    }
  },

  // --- SOCIAL FEATURES ---

  addFriendConnection: (userId: string, friendEmail: string): { success: boolean; message?: string; friend?: Friend } => {
    const users = storageService.getUsers();
    const currentUserIndex = users.findIndex(u => u.id === userId);
    const friendIndex = users.findIndex(u => u.email.toLowerCase() === friendEmail.toLowerCase().trim());

    if (currentUserIndex === -1) return { success: false, message: "User not found." };
    if (friendIndex === -1) return { success: false, message: "User with this email does not exist." };
    if (users[currentUserIndex].id === users[friendIndex].id) return { success: false, message: "You cannot add yourself." };

    const currentUser = users[currentUserIndex];
    const friendAccount = users[friendIndex];

    // Initialize friends array if missing
    if (!currentUser.friends) currentUser.friends = [];
    if (!friendAccount.friends) friendAccount.friends = [];

    // Check if already friends
    if (currentUser.friends.some(f => f.id === friendAccount.id)) {
        return { success: false, message: "Already friends." };
    }

    // Create Friend objects
    const newFriendForUser: Friend = {
        id: friendAccount.id,
        name: friendAccount.name,
        email: friendAccount.email,
        avatar: friendAccount.avatar || "",
        status: 'OFFLINE', // Default
        messages: []
    };

    const meAsFriend: Friend = {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar || "",
        status: 'ONLINE',
        messages: []
    };

    // Update both users
    currentUser.friends.push(newFriendForUser);
    friendAccount.friends.push(meAsFriend);

    // Save back to storage
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Update session if needed
    const session = storageService.getSession();
    if (session && session.id === userId) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
    }

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

    const msg: DirectMessage = {
        id: Date.now().toString(),
        senderId: userId,
        text,
        timestamp: new Date(),
        status: 'SENT',
        reactions: []
    };

    // Add to current user's view of the chat
    const friendInMyList = currentUser.friends.find(f => f.id === friendId);
    if (friendInMyList) {
        friendInMyList.messages.push(msg);
    }

    // Add to friend's view of the chat
    const meInFriendList = friendUser.friends.find(f => f.id === userId);
    if (meInFriendList) {
        meInFriendList.messages.push(msg);
    }

    // Save
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Update session
    const session = storageService.getSession();
    if (session && session.id === userId) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
    }
  }
};