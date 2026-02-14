import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CalendarCheck,
  Camera,
  ClipboardList,
  DollarSign,
  Eye,
  Home,
  Loader2,
  MapPin,
  Save,
  Sparkles,
} from "lucide-react";
import { useWizardForm, buildFormState } from "../wizard/useWizardForm";
import { getInternalPropertyDetailRoute } from "../../../../utils/internalRoutes";
import Modal, {
  ModalFooter,
} from "../../../../components/common/organisms/Modal";
import StepTypeAndInfo from "../wizard/steps/StepTypeAndInfo";
import StepLocation from "../wizard/steps/StepLocation";
import StepFeatures from "../wizard/steps/StepFeatures";
import StepRentalTerms from "../wizard/steps/StepRentalTerms";
import StepVacationRules from "../wizard/steps/StepVacationRules";
import StepPricing from "../wizard/steps/StepPricing";
import StepAmenities from "../wizard/steps/StepAmenities";
import StepImages from "../wizard/steps/StepImages";

/* ── Tab definitions ──────────────────────────────── */

const ALL_TABS = [
  {
    id: "typeAndInfo",
    titleKey: "propertyForm.wizard.steps.typeAndInfo",
    icon: Home,
    appliesTo: ["sale", "rent", "vacation_rental"],
  },
  {
    id: "location",
    titleKey: "propertyForm.wizard.steps.location",
    icon: MapPin,
    appliesTo: ["sale", "rent", "vacation_rental"],
  },
  {
    id: "features",
    titleKey: "propertyForm.wizard.steps.features",
    icon: Building2,
    appliesTo: ["sale", "rent", "vacation_rental"],
  },
  {
    id: "rentalTerms",
    titleKey: "propertyForm.wizard.steps.rentalTerms",
    icon: ClipboardList,
    appliesTo: ["rent"],
  },
  {
    id: "vacationRules",
    titleKey: "propertyForm.wizard.steps.vacationRules",
    icon: CalendarCheck,
    appliesTo: ["vacation_rental"],
  },
  {
    id: "pricing",
    titleKey: "propertyForm.wizard.steps.pricing",
    icon: DollarSign,
    appliesTo: ["sale", "rent", "vacation_rental"],
  },
  {
    id: "amenities",
    titleKey: "propertyForm.wizard.steps.amenities",
    icon: Sparkles,
    appliesTo: ["sale", "rent", "vacation_rental"],
  },
  {
    id: "images",
    titleKey: "propertyForm.wizard.steps.images",
    icon: Camera,
    appliesTo: ["sale", "rent", "vacation_rental"],
  },
];

/* ── fade variant ─────────────────────────────────── */
const fadeVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/**
 * PropertyEditor — Tabbed form for editing an existing property.
 *
 * Key difference from wizard: no step-by-step navigation, all tabs are
 * always accessible, and the save button only appears when there are changes.
 */
