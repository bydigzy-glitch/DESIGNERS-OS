
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CountUp: React.FC<{ value: number, duration?: number, prefix?: string, suffix?: string, className?: string, decimals?: number }> = ({
    value, duration = 1.5, prefix = '', suffix = '', className = '', decimals = 0
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        const totalDuration = duration * 1000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            if (elapsedTime >= totalDuration) {
                setDisplayValue(end);
            } else {
                const progress = elapsedTime / totalDuration;
                // Ease out quart
                const ease = 1 - Math.pow(1 - progress, 4);
                setDisplayValue(start + (end - start) * ease);
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [value, duration]);

    return (
        <span className={className}>
            {prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
        </span>
    );
};

export const FadeIn: React.FC<{ children: React.ReactNode, delay?: number, className?: string, onClick?: () => void }> = ({ children, delay = 0, className = "", onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
            duration: 0.23, // 230ms 
            delay,
            ease: [0, 0, 0.2, 1] // Strict ease-out
        }}
        className={className}
        onClick={onClick}
    >
        {children}
    </motion.div>
);
