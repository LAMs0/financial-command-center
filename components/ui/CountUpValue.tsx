"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpValueProps {
  value: number;
  format: (value: number) => string;
  duration?: number;
}

export default function CountUpValue({
  value,
  format,
  duration = 700,
}: CountUpValueProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const displayValueRef = useRef(value);

  useEffect(() => {
    let frame = 0;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = window.requestAnimationFrame(() => {
        displayValueRef.current = value;
        setDisplayValue(value);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const start = performance.now();
    const from = displayValueRef.current;
    const delta = value - from;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = from + delta * eased;
      displayValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, value]);

  return <>{format(displayValue)}</>;
}
