
import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Sparkles, MessageSquare, Image as ImageIcon, X, Plus, Trash2, PanelLeftClose, PanelLeftOpen, StopCircle, Zap, TrendingUp, Lightbulb } from 'lucide-react';
import { Message, ChatSession, User } from '../types';
import { ChatMessage } from './ChatMessage';

interface ChatInterfaceProps {
  user: User | null;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, image?: string) => void;
  onStopGeneration?: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  hideSidebar?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    user, messages, isLoading, onSendMessage, onStopGeneration,
    sessions, currentSessionId, onSelectSession, onCreateSession, onDeleteSession,
    hideSidebar = false
}) => {
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(!hideSidebar); 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, pendingImage]);
  useEffect(() => { inputRef.current?.focus(); }, [currentSessionId, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputText.trim() || pendingImage) && !isLoading) {
      onSendMessage(inputText, pendingImage || undefined);
      setInputText('');
      setPendingImage(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => setPendingImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const suggestions = [
      { icon: <Zap size={16} />, label: "Visual Audit", prompt: "Critique my latest design upload." },
      { icon: <TrendingUp size={16} />, label: "Strategy", prompt: "Give me 3 viral content ideas." },
      { icon: <Sparkles size={16} />, label: "Inspiration", prompt: "I'm feeling uninspired. Help me." },
      { icon: <Lightbulb size={16} />, label: "Scaling", prompt: "How to scale to $10k/month?" },
  ];

  return (
    <div className={`flex h-full w-full relative ${hideSidebar ? '' : 'gap-4'}`}>
      
      {/* Sessions Sidebar */}
      {!hideSidebar && (
          <div className={`hidden md:flex flex-col flex-shrink-0 gap-3 transition-all duration-300 ease-in-out border-r border-border pr-4 ${sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden pr-0 border-none'}`}>
              <div className="flex items-center justify-between mb-2 min-w-[200px] pt-1">
                 <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">History</h2>
                 <button onClick={onCreateSession} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border">
                    <Plus size={16} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-w-[200px] scrollbar-thin">
                 {sessions.sort((a,b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()).map(session => (
                     <div 
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${currentSessionId === session.id ? 'bg-secondary border-border text-foreground' : 'text-muted-foreground border-transparent hover:bg-secondary/50 hover:text-foreground'}`}
                     >
                        <div className="flex items-center gap-2 truncate">
                            <MessageSquare size={14} />
                            <span className="text-sm font-medium truncate">{session.title}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                        </button>
                     </div>
                 ))}
              </div>
          </div>
      )}

      {/* Main Chat Card */}
      <div className={`flex-1 flex flex-col min-w-0 h-full bg-card ${hideSidebar ? '' : 'rounded-2xl border border-border'} relative overflow-hidden shadow-sm`}>
        
        {!hideSidebar && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex absolute top-4 left-4 z-20 p-2 text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur rounded-lg border border-border hover:bg-secondary transition-all">
                {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto w-full">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-4 border border-primary/20 text-primary">
                            <Sparkles size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Hey, {user?.name?.split(' ')[0]}</h2>
                        <p className="text-muted-foreground">What are we creating today?</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        {suggestions.map((s, i) => (
                            <button 
                                key={i} 
                                onClick={() => onSendMessage(s.prompt)}
                                className="p-3 bg-secondary/30 border border-border rounded-xl text-left hover:bg-secondary hover:border-primary/30 transition-all group"
                            >
                                <div className="flex items-center gap-2 mb-1 text-muted-foreground group-hover:text-primary transition-colors">
                                    {s.icon}
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
                                </div>
                                <div className="text-xs text-foreground font-medium">{s.prompt}</div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-secondary px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-border">
                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-100"></span>
                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                </>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-card border-t border-border flex flex-col gap-3 flex-shrink-0">
            {pendingImage && (
                <div className="inline-block relative group self-start">
                    <img src={pendingImage} alt="Preview" className="h-14 w-14 object-cover rounded-lg border border-border" />
                    <button onClick={() => setPendingImage(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-lg"><X size={10} /></button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex gap-2 items-center">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all border border-transparent hover:border-border">
                    <ImageIcon size={20} />
                </button>

                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isLoading ? "Generating response..." : "Ask your mentor..."}
                        className="w-full bg-secondary/50 text-foreground rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all placeholder:text-muted-foreground text-sm font-medium border border-border"
                        disabled={isLoading && !onStopGeneration}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape' && isLoading && onStopGeneration) {
                                e.preventDefault();
                                onStopGeneration();
                            }
                        }}
                    />
                    {isLoading && onStopGeneration ? (
                        <button 
                            type="button" 
                            onClick={onStopGeneration} 
                            className="absolute right-2 top-2 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                        >
                            <StopCircle size={16} />
                        </button>
                    ) : (
                        <button type="submit" disabled={!inputText.trim() && !pendingImage} className="absolute right-2 top-2 p-1.5 rounded-lg bg-primary text-white hover:bg-orange-600 transition-all disabled:opacity-50">
                            <ArrowUp size={16} />
                        </button>
                    )}
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
