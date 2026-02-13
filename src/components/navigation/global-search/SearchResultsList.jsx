import { GLOBAL_SEARCH_DEFAULT_ICON, GLOBAL_SEARCH_ICON_MAP } from "./icons";

const SearchResultsList = ({
  t,
  query = "",
  groupedResults,
  flatResults,
  activeIndex,
  loading,
  onSelect,
  compact = false,
  fullHeight = false,
}) => {
  const containerClass = fullHeight
    ? "h-full overflow-y-auto px-2 py-2"
    : "max-h-[58vh] overflow-y-auto px-2 py-2";
  const hasTypedQuery = String(query || "").trim().length >= 2;
  const emptyLabel = hasTypedQuery
    ? t("globalSearch.states.empty")
    : t("globalSearch.states.commandHelp");

  return (
    <div className={`${containerClass} bg-transparent`}>
      {loading ? (
        <p className="px-2 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {t("globalSearch.states.loading")}
        </p>
      ) : null}

      {!loading && flatResults.length === 0 ? (
        <p className="px-2 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {emptyLabel}
        </p>
      ) : null}

      {!loading
        ? groupedResults.map((group) => (
            <section key={group.label} className="pb-2">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.results.map((item) => {
                  const itemIndex = flatResults.findIndex((entry) => entry.id === item.id);
                  const Icon = GLOBAL_SEARCH_ICON_MAP[item.icon] || GLOBAL_SEARCH_DEFAULT_ICON;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(item)}
                      className={`grid w-full grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-3 rounded-xl px-2 py-2 text-left transition ${
                        itemIndex === activeIndex
                          ? "bg-cyan-50 text-cyan-900 dark:bg-cyan-900/25 dark:text-cyan-100"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <Icon size={compact ? 16 : 15} className="mt-0.5 text-cyan-600 dark:text-cyan-300" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="block truncate text-sm font-medium">{item.title}</span>
                          {item.badge ? (
                            <span className="shrink-0 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                              {item.badge}
                            </span>
                          ) : null}
                        </span>
                        {item.subtitle ? (
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-300">
                            {item.subtitle}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        : null}

      {!loading && flatResults.length > 0 ? (
        <p className="border-t border-cyan-100/70 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {t("globalSearch.hints.keyboard")}
        </p>
      ) : null}
    </div>
  );
};

export default SearchResultsList;
