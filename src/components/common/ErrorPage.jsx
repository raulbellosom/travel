import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  HelpCircle,
  Home,
  LifeBuoy,
  RotateCw,
  SearchX,
  ServerCrash,
  Sparkles,
  Wrench,
} from "lucide-react";
import env from "../../env";

const themes = {
  "400": {
    icon: AlertTriangle,
    pageGradient:
      "from-amber-50 via-orange-50 to-slate-100 dark:from-[#1f1205] dark:via-[#261606] dark:to-[#16171a]",
    orbPrimary: "bg-amber-400/35 dark:bg-amber-500/30",
    orbSecondary: "bg-orange-500/25 dark:bg-orange-500/20",
    badge:
      "border-amber-200 bg-amber-100/90 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
    codePill:
      "border-amber-300 bg-white/80 text-amber-700 dark:border-amber-400/30 dark:bg-slate-900/70 dark:text-amber-200",
    cardBorder: "border-amber-200/70 dark:border-amber-500/25",
    tipsPanel:
      "border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/8 dark:text-amber-100",
    tipIcon: "text-amber-500",
    primaryButton:
      "from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400",
    iconColor: "text-amber-600 dark:text-amber-100",
    iconGlow: "from-amber-300 to-orange-400",
    codeGradient: "from-amber-500 to-orange-500",
    iconAnimation: "animate-shake-soft",
  },
  "403": {
    icon: Ban,
    pageGradient:
      "from-rose-50 via-red-50 to-slate-100 dark:from-[#210810] dark:via-[#2a0a14] dark:to-[#14141b]",
    orbPrimary: "bg-rose-400/35 dark:bg-rose-500/30",
    orbSecondary: "bg-red-500/25 dark:bg-red-500/20",
    badge:
      "border-rose-200 bg-rose-100/90 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100",
    codePill:
      "border-rose-300 bg-white/80 text-rose-700 dark:border-rose-400/30 dark:bg-slate-900/70 dark:text-rose-200",
    cardBorder: "border-rose-200/70 dark:border-rose-500/25",
    tipsPanel:
      "border-rose-200 bg-rose-50/90 text-rose-900 dark:border-rose-500/25 dark:bg-rose-500/8 dark:text-rose-100",
    tipIcon: "text-rose-500",
    primaryButton:
      "from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500",
    iconColor: "text-rose-600 dark:text-rose-100",
    iconGlow: "from-rose-400 to-red-500",
    codeGradient: "from-rose-600 to-red-600",
    iconAnimation: "animate-wiggle",
  },
  "404": {
    icon: SearchX,
    pageGradient:
      "from-cyan-50 via-sky-50 to-slate-100 dark:from-[#041723] dark:via-[#082233] dark:to-[#0a1a2a]",
    orbPrimary: "bg-cyan-400/35 dark:bg-cyan-500/30",
    orbSecondary: "bg-sky-500/25 dark:bg-sky-500/20",
    badge:
      "border-cyan-200 bg-cyan-100/90 text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-100",
    codePill:
      "border-cyan-300 bg-white/80 text-cyan-700 dark:border-cyan-400/30 dark:bg-slate-900/70 dark:text-cyan-200",
    cardBorder: "border-cyan-200/70 dark:border-cyan-500/25",
    tipsPanel:
      "border-cyan-200 bg-cyan-50/90 text-cyan-900 dark:border-cyan-500/25 dark:bg-cyan-500/8 dark:text-cyan-100",
    tipIcon: "text-cyan-500",
    primaryButton:
      "from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400",
    iconColor: "text-cyan-700 dark:text-cyan-100",
    iconGlow: "from-cyan-400 to-sky-500",
    codeGradient: "from-cyan-500 to-sky-500",
    iconAnimation: "animate-pulse-soft",
  },
  "500": {
    icon: ServerCrash,
    pageGradient:
      "from-red-50 via-orange-50 to-slate-100 dark:from-[#210708] dark:via-[#2a0e0f] dark:to-[#16131a]",
    orbPrimary: "bg-red-400/35 dark:bg-red-500/30",
    orbSecondary: "bg-orange-500/25 dark:bg-orange-500/20",
    badge:
      "border-red-200 bg-red-100/90 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100",
    codePill:
      "border-red-300 bg-white/80 text-red-700 dark:border-red-400/30 dark:bg-slate-900/70 dark:text-red-200",
    cardBorder: "border-red-200/70 dark:border-red-500/25",
    tipsPanel:
      "border-red-200 bg-red-50/90 text-red-900 dark:border-red-500/25 dark:bg-red-500/8 dark:text-red-100",
    tipIcon: "text-red-500",
    primaryButton:
      "from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500",
    iconColor: "text-red-600 dark:text-red-100",
    iconGlow: "from-red-400 to-orange-500",
    codeGradient: "from-red-600 to-orange-600",
    iconAnimation: "animate-glitch-soft",
  },
  "503": {
    icon: Wrench,
    pageGradient:
      "from-teal-50 via-cyan-50 to-slate-100 dark:from-[#041d1c] dark:via-[#062627] dark:to-[#111a21]",
    orbPrimary: "bg-teal-400/35 dark:bg-teal-500/30",
    orbSecondary: "bg-cyan-500/25 dark:bg-cyan-500/20",
    badge:
      "border-teal-200 bg-teal-100/90 text-teal-800 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-100",
    codePill:
      "border-teal-300 bg-white/80 text-teal-700 dark:border-teal-400/30 dark:bg-slate-900/70 dark:text-teal-200",
    cardBorder: "border-teal-200/70 dark:border-teal-500/25",
    tipsPanel:
      "border-teal-200 bg-teal-50/90 text-teal-900 dark:border-teal-500/25 dark:bg-teal-500/8 dark:text-teal-100",
    tipIcon: "text-teal-500",
    primaryButton:
      "from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400",
    iconColor: "text-teal-700 dark:text-teal-100",
    iconGlow: "from-teal-400 to-cyan-500",
    codeGradient: "from-teal-500 to-cyan-500",
    iconAnimation: "animate-spin-slow",
  },
  general: {
    icon: HelpCircle,
    pageGradient:
      "from-slate-50 via-sky-50 to-slate-100 dark:from-slate-950 dark:via-[#101b2b] dark:to-slate-900",
    orbPrimary: "bg-sky-400/35 dark:bg-sky-500/30",
    orbSecondary: "bg-indigo-500/25 dark:bg-indigo-500/20",
    badge:
      "border-sky-200 bg-sky-100/90 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100",
    codePill:
      "border-sky-300 bg-white/80 text-sky-700 dark:border-sky-400/30 dark:bg-slate-900/70 dark:text-sky-200",
    cardBorder: "border-sky-200/70 dark:border-sky-500/25",
    tipsPanel:
      "border-sky-200 bg-sky-50/90 text-sky-900 dark:border-sky-500/25 dark:bg-sky-500/8 dark:text-sky-100",
    tipIcon: "text-sky-500",
    primaryButton:
      "from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400",
    iconColor: "text-sky-700 dark:text-sky-100",
    iconGlow: "from-sky-400 to-indigo-500",
    codeGradient: "from-sky-500 to-indigo-500",
    iconAnimation: "animate-float-y",
  },
};

