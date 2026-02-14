import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "../../../../../components/common";
import { FURNISHED_OPTIONS, RENT_PERIOD_OPTIONS } from "../wizardConfig";

/**
 * Step: Rental Terms (only for operationType === "rent").
 * Furnished status, pets allowed, rent period.
 */
const StepRentalTerms = ({ formHook }) => {
  const { t } = useTranslation();
  const { form, setField, renderFieldError } = formHook;

  const furnishedOptions = useMemo(
    () => FURNISHED_OPTIONS.map((o) => ({ value: o.value, label: t(o.key) })),
    [t],
  );

  const rentPeriodOptions = useMemo(
    () => RENT_PERIOD_OPTIONS.map((o) => ({ value: o.value, label: t(o.key) })),
    [t],
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t("propertyForm.wizard.rentalTermsHint")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Rent period */}
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.rentPeriod")}
          </span>
          <Select
            value={form.rentPeriod}
            options={rentPeriodOptions}
            size="md"
            onChange={(value) => setField("rentPeriod", value)}
          />
          {renderFieldError("rentPeriod")}
        </label>

        {/* Furnished */}
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.furnished")}
          </span>
          <Select
            value={form.furnished}
            options={furnishedOptions}
            size="md"
            onChange={(value) => setField("furnished", value)}
          />
          {renderFieldError("furnished")}
        </label>
      </div>

      {/* Pets allowed */}
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-slate-600"
          checked={form.petsAllowed}
          onChange={(e) => setField("petsAllowed", e.target.checked)}
        />
        <span className="font-medium">
          {t("propertyForm.fields.petsAllowed")}
        </span>
      </label>
    </div>
  );
};

export default StepRentalTerms;
