"use client";

import { useEffect, useRef, useState } from "react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

// Real polling interval for new notifications - matches the same
// pattern already established for render-job status polling elsewhere
// in this app: check periodically, never claim a count that hasn't
// actually been fetched from the real backend.
const POLL_INTERVAL_MS = 30_000;

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) return;
      const { notifications: real } = await response.json();
      setNotifications(real);
      setLoaded(true);
    } catch {
      // A real, transient fetch failure - leave the existing list as it
      // is and let the next poll retry, rather than clearing real,
      // already-fetched notifications over a momentary network blip.
    }
  }

  useEffect(() => {
    (async () => {
      await fetchNotifications();
    })();
    const interval = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    // Real, optimistic local update - the actual source of truth is
    // still the backend call below; if it fails, the next real poll
    // (at most 30s later) will correct the local state back to what's
    // genuinely true server-side.
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    } catch {
      // Real, transient failure - the next poll reconciles real state.
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
    } catch {
      // Real, transient failure - the next poll reconciles real state.
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-sm p-1.5 text-ink-soft transition-colors hover:text-ink"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {loaded && unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-laterite px-1 font-mono text-[10px] text-paper">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-sm border border-paper-raised bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-paper-raised px-4 py-2.5">
            <span className="font-body text-sm font-semibold text-ink">
              Notifications
            </span>
            {unreadCount > 0 ? (
              <button
                onClick={markAllRead}
                className="font-body text-xs text-laterite hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center font-body text-sm text-ink-soft">
                Nothing here yet.
              </p>
            ) : (
              <ul className="divide-y divide-paper-raised">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`cursor-pointer px-4 py-3 transition-colors hover:bg-paper-raised/40 ${
                      n.read ? "" : "bg-paper-raised/20"
                    }`}
                  >
                    <p className="font-body text-sm font-medium text-ink">
                      {n.title}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-ink-soft">
                      {n.message}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-ink-soft/70">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
