import { toast } from "sonner";

/** Long enough to read the line and reach the button, short enough to clear. */
export const UNDO_TOAST_MS = 5000;

/**
 * A toast for a change the user can take back: it names what happened and
 * offers Undo for five seconds. Pressing Undo runs the handler, then confirms
 * the change was reversed, or says the undo failed.
 */
export function toastWithUndo({
  message,
  undoneMessage,
  onUndo,
}: {
  message: string;
  undoneMessage: string;
  onUndo: () => void | Promise<void>;
}) {
  return toast(message, {
    duration: UNDO_TOAST_MS,
    action: {
      label: "Undo",
      onClick: async () => {
        try {
          await onUndo();
          toast(undoneMessage);
        } catch {
          toast.error("Couldn't undo that. Try again from the title's page.");
        }
      },
    },
  });
}
