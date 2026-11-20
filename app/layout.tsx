import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeBootScript } from "@/components/theme/theme-boot-script";
import { ThemeSync } from "@/components/theme/theme-sync";
import { rootMetadata } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // "dark" is the default: Klyvi is a dark-first product ("Dark Room").
    // The boot script swaps in the stored appearance before first paint and
    // ThemeSync keeps it current, so the html element's classes and data
    // attributes differ from the server's by design.
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeBootScript />
      </head>
      <body className="isolate min-h-full flex flex-col">
        <ThemeSync />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
