import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Phone, MapPin, Sparkles } from "lucide-react";
import BrandLogo from "../../BrandLogo";
import { useAuth } from "../../../../hooks/useAuth";
import { isInternalRole } from "../../../../utils/roles";
import { INTERNAL_ROUTES } from "../../../../utils/internalRoutes";

const Footer = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const showInternalLinks = isInternalRole(user?.role);

  return (
    <footer className="relative overflow-hidden border-t border-slate-800 bg-slate-950 text-slate-200">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(56,189,248,0.14),transparent_35%)]"
      />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" mode="white" alt={t("footer.brand")} className="rounded-xl" />
            <div>
              <p className="text-base font-semibold text-white">{t("footer.brand")}</p>
              <p className="text-xs text-cyan-300">{t("footer.tagline")}</p>
            </div>
          </div>
          <p className="text-sm text-slate-300">{t("footer.description")}</p>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-300">{t("footer.sections.explore")}</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <Link className="hover:text-white" to="/">{t("footer.links.home")}</Link>
            </li>
            {showInternalLinks ? (
              <li>
                <Link className="hover:text-white" to={INTERNAL_ROUTES.dashboard}>{t("footer.links.dashboard")}</Link>
              </li>
            ) : null}
            {showInternalLinks ? (
              <li>
                <Link className="hover:text-white" to={INTERNAL_ROUTES.myProperties}>{t("footer.links.properties")}</Link>
              </li>
            ) : null}
            <li>
              <Link className="hover:text-white" to="/perfil">{t("footer.links.profile")}</Link>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-300">{t("footer.sections.legal")}</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="inline-flex items-center gap-2"><MapPin size={14} className="text-cyan-300" /> {t("footer.contact.city")}</li>
            <li className="inline-flex items-center gap-2"><Mail size={14} className="text-cyan-300" /> {t("footer.contact.email")}</li>
            <li className="inline-flex items-center gap-2"><Phone size={14} className="text-cyan-300" /> {t("footer.contact.phone")}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
            <Sparkles size={14} /> {t("footer.sections.newsletter")}
          </h3>
          <p className="text-sm text-slate-300">{t("footer.newsletter.text")}</p>
          <form className="space-y-2" onSubmit={(event) => event.preventDefault()}>
            <input
              type="email"
              placeholder={t("footer.newsletter.placeholder")}
              className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
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

      <div className="relative border-t border-slate-800/80 px-4 py-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
};

export default Footer;
