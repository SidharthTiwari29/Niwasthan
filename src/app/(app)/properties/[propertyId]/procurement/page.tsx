import Link from "next/link";
import { requireAuth } from "@/server/middleware/requireAuth";
import { procurementService } from "@/server/services/procurementService";

const REQUEST_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  RFQ_SENT: "Requesting quotes",
  QUOTES_RECEIVED: "Quotes received",
  ORDERED: "Ordered",
  CANCELLED: "Cancelled",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PLACED: "Order placed",
  CONFIRMED: "Confirmed by supplier",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const EXECUTION_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  SNAGGED: "Issue found",
  RESOLVED: "Resolved",
};

function formatRupees(minor: bigint | string): string {
  return `₹${(BigInt(minor) / 100n).toLocaleString("en-IN")}`;
}

type Quote = {
  id: string;
  supplierName: string;
  totalAmountMinor: bigint;
  currency: string;
  status: string;
  validUntil: Date | null;
  notes: string | null;
  createdAt: Date;
};

type ExecutionRecord = {
  id: string;
  status: string;
  scheduledDate: Date | null;
  completedAt: Date | null;
  snagNotes: string | null;
};

type Order = {
  id: string;
  status: string;
  totalAmountMinor: bigint;
  currency: string;
  placedAt: Date;
  deliveredAt: Date | null;
  executions: ExecutionRecord[];
};

type ProcurementRequest = {
  id: string;
  status: string;
  createdAt: Date;
  quotes: Quote[];
  orders: Order[];
};

export default async function ProcurementPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const { userId } = await requireAuth();
  const requests = (await procurementService.listForProperty(
    propertyId,
    userId,
  )) as ProcurementRequest[];

  return (
    <div>
      <Link
        href={`/properties/${propertyId}`}
        className="font-body text-sm text-ink-soft transition-colors hover:text-ink"
      >
        ← Back to home
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        Track your order
      </h1>
      <p className="mt-2 max-w-xl font-body text-sm text-ink-soft">
        Every real step from requesting quotes through delivery and
        installation, in order. Nothing here is confirmed until the real status
        says so.
      </p>

      {requests.length === 0 ? (
        <div className="mt-10 rounded-sm border border-dashed border-ink/20 px-8 py-12 text-center">
          <p className="font-body text-sm text-ink-soft">
            No procurement has started for this home yet. This begins once you
            lock a budget.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-8">
          {requests.map((request) => {
            const order = request.orders[0];
            return (
              <li
                key={request.id}
                className="rounded-sm border border-paper-raised p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm font-semibold text-ink">
                    {REQUEST_STATUS_LABELS[request.status] ?? request.status}
                  </span>
                  <span className="font-mono text-xs text-ink-soft">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {request.quotes.length > 0 ? (
                  <div className="mt-4">
                    <h2 className="font-body text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Quotes received
                    </h2>
                    <ul className="mt-2 divide-y divide-paper-raised">
                      {request.quotes.map((quote) => (
                        <li
                          key={quote.id}
                          className="flex items-center justify-between py-2"
                        >
                          <div>
                            <p className="font-body text-sm text-ink">
                              {quote.supplierName}
                            </p>
                            <p className="font-mono text-xs text-ink-soft">
                              {quote.status === "ACCEPTED"
                                ? "Accepted"
                                : quote.status === "REJECTED"
                                  ? "Rejected"
                                  : quote.status === "EXPIRED"
                                    ? "Expired"
                                    : "Awaiting your decision"}
                            </p>
                          </div>
                          <span className="font-body text-sm font-medium text-ink">
                            {formatRupees(quote.totalAmountMinor)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {order ? (
                  <div className="mt-4 border-t border-paper-raised pt-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-body text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Order
                      </h2>
                      <span className="font-body text-sm font-medium text-ink">
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="mt-1 font-body text-sm text-ink-soft">
                      {formatRupees(order.totalAmountMinor)} · placed{" "}
                      {new Date(order.placedAt).toLocaleDateString()}
                    </p>

                    {order.executions.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {order.executions.map((execution) => (
                          <li
                            key={execution.id}
                            className={`rounded-sm px-3 py-2 font-body text-sm ${
                              execution.status === "SNAGGED"
                                ? "bg-alert/10 text-alert"
                                : "bg-paper-raised/40 text-ink"
                            }`}
                          >
                            <p className="font-medium">
                              {EXECUTION_STATUS_LABELS[execution.status] ??
                                execution.status}
                            </p>
                            {execution.snagNotes ? (
                              <p className="mt-1 text-xs">
                                {execution.snagNotes}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
