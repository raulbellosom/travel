import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Users, Moon, Clock } from "lucide-react";
import { Select } from "../../../../../components/common";
import { FURNISHED_OPTIONS } from "../wizardConfig";

/**
 * Step: Vacation Rules (only for operationType === "vacation_rental").
 * Max guests, min/max stay, check-in/out times, furnished, pets.
 */
const StepVacationRules = ({ formHook }) => {
  const { t } = useTranslation();
  const { form, setField, getFieldClassName, renderFieldError } = formHook;

  const furnishedOptions = useMemo(
    () => FURNISHED_OPTIONS.map((o) => ({ value: o.value, label: t(o.key) })),
    [t],
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t("propertyForm.wizard.vacationRulesHint")}
      </p>

      {/* Max guests */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <Users size={16} className="text-cyan-600 dark:text-cyan-400" />
          <span>{t("propertyForm.fields.maxGuests")} *</span>
        </div>
        <input
          required
          type="number"
          min="1"
          max="500"
          value={form.maxGuests}
          className={getFieldClassName("maxGuests")}
          onChange={(e) => setField("maxGuests", e.target.value)}
        />
        {renderFieldError("maxGuests")}
      </div>

      {/* Stay duration */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Moon size={16} className="text-cyan-600 dark:text-cyan-400" />
            <span>{t("propertyForm.fields.minStayNights")}</span>
          </div>
          <input
            type="number"
            min="1"
            max="365"
            value={form.minStayNights}
            className={getFieldClassName("minStayNights")}
            onChange={(e) => setField("minStayNights", e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Moon size={16} className="text-cyan-600 dark:text-cyan-400" />
            <span>{t("propertyForm.fields.maxStayNights")}</span>
          </div>
          <input
            type="number"
            min="1"
            max="365"
            value={form.maxStayNights}
            className={getFieldClassName("maxStayNights")}
            onChange={(e) => setField("maxStayNights", e.target.value)}
          />
        </div>
      </div>

      {/* Check-in/out times */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Clock size={16} className="text-cyan-600 dark:text-cyan-400" />
            <span>{t("propertyForm.fields.checkInTime")}</span>
          </div>
          <input
            type="time"
            value={form.checkInTime}
            className={getFieldClassName("checkInTime")}
            onChange={(e) => setField("checkInTime", e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Clock size={16} className="text-cyan-600 dark:text-cyan-400" />
            <span>{t("propertyForm.fields.checkOutTime")}</span>
          </div>
          <input
            type="time"
            value={form.checkOutTime}
            className={getFieldClassName("checkOutTime")}
            onChange={(e) => setField("checkOutTime", e.target.value)}
          />
        </div>
      </div>

      {/* Furnished */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.furnished")}
        </span>
        <Select
          value={form.furnished}
          options={furnishedOptions}
          size="md"
          onChange={(value) => setField("furnished", value)}
        />
      </label>

      {/* Pets allowed */}
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-slate-600"
          checked={form.petsAllowed}
          onChange={(e) => setField("petsAllowed", e.target.checked)}
        />
        <span className="font-medium">
          {t("propertyForm.fields.petsAllowed")}
        </span>
      </label>
    </div>
  );
};

export default StepVacationRules;
