import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Copyright, Mail, Phone, MapPin, Sparkles } from "lucide-react";
import BrandLogo from "../../BrandLogo";
import { useAuth } from "../../../../hooks/useAuth";
import { isInternalRole } from "../../../../utils/roles";
import { INTERNAL_ROUTES } from "../../../../utils/internalRoutes";

const Footer = ({ variant = "full" }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const showInternalLinks = isInternalRole(user?.role);
  const profileHref = showInternalLinks ? INTERNAL_ROUTES.profile : "/perfil";

  if (variant === "app") {
    return (
      <footer className="relative z-[65] border-t border-slate-200 bg-gradient-to-r from-cyan-50 via-sky-50 to-cyan-100 dark:border-slate-800/80 dark:bg-[radial-gradient(circle_at_0%_100%,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.1),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.08),transparent_38%),linear-gradient(135deg,rgba(2,6,23,0.99)_0%,rgba(10,23,53,0.96)_45%,rgba(2,6,23,0.99)_100%)] sm:h-14">
        <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-2 px-4 py-3 text-xs text-slate-600 sm:h-full sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 lg:px-8 dark:text-slate-300">
          <p className="inline-flex items-center gap-1.5">
            <Copyright size={13} />
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link className="hover:text-slate-900 dark:hover:text-white" to={profileHref}>
              {t("footer.links.profile")}
            </Link>
            <Link className="hover:text-slate-900 dark:hover:text-white" to="/aviso-privacidad">
              {t("footer.links.privacy")}
            </Link>
            <Link className="hover:text-slate-900 dark:hover:text-white" to="/terminos-condiciones">
              {t("footer.links.terms")}
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(45,212,191,0.12),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(56,189,248,0.08),transparent_35%)] dark:bg-[radial-gradient(circle_at_10%_20%,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(56,189,248,0.14),transparent_35%)]"
      />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" mode="adaptive" alt={t("footer.brand")} className="rounded-xl" />
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{t("footer.brand")}</p>
              <p className="text-xs text-cyan-700 dark:text-cyan-300">{t("footer.tagline")}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("footer.description")}</p>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{t("footer.sections.explore")}</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <Link className="hover:text-slate-900 dark:hover:text-white" to="/">{t("footer.links.home")}</Link>
            </li>
            {showInternalLinks ? (
              <li>
                <Link className="hover:text-slate-900 dark:hover:text-white" to={INTERNAL_ROUTES.dashboard}>{t("footer.links.dashboard")}</Link>
              </li>
            ) : null}
            {showInternalLinks ? (
              <li>
                <Link className="hover:text-slate-900 dark:hover:text-white" to={INTERNAL_ROUTES.myProperties}>{t("footer.links.properties")}</Link>
              </li>
            ) : null}
            <li>
              <Link className="hover:text-slate-900 dark:hover:text-white" to={profileHref}>
                {t("footer.links.profile")}
              </Link>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{t("footer.sections.legal")}</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li className="inline-flex items-center gap-2"><MapPin size={14} className="text-cyan-700 dark:text-cyan-300" /> {t("footer.contact.city")}</li>
            <li className="inline-flex items-center gap-2"><Mail size={14} className="text-cyan-700 dark:text-cyan-300" /> {t("footer.contact.email")}</li>
            <li className="inline-flex items-center gap-2"><Phone size={14} className="text-cyan-700 dark:text-cyan-300" /> {t("footer.contact.phone")}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
            <Sparkles size={14} /> {t("footer.sections.newsletter")}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("footer.newsletter.text")}</p>
          <form className="space-y-2" onSubmit={(event) => event.preventDefault()}>
            <input
              type="email"
              placeholder={t("footer.newsletter.placeholder")}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-sky-400"
            >
              {t("footer.newsletter.action")}
            </button>
          </form>
        </section>
      </div>

      <div className="relative border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-1.5">
          <Copyright size={13} />
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </span>
      </div>
    </footer>
  );
};

export default Footer;
