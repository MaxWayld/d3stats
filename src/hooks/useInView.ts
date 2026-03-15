"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const VISIBLE: CSSProperties = {};

/**
 * Shared IntersectionObserver hook for fade-in animations.
 * Replaces 9 duplicated implementations across components.
 */
export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  /** Returns inline styles for staggered fade-in. Cap delay for long lists. */
  const row = (delay: number): CSSProperties => {
    if (visible) return VISIBLE;
    return {
      opacity: 0,
      transform: "translateY(8px)",
      transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
    };
  };

  return { ref, visible, row };
}
