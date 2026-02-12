import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { hasRoleAtLeast, hasScope } from "../../utils/roles";
import { globalSearchService } from "../../services/globalSearchService";
import { buildGlobalSearchResults } from "../../features/global-search/searchSuggestions";
import SearchResultsList from "./global-search/SearchResultsList";

const EMPTY_DATASET = Object.freeze({
  properties: [],
  leads: [],
  reservations: [],
  payments: [],
});

const groupByLabel = (items) => {
  const map = new Map();
  for (const item of items) {
    const current = map.get(item.groupLabel) || [];
    current.push(item);
    map.set(item.groupLabel, current);
  }
  return Array.from(map.entries()).map(([label, results]) => ({ label, results }));
};

const GlobalSearch = ({ showDesktopInput = true, showMobileTrigger = true }) => {
  const MotionDiv = motion.div;
  const MotionSection = motion.section;
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const desktopContainerRef = useRef(null);
  const mobileInputRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const [query, setQuery] = useState("");
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState(EMPTY_DATASET);

  const canReadProperties = hasScope(user, "properties.read");
  const canWriteProperties = hasScope(user, "properties.write");
  const canReadLeads = hasScope(user, "leads.read");
  const canReadReservations = hasScope(user, "reservations.read");
  const canReadPayments = hasScope(user, "payments.read");
  const canManageTeam = hasScope(user, "staff.manage");
  const canSeeSettings = hasRoleAtLeast(user?.role, "owner");

  useEffect(() => {
    setDataset(EMPTY_DATASET);
    hasLoadedRef.current = false;
    setQuery("");
  }, [user?.$id, user?.role]);

  const loadDataset = useCallback(async () => {
    if (!user?.$id || loading || hasLoadedRef.current) return;

    setLoading(true);
    try {
      const nextDataset = await globalSearchService.getDataset({
        ownerUserId: user.$id,
        role: user.role,
        canReadProperties,
        canReadLeads,
        canReadReservations,
        canReadPayments,
      });
      setDataset(nextDataset);
      hasLoadedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [
    canReadLeads,
    canReadPayments,
    canReadProperties,
    canReadReservations,
    loading,
    user?.$id,
    user?.role,
  ]);

  const { results } = useMemo(
    () =>
      buildGlobalSearchResults({
        t,
        query,
        dataset,
        canReadProperties,
        canReadLeads,
        canReadReservations,
        canReadPayments,
        canWriteProperties,
        canManageTeam,
        canSeeSettings,
      }),
    [
      canManageTeam,
      canReadLeads,
      canReadPayments,
      canReadProperties,
      canReadReservations,
      canSeeSettings,
      canWriteProperties,
      dataset,
      query,
      t,
    ]
  );

  const groupedResults = useMemo(() => groupByLabel(results), [results]);
  const flatResults = useMemo(() => groupedResults.flatMap((group) => group.results), [groupedResults]);

  useEffect(() => {
    if (!isDesktopOpen && !isMobileOpen) return;
    setActiveIndex(0);
  }, [isDesktopOpen, isMobileOpen, results.length]);

  useEffect(() => {
    if (!isDesktopOpen) return;

    const handleOutside = (event) => {
      if (!desktopContainerRef.current?.contains(event.target)) {
        setIsDesktopOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [isDesktopOpen]);

  const closeAll = () => {
    setIsDesktopOpen(false);
    setIsMobileOpen(false);
    setQuery("");
    setActiveIndex(0);
  };

  const executeAction = (item) => {
    if (!item?.action) return;

    if (item.action.type === "navigate") {
      navigate(item.action.to);
    } else if (item.action.type === "external") {
      window.location.assign(item.action.href);
    }

    closeAll();
  };

  const onInputKeyDown = (event) => {
    if (!flatResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % flatResults.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + flatResults.length) % flatResults.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      executeAction(flatResults[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsDesktopOpen(false);
      setIsMobileOpen(false);
    }
  };

  const openDesktopSearch = () => {
    setIsDesktopOpen(true);
    loadDataset();
  };

  const openMobileSearch = () => {
    setIsDesktopOpen(false);
    setIsMobileOpen(true);
    loadDataset();
    setTimeout(() => {
      mobileInputRef.current?.focus();
    }, 0);
  };

  const mobileSearchOverlay = (
    <AnimatePresence>
      {isMobileOpen ? (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] bg-slate-950/55 p-3 backdrop-blur-sm sm:hidden"
        >
          <MotionSection
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mx-auto flex h-full w-full max-w-[34rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/97 shadow-2xl dark:border-slate-700 dark:bg-slate-950/95"
          >
            <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-3 dark:border-slate-700">
              <label className="relative block flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
                />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    loadDataset();
                  }}
                  onKeyDown={onInputKeyDown}
                  placeholder={t("globalSearch.placeholder")}
                  className="h-11 w-full rounded-2xl border border-slate-300/90 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  aria-label={t("globalSearch.aria.mobileInput")}
                />
              </label>
              <button
                type="button"
                onClick={closeAll}
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                aria-label={t("common.close")}
              >
                <ArrowLeft size={16} />
              </button>
            </header>

            <div className="flex-1 min-h-0">
              <SearchResultsList
                t={t}
                groupedResults={groupedResults}
                flatResults={flatResults}
                activeIndex={activeIndex}
                loading={loading}
                onSelect={executeAction}
                compact
                fullHeight
              />
            </div>
          </MotionSection>
        </MotionDiv>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      {showDesktopInput ? (
        <div ref={desktopContainerRef} className="relative hidden w-full max-w-[34rem] sm:block">
          <label className="relative block">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            />
            <input
              type="text"
              value={query}
              onFocus={openDesktopSearch}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsDesktopOpen(true);
                loadDataset();
              }}
              onKeyDown={onInputKeyDown}
              placeholder={t("globalSearch.placeholder")}
              className="h-10 w-full rounded-2xl border border-slate-300/90 bg-white/85 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100"
              aria-label={t("globalSearch.aria.desktopInput")}
            />
          </label>

          <AnimatePresence>
            {isDesktopOpen ? (
              <MotionDiv
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[85] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
              >
                <SearchResultsList
                  t={t}
                  groupedResults={groupedResults}
                  flatResults={flatResults}
                  activeIndex={activeIndex}
                  loading={loading}
                  onSelect={executeAction}
                />
              </MotionDiv>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}

      {showMobileTrigger ? (
        <button
          type="button"
          onClick={openMobileSearch}
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:hidden"
          aria-label={t("globalSearch.aria.openMobile")}
        >
          <Search size={16} />
        </button>
      ) : null}

      {showMobileTrigger && typeof document !== "undefined"
        ? createPortal(mobileSearchOverlay, document.body)
        : null}
    </>
  );
};

export default GlobalSearch;
