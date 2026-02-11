import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  KeyRound,
  Menu,
  PlusCircle,
  Search,
  ShieldCheck,
  Star,
  UserCircle2,
  X,
} from "lucide-react";
import { useAuth } from "../../../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import BrandLogo from "../../BrandLogo";
import { canPublishProperty, isInternalRole } from "../../../../utils/roles";
import UserDropdown from "./UserDropdown";
import { INTERNAL_ROUTES } from "../../../../utils/internalRoutes";

const navItemClass =
  "inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium transition";

const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isInternalUser = isInternalRole(user?.role);
  const allowPublishProperty = canPublishProperty(user?.role);
  const accountLinks = [
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

  const onLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <BrandLogo size="lg" mode="adaptive" alt={t("navbar.brand")} className="rounded-xl shadow-md" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("navbar.brand")}</p>
            <p className="text-xs text-cyan-600 dark:text-cyan-400">{t("navbar.tagline")}</p>
          </div>
        </Link>

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
          <Link to="/" className={`${navItemClass} text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}>
            {t("nav.realEstate")}
          </Link>
          <Link to="/" className={`${navItemClass} text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}>
            {t("nav.vacation")}
          </Link>
          <Link to="/" className={`${navItemClass} text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}>
            {t("nav.services")}
          </Link>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
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
              {isInternalUser ? (
                <Link
                  to={INTERNAL_ROUTES.dashboard}
                  className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t("nav.dashboard")}
                </Link>
              ) : null}
              {allowPublishProperty ? (
                <Link
                  to={INTERNAL_ROUTES.createProperty}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500"
                >
                  <PlusCircle size={16} /> {t("navbar.publish")}
                </Link>
              ) : null}
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

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 lg:hidden"
          aria-label={t("navbar.toggleMenu")}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <div className="flex flex-col gap-2">
            <Link to="/" onClick={() => setMobileOpen(false)} className={navItemClass}>
              {t("nav.home")}
            </Link>
            <Link to="/" onClick={() => setMobileOpen(false)} className={navItemClass}>
              {t("nav.realEstate")}
            </Link>
            <Link to="/" onClick={() => setMobileOpen(false)} className={navItemClass}>
              {t("nav.vacation")}
            </Link>
            <Link to="/" onClick={() => setMobileOpen(false)} className={navItemClass}>
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
                  <p className="text-xs text-slate-500 dark:text-slate-300">{user?.email}</p>
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

                {isInternalUser ? (
                  <Link
                    to={INTERNAL_ROUTES.dashboard}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    {t("nav.dashboard")}
                  </Link>
                ) : null}

                {allowPublishProperty ? (
                  <Link
                    to={INTERNAL_ROUTES.createProperty}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {t("navbar.publish")}
                  </Link>
                ) : null}
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
