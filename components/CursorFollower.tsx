"use client";

// Based on Cursify's "Smooth Follower" cursor (cursify.vercel.app).

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

const INTERACTIVE = "a, button, [role='button'], summary, label, select";

export function CursorFollower() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const dotX = useSpring(x, { stiffness: 1200, damping: 60, mass: 0.3 });
  const dotY = useSpring(y, { stiffness: 1200, damping: 60, mass: 0.3 });
  const ringX = useSpring(x, { stiffness: 220, damping: 24, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 220, damping: 24, mass: 0.6 });
  const ringScale = useSpring(1, { stiffness: 320, damping: 22 });
  const dotScale = useSpring(1, { stiffness: 400, damping: 28 });
  const opacity = useSpring(0, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const update = () => setEnabled(finePointer.matches && !reduce);
    update();
    finePointer.addEventListener("change", update);
    return () => finePointer.removeEventListener("change", update);
  }, [reduce]);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("custom-cursor");
    let hovering = false;

    const setHover = (next: boolean) => {
      if (next === hovering) return;
      hovering = next;
      ringScale.set(next ? 1.65 : 1);
      dotScale.set(next ? 0 : 1);
      if (ringRef.current) ringRef.current.dataset.hover = String(next);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      x.set(e.clientX);
      y.set(e.clientY);
      opacity.set(1);
    };
    const onOver = (e: PointerEvent) => {
      setHover(e.target instanceof Element && e.target.closest(INTERACTIVE) !== null);
    };
    const onDown = () => ringScale.set(hovering ? 1.3 : 0.75);
    const onUp = () => ringScale.set(hovering ? 1.65 : 1);
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) opacity.set(0);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerover", onOver);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseout", onLeave);
    return () => {
      root.classList.remove("custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [enabled, x, y, ringScale, dotScale, opacity]);

  if (!enabled) return null;

  return (
    <div className="cursor-layer" aria-hidden>
      <motion.div
        ref={ringRef}
        className="cursor-ring"
        style={{ x: ringX, y: ringY, scale: ringScale, opacity }}
      />
      <motion.div className="cursor-dot" style={{ x: dotX, y: dotY, scale: dotScale, opacity }} />
    </div>
  );
}
