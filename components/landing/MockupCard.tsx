"use client";

import { useRef } from "react";

interface Props {
  children: React.ReactNode;
}

/** Replicates the Stitch `rotate-x-2 hover:rotate-x-0` tilt effect. */
export function MockupCard({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="bg-surface-container border border-white/10 rounded-xl p-6 shadow-2xl overflow-hidden transition-transform duration-700"
      style={{ transform: "rotateX(2deg)" }}
      onMouseEnter={() => {
        if (ref.current) ref.current.style.transform = "rotateX(0deg)";
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "rotateX(2deg)";
      }}
    >
      {children}
    </div>
  );
}
