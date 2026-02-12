import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Inbox, Sparkles, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Select, TablePagination } from "../components/common";
import { leadsService } from "../services/leadsService";
import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import StatsCardsRow from "../components/common/molecules/StatsCardsRow";

const LEAD_STATUSES = [
  "new",
  "contacted",
  "closed_won",
  "closed_lost",
];

const Leads = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [propertyMap, setPropertyMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const focusId = searchParams.get("focus") || "";

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
      setError(getErrorMessage(err, i18n.t("leadsPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, i18n, user?.$id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / pageSize)),
    [items.length, pageSize]
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!focusId || items.length === 0) return;
    const targetIndex = items.findIndex((lead) => lead.$id === focusId);
    if (targetIndex < 0) return;
    setPage(Math.floor(targetIndex / pageSize) + 1);
  }, [focusId, items, pageSize]);

  const paginatedLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  useEffect(() => {
    if (loading || !focusId) return;
    const row = document.getElementById(`lead-${focusId}`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, loading, page, paginatedLeads.length]);

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

  const summaryCards = useMemo(
    () => [
      {
        id: "total",
        label: t("leadsPage.metrics.total"),
        value: counts.total,
        icon: Users,
        tone: "info",
      },
      {
        id: "new",
        label: t("leadsPage.metrics.new"),
        value: counts.new,
        icon: Sparkles,
        tone: "muted",
      },
      {
        id: "won",
        label: t("leadsPage.metrics.won"),
        value: counts.won,
        icon: CheckCircle2,
        tone: "success",
      },
    ],
    [counts.new, counts.total, counts.won, t]
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "", label: t("leadsPage.filters.all") },
      ...LEAD_STATUSES.map((status) => ({
        value: status,
        label: t(`leadStatus.${status}`),
      })),
    ],
    [t]
  );

  const rowStatusOptions = useMemo(
    () =>
      LEAD_STATUSES.map((status) => ({
        value: status,
        label: t(`leadStatus.${status}`),
      })),
    [t]
  );

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
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("leadsPage.subtitle")}</p>
      </header>

      <StatsCardsRow items={summaryCards} />

      <div className="max-w-xs">
        <label className="grid gap-1 text-sm">
          <span>{t("leadsPage.filters.status")}</span>
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={statusFilterOptions}
            size="md"
          />
        </label>
      </div>

      {loading ? <p className="text-sm text-slate-600 dark:text-slate-300">{t("leadsPage.loading")}</p> : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyStatePanel
          icon={Inbox}
          title={t("leadsPage.empty")}
          description={t("leadsPage.summary", { total: 0, new: 0, won: 0 })}
          compact
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
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
                {paginatedLeads.map((lead) => {
                  const isFocused = Boolean(focusId) && lead.$id === focusId;

                  return (
                    <tr
                      key={lead.$id}
                      id={`lead-${lead.$id}`}
                      className={`border-t border-slate-200 dark:border-slate-700 ${
                        isFocused ? "bg-cyan-50/70 dark:bg-cyan-900/20" : ""
                      }`}
                    >
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
                        <Select
                          value={lead.status}
                          onChange={(value) => onChangeStatus(lead.$id, value)}
                          disabled={busyId === lead.$id}
                          options={rowStatusOptions}
                          size="sm"
                          className="text-xs"
                        />
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
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={items.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        </div>
      ) : null}
    </section>
  );
};

export default Leads;
