import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, List, User, Settings, Inbox, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import BrandLogo from "../common/BrandLogo";

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: t("sidebar.overview"), href: "/dashboard", icon: Home },
    { name: t("sidebar.listings"), href: "/mis-propiedades", icon: List },
    { name: t("sidebar.leads"), href: "/leads", icon: Inbox },
    { name: t("sidebar.profile"), href: "/perfil", icon: User },
    {
      name: t("sidebar.settings"),
      href: "/configuracion",
      icon: Settings,
    },
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" mode="adaptive" alt={t("navbar.brand")} className="rounded-lg" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("navbar.brand")}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">{t("sidebar.dashboardTitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={t("common.close")}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || t("sidebar.defaultUser")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => onClose()}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${
                      isActive(item.href)
                        ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    }
                  `}
                >
                  <Icon
                    className={`
                      mr-3 flex-shrink-0 h-5 w-5
                      ${
                        isActive(item.href)
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                      }
                    `}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;

