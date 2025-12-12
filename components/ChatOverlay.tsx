
import React from 'react';
import { X } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { User, Message, ChatSession } from '../types';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ 
    isOpen, onClose, user, messages, isLoading, onSendMessage, onStopGeneration,
    sessions, currentSessionId, onSelectSession, onCreateSession, onDeleteSession
}) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
          <div className="p-4 border-b border-border flex justify-between items-center bg-card flex-shrink-0">
              <h2 className="text-lg font-bold text-foreground">AI Mentor</h2>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
                  <X size={20} />
              </button>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
              <ChatInterface 
                  user={user}
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={onSendMessage}
                  onStopGeneration={onStopGeneration}
                  sessions={sessions}
                  currentSessionId={currentSessionId}
                  onSelectSession={onSelectSession}
                  onCreateSession={onCreateSession}
                  onDeleteSession={onDeleteSession}
                  hideSidebar={true}
              />
          </div>
      </div>
    </>
  );
};
