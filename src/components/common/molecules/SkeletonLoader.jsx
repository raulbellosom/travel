import PropTypes from "prop-types";

/**
 * SkeletonLoader – in-component placeholder while content loads.
 *
 * @param {"list"|"cards"|"detail"|"dashboard"|"table"} variant
 *   - list      – shimmer rows with avatar + text, fits lead/reservation lists
 *   - cards     – shimmer card grid with image area, fits search/public grids
 *   - detail    – shimmer info-row blocks, fits detail / form pages
 *   - dashboard – KPI stat cards + chart blocks + two list panels (matches Dashboard layout)
 *   - table     – table rows with thumbnail + text columns (matches Mis Recursos layout)
 * @param {number} count – number of skeleton items (sensible defaults per variant)
 * @param {string} className – extra wrapper classes
 */
const SkeletonLoader = ({ variant = "list", count, className = "" }) => {
  // ─── DASHBOARD ───────────────────────────────────────────────────────────
  if (variant === "dashboard") {
    return (
      <div className={`animate-pulse space-y-6 ${className}`}>
        {/* KPI stat cards row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-7 w-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>

        {/* Chart row: wide area chart + narrow pie chart */}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="col-span-1 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 lg:col-span-3">
            <div className="mb-4 space-y-1.5">
              <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-56 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="col-span-1 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mx-auto h-40 w-40 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two list panels side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((panel) => (
            <div
              key={panel}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800"
                  >
                    <div className="space-y-1.5">
                      <div
                        className="h-3.5 rounded bg-slate-200 dark:bg-slate-700"
                        style={{ width: `${100 + ((row * 23) % 80)}px` }}
                      />
                      <div
                        className="h-3 rounded bg-slate-200 dark:bg-slate-700"
                        style={{ width: `${60 + ((row * 17) % 60)}px` }}
                      />
                    </div>
                    <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── TABLE rows ───────────────────────────────────────────────────────────
  if (variant === "table") {
    const n = count ?? 6;
    return (
      <div
        className={`animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${className}`}
      >
        {/* Column header bar */}
        <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
          {[56, 120, 88, 80, 88, 72, 96].map((w, i) => (
            <div
              key={i}
              className="h-3 shrink-0 rounded bg-slate-200 dark:bg-slate-700"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-800"
          >
            {/* Thumbnail */}
            <div className="h-12 w-14 shrink-0 rounded-lg bg-slate-200 dark:bg-slate-700" />
            {/* Title + slug */}
            <div className="w-36 shrink-0 space-y-1.5">
              <div
                className="h-3.5 rounded bg-slate-200 dark:bg-slate-700"
                style={{ width: `${90 + ((i * 19) % 50)}px` }}
              />
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            {/* Location */}
            <div className="w-24 shrink-0 space-y-1.5">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-14 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            {/* Type badge */}
            <div className="h-5 w-20 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
            {/* Operation badge */}
            <div className="h-5 w-20 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
            {/* Details */}
            <div className="flex shrink-0 flex-col gap-1.5">
              <div className="h-3 w-14 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-10 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            {/* Responsible */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-1">
                <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── CARDS grid ──────────────────────────────────────────────────────────
  if (variant === "cards") {
    const n = count ?? 6;
    return (
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
      >
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Image area */}
            <div className="aspect-4/3 bg-slate-200 dark:bg-slate-700" />
            {/* Body */}
            <div className="space-y-2 p-4">
              <div
                className="h-4 rounded-lg bg-slate-200 dark:bg-slate-700"
                style={{ width: `${65 + ((i * 11) % 25)}%` }}
              />
              <div
                className="h-3 rounded-lg bg-slate-200 dark:bg-slate-700"
                style={{ width: `${45 + ((i * 17) % 30)}%` }}
              />
              <div className="flex items-center gap-2 pt-1">
                <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── DETAIL / FORM ────────────────────────────────────────────────────────
  if (variant === "detail") {
    const n = count ?? 5;
    return (
      <div className={`animate-pulse space-y-1 ${className}`}>
        {/* Title placeholder */}
        <div className="mb-4 h-6 w-44 rounded-lg bg-slate-200 dark:bg-slate-700" />
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800"
          >
            <div className="mt-0.5 h-4 w-4 shrink-0 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
              <div
                className="h-4 rounded bg-slate-200 dark:bg-slate-700"
                style={{ width: `${55 + ((i * 19) % 35)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── LIST rows (default) ──────────────────────────────────────────────────
  const n = count ?? 5;
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800"
        >
          {/* Avatar / icon placeholder */}
          <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
          {/* Text lines */}
          <div className="flex-1 space-y-1.5">
            <div
              className="h-3.5 rounded-lg bg-slate-200 dark:bg-slate-700"
              style={{ width: `${50 + ((i * 13) % 36)}%` }}
            />
            <div
              className="h-3 rounded-lg bg-slate-200 dark:bg-slate-700"
              style={{ width: `${30 + ((i * 11) % 40)}%` }}
            />
          </div>
          {/* Badge / action placeholder */}
          <div className="h-6 w-16 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
};

SkeletonLoader.propTypes = {
  variant: PropTypes.oneOf(["list", "cards", "detail", "dashboard", "table"]),
  count: PropTypes.number,
  className: PropTypes.string,
};

export default SkeletonLoader;
