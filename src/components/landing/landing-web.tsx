"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; depth: number; phase: number };

/**
 * Fixed line web behind the homepage. Scroll slides the strands and
 * lights a band of connections. The canvas never takes clicks.
 */
export function LandingWeb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const surface: HTMLCanvasElement = canvas;
    const context: CanvasRenderingContext2D | null = surface.getContext("2d");
    if (!context) return;
    const paint: CanvasRenderingContext2D = context;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const count = mobile ? 34 : 72;
    const reach = mobile ? 150 : 190;
    let nodes: Node[] = [];
    let width = 0;
    let height = 0;
    let scroll = window.scrollY;
    let running = true;
    let frame = 0;
    const color = { line: "rgba(42, 53, 255, 0.28)", dot: "rgba(42, 53, 255, 0.7)", wash: "rgb(236, 239, 243)" };

    function readTheme() {
      const dark = document.documentElement.classList.contains("dark");
      const page = getComputedStyle(document.body).backgroundColor;
      color.wash = page && page !== "rgba(0, 0, 0, 0)" ? page : dark ? "rgb(10, 12, 18)" : "rgb(236, 239, 243)";
      color.line = dark ? "rgba(168, 184, 255, 0.34)" : "rgba(37, 58, 196, 0.28)";
      color.dot = dark ? "rgba(198, 210, 255, 0.85)" : "rgba(37, 58, 196, 0.72)";
    }

    function seed() {
      nodes = Array.from({ length: count }, (_, index) => ({
        x: Math.random(),
        y: Math.random(),
        depth: 0.35 + Math.random() * 0.65,
        phase: index * 0.7,
      }));
    }

    function resize() {
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
      surface.width = Math.floor(nextWidth * ratio);
      surface.height = Math.floor(nextHeight * ratio);
      surface.style.width = `${nextWidth}px`;
      surface.style.height = `${nextHeight}px`;
      paint.setTransform(ratio, 0, 0, ratio, 0, 0);
      width = nextWidth;
      height = nextHeight;
    }

    function draw(now: number) {
      if (!running) return;
      const time = reduce ? 0 : now / 1000;
      const drift = reduce ? 0 : scroll * 0.35;
      paint.fillStyle = color.wash;
      paint.fillRect(0, 0, width, height);

      const points = nodes.map((node) => {
        const sway = reduce ? 0 : Math.sin(time * 0.45 + node.phase) * 8 * node.depth;
        const travel = (node.y * height * 1.6 - drift * node.depth + sway + height) % (height + 120);
        return {
          x: node.x * width + (reduce ? 0 : Math.cos(time * 0.3 + node.phase) * 6),
          y: travel - 60,
          depth: node.depth,
        };
      });

      for (let i = 0; i < points.length; i += 1) {
        const a = points[i]!;
        for (let j = i + 1; j < points.length; j += 1) {
          const b = points[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > reach) continue;
          const band = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(scroll * 0.004 + (a.y + b.y) * 0.01);
          const alpha = (1 - dist / reach) * (0.25 + band * 0.85) * ((a.depth + b.depth) / 2);
          paint.strokeStyle = color.line.replace(/[\d.]+\)$/, `${alpha})`);
          paint.lineWidth = 1;
          paint.beginPath();
          paint.moveTo(a.x, a.y);
          paint.lineTo(b.x, b.y);
          paint.stroke();
        }
      }

      for (const point of points) {
        paint.fillStyle = color.dot;
        paint.beginPath();
        paint.arc(point.x, point.y, 1.4 + point.depth, 0, Math.PI * 2);
        paint.fill();
      }

      if (reduce || document.hidden) {
        running = false;
        return;
      }
      frame = window.requestAnimationFrame(draw);
    }

    function onScroll() {
      scroll = window.scrollY;
      if (!running && !reduce) {
        running = true;
        frame = window.requestAnimationFrame(draw);
      }
    }

    readTheme();
    seed();
    resize();
    frame = window.requestAnimationFrame(draw);

    const theme = new MutationObserver(readTheme);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onScroll);

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      theme.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
