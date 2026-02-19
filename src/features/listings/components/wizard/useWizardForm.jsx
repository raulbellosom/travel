import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { propertiesService } from "../../../../services/propertiesService";
import { isValidSlug, normalizeSlug } from "../../../../utils/slug";
import { WIZARD_DEFAULTS } from "./wizardConfig";
import {
  normalizeAttributes,
  normalizeBookingType,
  normalizeCommercialMode,
  normalizePricingModel,
  normalizeResourceType,
  toLegacyOperationType,
  toLegacyPricePerUnit,
} from "../../../../utils/resourceModel";
import {
  isAllowedCategory,
  isAllowedCommercialMode,
  sanitizeCategory,
  sanitizeCommercialMode,
} from "../../../../utils/resourceTaxonomy";

let locationOptionsServicePromise = null;

const loadLocationOptionsService = async () => {
  if (!locationOptionsServicePromise) {
    locationOptionsServicePromise = import("../../services/locationOptionsService")
      .then((module) => module.locationOptionsService)
      .catch((error) => {
        locationOptionsServicePromise = null;
        throw error;
      });
  }

  return locationOptionsServicePromise;
};

/* ── helpers ────────────────────────────────────────────────────── */

const toInputString = (value, fallback = "") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const parseNumber = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampToRange = (value, min, max) => Math.min(max, Math.max(min, value));

const toFileSignature = (file) =>
  `${String(file?.name || "").trim()}-${Number(file?.size || 0)}-${Number(file?.lastModified || 0)}`;

