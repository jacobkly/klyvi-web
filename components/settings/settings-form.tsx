'use client';

import * as React from 'react';
import { Cog, Bell, ShieldCheck, User, Info, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SettingsRowProps {
  title: string;
  hint?: string;
  control: React.ReactNode;
  className?: string;
}

function Row({ title, hint, control, className }: SettingsRowProps) {
  return (
    <div className={cn('flex items-start justify-between gap-6 py-4', className)}>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground max-w-prose">{hint}</div>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl hairline bg-card/30">
      <div className="flex items-center gap-2 px-5 pt-5">
        <div className="grid size-7 place-items-center rounded-md bg-card hairline">
          <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="divide-y divide-white/[0.06] px-5 pb-2">{children}</div>
    </section>
  );
}

const PREFS_KEY = 'klyvi-prefs';

type Prefs = {
  reduceMotion: boolean;
  compactGrid: boolean;
  showWhyRec: boolean;
  notifyNewRecs: boolean;
  notifySeasonDrops: boolean;
  notifyDigest: boolean;
  language: string;
};

const DEFAULTS: Prefs = {
  reduceMotion: false,
  compactGrid: false,
  showWhyRec: true,
  notifyNewRecs: true,
  notifySeasonDrops: true,
  notifyDigest: false,
  language: 'en',
};

export function SettingsForm() {
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULTS);
  const [hydrated, setHydrated] = React.useState(false);

  // Load prefs once on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  // Persist + apply side effects (reduceMotion sets data-attr on <html>)
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {}
    if (prefs.reduceMotion) document.documentElement.setAttribute('data-motion', 'reduced');
    else document.documentElement.removeAttribute('data-motion');
  }, [prefs, hydrated]);

  function set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  const [deleteText, setDeleteText] = React.useState('');

  return (
    <div className="space-y-6">
      {/* Account */}
      <Section icon={User} title="Account">
        <Row title="Username" hint="@jacob" control={<Button variant="ghost" size="sm">Edit</Button>} />
        <Row title="Email" hint="klymenkojacob@gmail.com" control={<Button variant="ghost" size="sm">Change</Button>} />
        <Row title="Member since" hint="May 2026" control={<></>} />
      </Section>

      {/* Display */}
      <Section icon={Cog} title="Display">
        <Row
          title="Theme"
          hint="Dark mode is the default and only mode for the beta."
          control={
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Dark
            </span>
          }
        />
        <Row
          title="Reduce motion"
          hint="Disable animations and transitions across the app."
          control={
            <Switch
              checked={prefs.reduceMotion}
              onCheckedChange={(v) => set('reduceMotion', v)}
              aria-label="Reduce motion"
            />
          }
        />
        <Row
          title="Compact poster grid"
          hint="Tighter rows with more titles per screen."
          control={
            <Switch
              checked={prefs.compactGrid}
              onCheckedChange={(v) => set('compactGrid', v)}
              aria-label="Compact poster grid"
            />
          }
        />
        <Row
          title="Show 'Why this rec?' explanations"
          hint="Tooltip explanations on recommended titles."
          control={
            <Switch
              checked={prefs.showWhyRec}
              onCheckedChange={(v) => set('showWhyRec', v)}
              aria-label="Show why this rec"
            />
          }
        />
        <Row
          title="Language"
          control={
            <Select value={prefs.language} onValueChange={(v) => set('language', v)}>
              <SelectTrigger className="w-36 h-9 text-sm" aria-label="Language">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="ko">한국어</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <Row
          title="New recommendations"
          hint="Weekly summary of fresh picks for your taste profile."
          control={
            <Switch
              checked={prefs.notifyNewRecs}
              onCheckedChange={(v) => set('notifyNewRecs', v)}
              aria-label="New recommendations"
            />
          }
        />
        <Row
          title="New seasons of shows you watch"
          hint="Get notified when a tracked series releases a new season."
          control={
            <Switch
              checked={prefs.notifySeasonDrops}
              onCheckedChange={(v) => set('notifySeasonDrops', v)}
              aria-label="New seasons"
            />
          }
        />
        <Row
          title="Weekly digest email"
          hint="One email each Sunday with what's new and what to watch."
          control={
            <Switch
              checked={prefs.notifyDigest}
              onCheckedChange={(v) => set('notifyDigest', v)}
              aria-label="Weekly digest"
            />
          }
        />
      </Section>

      {/* Data & Privacy */}
      <Section icon={ShieldCheck} title="Data & Privacy">
        <Row
          title="Export my data"
          hint="Download a JSON of everything you've logged and rated."
          control={
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast('Export queued', { description: "We'll email you when it's ready." })}
            >
              <Download className="size-4" strokeWidth={1.5} />
              Export
            </Button>
          }
        />
        <Row
          title="Privacy policy"
          control={<Button variant="ghost" size="sm">View</Button>}
        />
        <Row
          title="Delete my account"
          hint="Removes your profile and all logged data. This cannot be undone."
          control={
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="size-4" strokeWidth={1.5} />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete your account?</DialogTitle>
                  <DialogDescription>
                    This will permanently remove your profile, ratings, watchlist, and history. There is no recovery.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 pt-1">
                  <Label htmlFor="confirm">Type <span className="font-mono text-destructive">DELETE</span> to confirm</Label>
                  <Input
                    id="confirm"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDeleteText('')}>Cancel</Button>
                  <Button
                    variant="destructive"
                    disabled={deleteText !== 'DELETE'}
                    onClick={() => toast('Deletion requested.', { description: 'Beta stub — no real deletion happened.' })}
                  >
                    Delete account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
      </Section>

      {/* About */}
      <Section icon={Info} title="About">
        <Row title="Klyvi Web" hint="Version 0.1.0-beta" control={<></>} />
        <Row title="Terms of Service" control={<Button variant="ghost" size="sm">View</Button>} />
        <Row title="Source on GitHub" control={<Button variant="ghost" size="sm">Open</Button>} />
      </Section>

      <Separator className="!my-2" />
      <p className="text-xs text-muted-foreground text-center">
        Klyvi · An honest movie & TV discovery app · {new Date().getFullYear()}
      </p>
    </div>
  );
}
