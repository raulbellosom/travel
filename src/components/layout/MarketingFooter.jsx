import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import BrandLogo from "../common/BrandLogo";

const MarketingFooter = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 pt-20 pb-10 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <BrandLogo className="h-10 w-auto" />
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {t(
                "footer.description",
                "La plataforma CRM inmobiliaria más completa para gestionar propiedades, clientes y ventas en un solo lugar.",
              )}
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-cyan-500 hover:text-white transition-all duration-300"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-cyan-500 hover:text-white transition-all duration-300"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-cyan-500 hover:text-white transition-all duration-300"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-cyan-500 hover:text-white transition-all duration-300"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">
              {t("footer.sections.product", "Producto")}
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#features"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("footer.links.features", "Características")}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("footer.links.pricing", "Precios")}
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("footer.links.integrations", "Integraciones")}
                </a>
              </li>
              <li>
                <a
                  href="#changelog"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("footer.links.changelog", "Novedades")}
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">
              {t("footer.sections.company", "Compañía")}
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/about"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("footer.links.about", "Nosotros")}
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("footer.links.blog", "Blog")}
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("footer.links.careers", "Carreras")}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("footer.sections.contact", "Contacto")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">
              {t("footer.sections.newsletter", "Suscríbete")}
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              {t(
                "footer.newsletterDesc",
                "Recibe las últimas noticias y consejos inmobiliarios directamente en tu bandeja.",
              )}
            </p>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder={t(
                  "footer.emailPlaceholder",
                  "Tu correo electrónico",
                )}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
              />
              <button
                type="submit"
                className="w-full px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {t("footer.subscribe", "Suscribirme")}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-500 text-center md:text-left">
            © {year} Inmobo.{" "}
            {t("footer.allRightsReserved", "Todos los derechos reservados.")}
          </p>
          <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-500">
            <Link
              to="/privacy"
              className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              {t("footer.privacy", "Privacidad")}
            </Link>
            <Link
              to="/terms"
              className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              {t("footer.terms", "Términos")}
            </Link>
            <Link
              to="/cookies"
              className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              {t("footer.cookies", "Cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
