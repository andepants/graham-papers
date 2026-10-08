"use client";

import { Lottie } from "lottie-react";

export function HeroLottiePlayer({ animationData }: { animationData: object }) {
  return <Lottie src={animationData} autoplay loop className="hero-lottie-player" />;
}
