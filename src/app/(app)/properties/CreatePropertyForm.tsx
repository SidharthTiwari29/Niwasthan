"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

const PROPERTY_TYPE_VALUES = [
  "",
  "ONE_BHK",
  "TWO_BHK",
  "THREE_BHK",
  "FOUR_BHK",
  "VILLA",
  "OTHER",
] as const;

const MIN_BUDGET = 100_000; // Rs 1,00,000 - a real, sensible floor for a real renovation
const MAX_BUDGET = 5_000_000; // Rs 50,00,000 - a real, generous ceiling for the slider's range
const BUDGET_STEP = 50_000;

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function CreatePropertyForm() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [projectName, setProjectName] = useState("");
  const [budget, setBudget] = useState(1_000_000);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const propertyTypeLabels: Record<string, string> = {
    "": t("propertyTypeSelect"),
    ONE_BHK: t("propertyTypeOneBhk"),
    TWO_BHK: t("propertyTypeTwoBhk"),
    THREE_BHK: t("propertyTypeThreeBhk"),
    FOUR_BHK: t("propertyTypeFourBhk"),
    VILLA: t("propertyTypeVilla"),
    OTHER: t("propertyTypeOther"),
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Step 1: the real property record - name, city, type, and the
      // real, stated budget, all captured once here rather than across
      // several separate later steps.
      const propertyResponse = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          city: city.trim() || undefined,
          propertyType: propertyType || undefined,
          targetBudget: budget,
        }),
      });
      if (!propertyResponse.ok) {
        const body = await propertyResponse.json().catch(() => null);
        throw new Error(body?.error?.message ?? t("genericError"));
      }
      const { property } = await propertyResponse.json();

      // Step 2: a real design project under this property, using the
      // real project name given here - the same real, existing design-
      // project system, just created as part of this one combined flow
      // instead of a separate later screen.
      if (projectName.trim()) {
        await fetch("/api/design-projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: property.id,
            name: projectName,
          }),
        });
      }

      router.push(`/properties/${property.id}/floor-plan`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5 max-w-md">
      <div>
        <label
          htmlFor="property-name"
          className="block font-body text-sm font-medium text-ink"
        >
          {t("nameLabel")}
        </label>
        <input
          id="property-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder={t("namePlaceholder")}
          className="mt-1 w-full rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="property-city"
            className="block font-body text-sm font-medium text-ink"
          >
            {t("cityLabel")}
          </label>
          <input
            id="property-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("cityPlaceholder")}
            className="mt-1 w-full rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
          />
        </div>
        <div>
          <label
            htmlFor="property-type"
            className="block font-body text-sm font-medium text-ink"
          >
            {t("propertyTypeLabel")}
          </label>
          <select
            id="property-type"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="mt-1 w-full rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
          >
            {PROPERTY_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {propertyTypeLabels[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="project-name"
          className="block font-body text-sm font-medium text-ink"
        >
          {t("projectNameLabel")}
        </label>
        <input
          id="project-name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder={t("projectNamePlaceholder")}
          className="mt-1 w-full rounded-sm border border-ink/15 bg-white px-3 py-2 font-body text-sm text-ink outline-none focus-visible:border-laterite"
        />
        <p className="mt-1 font-body text-xs text-ink-soft">
          {t("projectNameHelp")}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="property-budget"
            className="block font-body text-sm font-medium text-ink"
          >
            {t("budgetLabel")}
          </label>
          <span className="font-body text-sm font-semibold text-ink">
            {formatRupees(budget)}
          </span>
        </div>
        <input
          id="property-budget"
          type="range"
          min={MIN_BUDGET}
          max={MAX_BUDGET}
          step={BUDGET_STEP}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="mt-2 w-full accent-laterite"
        />
        <div className="mt-1 flex justify-between font-mono text-xs text-ink-soft">
          <span>{formatRupees(MIN_BUDGET)}</span>
          <span>{formatRupees(MAX_BUDGET)}</span>
        </div>
        <p className="mt-1 font-body text-xs text-ink-soft">
          {t("budgetHelp")}
        </p>
      </div>

      <p className="font-body text-xs text-ink-soft">{t("floorPlanNote")}</p>
      {error ? <p className="font-body text-sm text-alert">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded-sm bg-laterite px-5 py-2.5 font-body text-sm font-medium text-paper transition-colors hover:bg-laterite-deep disabled:opacity-50"
      >
        {submitting ? t("submitBusy") : t("submitIdle")}
      </button>
    </form>
  );
}
