"use client";

import * as React from "react";

/**
 * A soft violet bloom that trails the cursor, landing-page only. It sits
 * behind everything (fixed, -z-10, pointer-events-none) so the near-black
 * body reads through it and the poster art stays the brightest thing on
 * screen. Position rides two CSS variables updated on pointer move inside
 * one rAF, so there is no React re-render per frame. With no pointer
 * (touch) it simply rests at center.
 */
export function PointerGlow() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", `${e.clientX}px`);
        el.style.setProperty("--py", `${e.clientY}px`);
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(600px circle at var(--px, 50%) var(--py, 30%), color-mix(in oklch, var(--primary) 16%, transparent), transparent 60%)",
      }}
    />
  );
}
