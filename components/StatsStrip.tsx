"use client";

import NumberFlow from "@number-flow/react";
import { useInView } from "motion/react";
import { useRef } from "react";

export type Stat = { value: number; label: string; suffix?: string };

export function StatsStrip({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <dl ref={ref} className="stats">
      {stats.map((s) => (
        <div key={s.label} className="stat">
          <dt>{s.label}</dt>
          <dd>
            <NumberFlow
              value={inView ? s.value : 0}
              suffix={s.suffix}
              format={{ useGrouping: false }}
              transformTiming={{ duration: 1100, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
              spinTiming={{ duration: 1100, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}
