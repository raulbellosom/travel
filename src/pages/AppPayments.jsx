import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Filter, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Select, TablePagination } from "../components/common";
import { paymentsService } from "../services/paymentsService";
import { getErrorMessage } from "../utils/errors";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";

const PROVIDERS = ["stripe", "mercadopago"];
const STATUSES = ["pending", "approved", "rejected", "refunded"];

const AppPayments = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [filters, setFilters] = useState({
    provider: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [queryFilter, setQueryFilter] = useState(() =>
    String(searchParams.get("search") || "").trim(),
  );

  const locale = i18n.language === "en" ? "en-US" : "es-MX";
  const focusId = searchParams.get("focus") || "";

  useEffect(() => {
    const nextSearch = String(searchParams.get("search") || "").trim();
    setQueryFilter((prev) => (prev === nextSearch ? prev : nextSearch));
  }, [searchParams]);

  const load = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");
    try {
      const response = await paymentsService.listForOwner(user.$id, filters);
      setPayments(response.documents || []);
    } catch (err) {
      setError(getErrorMessage(err, i18n.t("appPaymentsPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [filters, user?.$id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filters.provider, filters.status, queryFilter]);

  const normalizedFilter = String(queryFilter || "")
    .trim()
    .toLowerCase();
  const filteredPayments = useMemo(() => {
    if (!normalizedFilter) return payments;

    return payments.filter((payment) => {
      const text = [
        payment.$id,
        payment.provider,
        payment.status,
        payment.reservationId,
        payment.providerPaymentId,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return text.includes(normalizedFilter);
    });
  }, [normalizedFilter, payments]);

  const effectivePageSize = useMemo(() => {
    if (pageSize === "all") return Math.max(1, filteredPayments.length);
    return Math.max(1, Number(pageSize) || 5);
  }, [filteredPayments.length, pageSize]);

  const totalPages = useMemo(
    () =>
      pageSize === "all"
        ? 1
        : Math.max(1, Math.ceil(filteredPayments.length / effectivePageSize)),
    [effectivePageSize, filteredPayments.length, pageSize],
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!focusId || filteredPayments.length === 0) return;
    const targetIndex = filteredPayments.findIndex(
      (payment) => payment.$id === focusId,
    );
    if (targetIndex < 0) return;
    setPage(Math.floor(targetIndex / effectivePageSize) + 1);
  }, [effectivePageSize, filteredPayments, focusId]);

  const paginatedPayments = useMemo(() => {
    if (pageSize === "all") return filteredPayments;
    const start = (page - 1) * effectivePageSize;
    return filteredPayments.slice(start, start + effectivePageSize);
  }, [effectivePageSize, filteredPayments, page, pageSize]);

  useEffect(() => {
    if (loading || !focusId) return;
    const row = document.getElementById(`payment-${focusId}`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, loading, page, paginatedPayments.length]);

  const providerOptions = useMemo(
    () => [
      { value: "", label: t("appPaymentsPage.filters.all") },
      ...PROVIDERS.map((provider) => ({ value: provider, label: provider })),
    ],
    [t],
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("appPaymentsPage.filters.all") },
      ...STATUSES.map((status) => ({ value: status, label: status })),
    ],
    [t],
  );

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("appPaymentsPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("appPaymentsPage.subtitle")}
        </p>
      </header>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3 dark:border-slate-700 dark:bg-slate-900">
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Search size={14} />
            {t("appPaymentsPage.filters.search", { defaultValue: "Buscar" })}
          </span>
          <input
            value={queryFilter}
            onChange={(event) => setQueryFilter(event.target.value)}
            placeholder={t("appPaymentsPage.filters.searchPlaceholder", {
              defaultValue: "Proveedor, estado, referencia o ID",
            })}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Filter size={14} />
            {t("appPaymentsPage.filters.provider")}
          </span>
          <Select
            value={filters.provider}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, provider: value }))
            }
            options={providerOptions}
            size="md"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <CreditCard size={14} />
            {t("appPaymentsPage.filters.status")}
          </span>
          <Select
            value={filters.status}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
            options={statusOptions}
            size="md"
          />
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("appPaymentsPage.loading")}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!loading && !error && filteredPayments.length === 0 ? (
        <EmptyStatePanel
          icon={CreditCard}
          title={t("appPaymentsPage.empty")}
          description={t("appPaymentsPage.subtitle")}
          compact
        />
      ) : null}

      {!loading && filteredPayments.length > 0 ? (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">
                    {t("appPaymentsPage.table.date")}
                  </th>
                  <th className="px-4 py-3">
                    {t("appPaymentsPage.table.provider")}
                  </th>
                  <th className="px-4 py-3">
                    {t("appPaymentsPage.table.reservationId")}
                  </th>
                  <th className="px-4 py-3">
                    {t("appPaymentsPage.table.status")}
                  </th>
                  <th className="px-4 py-3">
                    {t("appPaymentsPage.table.amount")}
                  </th>
                  <th className="px-4 py-3">
                    {t("appPaymentsPage.table.reference")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((payment) => {
                  const isFocused = Boolean(focusId) && payment.$id === focusId;

                  return (
                    <tr
                      key={payment.$id}
                      id={`payment-${payment.$id}`}
                      className={`border-t border-slate-200 dark:border-slate-700 ${
                        isFocused ? "bg-cyan-50/70 dark:bg-cyan-900/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {new Date(payment.$createdAt).toLocaleString(locale)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {payment.provider}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {payment.reservationId}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: payment.currency || "MXN",
                        }).format(Number(payment.amount || 0))}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-300">
                        {payment.providerPaymentId || "-"}
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
            totalItems={filteredPayments.length}
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

export default AppPayments;
