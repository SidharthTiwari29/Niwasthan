import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/middleware/requireAuth";
import { getCatalogueItem } from "@/server/services/catalogueService";
import { getItemMerits } from "./getItemMerits";

function formatRupees(paise: bigint): string {
  return `₹${(paise / 100n).toLocaleString("en-IN")}`;
}

export default async function CatalogueItemPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  await requireAuth();
  const item = await getCatalogueItem(sku);
  if (!item) notFound();

  const price = item.prices[0];
  const merits = price
    ? getItemMerits(price, item.alternativesConsidered)
    : null;

  return (
    <div>
      <Link
        href="/catalogue"
        className="font-body text-sm text-ink-soft transition-colors hover:text-ink"
      >
        ← Catalogue
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">{item.name}</h1>
      <p className="mt-1 font-mono text-sm text-ink-soft">
        {item.brand ?? "Unbranded"} · {item.category}
        {item.qualityTier ? ` · ${item.qualityTier}` : ""}
        {item.niwasthanRating !== null && item.niwasthanRating !== undefined
          ? ` · ★ ${Number(item.niwasthanRating).toFixed(1)}`
          : ""}
      </p>

      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- real, external manufacturer/dealer image URL, domain unknown ahead of time
        <img
          src={item.imageUrl}
          alt={item.name}
          className="mt-6 max-h-80 w-full max-w-md rounded-sm border border-paper-raised object-contain"
        />
      ) : null}

      {item.description ? (
        <p className="mt-6 max-w-2xl whitespace-pre-line font-body text-sm leading-relaxed text-ink-soft">
          {item.description}
        </p>
      ) : null}

      {item.sourceUrl ? (
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 inline-block font-body text-xs text-laterite hover:underline"
        >
          View the real source listing →
        </a>
      ) : null}

      {price ? (
        <div className="mt-6 flex items-baseline gap-3">
          <span className="font-display text-3xl font-semibold text-ink">
            {formatRupees(price.amountMinor)}
          </span>
          {price.mrpMinor && price.mrpMinor > price.amountMinor ? (
            <span className="font-body text-sm text-ink-soft line-through">
              {formatRupees(price.mrpMinor)}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 font-body text-sm text-ink-soft">
          We haven&apos;t confirmed a price for this yet.
        </p>
      )}

      {merits ? (
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-body text-sm font-semibold text-moss-deep">
              What&apos;s good
            </h2>
            <ul className="mt-3 space-y-2">
              {merits.merits.map((merit) => (
                <li
                  key={merit}
                  className="font-body text-sm leading-relaxed text-ink"
                >
                  {merit}
                </li>
              ))}
              {merits.merits.length === 0 ? (
                <li className="font-body text-sm text-ink-soft">
                  Nothing confirmed yet.
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <h2 className="font-body text-sm font-semibold text-laterite-deep">
              Worth knowing
            </h2>
            <ul className="mt-3 space-y-2">
              {merits.demerits.map((demerit) => (
                <li
                  key={demerit}
                  className="font-body text-sm leading-relaxed text-ink"
                >
                  {demerit}
                </li>
              ))}
              {merits.demerits.length === 0 ? (
                <li className="font-body text-sm text-ink-soft">
                  Nothing to flag.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
