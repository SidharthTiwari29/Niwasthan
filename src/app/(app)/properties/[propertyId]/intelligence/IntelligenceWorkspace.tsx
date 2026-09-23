"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type Message = { role: "user" | "assistant"; content: string };
type IntelligenceWorkspaceProps = { propertyId: string; propertyName: string };

export function IntelligenceWorkspace({
  propertyId,
  propertyName,
}: IntelligenceWorkspaceProps) {
  const t = useTranslations("intelligenceWorkspace");
  const [intelligence, setIntelligence] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [smartHome, setSmartHome] = useState<Record<string, unknown> | null>(
    null,
  );
  const [budget, setBudget] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [smartLighting, setSmartLighting] = useState(false);
  const [whatIf, setWhatIf] = useState({
    baseVersion: "1",
    currentPrice: "",
    proposedPrice: "",
    reason: "Explore a lower-maintenance alternative",
  });
  const [whatIfResult, setWhatIfResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/properties/${propertyId}/intelligence`).then((response) =>
        response.json(),
      ),
      fetch(`/api/properties/${propertyId}/smart-home`).then((response) =>
        response.json(),
      ),
      fetch(`/api/properties/${propertyId}/budget`).then((response) =>
        response.json(),
      ),
    ])
      .then(([intelligenceResponse, smartHomeResponse, budgetResponse]) => {
        if (!active) return;
        setIntelligence(intelligenceResponse.property ?? null);
        const plan = smartHomeResponse.result as Record<string, unknown> | null;
        setSmartHome(plan);
        const capabilities = Array.isArray(plan?.capabilities)
          ? plan.capabilities
          : [];
        setSmartLighting(
          capabilities.some(
            (capability) =>
              (capability as Record<string, unknown>).id === "SMART_LIGHTING" &&
              (capability as Record<string, unknown>).enabled === true,
          ),
        );
        setBudget(budgetResponse.budget ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          setNotice(t("someSourcesCouldNotLoad"));
        }
      });
    return () => {
      active = false;
    };
  }, [propertyId, t]);

  const intelligenceEntries = useMemo(
    () =>
      intelligence
        ? Object.entries(intelligence)
            .filter(
              ([key]) =>
                !["id", "propertyId", "createdAt", "updatedAt"].includes(key),
            )
            .slice(0, 8)
        : [],
    [intelligence],
  );
  const budgetVersion = (
    budget?.versions as Array<Record<string, unknown>> | undefined
  )?.[0];

  async function saveSmartHome() {
    setNotice(null);
    const currentCapabilities = Array.isArray(smartHome?.capabilities)
      ? (smartHome.capabilities as Array<Record<string, unknown>>)
      : [];
    const nextCapabilities = currentCapabilities.filter(
      (capability) => capability.id !== "SMART_LIGHTING",
    );
    nextCapabilities.push({
      id: "SMART_LIGHTING",
      enabled: smartLighting,
      roomIds: [],
      configuration: {},
    });
    const response = await fetch(`/api/properties/${propertyId}/smart-home`, {
      method: smartHome ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        capabilities: nextCapabilities,
        scenarios: smartHome?.scenarios ?? [],
        visualizationState: smartHome?.visualizationState ?? "PREVIEW",
        budgetMinor: smartHome?.budgetMinor ?? null,
        notes: "Saved from the property intelligence workspace",
      }),
    });
    if (!response.ok) {
      setNotice(t("smartHomeSaveError"));
      return;
    }
    const body = await response.json();
    setSmartHome(body.result);
    setNotice(t("smartHomeSaved"));
  }

  async function runWhatIf() {
    setNotice(null);
    setWhatIfResult(null);
    const currentPriceMinor = whatIf.currentPrice
      ? Math.round(Number(whatIf.currentPrice) * 100)
      : null;
    const proposedPriceMinor = whatIf.proposedPrice
      ? Math.round(Number(whatIf.proposedPrice) * 100)
      : null;
    const response = await fetch(`/api/properties/${propertyId}/what-if`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "preview",
        baseVersion: Number(whatIf.baseVersion),
        currentPriceMinor,
        proposedPriceMinor,
        scopeChange: "MODIFY",
        reason: whatIf.reason,
        designImpact: "UNKNOWN",
        functionImpact: "UNKNOWN",
        inputs: { source: "property-intelligence-workspace" },
        candidates: [],
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setNotice(body.error?.message ?? t("whatIfPreviewError"));
      return;
    }
    setWhatIfResult(body.result);
    setNotice(t("whatIfPreviewCalculated"));
  }

  async function askHumsafar() {
    const trimmed = question.trim();
    if (!trimmed || assistantBusy) return;
    const nextMessages = [
      ...messages,
      { role: "user" as const, content: trimmed },
    ];
    setMessages(nextMessages);
    setQuestion("");
    setAssistantBusy(true);
    setNotice(null);
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });
    const body = await response.json().catch(() => ({}));
    setAssistantBusy(false);
    if (!response.ok) {
      setNotice(body.error?.message ?? t("humsafarNotConfigured"));
      return;
    }
    setMessages([...nextMessages, { role: "assistant", content: body.reply }]);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-laterite">
          {t("eyebrowHomeIntelligence")}
        </p>
        <h1 className="mt-3 font-display text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[0.86] tracking-[-0.06em]">
          {t("heading", { name: propertyName })}
        </h1>
        <p className="mt-5 max-w-2xl font-body text-base leading-relaxed text-ink-soft">
          {t("description")}
        </p>
      </div>
      {notice ? (
        <p
          role="status"
          className="rounded-2xl border border-brass/30 bg-brass/10 px-5 py-4 font-body text-sm text-ink"
        >
          {notice}
        </p>
      ) : null}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-8 font-body text-sm text-ink-soft">
          {t("loadingContext")}
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-laterite">
                {t("homeTruthLabel")}
              </p>
              <p className="mt-3 font-display text-3xl font-semibold">
                {intelligence ? t("available") : t("unknown")}
              </p>
              <p className="mt-2 font-body text-xs leading-relaxed text-ink-soft">
                {intelligenceEntries.length
                  ? t("recordedFieldsAvailable", {
                      count: intelligenceEntries.length,
                    })
                  : t("noIntelligenceRecordYet")}
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-laterite">
                {t("budgetBasisLabel")}
              </p>
              <p className="mt-3 font-display text-3xl font-semibold">
                {budgetVersion?.totalTargetMinor
                  ? `₹${(Number(budgetVersion.totalTargetMinor) / 100).toLocaleString("en-IN")}`
                  : t("unknown")}
              </p>
              <p className="mt-2 font-body text-xs leading-relaxed text-ink-soft">
                {t("targetOnlyNote")}
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-laterite">
                {t("immersiveLabel")}
              </p>
              <p className="mt-3 font-display text-3xl font-semibold">
                {t("planGated")}
              </p>
              <p className="mt-2 font-body text-xs leading-relaxed text-ink-soft">
                {t("immersiveDescription")}
              </p>
            </div>
          </section>
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[1.5rem] bg-ink p-6 text-paper md:p-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brass">
                {t("whatIfSavingsLabel")}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold">
                {t("whatIfHeading")}
              </h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-paper/65">
                {t("whatIfDescription")}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <input
                  value={whatIf.baseVersion}
                  onChange={(event) =>
                    setWhatIf({ ...whatIf, baseVersion: event.target.value })
                  }
                  inputMode="numeric"
                  aria-label="Budget version"
                  placeholder={t("versionPlaceholder")}
                  className="rounded-xl border border-paper/15 bg-paper/10 px-3 py-3 font-body text-sm text-paper outline-none"
                />
                <input
                  value={whatIf.currentPrice}
                  onChange={(event) =>
                    setWhatIf({ ...whatIf, currentPrice: event.target.value })
                  }
                  inputMode="decimal"
                  aria-label="Current price"
                  placeholder={t("currentPricePlaceholder")}
                  className="rounded-xl border border-paper/15 bg-paper/10 px-3 py-3 font-body text-sm text-paper outline-none"
                />
                <input
                  value={whatIf.proposedPrice}
                  onChange={(event) =>
                    setWhatIf({ ...whatIf, proposedPrice: event.target.value })
                  }
                  inputMode="decimal"
                  aria-label="Proposed price"
                  placeholder={t("proposedPricePlaceholder")}
                  className="rounded-xl border border-paper/15 bg-paper/10 px-3 py-3 font-body text-sm text-paper outline-none"
                />
              </div>
              <input
                value={whatIf.reason}
                onChange={(event) =>
                  setWhatIf({ ...whatIf, reason: event.target.value })
                }
                aria-label="What-if reason"
                className="mt-3 w-full rounded-xl border border-paper/15 bg-paper/10 px-3 py-3 font-body text-sm text-paper outline-none"
              />
              <button
                onClick={runWhatIf}
                className="mt-4 rounded-full bg-brass px-5 py-3 font-body text-sm font-semibold text-ink"
              >
                {t("previewChange")}
              </button>
              {whatIfResult ? (
                <pre className="mt-5 overflow-auto rounded-xl bg-black/20 p-4 font-mono text-[10px] text-paper/75">
                  {JSON.stringify(whatIfResult, null, 2)}
                </pre>
              ) : null}
            </div>
            <div className="rounded-[1.5rem] border border-ink/10 bg-white p-6 md:p-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">
                {t("smartHomeLabel")}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold">
                {t("smartHomeHeading")}
              </h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-ink-soft">
                {t("smartHomeDescription")}
              </p>
              <label className="mt-6 flex items-center justify-between rounded-2xl bg-paper px-4 py-4">
                <span>
                  <span className="block font-body text-sm font-semibold">
                    {t("smartLightingLabel")}
                  </span>
                  <span className="mt-1 block font-body text-xs text-ink-soft">
                    {t("smartLightingDescription")}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={smartLighting}
                  onChange={(event) => setSmartLighting(event.target.checked)}
                  className="h-5 w-5 accent-laterite"
                />
              </label>
              <button
                onClick={saveSmartHome}
                className="mt-4 rounded-full bg-ink px-5 py-3 font-body text-sm font-semibold text-paper"
              >
                {t("savePreviewPlan")}
              </button>
            </div>
          </section>
          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.5rem] border border-ink/10 bg-white p-6 md:p-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">
                {t("groundedContextLabel")}
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold">
                {t("whatNiwasthanKnows")}
              </h2>
              {intelligenceEntries.length ? (
                <dl className="mt-5 space-y-3">
                  {intelligenceEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-4 border-b border-paper-raised pb-3"
                    >
                      <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                        {key.replaceAll(/([A-Z])/g, " $1")}
                      </dt>
                      <dd className="max-w-[60%] text-right font-body text-sm text-ink">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value ?? t("unknown"))}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-4 font-body text-sm leading-relaxed text-ink-soft">
                  {t("noConfirmedIntelligence")}
                </p>
              )}
            </div>
            <div className="rounded-[1.5rem] bg-[#e9e1d5] p-6 md:p-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-laterite">
                {t("humsafarLabel")}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold">
                {t("askAboutThisHome")}
              </h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-ink-soft">
                {t("humsafarDescription")}
              </p>
              <div className="mt-5 max-h-64 space-y-3 overflow-auto">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-2xl px-4 py-3 font-body text-sm leading-relaxed ${message.role === "user" ? "ml-8 bg-ink text-paper" : "mr-8 bg-white text-ink"}`}
                  >
                    {message.content}
                  </div>
                ))}
                {messages.length === 0 ? (
                  <p className="rounded-2xl bg-white px-4 py-4 font-body text-sm text-ink-soft">
                    {t("humsafarSamplePrompt")}
                  </p>
                ) : null}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void askHumsafar();
                  }}
                  placeholder={t("askHumsafarPlaceholder")}
                  className="min-w-0 flex-1 rounded-full border border-ink/15 bg-white px-4 py-3 font-body text-sm outline-none"
                />
                <button
                  disabled={assistantBusy}
                  onClick={() => void askHumsafar()}
                  className="rounded-full bg-ink px-4 py-3 font-body text-xs font-semibold text-paper disabled:opacity-50"
                >
                  {assistantBusy ? "…" : t("askButton")}
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