const isValidPropertyImage = (file) => {
  const mime = String(file?.type || "")
    .trim()
    .toLowerCase();
  if (["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(mime))
    return true;
  const filename = String(file?.name || "")
    .trim()
    .toLowerCase();
  return /\.(png|jpe?g|webp)$/.test(filename);
};

const revokeBlobUrl = (url) => {
  if (typeof url === "string" && url.startsWith("blob:"))
    URL.revokeObjectURL(url);
};

export const formatFileSize = (bytes) => {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 KB";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const ALLOWED_PRICING_MODELS = Object.freeze({
  sale: ["total", "per_m2"],
  rent_long_term: ["per_month", "total", "per_m2"],
  rent_short_term: ["per_night", "per_day", "per_person", "total"],
  rent_hourly: ["per_hour", "per_event", "per_person", "total"],
});

const normalizeCategoryValue = (
  resourceType,
  value,
  fallback = WIZARD_DEFAULTS.category,
) => sanitizeCategory(resourceType, value || fallback);

const pickAllowedPricingModel = (inputValue, commercialMode) => {
  const normalizedMode = normalizeCommercialMode(commercialMode);
  const allowed = ALLOWED_PRICING_MODELS[normalizedMode] || ALLOWED_PRICING_MODELS.sale;
  const candidate = normalizePricingModel(inputValue, normalizedMode);
  return allowed.includes(candidate) ? candidate : allowed[0];
};

const buildCommercialState = (
  draft = {},
  nextCommercialInput = "sale",
  resourceTypeInput = WIZARD_DEFAULTS.resourceType,
) => {
  const normalizedResourceType = normalizeResourceType(resourceTypeInput);
  const commercialMode = sanitizeCommercialMode(
    normalizedResourceType,
    nextCommercialInput,
  );
  const pricingModel = pickAllowedPricingModel(
    draft.pricingModel || draft.pricePerUnit || "total",
    commercialMode,
  );
  const bookingType = normalizeBookingType(draft.bookingType, commercialMode);
  return {
    commercialMode,
    operationType: toLegacyOperationType(commercialMode),
    pricingModel,
    pricePerUnit: toLegacyPricePerUnit(pricingModel),
    bookingType,
  };
};

/* ── build form state ────────────────────────────────────────── */

export const buildFormState = (initialValues = {}) => {
  const merged = {
    ...WIZARD_DEFAULTS,
    ...(initialValues || {}),
  };

  const resourceType = normalizeResourceType(
    merged.resourceType || WIZARD_DEFAULTS.resourceType,
  );
  const category = normalizeCategoryValue(
    resourceType,
    merged.category || merged.propertyType || WIZARD_DEFAULTS.category,
    WIZARD_DEFAULTS.category,
  );
  const commercialState = buildCommercialState(
    merged,
    merged.commercialMode || merged.operationType || WIZARD_DEFAULTS.operationType,
    resourceType,
  );
  const amenityIds = Array.isArray(merged.amenityIds)
    ? Array.from(
        new Set(
          merged.amenityIds
            .map((id) => String(id || "").trim())
            .filter(Boolean),
        ),
      )
    : [];

  return {
    ...merged,
    resourceType,
    category,
    propertyType: category,
    commercialMode: commercialState.commercialMode,
    operationType: commercialState.operationType,
    pricingModel: commercialState.pricingModel,
    pricePerUnit: commercialState.pricePerUnit,
    bookingType: commercialState.bookingType,
    attributes: normalizeAttributes(merged.attributes || "{}"),
    slug: normalizeSlug(merged.slug || ""),
    title: String(merged.title || ""),
    description: String(merged.description || ""),
    price: toInputString(merged.price, ""),
    currency: String(merged.currency || WIZARD_DEFAULTS.currency),
    priceNegotiable: Boolean(merged.priceNegotiable),
    streetAddress: String(merged.streetAddress || ""),
    neighborhood: String(merged.neighborhood || ""),
    postalCode: String(merged.postalCode || ""),
    latitude: toInputString(merged.latitude, ""),
    longitude: toInputString(merged.longitude, ""),
    bedrooms: toInputString(merged.bedrooms, "0"),
    bathrooms: toInputString(merged.bathrooms, "0"),
    parkingSpaces: toInputString(merged.parkingSpaces, "0"),
    totalArea: toInputString(merged.totalArea, ""),
    builtArea: toInputString(merged.builtArea, ""),
    floors: toInputString(merged.floors, "1"),
    yearBuilt: toInputString(merged.yearBuilt, ""),
    maxGuests: toInputString(merged.maxGuests, "1"),
    furnished: String(merged.furnished || ""),
    petsAllowed: Boolean(merged.petsAllowed),
    rentPeriod: String(merged.rentPeriod || "monthly"),
    minStayNights: toInputString(merged.minStayNights, "1"),
    maxStayNights: toInputString(merged.maxStayNights, "365"),
    checkInTime: String(merged.checkInTime || "15:00"),
    checkOutTime: String(merged.checkOutTime || "11:00"),
    videoUrl: String(merged.videoUrl || ""),
    virtualTourUrl: String(merged.virtualTourUrl || ""),
    city: String(merged.city || ""),
    state: String(merged.state || ""),
    country: String(merged.country || WIZARD_DEFAULTS.country),
    status: String(merged.status || "draft"),
    featured: Boolean(merged.featured),
    amenityIds,
  };
};

/* ── main hook ──────────────────────────────────────────────── */

/**
 * useWizardForm — shared form state, validation, slug checking,
 * location cascade, amenity picker and image upload for the
 * property creation wizard and edit form.
 */
export const useWizardForm = ({
  mode = "create",
  propertyId = "",
  initialValues,
  amenitiesOptions = [],
  existingImages = [],
}) => {
  const { t, i18n } = useTranslation();

  const resolvedPropertyId = useMemo(
    () => String(propertyId || initialValues?.$id || "").trim(),
    [initialValues?.$id, propertyId],
  );

  const mergedInitialValues = useMemo(
    () => buildFormState(initialValues || {}),
    [initialValues],
  );

  /* ── state ─────────────────────────────────────────────── */

  const [form, setForm] = useState(mergedInitialValues);
  const [errors, setErrors] = useState({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");
  const [slugStatus, setSlugStatus] = useState({
    state: "idle",
    checkedSlug: "",
  });

  // amenity picker
  const [amenityPickerValue, setAmenityPickerValue] = useState("");
  const [amenityPickerKey, setAmenityPickerKey] = useState(0);

  // images
  const [pendingImageItems, setPendingImageItems] = useState([]);
  const [imageUploadError, setImageUploadError] = useState("");
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [locationService, setLocationService] = useState(null);
  const [isLocationOptionsLoading, setIsLocationOptionsLoading] =
    useState(false);
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  const slugCheckRequestRef = useRef(0);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const pendingImageItemsRef = useRef([]);

  const amenityNameField = i18n.language === "es" ? "name_es" : "name_en";

  const initialSlug = useMemo(
    () => normalizeSlug(mergedInitialValues.slug),
    [mergedInitialValues.slug],
  );

  /* ── cleanup ───────────────────────────────────────────── */

  const clearPendingImages = useCallback(() => {
    setPendingImageItems((prev) => {
      prev.forEach((item) => revokeBlobUrl(item.previewUrl));
      return [];
    });
  }, []);

  useEffect(() => {
    pendingImageItemsRef.current = pendingImageItems;
  }, [pendingImageItems]);

  useEffect(
    () => () =>
      pendingImageItemsRef.current.forEach((item) =>
        revokeBlobUrl(item.previewUrl),
      ),
    [],
  );

  /* ── reset on initialValues change ─────────────────── */

  useEffect(() => {
    setForm(mergedInitialValues);
    setErrors({});
    setAmenityPickerValue("");
    setAmenityPickerKey(0);
    setSlugStatus({ state: "idle", checkedSlug: "" });
    setSlugManuallyEdited(mode === "edit");
    setImageUploadError("");
    setIsDraggingImages(false);
    clearPendingImages();
  }, [clearPendingImages, mergedInitialValues, mode]);

  const ensureLocationOptionsLoaded = useCallback(async () => {
    if (locationService) return locationService;
    if (isLocationOptionsLoading) return null;

    setIsLocationOptionsLoading(true);
    try {
      const service = await loadLocationOptionsService();
      setLocationService(() => service);
      setCountryOptions(service.getCountries());
      return service;
    } catch {
      setLocationService(null);
      setCountryOptions([]);
      return null;
    } finally {
      setIsLocationOptionsLoading(false);
    }
  }, [isLocationOptionsLoading, locationService]);

  /* ── field helpers ─────────────────────────────────── */

  const clearError = useCallback((field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setField = useCallback(
    (field, value) => {
      setForm((prev) => {
        if (field === "operationType" || field === "commercialMode") {
          return {
            ...prev,
            ...buildCommercialState(prev, value, prev.resourceType),
          };
        }

        if (field === "propertyType" || field === "category") {
          const category = normalizeCategoryValue(
            prev.resourceType,
            value,
            prev.category || prev.propertyType || WIZARD_DEFAULTS.category,
          );
          return {
            ...prev,
            category,
            propertyType: category,
          };
        }

        if (field === "pricingModel" || field === "pricePerUnit") {
          const pricingModel = pickAllowedPricingModel(
            value,
            prev.commercialMode || prev.operationType || "sale",
          );
          return {
            ...prev,
            pricingModel,
            pricePerUnit: toLegacyPricePerUnit(pricingModel),
          };
        }

        if (field === "bookingType") {
          return {
            ...prev,
            bookingType: normalizeBookingType(
              value,
              prev.commercialMode || prev.operationType || "sale",
            ),
          };
        }

        if (field === "resourceType") {
          const nextResourceType = normalizeResourceType(value);
          const category = normalizeCategoryValue(
            nextResourceType,
            prev.category || prev.propertyType || WIZARD_DEFAULTS.category,
            WIZARD_DEFAULTS.category,
          );
          const commercialState = buildCommercialState(
            prev,
            prev.commercialMode || prev.operationType || WIZARD_DEFAULTS.operationType,
            nextResourceType,
          );
          return {
            ...prev,
            resourceType: nextResourceType,
            category,
            propertyType: category,
            ...commercialState,
          };
        }

        if (field === "attributes") {
          return {
            ...prev,
            attributes: normalizeAttributes(value),
          };
        }

        return { ...prev, [field]: value };
      });
      clearError(field);
      if (field === "operationType" || field === "commercialMode") {
        clearError("operationType");
        clearError("commercialMode");
      }
      if (field === "propertyType" || field === "category") {
        clearError("propertyType");
        clearError("category");
      }
      if (field === "pricingModel" || field === "pricePerUnit") {
        clearError("pricingModel");
        clearError("pricePerUnit");
      }
      if (field === "resourceType") {
        clearError("propertyType");
        clearError("category");
        clearError("operationType");
        clearError("commercialMode");
      }
    },
    [clearError],
  );

  /* ── slug auto-generate ────────────────────────────── */

  useEffect(() => {
    if (mode !== "create" || slugManuallyEdited) return;
    const generatedSlug = normalizeSlug(form.title || "");
    if (generatedSlug === form.slug) return;
    setForm((prev) => ({ ...prev, slug: generatedSlug }));
    clearError("slug");
  }, [form.title, form.slug, mode, slugManuallyEdited, clearError]);

  /* ── slug availability check ───────────────────────── */

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
        const result = await propertiesService.checkSlugAvailability(
          candidate,
          { excludePropertyId: resolvedPropertyId },
        );
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

  const ensureSlugAvailable = useCallback(async () => {
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
  }, [form.slug, initialSlug, mode, resolvedPropertyId]);

  /* ── Title / Slug handlers ─────────────────────────── */

  const handleTitleChange = useCallback(
    (value) => {
      setForm((prev) => {
        const next = { ...prev, title: value };
        if (mode === "create" && !slugManuallyEdited) {
          next.slug = normalizeSlug(value);
        }
        return next;
      });
      clearError("title");
      clearError("slug");
    },
    [mode, slugManuallyEdited, clearError],
  );

  const handleSlugChange = useCallback(
    (value) => {
      setSlugManuallyEdited(true);
      setField("slug", normalizeSlug(value));
    },
    [setField],
  );

  const regenerateSlug = useCallback(() => {
    const generated = normalizeSlug(form.title);
    setSlugManuallyEdited(false);
    setField("slug", generated);
  }, [form.title, setField]);

  /* ── Location ──────────────────────────────────────── */

  const selectedCountry = useMemo(() => {
    if (!locationService) return null;
    return locationService.findCountry(form.country);
  }, [form.country, locationService]);
  const selectedCountryCode = selectedCountry?.value || "";

  useEffect(() => {
    if (!locationService || !selectedCountryCode) {
      setStateOptions([]);
      return;
    }

    setStateOptions(locationService.getStates(selectedCountryCode));
  }, [locationService, selectedCountryCode]);

  const selectedState = useMemo(() => {
    if (!locationService || !selectedCountryCode) return null;
    return locationService.findState(selectedCountryCode, form.state);
  }, [form.state, locationService, selectedCountryCode]);
  const selectedStateCode = selectedState?.stateCode || "";

  useEffect(() => {
    if (!locationService || !selectedCountryCode || !selectedStateCode) {
      setCityOptions([]);
      return;
    }

    setCityOptions(locationService.getCities(selectedCountryCode, selectedStateCode));
  }, [locationService, selectedCountryCode, selectedStateCode]);

  const handleCountryChange = useCallback(
    (countryCode) => {
      const next = String(countryCode || "")
        .trim()
        .toUpperCase();
      setForm((prev) => {
        const changed = prev.country !== next;
        return {
          ...prev,
          country: next,
          state: changed ? "" : prev.state,
          city: changed ? "" : prev.city,
        };
      });
      clearError("country");
      clearError("state");
      clearError("city");
    },
    [clearError],
  );

  const handleStateChange = useCallback(
    (stateName) => {
      const next = String(stateName || "").trim();
      setForm((prev) => {
        const changed = prev.state !== next;
        return {
          ...prev,
          state: next,
          city: changed ? "" : prev.city,
        };
      });
      clearError("state");
      clearError("city");
    },
    [clearError],
  );

  const handleCityChange = useCallback(
    (cityName) => setField("city", String(cityName || "").trim()),
    [setField],
  );

  /* ── Amenities ─────────────────────────────────────── */

  const selectedAmenities = useMemo(() => {
    const byId = new Map(
      (amenitiesOptions || []).map((item) => [item.$id, item]),
    );
    return (form.amenityIds || []).map((id) => byId.get(id)).filter(Boolean);
  }, [amenitiesOptions, form.amenityIds]);

  const amenityPickerOptions = useMemo(() => {
    const selectedIds = new Set(form.amenityIds || []);
    return (amenitiesOptions || [])
      .filter((item) => !selectedIds.has(item.$id))
      .map((item) => {
        const label =
          item[amenityNameField] ||
          item.name_es ||
          item.name_en ||
          item.slug ||
          item.$id;
        return {
          value: item.$id,
          label,
          searchText:
            `${item.slug || ""} ${item.name_es || ""} ${item.name_en || ""}`.trim(),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [amenitiesOptions, amenityNameField, form.amenityIds]);

  const resetAmenityPicker = useCallback(() => {
    setAmenityPickerValue("");
    setAmenityPickerKey((prev) => prev + 1);
  }, []);

  const handleAmenitySelect = useCallback(
    (amenityId) => {
      const id = String(amenityId || "").trim();
      if (!id) {
        resetAmenityPicker();
        return;
      }
      setForm((prev) => {
        const current = Array.isArray(prev.amenityIds) ? prev.amenityIds : [];
        if (current.includes(id)) return prev;
        return { ...prev, amenityIds: [...current, id] };
      });
      resetAmenityPicker();
    },
    [resetAmenityPicker],
  );

  const removeAmenity = useCallback((amenityId) => {
    setForm((prev) => ({
      ...prev,
      amenityIds: (prev.amenityIds || []).filter((id) => id !== amenityId),
    }));
  }, []);

  /* ── Images ────────────────────────────────────────── */

  const normalizedExistingImages = useMemo(
    () =>
      Array.isArray(existingImages)
        ? [...existingImages].sort(
            (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
          )
        : [],
    [existingImages],
  );

  const addImageFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []).filter(Boolean);
      if (files.length === 0) return;

      setPendingImageItems((prev) => {
        const existingSigs = new Set(prev.map((i) => i.signature));
        const available = Math.max(0, 50 - prev.length);
        if (available === 0) {
          setImageUploadError(
            t("propertyForm.images.errors.maxFiles", { maxFiles: 50 }),
          );
          return prev;
        }

        const accepted = [];
        let invalidType = 0;
        let oversize = 0;
        let duplicate = 0;

        for (const file of files) {
          const sig = toFileSignature(file);
          if (!isValidPropertyImage(file)) {
            invalidType += 1;
            continue;
          }
          if (Number(file.size || 0) > 10 * 1024 * 1024) {
            oversize += 1;
            continue;
          }
          if (existingSigs.has(sig)) {
            duplicate += 1;
            continue;
          }
          existingSigs.add(sig);
          accepted.push(file);
        }

        const toAppend = accepted.slice(0, available);
        const skipped = Math.max(0, accepted.length - toAppend.length);
        const errorParts = [];
        if (invalidType > 0)
          errorParts.push(
            t("propertyForm.images.errors.invalidType", {
              count: invalidType,
            }),
          );
        if (oversize > 0)
          errorParts.push(
            t("propertyForm.images.errors.sizeExceeded", {
              count: oversize,
              maxSize: 10,
            }),
          );
        if (duplicate > 0)
          errorParts.push(
            t("propertyForm.images.errors.duplicates", {
              count: duplicate,
            }),
          );
        if (skipped > 0)
          errorParts.push(
            t("propertyForm.images.errors.maxFiles", { maxFiles: 50 }),
          );
        setImageUploadError(errorParts.join(" "));

        if (toAppend.length === 0) return prev;

        const newItems = toAppend.map((file) => ({
          id: `${toFileSignature(file)}-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
          file,
          signature: toFileSignature(file),
          previewUrl: URL.createObjectURL(file),
        }));

        return [...prev, ...newItems];
      });
    },
    [t],
  );

  const removePendingImage = useCallback((itemId) => {
    const id = String(itemId || "").trim();
    if (!id) return;
    setImageUploadError("");
    setPendingImageItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) revokeBlobUrl(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleGalleryInputChange = useCallback(
    (event) => {
      addImageFiles(event.target.files);
      event.target.value = "";
    },
    [addImageFiles],
  );

  const handleCameraInputChange = useCallback(
    (event) => {
      addImageFiles(event.target.files);
      event.target.value = "";
    },
    [addImageFiles],
  );

  const handleImageDragOver = useCallback(
    (event) => {
      event.preventDefault();
      if (!isDraggingImages) setIsDraggingImages(true);
    },
    [isDraggingImages],
  );

  const handleImageDragLeave = useCallback((event) => {
    event.preventDefault();
    const related = event.relatedTarget;
    if (related && event.currentTarget.contains(related)) return;
    setIsDraggingImages(false);
  }, []);

  const handleImageDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDraggingImages(false);
      addImageFiles(event.dataTransfer?.files);
    },
    [addImageFiles],
  );

  const resolveLocationValues = useCallback(() => {
    const rawCountry = String(form.country || "")
      .trim()
      .toUpperCase();
    const rawState = String(form.state || "").trim();
    const rawCity = String(form.city || "").trim();

    if (!locationService) {
      return {
        validCountry: rawCountry ? { value: rawCountry } : null,
        validState: rawState ? { value: rawState, stateCode: rawState } : null,
        validCity: rawCity ? { value: rawCity } : null,
      };
    }

    const validCountry = locationService.findCountry(form.country);
    const validCountryCode = validCountry?.value || "";
    const validState = locationService.findState(validCountryCode, form.state);
    const validStateCode = validState?.stateCode || "";
    const validCity = locationService.findCity(
      validCountryCode,
      validStateCode,
      form.city,
    );

    return {
      validCountry,
      validState,
      validCity,
    };
  }, [form.city, form.country, form.state, locationService]);

  /* ── Validation ────────────────────────────────────── */

  const validate = useCallback(
    (fields = []) => {
      const hasFieldFilter = Array.isArray(fields) && fields.length > 0;
      const shouldValidate = (field) =>
        !hasFieldFilter || fields.includes(field);

      const nextErrors = {};
      const title = String(form.title || "").trim();
      const description = String(form.description || "").trim();
      const slug = normalizeSlug(form.slug || "");
      const resourceType = normalizeResourceType(form.resourceType);
      const categoryValue = String(form.category || form.propertyType || "")
        .trim()
        .toLowerCase();
      const commercialModeValue = normalizeCommercialMode(
        form.commercialMode || form.operationType || "",
      );

      const { validCountry, validState, validCity } = resolveLocationValues();

      // slug
      if (shouldValidate("slug")) {
        if (!slug) nextErrors.slug = t("propertyForm.validation.slugRequired");
        else if (!isValidSlug(slug) || slug.length > 150)
          nextErrors.slug = t("propertyForm.validation.slugInvalid");
        else if (slugStatus.state === "taken")
          nextErrors.slug = t("propertyForm.validation.slugTaken");
      }
      // title
      if (shouldValidate("title")) {
        if (!title)
          nextErrors.title = t("propertyForm.validation.titleRequired");
        else if (title.length < 3)
          nextErrors.title = t("propertyForm.validation.titleMin");
      }
      // description
      if (shouldValidate("description")) {
        if (!description)
          nextErrors.description = t(
            "propertyForm.validation.descriptionRequired",
          );
        else if (description.length < 20)
          nextErrors.description = t("propertyForm.validation.descriptionMin");
      }
      // category/propertyType
      if (
        (shouldValidate("propertyType") || shouldValidate("category")) &&
        !categoryValue
      )
        nextErrors.propertyType = t(
          "propertyForm.validation.propertyTypeRequired",
        );
      else if (
        shouldValidate("propertyType") ||
        shouldValidate("category")
      ) {
        if (!isAllowedCategory(resourceType, categoryValue)) {
          nextErrors.propertyType = t(
            "propertyForm.validation.categoryInvalidForResourceType",
          );
        }
      }
      // commercialMode/operationType
      if (
        (shouldValidate("operationType") || shouldValidate("commercialMode")) &&
        !String(form.commercialMode || form.operationType || "").trim()
      )
        nextErrors.operationType = t(
          "propertyForm.validation.operationTypeRequired",
        );
      else if (
        shouldValidate("operationType") ||
        shouldValidate("commercialMode")
      ) {
        if (!isAllowedCommercialMode(resourceType, commercialModeValue)) {
          nextErrors.operationType = t(
            "propertyForm.validation.commercialModeInvalidForResourceType",
          );
        }
      }
      // price
      if (shouldValidate("price")) {
        const price = parseNumber(form.price, Number.NaN);
        if (!Number.isFinite(price))
          nextErrors.price = t("propertyForm.validation.priceRequired");
        else if (price < 0)
          nextErrors.price = t("propertyForm.validation.priceMin");
      }
      // country
      if (shouldValidate("country") && !validCountry)
        nextErrors.country = t("propertyForm.validation.countryRequired");
      // state
      if (shouldValidate("state") && !validState)
        nextErrors.state = t("propertyForm.validation.stateRequired");
      // city
      if (shouldValidate("city") && !validCity)
        nextErrors.city = t("propertyForm.validation.cityRequired");
      // bedrooms
      if (shouldValidate("bedrooms")) {
        const v = parseNumber(form.bedrooms, Number.NaN);
        if (!Number.isFinite(v) || v < 0)
          nextErrors.bedrooms = t("propertyForm.validation.bedroomsMin");
      }
      // bathrooms
      if (shouldValidate("bathrooms")) {
        const v = parseNumber(form.bathrooms, Number.NaN);
        if (!Number.isFinite(v) || v < 0)
          nextErrors.bathrooms = t("propertyForm.validation.bathroomsMin");
      }
      // maxGuests (vacation + hourly booking modes)
      if (
        shouldValidate("maxGuests") &&
        ["vacation_rental", "rent_hourly"].includes(form.operationType)
      ) {
        const v = parseNumber(form.maxGuests, Number.NaN);
        if (!Number.isFinite(v))
          nextErrors.maxGuests = t("propertyForm.validation.maxGuestsRequired");
        else if (v < 1 || v > 500)
          nextErrors.maxGuests = t("propertyForm.validation.maxGuestsRange");
      }

      return nextErrors;
    },
    [form, resolveLocationValues, slugStatus.state, t],
  );

  /* ── Build payload ─────────────────────────────────── */

  const buildPayload = useCallback(() => {
    const { validCountry, validState, validCity } = resolveLocationValues();

    const resourceType = normalizeResourceType(form.resourceType);
    const category = normalizeCategoryValue(
      resourceType,
      form.category || form.propertyType || "house",
      "house",
    );
    const commercialMode = sanitizeCommercialMode(
      resourceType,
      form.commercialMode || form.operationType || "sale",
    );
    const pricingModel = pickAllowedPricingModel(
      form.pricingModel || form.pricePerUnit || "total",
      commercialMode,
    );
    const bookingType = normalizeBookingType(form.bookingType, commercialMode);

    return {
      slug: normalizeSlug(form.slug),
      title: String(form.title || "").trim(),
      description: String(form.description || "").trim(),
      resourceType,
      category,
      propertyType: category,
      commercialMode,
      operationType: toLegacyOperationType(commercialMode),
      pricingModel,
      pricePerUnit: toLegacyPricePerUnit(pricingModel),
      bookingType,
      attributes: normalizeAttributes(form.attributes || "{}"),
      price: clampToRange(parseNumber(form.price, 0), 0, 999999999),
      currency: form.currency || "MXN",
      priceNegotiable: Boolean(form.priceNegotiable),
      streetAddress: String(form.streetAddress || "").trim(),
      neighborhood: String(form.neighborhood || "").trim(),
      postalCode: String(form.postalCode || "").trim(),
      latitude: parseNumber(form.latitude, null),
      longitude: parseNumber(form.longitude, null),
      bedrooms: clampToRange(parseNumber(form.bedrooms, 0), 0, 50),
      bathrooms: clampToRange(parseNumber(form.bathrooms, 0), 0, 50),
      parkingSpaces: clampToRange(parseNumber(form.parkingSpaces, 0), 0, 20),
      totalArea: parseNumber(form.totalArea, null),
      builtArea: parseNumber(form.builtArea, null),
      floors: clampToRange(parseNumber(form.floors, 1), 1, 200),
      yearBuilt: parseNumber(form.yearBuilt, null),
      maxGuests: clampToRange(parseNumber(form.maxGuests, 1), 1, 500),
      furnished: form.furnished || null,
      petsAllowed: Boolean(form.petsAllowed),
      rentPeriod:
        commercialMode === "rent_long_term"
          ? form.rentPeriod || "monthly"
          : null,
      minStayNights: clampToRange(parseNumber(form.minStayNights, 1), 1, 365),
      maxStayNights: clampToRange(parseNumber(form.maxStayNights, 365), 1, 365),
      checkInTime: form.checkInTime || "15:00",
      checkOutTime: form.checkOutTime || "11:00",
      videoUrl: String(form.videoUrl || "").trim(),
      virtualTourUrl: String(form.virtualTourUrl || "").trim(),
      country: validCountry?.value || "MX",
      state: validState?.value || "",
      city: validCity?.value || "",
      status: "draft",
      featured: Boolean(form.featured),
      amenityIds: Array.from(new Set(form.amenityIds || [])),
      imageFiles: pendingImageItems.map((i) => i.file).filter(Boolean),
    };
  }, [form, pendingImageItems, resolveLocationValues]);

  /* ── Slug status view ──────────────────────────────── */

  const slugStatusView = useMemo(() => {
    const s = slugStatus.state;
    const map = {
      idle: {
        text: t("propertyForm.slugStatus.idle"),
        className: "text-slate-500 dark:text-slate-400",
      },
      checking: {
        text: t("propertyForm.slugStatus.checking"),
        className: "text-cyan-700 dark:text-cyan-300",
        spin: true,
      },
      available: {
        text: t("propertyForm.slugStatus.available"),
        className: "text-emerald-700 dark:text-emerald-300",
      },
      unchanged: {
        text: t("propertyForm.slugStatus.unchanged"),
        className: "text-emerald-700 dark:text-emerald-300",
      },
      taken: {
        text: t("propertyForm.slugStatus.taken"),
        className: "text-red-700 dark:text-red-300",
      },
      invalid: {
        text: t("propertyForm.slugStatus.invalid"),
        className: "text-red-700 dark:text-red-300",
      },
    };
    return (
      map[s] || {
        text: t("propertyForm.slugStatus.error"),
        className: "text-amber-700 dark:text-amber-300",
      }
    );
  }, [slugStatus.state, t]);

  /* ── return ────────────────────────────────────────── */

  return {
    form,
    setForm,
    setField,
    errors,
    setErrors,
    clearError,
    validate,
    buildPayload,
    ensureSlugAvailable,

    // slug
    slugStatus,
    slugStatusView,
    slugManuallyEdited,
    handleTitleChange,
    handleSlugChange,
    regenerateSlug,

    // location
    countryOptions,
    stateOptions,
    cityOptions,
    isLocationOptionsLoading,
    ensureLocationOptionsLoaded,
    selectedCountryCode,
    selectedStateCode,
    handleCountryChange,
    handleStateChange,
    handleCityChange,

    // amenities
    selectedAmenities,
    amenityPickerOptions,
    amenityPickerValue,
    amenityPickerKey,
    amenityNameField,
    handleAmenitySelect,
    removeAmenity,

    // images
    pendingImageItems,
    normalizedExistingImages,
    imageUploadError,
    isDraggingImages,
    galleryInputRef,
    cameraInputRef,
    addImageFiles,
    removePendingImage,
    handleGalleryInputChange,
    handleCameraInputChange,
    handleImageDragOver,
    handleImageDragLeave,
    handleImageDrop,
    clearPendingImages,

    // helpers
    inputClassName:
      "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
    inputErrorClassName:
      "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:focus:border-red-500",
    getFieldClassName: (field) => {
      const base =
        "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
      const err =
        "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:focus:border-red-500";
      return errors[field] ? `${base} ${err}` : base;
    },
    renderFieldError: (field) =>
      errors[field] ? (
        <p className="inline-flex items-start gap-1 text-xs text-red-600 dark:text-red-300">
          <span className="mt-0.5 inline-block h-3 w-3 shrink-0">⚠</span>
          <span>{errors[field]}</span>
        </p>
      ) : null,
  };
};
