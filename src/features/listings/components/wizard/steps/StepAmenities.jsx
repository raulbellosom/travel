import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Combobox } from "../../../../../components/common";

/**
 * Step: Amenities — search combobox to add, chip list to review/remove.
 */
const StepAmenities = ({ formHook, amenitiesLoading }) => {
  const { t } = useTranslation();

  const {
    selectedAmenities,
    amenityPickerOptions,
    amenityPickerValue,
    amenityPickerKey,
    amenityNameField,
    handleAmenitySelect,
    removeAmenity,
    renderFieldError,
  } = formHook;

  return (
    <div className="space-y-5">
      {/* Search / picker */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.amenities")}
        </span>

        <Combobox
          key={amenityPickerKey}
          options={amenityPickerOptions}
          value={amenityPickerValue}
          onChange={handleAmenitySelect}
          placeholder={
            amenitiesLoading
              ? t("propertyForm.amenitiesLoading", "Cargando amenidades…")
              : t("propertyForm.amenitiesPlaceholder", "Buscar amenidad…")
          }
          noResultsText={t(
            "propertyForm.noAmenities",
            "No se encontraron amenidades",
          )}
          disabled={amenitiesLoading}
          keepOpenAfterSelect={true}
          inputClassName="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        {renderFieldError("amenityIds")}
      </label>

      {/* Selected amenities chips */}
      {selectedAmenities.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("propertyForm.selectedAmenities", "Amenidades seleccionadas")} (
            {selectedAmenities.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedAmenities.map((amenity) => {
              const label =
                amenity[amenityNameField] ||
                amenity.name_es ||
                amenity.name_en ||
                amenity.slug ||
                amenity.$id;

              return (
                <span
                  key={amenity.$id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300"
                >
                  {label}
                  <button
                    type="button"
                    aria-label={`${t("propertyForm.removeAmenity", "Quitar")} ${label}`}
                    onClick={() => removeAmenity(amenity.$id)}
                    className="rounded-full p-0.5 transition hover:bg-cyan-200 dark:hover:bg-cyan-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {selectedAmenities.length === 0 && !amenitiesLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t(
              "propertyForm.noAmenitiesSelected",
              "Aún no has agregado amenidades",
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {t(
              "propertyForm.amenitiesHelp",
              "Usa el buscador de arriba para agregar",
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default StepAmenities;
