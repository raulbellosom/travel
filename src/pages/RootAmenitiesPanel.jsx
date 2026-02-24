import LoadingState from "../components/common/molecules/LoadingState";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AMENITY_CATEGORY_VALUES,
  DEFAULT_AMENITIES_CATALOG,
  getAmenityIcon,
} from "../data/amenitiesCatalog";
import { Select, TablePagination } from "../components/common";
import Modal, { ModalFooter } from "../components/common/organisms/Modal";
import { amenitiesService } from "../services/amenitiesService";
import { getErrorMessage } from "../utils/errors";
import { Sparkles, Plus, X } from "lucide-react";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import { useToast } from "../hooks/useToast";

const emptyForm = {
  slug: "",
  name_es: "",
  name_en: "",
  category: "general",
};

const SEED_PREVIEW_TABS = {
  create: "create",
  update: "update",
};

const RootAmenitiesPanel = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [seedSummary, setSeedSummary] = useState(null);
  const [seedPlan, setSeedPlan] = useState(null);
  const [seedPreviewOpen, setSeedPreviewOpen] = useState(false);
  const [seedPreviewLoading, setSeedPreviewLoading] = useState(false);
  const [seedPreviewTab, setSeedPreviewTab] = useState(
    SEED_PREVIEW_TABS.create,
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ search: "", category: "all" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const localeNameField = i18n.language === "es" ? "name_es" : "name_en";

  const loadAmenities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const docs = await amenitiesService.listAll();
      setAmenities(docs || []);
    } catch (err) {
      setError(getErrorMessage(err, i18n.t("rootAmenitiesPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAmenities();
  }, [loadAmenities]);

  useEffect(() => {
    if (!error) return;
    showToast({
      type: "error",
      title: t("rootAmenitiesPage.title"),
      message: error,
      durationMs: 7000,
    });
  }, [error, showToast, t]);

  const filteredAmenities = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    return [...amenities]
      .sort((a, b) => {
        const catCompare = String(a.category || "").localeCompare(
          String(b.category || ""),
        );
        if (catCompare !== 0) return catCompare;
        return String(a.name_es || "").localeCompare(String(b.name_es || ""));
      })
      .filter((item) => {
        if (filters.category !== "all" && item.category !== filters.category) {
          return false;
        }

        if (!normalizedSearch) return true;
        const haystack = [
          item.slug,
          item.name_es,
          item.name_en,
          item.category,
          item.$id,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
  }, [amenities, filters.category, filters.search]);

  useEffect(() => {
    setPage(1);
  }, [filters.category, filters.search]);

  const effectivePageSize = useMemo(() => {
    if (pageSize === "all") return Math.max(1, filteredAmenities.length);
    return Math.max(1, Number(pageSize) || 5);
  }, [filteredAmenities.length, pageSize]);

  const totalPages = useMemo(
    () =>
      pageSize === "all"
        ? 1
        : Math.max(1, Math.ceil(filteredAmenities.length / effectivePageSize)),
    [effectivePageSize, filteredAmenities.length, pageSize],
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedAmenities = useMemo(() => {
    if (pageSize === "all") return filteredAmenities;
    const start = (page - 1) * effectivePageSize;
    return filteredAmenities.slice(start, start + effectivePageSize);
  }, [effectivePageSize, filteredAmenities, page, pageSize]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await amenitiesService.create(form);
      setForm(emptyForm);
      setCreateModalOpen(false);
      await loadAmenities();
      showToast({
        type: "success",
        title: t("rootAmenitiesPage.title"),
        message: t("rootAmenitiesPage.messages.created", {
          defaultValue: "Amenidad creada correctamente.",
        }),
      });
    } catch (err) {
      setError(getErrorMessage(err, t("rootAmenitiesPage.errors.create")));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (item) => {
    setSaving(true);
    setError("");
    try {
      await amenitiesService.toggleEnabled(item.$id, !item.enabled);
      await loadAmenities();
      showToast({
        type: "success",
        title: t("rootAmenitiesPage.title"),
        message:
          item.enabled
            ? t("rootAmenitiesPage.messages.disabled", {
                defaultValue: "Amenidad desactivada correctamente.",
              })
            : t("rootAmenitiesPage.messages.enabled", {
                defaultValue: "Amenidad activada correctamente.",
              }),
      });
    } catch (err) {
      setError(getErrorMessage(err, t("rootAmenitiesPage.errors.toggle")));
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setError("");
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (saving) return;
    setCreateModalOpen(false);
    setForm(emptyForm);
    setError("");
  };

  const openEditModal = (item) => {
    setEditId(item.$id);
    setEditForm({
      slug: item.slug || "",
      name_es: item.name_es || "",
      name_en: item.name_en || "",
      category: item.category || "general",
    });
    setError("");
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditModalOpen(false);
    setEditId("");
    setEditForm(emptyForm);
    setError("");
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!editId) return;
    setSaving(true);
    setError("");
    try {
      await amenitiesService.update(editId, editForm);
      setEditModalOpen(false);
      setEditId("");
      setEditForm(emptyForm);
      await loadAmenities();
      showToast({
        type: "success",
        title: t("rootAmenitiesPage.title"),
        message: t("rootAmenitiesPage.messages.updated", {
          defaultValue: "Amenidad actualizada correctamente.",
        }),
      });
    } catch (err) {
      setError(getErrorMessage(err, t("rootAmenitiesPage.errors.update")));
    } finally {
      setSaving(false);
    }
  };

  const handleSeedCatalog = async () => {
    setSeeding(true);
    setError("");
    setSeedSummary(null);

    try {
      const nextPlan =
        seedPlan &&
        Array.isArray(seedPlan.toCreate) &&
        Array.isArray(seedPlan.toUpdate)
          ? seedPlan
          : await amenitiesService.previewDefaultCatalogSeed();
      const summary = await amenitiesService.seedDefaultCatalog(nextPlan);
      setSeedSummary(summary);
      setSeedPlan(null);
      setSeedPreviewOpen(false);
      await loadAmenities();
      showToast({
        type: "success",
        title: t("rootAmenitiesPage.title"),
        message: t("rootAmenitiesPage.seedResult", {
          created: summary.created,
          updated: summary.updated,
          unchanged: summary.unchanged ?? summary.skipped ?? 0,
          errors: summary.errors.length,
        }),
        durationMs: 6500,
      });
    } catch (err) {
      setError(getErrorMessage(err, t("rootAmenitiesPage.errors.seed")));
    } finally {
      setSeeding(false);
    }
  };

  const handleOpenSeedPreview = async () => {
    setSeedPreviewOpen(true);
    setSeedPreviewLoading(true);
    setSeedPreviewTab(SEED_PREVIEW_TABS.create);
    setSeedPlan(null);
    setError("");

    try {
      const plan = await amenitiesService.previewDefaultCatalogSeed();
      setSeedPlan(plan);
      if (plan.toCreate.length === 0 && plan.toUpdate.length > 0) {
        setSeedPreviewTab(SEED_PREVIEW_TABS.update);
      }
    } catch (err) {
      setSeedPreviewOpen(false);
      setError(getErrorMessage(err, t("rootAmenitiesPage.errors.seed")));
    } finally {
      setSeedPreviewLoading(false);
    }
  };

  const closeSeedPreview = () => {
    if (seeding || seedPreviewLoading) return;
    setSeedPreviewOpen(false);
  };

  const categoryOptions = useMemo(
    () =>
      AMENITY_CATEGORY_VALUES.map((category) => ({
        value: category,
        label: t(`rootAmenitiesPage.categories.${category}`),
      })),
    [t],
  );

  const categoryFilterOptions = useMemo(
    () => [
      { value: "all", label: t("rootAmenitiesPage.allCategories") },
      ...AMENITY_CATEGORY_VALUES.map((category) => ({
        value: category,
        label: t(`rootAmenitiesPage.categories.${category}`),
      })),
    ],
    [t],
  );

  const seedCreateItems = seedPlan?.toCreate || [];
  const seedUpdateItems = seedPlan?.toUpdate || [];
  const hasSeedChanges =
    seedCreateItems.length > 0 || seedUpdateItems.length > 0;

  return (
    <section className="min-w-0 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("rootAmenitiesPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("rootAmenitiesPage.subtitle")}
        </p>
      </header>

      <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("rootAmenitiesPage.seedInfo", {
              count: DEFAULT_AMENITIES_CATALOG.length,
            })}
          </p>
          <button
            type="button"
            disabled={seeding || saving}
            onClick={handleOpenSeedPreview}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {t("rootAmenitiesPage.actions.seed")}
          </button>
        </div>

        {seedSummary ? (
          <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-200">
            <div className="flex items-start justify-between gap-3">
              <p className="break-words">
                {t("rootAmenitiesPage.seedResult", {
                  created: seedSummary.created,
                  updated: seedSummary.updated,
                  unchanged: seedSummary.unchanged ?? seedSummary.skipped ?? 0,
                  errors: seedSummary.errors.length,
                })}
              </p>
              <button
                type="button"
                onClick={() => setSeedSummary(null)}
                className="rounded-md p-1 opacity-80 transition hover:bg-cyan-100 hover:opacity-100 dark:hover:bg-cyan-900/40"
                aria-label={t("common.close", { defaultValue: "Cerrar" })}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </article>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <div className="flex items-start justify-between gap-3">
            <p className="break-words">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-md p-1 opacity-80 transition hover:bg-red-100 hover:opacity-100 dark:hover:bg-red-900/40"
              aria-label={t("common.close", { defaultValue: "Cerrar" })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t("rootAmenitiesPage.listTitle", { defaultValue: "Amenidades" })}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t("rootAmenitiesPage.listSubtitle", {
                defaultValue: "Gestiona el catálogo de amenidades disponibles",
                count: filteredAmenities.length,
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Plus size={18} />
            {t("rootAmenitiesPage.actions.create")}
          </button>
        </div>

        <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_220px]">
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, search: event.target.value }))
            }
            placeholder={t("rootAmenitiesPage.searchPlaceholder")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
          />
          <Select
            value={filters.category}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, category: value }))
            }
            options={categoryFilterOptions}
            size="md"
          />
        </div>

        {loading ? <LoadingState text={t("rootAmenitiesPage.loading")} /> : null}

        {!loading && filteredAmenities.length === 0 ? (
          <EmptyStatePanel
            icon={Sparkles}
            title={t("rootAmenitiesPage.empty")}
            description={t("rootAmenitiesPage.searchPlaceholder")}
            compact
          />
        ) : null}

        {!loading && filteredAmenities.length > 0 ? (
          <div className="min-w-0 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[760px] text-left text-sm md:min-w-[900px]">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="w-14 px-3 py-2">
                      {t("rootAmenitiesPage.table.icon")}
                    </th>
                    <th className="min-w-[140px] px-3 py-2">
                      {t("rootAmenitiesPage.table.slug")}
                    </th>
                    <th className="min-w-[200px] px-3 py-2">
                      {t("rootAmenitiesPage.table.name")}
                    </th>
                    <th className="min-w-[120px] px-3 py-2">
                      {t("rootAmenitiesPage.table.category")}
                    </th>
                    <th className="min-w-[100px] px-3 py-2">
                      {t("rootAmenitiesPage.table.status")}
                    </th>
                    <th className="min-w-[160px] px-3 py-2">
                      {t("rootAmenitiesPage.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAmenities.map((item) => {
                    const translatedName =
                      item[localeNameField] ||
                      item.name_es ||
                      item.name_en ||
                      item.slug;

                    return (
                      <tr
                        key={item.$id}
                        className="border-t border-slate-200 dark:border-slate-700"
                      >
                        <td className="px-3 py-2 text-xl">
                          {(() => {
                            const IconComponent = getAmenityIcon(item);
                            return <IconComponent size={20} />;
                          })()}
                        </td>
                        <td className="break-all px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-200">
                          {item.slug}
                        </td>
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {translatedName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-300">
                              {item.name_es} / {item.name_en}
                            </p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {t(`rootAmenitiesPage.categories.${item.category}`)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              item.enabled
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {item.enabled
                              ? t("rootAmenitiesPage.status.enabled")
                              : t("rootAmenitiesPage.status.disabled")}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => openEditModal(item)}
                              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium transition hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                            >
                              {t("rootAmenitiesPage.actions.edit")}
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => handleToggleEnabled(item)}
                              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium transition hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                            >
                              {item.enabled
                                ? t("rootAmenitiesPage.actions.disable")
                                : t("rootAmenitiesPage.actions.enable")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={filteredAmenities.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(value) => {
                setPageSize(value);
                setPage(1);
              }}
            />
          </div>
        ) : null}
      </article>

      <Modal
        isOpen={seedPreviewOpen}
        onClose={closeSeedPreview}
        title={t("rootAmenitiesPage.seedModal.title")}
        description={t("rootAmenitiesPage.seedModal.subtitle")}
        size="lg"
        footer={
          <ModalFooter>
            <button
              type="button"
              onClick={closeSeedPreview}
              disabled={seeding || seedPreviewLoading}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("rootAmenitiesPage.actions.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSeedCatalog}
              disabled={seeding || seedPreviewLoading || !hasSeedChanges}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {seeding
                ? t("rootAmenitiesPage.actions.seeding")
                : hasSeedChanges
                  ? t("rootAmenitiesPage.actions.confirmSeed")
                  : t("rootAmenitiesPage.actions.noSeedChanges")}
            </button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          {seedPreviewLoading ? <LoadingState text={t("rootAmenitiesPage.seedModal.loading")} /> : null}

          {!seedPreviewLoading && seedPlan ? (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
                  {t("rootAmenitiesPage.seedModal.summary.create", {
                    count: seedCreateItems.length,
                  })}
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                  {t("rootAmenitiesPage.seedModal.summary.update", {
                    count: seedUpdateItems.length,
                  })}
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {t("rootAmenitiesPage.seedModal.summary.unchanged", {
                    count: seedPlan.unchanged,
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeedPreviewTab(SEED_PREVIEW_TABS.create)}
                    className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      seedPreviewTab === SEED_PREVIEW_TABS.create
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {t("rootAmenitiesPage.seedModal.tabs.create", {
                      count: seedCreateItems.length,
                    })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeedPreviewTab(SEED_PREVIEW_TABS.update)}
                    className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      seedPreviewTab === SEED_PREVIEW_TABS.update
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {t("rootAmenitiesPage.seedModal.tabs.update", {
                      count: seedUpdateItems.length,
                    })}
                  </button>
                </div>
              </div>

              {seedPreviewTab === SEED_PREVIEW_TABS.create ? (
                seedCreateItems.length > 0 ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {seedCreateItems.map((item) => (
                      <li
                        key={`seed-create-${item.slug}`}
                        className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg" aria-hidden="true">
                            {(() => {
                              const IconComponent = getAmenityIcon(item);
                              return <IconComponent size={20} />;
                            })()}
                          </span>
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {item[localeNameField] ||
                                item.name_es ||
                                item.name_en ||
                                item.slug}
                            </p>
                            <p className="break-all font-mono text-xs text-slate-500 dark:text-slate-300">
                              {item.slug}
                            </p>
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {t(
                                `rootAmenitiesPage.categories.${item.category}`,
                              )}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    {t("rootAmenitiesPage.seedModal.emptyCreate")}
                  </p>
                )
              ) : null}

              {seedPreviewTab === SEED_PREVIEW_TABS.update ? (
                seedUpdateItems.length > 0 ? (
                  <ul className="space-y-2">
                    {seedUpdateItems.map((item) => (
                      <li
                        key={`seed-update-${item.amenityId}`}
                        className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item[localeNameField] ||
                              item.name_es ||
                              item.name_en ||
                              item.nextSlug}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-300">
                                {t("rootAmenitiesPage.seedModal.currentSlug")}
                              </p>
                              <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-100">
                                {item.currentSlug ||
                                  t("rootAmenitiesPage.seedModal.noSlug")}
                              </p>
                            </div>
                            <div className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1.5 dark:border-cyan-900/50 dark:bg-cyan-950/30">
                              <p className="text-[11px] font-medium text-cyan-700 dark:text-cyan-200">
                                {t("rootAmenitiesPage.seedModal.nextSlug")}
                              </p>
                              <p className="break-all font-mono text-xs text-cyan-800 dark:text-cyan-100">
                                {item.nextSlug}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    {t("rootAmenitiesPage.seedModal.emptyUpdate")}
                  </p>
                )
              ) : null}
            </>
          ) : null}
        </div>
      </Modal>

      {/* Create Amenity Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={closeCreateModal}
        title={t("rootAmenitiesPage.createModal.title", {
          defaultValue: "Crear amenidad",
        })}
        description={t("rootAmenitiesPage.createModal.subtitle", {
          defaultValue: "Agrega una nueva amenidad al catálogo",
        })}
        size="md"
        footer={
          <ModalFooter>
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("rootAmenitiesPage.actions.cancel")}
            </button>
            <button
              type="submit"
              form="create-amenity-form"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? t("rootAmenitiesPage.actions.saving")
                : t("rootAmenitiesPage.actions.create")}
            </button>
          </ModalFooter>
        }
      >
        <form
          id="create-amenity-form"
          onSubmit={handleCreate}
          className="space-y-4"
        >
          {error && createModalOpen ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {t("rootAmenitiesPage.fields.slug")}
              </span>
              <input
                required
                type="text"
                value={form.slug}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, slug: event.target.value }))
                }
                placeholder="my-amenity-slug"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {t("rootAmenitiesPage.fields.category")}
              </span>
              <Select
                value={form.category}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, category: value }))
                }
                options={categoryOptions}
                size="md"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {t("rootAmenitiesPage.fields.nameEs")}
              </span>
              <input
                required
                type="text"
                value={form.name_es}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name_es: event.target.value }))
                }
                placeholder="Nombre en español"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {t("rootAmenitiesPage.fields.nameEn")}
              </span>
              <input
                required
                type="text"
                value={form.name_en}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name_en: event.target.value }))
                }
                placeholder="Name in English"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
              />
            </label>
          </div>
        </form>
      </Modal>

      {/* Edit Amenity Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        title={t("rootAmenitiesPage.editModal.title", {
          defaultValue: "Editar amenidad",
        })}
        description={t("rootAmenitiesPage.editModal.subtitle", {
          defaultValue: "Modifica los datos de la amenidad",
        })}
        size="md"
        footer={
          <ModalFooter>
            <button
              type="button"
              onClick={closeEditModal}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("rootAmenitiesPage.actions.cancel")}
            </button>
            <button
              type="submit"
              form="edit-amenity-form"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? t("rootAmenitiesPage.actions.saving")
                : t("rootAmenitiesPage.actions.save")}
            </button>
          </ModalFooter>
        }
      >
        <form
          id="edit-amenity-form"
          onSubmit={handleSaveEdit}
          className="space-y-4"
        >
          {error && editModalOpen ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {t("rootAmenitiesPage.fields.slug")}
              </span>
              <input
                required
                type="text"
                value={editForm.slug}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, slug: event.target.value }))
                }
                placeholder="my-amenity-slug"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {t("rootAmenitiesPage.fields.category")}
              </span>
              <Select
                value={editForm.category}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, category: value }))
                }
                options={categoryOptions}
                size="md"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {t("rootAmenitiesPage.fields.nameEs")}
              </span>
              <input
                required
                type="text"
                value={editForm.name_es}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    name_es: event.target.value,
                  }))
                }
                placeholder="Nombre en español"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {t("rootAmenitiesPage.fields.nameEn")}
              </span>
              <input
                required
                type="text"
                value={editForm.name_en}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    name_en: event.target.value,
                  }))
                }
                placeholder="Name in English"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
              />
            </label>
          </div>
        </form>
      </Modal>
    </section>
  );
};

export default RootAmenitiesPanel;
