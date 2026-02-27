import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
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
import { resourcesService } from "../../../services/resourcesService";
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
  initialWizardState,
  wizardReducer,
  actions,
  selectors,
} from "./wizardState";
import {
  buildContextFromSelection,
  buildPatchForSave,
  guessPricingChoiceIdFromPricingModel,
} from "./wizardMapping";
import { validateStep } from "./wizardValidation";
import WizardReview from "./components/WizardReview";
import FieldRenderer from "./components/FieldRenderer";
import LocationStepForm from "./components/LocationStepForm";

const RESOURCE_TYPE_IDS = [
  "property",
  "service",
  "music",
  "vehicle",
  "experience",
  "venue",
];

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

function getResourceTypeOptions(t) {
  return RESOURCE_TYPE_IDS.map((id) => ({
    id,
    label: t(`propertyForm.options.resourceType.${id}`),
  }));
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
    ) || list.find((item) => item.commercialMode === formState?.commercialMode);
  return selected?.id || "";
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

function isInteractiveTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, button, a, [role='button'], [contenteditable='true'], [data-no-swipe='true']",
    ),
  );
}

function emitHaptic(duration = 8) {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate(duration);
  }
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

export default function PropertyWizard({
  mode = "create",
  initialResourceDoc = null,
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
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");
  const swipeRef = useRef({ startX: 0, startY: 0, ignore: false });
  const slugCheckRequestRef = useRef(0);
  const resolvedInitialResourceId = useMemo(
    () =>
      String(initialResourceDoc?.$id || initialResourceDoc?.id || "").trim(),
    [initialResourceDoc],
  );
  const initialSlug = useMemo(
    () => normalizeSlug(initialResourceDoc?.slug || ""),
    [initialResourceDoc?.slug],
  );

  const formState = selectors.formState(state);
  const resourceType =
    formState.resourceType || selectors.resourceType(state) || "property";
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
  const resourceTypeField = useMemo(
    () => ({
      key: "resourceType",
      type: "select",
      labelKey: "propertyForm.fields.resourceType",
      options: getResourceTypeOptions(t),
      required: true,
    }),
    [t],
  );

  useEffect(() => {
    if (mode === "edit" && initialResourceDoc) {
      const hydratedBaseState =
        hydrateFormStateFromResource(initialResourceDoc);
      const hydratedResourceType = hydratedBaseState.resourceType || "property";
      const hydratedProfile = getProfile(hydratedResourceType);
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
      dispatch(actions.hydrate({ formState: hydratedFormState }));
      dispatch(actions.setContext({ context: hydratedContext }));
      setSlugManuallyEdited(true);
      setSlugStatus({
        state: hydratedFormState.slug ? "unchanged" : "idle",
        checkedSlug: normalizeSlug(hydratedFormState.slug || ""),
      });
      return;
    }

    setSlugManuallyEdited(false);
    setSlugStatus({ state: "idle", checkedSlug: "" });
  }, [mode, initialResourceDoc]);

  useEffect(() => {
    let cancelled = false;

    if (mode !== "edit" || !resolvedInitialResourceId) {
      setExistingImages([]);
      setExistingImagesLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setExistingImagesLoading(true);
    resourcesService
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
  }, [mode, resolvedInitialResourceId]);

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

  const fields = useMemo(() => {
    if (!profile || !currentStep) return [];
    const stepFields = getStepFields(
      profile,
      t,
      runtimeContext,
      currentStep.id,
    );
    if (currentStep.id !== "publishWhat") return stepFields;
    return [resourceTypeField, ...stepFields];
  }, [profile, t, runtimeContext, currentStep, resourceTypeField]);

  const stepErrors = selectors.stepErrors(state);
  const isSaving = selectors.isSaving(state);
  const canGoBack = currentStepIndex > 0;
  const isLastStep = currentStepIndex >= activeSteps.length - 1;
  const stepCount = Math.max(activeSteps.length, 1);
  const progressPercent =
    stepCount > 1 ? Math.round((currentStepIndex / (stepCount - 1)) * 100) : 0;

  useEffect(() => {
    if (mode !== "create" || slugManuallyEdited) return;

    const generatedSlug = normalizeSlug(formState.title || "");
    if (generatedSlug === String(formState.slug || "")) return;
    dispatch(actions.setField({ key: "slug", value: generatedSlug }));
  }, [mode, slugManuallyEdited, formState.title, formState.slug, dispatch]);

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

    if (mode === "edit" && candidate === initialSlug) {
      setSlugStatus({ state: "unchanged", checkedSlug: candidate });
      return;
    }

    const requestId = slugCheckRequestRef.current + 1;
    slugCheckRequestRef.current = requestId;
    setSlugStatus({ state: "checking", checkedSlug: candidate });

    const timerId = window.setTimeout(async () => {
      try {
        const result = await resourcesService.checkSlugAvailability(candidate, {
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
  }, [formState.slug, initialSlug, mode, resolvedInitialResourceId]);

  function handleStepClick(stepIndex) {
    if (stepIndex < 0 || stepIndex > currentStepIndex || isSaving) return;
    dispatch(actions.setStepIndex({ stepIndex }));
    emitHaptic(6);
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
    if (
      !currentErrors ||
      !Object.prototype.hasOwnProperty.call(currentErrors, errorPath)
    ) {
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

    if (mode === "edit" && candidate === initialSlug) {
      setSlugStatus({ state: "unchanged", checkedSlug: candidate });
      return { ok: true, reason: "unchanged" };
    }

    setSlugStatus({ state: "checking", checkedSlug: candidate });
    try {
      const result = await resourcesService.checkSlugAvailability(candidate, {
        excludePropertyId: resolvedInitialResourceId,
      });
      setSlugStatus({
        state: result.available ? "available" : "taken",
        checkedSlug: candidate,
      });
      return {
        ok: Boolean(result.available),
        reason: result.available ? "available" : "taken",
      };
    } catch {
      setSlugStatus({ state: "error", checkedSlug: candidate });
      return { ok: false, reason: "error" };
    }
  }

  function handleFieldChange(key, value) {
    clearFieldErrors(key);

    if (key === "title") {
      dispatch(actions.setField({ key, value }));
      if (mode === "create" && !slugManuallyEdited) {
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

    if (key === "resourceType") {
      dispatch(actions.setField({ key, value }));
      dispatch(actions.setField({ key: "category", value: "" }));
      dispatch(actions.setField({ key: "offeringId", value: "" }));
      dispatch(actions.setField({ key: "bookingType", value: "" }));
      dispatch(actions.setField({ key: "pricingChoiceId", value: "" }));
      dispatch(actions.setField({ key: "amenities", value: [] }));
      dispatch(actions.setField({ key: "attributes", value: {} }));
      clearFieldErrors("category");
      clearFieldErrors("offeringId");
      clearFieldErrors("pricingChoiceId");
      dispatch(
        actions.setContext({
          context: {
            resourceType: value,
            category: "",
            commercialMode: "",
            bookingType: "",
          },
        }),
      );
      dispatch(actions.setStepErrors({ errors: {} }));
      dispatch(actions.setStepIndex({ stepIndex: 0 }));
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
      dispatch(
        actions.setField({ key: "bookingType", value: nextBookingType }),
      );
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
      const nextContext = buildContextFromSelection(profile, {
        ...selectors.formState(state),
        bookingType: value,
        ...(value !== "manual_contact" && {
          attributes: {
            ...(selectors.formState(state).attributes || {}),
            manualContactScheduleType: "none",
          },
        }),
      });
      dispatch(actions.setContext({ context: nextContext }));
      return;
    }

    // Rebuild context when slotMode changes so conditional fields update
    if (key === "attributes.slotMode") {
      dispatch(actions.setField({ key, value }));
      const nextContext = buildContextFromSelection(profile, {
        ...selectors.formState(state),
        attributes: {
          ...(selectors.formState(state).attributes || {}),
          slotMode: value,
        },
      });
      dispatch(actions.setContext({ context: nextContext }));
      return;
    }

    dispatch(actions.setField({ key, value }));
  }

  async function handleNext() {
    if (!profile || !currentStep) return;

    const normalizedFormState = normalizeFormState(selectors.formState(state));
    const nextContext = buildContextFromSelection(profile, normalizedFormState);

    const validation = validateStep({
      profile,
      stepId: currentStep.id,
      fields,
      formState: normalizedFormState,
      context: {
        ...nextContext,
        paymentsOnlineEnabled,
      },
      t,
    });

    if (!validation.ok) {
      dispatch(actions.setStepErrors({ errors: validation.errors }));
      return;
    }

    const stepHasSlugField = fields.some((field) => field.key === "slug");
    if (stepHasSlugField) {
      const slugValidation = await ensureSlugAvailable();
      if (!slugValidation.ok) {
        const slugErrorMessage =
          slugValidation.reason === "taken"
            ? t("propertyForm.validation.slugTaken")
            : t("propertyForm.validation.slugInvalid");
        dispatch(
          actions.setStepErrors({
            errors: {
              ...selectors.stepErrors(state),
              [getStepErrorPath(currentStep.id, "slug")]: slugErrorMessage,
            },
          }),
        );
        return;
      }
    }

    dispatch(actions.setStepErrors({ errors: {} }));
    dispatch(actions.setContext({ context: nextContext }));
    dispatch(actions.nextStep({ max: activeSteps.length }));
    emitHaptic(10);
  }

  function handleBack() {
    if (!canGoBack || isSaving) return;
    dispatch(actions.prevStep());
    emitHaptic(8);
  }

  async function handleSave() {
    if (!profile) return;

    const normalizedFormState = normalizeFormState(selectors.formState(state));
    const nextContext = buildContextFromSelection(profile, normalizedFormState);

    const allErrors = {};
    for (const step of activeSteps) {
      if (step.id === "review") continue;

      const stepFieldsForValidation = getStepFields(
        profile,
        t,
        nextContext,
        step.id,
      );
      const stepFields =
        step.id === "publishWhat"
          ? [resourceTypeField, ...stepFieldsForValidation]
          : stepFieldsForValidation;

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
      const firstErrorStepId = Object.keys(allErrors)[0]?.split(".")?.[0];
      if (firstErrorStepId) {
        const idx = activeSteps.findIndex(
          (step) => step.id === firstErrorStepId,
        );
        if (idx >= 0) {
          dispatch(actions.setStepIndex({ stepIndex: idx }));
        }
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
      const describeStepIndex = activeSteps.findIndex(
        (step) => step.id === "describe",
      );
      if (describeStepIndex >= 0) {
        dispatch(actions.setStepIndex({ stepIndex: describeStepIndex }));
      }
      return;
    }

    dispatch(actions.setStepErrors({ errors: {} }));
    dispatch(actions.setIsSaving({ isSaving: true }));

    try {
      const patch = buildPatchForSave(
        profile,
        normalizedFormState,
        nextContext,
      );
      const saved = await onSave?.(patch, {
        mode,
        resourceId: initialResourceDoc?.$id || initialResourceDoc?.id,
      });

      if (mode === "edit") {
        const resolvedResourceId = String(
          resolvedInitialResourceId || saved?.$id || saved?.id || "",
        ).trim();

        if (resolvedResourceId) {
          try {
            const refreshedImages =
              await resourcesService.listImages(resolvedResourceId);
            setExistingImages(
              Array.isArray(refreshedImages) ? refreshedImages : [],
            );
          } catch {
            // Keep existing images snapshot if refresh fails.
          }
        }
      }

      dispatch(actions.setSaveResult({ result: saved || null }));
      emitHaptic(18);
    } catch (err) {
      dispatch(
        actions.setGlobalError({ error: err?.message || "SAVE_FAILED" }),
      );
    } finally {
      dispatch(actions.setIsSaving({ isSaving: false }));
    }
  }

  function handleTouchStart(event) {
    if (isSaving) return;
    const touch = event.touches?.[0];
    if (!touch) return;

    swipeRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      ignore: isInteractiveTarget(event.target),
    };
  }

  function handleTouchEnd(event) {
    if (isSaving) return;
    if (swipeRef.current.ignore) return;

    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const deltaX = touch.clientX - swipeRef.current.startX;
    const deltaY = Math.abs(touch.clientY - swipeRef.current.startY);

    const reachedHorizontalThreshold = Math.abs(deltaX) >= 70;
    const isMostlyHorizontal = deltaY <= 48;
    if (!reachedHorizontalThreshold || !isMostlyHorizontal) return;

    if (deltaX < 0 && !isLastStep) {
      void handleNext();
      return;
    }

    if (deltaX > 0 && canGoBack) {
      handleBack();
    }
  }

  if (!profile || !currentStep) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("wizard.errors.missingProfile")}
        </p>
      </div>
    );
  }

  const currentErrorCount = Object.keys(stepErrors || {}).length;
  const CurrentStepIcon = STEP_ICON_BY_ID[currentStep.id] || Home;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (isLastStep) {
          handleSave();
          return;
        }
        handleNext();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="grid gap-4 transition-colors duration-300 xl:grid-cols-[320px_minmax(0,1fr)]"
    >
      <aside className="hidden xl:block">
        <div className="sticky top-6 rounded-3xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.95)_100%)] p-5 shadow-xl shadow-slate-200/70 transition-colors duration-300 dark:border-cyan-500/20 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:shadow-2xl dark:shadow-cyan-950/35">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
            {t("wizard.title")}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("wizard.progress.inline", {
              current: currentStepIndex + 1,
              total: stepCount,
              defaultValue: `Paso ${currentStepIndex + 1} de ${stepCount}`,
            })}
          </p>

          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <nav
            className="mt-6 flex flex-col gap-1"
            aria-label={t("wizard.title")}
          >
            {activeSteps.map((step, idx) => {
              const StepIcon = STEP_ICON_BY_ID[step.id] || Home;
              const isCurrent = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              const canClick = idx <= currentStepIndex && !isSaving;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(idx)}
                  disabled={!canClick}
                  className="group relative flex w-full items-start gap-3 rounded-2xl px-3 py-2 text-left transition"
                >
                  <span
                    className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                      isCurrent
                        ? "border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200"
                        : isCompleted
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                          : "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                    }`}
                  >
                    {isCompleted ? <Check size={14} /> : <StepIcon size={14} />}
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

                  {idx < activeSteps.length - 1 ? (
                    <span className="pointer-events-none absolute left-7 top-10 h-7 w-px bg-slate-200 dark:bg-slate-800" />
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.95)_100%)] px-4 py-4 shadow-lg shadow-slate-200/70 transition-colors duration-300 dark:border-cyan-500/20 dark:bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 dark:shadow-cyan-950/25 xl:hidden">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
              {`Paso ${currentStepIndex + 1} de ${stepCount}`}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{`${progressPercent}%`}</span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div
            className="mt-4 flex gap-2 overflow-x-auto pb-1"
            data-no-swipe="true"
          >
            {activeSteps.map((step, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              const StepIcon = STEP_ICON_BY_ID[step.id] || Home;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(idx)}
                  disabled={idx > currentStepIndex || isSaving}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-semibold transition ${
                    isCurrent
                      ? "border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200"
                      : isCompleted
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                        : "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check size={13} /> : <StepIcon size={13} />}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
            {currentStep.title}
          </p>
          <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-500">
            {t("wizard.hints.swipe", {
              defaultValue: "Desliza izquierda/derecha para cambiar de paso",
            })}
          </p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-xl shadow-slate-200/70 transition-colors duration-300 dark:border-cyan-500/20 dark:bg-gradient-to-b dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 dark:shadow-2xl dark:shadow-cyan-950/35">
          <header className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6">
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

              <div className="flex items-center gap-2" data-no-swipe="true">
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
                {canGoBack ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isSaving}
                    leftIcon={ArrowLeft}
                    onClick={handleBack}
                  >
                    {t("wizard.actions.back")}
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
              <div
                className={
                  currentStep.id === "conditions"
                    ? "grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2"
                    : "space-y-5"
                }
              >
                {fields.map((field) => {
                  const value = selectors.getValue(state, field.key);
                  const error = stepErrors?.[`${currentStep.id}.${field.key}`];
                  // Full-width fields in conditions grid (selects / textareas)
                  const isFullWidth =
                    currentStep.id === "conditions" &&
                    (field.type === "select" || field.type === "textarea");

                  return (
                    <div
                      key={field.key}
                      className={isFullWidth ? "md:col-span-2" : undefined}
                    >
                      <FieldRenderer
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
                        onChange={(nextValue) =>
                          handleFieldChange(field.key, nextValue)
                        }
                      />
                    </div>
                  );
                })}

                {selectors.globalError(state) ? (
                  <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                    {selectors.globalError(state)}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <footer className="border-t border-slate-200/80 bg-slate-50/70 px-5 py-4 transition-colors duration-300 dark:border-slate-800/80 dark:bg-slate-950/50 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {currentErrorCount > 0 ? (
                  <span className="text-red-600 dark:text-red-300">
                    {t("propertyForm.validation.errorSummary", {
                      count: currentErrorCount,
                    })}
                  </span>
                ) : (
                  <span>{t("propertyForm.validation.ready")}</span>
                )}
              </div>

              <div
                className="flex w-full items-center justify-end gap-2 sm:w-auto"
                data-no-swipe="true"
              >
                {isLastStep ? (
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSaving}
                    loading={isSaving}
                    leftIcon={Save}
                    className="min-h-11 px-6 text-sm font-semibold"
                  >
                    {isSaving
                      ? t("wizard.actions.saving")
                      : t("wizard.actions.save")}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSaving}
                    rightIcon={ArrowRight}
                    className="min-h-11 px-6 text-sm font-semibold"
                  >
                    {t("wizard.actions.next")}
                  </Button>
                )}
              </div>
            </div>
          </footer>
        </section>
      </div>
    </form>
  );
}
