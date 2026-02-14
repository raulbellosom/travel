import { useTranslation } from "react-i18next";
import { BedDouble, Bath, Car, Ruler, Building2, Calendar } from "lucide-react";

/**
 * Step 3: Physical features — bedrooms, bathrooms, parking, area, floors, year.
 */
const StepFeatures = ({ formHook }) => {
  const { t } = useTranslation();
  const { form, setField, getFieldClassName, renderFieldError } = formHook;

  const featureCard = (icon, label, field, { min, max, step, unit } = {}) => {
    const Icon = icon;
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <Icon size={16} className="text-cyan-600 dark:text-cyan-400" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={min ?? 0}
            max={max ?? 999999}
            step={step ?? 1}
            value={form[field]}
            className={getFieldClassName(field)}
            onChange={(e) => setField(field, e.target.value)}
          />
          {unit && (
            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
              {unit}
            </span>
          )}
        </div>
        {renderFieldError(field)}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Primary features grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {featureCard(BedDouble, t("propertyForm.fields.bedrooms"), "bedrooms", {
          min: 0,
          max: 50,
        })}
        {featureCard(Bath, t("propertyForm.fields.bathrooms"), "bathrooms", {
          min: 0,
          max: 50,
          step: 0.5,
        })}
        {featureCard(
          Car,
          t("propertyForm.fields.parkingSpaces"),
          "parkingSpaces",
          {
            min: 0,
            max: 20,
          },
        )}
      </div>

      {/* Area fields */}
      <div className="grid gap-3 sm:grid-cols-2">
        {featureCard(Ruler, t("propertyForm.fields.totalArea"), "totalArea", {
          min: 0,
          max: 999999,
          step: 0.01,
          unit: "m²",
        })}
        {featureCard(Ruler, t("propertyForm.fields.builtArea"), "builtArea", {
          min: 0,
          max: 999999,
          step: 0.01,
          unit: "m²",
        })}
      </div>

      {/* Building details */}
      <div className="grid gap-3 sm:grid-cols-2">
        {featureCard(Building2, t("propertyForm.fields.floors"), "floors", {
          min: 1,
          max: 200,
        })}
        {featureCard(
          Calendar,
          t("propertyForm.fields.yearBuilt"),
          "yearBuilt",
          {
            min: 1800,
            max: 2100,
          },
        )}
      </div>
    </div>
  );
};

export default StepFeatures;
