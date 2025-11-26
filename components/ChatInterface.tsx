
import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Sparkles, MessageSquare, Zap } from 'lucide-react';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
}

const SUGGESTED_PROMPTS = [
  { label: "Critique my brand", prompt: "Critique my clothing brand concept. Be harsh." },
  { label: "Viral Content Ideas", prompt: "Give me 5 viral TikTok ideas for a streetwear drop." },
  { label: "Sourcing Blanks", prompt: "Where do I find heavyweight 450GSM hoodies?" },
  { label: "Pre-order Strategy", prompt: "How do I structure a pre-order campaign to avoid inventory risk?" }
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [loadingText, setLoadingText] = useState('Hold on...');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle phased loading text
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isLoading) {
      setLoadingText('Hold on...');
      timeout = setTimeout(() => {
        setLoadingText('Ready, just a moment...');
      }, 1500); // Switch text after 1.5s
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleSuggestionClick = (prompt: string) => {
      onSendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-6 md:p-8 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h2 className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-1">AI Mentor</h2>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Designpreneur Brain
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-card-bg border border-gray-800 flex items-center justify-center">
            <MessageSquare size={20} className="text-accent-blue" />
        </div>
      </div>

      {/* Chat Card */}
      <div className="flex-1 bg-card-bg rounded-4xl border border-gray-800 overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            
            {messages.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
                    <div className="text-center mb-10 max-w-lg mx-auto">
                        <div className="inline-flex items-center justify-center p-4 rounded-full bg-gray-800/50 mb-6 border border-white/5 shadow-2xl">
                             <Sparkles size={24} className="text-accent-blue" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">How can I assist you today?</h2>
                        <p className="text-gray-400">
                           I'm here to help with art direction, brand strategy, manufacturing, and content scaling.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mx-auto">
                        {SUGGESTED_PROMPTS.map((item, idx) => (
                            <button 
                                key={idx}
                                onClick={() => handleSuggestionClick(item.prompt)}
                                className="p-4 bg-app-bg border border-gray-800 rounded-2xl hover:border-accent-blue/50 hover:bg-gray-900 transition-all text-left group flex items-start gap-3"
                            >
                                <div className="mt-1 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-blue group-hover:text-white transition-colors">
                                    <Zap size={12} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white mb-0.5 group-hover:text-accent-blue transition-colors">{item.label}</div>
                                    <div className="text-xs text-gray-500 line-clamp-1">{item.prompt}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                 </div>
            ) : (
                <>
                    {messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} />
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-app-bg border border-gray-800 rounded-3xl rounded-tl-none p-4 flex items-center gap-4 min-w-[200px]">
                                {/* Looping L Animation */}
                                <div className="relative w-6 h-6">
                                <svg viewBox="0 0 24 24" className="w-full h-full animate-spin text-accent-blue" style={{ animationDuration: '1.5s' }}>
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20" fillOpacity="0" />
                                </svg>
                                </div>
                                <span className="text-sm font-bold text-gray-400 animate-pulse">
                                {loadingText}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card-bg border-t border-gray-800">
            <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask specific questions..."
                    disabled={isLoading}
                    className="w-full bg-app-bg text-white border border-gray-800 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all placeholder:text-gray-600 shadow-inner text-base"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className={`absolute right-2 top-2 p-2 rounded-full transition-all duration-200 ${
                    !inputText.trim() || isLoading 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : 'bg-accent-blue text-white hover:bg-blue-600 shadow-lg shadow-blue-900/30'
                    }`}
                >
                    <ArrowUp size={20} />
                </button>
            </form>
        </div>

      </div>
    </div>
  );
};
