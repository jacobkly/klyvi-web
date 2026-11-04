"use client";

import * as React from "react";

import { useSession } from "@/components/auth/auth-provider";
import { getNotifications } from "@/lib/api/notifications";

type UnreadValue = {
  unread: number;
  setUnread: (count: number) => void;
};

const UnreadContext = React.createContext<UnreadValue>({
  unread: 0,
  setUnread: () => {},
});

export function useUnreadNotices(): UnreadValue {
  return React.useContext(UnreadContext);
}

/**
 * The unread notice count behind the dot on the account menu. Fetched once per
 * page load and never polled: notices are written by a nightly job, so nothing
 * new can turn up while the page is open.
 */
export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const userId = user?.id ?? null;
  // Tagged with its owner, so signing out hides the count without an effect.
  const [owned, setOwned] = React.useState<{
    userId: string;
    count: number;
  } | null>(null);
  // Set once the page has reported a count, which is newer than any first
  // fetch still in the air. A slow answer must not bring a cleared dot back.
  const reported = React.useRef(false);

  // Keyed on the id, not the user object, which is replaced at every token
  // refresh.
  React.useEffect(() => {
    if (!userId) return;
    reported.current = false;
    let stale = false;
    getNotifications({ limit: 1 })
      .then((page) => {
        if (stale || reported.current) return;
        setOwned({ userId, count: page.unreadCount });
      })
      .catch(() => {
        // No count means no dot, and the page itself still works.
      });
    return () => {
      stale = true;
    };
  }, [userId]);

  const setUnread = React.useCallback(
    (count: number) => {
      if (!userId) return;
      reported.current = true;
      setOwned({ userId, count });
    },
    [userId]
  );

  const unread = owned && owned.userId === userId ? owned.count : 0;
  const value = React.useMemo(() => ({ unread, setUnread }), [unread, setUnread]);

  return (
    <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>
  );
}
