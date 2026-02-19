import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Copyright, Mail, Phone, MapPin, Sparkles } from "lucide-react";
import BrandLogo from "../../BrandLogo";
import { useAuth } from "../../../../hooks/useAuth";
import { isInternalRole } from "../../../../utils/roles";
import { INTERNAL_ROUTES } from "../../../../utils/internalRoutes";

/**
 * Footer component with multiple variants.
 * @param {"default"|"admin"} variant - Footer style variant
 *   - "default": Full footer with newsletter, description, contact info
 *   - "admin": Minimal footer for admin panel (copyright + essential links only)
 */
const Footer = ({ variant = "default" }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const showInternalLinks = isInternalRole(user?.role);
  const profileHref = showInternalLinks ? INTERNAL_ROUTES.profile : "/perfil";
  const currentYear = new Date().getFullYear();

  // Admin/minimal footer variant
  if (variant === "admin") {
    return (
      <footer className="border-t border-slate-200 bg-slate-50 py-4 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Copyright size={12} />
            {t("client:footer.copyright", { year: currentYear })}
          </p>
          <nav className="flex items-center gap-4">
            <Link
              to="/privacidad"
              className="text-xs text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t("client:footer.links.privacy")}
            </Link>
            <Link
              to="/terminos"
              className="text-xs text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t("client:footer.links.terms")}
            </Link>
          </nav>
        </div>
      </footer>
    );
  }

  // Default full footer
  return (
    <footer className="relative bg-slate-900 pt-16 text-slate-300 dark:bg-slate-950">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 opacity-40" />
      {/* Decorative top border */}
      <div className="absolute left-0 right-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-500/50 to-transparent" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-12 lg:grid-cols-4 lg:px-8">
        {/* Brand Column */}
        <div className="space-y-4">
          <BrandLogo size="md" mode="dark" />
          <p className="text-sm leading-relaxed text-slate-400">
            {t("client:footer.description")}
          </p>
        </div>

        {/* Explore Column */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-400">
            {t("client:footer.sections.explore")}
          </h3>
          <ul className="space-y-3">
            <li>
              <Link
                to="/"
                className="text-sm transition-colors hover:text-cyan-400"
              >
                {t("client:footer.links.home")}
              </Link>
            </li>
            {showInternalLinks && (
              <>
                <li>
                  <Link
                    to={INTERNAL_ROUTES.dashboard}
                    className="text-sm transition-colors hover:text-cyan-400"
                  >
                    {t("client:footer.links.dashboard")}
                  </Link>
                </li>
                <li>
                  <Link
                    to={INTERNAL_ROUTES.myProperties}
                    className="text-sm transition-colors hover:text-cyan-400"
                  >
                    {t("client:footer.links.properties")}
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link
                to={profileHref}
                className="text-sm transition-colors hover:text-cyan-400"
              >
                {t("client:footer.links.profile")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal/Contact Column */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-400">
            {t("client:footer.sections.legal")}
          </h3>
          <ul className="space-y-3">
            <li>
              <Link
                to="/privacidad"
                className="text-sm transition-colors hover:text-cyan-400"
              >
                {t("client:footer.links.privacy")}
              </Link>
            </li>
            <li>
              <Link
                to="/terminos"
                className="text-sm transition-colors hover:text-cyan-400"
              >
                {t("client:footer.links.terms")}
              </Link>
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-400">
              <MapPin size={14} className="text-cyan-500" />{" "}
              {t("client:footer.contact.city")}
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-400">
              <Mail size={14} className="text-cyan-500" />{" "}
              {t("client:footer.contact.email")}
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-400">
              <Phone size={14} className="text-cyan-500" />{" "}
              {t("client:footer.contact.phone")}
            </li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">
            <Sparkles size={16} /> {t("client:footer.sections.newsletter")}
          </h3>
          <p className="mb-4 text-sm text-slate-400">
            {t("client:footer.newsletter.text")}
          </p>
          <form className="relative" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder={t("client:footer.newsletter.placeholder")}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            >
              {t("client:footer.newsletter.action")}
            </button>
          </form>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-800 bg-slate-950/50 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row md:px-8">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Copyright size={12} />
            {t("client:footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-slate-600">
              {t("client:footer.brand")} - {t("client:footer.tagline")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
