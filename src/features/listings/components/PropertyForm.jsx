import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Check,
  DollarSign,
  FileText,
  Home,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Combobox from "../../../components/common/molecules/Combobox";
import { Select } from "../../../components/common";
import { getAmenityIcon } from "../../../data/amenitiesCatalog";
import { propertiesService } from "../../../services/propertiesService";
import { isValidSlug, normalizeSlug } from "../../../utils/slug";
import { locationOptionsService } from "../services/locationOptionsService";

const defaultForm = {
  slug: "",
  title: "",
  description: "",
  propertyType: "house",
  operationType: "sale",
  price: "",
  currency: "MXN",
  bedrooms: "0",
  bathrooms: "0",
  maxGuests: "1",
  city: "",
  state: "",
  country: "MX",
  status: "draft",
  featured: false,
  amenityIds: [],
};

const PROPERTY_TYPES = [
  { value: "house", key: "propertyForm.options.propertyType.house" },
  { value: "apartment", key: "propertyForm.options.propertyType.apartment" },
  { value: "land", key: "propertyForm.options.propertyType.land" },
  { value: "commercial", key: "propertyForm.options.propertyType.commercial" },
  { value: "office", key: "propertyForm.options.propertyType.office" },
  { value: "warehouse", key: "propertyForm.options.propertyType.warehouse" },
];

const OPERATION_TYPES = [
  { value: "sale", key: "propertyForm.options.operationType.sale" },
  { value: "rent", key: "propertyForm.options.operationType.rent" },
  { value: "vacation_rental", key: "propertyForm.options.operationType.vacationRental" },
];

const STATUS_OPTIONS = [
  { value: "draft", key: "propertyForm.options.status.draft" },
  { value: "published", key: "propertyForm.options.status.published" },
  { value: "inactive", key: "propertyForm.options.status.inactive" },
  { value: "archived", key: "propertyForm.options.status.archived" },
];

const FORM_SECTIONS = [
  {
    id: "basicInfo",
    titleKey: "propertyForm.sections.basicInfo",
    icon: FileText,
    fields: ["slug", "title", "description", "propertyType", "operationType"],
  },
  {
    id: "pricing",
    titleKey: "propertyForm.sections.pricing",
    icon: DollarSign,
    fields: ["price", "currency", "status", "featured"],
  },
  {
    id: "location",
    titleKey: "propertyForm.sections.location",
    icon: MapPin,
    fields: ["country", "state", "city"],
  },
  {
    id: "features",
    titleKey: "propertyForm.sections.features",
    icon: Home,
    fields: ["bedrooms", "bathrooms", "maxGuests"],
  },
  {
    id: "amenities",
    titleKey: "propertyForm.sections.amenities",
    icon: Sparkles,
    fields: ["amenityIds"],
  },
];

const inputClassName =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

const inputErrorClassName =
  "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:focus:border-red-500";

const comboboxInputClassName = `${inputClassName} pr-9`;

const toInputString = (value, fallback = "") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const parseNumber = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampToRange = (value, min, max) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const sectionTransition = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
  transition: { duration: 0.2, ease: "easeOut" },
};

const buildFormState = (initialValues = {}) => ({
  ...defaultForm,
  ...initialValues,
  slug: normalizeSlug(initialValues.slug || ""),
  title: String(initialValues.title || ""),
  description: String(initialValues.description || ""),
  propertyType: String(initialValues.propertyType || defaultForm.propertyType),
  operationType: String(initialValues.operationType || defaultForm.operationType),
  price: toInputString(initialValues.price, ""),
  currency: String(initialValues.currency || defaultForm.currency),
  bedrooms: toInputString(initialValues.bedrooms, "0"),
  bathrooms: toInputString(initialValues.bathrooms, "0"),
  maxGuests: toInputString(initialValues.maxGuests, "1"),
  city: String(initialValues.city || ""),
  state: String(initialValues.state || ""),
  country: String(initialValues.country || defaultForm.country),
  status: String(initialValues.status || defaultForm.status),
  featured: Boolean(initialValues.featured),
  amenityIds: Array.isArray(initialValues.amenityIds)
    ? Array.from(
        new Set(
          initialValues.amenityIds
            .map((id) => String(id || "").trim())
            .filter(Boolean)
        )
      )
    : [],
});

