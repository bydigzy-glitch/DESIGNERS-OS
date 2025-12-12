
import React from 'react';
import { Message } from '../types';
import { Bot, User, Copy, ThumbsUp, ThumbsDown, CheckSquare } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Custom parser to render stylized content
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    let inList = false;

    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('### ') || line.startsWith('## ')) {
        inList = false;
        return (
          <h3 key={index} className="text-base font-bold text-foreground mt-4 mb-2 tracking-tight">
            {parseInline(line.replace(/^#+\s/, ''))}
          </h3>
        );
      }

      if (line.startsWith('#### ')) {
        inList = false;
        return (
          <h4 key={index} className="text-sm font-bold text-primary mt-3 mb-1 uppercase tracking-wider">
            {parseInline(line.replace(/^#+\s/, ''))}
          </h4>
        );
      }

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().replace(/^[-*]\s/, '');
        const item = (
          <li key={index} className="text-sm text-muted-foreground leading-7 pl-1 flex items-start">
            <span className="mr-2 text-primary mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 block"></span>
            <span>{parseInline(content)}</span>
          </li>
        );
        
        if (!inList) {
          inList = true;
          return <ul key={`ul-${index}`} className="my-2 space-y-1">{item}</ul>;
        }
        return item; 
      }
      
      inList = false;

      if (!line.trim()) {
        return <div key={index} className="h-2" />;
      }

      return (
        <p key={index} className="text-sm text-muted-foreground leading-7 mb-1">
          {parseInline(line)}
        </p>
      );
    });
  };

  const parseInline = (text: string) => {
    // Regex matches: **bold**, `code`, or @[Task Name]
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|@\[.*?\])/g);
    
    return parts.map((part, i) => {
      // Bold
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      // Inline Code
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-secondary border border-border rounded px-1.5 py-0.5 text-xs font-mono text-primary">{part.slice(1, -1)}</code>;
      }
      // Task Mention
      if (part.startsWith('@[') && part.endsWith(']')) {
        const taskName = part.slice(2, -1);
        return (
            <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold mx-0.5 align-middle">
                <CheckSquare size={10} strokeWidth={3} />
                {taskName}
            </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex w-full mb-2 ${isUser ? 'justify-end' : 'justify-center'}`}>
      <div className={`flex w-full ${isUser ? 'max-w-2xl' : 'max-w-3xl'} gap-4 md:gap-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm mt-1
            ${isUser ? 'bg-primary border-primary text-white' : 'bg-card border-border text-primary'}
        `}>
            {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble */}
        <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
            
           {/* Author Name */}
           <div className={`text-xs font-bold text-foreground mb-1 ${isUser ? 'mr-1' : 'ml-1'}`}>
               {isUser ? 'You' : 'Mentor AI'}
           </div>

           <div 
             className={`
               p-4 md:p-5 rounded-2xl shadow-sm border text-left
               ${isUser 
                 ? 'bg-secondary/50 text-foreground rounded-tr-sm border-border' 
                 : 'bg-card text-foreground rounded-tl-sm border-border'
               }
             `}
           >
              {message.image && (
                  <div className="w-full max-w-[300px] rounded-xl overflow-hidden mb-4 border border-border">
                      <img src={message.image} alt="Attachment" className="w-full h-auto object-cover" />
                  </div>
              )}
              <div className="font-sans">
                 {isUser ? <p className="text-sm leading-7 whitespace-pre-wrap">{parseInline(message.text)}</p> : renderContent(message.text)}
              </div>
           </div>

           {/* Actions Row (Bot Only) */}
           {!isUser && (
               <div className="flex items-center gap-2 mt-2 ml-1">
                   <button className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" title="Copy">
                       <Copy size={14} />
                   </button>
                   <button className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" title="Good response">
                       <ThumbsUp size={14} />
                   </button>
                   <button className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" title="Bad response">
                       <ThumbsDown size={14} />
                   </button>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
