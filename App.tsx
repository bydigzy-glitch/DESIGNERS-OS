
import React, { useState, useEffect, useCallback } from 'react';
import { initializeGemini, sendMessageToGemini } from './services/geminiService';
import { ChatInterface } from './components/ChatInterface';
import { Navigation } from './components/Navigation';
import { HQ } from './components/HQ';
import { Apps } from './components/Apps';
import { Calendar } from './components/Calendar';
import { FileManager } from './components/FileManager';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { Message, ViewMode, Task, InspirationLog, FileAsset, Folder, User } from './types';
import { RECOVERY_INSTRUCTION } from './constants';

function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);

  // --- VIEW STATE ---
  const [currentView, setCurrentView] = useState<ViewMode>('HQ');

  // --- DATA STATE ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([
     { id: 'f1', name: 'Client: Nike' },
     { id: 'f2', name: 'Client: Adidas' },
     { id: 'f3', name: 'Brand Assets' }
  ]);
  const [files, setFiles] = useState<FileAsset[]>([
    { id: '1', name: 'TechPack_V4.pdf', type: 'PDF', size: '4.2 MB', dateModified: new Date(), tag: 'Production', folderId: 'f1' },
    { id: '2', name: 'Campaign_001.jpg', type: 'IMAGE', size: '12 MB', dateModified: new Date(), tag: 'Content', folderId: 'f1' },
  ]);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Finish Tech Pack', completed: false, category: 'PRODUCT', date: new Date(), duration: 120, color: 'blue', reminder: 30 },
    { id: '2', title: 'Client Meeting', completed: false, category: 'MEETING', date: new Date(new Date().setHours(14,0)), duration: 60, color: 'purple', reminder: 15 },
  ]);
  const [isDriveConnected, setIsDriveConnected] = useState(false);

  // Initialize Chat
  useEffect(() => {
    try {
      initializeGemini();
      setMessages([]);
    } catch (error) {
      console.error("Initialization Error", error);
    }
  }, []);

  // Reminder Logic
  useEffect(() => {
    if (!user) return;
    
    // Request permission if needed
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.reminder && !task.completed) {
          const reminderTime = new Date(task.date.getTime() - task.reminder * 60000);
          // Check if we are within 1 minute past the reminder time to trigger it
          const diff = now.getTime() - reminderTime.getTime();
          if (diff >= 0 && diff < 60000) {
             new Notification(`Reminder: ${task.title}`, {
               body: `Starts in ${task.reminder} minutes.`,
               icon: '/vite.svg'
             });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [tasks, user]);

  const handleSendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const responseText = await sendMessageToGemini(text);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'model', text: "System Failure.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRecoverySession = async (energyLevel: number) => {
    setCurrentView('CHAT');
    setIsLoading(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: `[SYSTEM TRIGGER]: Energy Level: ${energyLevel}/10.`, timestamp: new Date() }]);
    try {
      const responseText = await sendMessageToGemini(`IMPORTANT: ${RECOVERY_INSTRUCTION.replace('{{ENERGY_LEVEL}}', String(energyLevel))}`);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText, timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  const renderView = () => {
    switch(currentView) {
      case 'HQ':
        return <HQ tasks={tasks} setTasks={setTasks} onStartRecovery={handleRecoverySession} onNavigate={setCurrentView} />;
      case 'APPS':
        return <Apps />;
      case 'FILES':
        return <FileManager files={files} setFiles={setFiles} folders={folders} setFolders={setFolders} isDriveConnected={isDriveConnected} />;
      case 'CALENDAR':
        return <Calendar 
          tasks={tasks} 
          onUpdateTask={t => setTasks(prev => prev.map(pt => pt.id === t.id ? t : pt))} 
          onDeleteTask={id => setTasks(prev => prev.filter(t => t.id !== id))} 
          onChangeColor={(id, c) => setTasks(prev => prev.map(t => t.id === id ? {...t, color: c} : t))} 
          onAddTask={t => setTasks(prev => [...prev, t])} 
          onAddTasks={tl => setTasks(prev => [...prev, ...tl])} 
        />;
      case 'SETTINGS':
        return <Settings user={user} onLogout={() => setUser(null)} onClose={() => setCurrentView('HQ')} onConnectDrive={() => setIsDriveConnected(true)} isDriveConnected={isDriveConnected} />;
      case 'CHAT':
      default:
        return <ChatInterface messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-app-bg text-text-primary">
      <main className="flex-1 overflow-hidden relative flex flex-col pb-24">
         {renderView()}
      </main>
      <Navigation currentView={currentView} onNavigate={setCurrentView} user={user} />
    </div>
  );
}

export default App;
