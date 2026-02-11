import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Combobox from "../../../components/common/molecules/Combobox";
import { getAmenityIcon } from "../../../data/amenitiesCatalog";
import { locationOptionsService } from "../services/locationOptionsService";

const defaultForm = {
  slug: "",
  title: "",
  description: "",
  propertyType: "house",
  operationType: "sale",
  price: "",
  currency: "MXN",
  pricePer: "total",
  priceNegotiable: false,
  totalArea: "",
  builtArea: "",
  bedrooms: 0,
  bathrooms: 0,
  parkingSpaces: 0,
  streetAddress: "",
  neighborhood: "",
  city: "",
  state: "",
  country: "MX",
  postalCode: "",
  latitude: "",
  longitude: "",
  status: "draft",
  featured: false,
  videoUrl: "",
  virtualTourUrl: "",
  amenityIds: [],
};

const PROPERTY_TYPES = [
  { value: "house", key: "propertyForm.options.propertyType.house" },
  { value: "apartment", key: "propertyForm.options.propertyType.apartment" },
  { value: "land", key: "propertyForm.options.propertyType.land" },
  { value: "commercial", key: "propertyForm.options.propertyType.commercial" },
  { value: "office", key: "propertyForm.options.propertyType.office" },
  { value: "warehouse", key: "propertyForm.options.propertyType.warehouse" },
  { value: "event_hall", key: "propertyForm.options.propertyType.eventHall" },
  { value: "condo", key: "propertyForm.options.propertyType.condo" },
  { value: "villa", key: "propertyForm.options.propertyType.villa" },
  { value: "building", key: "propertyForm.options.propertyType.building" },
];

const OPERATION_TYPES = [
  { value: "sale", key: "propertyForm.options.operationType.sale" },
  { value: "rent", key: "propertyForm.options.operationType.rent" },
  { value: "vacation_rental", key: "propertyForm.options.operationType.vacationRental" },
  { value: "transfer", key: "propertyForm.options.operationType.transfer" },
];

const STATUS_OPTIONS = [
  { value: "draft", key: "propertyForm.options.status.draft" },
  { value: "published", key: "propertyForm.options.status.published" },
  { value: "inactive", key: "propertyForm.options.status.inactive" },
];

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50";

const comboboxInputClassName = `${inputClassName} pr-9`;

