"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function FloorPlanUploadForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const t = useTranslations("floorPlan");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      // Step 1: a real, signed upload grant tied to this property -
      // the property-level asset parent added specifically to make
      // this possible before any design work exists yet.
      const assetResponse = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FLOOR_PLAN",
          contentType: file.type,
          sizeBytes: file.size,
          propertyId,
        }),
      });
      if (!assetResponse.ok) {
        const body = await assetResponse.json().catch(() => null);
        throw new Error(body?.error?.message ?? t("errorStartUpload"));
      }
      const { asset, grant } = await assetResponse.json();

      // Step 2: the actual file bytes go directly to real object
      // storage via the signed URL - never through this app's own
      // server, which never sees or stores the raw file itself.
      const uploadResponse = await fetch(grant.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error(t("errorUploadFailed"));
      }

      // Step 3: the real FloorPlan record, referencing the asset that
      // now genuinely exists in storage.
      const floorPlanResponse = await fetch("/api/floor-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, assetId: asset.id }),
      });
      if (!floorPlanResponse.ok) {
        const body = await floorPlanResponse.json().catch(() => null);
        throw new Error(body?.error?.message ?? t("errorSaveFailed"));
      }

      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h2 className="font-body text-sm font-semibold text-ink">
        {t("uploadHeading")}
      </h2>
      <div className="mt-3 flex items-center gap-3">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="font-body text-sm text-ink-soft"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="rounded-sm bg-indigo px-5 py-2.5 font-body text-sm font-medium text-paper transition-colors hover:bg-indigo-soft disabled:opacity-50"
        >
          {uploading ? t("uploadBusy") : t("uploadIdle")}
        </button>
      </div>
      {error ? (
        <p className="mt-3 font-body text-sm text-alert">{error}</p>
      ) : null}
    </div>
  );
}
