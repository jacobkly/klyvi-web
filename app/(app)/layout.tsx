import { AppHeader } from '@/components/shell/app-header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main id="main" className="mx-auto w-full max-w-7xl">
        {children}
      </main>
    </>
  );
}
