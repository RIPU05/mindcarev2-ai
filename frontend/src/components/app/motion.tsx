"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PropsWithChildren } from "react";

export function PageMotion({ children }: PropsWithChildren) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function CardMotion({ children }: PropsWithChildren) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      whileHover={shouldReduceMotion ? {} : { y: -2 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
    >
      {children}
    </motion.div>
  );
}

