"use client";

// Adapted from Fancy's "Cursor Attractor & Gravity" (github.com/danielpetho/fancy, MIT).

import Matter from "matter-js";
import { useReducedMotion } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type Position = number | `${number}%`;
type Shape = "pill" | "rectangle" | "circle";

type BodyConfig = {
  x: Position;
  y: Position;
  angle: number;
  shape: Shape;
  options: Matter.IBodyDefinition;
};

type Registry = {
  register: (id: string, el: HTMLElement, config: BodyConfig) => void;
  unregister: (id: string) => void;
};

const FieldContext = createContext<Registry | null>(null);

const DEFAULT_BODY: Matter.IBodyDefinition = {
  friction: 0.1,
  frictionAir: 0.045,
  restitution: 0.2,
  density: 0.001,
};

function resolve(value: Position, size: number) {
  return typeof value === "number" ? value : (size * parseFloat(value)) / 100;
}

function toCss(value: Position) {
  return typeof value === "number" ? `${value}px` : value;
}

type MagneticFieldProps = {
  children: ReactNode;
  attractorPoint?: { x: number; y: number };
  attractorStrength?: number;
  cursorStrength?: number;
  cursorFieldRadius?: number;
  className?: string;
};

export function MagneticField({
  children,
  attractorPoint = { x: 0.5, y: 0.5 },
  attractorStrength = 0.0006,
  cursorStrength = 0.0012,
  cursorFieldRadius = 180,
  className,
}: MagneticFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [items] = useState(() => new Map<string, { el: HTMLElement; config: BodyConfig }>());
  const [registry] = useState<Registry>(() => ({
    register: (id, el, config) => items.set(id, { el, config }),
    unregister: (id) => items.delete(id),
  }));
  const ax = attractorPoint.x;
  const ay = attractorPoint.y;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const { Bodies, Body, Composite, Engine, Events, Runner } = Matter;

    let engine: Matter.Engine | null = null;
    let runner: Matter.Runner | null = null;
    let frame = 0;
    let visible = true;
    let disposed = false;
    let builtSize = { width: 0, height: 0 };
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const pointer = { x: 0, y: 0, active: false };
    const bodies = new Map<HTMLElement, Matter.Body>();

    const place = (el: HTMLElement, x: number, y: number, angle: number) => {
      el.style.left = "0";
      el.style.top = "0";
      el.style.transform = `translate(${x - el.offsetWidth / 2}px, ${y - el.offsetHeight / 2}px) rotate(${angle}rad)`;
    };

    const pull = (body: Matter.Body, x: number, y: number, strength: number) => {
      const dx = x - body.position.x;
      const dy = y - body.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 1) return;
      Body.applyForce(body, body.position, {
        x: (dx / distance) * strength * body.mass,
        y: (dy / distance) * strength * body.mass,
      });
    };

    const sync = () => {
      bodies.forEach((body, el) => place(el, body.position.x, body.position.y, body.angle));
      frame = requestAnimationFrame(sync);
    };

    const start = () => {
      if (!engine || !runner) return;
      Runner.run(runner, engine);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };

    const stop = () => {
      if (runner) Runner.stop(runner);
      cancelAnimationFrame(frame);
    };

    const teardown = () => {
      stop();
      if (engine) {
        Events.off(engine, "beforeUpdate");
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      }
      engine = null;
      runner = null;
      bodies.clear();
    };

    const build = () => {
      teardown();
      const { width, height } = container.getBoundingClientRect();
      builtSize = { width, height };

      if (reduce) {
        items.forEach(({ el, config }) =>
          place(el, resolve(config.x, width), resolve(config.y, height), (config.angle * Math.PI) / 180),
        );
        return;
      }

      engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
      const wall = (x: number, y: number, w: number, h: number) =>
        Bodies.rectangle(x, y, w, h, { isStatic: true, friction: 1 });
      Composite.add(engine.world, [
        wall(width / 2, -25, width, 50),
        wall(width / 2, height + 25, width, 50),
        wall(-25, height / 2, 50, height),
        wall(width + 25, height / 2, 50, height),
      ]);

      items.forEach(({ el, config }) => {
        const x = resolve(config.x, width);
        const y = resolve(config.y, height);
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const options = { ...config.options, angle: (config.angle * Math.PI) / 180 };
        const body =
          config.shape === "circle"
            ? Bodies.circle(x, y, Math.max(w, h) / 2, options)
            : Bodies.rectangle(x, y, w, h, {
                ...options,
                chamfer: config.shape === "pill" ? { radius: Math.min(w, h) / 2 - 0.5 } : undefined,
              });
        Composite.add(engine!.world, body);
        bodies.set(el, body);
      });

      const attractX = width * ax;
      const attractY = height * ay;
      Events.on(engine, "beforeUpdate", () => {
        bodies.forEach((body) => {
          if (body.isStatic) return;
          pull(body, attractX, attractY, attractorStrength);
          if (!pointer.active) return;
          const d = Math.hypot(pointer.x - body.position.x, pointer.y - body.position.y);
          if (d < cursorFieldRadius) pull(body, pointer.x, pointer.y, cursorStrength);
        });
      });

      runner = Runner.create();
      if (visible) start();
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = e.pointerType === "mouse" || e.pointerType === "pen";
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (Math.abs(width - builtSize.width) < 1 && Math.abs(height - builtSize.height) < 1) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
    });

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });

    build();
    document.fonts?.ready.then(() => {
      if (!disposed) build();
    });
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);
    resizeObserver.observe(container);
    intersectionObserver.observe(container);

    return () => {
      disposed = true;
      clearTimeout(resizeTimer);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      teardown();
    };
  }, [items, reduce, ax, ay, attractorStrength, cursorStrength, cursorFieldRadius]);

  return (
    <FieldContext.Provider value={registry}>
      <div ref={containerRef} className={className}>
        {children}
      </div>
    </FieldContext.Provider>
  );
}

type MatterBodyProps = {
  children: ReactNode;
  x: Position;
  y: Position;
  angle?: number;
  shape?: Shape;
  options?: Matter.IBodyDefinition;
  className?: string;
};

export function MatterBody({
  children,
  x,
  y,
  angle = 0,
  shape = "pill",
  options = DEFAULT_BODY,
  className,
}: MatterBodyProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const field = useContext(FieldContext);

  useEffect(() => {
    if (!ref.current || !field) return;
    field.register(id, ref.current, { x, y, angle, shape, options });
    return () => field.unregister(id);
  }, [field, id, x, y, angle, shape, options]);

  const style: CSSProperties = {
    position: "absolute",
    left: toCss(x),
    top: toCss(y),
    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