const PropertyEditor = ({
  propertyId,
  initialValues,
  loading = false,
  amenitiesOptions = [],
  amenitiesLoading = false,
  existingImages = [],
  onSubmit,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("typeAndInfo");
  const [isConfirmLeaveModalOpen, setIsConfirmLeaveModalOpen] = useState(false);
  const tabsRef = useRef(null);

  const formHook = useWizardForm({
    mode: "edit",
    propertyId,
    initialValues,
    amenitiesOptions,
    existingImages,
  });

  const { form, errors, validate, buildPayload, pendingImageItems } = formHook;

  /* ── dirty tracking ─────────────────────────────── */
  const initialSnapshot = useRef(JSON.stringify(buildFormState(initialValues)));
  const isDirty = useMemo(() => {
    const current = JSON.stringify(
      Object.fromEntries(
        Object.entries(form).filter(([key]) => key !== "__version"),
      ),
    );
    return current !== initialSnapshot.current || pendingImageItems.length > 0;
  }, [form, pendingImageItems]);

  // Reset snapshot after a successful save
  const resetSnapshot = useCallback(() => {
    initialSnapshot.current = JSON.stringify(
      Object.fromEntries(
        Object.entries(form).filter(([key]) => key !== "__version"),
      ),
    );
  }, [form]);

  /* ── active tabs based on operation type ─────────── */
  const activeTabs = useMemo(
    () =>
      ALL_TABS.filter((tab) =>
        tab.appliesTo.includes(form.operationType || "sale"),
      ),
    [form.operationType],
  );

  // If the active tab is no longer applicable, reset to first
  useEffect(() => {
    if (!activeTabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(activeTabs[0]?.id || "typeAndInfo");
    }
  }, [activeTabs, activeTab]);

  /* ── warn before leaving with unsaved changes ─────── */
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  /* ── submit ─────────────────────────────────────── */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Gather all fields across all active tabs
      const allFields = activeTabs.reduce((acc, tab) => {
        const stepDef = ALL_TABS.find((t) => t.id === tab.id);
        // Use fields from wizard config if possible; fallback to empty
        return acc;
      }, []);

      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        // Find the first tab that contains an error
        for (const tab of activeTabs) {
          // Simple approach: switch to tab and let user see errors
          const tabHasError = Object.keys(validationErrors).some((field) => {
            // Rough heuristic — if error field starts with a field this tab manages
            return true; // Show errors inline in each tab
          });
          if (tabHasError) break;
        }
        return;
      }

      const payload = buildPayload();
      if (typeof onSubmit === "function") {
        await onSubmit(payload);
        resetSnapshot();
      }
    },
    [activeTabs, validate, buildPayload, onSubmit, resetSnapshot],
  );

  /* ── tab scroll for mobile ──────────────────────── */
  const scrollTabIntoView = useCallback((tabId) => {
    const container = tabsRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-tab="${tabId}"]`);
    if (el) el.scrollIntoView({ inline: "center", behavior: "smooth" });
  }, []);

  const switchTab = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      scrollTabIntoView(tabId);
    },
    [scrollTabIntoView],
  );

  /* ── navigate to summary view ───────────────────── */
  const handleNavigateToSummary = useCallback(() => {
    if (isDirty) {
      setIsConfirmLeaveModalOpen(true);
      return;
    }
    navigate(getInternalPropertyDetailRoute(propertyId));
  }, [isDirty, navigate, propertyId]);

  const confirmLeaveWithoutSaving = useCallback(() => {
    setIsConfirmLeaveModalOpen(false);
    navigate(getInternalPropertyDetailRoute(propertyId));
  }, [navigate, propertyId]);

  /* ── render tab content ─────────────────────────── */
  const renderTabContent = () => {
    switch (activeTab) {
      case "typeAndInfo":
        return <StepTypeAndInfo formHook={formHook} />;
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
        return <StepImages formHook={formHook} mode="edit" />;
      default:
        return null;
    }
  };

  /* ── errors badge count per tab ─────────────────── */
  const tabErrorCount = useMemo(() => {
    const counts = {};
    // We don't compute per-tab errors here for perf; errors show inline
    return counts;
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* ── Header with summary button ─────────────── */}
      <div className="flex items-center justify-end gap-2 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={handleNavigateToSummary}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-900/50"
        >
          <Eye className="h-4 w-4" />
          <span>{t("propertyForm.editor.viewSummary", "Ver resumen")}</span>
        </button>
      </div>

      {/* ── Tab bar ────────────────────────────────── */}
      <div
        ref={tabsRef}
        className="scrollbar-none flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-1 dark:border-slate-700 dark:bg-slate-900"
      >
        {activeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-tab={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition whitespace-nowrap ${
                isActive
                  ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t(tab.titleKey, tab.id)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content ────────────────────────────── */}
      <div className="min-h-[400px] rounded-b-2xl border border-t-0 border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.15 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Save footer (only when dirty) ──────────── */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="sticky bottom-0 z-20 flex items-center justify-between gap-4 rounded-b-2xl border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm sm:px-6 dark:border-slate-700 dark:bg-slate-900/95"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                "propertyForm.editor.unsavedChanges",
                "Tienes cambios sin guardar",
              )}
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-cyan-700 disabled:opacity-60 dark:bg-cyan-500 dark:hover:bg-cyan-600"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t("editPropertyPage.submit", "Guardar cambios")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm leave modal ────────────────────── */}
      <Modal
        isOpen={isConfirmLeaveModalOpen}
        onClose={() => setIsConfirmLeaveModalOpen(false)}
        title={t(
          "propertyForm.editor.confirmLeaveTitle",
          "Cambios sin guardar",
        )}
        size="sm"
        variant="warning"
        footer={
          <ModalFooter>
            <button
              type="button"
              onClick={() => setIsConfirmLeaveModalOpen(false)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t("common.cancel", "Cancelar")}
            </button>
            <button
              type="button"
              onClick={confirmLeaveWithoutSaving}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              {t("propertyForm.editor.confirmLeaveButton", "Salir sin guardar")}
            </button>
          </ModalFooter>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t(
            "propertyForm.editor.confirmLeaveUnsaved",
            "Tienes cambios sin guardar. ¿Deseas salir y descartarlos?",
          )}
        </p>
      </Modal>
    </form>
  );
};

export default PropertyEditor;
