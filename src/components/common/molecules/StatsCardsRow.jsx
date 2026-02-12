const CARD_TONE_CLASS = {
  neutral:
    "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
  info:
    "border-cyan-200 bg-cyan-50/80 dark:border-cyan-900/50 dark:bg-cyan-950/20",
  success:
    "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/20",
  muted:
    "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60",
};

const ICON_TONE_CLASS = {
  neutral:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100",
  info:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200",
  muted:
    "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
};

const StatsCardsRow = ({ items = [], className = "" }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`.trim()}>
      {items.map((item, index) => {
        const key = item.id || item.label || index;
        const tone = item.tone && CARD_TONE_CLASS[item.tone] ? item.tone : "neutral";
        const Icon = item.icon;

        return (
          <article key={key} className={`rounded-2xl border px-4 py-3 shadow-sm ${CARD_TONE_CLASS[tone]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {item.label}
                </p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {item.value}
                </p>
              </div>
              {Icon ? (
                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_TONE_CLASS[tone]}`}>
                  <Icon size={16} />
                </span>
              ) : null}
            </div>
            {item.caption ? (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.caption}</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
};

export default StatsCardsRow;
