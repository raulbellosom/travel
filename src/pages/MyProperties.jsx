import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";

const MyProperties = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const locale = i18n.language === "es" ? "es-MX" : "en-US";

  const loadData = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");
    try {
      const response = await propertiesService.listMine(user.$id);
      setItems(response.documents || []);
    } catch (err) {
      setError(getErrorMessage(err, t("myPropertiesPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [t, user?.$id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusToggle = async (item) => {
    setBusyId(item.$id);
    try {
      await propertiesService.update(item.$id, user.$id, {
        ...item,
        status: item.status === "published" ? "draft" : "published",
      });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, t("myPropertiesPage.errors.toggleStatus")));
    } finally {
      setBusyId("");
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm(t("myPropertiesPage.confirmDeactivate"))) return;
    setBusyId(itemId);
    try {
      await propertiesService.softDelete(itemId);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, t("myPropertiesPage.errors.delete")));
    } finally {
      setBusyId("");
    }
  };

  const activeItems = useMemo(
    () => items.filter((item) => item.enabled !== false),
    [items]
  );

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {t("myPropertiesPage.title")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("myPropertiesPage.subtitle")}
          </p>
        </div>
        <Link
          to="/crear-propiedad"
          className="inline-flex min-h-11 items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          {t("myPropertiesPage.actions.create")}
        </Link>
      </header>

      {loading ? <p className="text-sm text-slate-600 dark:text-slate-300">{t("myPropertiesPage.loading")}</p> : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && activeItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("myPropertiesPage.empty")}
        </div>
      ) : null}

      {!loading && activeItems.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">{t("myPropertiesPage.table.title")}</th>
                <th className="px-4 py-3">{t("myPropertiesPage.table.location")}</th>
                <th className="px-4 py-3">{t("myPropertiesPage.table.status")}</th>
                <th className="px-4 py-3">{t("myPropertiesPage.table.price")}</th>
                <th className="px-4 py-3">{t("myPropertiesPage.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map((item) => (
                <tr key={item.$id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {item.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {item.city}, {item.state}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {t(`propertyStatus.${item.status}`, { defaultValue: item.status })}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: item.currency || "MXN",
                      maximumFractionDigits: 0,
                    }).format(item.price || 0)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/editar-propiedad/${item.$id}`}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium dark:border-slate-600"
                      >
                        {t("myPropertiesPage.actions.edit")}
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === item.$id}
                        onClick={() => handleStatusToggle(item)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium disabled:opacity-60 dark:border-slate-600"
                      >
                        {item.status === "published"
                          ? t("myPropertiesPage.actions.toDraft")
                          : t("myPropertiesPage.actions.publish")}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.$id}
                        onClick={() => handleDelete(item.$id)}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-60 dark:border-red-800 dark:text-red-300"
                      >
                        {t("myPropertiesPage.actions.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
};

export default MyProperties;

