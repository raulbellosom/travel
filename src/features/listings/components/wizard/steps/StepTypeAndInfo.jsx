import { useTranslation } from "react-i18next";
import { RefreshCw, Loader2, Check, AlertCircle } from "lucide-react";
import { Select } from "../../../../../components/common";
import { PROPERTY_TYPES, OPERATION_TYPES } from "../wizardConfig";
import { useMemo } from "react";

/**
 * Step 1: Property type, operation type, title, slug, description.
 */
const StepTypeAndInfo = ({ formHook }) => {
  const { t } = useTranslation();
  const {
    form,
    setField,
    errors,
    getFieldClassName,
    renderFieldError,
    handleTitleChange,
    handleSlugChange,
    regenerateSlug,
    slugStatusView,
    slugStatus,
  } = formHook;

  const propertyTypeOptions = useMemo(
    () => PROPERTY_TYPES.map((o) => ({ value: o.value, label: t(o.key) })),
    [t],
  );

  const operationTypeOptions = useMemo(
    () => OPERATION_TYPES.map((o) => ({ value: o.value, label: t(o.key) })),
    [t],
  );

  const SlugIcon =
    slugStatus.state === "checking"
      ? Loader2
      : ["available", "unchanged"].includes(slugStatus.state)
        ? Check
        : slugStatus.state === "idle"
          ? null
          : AlertCircle;

  return (
    <div className="space-y-5">
      {/* Operation type cards */}
      <div>
        <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.operationType")} *
        </span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {operationTypeOptions.map((option) => {
            const isSelected = form.operationType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setField("operationType", option.value)}
                className={`min-h-14 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm shadow-cyan-500/10 dark:border-cyan-400 dark:bg-cyan-900/20 dark:text-cyan-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {renderFieldError("operationType")}
      </div>

      {/* Property type */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.propertyType")} *
        </span>
        <Select
          required
          value={form.propertyType}
          options={propertyTypeOptions}
          size="md"
          className={errors.propertyType ? "border-red-400" : ""}
          onChange={(value) => setField("propertyType", value)}
        />
        {renderFieldError("propertyType")}
      </label>

      {/* Title */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.title")} *
        </span>
        <input
          required
          value={form.title}
          maxLength={200}
          placeholder={t("propertyForm.wizard.placeholders.title")}
          className={getFieldClassName("title")}
          onChange={(e) => handleTitleChange(e.target.value)}
        />
        {renderFieldError("title")}
      </label>

      {/* Slug */}
      <div className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.slug")} *
        </span>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            required
            value={form.slug}
            maxLength={150}
            className={`${getFieldClassName("slug")} flex-1`}
            onChange={(e) => handleSlugChange(e.target.value)}
          />
          <button
            type="button"
            onClick={regenerateSlug}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-500"
          >
            <RefreshCw size={14} />
            {t("propertyForm.actions.regenerateSlug")}
          </button>
        </div>
        <p
          className={`inline-flex items-center gap-1 text-xs ${slugStatusView.className}`}
        >
          {SlugIcon && (
            <SlugIcon
              size={12}
              className={slugStatus.state === "checking" ? "animate-spin" : ""}
            />
          )}
          <span>{slugStatusView.text}</span>
        </p>
        {renderFieldError("slug")}
      </div>

      {/* Description */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.description")} *
        </span>
        <textarea
          required
          rows={5}
          maxLength={5000}
          value={form.description}
          placeholder={t("propertyForm.wizard.placeholders.description")}
          className={getFieldClassName("description")}
          onChange={(e) => setField("description", e.target.value)}
        />
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t("propertyForm.helper.description")}</span>
          <span>{`${String(form.description || "").length}/5000`}</span>
        </div>
        {renderFieldError("description")}
      </label>
    </div>
  );
};

export default StepTypeAndInfo;