const PropertyForm = ({
  mode = "create",
  propertyId = "",
  initialValues,
  submitLabel,
  loading = false,
  amenitiesOptions = [],
  amenitiesLoading = false,
  onSubmit,
}) => {
  const { t, i18n } = useTranslation();

  const resolvedPropertyId = useMemo(
    () => String(propertyId || initialValues?.$id || "").trim(),
    [initialValues?.$id, propertyId]
  );

  const mergedInitialValues = useMemo(
    () => buildFormState(initialValues || {}),
    [initialValues]
  );

  const [form, setForm] = useState(mergedInitialValues);
  const [errors, setErrors] = useState({});
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");
  const [slugStatus, setSlugStatus] = useState({ state: "idle", checkedSlug: "" });
  const [amenityPickerValue, setAmenityPickerValue] = useState("");

  const slugCheckRequestRef = useRef(0);

  const isWizard = mode === "create";
  const currentSection = FORM_SECTIONS[activeSectionIndex];
  const isFirstSection = activeSectionIndex === 0;
  const isLastSection = activeSectionIndex === FORM_SECTIONS.length - 1;
  const amenityNameField = i18n.language === "es" ? "name_es" : "name_en";

  const initialSlug = useMemo(() => normalizeSlug(mergedInitialValues.slug), [mergedInitialValues.slug]);

  useEffect(() => {
    setForm(mergedInitialValues);
    setErrors({});
    setActiveSectionIndex(0);
    setAmenityPickerValue("");
    setSlugStatus({ state: "idle", checkedSlug: "" });
    setSlugManuallyEdited(mode === "edit");
  }, [mergedInitialValues, mode]);

  const clearError = (field) => {
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const setField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    clearError(field);
  };

  const propertyTypeOptions = useMemo(
    () =>
      PROPERTY_TYPES.map((option) => ({
        value: option.value,
        label: t(option.key),
      })),
    [t]
  );

  const operationTypeOptions = useMemo(
    () =>
      OPERATION_TYPES.map((option) => ({
        value: option.value,
        label: t(option.key),
      })),
    [t]
  );

  const currencyOptions = useMemo(
    () => [
      { value: "MXN", label: "MXN" },
      { value: "USD", label: "USD" },
      { value: "EUR", label: "EUR" },
    ],
    []
  );

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.key),
      })),
    [t]
  );

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
    [form.state, selectedCountryCode]
  );

  const selectedStateCode = selectedState?.stateCode || "";

  const cityOptions = useMemo(
    () => locationOptionsService.getCities(selectedCountryCode, selectedStateCode),
    [selectedCountryCode, selectedStateCode]
  );

  const selectedAmenities = useMemo(() => {
    const byId = new Map((amenitiesOptions || []).map((item) => [item.$id, item]));
    return (form.amenityIds || [])
      .map((amenityId) => byId.get(amenityId))
      .filter(Boolean);
  }, [amenitiesOptions, form.amenityIds]);

  const amenityPickerOptions = useMemo(() => {
    const selectedIds = new Set(form.amenityIds || []);

    return (amenitiesOptions || [])
      .filter((item) => !selectedIds.has(item.$id))
      .map((item) => {
        const label =
          item[amenityNameField] || item.name_es || item.name_en || item.slug || item.$id;

        return {
          value: item.$id,
          label,
          searchText: `${item.slug || ""} ${item.name_es || ""} ${item.name_en || ""}`.trim(),
        };
      })
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [amenitiesOptions, amenityNameField, form.amenityIds]);

  useEffect(() => {
    if (mode !== "create" || slugManuallyEdited) return;
    const generatedSlug = normalizeSlug(form.title || "");
    if (generatedSlug === form.slug) return;

    setForm((previous) => ({
      ...previous,
      slug: generatedSlug,
    }));
    setErrors((previous) => {
      if (!previous.slug) return previous;
      const next = { ...previous };
      delete next.slug;
      return next;
    });
  }, [form.title, form.slug, mode, slugManuallyEdited]);

  useEffect(() => {
    const candidate = normalizeSlug(form.slug);

    if (!candidate) {
      setSlugStatus({ state: "idle", checkedSlug: "" });
      return;
    }

    if (!isValidSlug(candidate) || candidate.length > 150) {
      setSlugStatus({ state: "invalid", checkedSlug: candidate });
      return;
    }

    if (mode === "edit" && candidate === initialSlug) {
      setSlugStatus({ state: "unchanged", checkedSlug: candidate });
      return;
    }

    const requestId = slugCheckRequestRef.current + 1;
    slugCheckRequestRef.current = requestId;
    setSlugStatus({ state: "checking", checkedSlug: candidate });

    const timerId = window.setTimeout(async () => {
      try {
        const result = await propertiesService.checkSlugAvailability(candidate, {
          excludePropertyId: resolvedPropertyId,
        });

        if (slugCheckRequestRef.current !== requestId) return;
        setSlugStatus({
          state: result.available ? "available" : "taken",
          checkedSlug: candidate,
        });
      } catch {
        if (slugCheckRequestRef.current !== requestId) return;
        setSlugStatus({ state: "error", checkedSlug: candidate });
      }
    }, 450);

    return () => window.clearTimeout(timerId);
  }, [form.slug, initialSlug, mode, resolvedPropertyId]);

  const ensureSlugAvailable = async () => {
    const candidate = normalizeSlug(form.slug);

    if (!candidate || !isValidSlug(candidate) || candidate.length > 150) {
      setSlugStatus({ state: "invalid", checkedSlug: candidate });
      return false;
    }

    if (mode === "edit" && candidate === initialSlug) {
      setSlugStatus({ state: "unchanged", checkedSlug: candidate });
      return true;
    }

    setSlugStatus({ state: "checking", checkedSlug: candidate });

    try {
      const result = await propertiesService.checkSlugAvailability(candidate, {
        excludePropertyId: resolvedPropertyId,
      });
      setSlugStatus({
        state: result.available ? "available" : "taken",
        checkedSlug: candidate,
      });
      return result.available;
    } catch {
      setSlugStatus({ state: "error", checkedSlug: candidate });
      return false;
    }
  };

  const validate = (fields = []) => {
    const hasFieldFilter = Array.isArray(fields) && fields.length > 0;
    const shouldValidate = (field) => !hasFieldFilter || fields.includes(field);

    const nextErrors = {};

    const title = String(form.title || "").trim();
    const description = String(form.description || "").trim();
    const slug = normalizeSlug(form.slug || "");

    const validCountry = locationOptionsService.findCountry(form.country);
    const validCountryCode = validCountry?.value || "";
    const validState = locationOptionsService.findState(validCountryCode, form.state);
    const validStateCode = validState?.stateCode || "";
    const validCity = locationOptionsService.findCity(validCountryCode, validStateCode, form.city);

    if (shouldValidate("slug")) {
      if (!slug) {
        nextErrors.slug = t("propertyForm.validation.slugRequired");
      } else if (!isValidSlug(slug) || slug.length > 150) {
        nextErrors.slug = t("propertyForm.validation.slugInvalid");
      } else if (slugStatus.state === "taken") {
        nextErrors.slug = t("propertyForm.validation.slugTaken");
      }
    }

    if (shouldValidate("title")) {
      if (!title) {
        nextErrors.title = t("propertyForm.validation.titleRequired");
      } else if (title.length < 3) {
        nextErrors.title = t("propertyForm.validation.titleMin");
      }
    }

    if (shouldValidate("description")) {
      if (!description) {
        nextErrors.description = t("propertyForm.validation.descriptionRequired");
      } else if (description.length < 20) {
        nextErrors.description = t("propertyForm.validation.descriptionMin");
      }
    }

    if (shouldValidate("propertyType") && !form.propertyType) {
      nextErrors.propertyType = t("propertyForm.validation.propertyTypeRequired");
    }

    if (shouldValidate("operationType") && !form.operationType) {
      nextErrors.operationType = t("propertyForm.validation.operationTypeRequired");
    }

    if (shouldValidate("price")) {
      const price = parseNumber(form.price, Number.NaN);
      if (!Number.isFinite(price)) {
        nextErrors.price = t("propertyForm.validation.priceRequired");
      } else if (price < 0) {
        nextErrors.price = t("propertyForm.validation.priceMin");
      }
    }

    if (shouldValidate("country") && !validCountry) {
      nextErrors.country = t("propertyForm.validation.countryRequired");
    }

    if (shouldValidate("state") && !validState) {
      nextErrors.state = t("propertyForm.validation.stateRequired");
    }

    if (shouldValidate("city") && !validCity) {
      nextErrors.city = t("propertyForm.validation.cityRequired");
    }

    if (shouldValidate("bedrooms")) {
      const bedrooms = parseNumber(form.bedrooms, Number.NaN);
      if (!Number.isFinite(bedrooms) || bedrooms < 0) {
        nextErrors.bedrooms = t("propertyForm.validation.bedroomsMin");
      }
    }

    if (shouldValidate("bathrooms")) {
      const bathrooms = parseNumber(form.bathrooms, Number.NaN);
      if (!Number.isFinite(bathrooms) || bathrooms < 0) {
        nextErrors.bathrooms = t("propertyForm.validation.bathroomsMin");
      }
    }

    if (shouldValidate("maxGuests")) {
      const maxGuests = parseNumber(form.maxGuests, Number.NaN);
      if (!Number.isFinite(maxGuests)) {
        nextErrors.maxGuests = t("propertyForm.validation.maxGuestsRequired");
      } else if (maxGuests < 1 || maxGuests > 500) {
        nextErrors.maxGuests = t("propertyForm.validation.maxGuestsRange");
      }
    }

    return nextErrors;
  };

  const setValidationErrors = (nextErrors) => {
    setErrors(nextErrors);

    const firstSectionWithError = FORM_SECTIONS.findIndex((section) =>
      section.fields.some((field) => nextErrors[field])
    );

    if (firstSectionWithError >= 0) {
      setActiveSectionIndex(firstSectionWithError);
    }
  };

  const buildPayload = () => {
    const validCountry = locationOptionsService.findCountry(form.country);
    const validCountryCode = validCountry?.value || "MX";
    const validState = locationOptionsService.findState(validCountryCode, form.state);
    const validStateCode = validState?.stateCode || "";
    const validCity = locationOptionsService.findCity(validCountryCode, validStateCode, form.city);

    return {
      slug: normalizeSlug(form.slug),
      title: String(form.title || "").trim(),
      description: String(form.description || "").trim(),
      propertyType: form.propertyType,
      operationType: form.operationType,
      price: clampToRange(parseNumber(form.price, 0), 0, 999999999),
      currency: form.currency || "MXN",
      bedrooms: clampToRange(parseNumber(form.bedrooms, 0), 0, 50),
      bathrooms: clampToRange(parseNumber(form.bathrooms, 0), 0, 50),
      maxGuests: clampToRange(parseNumber(form.maxGuests, 1), 1, 500),
      country: validCountry?.value || "MX",
      state: validState?.value || "",
      city: validCity?.value || "",
      status: form.status || "draft",
      featured: Boolean(form.featured),
      amenityIds: Array.from(new Set(form.amenityIds || [])),
    };
  };

  const handleNext = async () => {
    const stepErrors = validate(currentSection.fields);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((previous) => ({ ...previous, ...stepErrors }));
      return;
    }

    if (currentSection.fields.includes("slug")) {
      const slugAvailable = await ensureSlugAvailable();
      if (!slugAvailable) {
        setErrors((previous) => ({
          ...previous,
          slug: t("propertyForm.validation.slugTaken"),
        }));
        return;
      }
    }

    setActiveSectionIndex((index) =>
      Math.min(index + 1, FORM_SECTIONS.length - 1)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isWizard && !isLastSection) {
      await handleNext();
      return;
    }

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    const slugAvailable = await ensureSlugAvailable();
    if (!slugAvailable) {
      setValidationErrors({
        slug: t("propertyForm.validation.slugTaken"),
      });
      return;
    }

    await onSubmit?.(buildPayload());
  };

  const getFieldClassName = (field) =>
    errors[field] ? `${inputClassName} ${inputErrorClassName}` : inputClassName;

  const renderFieldError = (field) =>
    errors[field] ? (
      <p className="inline-flex items-start gap-1 text-xs text-red-600 dark:text-red-300">
        <AlertCircle size={12} className="mt-0.5" />
        <span>{errors[field]}</span>
      </p>
    ) : null;

  const handleTitleChange = (value) => {
    setForm((previous) => {
      const next = {
        ...previous,
        title: value,
      };

      if (mode === "create" && !slugManuallyEdited) {
        next.slug = normalizeSlug(value);
      }

      return next;
    });

    clearError("title");
    clearError("slug");
  };

  const handleSlugChange = (value) => {
    setSlugManuallyEdited(true);
    setField("slug", normalizeSlug(value));
  };

  const regenerateSlug = () => {
    const generated = normalizeSlug(form.title);
    setSlugManuallyEdited(false);
    setField("slug", generated);
  };

  const handleCountryChange = (countryCode) => {
    const nextCountryCode = String(countryCode || "").trim().toUpperCase();

    setForm((previous) => {
      const countryChanged = previous.country !== nextCountryCode;
      return {
        ...previous,
        country: nextCountryCode,
        state: countryChanged ? "" : previous.state,
        city: countryChanged ? "" : previous.city,
      };
    });

    clearError("country");
    clearError("state");
    clearError("city");
  };

  const handleStateChange = (stateName) => {
    const nextState = String(stateName || "").trim();

    setForm((previous) => {
      const stateChanged = previous.state !== nextState;
      return {
        ...previous,
        state: nextState,
        city: stateChanged ? "" : previous.city,
      };
    });

    clearError("state");
    clearError("city");
  };

  const handleCityChange = (cityName) => {
    setField("city", String(cityName || "").trim());
  };

  const handleAmenitySelect = (amenityId) => {
    const nextAmenityId = String(amenityId || "").trim();
    if (!nextAmenityId) {
      setAmenityPickerValue("");
      return;
    }

    setForm((previous) => {
      const current = Array.isArray(previous.amenityIds) ? previous.amenityIds : [];
      if (current.includes(nextAmenityId)) return previous;
      return {
        ...previous,
        amenityIds: [...current, nextAmenityId],
      };
    });

    setAmenityPickerValue("");
  };

  const removeAmenity = (amenityId) => {
    setForm((previous) => ({
      ...previous,
      amenityIds: (previous.amenityIds || []).filter((id) => id !== amenityId),
    }));
  };

  const slugStatusView = useMemo(() => {
    const status = slugStatus.state;

    if (status === "idle") {
      return {
        icon: null,
        text: t("propertyForm.slugStatus.idle"),
        className: "text-slate-500 dark:text-slate-400",
      };
    }

    if (status === "checking") {
      return {
        icon: Loader2,
        text: t("propertyForm.slugStatus.checking"),
        className: "text-cyan-700 dark:text-cyan-300",
      };
    }

    if (status === "available") {
      return {
        icon: Check,
        text: t("propertyForm.slugStatus.available"),
        className: "text-emerald-700 dark:text-emerald-300",
      };
    }

    if (status === "unchanged") {
      return {
        icon: Check,
        text: t("propertyForm.slugStatus.unchanged"),
        className: "text-emerald-700 dark:text-emerald-300",
      };
    }

    if (status === "taken") {
      return {
        icon: AlertCircle,
        text: t("propertyForm.slugStatus.taken"),
        className: "text-red-700 dark:text-red-300",
      };
    }

    if (status === "invalid") {
      return {
        icon: AlertCircle,
        text: t("propertyForm.slugStatus.invalid"),
        className: "text-red-700 dark:text-red-300",
      };
    }

    return {
      icon: AlertCircle,
      text: t("propertyForm.slugStatus.error"),
      className: "text-amber-700 dark:text-amber-300",
    };
  }, [slugStatus.state, t]);

  const renderSectionContent = () => {
    switch (currentSection.id) {
      case "basicInfo":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {t("propertyForm.fields.title")} *
              </span>
              <input
                required
                value={form.title}
                maxLength={200}
                className={getFieldClassName("title")}
                onChange={(event) => handleTitleChange(event.target.value)}
              />
              {renderFieldError("title")}
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {t("propertyForm.fields.slug")} *
              </span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  required
                  value={form.slug}
                  maxLength={150}
                  className={getFieldClassName("slug")}
                  onChange={(event) => handleSlugChange(event.target.value)}
                />
                <button
                  type="button"
                  onClick={regenerateSlug}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                >
                  <RefreshCw size={14} />
                  {t("propertyForm.actions.regenerateSlug")}
                </button>
              </div>
              <p className={`inline-flex items-center gap-1 text-xs ${slugStatusView.className}`}>
                {slugStatusView.icon ? (
                  <slugStatusView.icon
                    size={12}
                    className={slugStatus.state === "checking" ? "animate-spin" : ""}
                  />
                ) : null}
                <span>{slugStatusView.text}</span>
              </p>
              {renderFieldError("slug")}
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {t("propertyForm.fields.description")} *
              </span>
              <textarea
                required
                rows={5}
                maxLength={5000}
                value={form.description}
                className={getFieldClassName("description")}
                onChange={(event) => setField("description", event.target.value)}
              />
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{t("propertyForm.helper.description")}</span>
                <span>{`${String(form.description || "").length}/5000`}</span>
              </div>
              {renderFieldError("description")}
            </label>

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

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {t("propertyForm.fields.operationType")} *
              </span>
              <Select
                required
                value={form.operationType}
                options={operationTypeOptions}
                size="md"
                className={errors.operationType ? "border-red-400" : ""}
                onChange={(value) => setField("operationType", value)}
              />
              {renderFieldError("operationType")}
            </label>
          </div>
        );

      case "pricing":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {t("propertyForm.fields.price")} *
              </span>
              <input
                required
                min="0"
                max="999999999"
                type="number"
                value={form.price}
                className={getFieldClassName("price")}
                onChange={(event) => setField("price", event.target.value)}
              />
              {renderFieldError("price")}
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {t("propertyForm.fields.currency")}
              </span>
              <Select
                value={form.currency}
                options={currencyOptions}
                size="md"
                onChange={(value) => setField("currency", value)}
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {t("propertyForm.fields.status")}
              </span>
              <Select
                value={form.status}
                options={statusOptions}
                size="md"
                onChange={(value) => setField("status", value)}
              />
            </label>

            <label className="inline-flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setField("featured", event.target.checked)}
              />
              {t("propertyForm.fields.featured")}
            </label>
          </div>
        );

      case "location":
        return (
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

            <label className="grid gap-1 text-sm sm:col-span-2">
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
          </div>
        );

      case "features":
        return (
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {t("propertyForm.fields.bedrooms")}
              </span>
              <input
                min="0"
                max="50"
                type="number"
                value={form.bedrooms}
                className={getFieldClassName("bedrooms")}
                onChange={(event) => setField("bedrooms", event.target.value)}
              />
              {renderFieldError("bedrooms")}
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {t("propertyForm.fields.bathrooms")}
              </span>
              <input
                min="0"
                max="50"
                step="0.5"
                type="number"
                value={form.bathrooms}
                className={getFieldClassName("bathrooms")}
                onChange={(event) => setField("bathrooms", event.target.value)}
              />
              {renderFieldError("bathrooms")}
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {t("propertyForm.fields.maxGuests")} *
              </span>
              <input
                required
                min="1"
                max="500"
                type="number"
                value={form.maxGuests}
                className={getFieldClassName("maxGuests")}
                onChange={(event) => setField("maxGuests", event.target.value)}
              />
              {renderFieldError("maxGuests")}
            </label>
          </div>
        );

      case "amenities":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t("propertyForm.amenities.selected", {
                  count: form.amenityIds?.length || 0,
                })}
              </p>
            </div>

            {amenitiesLoading ? (
              <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Loader2 size={14} className="animate-spin" />
                {t("propertyForm.amenities.loading")}
              </p>
            ) : null}

            {!amenitiesLoading && amenitiesOptions.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {t("propertyForm.amenities.empty")}
              </p>
            ) : null}

            {!amenitiesLoading && amenitiesOptions.length > 0 ? (
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {t("propertyForm.amenities.searchLabel")}
                </span>
                <Combobox
                  value={amenityPickerValue}
                  options={amenityPickerOptions}
                  disabled={amenityPickerOptions.length === 0}
                  inputClassName={comboboxInputClassName}
                  placeholder={t("propertyForm.amenities.searchPlaceholder")}
                  noResultsText={t("propertyForm.amenities.searchEmpty")}
                  onChange={handleAmenitySelect}
                />
              </label>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {selectedAmenities.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {t("propertyForm.amenities.noneSelected")}
                </p>
              ) : (
                selectedAmenities.map((amenity) => {
                  const label =
                    amenity[amenityNameField] ||
                    amenity.name_es ||
                    amenity.name_en ||
                    amenity.slug;

                  return (
                    <button
                      key={amenity.$id}
                      type="button"
                      onClick={() => removeAmenity(amenity.$id)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200"
                    >
                      <span aria-hidden="true">{getAmenityIcon(amenity)}</span>
                      <span>{label}</span>
                      <X size={12} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const MotionSection = motion.section;

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/40 to-slate-100 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
              {isWizard ? t("propertyForm.mode.create") : t("propertyForm.mode.edit")}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {isWizard
                ? t("propertyForm.wizard.progress", {
                    current: activeSectionIndex + 1,
                    total: FORM_SECTIONS.length,
                  })
                : t("propertyForm.tabs.helper")}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {FORM_SECTIONS.map((section, index) => {
              const Icon = section.icon;
              const isActive = index === activeSectionIndex;
              const isCompleted = index < activeSectionIndex;
              const canOpen = !isWizard || index <= activeSectionIndex;

              return (
                <button
                  key={section.id}
                  type="button"
                  disabled={!canOpen}
                  onClick={() => setActiveSectionIndex(index)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition sm:text-sm ${
                    isActive
                      ? "border-cyan-500 bg-cyan-500 text-white"
                      : isCompleted
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  } ${!canOpen ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isActive
                        ? "bg-white/20"
                        : isCompleted
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {isCompleted ? <Check size={12} /> : <Icon size={12} />}
                  </span>
                  <span>{t(section.titleKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <MotionSection
          key={currentSection.id}
          {...sectionTransition}
          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
              <currentSection.icon size={18} className="text-cyan-600 dark:text-cyan-300" />
              {t(currentSection.titleKey)}
            </h2>
          </div>

          {renderSectionContent()}
        </MotionSection>
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {Object.keys(errors).length > 0
            ? t("propertyForm.validation.errorSummary", {
                count: Object.keys(errors).length,
              })
            : t("propertyForm.validation.ready")}
        </div>

        <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          {isWizard ? (
            <button
              type="button"
              disabled={loading || isFirstSection}
              onClick={() => setActiveSectionIndex((index) => Math.max(index - 1, 0))}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <ArrowLeft size={14} />
              {t("propertyForm.actions.previous")}
            </button>
          ) : null}

          {isWizard && !isLastSection ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleNext}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-5 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t("propertyForm.actions.next")}
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-5 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {t("propertyForm.actions.saving")}
                </>
              ) : (
                <>
                  {submitLabel || t("propertyForm.actions.saveProperty")}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isWizard ? (
        <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200">
          <p className="inline-flex items-center gap-2">
            <Users size={12} />
            {t("propertyForm.wizard.hint")}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <p className="inline-flex items-center gap-2">
            <BedDouble size={12} />
            {t("propertyForm.tabs.hint")}
          </p>
        </div>
      )}
    </form>
  );
};

export default PropertyForm;
