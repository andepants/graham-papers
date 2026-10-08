"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(pointer: coarse)");
  const onChange = () => callback();
  reduced.addEventListener("change", onChange);
  coarse.addEventListener("change", onChange);
  return () => {
    reduced.removeEventListener("change", onChange);
    coarse.removeEventListener("change", onChange);
  };
}

function getSnapshot() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return { reduced, coarse, motionOk: !reduced && !coarse };
}

function getServerSnapshot() {
  return { reduced: false, coarse: false, motionOk: false };
}

/** Fine pointer + motion allowed — safe for Cursify-style cursor effects. */
export function useMotionPreferences() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
