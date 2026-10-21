import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/server/middleware/requireAuth";
import { propertyService } from "@/server/services/propertyService";
import { assetService } from "@/server/services/assetService";

type RenderAsset = {
  id: string;
  type: string;
  contentType: string;
  createdAt: Date;
  designProjectId: string | null;
  designVersion: number | null;
  downloadUrl: string;
};

const IMAGE_TYPES = new Set(["DESIGN_IMAGE", "PANORAMA"]);

// README: a real asset library for past renders - previously there was
// nowhere a customer could browse everything Niwasthan has ever
// rendered for this property; each render only lived inside the one
// design project that produced it. This reads the same real,
// freshly-signed assetService.listRenderLibrary() used by the API
// route, directly from a server component (same pattern as the Budget
// & BOQ page).
export default async function PropertyRendersPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const { userId } = await requireAuth();
  const property = await propertyService.get(propertyId, userId);
  const t = await getTranslations("propertyRenders");
  const assets = await assetService.listRenderLibrary(propertyId, userId);

  return (
    <div className="space-y-8">
      <Link
        href={`/properties/${propertyId}`}
        className="font-body text-sm text-ink-soft hover:text-ink"
      >
        {t("backToProperty", { name: property.name })}
      </Link>

      <section className="rounded-[1.75rem] bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-brass">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.6rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
          {t("heading")}
        </h1>
        <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-paper/65">
          {t("description")}
        </p>
      </section>

      {assets.length === 0 ? (
        <section className="rounded-[1.5rem] border border-ink/10 bg-white p-8 text-center">
          <p className="font-body text-sm text-ink-soft">{t("noRendersYet")}</p>
        </section>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(assets as RenderAsset[]).map((asset) => (
            <a
              key={asset.id}
              href={asset.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-[1.25rem] border border-ink/10 bg-white"
            >
              {IMAGE_TYPES.has(asset.type) ? (
                // A real, freshly-signed per-asset URL, not a static or
                // optimizable path Next's Image component can cache.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.downloadUrl}
                  alt={asset.type}
                  className="aspect-video w-full object-cover transition group-hover:opacity-90"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-paper/70 font-mono text-xs uppercase tracking-[0.12em] text-ink-soft">
                  {asset.type}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 p-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                  {asset.type}
                  {asset.designVersion
                    ? ` · ${t("versionLabel")} ${asset.designVersion}`
                    : ""}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                  {new Date(asset.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
