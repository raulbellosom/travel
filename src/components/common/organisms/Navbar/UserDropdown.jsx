import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  ChevronDown,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Heart,
  ShieldCheck,
  Star,
  UserCircle2,
} from "lucide-react";
import { useInstanceModules } from "../../../../hooks/useInstanceModules";
import { hasScope, isInternalRole } from "../../../../utils/roles";
import { isScopeAllowedByModules } from "../../../../utils/moduleAccess";
import {
  INTERNAL_ROUTES,
  getConversationsRoute,
} from "../../../../utils/internalRoutes";

const UserDropdown = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isEnabled } = useInstanceModules();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const initials = useMemo(() => {
    const value = String(user?.name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join("");
    return value || "U";
  }, [user?.name]);

  useEffect(() => {
    const onMouseDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setOpen(false);
    await onLogout();
  };

  const isInternalUser = isInternalRole(user?.role);
  const canAccessScope = (scope) =>
    hasScope(user, scope) && isScopeAllowedByModules(scope, isEnabled);
  const canAccessProfile = !isInternalUser || canAccessScope("profile.read");
  const canAccessConversations =
    isEnabled("module.messaging.realtime") &&
    (!isInternalUser || canAccessScope("messaging.read"));

  const userMenuItems = [
    ...(isInternalUser
      ? [
          {
            key: "dashboard",
            to: INTERNAL_ROUTES.dashboard,
            icon: LayoutDashboard,
            label: t("nav.dashboard"),
          },
        ]
      : []),
    ...(canAccessProfile
      ? [
          {
            key: "profile",
            to: isInternalUser ? INTERNAL_ROUTES.profile : "/profile",
            icon: UserCircle2,
            label: t("navbar.userMenu.profile"),
          },
        ]
      : []),
    ...(!isInternalUser
      ? [
          {
            key: "reservations",
            to: "/my-reservations",
            icon: BookOpen,
            label: t("navbar.userMenu.reservations"),
          },
          {
            key: "reviews",
            to: "/my-reviews",
            icon: Star,
            label: t("navbar.userMenu.reviews"),
          },
          {
            key: "favorites",
            to: "/my-favorites",
            icon: Heart,
            label: t("navbar.userMenu.favorites", {
              defaultValue: "Mis Favoritos",
            }),
          },
        ]
      : []),
    ...(canAccessConversations
      ? [
          {
            key: "conversations",
            to: getConversationsRoute(user),
            icon: MessageCircle,
            label: t("navbar.userMenu.conversations"),
          },
        ]
      : []),
    {
      key: "password",
      to: isInternalUser ? INTERNAL_ROUTES.profile : "/recuperar-password",
      icon: KeyRound,
      label: t("navbar.userMenu.password"),
    },
  ];

  const legalMenuItems = [
    {
      to: "/privacy-notice",
      icon: ShieldCheck,
      label: t("navbar.userMenu.privacy"),
    },
    {
      to: "/terms-conditions",
      icon: FileText,
      label: t("navbar.userMenu.terms"),
    },
  ];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-2 py-1.5 text-left transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800"
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user?.name || t("navbar.userMenu.defaultUser")}
            className="h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-slate-700"
            loading="lazy"
          />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-xs font-semibold text-white">
            {initials}
          </span>
        )}
        <span className="hidden leading-tight sm:block">
          <span className="block max-w-[140px] truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
            {user?.name || t("navbar.userMenu.defaultUser")}
          </span>
          <span className="block max-w-[140px] truncate text-[11px] text-slate-500 dark:text-slate-300">
            {user?.email}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[290px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/50">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {user?.name || t("navbar.userMenu.defaultUser")}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {user?.email}
            </p>
          </div>

          <div className="p-2">
            {userMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key || item.to}
                  to={item.to}
                  className="inline-flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-200 p-2 dark:border-slate-700">
            {legalMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="inline-flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-200 p-2 dark:border-slate-700">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              <LogOut size={16} />
              {t("nav.logout")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UserDropdown;
