import { useMemo, useState } from "react";
import Combobox from "../../../../components/common/molecules/Combobox";
import { getAmenityIcon } from "../../../../data/amenitiesCatalog";
import { getAmenityRelevanceScore } from "../../../listings/amenityRelevance";

const INPUT_CLASS_NAME =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

function getAmenityLabel(item, language = "es") {
  if (!item) return "";
  if (language === "en") {
    return item.name_en || item.name_es || item.slug || "";
  }
  return item.name_es || item.name_en || item.slug || "";
}

function normalizeValue(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => String(entry || "").trim())
        .filter(Boolean),
    ),
  );
}

const EMPTY_ARRAY = [];
export default function AmenitySelectorField({
  value,
  error,
  t,
  field,
  onChange,
  amenitiesOptions = EMPTY_ARRAY,
  amenitiesLoading = false,
  resourceType = "property",
  category = "",
}) {
  const [pickerValue, setPickerValue] = useState("");
  const [pickerKey, setPickerKey] = useState(0);
  const selectedSlugs = useMemo(() => normalizeValue(value), [value]);
  const language = t?.("common.languageCode", { defaultValue: "es" }) || "es";

  const optionsBySlug = useMemo(
    () =>
      new Map(
        (amenitiesOptions || []).map((item) => [
          String(item?.slug || "").trim(),
          item,
        ]),
      ),
    [amenitiesOptions],
  );

  const selectedAmenities = useMemo(
    () => selectedSlugs.map((slug) => optionsBySlug.get(slug)).filter(Boolean),
    [optionsBySlug, selectedSlugs],
  );

  const pickerOptions = useMemo(() => {
    const selected = new Set(selectedSlugs);

    return (amenitiesOptions || [])
      .filter((item) => !selected.has(String(item?.slug || "").trim()))
      .map((item) => {
        const slug = String(item?.slug || "").trim();
        const label = getAmenityLabel(item, language);
        return {
          value: slug,
          label,
          relevanceScore: getAmenityRelevanceScore({
            item,
            resourceType,
            category,
          }),
          searchText:
            `${slug} ${item?.name_es || ""} ${item?.name_en || ""}`.trim(),
        };
      })
      .sort((left, right) => {
        if (right.relevanceScore !== left.relevanceScore) {
          return right.relevanceScore - left.relevanceScore;
        }
        return left.label.localeCompare(right.label);
      });
  }, [amenitiesOptions, category, language, resourceType, selectedSlugs]);

  const suggestedOptions = useMemo(() => {
    if (resourceType !== "music") return [];
    return pickerOptions.filter((option) => option.relevanceScore > 0).slice(0, 10);
  }, [pickerOptions, resourceType]);

  const label = field?.labelKey ? t(field.labelKey) : t("propertyForm.amenities.searchLabel");
  const help = field?.helpKey ? t(field.helpKey) : "";

  const handleSelect = (slug) => {
    const nextSlug = String(slug || "").trim();
    if (!nextSlug) return;
    if (selectedSlugs.includes(nextSlug)) return;

    onChange?.([...selectedSlugs, nextSlug]);
    setPickerValue("");
    setPickerKey((current) => current + 1);
  };

  const removeAmenity = (slug) => {
    onChange?.(selectedSlugs.filter((item) => item !== slug));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t("propertyForm.amenities.selected", { count: selectedSlugs.length })}
        </span>
      </div>

      {help ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{help}</p>
      ) : null}

      {amenitiesLoading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("propertyForm.amenities.loading")}
        </p>
      ) : null}

      {!amenitiesLoading && pickerOptions.length > 0 ? (
        <div className="space-y-3">
          {suggestedOptions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t("propertyForm.amenities.suggestedTitle")}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedOptions.map((option) => (
                  <button
                    key={`suggested-${option.value}`}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className="inline-flex min-h-9 items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-200"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <Combobox
            key={pickerKey}
            value={pickerValue}
            options={pickerOptions}
            disabled={pickerOptions.length === 0}
            inputClassName={INPUT_CLASS_NAME}
            placeholder={t("propertyForm.amenities.searchPlaceholder")}
            noResultsText={t("propertyForm.amenities.searchEmpty")}
            onChange={handleSelect}
            keepOpenAfterSelect={true}
          />
        </div>
      ) : null}

      {!amenitiesLoading && pickerOptions.length === 0 && selectedSlugs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {t("propertyForm.amenities.empty")}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {selectedAmenities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {t("propertyForm.amenities.noneSelected")}
          </p>
        ) : (
          selectedAmenities.map((amenity) => {
            const AmenityIcon = getAmenityIcon(amenity);
            const amenitySlug = String(amenity.slug || "").trim();
            return (
              <button
                key={amenitySlug}
                type="button"
                onClick={() => removeAmenity(amenitySlug)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200"
              >
                <AmenityIcon size={14} />
                <span>{getAmenityLabel(amenity, language)}</span>
              </button>
            );
          })
        )}
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
