/**
 * Field validators shared by every form, so the same input never gets two
 * different messages depending on which screen the user is standing on.
 *
 * Each returns an error string, or null when the value is acceptable.
 * Username rules live in ./username alongside the API-shaped helpers.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN = 8;

export function validateEmail(raw: string): string | null {
  if (!EMAIL_RE.test(raw.trim())) {
    return "That does not look like an email address.";
  }
  return null;
}

export function validatePassword(raw: string): string | null {
  if (raw.length < PASSWORD_MIN) {
    return `Passwords need at least ${PASSWORD_MIN} characters.`;
  }
  return null;
}

export function validatePasswordConfirm(
  password: string,
  confirm: string
): string | null {
  if (confirm !== password) return "Those passwords do not match.";
  return null;
}

/**
 * Blur is the wrong moment to complain about an empty field: the user may
 * be tabbing through, or may have opened the form and clicked away. Empty
 * is caught on submit instead, where it is actually a problem.
 */
export function validateOnBlur(
  value: string,
  validate: (v: string) => string | null
): string | null {
  if (value.trim() === "") return null;
  return validate(value);
}
