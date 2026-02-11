import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import BrandLogo from "../common/BrandLogo";

const DashboardNavbar = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto grid h-20 w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label={t("dashboardNavbar.openMenu")}
          >
            <Menu size={20} />
          </button>
          <BrandLogo size="md" mode="adaptive" alt={t("navbar.brand")} className="rounded-xl shadow-md" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("navbar.brand")}</p>
            <h1 className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("dashboardNavbar.title")}</h1>
          </div>
        </div>

        <div />

        <div className="flex items-center justify-end">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {t("dashboardNavbar.welcome", { name: user?.name || t("dashboardNavbar.defaultUser") })}
          </span>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;

