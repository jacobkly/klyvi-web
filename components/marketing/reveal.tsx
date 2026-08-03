"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Scroll-and-load reveal for the landing page: content starts faded and
 * shifted down, then slides up as it enters the viewport (once). On first
 * paint everything above the fold is already in view, so it plays as the
 * load-in.
 *
 * Deliberately framer, not CSS: framer drives opacity/transform in JS, so
 * it plays regardless of the CSS reduced-motion override in globals.css.
 * That is on purpose for this marketing page, which is a disclosed
 * exception to the reduced-motion floor (like the beams and the marquee).
 * To honor reduced motion instead, wrap the page in
 * `<MotionConfig reducedMotion="user">`.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
