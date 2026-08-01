"use client";

import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

export function PageMotion({ children }: PropsWithChildren) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function CardMotion({ children }: PropsWithChildren) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  );
}
