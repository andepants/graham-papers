"use client";

/**
 * Magnetic pull interaction (motion springs). Adapted from the Fancy Components /
 * Cursify magnetic cursor pattern — https://www.fancycomponents.dev
 */
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useMotionPreferences } from "@/lib/useReducedMotion";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  magneticDistance?: number;
  strength?: number;
};

export function Magnetic({
  children,
  className,
  magneticDistance = 140,
  strength = 0.35,
}: MagneticProps) {
  const { motionOk } = useMotionPreferences();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 120, damping: 14 });
  const springY = useSpring(y, { stiffness: 120, damping: 14 });

  const reset = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  useEffect(() => {
    if (!motionOk) return;

    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < magneticDistance) {
        const pull = (1 - dist / magneticDistance) ** 0.65;
        x.set(dx * pull * strength);
        y.set(dy * pull * strength);
      } else {
        reset();
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [magneticDistance, motionOk, reset, strength, x, y]);

  if (!motionOk) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY, display: "inline-block" }}
    >
      {children}
    </motion.div>
  );
}
