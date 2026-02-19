import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { getActiveSteps } from "./wizardConfig";
import { useWizardForm } from "./useWizardForm";
import { INTERNAL_ROUTES } from "../../../../utils/internalRoutes";
import Modal, { ModalFooter } from "../../../../components/common/organisms/Modal";
import StepTypeAndInfo from "./steps/StepTypeAndInfo";
import StepLocation from "./steps/StepLocation";
import StepFeatures from "./steps/StepFeatures";
import StepRentalTerms from "./steps/StepRentalTerms";
import StepVacationRules from "./steps/StepVacationRules";
import StepPricing from "./steps/StepPricing";
import StepAmenities from "./steps/StepAmenities";
import StepImages from "./steps/StepImages";
import StepSummary from "./steps/StepSummary";
import { useInstanceModules } from "../../../../hooks/useInstanceModules";

/* ── animation variants ──────────────────────────────── */

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

const slideTransition = {
  x: { type: "spring", stiffness: 400, damping: 35 },
  opacity: { duration: 0.2 },
};

/* ── wizard component ───────────────────────────────── */

const PropertyWizard = ({
  loading = false,
  amenitiesOptions = [],
  amenitiesLoading = false,
  existingImages = [],
  onSubmit,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const modulesApi = useInstanceModules();

  const formHook = useWizardForm({
    mode: "create",
    amenitiesOptions,
    existingImages,
  });

  const {
    form,
    errors,
    setErrors,
    validate,
    buildPayload,
    ensureSlugAvailable,
  } = formHook;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const activeSteps = useMemo(
    () =>
      getActiveSteps(form.operationType, {
        isEnabled: modulesApi.isEnabled,
      }, {
        resourceType: form.resourceType,
        category: form.category || form.propertyType,
        commercialMode: form.commercialMode || form.operationType,
      }),
    [
      form.category,
      form.commercialMode,
      form.operationType,
      form.propertyType,
      form.resourceType,
      modulesApi.isEnabled,
    ],
  );

  const currentStep = activeSteps[currentStepIndex] || activeSteps[0];
  const isFirstStep = currentStepIndex === 0;
  const isSummary = currentStep.id === "summary";
  const totalSteps = activeSteps.length;

  /* ── Navigation handlers ───────────────────────────── */

  const goToStep = useCallback(
    (index) => {
      if (index < 0 || index >= activeSteps.length) return;
      setDirection(index > currentStepIndex ? 1 : -1);
      setCurrentStepIndex(index);
    },
    [activeSteps.length, currentStepIndex],
  );

  const handleNext = useCallback(async () => {
    if (isSummary) return;

    const stepErrors = validate(currentStep.fields);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      return;
    }

    // Check slug availability on the first step
    if (currentStep.fields.includes("slug")) {
      const slugAvailable = await ensureSlugAvailable();
      if (!slugAvailable) {
        setErrors((prev) => ({
          ...prev,
          slug: t("propertyForm.validation.slugTaken"),
        }));
        return;
      }
    }

    setCompletedSteps((prev) => new Set([...prev, currentStep.id]));
    setDirection(1);
    setCurrentStepIndex((idx) => Math.min(idx + 1, activeSteps.length - 1));
  }, [
    activeSteps.length,
    currentStep,
    ensureSlugAvailable,
    isSummary,
    setErrors,
    t,
    validate,
  ]);

  const handlePrevious = useCallback(() => {
    if (isFirstStep) return;
    setDirection(-1);
    setCurrentStepIndex((idx) => Math.max(idx - 1, 0));
  }, [isFirstStep]);

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault();

      // Full validation
      const allErrors = validate();
      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        // Navigate to the first step with errors
        const firstStepWithError = activeSteps.findIndex((step) =>
          step.fields.some((field) => allErrors[field]),
        );
        if (firstStepWithError >= 0) {
          goToStep(firstStepWithError);
        }
        return;
      }

      const slugAvailable = await ensureSlugAvailable();
      if (!slugAvailable) {
        setErrors({ slug: t("propertyForm.validation.slugTaken") });
        goToStep(0);
        return;
      }

      await onSubmit?.(buildPayload());
    },
    [
      activeSteps,
      buildPayload,
      ensureSlugAvailable,
      goToStep,
      onSubmit,
      setErrors,
      t,
      validate,
    ],
  );

  const handleStepClick = useCallback(
    (index) => {
      // Allow clicking on completed steps or the step right after completed ones
      if (
        completedSteps.has(activeSteps[index]?.id) ||
        index <= currentStepIndex
      ) {
        goToStep(index);
      }
    },
    [activeSteps, completedSteps, currentStepIndex, goToStep],
  );

  /* ── Cancel wizard ────────────────────────────────── */
  const handleCancel = useCallback(() => {
    setIsCancelModalOpen(true);
  }, []);

  const confirmCancel = useCallback(() => {
    setIsCancelModalOpen(false);
    navigate(INTERNAL_ROUTES.myProperties);
  }, [navigate]);

  /* ── Progress percentage ────────────────────────────── */

  const progressPercent = Math.round(
    (currentStepIndex / (totalSteps - 1)) * 100,
  );

  /* ── Step renderer ─────────────────────────────────── */

  const renderStepContent = () => {
    switch (currentStep.id) {
      case "typeAndInfo":
        return <StepTypeAndInfo formHook={formHook} modulesApi={modulesApi} />;
      case "location":
        return <StepLocation formHook={formHook} />;
      case "features":
        return <StepFeatures formHook={formHook} />;
      case "rentalTerms":
        return <StepRentalTerms formHook={formHook} />;
      case "vacationRules":
        return <StepVacationRules formHook={formHook} />;
      case "pricing":
        return <StepPricing formHook={formHook} />;
      case "amenities":
        return (
          <StepAmenities
            formHook={formHook}
            amenitiesLoading={amenitiesLoading}
          />
        );
      case "images":
        return <StepImages formHook={formHook} />;
      case "summary":
        return (
          <StepSummary
            formHook={formHook}
            amenitiesOptions={amenitiesOptions}
            onEditStep={(stepId) => {
              const index = activeSteps.findIndex((step) => step.id === stepId);
              if (index >= 0) goToStep(index);
            }}
          />
        );
      default:
        return null;
    }
  };

  /* ── render ────────────────────────────────────────── */

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-0 overflow-hidden lg:flex-row lg:gap-0"
      >
      {/* ── PROGRESS SIDEBAR (desktop) / TOP BAR (mobile) ── */}
      <div className="shrink-0 lg:w-72 xl:w-80">
        {/* Mobile: horizontal progress bar */}
        <div className="lg:hidden">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {/* Progress bar */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                {t("propertyForm.wizard.stepOf", {
                  current: currentStepIndex + 1,
                  total: totalSteps,
                })}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <Motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            {/* Step dots */}
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {activeSteps.map((step, idx) => {
                const isCompleted = completedSteps.has(step.id);
                const isCurrent = idx === currentStepIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepClick(idx)}
                    disabled={!isCompleted && idx > currentStepIndex}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-200 ${
                      isCurrent
                        ? "border-cyan-500 bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                        : isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500"
                    } ${!isCompleted && idx > currentStepIndex ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    aria-label={t(step.titleKey)}
                  >
                    {isCompleted ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      idx + 1
                    )}
                  </button>
                );
              })}
            </div>
            {/* Current step name */}
            <p className="mt-2 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t(currentStep.titleKey)}
            </p>
          </div>
        </div>

        {/* Desktop: vertical sidebar */}
        <div className="sticky top-6 hidden lg:block">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              {t("propertyForm.wizard.title")}
            </h3>
            <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
              {t("propertyForm.wizard.stepOf", {
                current: currentStepIndex + 1,
                total: totalSteps,
              })}
            </p>

            {/* Progress bar */}
            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <Motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* Step list */}
            <nav className="relative flex flex-col" aria-label="Wizard steps">
              {/* Connecting line */}
              <div className="absolute left-4 top-5 h-[calc(100%-40px)] w-0.5 bg-slate-200 dark:bg-slate-700" />

              {activeSteps.map((step, idx) => {
                const isCompleted = completedSteps.has(step.id);
                const isCurrent = idx === currentStepIndex;
                const StepIcon = step.icon;
                const canClick = isCompleted || idx <= currentStepIndex;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepClick(idx)}
                    disabled={!canClick}
                    className={`group relative z-10 flex items-start gap-3 py-2.5 text-left transition-colors ${
                      canClick
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    {/* Circle indicator */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isCurrent
                          ? "border-cyan-500 bg-cyan-500 text-white shadow-md shadow-cyan-500/25"
                          : isCompleted
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800"
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <StepIcon size={14} />
                      )}
                    </div>

                    {/* Label */}
                    <div className="min-w-0 pt-0.5">
                      <span
                        className={`block text-sm font-medium leading-tight transition-colors ${
                          isCurrent
                            ? "text-cyan-700 dark:text-cyan-300"
                            : isCompleted
                              ? "text-slate-700 dark:text-slate-200"
                              : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {t(step.titleKey)}
                      </span>
                      {isCurrent && (
                        <Motion.span
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400"
                        >
                          {t(step.descriptionKey)}
                        </Motion.span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────── */}
      <div className="min-w-0 flex-1 lg:pl-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Step header */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                <currentStep.icon size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t(currentStep.titleKey)}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t(currentStep.descriptionKey)}
                </p>
              </div>
            </div>
          </div>

          {/* Step content with animation */}
          <div className="relative min-h-[360px] overflow-hidden px-5 py-6">
            <AnimatePresence mode="wait" custom={direction}>
              <Motion.div
                key={currentStep.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
              >
                {renderStepContent()}
              </Motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation footer */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between gap-3">
              {/* Error summary */}
              <div className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                {Object.keys(errors).length > 0 ? (
                  <span className="text-red-600 dark:text-red-400">
                    {t("propertyForm.validation.errorSummary", {
                      count: Object.keys(errors).length,
                    })}
                  </span>
                ) : (
                  <span>
                    {isSummary
                      ? t("propertyForm.wizard.readyToSave")
                      : t("propertyForm.validation.ready")}
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCancel}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500"
                >
                  <X size={16} />
                  <span className="hidden sm:inline">
                    {t("propertyForm.actions.cancel", "Cancelar")}
                  </span>
                </button>
                {!isFirstStep && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handlePrevious}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500"
                  >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">
                      {t("propertyForm.actions.previous")}
                    </span>
                  </button>
                )}

                {isSummary ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-6 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-sky-500 hover:shadow-lg hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {t("propertyForm.actions.saving")}
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        {t("propertyForm.wizard.saveDraft")}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleNext}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-6 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-sky-500 hover:shadow-lg hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {t("propertyForm.actions.next")}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </form>

      {/* ── Cancel confirmation modal ────────────────── */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={t(
          "propertyForm.wizard.cancelTitle",
          "Cancelar creación de propiedad",
        )}
        size="sm"
        variant="warning"
        footer={
          <ModalFooter>
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t("common.cancel", "Cancelar")}
            </button>
            <button
              type="button"
              onClick={confirmCancel}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              {t("propertyForm.wizard.confirmCancel", "Salir")}
            </button>
          </ModalFooter>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t(
            "propertyForm.wizard.cancelMessage",
            "¿Estás seguro que deseas cancelar? Se perderá toda la información ingresada.",
          )}
        </p>
      </Modal>
    </>
  );
};

export default PropertyWizard;
