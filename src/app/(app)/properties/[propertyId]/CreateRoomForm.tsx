"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

const ROOM_TYPE_VALUES = [
  "LIVING_ROOM",
  "BEDROOM",
  "KITCHEN",
  "BATHROOM",
  "DINING_ROOM",
  "BALCONY",
  "STUDY",
  "OTHER",
] as const;

export function CreateRoomForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const t = useTranslations("createRoomForm");
  const tRoomType = useTranslations("roomType");
  const [name, setName] = useState("");
  const [type, setType] = useState("LIVING_ROOM");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const roomTypeLabels: Record<string, string> = {
    LIVING_ROOM: tRoomType("livingRoom"),
    BEDROOM: tRoomType("bedroom"),
    KITCHEN: tRoomType("kitchen"),
    BATHROOM: tRoomType("bathroom"),
    DINING_ROOM: tRoomType("diningRoom"),
    BALCONY: tRoomType("balcony"),
    STUDY: tRoomType("study"),
    OTHER: tRoomType("other"),
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, type, name }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? t("genericError"));
      }
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-wrap items-end gap-3"
    >
      <div>
        <label
          htmlFor="room-name"
          className="block font-body text-xs font-medium text-ink-soft"
        >
          {t("nameLabel")}
        </label>
        <input
          id="room-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder={t("namePlaceholder")}
          className="mt-1 rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
        />
      </div>
      <div>
        <label
          htmlFor="room-type"
          className="block font-body text-xs font-medium text-ink-soft"
        >
          {t("typeLabel")}
        </label>
        <select
          id="room-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
        >
          {ROOM_TYPE_VALUES.map((value) => (
            <option key={value} value={value}>
              {roomTypeLabels[value]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-sm bg-indigo px-4 py-2 font-body text-sm font-medium text-paper transition-colors hover:bg-indigo-soft disabled:opacity-50"
      >
        {submitting ? t("submitBusy") : t("submitIdle")}
      </button>
      {error ? (
        <p className="w-full font-body text-sm text-alert">{error}</p>
      ) : null}
    </form>
  );
}
