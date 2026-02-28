import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import {
  Button,
  NumberInput,
  Select,
  TextInput,
} from "../../../../components/common";
import Combobox from "../../../../components/common/molecules/Combobox";
import MapPickerModal from "../../../../components/common/molecules/MapPickerModal";
import { locationOptionsService } from "../../../listings/services/locationOptionsService";

const COMBOBOX_INPUT_CLASS =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

function toFieldMap(fields = []) {
  return (Array.isArray(fields) ? fields : []).reduce((acc, field) => {
    acc[field.key] = field;
    return acc;
  }, {});
}

function normalizeCountryCode(rawValue) {
  return String(rawValue || "").trim().toUpperCase();
}

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getFieldError(errors = {}, stepId, key) {
  return errors?.[`${stepId}.${key}`];
}

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
export default function LocationStepForm({
  t,
  fields = EMPTY_ARRAY,
  formState = EMPTY_OBJECT,
  stepErrors = EMPTY_OBJECT,
  stepId = "location",
  onFieldChange,
}) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const fieldMap = useMemo(() => toFieldMap(fields), [fields]);

  const countryOptions = useMemo(
    () =>
      locationOptionsService.getCountries().map((country) => ({
        value: country.value,
        label: country.label,
      })),
    [],
  );

  const selectedCountry = useMemo(
    () => locationOptionsService.findCountry(formState.country),
    [formState.country],
  );

  const selectedCountryCode = normalizeCountryCode(
    selectedCountry?.value || formState.country || "MX",
  );

  const stateOptions = useMemo(
    () => locationOptionsService.getStates(selectedCountryCode),
    [selectedCountryCode],
  );

  const selectedState = useMemo(
    () =>
      locationOptionsService.findState(selectedCountryCode, formState.state || ""),
    [formState.state, selectedCountryCode],
  );

  const selectedStateCode = String(selectedState?.stateCode || "").trim();
  const cityOptions = useMemo(
    () => locationOptionsService.getCities(selectedCountryCode, selectedStateCode),
    [selectedCountryCode, selectedStateCode],
  );

  const latitude = toNumberOrNull(formState.latitude);
  const longitude = toNumberOrNull(formState.longitude);

  const stateComboboxOptions = useMemo(
    () =>
      stateOptions.map((state) => ({
        value: state.value,
        label: state.label,
        searchText: `${state.label} ${state.stateCode || ""}`.trim(),
      })),
    [stateOptions],
  );

  const cityComboboxOptions = useMemo(
    () =>
      cityOptions.map((city) => ({
        value: city.value,
        label: city.label,
        searchText: city.label,
      })),
    [cityOptions],
  );

  const applyLocationFromMap = (location) => {
    const countryFromMap =
      locationOptionsService.findCountry(location?.country || "") ||
      locationOptionsService.findCountry(formState.country || "") ||
      locationOptionsService.findCountry("MX");

    const countryCode = normalizeCountryCode(countryFromMap?.value || "MX");

    const matchedState =
      locationOptionsService.findState(countryCode, location?.state || "") ||
      locationOptionsService.findState(countryCode, formState.state || "");

    const stateValue = String(
      matchedState?.value || location?.state || formState.state || "",
    ).trim();
    const stateCode = String(matchedState?.stateCode || "").trim();

    const matchedCity =
      locationOptionsService.findCity(
        countryCode,
        stateCode,
        location?.city || "",
      ) ||
      locationOptionsService.findCity(countryCode, stateCode, formState.city || "");

    const cityValue = String(
      matchedCity?.value || location?.city || formState.city || "",
    ).trim();

    onFieldChange?.("country", countryCode);
    onFieldChange?.("state", stateValue);
    onFieldChange?.("city", cityValue);
    onFieldChange?.(
      "streetAddress",
      String(location?.streetAddress || formState.streetAddress || "").trim(),
    );
    onFieldChange?.(
      "neighborhood",
      String(location?.neighborhood || formState.neighborhood || "").trim(),
    );
    onFieldChange?.(
      "postalCode",
      String(location?.postalCode || formState.postalCode || "").trim(),
    );

    if (location?.lat !== undefined && location?.lat !== null) {
      onFieldChange?.("latitude", String(location.lat));
    }
    if (location?.lng !== undefined && location?.lng !== null) {
      onFieldChange?.("longitude", String(location.lng));
    }
  };

  const handleCountryChange = (value) => {
    const nextCountryCode = normalizeCountryCode(value);
    const currentCountryCode = normalizeCountryCode(formState.country || "MX");
    const countryChanged = nextCountryCode !== currentCountryCode;

    onFieldChange?.("country", nextCountryCode);
    if (countryChanged) {
      onFieldChange?.("state", "");
      onFieldChange?.("city", "");
    }
  };

  const handleStateChange = (value) => {
    const nextState = String(value || "").trim();
    const currentState = String(formState.state || "").trim();
    const stateChanged = nextState !== currentState;

    onFieldChange?.("state", nextState);
    if (stateChanged) {
      onFieldChange?.("city", "");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("mapPicker.description")}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={MapPin}
          onClick={() => setIsMapOpen(true)}
        >
          {t("mapPicker.title")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label={t(fieldMap.country?.labelKey || "wizard.fields.location.country.label")}
          helperText={
            fieldMap.country?.helpKey ? t(fieldMap.country.helpKey) : undefined
          }
          required={Boolean(fieldMap.country?.required)}
          value={selectedCountryCode}
          options={countryOptions}
          placeholder={t("propertyForm.locationCombobox.countryPlaceholder")}
          error={getFieldError(stepErrors, stepId, "country")}
          onChange={handleCountryChange}
        />

        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t(fieldMap.state?.labelKey || "wizard.fields.location.state.label")}
            {fieldMap.state?.required ? (
              <span className="ml-1 text-red-500">*</span>
            ) : null}
          </label>
          <Combobox
            value={String(formState.state || "")}
            options={stateComboboxOptions}
            disabled={!selectedCountryCode || stateComboboxOptions.length === 0}
            inputClassName={COMBOBOX_INPUT_CLASS}
            placeholder={t("propertyForm.locationCombobox.statePlaceholder")}
            noResultsText={t("propertyForm.locationCombobox.noResultsState")}
            onChange={handleStateChange}
          />
          {getFieldError(stepErrors, stepId, "state") ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-300">
              {getFieldError(stepErrors, stepId, "state")}
            </p>
          ) : null}
        </div>

        <div className="min-w-0 md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t(fieldMap.city?.labelKey || "wizard.fields.location.city.label")}
            {fieldMap.city?.required ? (
              <span className="ml-1 text-red-500">*</span>
            ) : null}
          </label>
          <Combobox
            value={String(formState.city || "")}
            options={cityComboboxOptions}
            disabled={
              !selectedCountryCode ||
              !selectedStateCode ||
              cityComboboxOptions.length === 0
            }
            inputClassName={COMBOBOX_INPUT_CLASS}
            placeholder={t("propertyForm.locationCombobox.cityPlaceholder")}
            noResultsText={t("propertyForm.locationCombobox.noResultsCity")}
            onChange={(value) => onFieldChange?.("city", String(value || "").trim())}
          />
          {getFieldError(stepErrors, stepId, "city") ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-300">
              {getFieldError(stepErrors, stepId, "city")}
            </p>
          ) : null}
        </div>

        <TextInput
          label={t(
            fieldMap.streetAddress?.labelKey ||
              "wizard.fields.location.streetAddress.label",
          )}
          required={Boolean(fieldMap.streetAddress?.required)}
          value={formState.streetAddress || ""}
          className="min-w-0"
          error={getFieldError(stepErrors, stepId, "streetAddress")}
          onChange={(event) => onFieldChange?.("streetAddress", event.target.value)}
        />

        <TextInput
          label={t(
            fieldMap.neighborhood?.labelKey ||
              "wizard.fields.location.neighborhood.label",
          )}
          required={Boolean(fieldMap.neighborhood?.required)}
          value={formState.neighborhood || ""}
          className="min-w-0"
          error={getFieldError(stepErrors, stepId, "neighborhood")}
          onChange={(event) => onFieldChange?.("neighborhood", event.target.value)}
        />

        <TextInput
          label={t(
            fieldMap.postalCode?.labelKey ||
              "wizard.fields.location.postalCode.label",
          )}
          required={Boolean(fieldMap.postalCode?.required)}
          value={formState.postalCode || ""}
          className="min-w-0"
          error={getFieldError(stepErrors, stepId, "postalCode")}
          onChange={(event) => onFieldChange?.("postalCode", event.target.value)}
        />

        <NumberInput
          label={t(
            fieldMap.latitude?.labelKey || "wizard.fields.location.latitude.label",
          )}
          required={Boolean(fieldMap.latitude?.required)}
          value={formState.latitude ?? ""}
          min={-90}
          max={90}
          step={0.000001}
          precision={6}
          showStepper={false}
          className="min-w-0"
          error={getFieldError(stepErrors, stepId, "latitude")}
          onChange={(nextValue) =>
            onFieldChange?.("latitude", String(nextValue ?? ""))
          }
        />

        <NumberInput
          label={t(
            fieldMap.longitude?.labelKey || "wizard.fields.location.longitude.label",
          )}
          required={Boolean(fieldMap.longitude?.required)}
          value={formState.longitude ?? ""}
          min={-180}
          max={180}
          step={0.000001}
          precision={6}
          showStepper={false}
          className="min-w-0"
          error={getFieldError(stepErrors, stepId, "longitude")}
          onChange={(nextValue) =>
            onFieldChange?.("longitude", String(nextValue ?? ""))
          }
        />
      </div>

      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={applyLocationFromMap}
        latitude={latitude ?? 19.4326}
        longitude={longitude ?? -99.1332}
      />
    </div>
  );
}
