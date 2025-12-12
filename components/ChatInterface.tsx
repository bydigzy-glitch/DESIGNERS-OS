
import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Sparkles, MessageSquare, Image as ImageIcon, X, Plus, Trash2, PanelLeftClose, PanelLeftOpen, StopCircle, Zap, TrendingUp, Lightbulb, Paperclip, MoreHorizontal, Bot, ChevronDown, Flame, CheckCircle2, Search } from 'lucide-react';
import { Message, ChatSession, User, Task } from '../types';
import { ChatMessage } from './ChatMessage';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInterfaceProps {
  user: User | null;
  messages: Message[];
  isLoading: boolean;
  loadingStep?: string; // New prop for Ignite thinking steps
  onSendMessage: (text: string, image?: string, isIgnite?: boolean, mentionedTaskIds?: string[]) => void;
  onStopGeneration?: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  hideSidebar?: boolean;
  overlayMode?: boolean; // New prop to force drawer behavior
  tasks?: Task[]; // Added tasks for mentions
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    user, messages, isLoading, loadingStep, onSendMessage, onStopGeneration,
    sessions, currentSessionId, onSelectSession, onCreateSession, onDeleteSession,
    hideSidebar = false, overlayMode = false, tasks = []
}) => {
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(!hideSidebar); 
  const [isIgniteMode, setIsIgniteMode] = useState(false);
  
  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1); // Where the @ started
  const [mentionedTaskIds, setMentionedTaskIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const centerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, pendingImage, loadingStep]);
  
  // Focus appropriate input based on state
  useEffect(() => { 
      if (messages.length === 0) {
          centerInputRef.current?.focus();
      } else {
          inputRef.current?.focus(); 
      }
  }, [currentSessionId, isLoading, messages.length]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((inputText.trim() || pendingImage) && !isLoading) {
      onSendMessage(inputText, pendingImage || undefined, isIgniteMode, mentionedTaskIds);
      setInputText('');
      setPendingImage(null);
      setMentionedTaskIds([]);
      // Ensure focus remains on input
      if (messages.length > 0) {
          setTimeout(() => inputRef.current?.focus(), 10);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const val = e.target.value;
      setInputText(val);

      // Simple detection for @ mention
      const lastChar = val.slice(-1);
      if (lastChar === '@') {
          setMentionQuery('');
          setMentionIndex(val.length - 1);
      } else if (mentionQuery !== null) {
          // If we are in mention mode, update query
          const query = val.slice(mentionIndex + 1);
          if (query.includes(' ')) {
              setMentionQuery(null); // Stop mentioning if space
          } else {
              setMentionQuery(query);
          }
      }
  };

  const handleSelectMention = (task: Task) => {
      if (mentionIndex !== -1) {
          const before = inputText.slice(0, mentionIndex);
          const after = inputText.slice(mentionIndex + (mentionQuery?.length || 0) + 1); // +1 for @
          const newTaskRef = `@[${task.title}]`;
          setInputText(`${before}${newTaskRef} ${after}`);
          setMentionedTaskIds(prev => [...prev, task.id]);
          setMentionQuery(null);
          setMentionIndex(-1);
          inputRef.current?.focus();
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPendingImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter tasks for mention
  const filteredTasks = mentionQuery !== null 
      ? tasks.filter(t => t.title.toLowerCase().includes(mentionQuery.toLowerCase()) && !t.completed).slice(0, 5)
      : [];

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">
      
      {/* SIDEBAR (Desktop / Collapsible) */}
      {!hideSidebar && (
        <div 
          className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-card border-r border-border transition-all duration-300 flex flex-col overflow-hidden flex-shrink-0`}
        >
          <div className="p-4 border-b border-border flex justify-between items-center whitespace-nowrap">
            <h2 className="font-bold text-foreground">Chats</h2>
            <button onClick={onCreateSession} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {sessions.map(session => (
               <div 
                 key={session.id}
                 onClick={() => onSelectSession(session.id)}
                 className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${currentSessionId === session.id ? 'bg-secondary text-foreground' : 'hover:bg-secondary/50 text-muted-foreground'}`}
               >
                 <MessageSquare size={16} className="flex-shrink-0" />
                 <div className="flex-1 truncate text-sm font-medium">
                   {session.title || 'New Chat'}
                 </div>
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-all"
                 >
                   <Trash2 size={14} />
                 </button>
               </div>
             ))}
          </div>
        </div>
      )}
      
      {/* Toggle Sidebar Button (Overlay over content if hidden sidebar) */}
      {!hideSidebar && !sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 p-2 bg-card border border-border rounded-lg shadow-sm text-muted-foreground hover:text-foreground"
          >
             <PanelLeftOpen size={20} />
          </button>
      )}

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
          
          {/* Header (optional if needed context) */}
          {!hideSidebar && sidebarOpen && (
             <div className="absolute top-4 left-4 z-10">
               <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground">
                   <PanelLeftClose size={20} />
               </button>
             </div>
          )}

          {/* MESSAGES LIST */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-border">
              {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-2xl mx-auto opacity-0 animate-in fade-in zoom-in-95 duration-500 delay-100 fill-mode-forwards" style={{ opacity: 1 }}>
                      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-glow text-primary">
                          <Bot size={40} />
                      </div>
                      <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">How can I help you execute today?</h2>
                      <p className="text-muted-foreground text-lg mb-8 max-w-md leading-relaxed">I'm here to act as your Art Director, Strategist, and Manager.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                          {[
                              { label: 'Critique this design', icon: <ImageIcon size={16} /> },
                              { label: 'Plan my week', icon: <TrendingUp size={16} /> },
                              { label: 'Generate content ideas', icon: <Lightbulb size={16} /> },
                              { label: 'Review my tasks', icon: <CheckCircle2 size={16} /> }
                          ].map((suggestion, i) => (
                              <button 
                                key={i}
                                onClick={() => onSendMessage(suggestion.label, undefined, isIgniteMode, [])}
                                className="p-4 bg-card border border-border hover:border-primary/50 hover:bg-secondary/50 rounded-xl text-left transition-all group flex items-center gap-3"
                              >
                                  <div className="p-2 bg-secondary rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                                      {suggestion.icon}
                                  </div>
                                  <span className="text-sm font-medium text-foreground">{suggestion.label}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              ) : (
                  <>
                    {messages.map((msg, idx) => (
                        <ChatMessage key={msg.id || idx} message={msg} />
                    ))}
                    {isLoading && (
                        <div className="flex w-full justify-center mb-4">
                            <div className="bg-card border border-border px-6 py-4 rounded-2xl shadow-lg flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="relative w-5 h-5">
                                    <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <span className="text-sm font-medium text-foreground animate-pulse">
                                    {loadingStep || "Thinking..."}
                                </span>
                                {onStopGeneration && (
                                    <button onClick={onStopGeneration} className="ml-2 p-1 hover:bg-secondary rounded text-muted-foreground hover:text-red-500 transition-colors" title="Stop">
                                        <StopCircle size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
              )}
          </div>

          {/* INPUT AREA */}
          <div className="p-4 md:p-6 pt-0 bg-background/50 backdrop-blur-sm z-20">
              <div className="max-w-3xl mx-auto relative">
                  
                  {/* Mention Dropdown */}
                  {mentionQuery !== null && filteredTasks.length > 0 && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-30">
                          <div className="p-2 text-xs font-bold text-muted-foreground uppercase bg-secondary/30">Select Task</div>
                          {filteredTasks.map(t => (
                              <button
                                key={t.id}
                                onClick={() => handleSelectMention(t)}
                                className="w-full text-left px-4 py-3 hover:bg-secondary text-sm flex items-center gap-2 transition-colors"
                              >
                                  <div className={`w-2 h-2 rounded-full ${t.priority === 'HIGH' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                  <span className="truncate">{t.title}</span>
                              </button>
                          ))}
                      </div>
                  )}

                  {/* Image Preview */}
                  {pendingImage && (
                      <div className="absolute bottom-full left-0 mb-4 p-2 bg-card border border-border rounded-xl shadow-lg flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
                          <img src={pendingImage} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
                          <button 
                            onClick={() => setPendingImage(null)}
                            className="p-1 bg-secondary rounded-full hover:bg-red-500 hover:text-white transition-colors"
                          >
                              <X size={14} />
                          </button>
                      </div>
                  )}

                  <form 
                    onSubmit={handleSubmit}
                    className={`
                        relative bg-card border rounded-3xl shadow-lg transition-all duration-300
                        ${isIgniteMode 
                            ? 'border-orange-500 shadow-orange-500/10 ring-1 ring-orange-500/20' 
                            : 'border-border focus-within:border-foreground/20'
                        }
                    `}
                  >
                      {/* Ignite Toggle */}
                      <div className="absolute -top-10 left-0 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsIgniteMode(!isIgniteMode)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                                ${isIgniteMode 
                                    ? 'bg-orange-500 text-white border-orange-600 shadow-glow' 
                                    : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'
                                }
                            `}
                          >
                              <Flame size={12} fill={isIgniteMode ? "currentColor" : "none"} />
                              Ignite Mode {isIgniteMode ? 'ON' : 'OFF'}
                          </button>
                          {isIgniteMode && <span className="text-[10px] text-orange-500 font-medium animate-pulse">Super Agent Active</span>}
                      </div>

                      <div className="flex items-end p-2 pr-4">
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-2xl transition-colors flex-shrink-0"
                            title="Upload Image"
                          >
                              <Paperclip size={20} />
                          </button>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                          />

                          <textarea
                            ref={inputRef}
                            value={inputText}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder={isIgniteMode ? "Ignite Command... (e.g. 'Create a task for...')" : "Ask anything or type @ to link a task..."}
                            className="flex-1 max-h-40 min-h-[50px] py-3 px-2 bg-transparent border-none focus:ring-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 scrollbar-hide"
                            rows={1}
                            style={{ height: 'auto', minHeight: '50px' }}
                          />

                          <button
                            type="submit"
                            disabled={!inputText.trim() && !pendingImage || isLoading}
                            className={`
                                p-3 rounded-2xl transition-all flex-shrink-0 mb-1 ml-2
                                ${(inputText.trim() || pendingImage) && !isLoading
                                    ? isIgniteMode ? 'bg-orange-500 text-white shadow-glow hover:bg-orange-600' : 'bg-primary text-white shadow-glow hover:bg-primary/90' 
                                    : 'bg-secondary text-muted-foreground cursor-not-allowed'
                                }
                            `}
                          >
                              <ArrowUp size={20} strokeWidth={3} />
                          </button>
                      </div>
                  </form>
                  
                  <div className="text-center mt-3 text-[10px] text-muted-foreground">
                      {isIgniteMode ? (
                          <span className="text-orange-500 flex items-center justify-center gap-1">
                              <Zap size={10} fill="currentColor" /> Costs {0.6} tokens per request.
                          </span>
                      ) : (
                          <span>AI can make mistakes. Check important info.</span>
                      )}
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};