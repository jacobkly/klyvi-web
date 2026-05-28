import { Settings } from 'lucide-react';
import { SettingsForm } from '@/components/settings/settings-form';

export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div className="px-4 md:px-8 pt-10 md:pt-14 pb-16 max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full hairline bg-card/50 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
        <Settings className="size-3" strokeWidth={1.5} />
        Settings
      </div>
      <h1 className="mt-4 text-balance text-3xl md:text-4xl font-semibold tracking-tight">
        Make Klyvi yours.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your preferences live on this device for the beta. They&apos;ll move to your account later.
      </p>

      <div className="mt-10">
        <SettingsForm />
      </div>
    </div>
  );
}
