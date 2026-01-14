import React from 'react';

interface ThinkingIndicatorProps {
    className?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ className = '' }) => {
    return (
        <div className={`flex items-center gap-2 py-3 ${className}`}>
            <div className="flex gap-1.5">
                <span
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-thinkingPulse"
                />
                <span
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-thinkingPulse [animation-delay:150ms]"
                />
                <span
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-thinkingPulse [animation-delay:300ms]"
                />
            </div>
        </div>
    );
};
