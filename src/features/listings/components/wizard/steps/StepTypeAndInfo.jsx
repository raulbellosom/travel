import { useTranslation } from "react-i18next";
import { RefreshCw, Loader2, Check, AlertCircle } from "lucide-react";
import { Select, TextInputWithCharCounter } from "../../../../../components/common";
import { COMMERCIAL_MODE_OPTIONS } from "../wizardConfig";
import { useEffect, useMemo } from "react";
import {
  getAllowedCategories,
  getAllowedCommercialModes,
  getCategoryTranslationKey,
} from "../../../../../utils/resourceTaxonomy";

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

  const resourceTypeOptions = useMemo(
    () => [
      {
        value: "property",
        label: t("propertyForm.options.resourceType.property", {
          defaultValue: "Property",
        }),
      },
      {
        value: "service",
        label: t("propertyForm.options.resourceType.service", {
          defaultValue: "Service",
        }),
      },
      {
        value: "venue",
        label: t("propertyForm.options.resourceType.venue", {
          defaultValue: "Venue",
        }),
      },
      {
        value: "experience",
        label: t("propertyForm.options.resourceType.experience", {
          defaultValue: "Experience",
        }),
      },
      {
        value: "vehicle",
        label: t("propertyForm.options.resourceType.vehicle", {
          defaultValue: "Vehicle",
        }),
      },
    ],
    [t],
  );

  const formatCategoryFallback = (value) =>
    String(value || "")
      .trim()
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const categoryOptions = useMemo(() => {
    const categories = getAllowedCategories(form.resourceType);
    return categories.map((category) => ({
      value: category,
      label: t(getCategoryTranslationKey(category), {
        defaultValue: formatCategoryFallback(category),
      }),
    }));
  }, [form.resourceType, t]);

  const commercialModeOptions = useMemo(() => {
    const allowedCommercialModes = new Set(
      getAllowedCommercialModes(form.resourceType),
    );

    return COMMERCIAL_MODE_OPTIONS.filter((option) => {
      const optionMode = String(option.value || "").trim().toLowerCase();
      return allowedCommercialModes.has(optionMode);
    }).map((option) => ({
      value: option.value,
      label: t(option.key),
    }));
  }, [form.resourceType, t]);

  useEffect(() => {
    if (commercialModeOptions.length === 0) return;
    if (commercialModeOptions.some((option) => option.value === form.commercialMode)) {
      return;
    }
    setField("commercialMode", commercialModeOptions[0].value);
  }, [commercialModeOptions, form.commercialMode, setField]);

  useEffect(() => {
    if (categoryOptions.length === 0) return;
    const currentCategory = form.category || form.propertyType;
    if (categoryOptions.some((option) => option.value === currentCategory)) {
      return;
    }
    setField("category", categoryOptions[0].value);
  }, [categoryOptions, form.category, form.propertyType, setField]);

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
      {/* Resource type */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.resourceType", { defaultValue: "Resource type" })}
        </span>
        <Select
          value={form.resourceType}
          options={resourceTypeOptions}
          size="md"
          onChange={(value) => setField("resourceType", value)}
        />
      </label>

      {/* Commercial mode cards (shown only when there is more than one valid option) */}
      {commercialModeOptions.length > 1 ? (
        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.commercialMode", {
              defaultValue: "Commercial mode",
            })}{" "}
            *
          </span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {commercialModeOptions.map((option) => {
              const isSelected = form.commercialMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setField("commercialMode", option.value)}
                  className={`min-h-14 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-50 text-cyan-800 shadow-sm shadow-cyan-500/10 hover:border-cyan-600 hover:bg-cyan-100 hover:text-cyan-900 dark:border-cyan-400 dark:bg-cyan-900/20 dark:text-cyan-200 dark:hover:bg-cyan-900/40 dark:hover:text-cyan-100"
                      : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {renderFieldError("commercialMode")}
        </div>
      ) : null}

      {/* Category */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.category", {
            defaultValue: t("propertyForm.fields.propertyType"),
          })}{" "}
          *
        </span>
        <Select
          required
          value={form.category || form.propertyType}
          options={categoryOptions}
          size="md"
          className={errors.category ? "border-red-400" : ""}
          onChange={(value) => setField("category", value)}
        />
        {renderFieldError("category")}
      </label>

      {/* Title */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.title")} *
        </span>
        <TextInputWithCharCounter
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
          <TextInputWithCharCounter
            required
            value={form.slug}
            maxLength={150}
            containerClassName="flex-1"
            className={getFieldClassName("slug")}
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
