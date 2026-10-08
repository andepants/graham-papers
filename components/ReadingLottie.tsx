"use client";

import dynamic from "next/dynamic";

const Player = dynamic(() => import("./ReadingLottiePlayer"), { ssr: false });

export function ReadingLottie() {
  return (
    <div className="reading-lottie" aria-hidden>
      <Player />
    </div>
  );
}
