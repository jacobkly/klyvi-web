import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Klyvi — Find what to watch next',
    template: '%s · Klyvi',
  },
  description:
    'A personalized movie and TV discovery app that learns your taste.',
  applicationName: 'Klyvi',
  themeColor: '#10002b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable}`} suppressHydrationWarning>
      <body className={`${GeistSans.className} bg-background text-foreground min-h-dvh antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
