"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { usePref, type Prefs } from "@/lib/local-prefs";
import { cn } from "@/lib/utils";

import { FieldStack, SectionHeading, SettingRow, SettingsNote } from "./section";

type Accent = Prefs["themeAccent"];

const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: "violet", label: "Violet", swatch: "bg-theme-violet" },
  { id: "blue", label: "Blue", swatch: "bg-theme-blue" },
  { id: "green", label: "Green", swatch: "bg-theme-green" },
  { id: "orange", label: "Orange", swatch: "bg-theme-orange" },
  { id: "pink", label: "Pink", swatch: "bg-theme-pink" },
  { id: "red", label: "Red", swatch: "bg-theme-red" },
];

const TEXT_SIZES: { id: Prefs["textSize"]; label: string; hint: string }[] = [
  { id: "compact", label: "Compact", hint: "15 px" },
  { id: "default", label: "Default", hint: "16 px" },
  { id: "large", label: "Large", hint: "18 px" },
];

/**
 * One swatch row: six accent circles on a chip in that mode's own tokens
 * (the `dark` or `light` class scopes them), selection ring on the active
 * one. Picking a swatch sets the mode and the accent together.
 */
function SwatchRow({
  mode,
  selected,
  currentMode,
  onPick,
}: {
  mode: Prefs["themeMode"];
  selected: Accent;
  currentMode: Prefs["themeMode"];
  onPick: (mode: Prefs["themeMode"], accent: Accent) => void;
}) {
  const isCurrentRow = currentMode === mode;
  return (
    <div
      className={cn(
        mode,
        "flex items-center justify-between rounded-lg bg-background p-4 ring-1 ring-foreground/10"
      )}
    >
      <p className="text-sm font-medium text-foreground">
        {mode === "dark" ? "Dark" : "Light"}
      </p>
      <div role="radiogroup" aria-label={`${mode} accent`} className="flex gap-2">
        {ACCENTS.map((a) => {
          const isSelected = isCurrentRow && selected === a.id;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${mode} ${a.label}`}
              onClick={() => onPick(mode, a.id)}
              className={cn(
                "hit-44 relative size-6 rounded-full outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/30",
                a.swatch,
                isSelected &&
                  "ring-2 ring-foreground ring-offset-2 ring-offset-background"
              )}
            >
              {isSelected ? (
                <Check
                  aria-hidden="true"
                  strokeWidth={2}
                  // primary-foreground is near-white in both themes, which
                  // is what a light glyph on a mid-tone swatch needs.
                  className="absolute inset-0 m-auto size-3.5 text-primary-foreground"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AppearanceSection() {
  const [mode, setMode] = usePref("themeMode");
  const [accent, setAccent] = usePref("themeAccent");
  const [textSize, setTextSize] = usePref("textSize");
  const [reduceMotion, setReduceMotion] = usePref("reduceMotion");

  const pick = React.useCallback(
    (m: Prefs["themeMode"], a: Accent) => {
      setMode(m);
      setAccent(a);
    },
    [setMode, setAccent]
  );

  return (
    <section>
      <SectionHeading>Appearance</SectionHeading>
      <FieldStack className="max-w-[560px]">
        <div>
          <p className="text-sm font-medium text-foreground">Theme</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Dark or light, in one of six accents.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <SwatchRow
              mode="dark"
              selected={accent}
              currentMode={mode}
              onPick={pick}
            />
            <SwatchRow
              mode="light"
              selected={accent}
              currentMode={mode}
              onPick={pick}
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">Text size</p>
          <RadioGroup
            value={textSize}
            onValueChange={(v) => setTextSize(v as Prefs["textSize"])}
            className="mt-3 flex flex-col gap-2"
          >
            {TEXT_SIZES.map((s) => (
              <Label
                key={s.id}
                // Base UI stamps a bare data-checked, not data-state.
                className="flex cursor-pointer items-center gap-3 rounded-lg p-3 ring-1 ring-foreground/10 has-data-checked:ring-violet-text/50"
              >
                <RadioGroupItem value={s.id} />
                <span className="text-sm text-foreground">{s.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {s.hint}
                </span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <SettingRow
          title="Reduce motion"
          description="Turns off transitions and animations. Your system setting is already honored."
        >
          <Switch
            checked={reduceMotion}
            onCheckedChange={setReduceMotion}
            aria-label="Reduce motion"
          />
        </SettingRow>

        <SettingsNote>
          Saved to your account, so every browser you sign in on matches.
        </SettingsNote>
      </FieldStack>
    </section>
  );
}
