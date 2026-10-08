"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

type HomeStatsProps = {
  essayCount: number;
  partCount: number;
  yearSpan: number;
};

export function HomeStats({ essayCount, partCount, yearSpan }: HomeStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const essays = visible ? essayCount : 0;
  const years = visible ? yearSpan : 0;
  const parts = visible ? partCount : 0;

  return (
    <div ref={ref} className="feature-grid">
      <div className="feature-card">
        <h3>
          <NumberFlow value={essays} suffix=" essays" />
        </h3>
        <p>Every entry links straight to the original on paulgraham.com.</p>
      </div>
      <div className="feature-card">
        <h3>
          <NumberFlow value={years} suffix="+ years of writing" />
        </h3>
        <p>Themed parts plus a chronological index — metadata only.</p>
      </div>
      <div className="feature-card">
        <h3>
          <NumberFlow value={parts} suffix=" themed parts" />
        </h3>
        <p>Startups, wealth, writing, and how to think — inspired by Navalmanack.</p>
      </div>
    </div>
  );
}
