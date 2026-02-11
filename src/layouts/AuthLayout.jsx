import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, ShieldCheck, Globe2 } from "lucide-react";
import { Footer } from "../components/common/organisms";
import BrandLogo from "../components/common/BrandLogo";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { useAuth } from "../hooks/useAuth";

const pathKeyMap = {
  "/login": "login",
  "/register": "register",
  "/recuperar-password": "forgotPassword",
  "/reset-password": "resetPassword",
  "/verify-email": "verifyEmail",
};

const AuthLayout = () => {
  const { t } = useTranslation();
  const { loading } = useAuth();
  const location = useLocation();
  const pageKey = pathKeyMap[location.pathname] || "login";

  if (loading) {
    return (
      <LoadingScreen
        transparent={false}
        title={t("routeGuards.validatingSession")}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo size="md" mode="adaptive" alt={t("footer.brand")} className="rounded-xl shadow-md" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("footer.brand")}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t("authLayout.platform")}</p>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t("authLayout.backToSite")}
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-2">
          <section className="relative hidden overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-xl lg:block dark:border-slate-700">
            <img
              src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1600&q=80"
              alt="Luxury real estate"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-900/45 to-cyan-700/45" />
            <div className="absolute inset-0 flex flex-col justify-between p-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <ShieldCheck size={14} /> {t("authLayout.secureAccess")}
              </div>

              <div className="space-y-4 text-white">
                <h2 className="max-w-md text-3xl font-bold leading-tight">
                  {t("authLayout.heroTitle")}
                </h2>
                <p className="max-w-lg text-sm text-white/90">
                  {t("authLayout.heroSubtitle")}
                </p>
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
                  <Globe2 size={16} /> {t("authLayout.multilingual")}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-8 lg:p-10">
            <div className="mb-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
                {t("authLayout.accountAccess")}
              </p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {t(`authLayout.pageTitles.${pageKey}`)}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t("authLayout.pageSubtitle")}
              </p>
            </div>
            <Outlet />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuthLayout;
