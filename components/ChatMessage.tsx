import React from 'react';
import { Message } from '../types';
import { User, Copy, ThumbsUp, ThumbsDown, CheckSquare, Briefcase } from 'lucide-react';
import { GradientGlobe } from '@/components/ui/GradientGlobe';
import { StreamingText } from './StreamingText';

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest = false }) => {
  const isUser = message.role === 'user';

  const parseInline = (text: string) => {
    // Regex matches: **bold**, `code`, or @[Type: Name]
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
      // Mentions - @[Type: Name] or @[Name]
      if (part.startsWith('@[') && part.endsWith(']')) {
        const content = part.slice(2, -1);
        let mentionType = 'task'; // default
        let mentionName = content;

        // Detect mention type from format "@[Type: Name]"
        const typeMatch = content.match(/^(Task|Project|Client):\s*(.+)$/i);
        if (typeMatch) {
          mentionType = typeMatch[1].toLowerCase();
          mentionName = typeMatch[2];
        }

        // Styling based on type
        const styles = {
          task: {
            bg: 'bg-indigo-500/20',
            border: 'border-indigo-500/50',
            text: 'text-indigo-300',
            shadow: 'shadow-[0_0_12px_rgba(99,102,241,0.25)]',
            icon: <CheckSquare size={13} strokeWidth={2.5} />
          },
          project: {
            bg: 'bg-purple-500/20',
            border: 'border-purple-500/50',
            text: 'text-purple-300',
            shadow: 'shadow-[0_0_12px_rgba(168,85,247,0.25)]',
            icon: <Briefcase size={13} strokeWidth={2.5} />
          },
          client: {
            bg: 'bg-emerald-500/20',
            border: 'border-emerald-500/50',
            text: 'text-emerald-300',
            shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.25)]',
            icon: <User size={13} strokeWidth={2.5} />
          }
        };

        const style = styles[mentionType as keyof typeof styles] || styles.task;

        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${style.bg} ${style.text} border-2 ${style.border} text-sm font-bold mx-1 align-middle ${style.shadow}`}
          >
            {style.icon}
            {mentionName}
          </span>
        );
      }
      return part;
    });
  };

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

  return (
    <div className={`flex w-full mb-2 ${isUser ? 'justify-end' : 'justify-center'}`}>
      <div className={`flex w-full ${isUser ? 'max-w-2xl' : 'max-w-3xl'} gap-4 md:gap-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Avatar */}
        {isUser ? (
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm mt-1 bg-primary border-primary text-white">
            <User size={16} />
          </div>
        ) : (
          <div className="mt-1">
            <GradientGlobe size={32} />
          </div>
        )}

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
              {isUser ? (
                <p className="text-sm leading-7 whitespace-pre-wrap">{parseInline(message.text)}</p>
              ) : (
                <div className={`text-sm leading-7 ${isLatest ? 'streaming-content' : ''}`}>
                  {renderContent(message.text)}
                </div>
              )}
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
