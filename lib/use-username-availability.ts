"use client";

import * as React from "react";

import { checkUsernameAvailable } from "@/lib/api/users";
import { validateUsername } from "@/lib/username";

export type AvailabilityState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "free" }
  | { kind: "taken" }
  | { kind: "reserved" };

const DEBOUNCE_MS = 400;

const IDLE: AvailabilityState = { kind: "idle" };
const CHECKING: AvailabilityState = { kind: "checking" };

/**
 * Asks the API whether a username is free, once the user stops typing.
 *
 * Three things keep it from being annoying or wrong:
 * - It waits for a pause, so a name is not checked once per keystroke.
 * - It skips names that fail format validation, because the field is
 *   already telling the user about that and the answer would be "invalid"
 *   either way.
 * - It aborts the in-flight request when the value changes, so a slow
 *   early reply cannot land after a later one and report the wrong name.
 *
 * `skip` is for the value the user already owns: settings should not tell
 * someone their own name is taken.
 */
export function useUsernameAvailability(
  username: string,
  options: { skip?: string } = {}
): AvailabilityState {
  const { skip } = options;
  // The API's last answer, tagged with the name it was for. Anything else
  // (idle, or checking a newer name) is derived during render.
  const [answer, setAnswer] = React.useState<{
    name: string;
    state: AvailabilityState;
  } | null>(null);

  const name = username.trim();
  const checkable =
    name !== "" &&
    !(skip && name.toLowerCase() === skip.toLowerCase()) &&
    !validateUsername(name);

  React.useEffect(() => {
    if (!checkable) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      checkUsernameAvailable(name, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          setAnswer({
            name,
            state: result.available
              ? { kind: "free" }
              : { kind: result.reason === "reserved" ? "reserved" : "taken" },
          });
        })
        .catch(() => {
          // The check is an assist, not a gate: the write still enforces
          // uniqueness, so a failed lookup goes quiet rather than blocking.
          if (!controller.signal.aborted)
            setAnswer({ name, state: IDLE });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [name, checkable]);

  if (!checkable) return IDLE;
  return answer?.name === name ? answer.state : CHECKING;
}

/** The message for a state, or null when there is nothing to say. */
export function availabilityMessage(
  state: AvailabilityState,
  username: string
): { text: string; tone: "error" | "hint" } | null {
  switch (state.kind) {
    case "checking":
      return { text: "Checking availability", tone: "hint" };
    case "free":
      return { text: `${username.trim()} is available.`, tone: "hint" };
    case "taken":
      return { text: "That username is taken. Try another.", tone: "error" };
    case "reserved":
      return {
        text: "That username is not available. Try another.",
        tone: "error",
      };
    default:
      return null;
  }
}
