"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type RoomOption = { id: string; name: string };

export function CreateDesignProjectForm({
  propertyId,
  rooms,
}: {
  propertyId: string;
  rooms: RoomOption[];
}) {
  const router = useRouter();
  const t = useTranslations("createDesignProjectForm");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/design-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          roomId: roomId || undefined,
          name,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? t("genericError"));
      }
      const { project } = await response.json();
      router.push(`/designs/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
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
          htmlFor="design-name"
          className="block font-body text-xs font-medium text-ink-soft"
        >
          {t("nameLabel")}
        </label>
        <input
          id="design-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder={t("namePlaceholder")}
          className="mt-1 rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
        />
      </div>
      {rooms.length > 0 ? (
        <div>
          <label
            htmlFor="design-room"
            className="block font-body text-xs font-medium text-ink-soft"
          >
            {t("roomLabel")}
          </label>
          <select
            id="design-room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="mt-1 rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
          >
            <option value="">{t("wholeProperty")}</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
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
