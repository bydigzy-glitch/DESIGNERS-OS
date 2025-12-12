
import React from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Custom parser to render stylized content without external libraries
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    let inList = false;

    return lines.map((line, index) => {
      // 1. Headers (### or ##)
      if (line.startsWith('### ') || line.startsWith('## ')) {
        inList = false;
        return (
          <h3 key={index} className="text-base font-bold text-white mt-4 mb-2 tracking-tight">
            {parseInline(line.replace(/^#+\s/, ''))}
          </h3>
        );
      }

      // 2. Headers (#### or bold headers)
      if (line.startsWith('#### ')) {
        inList = false;
        return (
          <h4 key={index} className="text-sm font-bold text-accent-blue mt-3 mb-1 uppercase tracking-wider">
            {parseInline(line.replace(/^#+\s/, ''))}
          </h4>
        );
      }

      // 3. Bullet Points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().replace(/^[-*]\s/, '');
        const item = (
          <li key={index} className="text-sm text-gray-300 leading-relaxed pl-1">
            <span className="mr-2 text-accent-blue">•</span>
            {parseInline(content)}
          </li>
        );
        
        if (!inList) {
          inList = true;
          return <ul key={`ul-${index}`} className="my-2 space-y-1">{item}</ul>;
        }
        return item; // Note: In a true map, adjacent lis should be wrapped, but simple rendering suffices here
      }
      
      inList = false;

      // 4. Empty lines
      if (!line.trim()) {
        return <div key={index} className="h-2" />;
      }

      // 5. Standard Paragraphs
      return (
        <p key={index} className="text-sm text-gray-300 leading-relaxed mb-1">
          {parseInline(line)}
        </p>
      );
    });
  };

  // Helper to parse **Bold** and `Code` inline
  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-black/30 border border-white/10 rounded px-1 py-0.5 text-xs font-mono text-accent-blue">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border
            ${isUser ? 'bg-primary border-primary text-white' : 'bg-secondary border-border text-accent-blue shadow-glow'}
        `}>
            {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble */}
        <div 
          className={`
            p-5 rounded-2xl shadow-sm border
            ${isUser 
              ? 'bg-primary text-white rounded-tr-none border-primary' 
              : 'bg-[#141416] text-gray-200 rounded-tl-none border-gray-800'
            }
          `}
        >
           {message.image && (
               <div className="w-full max-w-[300px] rounded-lg overflow-hidden mb-3 border border-black/20">
                   <img src={message.image} alt="Attachment" className="w-full h-auto object-cover" />
               </div>
           )}
           <div className="font-sans">
              {isUser ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p> : renderContent(message.text)}
           </div>
        </div>
      </div>
    </div>
  );
};
