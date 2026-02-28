/**
 * VoucherHistoryPanel — List of user's vouchers as mini-ticket cards.
 *
 * Admin/root sees all vouchers; regular users see only their own.
 * Selecting a mini-ticket navigates to (or selects) the full voucher view.
 */
import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import { Ticket, RefreshCw, AlertTriangle } from "lucide-react";
import VoucherTicketMini from "./VoucherTicketMini";

const EMPTY_ARRAY = [];
const VoucherHistoryPanel = ({
  vouchers = EMPTY_ARRAY,
  loading = false,
  error = "",
  onSelect,
  onReload,
  selectedCode,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t("voucherPage.history.title", { defaultValue: "My Vouchers" })}
          </h3>
          {vouchers.length > 0 && (
            <span className="rounded-full bg-slate-200 dark:bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {vouchers.length}
            </span>
          )}
        </div>

        {onReload && (
          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 transition-colors
                       [@media(hover:hover)]:hover:bg-slate-200 dark:[@media(hover:hover)]:hover:bg-slate-700 [@media(hover:hover)]:hover:text-cyan-600 dark:[@media(hover:hover)]:hover:text-cyan-300
                       disabled:opacity-40"
            aria-label={t("voucherPage.history.reload", {
              defaultValue: "Refresh",
            })}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && vouchers.length === 0 && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-18 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/30"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
          <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && vouchers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/20 px-4 py-8 text-center">
          <Ticket className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600" />
          <p className="mt-2 text-xs text-slate-500">
            {t("voucherPage.history.empty", {
              defaultValue: "No vouchers yet",
            })}
          </p>
        </div>
      )}

      {/* List */}
      {vouchers.length > 0 && (
        <m.div
          className="flex flex-col gap-2"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {vouchers.map((v) => (
            <m.div
              key={v.$id || v.voucherCode}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <div
                className={`rounded-2xl transition-all ${
                  selectedCode === v.voucherCode
                    ? "ring-2 ring-cyan-500/60 ring-offset-1 ring-offset-white dark:ring-offset-slate-950"
                    : ""
                }`}
              >
                <VoucherTicketMini voucher={v} onClick={() => onSelect?.(v)} />
              </div>
            </m.div>
          ))}
        </m.div>
      )}
    </div>
  );
};

export default VoucherHistoryPanel;
