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

/** Must return a stable primitive — objects would retrigger useSyncExternalStore every render. */
function getMotionOkSnapshot(): boolean {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(pointer: coarse)").matches
  );
}

function getServerMotionOkSnapshot(): boolean {
  return false;
}

/** Fine pointer + motion allowed — safe for Cursify-style cursor effects. */
export function useMotionPreferences() {
  const motionOk = useSyncExternalStore(
    subscribe,
    getMotionOkSnapshot,
    getServerMotionOkSnapshot,
  );
  return { motionOk };
}
