
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeGemini, sendMessageToGemini, resetGeminiSession, sendToolResponseToGemini } from './services/geminiService';
import { storageService } from './services/storageService';
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
import { LoadingScreen } from './components/common/LoadingScreen';
import { ToastContainer, ToastMessage, ToastType } from './components/common/Toast';
import { Message, ViewMode, Task, FileAsset, Folder, User, ChatSession, Client, Project, Habit, CanvasItem, AppNotification } from './types';
import { RECOVERY_INSTRUCTION } from './constants';

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
    }
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
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const activeRequestRef = useRef(false);

  // --- INITIALIZATION & AUTHENTICATION ---
  useEffect(() => {
      // Simulate loading time for animation
      setTimeout(() => setIsAppLoading(false), 2500);

      // Check version (just updates string, returns false now to stop auto-seed)
      storageService.checkVersion();
      
      // Ensure DUMMY_USER exists ONLY if 'bydigzy@gmail.com' is not present
      const existingUsers = storageService.getUsers();
      const adminExists = existingUsers.some(u => u.email === DUMMY_USER.email);
      
      if (!adminExists) {
          storageService.saveUser(DUMMY_USER);
      }
      
      const sessionUser = storageService.getSession();
      if (sessionUser) {
          // Reload full user object from 'users' DB to get latest avatar/preferences
          const freshUser = storageService.getUser(sessionUser.id);
          setUser(freshUser || sessionUser);
      }

      // Check for App Update
      const lastVersion = localStorage.getItem('app_last_version');
      if (lastVersion !== APP_VERSION) {
          addNotification({
              id: 'sys-update-' + Date.now(),
              title: `System Updated to ${APP_VERSION}`,
              message: 'TaskNovaPro v3.2: Performance Improvements & Persistence Fixes.',
              type: 'SYSTEM',
              timestamp: new Date(),
              read: false
          });
          localStorage.setItem('app_last_version', APP_VERSION);
      }
  }, []);

  const handleLogin = useCallback((loggedInUser: User) => {
      setUser(loggedInUser);
      setCurrentView('HQ'); 
  }, []);

  // --- CROSS-TAB SYNC LISTENER ---
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!user) return;

      // 1. Sync User Data (Tasks, Projects, etc)
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

      // 2. Sync User Profile (Avatar, Preferences)
      if (e.key === 'designpreneur_users' || e.key === 'designpreneur_session') {
         // Reload user list to find current user updates
         const users = storageService.getUsers();
         const updatedUser = users.find(u => u.id === user.id);
         
         if (updatedUser) {
             const avatarChanged = updatedUser.avatar !== user.avatar;
             const nameChanged = updatedUser.name !== user.name;
             const prefsChanged = JSON.stringify(updatedUser.preferences) !== JSON.stringify(user.preferences);
             
             if (avatarChanged || nameChanged || prefsChanged) {
                 setUser(updatedUser);
             }
         }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // --- DATA LOADING ---
  useEffect(() => {
    if (user) {
        try {
            const data = storageService.getUserData(user.id);
            // Only set state if data is present to avoid wiping via empty array (though empty array is valid for new users)
            // storageService ensures it returns empty arrays, not null/undefined
            setFolders(data.folders || []);
            setFiles(data.files || []);
            setTasks(data.tasks || []);
            setClients(data.clients || []);
            setProjects(data.projects || []);
            setChatSessions(data.chatSessions || []);
            const loadedHabits = (data as any).habits || []; 
            setHabits(loadedHabits);
            
            const loadedInfinity = (data as any).infinityItems || [];
            setInfinityItems(loadedInfinity);
            
            if (data.chatSessions && data.chatSessions.length > 0) {
                if (!currentSessionId || !data.chatSessions.find(s => s.id === currentSessionId)) {
                    const sorted = [...data.chatSessions].sort((a,b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
                    setCurrentSessionId(sorted[0].id);
                }
            } else {
                createNewSession(); 
            }
        } catch (e) {
            console.error("Data load error", e);
            addToast('ERROR', 'Failed to load user data.');
        }
    }
  }, [user]);

  // --- NOTIFICATION CHECKER ---
  useEffect(() => {
      if (!user || !user.preferences.notifications) return;
      
      const checkTasks = () => {
          const now = new Date();
          // Check for due tasks today
          const tasksDueSoon = tasks.filter(t => !t.completed && new Date(t.date).toDateString() === now.toDateString());
          
          if (tasksDueSoon.length > 0) {
              const pendingCount = tasksDueSoon.length;
              // Check if we already notified about this today to avoid spam
              const hasNotified = notifications.some(n => 
                  n.title === 'Daily Briefing' && n.timestamp.toDateString() === now.toDateString()
              );

              if (!hasNotified) {
                  addNotification({
                      id: 'task-remind-' + Date.now(),
                      title: 'Daily Briefing',
                      message: `You have ${pendingCount} tasks scheduled for today. Stay focused.`,
                      type: 'INFO',
                      timestamp: new Date(),
                      read: false
                  });
              }
          }
      };
      
      checkTasks();
      // Run check every 30 mins
      const interval = setInterval(checkTasks, 1000 * 60 * 30);
      return () => clearInterval(interval);
  }, [user, tasks]); 

  // --- AUTO-UPDATE PROJECT PROGRESS ---
  useEffect(() => {
     if (projects.length > 0 && tasks.length > 0) {
         let hasChanges = false;
         const updatedProjects = projects.map(p => {
             const linkedTasks = tasks.filter(t => t.projectId === p.id);
             if (linkedTasks.length > 0) {
                 const completed = linkedTasks.filter(t => t.completed).length;
                 const newProgress = Math.round((completed / linkedTasks.length) * 100);
                 if (newProgress !== p.progress) {
                     hasChanges = true;
                     return { ...p, progress: newProgress };
                 }
             }
             return p;
         });
         
         if (hasChanges) {
             setProjects(updatedProjects);
         }
     }
  }, [tasks]);

  // --- DATA SAVING ---
  useEffect(() => {
    if (user && !user.isGuest) { 
        storageService.saveUserData(user.id, {
            tasks,
            files,
            folders,
            clients,
            projects,
            chatSessions,
            habits: habits as any, 
            infinityItems: infinityItems as any
        });
    }
  }, [tasks, files, folders, clients, projects, chatSessions, habits, infinityItems, user]);

  useEffect(() => {
    try {
      // Initialize with existing user memory if available
      initializeGemini(user?.aiMemory || "");
    } catch (error) {
      console.error("Gemini Initialization Error:", error);
      addToast('ERROR', 'Failed to initialize AI services.');
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

  // --- CRUD HANDLERS ---
  const handleTaskCreate = (task: Task) => {
    setTasks(prev => [...prev, task]);
    addToast('SUCCESS', 'Task created successfully');
  };

  const handleTaskUpdate = (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
  };

  const handleTaskDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    addToast('INFO', 'Task deleted');
  };

  const handleProjectCreate = (project: Project) => {
    setProjects(prev => [...prev, project]);
    addToast('SUCCESS', 'Project created');
  };

  const handleProjectUpdate = (project: Project) => {
    setProjects(prev => prev.map(p => p.id === project.id ? project : p));
    addToast('SUCCESS', 'Project updated');
  };

  const handleProjectDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.map(t => t.projectId === id ? { ...t, projectId: undefined } : t));
    addToast('INFO', 'Project deleted');
  };

  const handleClientAdd = (client: Client, newProjects: Partial<Project>[]) => {
      setClients(prev => [...prev, client]);
      if (newProjects.length > 0) {
          const finalProjects = newProjects.map(p => ({
              ...p,
              id: Date.now().toString() + Math.random(),
              clientId: client.id,
              client: client.name
          } as Project));
          setProjects(prev => [...prev, ...finalProjects]);
      }
      addToast('SUCCESS', 'Client added');
  };

  const handleClientUpdate = (client: Client, newProjects: Partial<Project>[]) => {
      setClients(prev => prev.map(c => c.id === client.id ? client : c));
      if (newProjects.length > 0) {
          const finalProjects = newProjects.map(p => ({
              ...p,
              id: Date.now().toString() + Math.random(),
              clientId: client.id,
              client: client.name
          } as Project));
          setProjects(prev => [...prev, ...finalProjects]);
      }
      addToast('SUCCESS', 'Client updated');
  };

  const handleClientDelete = (id: string) => {
      setClients(prev => prev.filter(c => c.id !== id));
      addToast('INFO', 'Client removed');
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
                  const sorted = [...prev].sort((a,b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
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
        resetGeminiSession(); 
        addToast('INFO', 'AI generation stopped.');
    }
  }, [addToast]);

  const handleSendMessage = useCallback(async (text: string, image?: string) => {
    if (!currentSessionId) createNewSession();
    const activeId = currentSessionId || (chatSessions.length > 0 ? chatSessions[0].id : Date.now().toString()); 
    
    let actualActiveId = activeId;
    if (!chatSessions.find(s => s.id === actualActiveId)) {
        createNewSession();
        actualActiveId = chatSessions.length > 0 ? chatSessions[chatSessions.length - 1].id : Date.now().toString(); 
    }

    const userMsg: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        text: text, 
        timestamp: new Date(),
        image: image 
    };

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
    
    try {
      const contextSummary = `
        CURRENT TIME: ${new Date().toLocaleString()}
        TASKS: ${tasks.map(t => `[ID: ${t.id}] ${t.title} (Due: ${new Date(t.date).toLocaleString()}, Status: ${t.statusLabel})`).join('\n')}.
        PROJECTS: ${projects.map(p => p.title).join(', ')}.
        CLIENTS: ${clients.map(c => c.name).join(', ')}.
        HABITS STREAK: ${habits.reduce((acc, h) => acc + h.streak, 0)}.
      `;

      const response = await sendMessageToGemini(text, image, contextSummary, user?.aiMemory);
      let responseText = response.text;

      // Handle AI Tool Calls
      if (response.functionCalls && response.functionCalls.length > 0) {
          for (const call of response.functionCalls) {
              
              if (call.name === 'createTask') {
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
                      setTasks(prev => [...prev, newTask]);
                      addToast('SUCCESS', `Task created: ${newTask.title}`);
                      if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: true, taskId: newTask.id });
                  }
                  else if (args.action === 'UPDATE') {
                      let updated = false;
                      setTasks(prev => prev.map(t => {
                          // Match by ID first, then fuzzy Title
                          if (t.id === args.id || (args.title && t.title.toLowerCase().includes(args.title.toLowerCase()))) {
                              updated = true;
                              return { 
                                  ...t, 
                                  ...args, 
                                  date: args.date ? new Date(args.date) : t.date,
                                  completed: args.status === 'DONE' ? true : (args.status ? false : t.completed),
                                  statusLabel: args.status || t.statusLabel
                              };
                          }
                          return t;
                      }));
                      
                      if (updated) {
                          addToast('SUCCESS', 'Task updated');
                          if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: true });
                      } else {
                          if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: false, error: "Task not found" });
                      }
                  }
                  else if (args.action === 'DELETE') {
                      setTasks(prev => prev.filter(t => t.id !== args.id && (!args.title || !t.title.toLowerCase().includes(args.title.toLowerCase()))));
                      addToast('INFO', 'Task deleted');
                      if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: true });
                  }
              } 
              
              else if (call.name === 'manageClient') {
                  const args = call.args;
                  if (args.action === 'CREATE') {
                      const newClient: Client = {
                          id: Date.now().toString() + Math.random(),
                          name: args.name,
                          email: args.email,
                          status: 'ACTIVE',
                          revenue: 0,
                          notes: args.notes
                      };
                      setClients(prev => [...prev, newClient]);
                      addToast('SUCCESS', `Client added: ${newClient.name}`);
                      if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: true, clientId: newClient.id });
                  }
                  else if (args.action === 'UPDATE') {
                      // Simple logic to find by name if ID not provided (AI usually matches names)
                      const target = clients.find(c => c.name.toLowerCase() === args.name.toLowerCase());
                      if (target) {
                          setClients(prev => prev.map(c => c.id === target.id ? { ...c, ...args } : c));
                          addToast('SUCCESS', `Client updated: ${target.name}`);
                          if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: true });
                      } else {
                          if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: false, error: "Client not found" });
                      }
                  }
              }

              else if (call.name === 'manageProject') {
                  const args = call.args;
                  if (args.action === 'CREATE') {
                      const newProject: Project = {
                          id: Date.now().toString() + Math.random(),
                          title: args.title,
                          client: args.clientName || 'Unassigned',
                          status: 'ACTIVE',
                          progress: 0,
                          color: '#6366f1',
                          tags: [],
                          price: args.price || 0
                      };
                      setProjects(prev => [...prev, newProject]);
                      addToast('SUCCESS', `Project added: ${newProject.title}`);
                      if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: true, projectId: newProject.id });
                  }
                  else if (args.action === 'UPDATE') {
                      const target = projects.find(p => p.title.toLowerCase() === args.title.toLowerCase());
                      if (target) {
                          setProjects(prev => prev.map(p => p.id === target.id ? { ...p, ...args } : p));
                          addToast('SUCCESS', `Project updated: ${target.title}`);
                          if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: true });
                      } else {
                          if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: false, error: "Project not found" });
                      }
                  }
              }

              else if (call.name === 'updateMemory' && user) {
                  const args = call.args;
                  const newMemory = (user.aiMemory || "") + "\n- " + args.memory;
                  const updatedUser = { ...user, aiMemory: newMemory };
                  setUser(updatedUser);
                  storageService.saveUser(updatedUser);
                  addToast('SUCCESS', 'AI Memory Updated');
                  if (activeRequestRef.current) await sendToolResponseToGemini(call.name, call.id, { success: true });
              }
          }
      }
      
      if (activeRequestRef.current) {
          // If tool calls happened, we might get a second response from the model
          // But for simplicity in this structure, we just ensure the loop finishes or we append the final text if any
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
      if (activeRequestRef.current) {
          setIsLoading(false);
          activeRequestRef.current = false;
      }
    }
  }, [currentSessionId, createNewSession, chatSessions, addToast, tasks, projects, clients, habits, user]);

  const handleRecoverySession = async (energyLevel: number) => {
    setIsChatOverlayOpen(true); // Open sidebar
    const recoveryId = Date.now().toString();
    const startMsg: Message = { id: Date.now().toString(), role: 'user', text: `[SYSTEM TRIGGER]: Energy Level: ${energyLevel}/10.`, timestamp: new Date() };
    setChatSessions(prev => [...prev, {
        id: recoveryId,
        title: 'System Recovery',
        messages: [startMsg],
        lastModified: new Date()
    }]);
    setCurrentSessionId(recoveryId);
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
    switch(currentView) {
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
        return <Apps items={infinityItems} setItems={setInfinityItems} />;
      case 'FILES':
        return <FileManager files={files} setFiles={setFiles} folders={folders} setFolders={setFolders} clients={clients} isDriveConnected={isDriveConnected} />;
      case 'CALENDAR':
        return <Calendar 
          tasks={tasks} 
          onUpdateTask={handleTaskUpdate}
          onDeleteTask={handleTaskDelete} 
          onChangeColor={(id, c) => setTasks(prev => prev.map(t => t.id === id ? {...t, color: c} : t))} 
          onAddTask={handleTaskCreate} 
          onAddTasks={(tl) => {
             setTasks(prev => [...prev, ...tl]);
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
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            sessions={chatSessions}
            currentSessionId={currentSessionId}
            onSelectSession={setCurrentSessionId}
            onCreateSession={createNewSession}
            onDeleteSession={deleteSession}
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
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            sessions={chatSessions}
            currentSessionId={currentSessionId}
            onSelectSession={setCurrentSessionId}
            onCreateSession={createNewSession}
            onDeleteSession={deleteSession}
            />
        </main>
    </div>
  );
}

export default App;
