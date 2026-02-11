import { useTranslation } from "react-i18next";

const dots = [0, 1, 2];

const LoadingScreen = ({
  title,
  message,
  transparent = true,
}) => {
  const { t } = useTranslation();

  const resolvedTitle = title || t("loadingScreen.title");
  const resolvedMessage = message || t("loadingScreen.message");

  return (
    <div
      className={`fixed inset-0 z-[120] flex min-h-dvh items-center justify-center ${
        transparent
          ? "bg-slate-950/45 backdrop-blur-sm"
          : "bg-gradient-to-b from-slate-950 to-slate-900"
      }`}
      role="status"
      aria-live="polite"
      aria-label={resolvedTitle}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.10)_0%,transparent_65%)]"
      />

      <div className="relative flex w-[92%] max-w-sm flex-col items-center rounded-2xl border border-white/20 bg-white/10 px-7 py-8 text-center shadow-2xl">
        <div className="relative mb-6 h-20 w-20">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="2"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="276"
              strokeDashoffset="140"
              className="origin-center animate-spin"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-sky-200">
              {t("loadingScreen.badge")}
            </span>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white">{resolvedTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-200/85">{resolvedMessage}</p>

        <div className="mt-6 flex gap-2">
          {dots.map((dot) => (
            <span
              key={dot}
              className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-300"
              style={{ animationDelay: `${dot * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

