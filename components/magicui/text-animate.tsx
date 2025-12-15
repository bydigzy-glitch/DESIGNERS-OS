
"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion, MotionProps, Variants } from "framer-motion";
import { ElementType } from "react";

type AnimationType = "blurIn" | "blurInUp" | "blurInDown" | "fadeIn" | "slideUp" | "slideDown" | "scaleUp";

type Props = {
    text: string;
    className?: string;
    delay?: number;
    duration?: number;
    variants?: Variants;
    as?: ElementType;
    startOnView?: boolean;
    once?: boolean;
    by?: "word" | "character" | "line";
    animation?: AnimationType;
} & MotionProps;

const defaultAnimations: Record<AnimationType, Variants> = {
    blurIn: {
        hidden: { opacity: 0, filter: "blur(10px)" },
        show: { opacity: 1, filter: "blur(0px)" },
        exit: { opacity: 0, filter: "blur(10px)" },
    },
    blurInUp: {
        hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
        show: { opacity: 1, filter: "blur(0px)", y: 0 },
        exit: { opacity: 0, filter: "blur(10px)", y: 20 },
    },
    blurInDown: {
        hidden: { opacity: 0, filter: "blur(10px)", y: -20 },
        show: { opacity: 1, filter: "blur(0px)", y: 0 },
        exit: { opacity: 0, filter: "blur(10px)", y: -20 },
    },
    fadeIn: {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 10 },
    },
    slideUp: {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 },
        exit: { y: -20, opacity: 0 },
    },
    slideDown: {
        hidden: { y: -20, opacity: 0 },
        show: { y: 0, opacity: 1 },
        exit: { y: 20, opacity: 0 },
    },
    scaleUp: {
        hidden: { scale: 0.5, opacity: 0 },
        show: { scale: 1, opacity: 1 },
        exit: { scale: 0.5, opacity: 0 },
    },
};

export function TextAnimate({
    text,
    children,
    className,
    delay = 0,
    duration = 0.3,
    variants,
    as: Component = "div",
    startOnView = true,
    once = false,
    by = "word",
    animation = "fadeIn",
    ...props
}: Props & { children?: string }) {
    // Use children if text is not provided
    const content = text || children;

    if (!content) {
        return null;
    }

    const MotionComponent = motion(Component);

    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: delay,
            },
        },
        exit: {
            opacity: 0,
            transition: {
                staggerChildren: 0.05,
                staggerDirection: -1,
            },
        },
    };

    const item = variants || defaultAnimations[animation];

    return (
        <AnimatePresence mode="popLayout">
            <MotionComponent
                initial="hidden"
                whileInView={startOnView ? "show" : undefined}
                animate={startOnView ? undefined : "show"}
                viewport={{ once }}
                exit="exit"
                variants={container}
                className={cn(by === "line" ? "block" : "inline-block", className)}
                {...props}
            >
                {by === "line"
                    ? content.split("\n").map((line, i) => (
                        <motion.span
                            key={i}
                            variants={item}
                            transition={{ duration }}
                            className={cn("block")}
                        >
                            {line}
                        </motion.span>
                    ))
                    : by === "word"
                        ? content.split(" ").map((word, i) => (
                            <motion.span
                                key={i}
                                variants={item}
                                transition={{ duration }}
                                className="inline-block whitespace-pre"
                            >
                                {word}{" "}
                            </motion.span>
                        ))
                        : content.split("").map((char, i) => (
                            <motion.span
                                key={i}
                                variants={item}
                                transition={{ duration }}
                                className="inline-block whitespace-pre"
                            >
                                {char}
                            </motion.span>
                        ))}
            </MotionComponent>
        </AnimatePresence>
    );
}
