import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import Combobox from "../../../../../components/common/molecules/Combobox";
import MapPickerModal from "../../../../../components/common/molecules/MapPickerModal";
import {
  Button,
  TextInputWithCharCounter,
} from "../../../../../components/common/atoms";
import { comboboxInputClassName, inputErrorClassName } from "../wizardConfig";

/**
 * Step 2: Location — country, state, city, address details, coordinates.
 */
const StepLocation = ({ formHook }) => {
  const { t } = useTranslation();
  const [mapOpen, setMapOpen] = useState(false);

  const {
    form,
    setForm,
    setField,
    errors,
    clearError,
    getFieldClassName,
    renderFieldError,
    countryOptions,
    stateOptions,
    cityOptions,
    selectedCountryCode,
    selectedStateCode,
    handleCountryChange,
    handleStateChange,
    handleCityChange,
  } = formHook;

  /**
   * When the user confirms a point on the map, auto-fill all location fields.
   * Receives a normalized location object from Mapbox geocoding service.
   */
  const handleMapConfirm = useCallback(
    (location) => {
      const loc = location || {};

      // Atomic batch update: always overwrite ALL location fields
      setForm((prev) => ({
        ...prev,
        latitude: String(loc.lat),
        longitude: String(loc.lng),
        country: loc.country ? loc.country.toUpperCase() : prev.country,
        streetAddress: loc.streetAddress ?? "",
        neighborhood: loc.neighborhood ?? "",
        postalCode: loc.postalCode ?? "",
      }));

      // Clear validation errors for every location field
      [
        "country",
        "state",
        "city",
        "streetAddress",
        "neighborhood",
        "postalCode",
        "latitude",
        "longitude",
      ].forEach(clearError);

      // Country cascade (changes country -> clears dependent state/city)
      if (loc.country) {
        handleCountryChange(loc.country);
      }

      // State -- small delay so cascade from country is applied
      if (loc.state) {
        setTimeout(() => {
          handleStateChange(loc.state);

          // City -- delay after state cascade
          setTimeout(() => {
            handleCityChange(loc.city || "");
          }, 80);
        }, 80);
      } else if (loc.city) {
        setTimeout(() => {
          handleCityChange(loc.city);
        }, 80);
      }
    },
    [
      setForm,
      clearError,
      handleCountryChange,
      handleStateChange,
      handleCityChange,
    ],
  );

  return (
    <div className="space-y-5">
      {/* Map picker button */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          leftIcon={MapPin}
          onClick={() => setMapOpen(true)}
        >
          {t("mapPicker.locateOnMap")}
        </Button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t("mapPicker.locateHint")}
        </span>
      </div>

      <MapPickerModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={handleMapConfirm}
        latitude={form.latitude}
        longitude={form.longitude}
      />

      {/* Country & State row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.country")} *
          </span>
          <Combobox
            required
            value={form.country}
            options={countryOptions}
            inputClassName={`${comboboxInputClassName} ${errors.country ? inputErrorClassName : ""}`}
            placeholder={t("propertyForm.locationCombobox.countryPlaceholder")}
            noResultsText={t("propertyForm.locationCombobox.noResultsCountry")}
            onChange={handleCountryChange}
          />
          {renderFieldError("country")}
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.state")} *
          </span>
          <Combobox
            required
            value={form.state}
            options={stateOptions}
            disabled={!selectedCountryCode}
            inputClassName={`${comboboxInputClassName} ${errors.state ? inputErrorClassName : ""}`}
            placeholder={t("propertyForm.locationCombobox.statePlaceholder")}
            noResultsText={t("propertyForm.locationCombobox.noResultsState")}
            onChange={handleStateChange}
          />
          {renderFieldError("state")}
        </label>
      </div>

      {/* City */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {t("propertyForm.fields.city")} *
        </span>
        <Combobox
          required
          value={form.city}
          options={cityOptions}
          disabled={!selectedCountryCode || !selectedStateCode}
          inputClassName={`${comboboxInputClassName} ${errors.city ? inputErrorClassName : ""}`}
          placeholder={t("propertyForm.locationCombobox.cityPlaceholder")}
          noResultsText={t("propertyForm.locationCombobox.noResultsCity")}
          onChange={handleCityChange}
        />
        {renderFieldError("city")}
      </label>

      {/* Street address & Neighborhood */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.streetAddress")}
          </span>
          <TextInputWithCharCounter
            value={form.streetAddress}
            maxLength={200}
            placeholder={t("propertyForm.wizard.placeholders.streetAddress")}
            className={getFieldClassName("streetAddress")}
            onChange={(e) => setField("streetAddress", e.target.value)}
          />
          {renderFieldError("streetAddress")}
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.neighborhood")}
          </span>
          <TextInputWithCharCounter
            value={form.neighborhood}
            maxLength={100}
            placeholder={t("propertyForm.wizard.placeholders.neighborhood")}
            className={getFieldClassName("neighborhood")}
            onChange={(e) => setField("neighborhood", e.target.value)}
          />
          {renderFieldError("neighborhood")}
        </label>
      </div>

      {/* Postal code */}
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.postalCode")}
          </span>
          <TextInputWithCharCounter
            value={form.postalCode}
            maxLength={10}
            placeholder="00000"
            className={getFieldClassName("postalCode")}
            onChange={(e) => setField("postalCode", e.target.value)}
          />
          {renderFieldError("postalCode")}
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.latitude")}
          </span>
          <input
            type="number"
            step="any"
            min="-90"
            max="90"
            value={form.latitude}
            placeholder="19.4326"
            className={getFieldClassName("latitude")}
            onChange={(e) => setField("latitude", e.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("propertyForm.fields.longitude")}
          </span>
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            value={form.longitude}
            placeholder="-99.1332"
            className={getFieldClassName("longitude")}
            onChange={(e) => setField("longitude", e.target.value)}
          />
        </label>
      </div>
    </div>
  );
};

export default StepLocation;
