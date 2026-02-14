import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Home,
  KeyRound,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  Search,
  ShieldCheck,
  Star,
  Sun,
  UserCircle2,
  X,
} from "lucide-react";
import { useAuth } from "../../../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useUI } from "../../../../contexts/UIContext";
import { isInternalRole } from "../../../../utils/roles";
import { INTERNAL_ROUTES } from "../../../../utils/internalRoutes";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import BrandLogo from "../../BrandLogo";
import UserDropdown from "./UserDropdown";

const navItemClass =
  "inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium transition";
const mobileIconButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 max-[380px]:h-9 max-[380px]:w-9";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, changeTheme, changeLanguage } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const language = i18n.resolvedLanguage || i18n.language || "es";
  const nextLanguage = language === "es" ? "en" : "es";
  const currentTheme =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";
  const nextTheme =
    currentTheme === "system"
      ? "light"
      : currentTheme === "light"
        ? "dark"
        : "system";
  const ThemeIcon =
    currentTheme === "light" ? Sun : currentTheme === "dark" ? Moon : Monitor;
  const themeToggleLabel = t("dashboardNavbar.toggleThemeTo", {
    theme: t(`theme.${nextTheme}`),
  });
  const languageLabel = String(language || "es")
    .split("-")[0]
    .toUpperCase();
  const isInternalUser = isInternalRole(user?.role);
  const mobileInitials = useMemo(() => {
    const value = String(user?.name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join("");
    return value || "U";
  }, [user?.name]);

  const accountLinks = [
    ...(isInternalUser
      ? [
          {
            to: INTERNAL_ROUTES.dashboard,
            icon: LayoutDashboard,
            label: t("nav.dashboard"),
          },
        ]
      : []),
    { to: "/perfil", icon: UserCircle2, label: t("navbar.userMenu.profile") },
    {
      to: "/mis-reservas",
      icon: BookOpen,
      label: t("navbar.userMenu.reservations"),
    },
    { to: "/mis-resenas", icon: Star, label: t("navbar.userMenu.reviews") },
    {
      to: "/recuperar-password",
      icon: KeyRound,
      label: t("navbar.userMenu.password"),
    },
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

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const onToggleLanguage = () => {
    changeLanguage(nextLanguage);
  };

  const onToggleTheme = () => {
    changeTheme(nextTheme);
  };

  const onLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-2 px-2.5 sm:px-6 lg:px-8 max-[380px]:h-16">
        <div className="flex min-w-0 items-center gap-2 max-[380px]:gap-1.5">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 lg:hidden max-[380px]:h-9 max-[380px]:w-9"
            aria-label={t("navbar.toggleMenu")}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BrandLogo
              size="sm"
              mode="adaptive"
              alt={t("navbar.brand")}
              className="rounded-xl shadow-md"
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white max-[380px]:text-[13px]">
                {t("navbar.brand")}
              </p>
              <p className="hidden text-xs text-cyan-600 dark:text-cyan-400 sm:block">
                {t("navbar.tagline")}
              </p>
            </div>
          </Link>
        </div>

        <div className="hidden items-center justify-center gap-1 lg:flex">
          <Link
            to="/"
            className={`${navItemClass} ${
              isActive("/")
                ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {t("nav.home")}
          </Link>
          <Link
            to="/"
            className={`${navItemClass} text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}
          >
            {t("nav.realEstate")}
          </Link>
          <Link
            to="/"
            className={`${navItemClass} text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}
          >
            {t("nav.vacation")}
          </Link>
          <Link
            to="/"
            className={`${navItemClass} text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}
          >
            {t("nav.services")}
          </Link>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <label className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="search"
              placeholder={t("navbar.searchPlaceholder")}
              className="min-h-11 w-52 rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </label>
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <>
              <UserDropdown user={user} onLogout={onLogout} />
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/register"
                className="inline-flex min-h-11 items-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5 lg:hidden max-[380px]:gap-1">
          <button
            onClick={onToggleLanguage}
            className={`${mobileIconButtonClass} text-[11px] font-semibold uppercase tracking-wide max-[380px]:text-[10px]`}
            aria-label={t("dashboardNavbar.toggleLanguage")}
            title={t("dashboardNavbar.toggleLanguage")}
          >
            <span>{languageLabel}</span>
          </button>

          <Link
            to="/"
            className={mobileIconButtonClass}
            aria-label={t("nav.home")}
            title={t("nav.home")}
          >
            <Home size={17} />
          </Link>

          <button
            onClick={onToggleTheme}
            className={mobileIconButtonClass}
            aria-label={themeToggleLabel}
            title={themeToggleLabel}
          >
            <ThemeIcon size={15} />
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white/80 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800 max-[380px]:h-9 max-[380px]:w-9"
              aria-label={user?.name || t("navbar.userMenu.defaultUser")}
              title={user?.name || t("navbar.userMenu.defaultUser")}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.name || t("navbar.userMenu.defaultUser")}
                  className="h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-slate-700 max-[380px]:h-7 max-[380px]:w-7"
                  loading="lazy"
                />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-xs font-semibold text-white max-[380px]:h-7 max-[380px]:w-7">
                  {mobileInitials}
                </span>
              )}
            </button>
          ) : (
            <Link
              to="/login"
              className={mobileIconButtonClass}
              aria-label={t("nav.login")}
              title={t("nav.login")}
            >
              <UserCircle2 size={17} />
            </Link>
          )}
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={navItemClass}
            >
              {t("nav.home")}
            </Link>
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={navItemClass}
            >
              {t("nav.realEstate")}
            </Link>
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={navItemClass}
            >
              {t("nav.vacation")}
            </Link>
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={navItemClass}
            >
              {t("nav.services")}
            </Link>

            <div className="mt-2 flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            {user ? (
              <>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {user?.name || t("navbar.userMenu.defaultUser")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    {user?.email}
                  </p>
                </div>

                <div className="grid gap-1">
                  {accountLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
