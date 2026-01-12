import React, { useMemo } from 'react';

interface StreamingTextProps {
    text: string;
    className?: string;
}

export const StreamingText: React.FC<StreamingTextProps> = ({ text, className = '' }) => {
    // Split text into word chunks (3-8 words per chunk for natural flow)
    const chunks = useMemo(() => {
        const words = text.split(/(\s+)/); // Keep whitespace
        const result: string[] = [];
        let currentChunk = '';
        let wordCount = 0;

        words.forEach((word) => {
            currentChunk += word;
            if (word.trim()) {
                wordCount++;
                // Create chunks of 4-6 words for optimal reading
                if (wordCount >= 4 && Math.random() > 0.3) {
                    result.push(currentChunk);
                    currentChunk = '';
                    wordCount = 0;
                }
            }
        });

        if (currentChunk) {
            result.push(currentChunk);
        }

        return result;
    }, [text]);

    return (
        <span className={className}>
            {chunks.map((chunk, index) => (
                <span
                    key={index}
                    className="inline opacity-0 animate-fadeInChunk"
                    style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'forwards'
                    }}
                >
                    {chunk}
                </span>
            ))}
        </span>
    );
};
