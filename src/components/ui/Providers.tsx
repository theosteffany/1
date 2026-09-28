"use client";

import { MotionConfig } from "framer-motion";

// reducedMotion="user" makes every Framer animation honour the OS setting.
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
