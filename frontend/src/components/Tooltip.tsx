"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom";
}

/**
 * Lightweight tooltip component.
 * Renders a small popover on hover/focus with a fade-in animation.
 * Position defaults to "top" but can be set to "bottom".
 */
export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            initial={{ opacity: 0, y: position === "top" ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === "top" ? 4 : -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-2.5 py-1.5 text-[10px] font-semibold rounded bg-foreground text-background shadow-lg pointer-events-none ${
              position === "top" ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            {content}
            {/* Arrow */}
            <span
              className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45 ${
                position === "top" ? "top-full -mt-1" : "bottom-full -mb-1"
              }`}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
