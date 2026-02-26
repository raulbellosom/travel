import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Check,
  CheckCircle2,
  DollarSign,
  FileText,
  Home,
  Layers,
  MapPin,
  Save,
  Tag,
  X,
} from "lucide-react";
import { Button } from "../../../components/common";
import { amenitiesService } from "../../../services/amenitiesService";
import { propertiesService } from "../../../services/propertiesService";
import { isValidSlug, normalizeSlug } from "../../../utils/slug";
import { useInstanceModules } from "../../../hooks/useInstanceModules";
import { getProfile } from "../wizardProfiles";
import {
  getActiveSteps,
  getStepFields,
  hydrateFormStateFromResource,
  normalizeFormState,
} from "../wizardProfiles/profileUtils";
import {
  actions,
  initialWizardState,
  selectors,
  wizardReducer,
} from "./wizardState";
import {
  buildContextFromSelection,
  buildPatchForSave,
  guessPricingChoiceIdFromPricingModel,
} from "./wizardMapping";
import { validateStep } from "./wizardValidation";
import FieldRenderer from "./components/FieldRenderer";
import LocationStepForm from "./components/LocationStepForm";
import WizardReview from "./components/WizardReview";

const STEP_ICON_BY_ID = {
  publishWhat: Home,
  howOffer: Layers,
  describe: FileText,
  details: Building2,
  conditions: Tag,
  price: DollarSign,
  location: MapPin,
  review: CheckCircle2,
};

function fileSignature(file) {
  return `${String(file?.name || "").trim()}-${Number(file?.size || 0)}-${Number(
    file?.lastModified || 0,
  )}`;
}

function sortSerializable(value) {
  if (Array.isArray(value)) return value.map(sortSerializable);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = sortSerializable(value[key]);
      return acc;
    }, {});
}

function buildComparablePatch(profile, formState, context) {
  const patch = buildPatchForSave(profile, formState, context);
  const comparable = { ...patch };

  if (typeof comparable.attributes === "string") {
    try {
      comparable.attributes = JSON.parse(comparable.attributes);
    } catch {
      comparable.attributes = {};
    }
  }

  if (Array.isArray(comparable.imageFiles)) {
    comparable.imageFiles = comparable.imageFiles.map(fileSignature);
  }

  return sortSerializable(comparable);
}

function getStepErrorPath(stepId, fieldKey) {
  return `${stepId}.${fieldKey}`;
}

function resolveBookingTypeByModule(rawBookingType, paymentsOnlineEnabled) {
  const normalized = String(rawBookingType || "").trim();
  if (
    !paymentsOnlineEnabled &&
    (normalized === "date_range" ||
      normalized === "time_slot" ||
      normalized === "fixed_event")
  ) {
    return "manual_contact";
  }
  return normalized;
}

function resolveOfferingOption(profile, category, offeringId) {
  if (!profile?.getOfferingOptions || !offeringId) return null;
  const options = profile.getOfferingOptions({
    t: (key) => key,
    category: category || "",
  });
  return Array.isArray(options)
    ? options.find((item) => item.id === offeringId) || null
    : null;
}

