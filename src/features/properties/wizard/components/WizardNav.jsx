import React from "react";

/**
 * WizardNav
 * Minimal mobile-first header:
 * - Title
 * - Progress indicator (step X of Y)
 * - Back + Cancel
 */
export default function WizardNav({
  title,
  t,
  stepIndex,
  steps,
  onBack,
  onCancel,
  isSaving,
}) {
  const total = Array.isArray(steps) ? steps.length : 0;
  const current = Math.min(stepIndex + 1, total);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                disabled={isSaving}
                className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("wizard.actions.back")}
              </button>
            ) : null}

            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="h-9 rounded-lg px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t("common.cancel")}
              </button>
            ) : null}
          </div>

          <h2 className="mt-2 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {total > 0 ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{`${current}/${total}`}</p>
          ) : null}
        </div>

        {/* Progress bar */}
        {total > 1 ? (
          <div className="hidden w-40 md:block">
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-2 rounded-full bg-primary-600"
                style={{ width: `${Math.round((current / total) * 100)}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
