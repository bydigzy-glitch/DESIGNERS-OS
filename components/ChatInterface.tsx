
import React, { useRef, useEffect, useState } from 'react';
import { Send, Sparkles, Bot, AtSign, X, Paperclip, Loader2 } from 'lucide-react';
import { Message, ChatSession, User, Task } from '../types';
import { ChatMessage } from './ChatMessage';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GradientGlobe } from '@/components/ui/GradientGlobe';

interface ChatInterfaceProps {
  // ... existing interface ...
  user: User | null;
  messages: Message[];
  isLoading: boolean;
  loadingStep?: string;
  onSendMessage: (text: string, image?: string, isIgnite?: boolean, mentionedTaskIds?: string[]) => void;
  onStopGeneration?: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  hideSidebar?: boolean;
  overlayMode?: boolean;
  tasks?: Task[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  user, messages, isLoading, loadingStep, onSendMessage, onStopGeneration,
  sessions, currentSessionId, onSelectSession, onCreateSession, onDeleteSession,
  hideSidebar = false, overlayMode = false, tasks = []
}) => {
  // ... existing state ...
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isIgniteMode, setIsIgniteMode] = useState(false);

  // @ Mention State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionedTasks, setMentionedTasks] = useState<Task[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentSessionId]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((inputText.trim() || pendingImage) && !isLoading) {
      const taskIds = mentionedTasks.map(t => t.id);
      onSendMessage(inputText, pendingImage || undefined, isIgniteMode, taskIds);
      setInputText('');
      setPendingImage(null);
      setMentionedTasks([]);
      setShowMentions(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart;
    setInputText(value);
    setCursorPosition(cursor);

    // Detect @ mention
    const textBeforeCursor = value.substring(0, cursor);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space after @ (which would end the mention)
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleSelectMention = (task: Task) => {
    const textBeforeCursor = inputText.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const before = inputText.substring(0, lastAtIndex);
      const after = inputText.substring(cursorPosition);
      const taskMention = `@${task.title}`;

      setInputText(`${before}${taskMention} ${after}`);
      setMentionedTasks(prev => [...prev, task]);
      setShowMentions(false);
      setMentionQuery('');

      setTimeout(() => {
        inputRef.current?.focus();
        const newPosition = (before + taskMention + ' ').length;
        inputRef.current?.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const removeMentionedTask = (taskId: string) => {
    setMentionedTasks(prev => prev.filter(t => t.id !== taskId));
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

  // Filter tasks for mentions
  const filteredTasks = tasks
    .filter(t => !t.completed && t.title.toLowerCase().includes(mentionQuery.toLowerCase()))
    .slice(0, 5);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputText]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full w-full bg-background">

        {/* Minimal Header - Only show when there are messages */}
        {messages.length > 0 && (
          <div className="flex-shrink-0 border-b border-border/50 px-6 py-3 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <GradientGlobe size={32} />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
                  <p className="text-xs text-muted-foreground">
                    {isIgniteMode ? 'Ignite Mode Active' : 'Standard Mode'}
                  </p>
                </div>
              </div>

              {/* Ignite Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isIgniteMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsIgniteMode(!isIgniteMode)}
                    className="gap-2"
                  >
                    {isIgniteMode ? (
                      <GradientGlobe size={16} />
                    ) : (
                      <Sparkles size={14} className="" />
                    )}
                    <span className="hidden sm:inline">Ignite</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Ignite Mode - Enhanced AI capabilities</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 md:px-6">
          <div className="max-w-4xl mx-auto py-8 space-y-6">
            {messages.length === 0 ? (
              // Empty State - Centered and Minimal
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-center">
                  <GradientGlobe size={80} />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">How can I help you today?</h1>
                  <p className="text-muted-foreground max-w-md">
                    Ask me anything, or use <Badge variant="secondary" className="mx-1">@</Badge> to reference your tasks
                  </p>
                </div>


                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-8">
                  {[
                    'Review my tasks for today',
                    'Help me plan this week',
                    'Analyze my productivity',
                    'Create a new project plan'
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => onSendMessage(prompt, undefined, isIgniteMode, [])}
                      className="p-4 text-left bg-card hover:bg-accent border border-border rounded-xl transition-all hover:shadow-md group"
                    >
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={msg.id || idx}
                    message={msg}
                    isLatest={!isLoading && idx === messages.length - 1 && msg.role === 'model'}
                  />
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border/50 animate-in fade-in slide-in-from-bottom-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {loadingStep || "Thinking..."}
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-3">

            {/* Mentioned Tasks Pills */}
            {mentionedTasks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mentionedTasks.map(task => (
                  <Badge key={task.id} variant="secondary" className="gap-2 pr-1">
                    <AtSign size={12} />
                    <span className="text-xs">{task.title}</span>
                    <button
                      onClick={() => removeMentionedTask(task.id)}
                      className="ml-1 hover:bg-background rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Image Preview */}
            {pendingImage && (
              <div className="relative inline-block">
                <img src={pendingImage} alt="Upload preview" className="h-20 rounded-lg border border-border" />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                >
                  <X size={14} />
                </Button>
              </div>
            )}

            {/* Mention Suggestions */}
            {showMentions && filteredTasks.length > 0 && (
              <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="p-2 text-xs font-medium text-muted-foreground bg-muted/50">
                  Select a task to mention
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => handleSelectMention(task)}
                      className="w-full px-4 py-2.5 text-left hover:bg-accent transition-colors flex items-center gap-3 group"
                    >
                      <div className={`w-2 h-2 rounded-full ${task.priority === 'HIGH' ? 'bg-red-500' :
                        task.priority === 'MEDIUM' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors flex-1 truncate">
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative w-full">
              {/* New Gradient Border Container */}
              <div className="relative flex w-full flex-col overflow-hidden rounded-[16px] p-[1.5px]">
                {/* Gradient Background Layer - Themed */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-muted to-muted/20 pointer-events-none" />

                {/* Bloom Effect - Themed */}
                <div className="absolute -left-[10px] -top-[10px] h-[30px] w-[30px] blur-[1px] bg-[radial-gradient(ellipse_at_center,var(--primary),rgba(255,255,255,0.1),transparent_70%)] pointer-events-none opacity-50" />

                {/* Inner Content - Glassy */}
                <div className="relative flex w-full flex-col overflow-hidden rounded-[15px] bg-background/60 backdrop-blur-md">

                  {/* Textarea Wrapper */}
                  <div className="relative flex w-full">
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
                      placeholder={`Message AI... (use @ to mention tasks)`}
                      className="w-full resize-none border-none bg-transparent px-4 py-3 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground placeholder:transition-all placeholder:duration-300 focus:placeholder:text-foreground/50 min-h-[50px] max-h-[200px] scrollbar-hide"
                      rows={1}
                    />
                  </div>

                  {/* Options Wrapper - Buttons */}
                  <div className="flex items-end justify-between p-2.5">
                    <div className="flex gap-2">
                      {/* Attach Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center text-muted-foreground hover:text-foreground hover:-translate-y-1 transition-all duration-300 p-1"
                          >
                            <Paperclip size={20} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Attach image</p>
                        </TooltipContent>
                      </Tooltip>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>

                    {/* Submit Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="submit"
                          disabled={(!inputText.trim() && !pendingImage) || isLoading}
                          className="group relative flex items-center justify-center rounded-[10px] bg-gradient-to-t from-primary via-primary/80 to-primary p-[2px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] active:scale-95 transition-all duration-150 border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                          <div className="rounded-[8px] bg-black/10 p-1.5 backdrop-blur-[3px] text-primary-foreground/90 group-hover:text-white transition-colors duration-300 flex items-center justify-center">
                            <Send size={18} className="transition-all duration-300 group-focus:scale-110 group-focus:-translate-x-0.5 group-focus:translate-y-0.5 group-focus:rotate-45" />
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Send message (Enter)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Helper Text */}
              <div className="flex items-center justify-between mt-2 px-2">
                <p className="text-xs text-muted-foreground">
                  {isIgniteMode ? (
                    <span className="text-primary flex items-center gap-1">
                      <Sparkles size={10} className="fill-current" />
                      Ignite Mode: Enhanced capabilities
                    </span>
                  ) : (
                    'Press @ to mention tasks'
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Shift + Enter for new line
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};