export default function PropertyTabsEditor({
  initialResourceDoc,
  onSave,
  onCancel,
}) {
  const { t } = useTranslation();
  const { isEnabled, loading: modulesLoading } = useInstanceModules();
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [existingImages, setExistingImages] = useState([]);
  const [existingImagesLoading, setExistingImagesLoading] = useState(false);
  const [amenitiesOptions, setAmenitiesOptions] = useState([]);
  const [amenitiesLoading, setAmenitiesLoading] = useState(false);
  const [slugStatus, setSlugStatus] = useState({
    state: "idle",
    checkedSlug: "",
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(true);
  const slugCheckRequestRef = useRef(0);
  const [baselineSignature, setBaselineSignature] = useState("");

  const resolvedInitialResourceId = useMemo(
    () => String(initialResourceDoc?.$id || initialResourceDoc?.id || "").trim(),
    [initialResourceDoc],
  );
  const initialSlug = useMemo(
    () => normalizeSlug(initialResourceDoc?.slug || ""),
    [initialResourceDoc?.slug],
  );

  const formState = selectors.formState(state);
  const resourceType = formState.resourceType || "property";
  const profile = useMemo(() => getProfile(resourceType), [resourceType]);
  const context = useMemo(
    () => buildContextFromSelection(profile, formState),
    [profile, formState],
  );
  const paymentsOnlineEnabled = useMemo(
    () =>
      modulesLoading ? true : Boolean(isEnabled("module.payments.online")),
    [modulesLoading, isEnabled],
  );
  const runtimeContext = useMemo(
    () => ({
      ...context,
      paymentsOnlineEnabled,
    }),
    [context, paymentsOnlineEnabled],
  );

  useEffect(() => {
    if (!initialResourceDoc) return;
    const hydratedBaseState = hydrateFormStateFromResource(initialResourceDoc);
    const hydratedResourceType = hydratedBaseState.resourceType || "property";
    const hydratedProfile = getProfile(hydratedResourceType);

    if (!hydratedProfile) return;

    const offeringId =
      hydratedBaseState.offeringId ||
      resolveOfferingId(hydratedProfile, hydratedBaseState);
    const pricingChoiceId =
      hydratedBaseState.pricingChoiceId ||
      guessPricingChoiceIdFromPricingModel(hydratedBaseState.pricingModel);

    const hydratedFormState = {
      ...hydratedBaseState,
      resourceType: hydratedResourceType,
      offeringId,
      pricingChoiceId,
    };

    const hydratedContext = buildContextFromSelection(
      hydratedProfile,
      hydratedFormState,
    );
    const normalized = normalizeFormState(hydratedFormState);
    const comparable = buildComparablePatch(
      hydratedProfile,
      normalized,
      hydratedContext,
    );

    dispatch(actions.hydrate({ formState: hydratedFormState }));
    dispatch(actions.setContext({ context: hydratedContext }));
    dispatch(actions.setStepErrors({ errors: {} }));
    dispatch(actions.setGlobalError({ error: null }));
    dispatch(actions.setStepIndex({ stepIndex: 0 }));
    setSlugManuallyEdited(Boolean(hydratedFormState.slug));
    setSlugStatus({
      state: hydratedFormState.slug ? "unchanged" : "idle",
      checkedSlug: normalizeSlug(hydratedFormState.slug || ""),
    });

    setBaselineSignature(JSON.stringify(comparable));
  }, [initialResourceDoc]);

  useEffect(() => {
    let cancelled = false;

    if (!resolvedInitialResourceId) {
      setExistingImages([]);
      setExistingImagesLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setExistingImagesLoading(true);
    propertiesService
      .listImages(resolvedInitialResourceId)
      .then((images) => {
        if (cancelled) return;
        setExistingImages(Array.isArray(images) ? images : []);
      })
      .catch(() => {
        if (cancelled) return;
        setExistingImages([]);
      })
      .finally(() => {
        if (cancelled) return;
        setExistingImagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedInitialResourceId]);

  useEffect(() => {
    let cancelled = false;
    setAmenitiesLoading(true);

    amenitiesService
      .listActive()
      .then((items) => {
        if (cancelled) return;
        setAmenitiesOptions(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (cancelled) return;
        setAmenitiesOptions([]);
      })
      .finally(() => {
        if (cancelled) return;
        setAmenitiesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeSteps = useMemo(() => {
    if (!profile) return [];
    return getActiveSteps(profile, t, runtimeContext);
  }, [profile, t, runtimeContext]);

  const currentStepIndex = selectors.stepIndex(state);
  const currentStep = activeSteps[currentStepIndex] || activeSteps[0] || null;

  useEffect(() => {
    if (activeSteps.length === 0) return;
    if (currentStepIndex < activeSteps.length) return;
    dispatch(actions.setStepIndex({ stepIndex: activeSteps.length - 1 }));
  }, [activeSteps.length, currentStepIndex]);

  const fields = useMemo(() => {
    if (!profile || !currentStep) return [];
    return getStepFields(profile, t, runtimeContext, currentStep.id);
  }, [profile, t, runtimeContext, currentStep]);

  const normalizedFormState = useMemo(
    () => normalizeFormState(formState),
    [formState],
  );

  const currentComparableSignature = useMemo(() => {
    if (!profile) return "";
    try {
      const comparable = buildComparablePatch(profile, normalizedFormState, context);
      return JSON.stringify(comparable);
    } catch {
      return "";
    }
  }, [profile, normalizedFormState, context]);

  const isDirty = Boolean(
    baselineSignature &&
      currentComparableSignature &&
      baselineSignature !== currentComparableSignature,
  );

  const stepErrors = selectors.stepErrors(state);
  const isSaving = selectors.isSaving(state);
  const globalError = selectors.globalError(state);
  const errorCount = Object.keys(stepErrors || {}).length;
  const CurrentStepIcon = STEP_ICON_BY_ID[currentStep?.id] || Home;

  useEffect(() => {
    if (slugManuallyEdited) return;
    const generatedSlug = normalizeSlug(formState.title || "");
    if (generatedSlug === String(formState.slug || "")) return;
    dispatch(actions.setField({ key: "slug", value: generatedSlug }));
  }, [slugManuallyEdited, formState.title, formState.slug]);

  useEffect(() => {
    const candidate = normalizeSlug(formState.slug || "");

    if (!candidate) {
      setSlugStatus({ state: "idle", checkedSlug: "" });
      return;
    }

    if (!isValidSlug(candidate) || candidate.length > 150) {
      setSlugStatus({ state: "invalid", checkedSlug: candidate });
      return;
    }

    if (candidate === initialSlug) {
      setSlugStatus({ state: "unchanged", checkedSlug: candidate });
      return;
    }

    const requestId = slugCheckRequestRef.current + 1;
    slugCheckRequestRef.current = requestId;
    setSlugStatus({ state: "checking", checkedSlug: candidate });

    const timerId = window.setTimeout(async () => {
      try {
        const result = await propertiesService.checkSlugAvailability(candidate, {
          excludePropertyId: resolvedInitialResourceId,
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

    return () => {
      window.clearTimeout(timerId);
    };
  }, [formState.slug, initialSlug, resolvedInitialResourceId]);

  function handleTabChange(stepIndex) {
    if (stepIndex < 0 || stepIndex >= activeSteps.length || isSaving) return;
    dispatch(actions.setStepIndex({ stepIndex }));
  }

  function clearFieldErrors(fieldKey) {
    const currentErrors = selectors.stepErrors(state);
    if (!currentErrors || Object.keys(currentErrors).length === 0) return;

    const nextErrors = Object.fromEntries(
      Object.entries(currentErrors).filter(
        ([errorKey]) => !errorKey.endsWith(`.${fieldKey}`),
      ),
    );

    if (Object.keys(nextErrors).length !== Object.keys(currentErrors).length) {
      dispatch(actions.setStepErrors({ errors: nextErrors }));
    }
  }

  function clearErrorPath(errorPath) {
    if (!errorPath) return;
    const currentErrors = selectors.stepErrors(state);
    if (!currentErrors || !Object.prototype.hasOwnProperty.call(currentErrors, errorPath)) {
      return;
    }
    const nextErrors = { ...currentErrors };
    delete nextErrors[errorPath];
    dispatch(actions.setStepErrors({ errors: nextErrors }));
  }

  function updateSlugField(nextValue, { manual = true } = {}) {
    const normalized = normalizeSlug(nextValue || "");
    setSlugManuallyEdited(Boolean(manual));
    dispatch(actions.setField({ key: "slug", value: normalized }));
    clearFieldErrors("slug");
    clearErrorPath(getStepErrorPath("describe", "slug"));
  }

  function regenerateSlug() {
    const generated = normalizeSlug(formState.title || "");
    updateSlugField(generated, { manual: false });
  }

  async function ensureSlugAvailable() {
    const currentSlug = normalizeSlug(formState.slug || "");
    const fallbackSlug = normalizeSlug(formState.title || "");
    const candidate = currentSlug || fallbackSlug;

    if (!candidate) {
      setSlugStatus({ state: "invalid", checkedSlug: "" });
      return { ok: false, reason: "invalid" };
    }

    if (candidate !== currentSlug) {
      dispatch(actions.setField({ key: "slug", value: candidate }));
    }

    if (!isValidSlug(candidate) || candidate.length > 150) {
      setSlugStatus({ state: "invalid", checkedSlug: candidate });
      return { ok: false, reason: "invalid" };
    }

    if (candidate === initialSlug) {
      setSlugStatus({ state: "unchanged", checkedSlug: candidate });
      return { ok: true, reason: "unchanged" };
    }

    setSlugStatus({ state: "checking", checkedSlug: candidate });
    try {
      const result = await propertiesService.checkSlugAvailability(candidate, {
        excludePropertyId: resolvedInitialResourceId,
      });
      setSlugStatus({
        state: result.available ? "available" : "taken",
        checkedSlug: candidate,
      });
      return { ok: Boolean(result.available), reason: result.available ? "available" : "taken" };
    } catch {
      setSlugStatus({ state: "error", checkedSlug: candidate });
      return { ok: false, reason: "error" };
    }
  }

  function handleFieldChange(key, value) {
    clearFieldErrors(key);

    if (key === "title") {
      dispatch(actions.setField({ key, value }));
      if (!slugManuallyEdited) {
        const generated = normalizeSlug(value || "");
        dispatch(actions.setField({ key: "slug", value: generated }));
      }
      clearFieldErrors("slug");
      clearErrorPath(getStepErrorPath("describe", "slug"));
      return;
    }

    if (key === "slug") {
      updateSlugField(value, { manual: true });
      return;
    }

    if (key === "category") {
      dispatch(actions.setField({ key, value }));
      dispatch(actions.setField({ key: "offeringId", value: "" }));
      dispatch(actions.setField({ key: "bookingType", value: "" }));
      dispatch(actions.setField({ key: "pricingChoiceId", value: "" }));
      dispatch(actions.setField({ key: "attributes", value: {} }));
      clearFieldErrors("offeringId");
      clearFieldErrors("bookingType");
      clearFieldErrors("attributes.manualContactScheduleType");
      clearFieldErrors("pricingChoiceId");
      const nextContext = buildContextFromSelection(profile, {
        ...state.formState,
        category: value,
        offeringId: "",
        bookingType: "",
        pricingChoiceId: "",
        attributes: {},
      });
      dispatch(actions.setContext({ context: nextContext }));
      return;
    }

    if (key === "offeringId") {
      const selectedOffering = resolveOfferingOption(
        profile,
        state.formState.category,
        value,
      );
      const nextBookingType = resolveBookingTypeByModule(
        selectedOffering?.bookingType || "",
        paymentsOnlineEnabled,
      );

      dispatch(actions.setField({ key, value }));
      dispatch(actions.setField({ key: "bookingType", value: nextBookingType }));
      dispatch(
        actions.setField({
          key: "attributes.manualContactScheduleType",
          value: "none",
        }),
      );
      dispatch(actions.setField({ key: "pricingChoiceId", value: "" }));
      clearFieldErrors("bookingType");
      clearFieldErrors("attributes.manualContactScheduleType");
      clearFieldErrors("pricingChoiceId");
      const nextContext = buildContextFromSelection(profile, {
        ...state.formState,
        offeringId: value,
        bookingType: nextBookingType,
        attributes: {
          ...(state.formState.attributes || {}),
          manualContactScheduleType: "none",
        },
        pricingChoiceId: "",
      });
      dispatch(actions.setContext({ context: nextContext }));
      return;
    }

    if (key === "bookingType") {
      dispatch(actions.setField({ key, value }));
      if (value !== "manual_contact") {
        dispatch(
          actions.setField({
            key: "attributes.manualContactScheduleType",
            value: "none",
          }),
        );
      }
      clearFieldErrors("attributes.manualContactScheduleType");
      return;
    }

    dispatch(actions.setField({ key, value }));
  }

  async function handleSave() {
    if (!profile || isSaving || !isDirty) return;

    const nextContext = buildContextFromSelection(profile, normalizedFormState);
    const allErrors = {};

    for (const step of activeSteps) {
      if (step.id === "review") continue;
      const stepFields = getStepFields(profile, t, nextContext, step.id);
      const validation = validateStep({
        profile,
        stepId: step.id,
        fields: stepFields,
        formState: normalizedFormState,
        context: {
          ...nextContext,
          paymentsOnlineEnabled,
        },
        t,
      });

      if (!validation.ok) {
        Object.assign(allErrors, validation.errors);
      }
    }

    if (Object.keys(allErrors).length > 0) {
      dispatch(actions.setStepErrors({ errors: allErrors }));
      const firstErrorPath = Object.keys(allErrors)[0] || "";
      const firstErrorStepId = firstErrorPath.split(".")[0];
      const firstStepIndex = activeSteps.findIndex(
        (step) => step.id === firstErrorStepId,
      );
      if (firstStepIndex >= 0) {
        dispatch(actions.setStepIndex({ stepIndex: firstStepIndex }));
      }
      return;
    }

    const slugValidation = await ensureSlugAvailable();
    if (!slugValidation.ok) {
      const slugErrorMessage =
        slugValidation.reason === "taken"
          ? t("propertyForm.validation.slugTaken")
          : t("propertyForm.validation.slugInvalid");
      const errorPath = getStepErrorPath("describe", "slug");
      dispatch(
        actions.setStepErrors({
          errors: {
            ...selectors.stepErrors(state),
            [errorPath]: slugErrorMessage,
          },
        }),
      );
      const describeStepIndex = activeSteps.findIndex((step) => step.id === "describe");
      if (describeStepIndex >= 0) {
        dispatch(actions.setStepIndex({ stepIndex: describeStepIndex }));
      }
      return;
    }

    dispatch(actions.setStepErrors({ errors: {} }));
    dispatch(actions.setGlobalError({ error: null }));
    dispatch(actions.setIsSaving({ isSaving: true }));

    try {
      const patch = buildPatchForSave(profile, normalizedFormState, nextContext);
      const saved = await onSave?.(patch, {
        mode: "edit",
        resourceId: resolvedInitialResourceId,
      });

      if (resolvedInitialResourceId) {
        try {
          const refreshedImages =
            await propertiesService.listImages(resolvedInitialResourceId);
          setExistingImages(Array.isArray(refreshedImages) ? refreshedImages : []);
        } catch {
          // Keep current snapshot when refresh fails.
        }
      }

      dispatch(actions.setSaveResult({ result: saved || null }));
      setBaselineSignature(currentComparableSignature);
    } catch (err) {
      dispatch(actions.setGlobalError({ error: err?.message || "SAVE_FAILED" }));
    } finally {
      dispatch(actions.setIsSaving({ isSaving: false }));
    }
  }

  if (!profile || !currentStep) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        {t("wizard.errors.missingProfile")}
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="hidden xl:block">
        <div className="sticky top-6 rounded-3xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.95)_100%)] p-5 shadow-xl shadow-slate-200/70 transition-colors duration-300 dark:border-cyan-500/20 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:shadow-2xl dark:shadow-cyan-950/35">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
            {t("wizard.title")}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("propertyForm.fields.resourceType")}:{" "}
            {t(`propertyForm.options.resourceType.${resourceType}`)}
          </p>

          <nav className="mt-5 flex flex-col gap-1" aria-label={t("wizard.title")}>
            {activeSteps.map((step, idx) => {
              const StepIcon = STEP_ICON_BY_ID[step.id] || Home;
              const isCurrent = idx === currentStepIndex;
              const hasStepError = Object.keys(stepErrors || {}).some((key) =>
                key.startsWith(`${step.id}.`),
              );

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleTabChange(idx)}
                  disabled={isSaving}
                  className={`group relative flex w-full items-start gap-3 rounded-2xl px-3 py-2 text-left transition ${
                    isCurrent
                      ? "bg-cyan-50/70 dark:bg-cyan-500/10"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span
                    className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                      hasStepError
                        ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-200"
                        : isCurrent
                          ? "border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200"
                          : "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                    }`}
                  >
                    {hasStepError ? "!" : <StepIcon size={14} />}
                  </span>

                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-semibold ${
                        isCurrent
                          ? "text-cyan-700 dark:text-cyan-100"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.description ? (
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-500">
                        {step.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-xl shadow-slate-200/70 transition-colors duration-300 dark:border-cyan-500/20 dark:bg-gradient-to-b dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 dark:shadow-2xl dark:shadow-cyan-950/35">
        <header className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 xl:hidden">
            {activeSteps.map((step, idx) => {
              const isCurrent = idx === currentStepIndex;
              const hasStepError = Object.keys(stepErrors || {}).some((key) =>
                key.startsWith(`${step.id}.`),
              );
              const StepIcon = STEP_ICON_BY_ID[step.id] || Home;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleTabChange(idx)}
                  disabled={isSaving}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-xs font-semibold transition ${
                    hasStepError
                      ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-200"
                      : isCurrent
                        ? "border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200"
                        : "border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  {hasStepError ? "!" : <StepIcon size={14} />}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/60 bg-cyan-50 text-cyan-700 dark:border-cyan-400/40 dark:bg-cyan-500/10 dark:text-cyan-200">
                <CurrentStepIcon size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {currentStep.title}
                </h2>
                {currentStep.description ? (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {currentStep.description}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onCancel ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSaving}
                  leftIcon={X}
                  onClick={onCancel}
                >
                  {t("common.cancel")}
                </Button>
              ) : null}
              {isDirty ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  loading={isSaving}
                  leftIcon={Save}
                  onClick={() => {
                    void handleSave();
                  }}
                >
                  {isSaving
                    ? t("wizard.actions.saving")
                    : t("wizard.actions.save", "Guardar")}
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <div className="min-h-[360px] px-5 py-5 sm:px-6 sm:py-6">
          {currentStep.id === "review" ? (
            <WizardReview
              profile={profile}
              formState={formState}
              context={runtimeContext}
              t={t}
            />
          ) : currentStep.id === "location" ? (
            <LocationStepForm
              t={t}
              fields={fields}
              formState={formState}
              stepErrors={stepErrors}
              stepId={currentStep.id}
              onFieldChange={handleFieldChange}
            />
          ) : (
            <div className="space-y-5">
              {fields.map((field) => {
                const value = selectors.getValue(state, field.key);
                const error = stepErrors?.[`${currentStep.id}.${field.key}`];

                return (
                  <FieldRenderer
                    key={field.key}
                    field={field}
                    value={value}
                    error={error}
                    t={t}
                    existingImages={existingImages}
                    existingImagesLoading={existingImagesLoading}
                    slugStatus={slugStatus}
                    onRegenerateSlug={regenerateSlug}
                    amenitiesOptions={amenitiesOptions}
                    amenitiesLoading={amenitiesLoading}
                    resourceType={resourceType}
                    category={context.category}
                    onChange={(nextValue) => handleFieldChange(field.key, nextValue)}
                  />
                );
              })}
            </div>
          )}

          {globalError ? (
            <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              {globalError}
            </div>
          ) : null}
        </div>

        <footer className="border-t border-slate-200/80 bg-slate-50/70 px-5 py-4 transition-colors duration-300 dark:border-slate-800/80 dark:bg-slate-950/50 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {errorCount > 0 ? (
                <span className="text-red-600 dark:text-red-300">
                  {t("propertyForm.validation.errorSummary", {
                    count: errorCount,
                  })}
                </span>
              ) : isDirty ? (
                <span>{t("editPropertyPage.messages.unsaved")}</span>
              ) : (
                <span>{t("editPropertyPage.messages.noChanges")}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isDirty ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                  <Check size={14} />
                  {t("editPropertyPage.messages.savedState")}
                </span>
              ) : null}
              {isDirty ? (
                <Button
                  type="button"
                  variant="primary"
                  disabled={isSaving}
                  loading={isSaving}
                  leftIcon={Save}
                  onClick={() => {
                    void handleSave();
                  }}
                >
                  {isSaving
                    ? t("wizard.actions.saving")
                    : t("wizard.actions.save", "Guardar")}
                </Button>
              ) : null}
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}

function resolveOfferingId(profile, formState) {
  const category = formState?.category || "";
  const options = profile?.getOfferingOptions?.({
    t: (key) => key,
    category,
  });
  const list = Array.isArray(options) ? options : [];
  const selected =
    list.find(
      (item) =>
        item.commercialMode === formState?.commercialMode &&
        item.bookingType === formState?.bookingType,
    ) ||
    list.find((item) => item.commercialMode === formState?.commercialMode);
  return selected?.id || "";
}
