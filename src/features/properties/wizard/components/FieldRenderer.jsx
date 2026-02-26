import React, { useMemo } from "react";
import { AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";
import {
  Button,
  Checkbox,
  NumberInput,
  Select,
  TextInput,
  TextInputWithCharCounter,
} from "../../../../components/common";
import AmenitySelectorField from "./AmenitySelectorField";
import ImageDropzoneField from "./ImageDropzoneField";

const NUMBER_FALLBACK_MIN = -999999999;
const NUMBER_FALLBACK_MAX = 999999999;
const TEXT_INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 transition-all duration-200 ease-in-out focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400";

const DEFAULT_MAX_LENGTH_BY_FIELD_KEY = {
  title: 200,
  slug: 150,
  description: 5000,
  streetAddress: 255,
  neighborhood: 120,
  postalCode: 20,
};

function getMaxLength(field = {}) {
  if (Number.isFinite(field.maxLength) && field.maxLength > 0) {
    return field.maxLength;
  }
  if (
    typeof field.key === "string" &&
    Object.prototype.hasOwnProperty.call(DEFAULT_MAX_LENGTH_BY_FIELD_KEY, field.key)
  ) {
    return DEFAULT_MAX_LENGTH_BY_FIELD_KEY[field.key];
  }
  return null;
}

function getSlugStatusView(t, slugStatus) {
  const status = String(slugStatus?.state || "idle").trim();
  if (status === "checking") {
    return {
      icon: Loader2,
      text: t("propertyForm.slugStatus.checking"),
      className: "text-cyan-700 dark:text-cyan-300",
      isSpinning: true,
    };
  }
  if (status === "available") {
    return {
      icon: Check,
      text: t("propertyForm.slugStatus.available"),
      className: "text-emerald-700 dark:text-emerald-300",
      isSpinning: false,
    };
  }
  if (status === "unchanged") {
    return {
      icon: Check,
      text: t("propertyForm.slugStatus.unchanged"),
      className: "text-emerald-700 dark:text-emerald-300",
      isSpinning: false,
    };
  }
  if (status === "taken") {
    return {
      icon: AlertCircle,
      text: t("propertyForm.slugStatus.taken"),
      className: "text-red-700 dark:text-red-300",
      isSpinning: false,
    };
  }
  if (status === "invalid") {
    return {
      icon: AlertCircle,
      text: t("propertyForm.slugStatus.invalid"),
      className: "text-red-700 dark:text-red-300",
      isSpinning: false,
    };
  }
  if (status === "error") {
    return {
      icon: AlertCircle,
      text: t("propertyForm.slugStatus.error"),
      className: "text-amber-700 dark:text-amber-300",
      isSpinning: false,
    };
  }

  return {
    icon: null,
    text: t("propertyForm.slugStatus.idle"),
    className: "text-slate-500 dark:text-slate-400",
    isSpinning: false,
  };
}

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
  slugStatus = null,
  onRegenerateSlug = null,
  amenitiesOptions = [],
  amenitiesLoading = false,
  resourceType = "property",
  category = "",
}) {
  const label = field.labelKey ? t(field.labelKey) : "";
  const help = field.helpKey ? t(field.helpKey) : "";
  const suffixText = field.suffixKey ? t(field.suffixKey) : "";
  const helperText = [help, suffixText].filter(Boolean).join(" - ");
  const maxLength = getMaxLength(field);
  const inputPlaceholder = field.placeholderKey ? t(field.placeholderKey) : undefined;
  const slugStatusView = useMemo(
    () => (field.key === "slug" ? getSlugStatusView(t, slugStatus) : null),
    [field.key, slugStatus, t],
  );

  switch (field.type) {
    case "text":
      if (field.key === "slug") {
        return (
          <FieldShell
            label={label}
            help={help}
            error={error}
            required={Boolean(field.required)}
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <TextInputWithCharCounter
                    maxLength={maxLength || 150}
                    value={String(value ?? "")}
                    className={TEXT_INPUT_CLASS}
                    containerClassName="w-full"
                    placeholder={inputPlaceholder}
                    onChange={(event) => onChange(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={RefreshCw}
                  className="min-h-11 shrink-0"
                  onClick={() => onRegenerateSlug?.()}
                >
                  {t("propertyForm.actions.regenerateSlug")}
                </Button>
              </div>

              {slugStatusView ? (
                <p className={`inline-flex items-center gap-1 text-xs ${slugStatusView.className}`}>
                  {slugStatusView.icon ? (
                    <slugStatusView.icon
                      size={12}
                      className={slugStatusView.isSpinning ? "animate-spin" : ""}
                    />
                  ) : null}
                  <span>{slugStatusView.text}</span>
                </p>
              ) : null}
            </div>
          </FieldShell>
        );
      }

      if (maxLength) {
        return (
          <FieldShell
            label={label}
            help={help}
            error={error}
            required={Boolean(field.required)}
          >
            <TextInputWithCharCounter
              maxLength={maxLength}
              value={String(value ?? "")}
              className={TEXT_INPUT_CLASS}
              containerClassName="w-full"
              placeholder={inputPlaceholder}
              onChange={(event) => onChange(event.target.value)}
            />
          </FieldShell>
        );
      }

      return (
        <TextInput
          type="text"
          label={label}
          helperText={help}
          error={error}
          required={Boolean(field.required)}
          value={String(value ?? "")}
          placeholder={inputPlaceholder}
          className="min-w-0"
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
          value={String(value ?? "")}
          placeholder="https://"
          className="min-w-0"
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case "textarea": {
      const textValue = String(value ?? "");
      const remaining = maxLength ? Math.max(0, maxLength - textValue.length) : null;

      return (
        <FieldShell
          label={label}
          help={help}
          error={error}
          required={Boolean(field.required)}
        >
          <div className="min-w-0 space-y-2">
            <textarea
              rows={5}
              value={textValue}
              maxLength={maxLength || undefined}
              onChange={(event) => onChange(event.target.value)}
              className={TEXT_INPUT_CLASS}
            />
            {remaining != null ? (
              <div className="flex items-center justify-end text-xs text-slate-500 dark:text-slate-400">
                <span>{remaining}</span>
              </div>
            ) : null}
          </div>
        </FieldShell>
      );
    }

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
          className="min-w-0 max-w-full"
          onChange={(nextValue) => onChange(String(nextValue ?? ""))}
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
          className="min-w-0 max-w-full"
          onChange={(nextValue) => onChange(String(nextValue ?? ""))}
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
          value={String(value ?? "")}
          className="min-w-0 max-w-full"
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case "select": {
      const options = (field.options || []).map((option) => ({
        value: String(option.value ?? option.id ?? ""),
        label: option.label ?? option.value ?? option.id ?? "",
        description: option.description ?? option.help,
      }));
      const isOfferingSelector =
        field.key === "offeringId" && options.length > 1 && options.length <= 3;
      const selectedOption = options.find(
        (option) => option.value === String(value ?? ""),
      );
      const selectHelperText =
        selectedOption?.description && !error ? selectedOption.description : help;

      if (isOfferingSelector) {
        return (
          <FieldShell
            label={label}
            help={help}
            error={error}
            required={Boolean(field.required)}
          >
            <div
              className={`grid min-w-0 gap-2 ${
                options.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
              }`}
              data-no-swipe="true"
            >
              {options.map((option) => {
                const selected = option.value === String(value ?? "");
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`min-w-0 rounded-2xl border px-4 py-3 text-left transition ${
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
          value={String(value ?? "")}
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

    case "amenities":
      return (
        <FieldShell
          label={label}
          help={help}
          required={Boolean(field.required)}
          error={error}
        >
          <AmenitySelectorField
            value={value}
            error={error}
            t={t}
            field={field}
            amenitiesOptions={amenitiesOptions}
            amenitiesLoading={amenitiesLoading}
            resourceType={resourceType}
            category={category}
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
    <div className="min-w-0">
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
