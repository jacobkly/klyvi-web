interface AmbientBlobsProps {
  intensity?: 'low' | 'normal' | 'high';
  className?: string;
}

/**
 * Two slow-drifting purple radial blobs. CSS-only (no framer-motion) so it
 * stays cheap and works without client JS. Respects prefers-reduced-motion
 * via the global stylesheet rule and the `motion-safe:` prefix.
 */
export function AmbientBlobs({ intensity = 'normal', className }: AmbientBlobsProps) {
  const op1 =
    intensity === 'low' ? 'opacity-[0.18]' : intensity === 'high' ? 'opacity-30' : 'opacity-25';
  const op2 =
    intensity === 'low' ? 'opacity-[0.12]' : intensity === 'high' ? 'opacity-25' : 'opacity-20';
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className ?? ''}`}
    >
      <div
        className={`absolute -left-32 top-16 size-[480px] rounded-full bg-primary blur-3xl motion-safe:animate-drift-1 ${op1}`}
      />
      <div
        className={`absolute -right-24 top-40 size-[420px] rounded-full bg-accent blur-3xl motion-safe:animate-drift-2 ${op2}`}
      />
    </div>
  );
}
