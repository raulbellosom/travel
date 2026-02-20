import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "../../../../../components/common";
import { getResourceFieldLabel } from "../../../../../utils/resourceFormProfile";

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const countStepDecimals = (stepValue) => {
  const text = String(stepValue ?? "");
  if (!text.includes(".")) return 0;
  return text.split(".")[1].length;
};

const normalizeNumberOnBlur = (field, rawValue) => {
  const fallback = field.defaultValue ?? "";
  const normalizedRaw = String(rawValue ?? "").trim();
  if (!normalizedRaw) return String(fallback);

  const parsed = Number(normalizedRaw);
  if (!Number.isFinite(parsed)) return String(fallback);

  let nextValue = parsed;
  if (Number.isFinite(field.min)) {
    nextValue = Math.max(Number(field.min), nextValue);
  }
  if (Number.isFinite(field.max)) {
    nextValue = Math.min(Number(field.max), nextValue);
  }

  if (Number.isFinite(field.step) && Number(field.step) > 0) {
    const step = Number(field.step);
    const minBase = Number.isFinite(field.min) ? Number(field.min) : 0;
    const decimalPlaces = countStepDecimals(step);
    const stepped =
      Math.round((nextValue - minBase) / step) * step + minBase;
    nextValue = Number(stepped.toFixed(decimalPlaces));
  }

  return String(nextValue);
};

const StepFeatures = ({ formHook }) => {
  const { t } = useTranslation();
  const {
    resourceFormProfile,
    getResourceFieldValue,
    setResourceFieldValue,
    getFieldClassName,
    renderFieldError,
  } = formHook;

  const featureFields = resourceFormProfile.features;
  const [draftNumericValues, setDraftNumericValues] = useState({});
  const numericFieldKeys = useMemo(
    () =>
      new Set(
        featureFields
          .filter((field) => field.inputType === "number")
          .map((field) => field.key),
      ),
    [featureFields],
  );

  useEffect(() => {
    setDraftNumericValues((prev) => {
      const next = {};
      let changed = false;
      Object.entries(prev).forEach(([key, draft]) => {
        if (numericFieldKeys.has(key)) {
          next[key] = draft;
          return;
        }
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [numericFieldKeys]);

  const renderField = (field) => {
    const value = getResourceFieldValue(field.key);
    const fieldLabel = getResourceFieldLabel(field, t, {
      commercialMode: resourceFormProfile.commercialMode,
    });

    if (field.inputType === "boolean") {
      return (
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
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
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {fieldLabel}
          </span>
          <Select
            value={value}
            options={options}
            size="md"
            onChange={(nextValue) => setResourceFieldValue(field.key, nextValue)}
          />
        </label>
      );
    }

    const inputType = field.inputType === "time" ? "time" : "number";
    const displayValue =
      field.inputType === "number" && hasOwn(draftNumericValues, field.key)
        ? draftNumericValues[field.key]
        : value;

    return (
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {fieldLabel}
        </span>
        <div className="flex items-center gap-2">
          <input
            type={inputType}
            min={field.inputType === "number" ? field.min : undefined}
            max={field.inputType === "number" ? field.max : undefined}
            step={field.inputType === "number" ? field.step || 1 : undefined}
            value={displayValue}
            className={getFieldClassName(field.key)}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (field.inputType === "number") {
                setDraftNumericValues((prev) => ({
                  ...prev,
                  [field.key]: nextValue,
                }));
              }
              setResourceFieldValue(field.key, nextValue);
            }}
            onBlur={() => {
              if (field.inputType !== "number") return;
              const rawValue = hasOwn(draftNumericValues, field.key)
                ? draftNumericValues[field.key]
                : value;
              const normalized = normalizeNumberOnBlur(field, rawValue);
              setResourceFieldValue(field.key, normalized);
              setDraftNumericValues((prev) => {
                if (!hasOwn(prev, field.key)) return prev;
                const next = { ...prev };
                delete next[field.key];
                return next;
              });
            }}
          />
          {field.inputType === "number" && field.unitKey ? (
            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
              {t(field.unitKey, { defaultValue: "" })}
            </span>
          ) : null}
        </div>
      </label>
    );
  };

  if (featureFields.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {t("propertyForm.wizard.noSpecificFeatures", {
          defaultValue:
            "Este tipo de recurso no requiere caracteristicas adicionales en este paso.",
        })}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {featureFields.map((field) => (
        <div
          key={field.key}
          className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
        >
          {renderField(field)}
          {renderFieldError(field.key)}
        </div>
      ))}
    </div>
  );
};

export default StepFeatures;
