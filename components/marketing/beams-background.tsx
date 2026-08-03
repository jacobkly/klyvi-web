"use client";

import * as React from "react";

/**
 * Ambient projector-beam backdrop, landing page only. Slow violet light
 * streaks drifting through the dark: the Dark Room idea made literal, a
 * projector throwing light across a black room. This is marketing chrome
 * and never appears inside the app, where the posters are the only light
 * source.
 *
 * Honors reduced motion by painting a single static frame instead of
 * animating, so the look survives without the drift. Beam color is the
 * violet accent hue, kept low-opacity so nothing competes with content.
 */

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
}

const BEAM_COUNT = 16;
// Centered on the violet accent hue (~293 in oklch), spread for depth.
const HUE_BASE = 282;
const HUE_SPREAD = 26;

function createBeam(width: number, height: number): Beam {
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 60 + Math.random() * 80,
    length: height * 2.5,
    angle: -35 + Math.random() * 10,
    speed: 0.5 + Math.random() * 0.9,
    opacity: 0.1 + Math.random() * 0.12,
    hue: HUE_BASE + Math.random() * HUE_SPREAD,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.025,
  };
}

export function BeamsBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let beams: Beam[] = [];
    let width = 0;
    let height = 0;

    function drawBeam(c: CanvasRenderingContext2D, beam: Beam) {
      c.save();
      c.translate(beam.x, beam.y);
      c.rotate((beam.angle * Math.PI) / 180);
      const a = beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2);
      const g = c.createLinearGradient(0, 0, 0, beam.length);
      g.addColorStop(0, `oklch(0.7 0.16 ${beam.hue} / 0)`);
      g.addColorStop(0.15, `oklch(0.7 0.16 ${beam.hue} / ${a * 0.5})`);
      g.addColorStop(0.5, `oklch(0.7 0.16 ${beam.hue} / ${a})`);
      g.addColorStop(0.85, `oklch(0.7 0.16 ${beam.hue} / ${a * 0.5})`);
      g.addColorStop(1, `oklch(0.7 0.16 ${beam.hue} / 0)`);
      c.fillStyle = g;
      c.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      c.restore();
    }

    function render(c: CanvasRenderingContext2D) {
      c.clearRect(0, 0, width, height);
      c.filter = "blur(32px)";
      for (const beam of beams) drawBeam(c, beam);
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // setTransform (not scale) so repeated resizes do not compound.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      beams = Array.from({ length: BEAM_COUNT }, () =>
        createBeam(width, height)
      );
      if (reduced) render(ctx);
    };

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.filter = "blur(32px)";
      for (const beam of beams) {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;
        if (beam.y + beam.length < -100) {
          Object.assign(beam, createBeam(width, height), {
            y: height + 120,
          });
        }
        drawBeam(ctx, beam);
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 [filter:blur(8px)]" />
      {/* Sink the streaks into the page top and bottom rather than letting
          them end at a hard edge. */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />
    </div>
  );
}
