"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex min-w-0 flex-1 flex-col"
      initial={{ opacity: 0, y: 8 }}
      key={pathname}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
