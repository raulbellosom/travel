import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, LogOut, ShieldCheck, UserCircle2 } from "lucide-react";
import { INTERNAL_ROUTES } from "../../utils/internalRoutes";

const DashboardUserDropdown = ({ user, onLogout, showIdentity = false }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

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

  const primaryMenuItems = [
    {
      to: INTERNAL_ROUTES.profile,
      icon: UserCircle2,
      label: t("navbar.userMenu.profile"),
    },
  ];

  const legalMenuItems = [
    {
      to: "/aviso-privacidad",
      icon: ShieldCheck,
      label: t("navbar.userMenu.privacy"),
    },
    {
      to: "/terminos-condiciones",
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
        className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white/80 text-left transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800 ${
          showIdentity ? "w-10 xl:w-auto xl:gap-2 xl:px-1.5 xl:pr-3" : "w-10"
        }`}
        aria-label={t("navbar.userMenu.defaultUser")}
        title={user?.name || t("navbar.userMenu.defaultUser")}
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
        {showIdentity ? (
          <span className="hidden max-w-[12rem] xl:block">
            <span className="block truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
              {user?.name || t("navbar.userMenu.defaultUser")}
            </span>
            <span className="block truncate text-[11px] text-slate-500 dark:text-slate-300">
              {user?.email || ""}
            </span>
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-[90] mt-2 max-h-[70vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          style={{ width: "min(20rem, calc(100vw - 1rem))" }}
        >
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/50">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {user?.name || t("navbar.userMenu.defaultUser")}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">{user?.email}</p>
          </div>

          <div className="p-2">
            {primaryMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
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
              className="inline-flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
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

export default DashboardUserDropdown;
