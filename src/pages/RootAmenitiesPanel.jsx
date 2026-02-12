import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AMENITY_CATEGORY_VALUES,
  DEFAULT_AMENITIES_CATALOG,
  getAmenityIcon,
} from "../data/amenitiesCatalog";
import { Select, TablePagination } from "../components/common";
import { amenitiesService } from "../services/amenitiesService";
import { getErrorMessage } from "../utils/errors";
import { Sparkles } from "lucide-react";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";

const emptyForm = {
  slug: "",
  name_es: "",
  name_en: "",
  category: "general",
};

const RootAmenitiesPanel = () => {
  const { t, i18n } = useTranslation();
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [seedSummary, setSeedSummary] = useState(null);
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
  }, [i18n]);

  useEffect(() => {
    loadAmenities();
  }, [loadAmenities]);

  const filteredAmenities = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    return [...amenities]
      .sort((a, b) => {
        const catCompare = String(a.category || "").localeCompare(
          String(b.category || "")
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

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredAmenities.length / pageSize)),
    [filteredAmenities.length, pageSize]
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedAmenities = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAmenities.slice(start, start + pageSize);
  }, [filteredAmenities, page, pageSize]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await amenitiesService.create(form);
      setForm(emptyForm);
      await loadAmenities();
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
    } catch (err) {
      setError(getErrorMessage(err, t("rootAmenitiesPage.errors.toggle")));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditId(item.$id);
    setEditForm({
      slug: item.slug || "",
      name_es: item.name_es || "",
      name_en: item.name_en || "",
      category: item.category || "general",
    });
  };

  const cancelEdit = () => {
    setEditId("");
    setEditForm(emptyForm);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    setError("");
    try {
      await amenitiesService.update(editId, editForm);
      cancelEdit();
      await loadAmenities();
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
      const summary = await amenitiesService.seedDefaultCatalog();
      setSeedSummary(summary);
      await loadAmenities();
    } catch (err) {
      setError(getErrorMessage(err, t("rootAmenitiesPage.errors.seed")));
    } finally {
      setSeeding(false);
    }
  };

  const categoryOptions = useMemo(
    () =>
      AMENITY_CATEGORY_VALUES.map((category) => ({
        value: category,
        label: t(`rootAmenitiesPage.categories.${category}`),
      })),
    [t]
  );

  const categoryFilterOptions = useMemo(
    () => [
      { value: "all", label: t("rootAmenitiesPage.allCategories") },
      ...AMENITY_CATEGORY_VALUES.map((category) => ({
        value: category,
        label: t(`rootAmenitiesPage.categories.${category}`),
      })),
    ],
    [t]
  );

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("rootAmenitiesPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("rootAmenitiesPage.subtitle")}
        </p>
      </header>

      <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("rootAmenitiesPage.seedInfo", {
              count: DEFAULT_AMENITIES_CATALOG.length,
            })}
          </p>
          <button
            type="button"
            disabled={seeding || saving}
            onClick={handleSeedCatalog}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {seeding
              ? t("rootAmenitiesPage.actions.seeding")
              : t("rootAmenitiesPage.actions.seed")}
          </button>
        </div>

        {seedSummary ? (
          <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-200">
            {t("rootAmenitiesPage.seedResult", {
              created: seedSummary.created,
              skipped: seedSummary.skipped,
              errors: seedSummary.errors.length,
            })}
          </div>
        ) : null}
      </article>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("rootAmenitiesPage.createTitle")}
        </h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleCreate}>
          <label className="grid gap-1 text-sm">
            <span>{t("rootAmenitiesPage.fields.slug")}</span>
            <input
              required
              value={form.slug}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, slug: event.target.value }))
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("rootAmenitiesPage.fields.category")}</span>
            <Select
              value={form.category}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, category: value }))
              }
              options={categoryOptions}
              size="md"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("rootAmenitiesPage.fields.nameEs")}</span>
            <input
              required
              value={form.name_es}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name_es: event.target.value }))
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("rootAmenitiesPage.fields.nameEn")}</span>
            <input
              required
              value={form.name_en}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name_en: event.target.value }))
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving
                ? t("rootAmenitiesPage.actions.saving")
                : t("rootAmenitiesPage.actions.create")}
            </button>
          </div>
        </form>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
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

        {loading ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("rootAmenitiesPage.loading")}
          </p>
        ) : null}

        {!loading && filteredAmenities.length === 0 ? (
          <EmptyStatePanel
            icon={Sparkles}
            title={t("rootAmenitiesPage.empty")}
            description={t("rootAmenitiesPage.searchPlaceholder")}
            compact
          />
        ) : null}

        {!loading && filteredAmenities.length > 0 ? (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2">{t("rootAmenitiesPage.table.icon")}</th>
                    <th className="px-3 py-2">{t("rootAmenitiesPage.table.slug")}</th>
                    <th className="px-3 py-2">{t("rootAmenitiesPage.table.name")}</th>
                    <th className="px-3 py-2">{t("rootAmenitiesPage.table.category")}</th>
                    <th className="px-3 py-2">{t("rootAmenitiesPage.table.status")}</th>
                    <th className="px-3 py-2">{t("rootAmenitiesPage.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAmenities.map((item) => {
                    const isEditing = editId === item.$id;
                    const translatedName =
                      item[localeNameField] || item.name_es || item.name_en || item.slug;

                    return (
                      <tr
                        key={item.$id}
                        className="border-t border-slate-200 align-top dark:border-slate-700"
                      >
                        <td className="px-3 py-2 text-xl">{getAmenityIcon(item)}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-200">
                          {isEditing ? (
                            <input
                              value={editForm.slug}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  slug: event.target.value,
                                }))
                              }
                              className="w-44 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
                            />
                          ) : (
                            item.slug
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <div className="grid gap-2">
                              <input
                                value={editForm.name_es}
                                onChange={(event) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    name_es: event.target.value,
                                  }))
                                }
                                className="w-52 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
                              />
                              <input
                                value={editForm.name_en}
                                onChange={(event) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    name_en: event.target.value,
                                  }))
                                }
                                className="w-52 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {translatedName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-300">
                                {item.name_es} / {item.name_en}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Select
                              value={editForm.category}
                              onChange={(value) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  category: value,
                                }))
                              }
                              options={categoryOptions}
                              size="sm"
                              className="text-xs"
                            />
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {t(`rootAmenitiesPage.categories.${item.category}`)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
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
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={handleSaveEdit}
                                  className="rounded-md border border-sky-300 px-2 py-1 text-xs font-medium text-sky-700 dark:border-sky-700 dark:text-sky-300"
                                >
                                  {t("rootAmenitiesPage.actions.save")}
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={cancelEdit}
                                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium dark:border-slate-600"
                                >
                                  {t("rootAmenitiesPage.actions.cancel")}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => startEdit(item)}
                                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium dark:border-slate-600"
                                >
                                  {t("rootAmenitiesPage.actions.edit")}
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleToggleEnabled(item)}
                                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium dark:border-slate-600"
                                >
                                  {item.enabled
                                    ? t("rootAmenitiesPage.actions.disable")
                                    : t("rootAmenitiesPage.actions.enable")}
                                </button>
                              </>
                            )}
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
    </section>
  );
};

export default RootAmenitiesPanel;
