import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { leadsService } from "../services/leadsService";
import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";

const LEAD_STATUSES = [
  "new",
  "contacted",
  "closed_won",
  "closed_lost",
];

const Leads = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [propertyMap, setPropertyMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState("");

  const locale = i18n.language === "es" ? "es-MX" : "en-US";

  const loadData = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");
    try {
      const [leadsResponse, propertiesResponse] = await Promise.all([
        leadsService.listMine(user.$id, { status: statusFilter || undefined }),
        propertiesService.listMine(user.$id),
      ]);
      setItems(leadsResponse.documents || []);
      const map = {};
      for (const item of propertiesResponse.documents || []) {
        map[item.$id] = item;
      }
      setPropertyMap(map);
    } catch (err) {
      setError(getErrorMessage(err, t("leadsPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t, user?.$id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === "new") acc.new += 1;
        if (item.status === "closed_won") acc.won += 1;
        return acc;
      },
      { total: 0, new: 0, won: 0 }
    );
  }, [items]);

  const onChangeStatus = async (leadId, status) => {
    setBusyId(leadId);
    try {
      await leadsService.updateLead(leadId, { status });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, t("leadsPage.errors.update")));
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t("leadsPage.title")}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("leadsPage.summary", { total: counts.total, new: counts.new, won: counts.won })}
        </p>
      </header>

      <div className="max-w-xs">
        <label className="grid gap-1 text-sm">
          <span>{t("leadsPage.filters.status")}</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
          >
            <option value="">{t("leadsPage.filters.all")}</option>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`leadStatus.${status}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? <p className="text-sm text-slate-600 dark:text-slate-300">{t("leadsPage.loading")}</p> : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("leadsPage.empty")}
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">{t("leadsPage.table.date")}</th>
                <th className="px-4 py-3">{t("leadsPage.table.contact")}</th>
                <th className="px-4 py-3">{t("leadsPage.table.property")}</th>
                <th className="px-4 py-3">{t("leadsPage.table.status")}</th>
                <th className="px-4 py-3">{t("leadsPage.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((lead) => (
                <tr key={lead.$id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(lead.$createdAt).toLocaleString(locale)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{lead.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{lead.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{lead.phone || t("leadsPage.noPhone")}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {propertyMap[lead.propertyId]?.title || lead.propertyId}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(event) => onChangeStatus(lead.$id, event.target.value)}
                      disabled={busyId === lead.$id}
                      className="min-h-9 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
                    >
                      {LEAD_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {t(`leadStatus.${status}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
                    >
                      {t("leadsPage.actions.sendEmail")}
                    </a>
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

export default Leads;

