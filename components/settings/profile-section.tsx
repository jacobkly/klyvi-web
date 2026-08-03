"use client";

import * as React from "react";
import { toast } from "sonner";

import { FormField } from "@/components/klyvi/form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteAvatar, updateMe, uploadAvatar } from "@/lib/api/users";
import {
  validateAvatarFile,
  validateBirthday,
} from "@/lib/local-profile";
import type { UserProfile } from "@/lib/types";
import {
  USERNAME_COOLDOWN_DAYS,
  USERNAME_MAX,
  USERNAME_MIN,
  formatRetryDate,
  readUsernameRejection,
  usernameUnlocksAt,
  validateUsername,
} from "@/lib/username";
import {
  availabilityMessage,
  useUsernameAvailability,
} from "@/lib/use-username-availability";
import { validateOnBlur } from "@/lib/validation";

import { FieldStack, SectionHeading } from "./section";

/**
 * Username and bio against the live API. The live availability check is an
 * assist; the write decides, and its rejections map to field errors.
 */
export function ProfileSection({
  me,
  onSaved,
}: {
  me: UserProfile | null;
  onSaved: (u: UserProfile) => void;
}) {
  const [username, setUsername] = React.useState(me?.username ?? "");
  const [bio, setBio] = React.useState(me?.bio ?? "");
  const [saving, setSaving] = React.useState(false);
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [birthday, setBirthday] = React.useState(me?.birthday ?? "");
  const [birthdayError, setBirthdayError] = React.useState<string | null>(
    null
  );
  const [avatarBusy, setAvatarBusy] = React.useState(false);
  const avatar = me?.avatarUrl ?? null;
  const fileRef = React.useRef<HTMLInputElement>(null);

  function onAvatarPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Allow re-picking the same file after a remove.
    e.target.value = "";
    if (!file) return;
    const problem = validateAvatarFile(file);
    if (problem) {
      toast(problem);
      return;
    }
    setAvatarBusy(true);
    uploadAvatar(file)
      .then((u) => {
        onSaved(u);
        toast("Photo updated");
      })
      .catch(() => toast("Could not upload that image. Try again."))
      .finally(() => setAvatarBusy(false));
  }

  function removeAvatar() {
    setAvatarBusy(true);
    deleteAvatar()
      .then((u) => onSaved(u))
      .catch(() => toast("Could not remove the photo. Try again."))
      .finally(() => setAvatarBusy(false));
  }

  // The profile can land after first render; adopt it once, untouched.
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (me && !seeded.current) {
      seeded.current = true;
      setUsername(me.username);
      setBio(me.bio ?? "");
      setBirthday(me.birthday ?? "");
    }
  }, [me]);

  const unlocksAt = usernameUnlocksAt(me?.usernameChangedAt ?? null);
  const locked = unlocksAt != null;
  const availability = useUsernameAvailability(locked ? "" : username, {
    skip: me?.username,
  });
  const availabilityNote = availabilityMessage(availability, username);

  function save() {
    const name = username.trim();
    const formatError = validateUsername(name);
    if (formatError) {
      setFieldError(formatError);
      return;
    }
    if (birthday) {
      const problem = validateBirthday(birthday);
      if (problem) {
        setBirthdayError(problem);
        return;
      }
    }
    setBirthdayError(null);
    setFieldError(null);
    setSaving(true);
    updateMe({ username: name, bio, birthday: birthday || null })
      .then((u) => {
        onSaved(u);
        toast("Saved");
      })
      .catch((err: unknown) => {
        const rejection = readUsernameRejection(err);
        if (rejection) {
          setFieldError(rejection.message);
          return;
        }
        toast("Could not update that. Try again");
      })
      .finally(() => setSaving(false));
  }

  return (
    <section>
      <SectionHeading>Profile</SectionHeading>
      <FieldStack>
        <div>
          <p className="text-sm font-medium text-foreground">Profile image</p>
          <div className="mt-2 flex items-center gap-4">
            <Avatar className="size-16">
              {avatar ? <AvatarImage src={avatar} alt="" /> : null}
              <AvatarFallback className="text-lg">
                {(me?.username?.charAt(0) ?? "K").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={avatarBusy}
                onClick={() => fileRef.current?.click()}
              >
                {avatarBusy ? "Working" : "Upload"}
              </Button>
              {avatar ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={avatarBusy}
                  onClick={removeAvatar}
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              aria-label="Upload a profile image"
              className="sr-only"
              onChange={onAvatarPicked}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            PNG, JPG, WebP, or GIF up to 2 MB. Shown on your profile and in
            the top bar.
          </p>
        </div>
        <FormField
          id="st-username"
          label="Username"
          error={
            fieldError ??
            (availabilityNote?.tone === "error"
              ? availabilityNote.text
              : undefined)
          }
          hint={
            locked
              ? `Changed recently. You can change it again on ${formatRetryDate(unlocksAt)}.`
              : availabilityNote?.tone === "hint"
                ? availabilityNote.text
                : `${USERNAME_MIN} to ${USERNAME_MAX} characters. This is the name Klyvi greets you by, and it can be changed once every ${USERNAME_COOLDOWN_DAYS} days.`
          }
        >
          {(field) => (
            <Input
              {...field}
              value={username}
              disabled={locked}
              onChange={(e) => {
                setUsername(e.target.value);
                if (fieldError)
                  setFieldError(validateUsername(e.target.value));
              }}
              onBlur={(e) =>
                setFieldError(
                  validateOnBlur(e.target.value, validateUsername)
                )
              }
            />
          )}
        </FormField>
        <FormField
          id="st-bio"
          label="Bio"
          hint="A line about your taste. Shown on your profile."
        >
          {(field) => (
            <Textarea
              {...field}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          )}
        </FormField>
        <FormField
          id="st-birthday"
          label="Birthday"
          error={birthdayError ?? undefined}
          hint="Optional. Shown on your profile."
        >
          {(field) => (
            <Input
              {...field}
              type="date"
              value={birthday}
              onChange={(e) => {
                setBirthday(e.target.value);
                if (birthdayError)
                  setBirthdayError(
                    e.target.value ? validateBirthday(e.target.value) : null
                  );
              }}
              onBlur={(e) =>
                setBirthdayError(
                  e.target.value ? validateBirthday(e.target.value) : null
                )
              }
            />
          )}
        </FormField>
        <div>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving" : "Save"}
          </Button>
        </div>
      </FieldStack>
    </section>
  );
}
