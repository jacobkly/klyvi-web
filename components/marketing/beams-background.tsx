"use client";

import * as React from "react";

/**
 * Ambient projector-beam backdrop, landing page only: slow violet light
 * streaks drifting through the dark, the Dark Room idea made literal.
 * Never appears inside the app, where posters are the only light source.
 *
 * Performance note that is really a correctness note: the reference this
 * came from set `ctx.filter = "blur(35px)"` inside the frame loop, which
 * drops canvas onto a software path on plenty of Windows machines and the
 * loop never finishes a frame (the beams just do not appear). So no canvas
 * filters here at all: each beam is a soft gradient, and the one blur is
 * CSS on the canvas element, composited on the GPU.
 *
 * Like the hero marquee, this is a disclosed reduced-motion exception:
 * slow linear drift, no flashing, landing page only.
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

const BEAM_COUNT = 22;
// An HSL band around the violet accent (oklch hue ~293 sits near hsl 263).
const HUE_BASE = 262;
const HUE_SPREAD = 28;

function createBeam(width: number, height: number): Beam {
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 90 + Math.random() * 110,
    length: height * 2.2,
    angle: -35 + Math.random() * 10,
    speed: 0.4 + Math.random() * 0.8,
    opacity: 0.12 + Math.random() * 0.12,
    hue: HUE_BASE + Math.random() * HUE_SPREAD,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.015 + Math.random() * 0.02,
  };
}

export function BeamsBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let beams: Beam[] = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      // Cap the pixel ratio: a blurred backdrop gains nothing from retina
      // resolution and the fill cost doubles per step.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // setTransform, not scale, so repeated resizes do not compound.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      beams = Array.from({ length: BEAM_COUNT }, () =>
        createBeam(width, height)
      );
    };

    function drawBeam(c: CanvasRenderingContext2D, beam: Beam) {
      c.save();
      c.translate(beam.x, beam.y);
      c.rotate((beam.angle * Math.PI) / 180);
      const a = beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2);
      const g = c.createLinearGradient(0, 0, 0, beam.length);
      g.addColorStop(0, `hsla(${beam.hue}, 70%, 62%, 0)`);
      g.addColorStop(0.2, `hsla(${beam.hue}, 70%, 62%, ${a * 0.5})`);
      g.addColorStop(0.5, `hsla(${beam.hue}, 70%, 62%, ${a})`);
      g.addColorStop(0.8, `hsla(${beam.hue}, 70%, 62%, ${a * 0.5})`);
      g.addColorStop(1, `hsla(${beam.hue}, 70%, 62%, 0)`);
      c.fillStyle = g;
      c.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      c.restore();
    }

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      for (const beam of beams) {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;
        if (beam.y + beam.length < -100) {
          Object.assign(beam, createBeam(width, height), {
            y: height + 100,
          });
        }
        drawBeam(ctx, beam);
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-background">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 [filter:blur(26px)]"
      />
      {/* Sink the streaks into the page top and bottom rather than letting
          them end at a hard edge. */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />
    </div>
  );
}
