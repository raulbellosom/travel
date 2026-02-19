import { useTranslation } from "react-i18next";
import { Select } from "../../../../../components/common";
import { getResourceFieldLabel } from "../../../../../utils/resourceFormProfile";

const StepRentalTerms = ({ formHook }) => {
  const { t } = useTranslation();
  const {
    resourceFormProfile,
    getResourceFieldValue,
    setResourceFieldValue,
    getFieldClassName,
    renderFieldError,
  } = formHook;

  const fields = resourceFormProfile.rentalTerms;

  if (fields.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {t("propertyForm.wizard.noSpecificRentalTerms", {
          defaultValue:
            "Este tipo de recurso no requiere terminos adicionales para renta larga.",
        })}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t("propertyForm.wizard.rentalTermsHint")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const value = getResourceFieldValue(field.key);
          const fieldLabel = getResourceFieldLabel(field, t, {
            commercialMode: resourceFormProfile.commercialMode,
          });

          if (field.inputType === "boolean") {
            return (
              <div key={field.key} className="sm:col-span-2">
                <label className="inline-flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-slate-600"
                    checked={Boolean(value)}
                    onChange={(event) =>
                      setResourceFieldValue(field.key, event.target.checked)
                    }
                  />
                  <span className="font-medium">{fieldLabel}</span>
                </label>
                {renderFieldError(field.key)}
              </div>
            );
          }

          if (field.inputType === "select") {
            const options = (field.options || []).map((option) => ({
              value: option.value,
              label: t(option.labelKey, {
                defaultValue: option.defaultLabel || option.value,
              }),
            }));

            return (
              <label key={field.key} className="grid gap-1 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {fieldLabel}
                </span>
                <Select
                  value={value}
                  options={options}
                  size="md"
                  onChange={(nextValue) =>
                    setResourceFieldValue(field.key, nextValue)
                  }
                />
                {renderFieldError(field.key)}
              </label>
            );
          }

          return (
            <label key={field.key} className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {fieldLabel}
              </span>
              <input
                type={field.inputType === "time" ? "time" : "number"}
                min={field.inputType === "number" ? field.min : undefined}
                max={field.inputType === "number" ? field.max : undefined}
                step={field.inputType === "number" ? field.step || 1 : undefined}
                value={value}
                className={getFieldClassName(field.key)}
                onChange={(event) =>
                  setResourceFieldValue(field.key, event.target.value)
                }
              />
              {renderFieldError(field.key)}
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default StepRentalTerms;
