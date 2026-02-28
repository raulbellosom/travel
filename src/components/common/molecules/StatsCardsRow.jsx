import { m } from "framer-motion";

const CARD_TONE_CLASS = {
  neutral:
    "border-slate-200 bg-white/50 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/50",
  info: "border-cyan-200/50 bg-cyan-50/50 backdrop-blur-xl dark:border-cyan-900/30 dark:bg-cyan-950/20",
  success:
    "border-emerald-200/50 bg-emerald-50/50 backdrop-blur-xl dark:border-emerald-900/30 dark:bg-emerald-950/20",
  muted:
    "border-slate-200/50 bg-slate-50/50 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/40",
};

const ICON_TONE_CLASS = {
  neutral:
    "bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-100 dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-700",
  info: "bg-white text-cyan-700 shadow-sm dark:bg-cyan-900/50 dark:text-cyan-200 dark:shadow-none ring-1 ring-cyan-200 dark:ring-cyan-800",
  success:
    "bg-white text-emerald-700 shadow-sm dark:bg-emerald-900/50 dark:text-emerald-200 dark:shadow-none ring-1 ring-emerald-200 dark:ring-emerald-800",
  muted:
    "bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-700",
};

const transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

const EMPTY_ARRAY = [];
const StatsCardsRow = ({ items = EMPTY_ARRAY, className = "" }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div
      className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`.trim()}
    >
      {items.map((item, index) => {
        const key = item.id || item.label || index;
        const tone =
          item.tone && CARD_TONE_CLASS[item.tone] ? item.tone : "neutral";
        const Icon = item.icon;

        return (
          <m.article
            key={key}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...transition, delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`group rounded-2xl border px-5 py-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${CARD_TONE_CLASS[tone]}`}
          >
            {/* Subtle Gradient Overlay on Hover */}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/5 dark:to-transparent" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500/80 dark:text-slate-400">
                  {item.label}
                </p>
                <m.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1, duration: 0.4 }}
                  className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
                >
                  {item.value}
                </m.p>
              </div>
              {Icon ? (
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 group-hover:rotate-3 ${ICON_TONE_CLASS[tone]}`}
                >
                  <Icon size={18} strokeWidth={2.5} />
                </span>
              ) : null}
            </div>
            {item.caption ? (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 relative">
                {item.caption}
              </p>
            ) : null}
          </m.article>
        );
      })}
    </div>
  );
};

export default StatsCardsRow;
