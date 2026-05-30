"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface AnimateInProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
}

export default function AnimateIn({
  children,
  className = "",
  delay = 0,
  ...props
}: AnimateInProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.35, ease: [0.22, 1, 0.36, 1], delay }
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}
