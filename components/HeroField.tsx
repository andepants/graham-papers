"use client";

import Image from "next/image";
import { MagneticField, MatterBody } from "@/components/MagneticField";
import type { EssayLink } from "@/lib/catalog";

const COVER_BODY = { isStatic: true, friction: 0.2 };

export function HeroField({ essays }: { essays: EssayLink[] }) {
  return (
    <MagneticField className="hero-field" cursorFieldRadius={200}>
      <MatterBody x="50%" y="50%" shape="rectangle" options={COVER_BODY} className="hero-cover">
        <Image src="/images/cover.svg" alt="The Grahamanack cover" width={560} height={840} priority />
      </MatterBody>
      {essays.map((essay, i) => {
        const theta = (i / essays.length) * Math.PI * 2 - Math.PI / 2;
        const x = Math.round(50 + Math.cos(theta) * 34);
        const y = Math.round(50 + Math.sin(theta) * 40);
        const angle = ((i * 37) % 24) - 12;
        return (
          <MatterBody key={essay.slug} x={`${x}%`} y={`${y}%`} angle={angle}>
            <a href={essay.url} rel="noopener noreferrer" className="field-pill" draggable={false}>
              {essay.title}
            </a>
          </MatterBody>
        );
      })}
    </MagneticField>
  );
}
