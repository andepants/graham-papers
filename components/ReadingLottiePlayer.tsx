"use client";

import { LottieInteractions, LottieLight, lottieInView } from "lottie-react";
import { useReducedMotion } from "motion/react";
import openBook from "@/lib/lottie/open-book.json";

const INTERACTIONS = [lottieInView({ amount: 0.4 })];

export default function ReadingLottiePlayer() {
  const reduce = useReducedMotion();
  const player = <LottieLight src={openBook} autoplay={false} loop className="reading-lottie-inner" />;

  if (reduce) return player;
  return <LottieInteractions interactions={INTERACTIONS}>{player}</LottieInteractions>;
}
