"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

// Real, deliberately stateless client: the backend's own ask() function
// takes the full message history on every call (no server-side session
// state), so this component keeps the real conversation in local state
// and resends it in full each turn - matching the actual API contract,
// not inventing a session mechanism the backend doesn't have.
export function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setSending(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? "Couldn't reach the assistant.",
        );
      }
      const { reply } = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't reach the assistant.",
      );
      // A real, failed turn - remove the user's own message from local
      // state too, so retrying doesn't silently duplicate it in the
      // history sent on the next attempt.
      setMessages(messages);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {open ? (
        <div className="flex h-[28rem] w-80 flex-col rounded-sm border border-paper-raised bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-paper-raised px-4 py-3">
            <span className="font-body text-sm font-semibold text-ink">
              Niwasthan Humsafar
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-ink-soft hover:text-ink"
            >
              ×
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="font-body text-sm text-ink-soft">
                Ask about your budget, a room, or how Niwasthan works — I only
                answer from your real project data.
              </p>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-sm px-3 py-2 font-body text-sm ${
                    m.role === "user"
                      ? "ml-6 bg-indigo text-paper"
                      : "mr-6 bg-paper-raised/50 text-ink"
                  }`}
                >
                  {m.content}
                </div>
              ))
            )}
            {sending ? (
              <p className="mr-6 font-body text-xs text-ink-soft">Thinking…</p>
            ) : null}
            {error ? (
              <p className="font-body text-xs text-alert">{error}</p>
            ) : null}
          </div>
          <form
            onSubmit={sendMessage}
            className="flex gap-2 border-t border-paper-raised p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={sending}
              className="flex-1 rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-sm bg-laterite px-3 py-2 font-body text-sm font-medium text-paper transition-colors hover:bg-laterite-deep disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo text-paper shadow-lg transition-transform hover:scale-105"
          aria-label="Open assistant"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      )}
    </div>
  );
}
