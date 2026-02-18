import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "../../../../../components/common";
import { CURRENCY_OPTIONS, PRICING_MODEL_OPTIONS } from "../wizardConfig";
import { getResourceBehavior } from "../../../../../utils/resourceModel";

/**
 * Step: Pricing — price, currency, price per unit, negotiable.
 */
const StepPricing = ({ formHook }) => {
  const { t } = useTranslation();
  const { form, setField, getFieldClassName, renderFieldError } = formHook;

  const behavior = useMemo(() => getResourceBehavior(form), [form]);

  const pricingModelOptions = useMemo(
    () =>
      PRICING_MODEL_OPTIONS.filter((option) =>
        behavior.allowedPricingModels.includes(option.value),
      ).map((o) => ({
        value: o.value,
        label: t(o.key, { defaultValue: o.value }),
      })),
    [behavior.allowedPricingModels, t],
  );

  const currencyOptions = useMemo(
    () =>
      CURRENCY_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
      })),
    [],
  );

  return (
    <div className="space-y-5">
      {/* Price input with currency */}
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.price")} *
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 dark:text-slate-500">
              $
            </span>
            <input
              required
              type="number"
              min="0"
              max="999999999"
              step="0.01"
              value={form.price}
              placeholder="0.00"
              className={`${getFieldClassName("price")} pl-7`}
              onChange={(e) => setField("price", e.target.value)}
            />
          </div>
          {renderFieldError("price")}
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.currency")}
          </span>
          <Select
            value={form.currency}
            options={currencyOptions}
            size="md"
            onChange={(value) => setField("currency", value)}
          />
        </label>
      </div>

      {/* Pricing model */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.pricingModel", {
            defaultValue: t("propertyForm.fields.pricePer"),
          })}
        </span>
        <div className="flex flex-wrap gap-2">
          {pricingModelOptions.map((option) => {
            const isSelected = form.pricingModel === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setField("pricingModel", option.value)}
                className={`min-h-11 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-400 dark:bg-cyan-900/20 dark:text-cyan-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {renderFieldError("pricingModel")}
      </label>

      {/* Negotiable */}
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-slate-600"
          checked={form.priceNegotiable}
          onChange={(e) => setField("priceNegotiable", e.target.checked)}
        />
        <span className="font-medium">
          {t("propertyForm.fields.priceNegotiable")}
        </span>
      </label>
    </div>
  );
};

export default StepPricing;
