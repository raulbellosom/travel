import React from "react";
import {
  Checkbox,
  NumberInput,
  Select,
  TextInput,
} from "../../../../components/common";
import ImageDropzoneField from "./ImageDropzoneField";

const NUMBER_FALLBACK_MIN = -999999999;
const NUMBER_FALLBACK_MAX = 999999999;

/**
 * FieldRenderer
 * Uses shared UI atoms to keep visual consistency with the rest of the app.
 */
export default function FieldRenderer({
  field,
  value,
  error,
  t,
  onChange,
  existingImages = [],
  existingImagesLoading = false,
}) {
  const label = field.labelKey ? t(field.labelKey) : "";
  const help = field.helpKey ? t(field.helpKey) : "";
  const suffixText = field.suffixKey ? t(field.suffixKey) : "";
  const helperText = [help, suffixText].filter(Boolean).join(" - ");

  switch (field.type) {
    case "text":
      return (
        <TextInput
          type="text"
          label={label}
          helperText={help}
          error={error}
          required={Boolean(field.required)}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case "url":
      return (
        <TextInput
          type="url"
          label={label}
          helperText={help}
          error={error}
          required={Boolean(field.required)}
          value={value ?? ""}
          placeholder="https://"
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case "textarea":
      return (
        <FieldShell
          label={label}
          help={help}
          error={error}
          required={Boolean(field.required)}
        >
          <textarea
            rows={5}
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 transition-all duration-200 ease-in-out focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
          />
        </FieldShell>
      );

    case "number":
      return (
        <NumberInput
          label={label}
          helperText={helperText}
          error={error}
          required={Boolean(field.required)}
          value={value ?? ""}
          min={Number.isFinite(field.min) ? field.min : NUMBER_FALLBACK_MIN}
          max={Number.isFinite(field.max) ? field.max : NUMBER_FALLBACK_MAX}
          step={Number.isFinite(field.step) ? field.step : 1}
          showStepper={false}
          onChange={(nextValue) => onChange(nextValue)}
        />
      );

    case "currencyAmount":
      return (
        <NumberInput
          label={label}
          helperText={help}
          error={error}
          required={Boolean(field.required)}
          value={value ?? ""}
          min={Number.isFinite(field.min) ? field.min : 0}
          max={Number.isFinite(field.max) ? field.max : NUMBER_FALLBACK_MAX}
          step={0.01}
          precision={2}
          showStepper={false}
          onChange={(nextValue) => onChange(nextValue)}
        />
      );

    case "time":
      return (
        <TextInput
          type="time"
          label={label}
          helperText={help}
          error={error}
          required={Boolean(field.required)}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case "select": {
      const options = (field.options || []).map((option) => ({
        value: option.value ?? option.id ?? "",
        label: option.label ?? option.value ?? option.id ?? "",
        description: option.description ?? option.help,
      }));
      const isOfferingSelector =
        field.key === "offeringId" && options.length > 1 && options.length <= 3;
      const selectedOption = options.find(
        (option) => option.value === (value ?? ""),
      );
      const selectHelperText =
        selectedOption?.description && !error
          ? selectedOption.description
          : help;

      if (isOfferingSelector) {
        return (
          <FieldShell
            label={label}
            help={help}
            error={error}
            required={Boolean(field.required)}
          >
            <div
              className={`grid gap-2 ${
                options.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
              }`}
              data-no-swipe="true"
            >
              {options.map((option) => {
                const selected = option.value === (value ?? "");
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-cyan-300 bg-cyan-50 text-cyan-700 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.25)] dark:bg-cyan-500/10 dark:text-cyan-100 dark:shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700/80 dark:bg-slate-900/30 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{option.label}</span>
                    {option.description ? (
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                        {option.description}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </FieldShell>
        );
      }

      return (
        <Select
          label={label}
          helperText={selectHelperText}
          error={error}
          required={Boolean(field.required)}
          value={value ?? ""}
          options={options}
          placeholder={t("wizard.actions.selectPlaceholder")}
          onChange={(nextValue) => onChange(nextValue)}
        />
      );
    }

    case "boolean":
      return (
        <Checkbox
          label={label}
          description={help}
          error={error}
          checked={Boolean(value)}
          onChange={(nextValue) => onChange(nextValue)}
        />
      );

    case "images":
      return (
        <FieldShell
          label={label}
          help={help}
          required={Boolean(field.required)}
        >
          <ImageDropzoneField
            value={value}
            error={error}
            t={t}
            existingImages={existingImages}
            existingImagesLoading={existingImagesLoading}
            onChange={onChange}
          />
        </FieldShell>
      );

    default:
      return (
        <FieldShell label={label} help={help} error={error}>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {t("wizard.errors.unsupportedFieldType", { type: field.type })}
          </div>
        </FieldShell>
      );
  }
}

function FieldShell({ label, help, error, required = false, children }) {
  return (
    <div>
      {label ? (
        <div className="mb-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required ? (
              <span className="ml-1 text-red-500" aria-label="required">
                *
              </span>
            ) : null}
          </div>
          {help ? (
            <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {help}
            </div>
          ) : null}
        </div>
      ) : null}

      {children}

      {error ? (
        <div className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : null}
    </div>
  );
}
