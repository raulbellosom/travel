import LoadingState from "../components/common/molecules/LoadingState";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Inbox, Search, Sparkles, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Select, TablePagination } from "../components/common";
import { leadsService } from "../services/leadsService";
import { propertiesService } from "../services/propertiesService";
import { profileService } from "../services/profileService";
import { reservationsService } from "../services/reservationsService";
import { getErrorMessage } from "../utils/errors";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import StatsCardsRow from "../components/common/molecules/StatsCardsRow";
import { canViewGlobalLeads, canViewGlobalResources } from "../utils/roles";

const LEAD_STATUSES = ["new", "contacted", "closed_won", "closed_lost"];

const safeParseJson = (value) => {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

const getLeadResourceId = (lead) =>
  String(lead?.resourceId || lead?.propertyId || "").trim();

const getLeadSchedulePayload = (lead) => {
  const meta = safeParseJson(lead?.metaJson);
  const schedule =
    (meta.requestSchedule && typeof meta.requestSchedule === "object"
      ? meta.requestSchedule
      : null) ||
    (meta.schedule && typeof meta.schedule === "object" ? meta.schedule : null) ||
    {};

  const scheduleType = String(
    schedule.scheduleType || schedule.type || meta.scheduleType || "",
  )
    .trim()
    .toLowerCase();

  if (scheduleType === "date_range") {
    const checkInDate = String(
      schedule.checkInDate || meta.checkInDate || "",
    ).trim();
    const checkOutDate = String(
      schedule.checkOutDate || meta.checkOutDate || "",
    ).trim();
    if (!checkInDate || !checkOutDate) return null;
    return {
      scheduleType: "date_range",
      checkInDate,
      checkOutDate,
    };
  }

  if (scheduleType === "time_slot") {
    const startDateTime = String(
      schedule.startDateTime || meta.startDateTime || "",
    ).trim();
    const endDateTime = String(
      schedule.endDateTime || meta.endDateTime || "",
    ).trim();
    if (!startDateTime || !endDateTime) return null;
    return {
      scheduleType: "time_slot",
      startDateTime,
      endDateTime,
    };
  }

  return null;
};

const Leads = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [propertyMap, setPropertyMap] = useState({});
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [queryFilter, setQueryFilter] = useState(() =>
    String(searchParams.get("search") || "").trim(),
  );

  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const focusId = searchParams.get("focus") || "";

  useEffect(() => {
    const nextSearch = String(searchParams.get("search") || "").trim();
    setQueryFilter((prev) => (prev === nextSearch ? prev : nextSearch));
  }, [searchParams]);

  const loadData = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");
    try {
      const isGlobalLeads = canViewGlobalLeads(user);
      const isGlobalResources = canViewGlobalResources(user);

      const [leadsResponse, propertiesResponse] = await Promise.all([
        leadsService.listMine(user.$id, {
          status: statusFilter || undefined,
          ...(!isGlobalLeads && { propertyOwnerId: user.$id }),
        }),
        propertiesService.listMine(user.$id, {
          ...(!isGlobalResources && { ownerUserId: user.$id }),
        }),
      ]);
      const leadsExtracted = leadsResponse.documents || [];
      setItems(leadsExtracted);

      const map = {};
      for (const item of propertiesResponse.documents || []) {
        map[item.$id] = item;
      }
      setPropertyMap(map);

      // Fetch user details for each lead
      const uniqueUserIds = [
        ...new Set(leadsExtracted.map((l) => l.userId).filter(Boolean)),
      ];
      const usersData = await Promise.all(
        uniqueUserIds.map((id) =>
          profileService.getProfile(id).catch(() => null),
        ),
      );

      const uMap = {};
      usersData.forEach((u) => {
        if (u && u.$id) {
          uMap[u.$id] = u;
        }
      });
      setUserMap(uMap);
    } catch (err) {
      setError(getErrorMessage(err, i18n.t("leadsPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, user?.$id, i18n]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [queryFilter, statusFilter]);

  const normalizedFilter = String(queryFilter || "")
    .trim()
    .toLowerCase();

  const mappedLeads = useMemo(() => {
    return items.map((item) => {
      const u = userMap[item.userId] || {};
      const fullName =
        `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
        t("leadsPage.unknownUser", { defaultValue: "Usuario Desconocido" });
      const phoneNum = u.phone
        ? `${u.phoneCountryCode || ""} ${u.phone}`.trim()
        : "";
      const leadResourceId = getLeadResourceId(item);
      const hasReservableSchedule = Boolean(getLeadSchedulePayload(item));
      return {
        ...item,
        leadResourceId,
        hasReservableSchedule,
        mappedName: fullName,
        mappedEmail: u.email || "",
        mappedPhone: phoneNum,
      };
    });
  }, [items, userMap, t]);

  const filteredLeads = useMemo(() => {
    if (!normalizedFilter) return mappedLeads;

    return mappedLeads.filter((item) => {
      const text = [
        item.$id,
        item.mappedName,
        item.mappedEmail,
        item.mappedPhone,
        item.lastMessage,
        item.status,
        propertyMap[item.leadResourceId]?.title,
        item.leadResourceId,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return text.includes(normalizedFilter);
    });
  }, [mappedLeads, normalizedFilter, propertyMap]);

  const effectivePageSize = useMemo(() => {
    if (pageSize === "all") return Math.max(1, filteredLeads.length);
    return Math.max(1, Number(pageSize) || 5);
  }, [filteredLeads.length, pageSize]);

  const totalPages = useMemo(
    () =>
      pageSize === "all"
        ? 1
        : Math.max(1, Math.ceil(filteredLeads.length / effectivePageSize)),
    [effectivePageSize, filteredLeads.length, pageSize],
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!focusId || filteredLeads.length === 0) return;
    const targetIndex = filteredLeads.findIndex((lead) => lead.$id === focusId);
    if (targetIndex < 0) return;
    setPage(Math.floor(targetIndex / effectivePageSize) + 1);
  }, [effectivePageSize, filteredLeads, focusId]);

  const paginatedLeads = useMemo(() => {
    if (pageSize === "all") return filteredLeads;
    const start = (page - 1) * effectivePageSize;
    return filteredLeads.slice(start, start + effectivePageSize);
  }, [effectivePageSize, filteredLeads, page, pageSize]);

  useEffect(() => {
    if (loading || !focusId) return;
    const row = document.getElementById(`lead-${focusId}`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, loading, page, paginatedLeads.length]);

  const counts = useMemo(() => {
    return filteredLeads.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === "new") acc.new += 1;
        if (item.status === "closed_won") acc.won += 1;
        return acc;
      },
      { total: 0, new: 0, won: 0 },
    );
  }, [filteredLeads]);

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
    [counts.new, counts.total, counts.won, t],
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "", label: t("leadsPage.filters.all") },
      ...LEAD_STATUSES.map((status) => ({
        value: status,
        label: t(`leadStatus.${status}`),
      })),
    ],
    [t],
  );

  const rowStatusOptions = useMemo(
    () =>
      LEAD_STATUSES.map((status) => ({
        value: status,
        label: t(`leadStatus.${status}`),
      })),
    [t],
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

  const onConvertToReservation = async (lead) => {
    const schedulePayload = getLeadSchedulePayload(lead);
    if (!schedulePayload) {
      setError(
        t("leadsPage.errors.convertMissingSchedule", {
          defaultValue:
            "Este lead no tiene fecha/horario seleccionado. Primero solicita una agenda desde la vista del recurso.",
        }),
      );
      return;
    }

    const guestName = String(lead.mappedName || "").trim();
    const guestEmail = String(lead.mappedEmail || "").trim().toLowerCase();
    const normalizedPhone = String(lead.mappedPhone || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20);

    setBusyId(lead.$id);
    try {
      await reservationsService.convertLeadToManualReservation(lead.$id, {
        ...schedulePayload,
        closeLead: true,
        guestName: guestName || undefined,
        guestEmail: guestEmail || undefined,
        guestPhone: normalizedPhone || undefined,
        specialRequests: String(lead.lastMessage || "").trim() || undefined,
      });
      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          t("leadsPage.errors.convert", {
            defaultValue: "No se pudo convertir el lead en reserva manual.",
          }),
        ),
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("leadsPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("leadsPage.subtitle")}
        </p>
      </header>

      <StatsCardsRow items={summaryCards} />

      <div className="grid gap-3 sm:max-w-3xl sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Search size={14} />
            {t("leadsPage.filters.search", { defaultValue: "Buscar" })}
          </span>
          <input
            value={queryFilter}
            onChange={(event) => setQueryFilter(event.target.value)}
            placeholder={t("leadsPage.filters.searchPlaceholder", {
              defaultValue: "Nombre, email, propiedad o mensaje",
            })}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>

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

      {loading ? <LoadingState text={t("leadsPage.loading")} /> : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && filteredLeads.length === 0 ? (
        <EmptyStatePanel
          icon={Inbox}
          title={t("leadsPage.empty")}
          description={t("leadsPage.summary", { total: 0, new: 0, won: 0 })}
          compact
        />
      ) : null}

      {!loading && filteredLeads.length > 0 ? (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 overflow-hidden">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="min-w-[160px] px-5 py-4">
                    {t("leadsPage.table.date")}
                  </th>
                  <th className="min-w-[200px] px-5 py-4">
                    {t("leadsPage.table.contact")}
                  </th>
                  <th className="min-w-[200px] px-5 py-4">
                    {t("leadsPage.table.property")}
                  </th>
                  <th className="min-w-[160px] px-5 py-4">
                    {t("leadsPage.table.status")}
                  </th>
                  <th className="min-w-[120px] px-5 py-4 font-semibold text-right">
                    {t("leadsPage.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedLeads.map((lead) => {
                  const isFocused = Boolean(focusId) && lead.$id === focusId;

                  return (
                    <tr
                      key={lead.$id}
                      id={`lead-${lead.$id}`}
                      className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                        isFocused ? "bg-cyan-50/70 dark:bg-cyan-900/20" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">
                        {new Date(lead.$createdAt).toLocaleString(locale)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                          {lead.mappedName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {lead.mappedEmail}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {lead.mappedPhone || t("leadsPage.noPhone")}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          {propertyMap[lead.leadResourceId]?.title ||
                            lead.leadResourceId}
                        </p>
                        {lead.lastMessage && (
                          <p
                            className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] mt-1"
                            title={lead.lastMessage}
                          >
                            &quot;{lead.lastMessage}&quot;
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Select
                          value={lead.status}
                          onChange={(value) => onChangeStatus(lead.$id, value)}
                          disabled={busyId === lead.$id}
                          options={rowStatusOptions}
                          size="sm"
                          className="text-xs max-w-[140px]"
                        />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <a
                            href={`mailto:${lead.mappedEmail}`}
                            className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
                          >
                            {t("leadsPage.actions.sendEmail")}
                          </a>
                          <button
                            type="button"
                            disabled={busyId === lead.$id || !lead.hasReservableSchedule}
                            onClick={() => onConvertToReservation(lead)}
                            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t("leadsPage.actions.convertToReservation", {
                              defaultValue: "Crear reserva",
                            })}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50/50 dark:bg-slate-800/30 px-2 py-1">
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={filteredLeads.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(value) => {
                setPageSize(value);
                setPage(1);
              }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Leads;
