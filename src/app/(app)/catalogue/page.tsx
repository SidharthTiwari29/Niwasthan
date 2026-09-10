import Link from "next/link";
import {
  listCatalogue,
  countCatalogue,
  listCatalogueCategories,
} from "@/server/services/catalogueService";
import { requireAuth } from "@/server/middleware/requireAuth";

type CatalogueItemSummary = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  category: string;
  imageUrl: string | null;
  qualityTier: string | null;
  // Prisma's real type here is Decimal, not a plain number - converted
  // via Number() at render time below rather than typed as number,
  // to avoid a real mismatch against what the query actually returns.
  niwasthanRating: unknown;
  prices: Array<{ amountMinor: bigint }>;
};

function formatRupees(paise: bigint): string {
  return `₹${(paise / 100n).toLocaleString("en-IN")}`;
}

const PAGE_SIZE = 30;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    page?: string;
    q?: string;
  }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const category = params.category || undefined;
  const search = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [items, total, categories] = await Promise.all([
    listCatalogue(category, page, search),
    countCatalogue(category, search),
    listCatalogueCategories(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (search) qs.set("q", search);
    if (targetPage > 1) qs.set("page", String(targetPage));
    const query = qs.toString();
    return query ? `/catalogue?${query}` : "/catalogue";
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Catalogue</h1>
      <p className="mt-2 max-w-xl font-body text-sm text-ink-soft">
        Every product here has a real, verified price. If we haven&apos;t
        confirmed something yet, we say so instead of guessing.
      </p>

      <form
        className="mt-6 flex flex-wrap items-center gap-3"
        action="/catalogue"
      >
        <input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search products…"
          className="min-w-[220px] rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
        >
          <option value="">All categories</option>
          {categories.map((c: string) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm bg-indigo px-4 py-2 font-body text-sm font-medium text-paper transition-colors hover:bg-indigo-soft"
        >
          Filter
        </button>
        {category || search ? (
          <Link
            href="/catalogue"
            className="font-body text-xs text-ink-soft hover:text-ink"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <p className="mt-4 font-mono text-xs text-ink-soft">
        {total} {total === 1 ? "product" : "products"}
        {category ? ` in ${category}` : ""}
        {search ? ` matching "${search}"` : ""}
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-sm border border-dashed border-ink/20 px-8 py-12 text-center">
          <p className="font-body text-sm text-ink-soft">
            No products match this search yet.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-paper-raised">
          {items.map((item: CatalogueItemSummary) => {
            const price = item.prices[0];
            return (
              <li key={item.id} className="py-4">
                <Link
                  href={`/catalogue/${item.sku}`}
                  className="group flex items-center gap-4"
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- real, external manufacturer/dealer image URLs, domain unknown ahead of time
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-14 w-14 flex-shrink-0 rounded-sm border border-paper-raised object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 flex-shrink-0 rounded-sm border border-dashed border-paper-raised" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-base font-medium text-ink group-hover:text-laterite">
                      {item.name}
                    </p>
                    <p className="mt-1 font-mono text-xs text-ink-soft">
                      {item.brand ?? "Unbranded"} · {item.category}
                      {item.qualityTier ? ` · ${item.qualityTier}` : ""}
                      {item.niwasthanRating !== null &&
                      item.niwasthanRating !== undefined
                        ? ` · ★ ${Number(item.niwasthanRating).toFixed(1)}`
                        : ""}
                    </p>
                  </div>
                  <span className="flex-shrink-0 font-body text-sm font-medium text-ink">
                    {price ? formatRupees(price.amountMinor) : "Price unknown"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-between font-body text-sm">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="text-laterite hover:underline"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-ink-soft">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="text-laterite hover:underline"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}
