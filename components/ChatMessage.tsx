import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Helper to parse bold text **bold**
  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="font-bold text-white">{part.slice(2, -2)}</span>;
      }
      return part;
    });
  };

  // Helper to parse content into blocks (paragraphs and lists)
  const renderContent = (text: string) => {
    // Split by double newlines to identify paragraphs vs lists
    const blocks = text.split(/\n\n+/);

    return blocks.map((block, i) => {
      const trimmedBlock = block.trim();
      
      // Check if this block is a list (starts with * or -)
      if (trimmedBlock.startsWith('* ') || trimmedBlock.startsWith('- ')) {
        const items = block.split(/\n/).filter(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
        return (
          <ul key={i} className="mb-4 space-y-2 last:mb-0">
            {items.map((item, j) => (
              <li key={j} className="flex gap-3 text-gray-300 items-start">
                <span className="text-accent-blue mt-2 text-xs flex-shrink-0">●</span>
                <span className="flex-1 leading-relaxed">{parseBold(item.replace(/^[*|-]\s/, ''))}</span>
              </li>
            ))}
          </ul>
        );
      }

      // Standard Paragraph
      return (
        <div key={i} className="mb-4 text-gray-300 leading-relaxed last:mb-0">
          {parseBold(block)}
        </div>
      );
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          max-w-[95%] md:max-w-[80%] p-5 md:p-8 rounded-3xl shadow-sm transition-all duration-300
          text-base md:text-lg leading-relaxed
          ${isUser 
            ? 'bg-accent-blue text-white rounded-br-none' 
            : 'bg-card-bg border border-gray-800 rounded-tl-none'
          }
        `}
      >
         <div className="font-sans">
          {isUser ? (
             <div className="whitespace-pre-wrap">{message.text}</div>
          ) : (
             renderContent(message.text)
          )}
         </div>
      </div>
    </div>
  );
};