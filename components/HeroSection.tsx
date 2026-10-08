"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Magnetic } from "@/components/fancy/Magnetic";
import { DISCLAIMERS } from "@/lib/catalog";
import { useMotionPreferences } from "@/lib/useReducedMotion";

const HeroLottiePlayer = dynamic(
  () => import("@/components/HeroLottiePlayer").then((m) => m.HeroLottiePlayer),
  { ssr: false },
);

type HeroSectionProps = {
  lottieData: object;
};

export function HeroSection({ lottieData }: HeroSectionProps) {
  const { motionOk } = useMotionPreferences();

  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="cover-wrap">
          <Image
            src="/images/cover.svg"
            alt="The Grahamanack cover"
            width={560}
            height={840}
            priority
          />
        </div>
        <div className="intro">
          <h1>The Grahamanack</h1>
          <p className="lead">
            Hello and welcome! This is a fan-made <strong>reading guide</strong> to Paul
            Graham&apos;s essays on{" "}
            <a href="https://paulgraham.com">paulgraham.com</a> — themed links, no hosted
            text.
          </p>
          <p className="muted">{DISCLAIMERS.unofficial}</p>
          <div className="hero-cta">
            {motionOk ? (
              <div className="hero-lottie" aria-hidden="true">
                <HeroLottiePlayer animationData={lottieData} />
              </div>
            ) : null}
            <Magnetic>
              <Link href="/table-of-contents" className="btn btn-primary">
                Browse the essays
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
