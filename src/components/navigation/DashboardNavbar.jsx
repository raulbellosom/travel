import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import BrandLogo from "../common/BrandLogo";

const DashboardNavbar = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              aria-label={t("dashboardNavbar.openMenu")}
            >
              <Menu size={24} />
            </button>
            <BrandLogo size="sm" mode="adaptive" alt={t("navbar.brand")} className="rounded-lg" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("navbar.brand")}</p>
              <h1 className="text-xs font-medium text-gray-600 dark:text-gray-300">{t("dashboardNavbar.title")}</h1>
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t("dashboardNavbar.welcome", { name: user?.name || t("dashboardNavbar.defaultUser") })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNavbar;

