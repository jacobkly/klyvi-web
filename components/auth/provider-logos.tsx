/**
 * Brand marks for the OAuth buttons.
 *
 * The icon rule is Lucide only, but Lucide deliberately ships no brand
 * logos, and each provider's sign-in guidelines require their own mark on
 * the button. So these are inline SVG paths, kept to the official artwork
 * and official colours, and used nowhere except the auth buttons.
 *
 * Explicit `size-*` classes matter: the button base sets
 * `[&_svg:not([class*='size-'])]:size-4`, so an unsized mark would be
 * silently resized by the component.
 */

export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.22V7.04H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84c.87-2.6 3.3-4.5 6.16-4.5z"
      />
    </svg>
  );
}

export function MicrosoftMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

export function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M17.05 12.54c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.777 2.29-1.61 2.8-.41 6.93 1.15 9.2.76 1.11 1.67 2.36 2.86 2.31 1.15-.04 1.58-.74 2.97-.74 1.38 0 1.78.74 2.99.72 1.23-.02 2.02-1.13 2.78-2.25.87-1.29 1.23-2.54 1.25-2.6-.03-.01-2.4-.92-2.42-3.65zM14.77 5.4c.63-.77.96-1.83.87-2.9-.84.04-1.86.56-2.51 1.32-.58.67-1.09 1.75-.95 2.78.94.07 1.9-.48 2.59-1.2z"
      />
    </svg>
  );
}
