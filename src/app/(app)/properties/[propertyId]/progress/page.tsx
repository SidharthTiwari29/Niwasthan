import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/middleware/requireAuth";
import { getPropertyLifecycle } from "@/server/services/propertyLifecycleService";
import { ExecutionReview } from "./ExecutionReview";

const stages = ["Design lock", "BOQ / quote", "Purchase", "Delivery", "Installation", "Quality / snags", "Handover"] as const;

function stageState(stage: (typeof stages)[number], requests: NonNullable<Awaited<ReturnType<typeof getPropertyLifecycle>>>["requests"]) {
  const request = requests[0];
  const order = request?.orders[0];
  const execution = order?.executions[0];
  if (stage === "BOQ / quote") return request ? (request.quoteCount > 0 ? "active" : "started") : "not-started";
  if (stage === "Purchase") return order ? "complete" : request?.status === "ORDERED" ? "active" : "not-started";
  if (stage === "Delivery") return order?.status === "DELIVERED" ? "complete" : order ? "active" : "not-started";
  if (stage === "Installation") return execution?.status === "COMPLETED" || execution?.status === "RESOLVED" ? "complete" : execution ? "active" : "not-started";
  if (stage === "Quality / snags") return execution?.status === "SNAGGED" ? "attention" : execution?.status === "RESOLVED" ? "complete" : "not-started";
  if (stage === "Handover") return execution?.status === "RESOLVED" ? "ready" : "not-started";
  return "not-started";
}

export default async function PropertyProgressPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;
  const { userId } = await requireAuth();
  const lifecycle = await getPropertyLifecycle(propertyId, userId);
  if (!lifecycle) notFound();

  const request = lifecycle.requests[0];
  const order = request?.orders[0];
  const execution = order?.executions[0];
  const statusCopy: Record<string, string> = {
    complete: "Complete",
    active: "In progress",
    started: "Started",
    attention: "Needs your attention",
    ready: "Ready to review",
    "not-started": "Not started",
  };

  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href={`/properties/${propertyId}`} className="font-body text-sm text-ink-soft hover:text-ink">← Back to {lifecycle.name}</Link><Link href={`/properties/${propertyId}/memory`} className="font-body text-sm font-semibold text-laterite hover:underline">Open Home Memory →</Link></div>
    <section className="rounded-[1.75rem] bg-ink px-6 py-8 text-paper md:px-10 md:py-10"><p className="font-mono text-[9px] uppercase tracking-[0.24em] text-brass">Build & handover</p><h1 className="mt-4 max-w-3xl font-display text-[clamp(2.8rem,7vw,5.8rem)] font-semibold leading-[0.86] tracking-[-0.06em]">Know what happens after the beautiful choice.</h1><p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-paper/65">Every state below comes from the project record. Unknown does not mean delayed; it means Niwasthan has no authoritative update yet.</p></section>
    <section className="rounded-[1.5rem] border border-ink/10 bg-white p-6 md:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">Project lifecycle</p><h2 className="mt-2 font-display text-3xl font-semibold">From lock to handover</h2></div><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">{lifecycle.requests.length} procurement record{lifecycle.requests.length === 1 ? "" : "s"}</span></div><ol className="mt-7 grid gap-3 md:grid-cols-7">{stages.map((stage, index) => { const state = stageState(stage, lifecycle.requests); return <li key={stage} className="rounded-2xl bg-paper/70 p-4"><div className={`grid h-8 w-8 place-items-center rounded-full font-mono text-xs ${state === "complete" ? "bg-moss text-paper" : state === "attention" ? "bg-alert text-paper" : state === "active" || state === "ready" ? "bg-brass text-ink" : "bg-paper-raised text-ink-soft"}`}>{index + 1}</div><p className="mt-4 font-body text-sm font-semibold text-ink">{stage}</p><p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">{statusCopy[state]}</p></li>; })}</ol></section>
    <div className="grid gap-5 md:grid-cols-2"><section className="rounded-[1.5rem] border border-ink/10 bg-white p-6"><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">Quote evidence</p><h2 className="mt-2 font-display text-2xl font-semibold">{request?.quoteCount ? `${request.quoteCount} quote${request.quoteCount === 1 ? "" : "s"} received` : "No quote received yet"}</h2>{request?.quotes.length ? <ul className="mt-5 divide-y divide-paper-raised">{request.quotes.slice(0, 4).map((quote) => <li key={quote.id} className="flex items-center justify-between gap-3 py-3"><span><span className="block font-body text-sm font-medium">{quote.supplierName}</span><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">{quote.status}</span></span><span className="font-display text-lg font-semibold">₹{Math.round(quote.totalAmountMinor / 100).toLocaleString("en-IN")}</span></li>)}</ul> : <p className="mt-3 font-body text-sm leading-relaxed text-ink-soft">Procurement becomes available after a budget is locked. Niwasthan will not imply that a quote exists before a supplier submits one.</p>}</section><section className="rounded-[1.5rem] bg-[#e9e1d5] p-6"><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">Execution truth</p><h2 className="mt-2 font-display text-2xl font-semibold">{execution ? execution.status.replaceAll("_", " ") : "Awaiting execution record"}</h2><p className="mt-3 font-body text-sm leading-relaxed text-ink-soft">{execution?.snagNotes ? `Latest issue: ${execution.snagNotes}` : "Delivery, installation, quality checks, and snags will appear here when the execution record changes."}</p>{execution?.scheduledDate ? <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Scheduled {new Date(execution.scheduledDate).toLocaleDateString("en-IN")}</p> : null}</section></div>
    <ExecutionReview propertyId={propertyId} execution={execution} />
  </div>;
}
