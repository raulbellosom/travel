import React, { useMemo } from "react";

/**
 * WizardReview
 * Human-readable preview of what will be saved.
 */
export default function WizardReview({ profile, formState, context, t }) {
  const categoryLabel = useMemo(() => {
    const options = profile?.getCategoryOptions?.({ t });
    const selected = (Array.isArray(options) ? options : []).find(
      (item) => item.id === context?.category,
    );
    return selected?.label || context?.category || "-";
  }, [profile, t, context?.category]);

  const resourceTypeLabel = context?.resourceType
    ? t(`propertyForm.options.resourceType.${context.resourceType}`)
    : "-";

  const summary = useMemo(() => {
    try {
      return profile.toSchemaPatch({ formState, context });
    } catch {
      return null;
    }
  }, [profile, formState, context]);

  if (!summary) {
    return (
      <div className="text-sm text-slate-600 dark:text-slate-300">
        {t("wizard.errors.missingProfile")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("wizard.steps.review.title")}
        </div>
        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          {t("wizard.steps.review.description")}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoCard
          label={t("propertyForm.fields.resourceType")}
          value={resourceTypeLabel}
        />
        <InfoCard label={t("propertyForm.fields.category")} value={categoryLabel} />
        <InfoCard
          label={t("wizard.fields.price.label")}
          value={summary.price != null ? String(summary.price) : "-"}
        />
        <InfoCard label={t("wizard.fields.currency.label")} value={summary.currency || "-"} />
      </div>

      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {t("wizard.fields.title.label")}
        </div>
        <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {summary.title || "-"}
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {t("wizard.fields.description.label")}
        </div>
        <div className="mt-0.5 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
          {summary.description || "-"}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value || "-"}
      </div>
    </div>
  );
}
