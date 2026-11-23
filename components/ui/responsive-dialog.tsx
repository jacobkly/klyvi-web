"use client";

import * as React from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsPhone } from "@/lib/use-is-phone";

/**
 * One dialog, two shapes: a centred dialog at md and up, and a sheet that
 * slides up from the bottom on phones, where a thumb can reach it and a swipe
 * down closes it. Use DialogTitle and DialogDescription inside, as usual. The
 * body scrolls inside the sheet, so anything that must stay in reach goes in
 * `footer`.
 */
function ResponsiveDialog({
  open,
  onOpenChange,
  className,
  footer,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The centred dialog's own classes. The sheet is always full width. */
  className?: string;
  /** Actions that stay in view while the sheet's body scrolls. */
  footer?: React.ReactNode;
  /** Given, the body and footer are one form, so Enter saves. */
  onSubmit?: (event: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  const phone = useIsPhone();

  const wrap = (className: string, inner: React.ReactNode) =>
    onSubmit ? (
      <form noValidate onSubmit={onSubmit} className={className}>
        {inner}
      </form>
    ) : (
      <div className={className}>{inner}</div>
    );

  if (phone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {/* No initial focus: focusing a field would raise the keyboard over
            the sheet the moment it opens. */}
        <DrawerContent initialFocus={false}>
          {wrap(
            "flex min-h-0 flex-1 flex-col",
            <>
              <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 pt-2 pb-4">
                {children}
              </div>
              {footer ? (
                <div className="shrink-0 border-t border-foreground/10 p-4">
                  {footer}
                </div>
              ) : null}
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        {wrap(
          "flex min-w-0 flex-col gap-6",
          <>
            {children}
            {footer}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { ResponsiveDialog };
