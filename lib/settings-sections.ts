export type SectionId =
  | "profile"
  | "account"
  | "appearance"
  | "lists"
  | "notifications"
  | "data"
  | "delete";

const IDS: SectionId[] = [
  "profile",
  "account",
  "appearance",
  "lists",
  "notifications",
  "data",
  "delete",
];

/** The section a `?section=` value names, or Profile. Lives outside the
 *  client component so the server page can call it. */
export function readSection(value: string | null | undefined): SectionId {
  return IDS.find((id) => id === value) ?? "profile";
}