const PropertyForm = ({
  initialValues,
  submitLabel,
  loading = false,
  amenitiesOptions = [],
  amenitiesLoading = false,
  onSubmit,
}) => {
  const { t, i18n } = useTranslation();

  const mergedInitialValues = useMemo(() => {
    const next = {
      ...defaultForm,
      ...(initialValues || {}),
    };

    next.amenityIds = Array.isArray(initialValues?.amenityIds)
      ? initialValues.amenityIds
      : [];

    return next;
  }, [initialValues]);

  const [form, setForm] = useState(mergedInitialValues);
  const amenityNameField = i18n.language === "es" ? "name_es" : "name_en";

  const countryOptions = useMemo(() => locationOptionsService.getCountries(), []);

  const selectedCountry = useMemo(
    () => locationOptionsService.findCountry(form.country),
    [form.country]
  );

  const selectedCountryCode = selectedCountry?.value || "";

  const stateOptions = useMemo(
    () => locationOptionsService.getStates(selectedCountryCode),
    [selectedCountryCode]
  );

  const selectedState = useMemo(
    () => locationOptionsService.findState(selectedCountryCode, form.state),
    [selectedCountryCode, form.state]
  );

  const selectedStateCode = selectedState?.stateCode || "";

  const cityOptions = useMemo(
    () => locationOptionsService.getCities(selectedCountryCode, selectedStateCode),
    [selectedCountryCode, selectedStateCode]
  );

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (countryCode) => {
    setForm((prev) => {
      const nextCountry = countryCode || "";
      const countryChanged = prev.country !== nextCountry;

      return {
        ...prev,
        country: nextCountry,
        state: countryChanged ? "" : prev.state,
        city: countryChanged ? "" : prev.city,
      };
    });
  };

  const handleStateChange = (stateName) => {
    setForm((prev) => {
      const nextState = stateName || "";
      const stateChanged = prev.state !== nextState;

      return {
        ...prev,
        state: nextState,
        city: stateChanged ? "" : prev.city,
      };
    });
  };

  const handleCityChange = (cityName) => {
    onChange("city", cityName || "");
  };

  const handleAmenityToggle = (amenityId) => {
    setForm((prev) => {
      const current = Array.isArray(prev.amenityIds) ? prev.amenityIds : [];
      const exists = current.includes(amenityId);
      return {
        ...prev,
        amenityIds: exists
          ? current.filter((id) => id !== amenityId)
          : [...current, amenityId],
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.slug || !form.title || !form.description) return;

    const validCountry = locationOptionsService.findCountry(form.country);
    const validCountryCode = validCountry?.value || "";
    const validState = locationOptionsService.findState(validCountryCode, form.state);
    const validStateCode = validState?.stateCode || "";
    const validCity = locationOptionsService.findCity(validCountryCode, validStateCode, form.city);

    if (form.country && !validCountry) {
      setForm((prev) => ({ ...prev, country: "", state: "", city: "" }));
      return;
    }

    if (!validState) {
      setForm((prev) => ({ ...prev, state: "", city: "" }));
      return;
    }

    if (!validCity) {
      setForm((prev) => ({ ...prev, city: "" }));
      return;
    }

    const payload = {
      ...form,
      country: validCountry?.value || form.country,
      state: validState.value,
      city: validCity.value,
    };

    onSubmit?.(payload);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("propertyForm.sections.basicInfo")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.slug")} *</span>
            <input
              required
              value={form.slug}
              className={inputClassName}
              onChange={(event) => onChange("slug", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.title")} *</span>
            <input
              required
              value={form.title}
              className={inputClassName}
              onChange={(event) => onChange("title", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span>{t("propertyForm.fields.description")} *</span>
            <textarea
              required
              rows={4}
              value={form.description}
              className={inputClassName}
              onChange={(event) => onChange("description", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.propertyType")} *</span>
            <select
              required
              value={form.propertyType}
              className={inputClassName}
              onChange={(event) => onChange("propertyType", event.target.value)}
            >
              {PROPERTY_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.key)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.operationType")} *</span>
            <select
              required
              value={form.operationType}
              className={inputClassName}
              onChange={(event) => onChange("operationType", event.target.value)}
            >
              {OPERATION_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.key)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("propertyForm.sections.pricing")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.price")} *</span>
            <input
              required
              min="0"
              type="number"
              value={form.price}
              className={inputClassName}
              onChange={(event) => onChange("price", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.currency")}</span>
            <select
              value={form.currency}
              className={inputClassName}
              onChange={(event) => onChange("currency", event.target.value)}
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.pricePer")}</span>
            <select
              value={form.pricePer}
              className={inputClassName}
              onChange={(event) => onChange("pricePer", event.target.value)}
            >
              <option value="total">{t("propertyForm.options.pricePer.total")}</option>
              <option value="sqm">{t("propertyForm.options.pricePer.sqm")}</option>
              <option value="sqft">{t("propertyForm.options.pricePer.sqft")}</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.status")}</span>
            <select
              value={form.status}
              className={inputClassName}
              onChange={(event) => onChange("status", event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.key)}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.priceNegotiable}
              onChange={(event) => onChange("priceNegotiable", event.target.checked)}
            />
            {t("propertyForm.fields.priceNegotiable")}
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => onChange("featured", event.target.checked)}
            />
            {t("propertyForm.fields.featured")}
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("propertyForm.sections.location")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.streetAddress")}</span>
            <input
              value={form.streetAddress}
              className={inputClassName}
              onChange={(event) => onChange("streetAddress", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.neighborhood")}</span>
            <input
              value={form.neighborhood}
              className={inputClassName}
              onChange={(event) => onChange("neighborhood", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.country")}</span>
            <Combobox
              value={form.country}
              options={countryOptions}
              inputClassName={comboboxInputClassName}
              placeholder={t("propertyForm.locationCombobox.countryPlaceholder")}
              noResultsText={t("propertyForm.locationCombobox.noResultsCountry")}
              onChange={handleCountryChange}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.state")} *</span>
            <Combobox
              required
              value={form.state}
              options={stateOptions}
              disabled={!selectedCountryCode}
              inputClassName={comboboxInputClassName}
              placeholder={t("propertyForm.locationCombobox.statePlaceholder")}
              noResultsText={t("propertyForm.locationCombobox.noResultsState")}
              onChange={handleStateChange}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.city")} *</span>
            <Combobox
              required
              value={form.city}
              options={cityOptions}
              disabled={!selectedCountryCode || !selectedStateCode}
              inputClassName={comboboxInputClassName}
              placeholder={t("propertyForm.locationCombobox.cityPlaceholder")}
              noResultsText={t("propertyForm.locationCombobox.noResultsCity")}
              onChange={handleCityChange}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.postalCode")}</span>
            <input
              value={form.postalCode}
              className={inputClassName}
              onChange={(event) => onChange("postalCode", event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("propertyForm.sections.features")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.bedrooms")}</span>
            <input
              min="0"
              type="number"
              value={form.bedrooms}
              className={inputClassName}
              onChange={(event) => onChange("bedrooms", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.bathrooms")}</span>
            <input
              min="0"
              step="0.5"
              type="number"
              value={form.bathrooms}
              className={inputClassName}
              onChange={(event) => onChange("bathrooms", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.parkingSpaces")}</span>
            <input
              min="0"
              type="number"
              value={form.parkingSpaces}
              className={inputClassName}
              onChange={(event) => onChange("parkingSpaces", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.totalArea")}</span>
            <input
              min="0"
              type="number"
              value={form.totalArea}
              className={inputClassName}
              onChange={(event) => onChange("totalArea", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.builtArea")}</span>
            <input
              min="0"
              type="number"
              value={form.builtArea}
              className={inputClassName}
              onChange={(event) => onChange("builtArea", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.videoUrl")}</span>
            <input
              value={form.videoUrl}
              className={inputClassName}
              onChange={(event) => onChange("videoUrl", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.virtualTourUrl")}</span>
            <input
              value={form.virtualTourUrl}
              className={inputClassName}
              onChange={(event) => onChange("virtualTourUrl", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.latitude")}</span>
            <input
              type="number"
              step="0.000001"
              value={form.latitude}
              className={inputClassName}
              onChange={(event) => onChange("latitude", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("propertyForm.fields.longitude")}</span>
            <input
              type="number"
              step="0.000001"
              value={form.longitude}
              className={inputClassName}
              onChange={(event) => onChange("longitude", event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t("propertyForm.sections.amenities")}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-300">
            {t("propertyForm.amenities.selected", {
              count: form.amenityIds?.length || 0,
            })}
          </span>
        </div>

        {amenitiesLoading ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("propertyForm.amenities.loading")}
          </p>
        ) : null}

        {!amenitiesLoading && amenitiesOptions.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("propertyForm.amenities.empty")}
          </p>
        ) : null}

        {!amenitiesLoading && amenitiesOptions.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {amenitiesOptions.map((amenity) => {
              const isSelected = form.amenityIds?.includes(amenity.$id);
              const label =
                amenity[amenityNameField] ||
                amenity.name_es ||
                amenity.name_en ||
                amenity.slug;

              return (
                <button
                  key={amenity.$id}
                  type="button"
                  onClick={() => handleAmenityToggle(amenity.$id)}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? "border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-900/30 dark:text-sky-200"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">{getAmenityIcon(amenity)}</span>
                    <span>{label}</span>
                  </span>
                  <span className="text-xs font-semibold uppercase">
                    {isSelected
                      ? t("propertyForm.amenities.selectedLabel")
                      : t("propertyForm.amenities.selectLabel")}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading
          ? t("propertyForm.actions.saving")
          : submitLabel || t("propertyForm.actions.saveProperty")}
      </button>
    </form>
  );
};

export default PropertyForm;