const ErrorPage = ({
  errorCode = "404",
  customTitle = null,
  customMessage = null,
  showTips = true,
  showActions = true,
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const errorType = ["400", "403", "404", "500", "503"].includes(errorCode)
    ? errorCode
    : "general";

  const theme = themes[errorType] || themes.general;

  const errorData = {
    title: customTitle || t(`errors.${errorType}.title`),
    subtitle: t(`errors.${errorType}.subtitle`),
    message: customMessage || t(`errors.${errorType}.message`),
    tips: t(`errors.${errorType}.tips`, { returnObjects: true }),
  };

  const Icon = useMemo(() => theme.icon, [theme.icon]);
  const goHome = () => {
    window.location.assign("/");
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.assign("/");
  };

  return (
    <div
      className={`relative min-h-dvh overflow-hidden bg-gradient-to-br ${theme.pageGradient} text-slate-900 dark:text-slate-50`}
    >
      <div className="error-page-grid absolute inset-0" aria-hidden />
      <div className={`error-orb error-orb-a ${theme.orbPrimary}`} aria-hidden />
      <div className={`error-orb error-orb-b ${theme.orbSecondary}`} aria-hidden />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl items-center p-4 sm:p-6 lg:p-10">
        <section
          className={`error-card-enter w-full rounded-[2rem] border bg-white/88 p-6 shadow-2xl backdrop-blur-sm transition-all duration-500 dark:bg-slate-950/80 sm:p-8 lg:p-10 ${theme.cardBorder} ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${theme.badge}`}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {env.app.name}
            </span>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${theme.codePill}`}
            >
              Error {errorCode}
            </span>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                {errorData.subtitle}
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                {errorData.title}
              </h1>
              <p className="mt-4 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
                {errorData.message}
              </p>

              {showTips && Array.isArray(errorData.tips) && errorData.tips.length > 0 ? (
                <div className={`mt-6 rounded-2xl border p-4 ${theme.tipsPanel}`}>
                  <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
                    <HelpCircle className="h-5 w-5" aria-hidden />
                    {t("errors.helpfulTips")}
                  </h3>
                  <ul className="space-y-2 text-sm sm:text-base">
                    {errorData.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 shrink-0 ${theme.tipIcon}`}
                          aria-hidden
                        />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {showActions ? (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={goHome}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r px-5 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 ${theme.primaryButton}`}
                  >
                    <Home className="h-5 w-5" aria-hidden />
                    {t("errors.actions.goHome")}
                  </button>

                  <button
                    onClick={goBack}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-5 py-3 font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900"
                  >
                    <ArrowLeft className="h-5 w-5" aria-hidden />
                    {t("errors.actions.goBack")}
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-500/90 px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-500 dark:border-emerald-500/40"
                  >
                    <RotateCw className="h-5 w-5" aria-hidden />
                    {t("errors.actions.tryAgain")}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mx-auto w-full max-w-[13.5rem]">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900/90">
                <div
                  className={`absolute -top-8 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-gradient-to-br ${theme.iconGlow} opacity-25 blur-2xl`}
                  aria-hidden
                />
                <div className="relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/90 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-950">
                  <Icon
                    className={`h-8 w-8 ${theme.iconColor} ${theme.iconAnimation}`}
                    aria-hidden
                  />
                </div>
                <p
                  className={`error-code-glow relative z-10 bg-gradient-to-r bg-clip-text text-center text-6xl font-black leading-none text-transparent ${theme.codeGradient}`}
                >
                  {errorCode}
                </p>
                <div className="relative z-10 mx-auto mt-4 h-1.5 w-20 rounded-full bg-slate-200 dark:bg-slate-700/70">
                  <span
                    className={`animate-pulse-soft block h-full w-1/2 rounded-full bg-gradient-to-r ${theme.codeGradient}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="mt-7 flex items-center justify-center gap-2 text-center text-sm text-slate-600 dark:text-slate-300">
            <LifeBuoy className="h-4 w-4" aria-hidden />
            {t("errors.footerSupport")}
          </p>
        </section>
      </div>
    </div>
  );
};

export default ErrorPage;
