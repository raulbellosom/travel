import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  CreditCard,
  Home,
  Inbox,
  List,
  Settings,
  Users,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { hasScope } from "../../utils/roles";
import { INTERNAL_ROUTES } from "../../utils/internalRoutes";

const DashboardBottomTabs = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const candidates = [
    { key: "dashboard", to: INTERNAL_ROUTES.dashboard, icon: Home, label: t("sidebar.overview") },
    ...(hasScope(user, "properties.read")
      ? [{ key: "properties", to: INTERNAL_ROUTES.myProperties, icon: List, label: t("sidebar.listings") }]
      : []),
    ...(hasScope(user, "leads.read")
      ? [{ key: "leads", to: INTERNAL_ROUTES.leads, icon: Inbox, label: t("sidebar.leads") }]
      : []),
    ...(hasScope(user, "reservations.read")
      ? [{ key: "reservations", to: INTERNAL_ROUTES.reservations, icon: CalendarDays, label: t("sidebar.reservations") }]
      : []),
    ...(hasScope(user, "payments.read")
      ? [{ key: "payments", to: INTERNAL_ROUTES.payments, icon: CreditCard, label: t("sidebar.payments") }]
      : []),
    ...(hasScope(user, "staff.manage")
      ? [{ key: "team", to: INTERNAL_ROUTES.team, icon: Users, label: t("sidebar.team") }]
      : []),
    { key: "settings", to: INTERNAL_ROUTES.settings, icon: Settings, label: t("sidebar.settings") },
  ];

  const tabs = candidates.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[66] border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden dark:border-slate-800/80 dark:bg-[radial-gradient(circle_at_0%_100%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.12),transparent_36%),linear-gradient(135deg,rgba(2,6,23,0.98)_0%,rgba(10,23,53,0.96)_45%,rgba(2,6,23,0.98)_100%)]">
      <div
        className="mx-auto grid max-w-[1520px] gap-1 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2"
        style={{ gridTemplateColumns: `repeat(${tabs.length || 1}, minmax(0, 1fr))` }}
      >
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `inline-flex min-h-12 flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[11px] font-medium leading-tight transition ${
                  isActive
                    ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/25 dark:text-cyan-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
                }`
              }
            >
              <Icon size={16} className="mb-0.5" />
              <span className="max-w-full truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default DashboardBottomTabs;

