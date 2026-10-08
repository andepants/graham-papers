"use client";

/**
 * Springy cursor trail from Cursify (ui-layouts/cursify) — https://cursify.vercel.app
 * Book-themed emoji; disabled for coarse pointers and prefers-reduced-motion.
 */
import { useEffect, useRef } from "react";
import { useMotionPreferences } from "@/lib/useReducedMotion";

type SpringyCursorProps = {
  emoji?: string;
  zIndex?: number;
};

export function SpringyCursor({ emoji = "📖", zIndex = 9999 }: SpringyCursorProps) {
  const { motionOk } = useMotionPreferences();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!motionOk) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    document.body.classList.add("custom-cursor-active");

    const nDots = 6;
    const DELTAT = 0.01;
    const SEGLEN = 10;
    const SPRINGK = 10;
    const MASS = 1;
    const GRAVITY = 42;
    const RESISTANCE = 10;
    const STOPVEL = 0.1;
    const STOPACC = 0.1;
    const DOTSIZE = 11;
    const BOUNCE = 0.7;

    const cursor = { x: 0, y: 0 };
    let context: CanvasRenderingContext2D | null = null;
    let animationFrame: number | null = null;
    const particles: Particle[] = [];

    class Vec {
      X: number;
      Y: number;
      constructor(X: number, Y: number) {
        this.X = X;
        this.Y = Y;
      }
    }

    class Particle {
      position = { x: 0, y: 0 };
      velocity = { x: 0, y: 0 };
      constructor(private glyph: HTMLCanvasElement) {
        this.position = { x: cursor.x, y: cursor.y };
      }
      draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(
          this.glyph,
          this.position.x - this.glyph.width / 2,
          this.position.y - this.glyph.height / 2,
          this.glyph.width,
          this.glyph.height,
        );
      }
    }

    function springForce(i: number, j: number, spring: Vec) {
      const dx = particles[i].position.x - particles[j].position.x;
      const dy = particles[i].position.y - particles[j].position.y;
      const len = Math.hypot(dx, dy);
      if (len > SEGLEN) {
        const springF = SPRINGK * (len - SEGLEN);
        spring.X += (dx / len) * springF;
        spring.Y += (dy / len) * springF;
      }
    }

    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = String(zIndex);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    context = canvas.getContext("2d");
    if (!context) return;

    context.font = "15px serif";
    context.textBaseline = "middle";
    context.textAlign = "center";
    const measurements = context.measureText(emoji);
    const bgCanvas = document.createElement("canvas");
    const bgContext = bgCanvas.getContext("2d");
    if (!bgContext) return;

    bgCanvas.width = Math.ceil(measurements.width) + 4;
    bgCanvas.height = Math.ceil(measurements.actualBoundingBoxAscent * 2) + 4;
    bgContext.textAlign = "center";
    bgContext.font = "15px serif";
    bgContext.textBaseline = "middle";
    bgContext.fillText(emoji, bgCanvas.width / 2, bgCanvas.height / 2);

    for (let i = 0; i < nDots; i++) {
      particles[i] = new Particle(bgCanvas);
    }

    const onMouseMove = (e: MouseEvent) => {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    };

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const update = () => {
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);

      particles[0].position.x = cursor.x;
      particles[0].position.y = cursor.y;

      for (let i = 1; i < nDots; i++) {
        const spring = new Vec(0, 0);
        springForce(i - 1, i, spring);
        if (i < nDots - 1) springForce(i + 1, i, spring);

        const resist = new Vec(
          -particles[i].velocity.x * RESISTANCE,
          -particles[i].velocity.y * RESISTANCE,
        );
        const accel = new Vec(
          (spring.X + resist.X) / MASS,
          (spring.Y + resist.Y) / MASS + GRAVITY,
        );

        particles[i].velocity.x += DELTAT * accel.X;
        particles[i].velocity.y += DELTAT * accel.Y;

        if (
          Math.abs(particles[i].velocity.x) < STOPVEL &&
          Math.abs(particles[i].velocity.y) < STOPVEL &&
          Math.abs(accel.X) < STOPACC &&
          Math.abs(accel.Y) < STOPACC
        ) {
          particles[i].velocity.x = 0;
          particles[i].velocity.y = 0;
        }

        particles[i].position.x += particles[i].velocity.x;
        particles[i].position.y += particles[i].velocity.y;

        const height = canvas.height;
        const width = canvas.width;

        if (particles[i].position.y >= height - DOTSIZE - 1) {
          if (particles[i].velocity.y > 0) {
            particles[i].velocity.y = BOUNCE * -particles[i].velocity.y;
          }
          particles[i].position.y = height - DOTSIZE - 1;
        }
        if (particles[i].position.x >= width - DOTSIZE) {
          if (particles[i].velocity.x > 0) {
            particles[i].velocity.x = BOUNCE * -particles[i].velocity.x;
          }
          particles[i].position.x = width - DOTSIZE - 1;
        }
        if (particles[i].position.x < 0) {
          if (particles[i].velocity.x < 0) {
            particles[i].velocity.x = BOUNCE * -particles[i].velocity.x;
          }
          particles[i].position.x = 0;
        }

        particles[i].draw(context);
      }
    };

    const loop = () => {
      update();
      animationFrame = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("resize", onResize);
    loop();

    return () => {
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [emoji, motionOk, zIndex]);

  if (!motionOk) return null;

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
