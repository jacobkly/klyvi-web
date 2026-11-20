"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";

import { cn } from "@/lib/utils";

/**
 * A bottom sheet you can drag. With snap points it is full height and rests
 * at the first one. Without them, pass `h-auto` and it fits its content.
 * Drag it down to close. Base UI only reports the offsets as CSS
 * variables, so the movement lives in the popup's classes here.
 */
function Drawer(props: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-base font-medium text-foreground", className)}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.Popup.Props) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop
        data-slot="drawer-overlay"
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-(--dur-base) data-ending-style:opacity-0 data-starting-style:opacity-0"
      />
      <DrawerPrimitive.Viewport className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          className={cn(
            "glass pointer-events-auto flex h-[calc(100dvh-env(safe-area-inset-top)-1rem)] max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] w-full max-w-xl flex-col rounded-t-3xl border border-b-0 pb-[env(safe-area-inset-bottom)] outline-none",
            "translate-y-[calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y,0px))] transition-transform duration-(--dur-slow) ease-(--ease-enter)",
            "data-swiping:duration-0 data-starting-style:translate-y-full data-ending-style:translate-y-full motion-reduce:transition-none",
            className
          )}
          {...props}
        >
          {/* The handle says "drag me". The sheet itself is the grip. */}
          <div aria-hidden="true" className="flex shrink-0 justify-center pt-3 pb-2">
            <div className="h-1.5 w-10 rounded-full bg-foreground/25" />
          </div>
          <DrawerPrimitive.Content className="flex min-h-0 flex-1 flex-col">
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

export { Drawer, DrawerContent, DrawerTitle, DrawerTrigger };
