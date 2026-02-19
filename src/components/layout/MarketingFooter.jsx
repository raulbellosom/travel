import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import BrandLogo from "../common/BrandLogo";
import { marketingService } from "../../services/marketingService";

const MarketingFooter = () => {
  const { t, i18n } = useTranslation();
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });

  const onSubmitNewsletter = async (event) => {
    event.preventDefault();
    setSubmitMessage({ type: "", text: "" });

    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      setSubmitMessage({
        type: "error",
        text: t(
          "landing:footer.newsletter.messages.required",
          "Ingresa tu correo para suscribirte.",
        ),
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await marketingService.subscribeNewsletter({
        email: normalizedEmail,
        locale: i18n.resolvedLanguage || i18n.language || "es",
        source: "crm_landing_footer",
      });
      setEmail("");
      setSubmitMessage({
        type: "success",
        text: t(
          "landing:footer.newsletter.messages.success",
          "Gracias. Te suscribimos correctamente.",
        ),
      });
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text:
          error?.message ||
          t(
            "landing:footer.newsletter.messages.error",
            "No fue posible suscribirte. Intenta nuevamente.",
          ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 pt-20 pb-10 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <BrandLogo className="h-10 w-auto" />
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {t(
                "landing:footer.description",
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

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">
              {t("landing:footer.sections.product", "Producto")}
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#features"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("landing:footer.links.features", "Características")}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("landing:footer.links.pricing", "Precios")}
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("landing:footer.links.integrations", "Integraciones")}
                </a>
              </li>
              <li>
                <a
                  href="#changelog"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("landing:footer.links.changelog", "Novedades")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">
              {t("landing:footer.sections.company", "Compañía")}
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/about"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("landing:footer.links.about", "Nosotros")}
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("landing:footer.links.blog", "Blog")}
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("landing:footer.links.careers", "Carreras")}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors"
                >
                  {t("landing:footer.sections.contact", "Contacto")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">
              {t("landing:footer.sections.newsletter", "Suscríbete")}
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              {t(
                "landing:footer.newsletter.description",
                "Recibe las últimas noticias y consejos inmobiliarios directamente en tu bandeja.",
              )}
            </p>
            <form className="flex flex-col gap-3" onSubmit={onSubmitNewsletter}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t(
                  "landing:footer.newsletter.placeholder",
                  "Tu correo electrónico",
                )}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? t("landing:footer.newsletter.submitting", "Enviando...")
                  : t("landing:footer.newsletter.action", "Suscribirme")}
                <ArrowRight size={16} />
              </button>
              {submitMessage.text ? (
                <p
                  className={
                    submitMessage.type === "success"
                      ? "text-sm text-emerald-600 dark:text-emerald-400"
                      : "text-sm text-rose-600 dark:text-rose-400"
                  }
                >
                  {submitMessage.text}
                </p>
              ) : null}
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-500 text-center md:text-left">
            {t("landing:footer.rights", "© {{year}} Inmobo. Todos los derechos reservados.", {
              year,
            })}
          </p>
          <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-500">
            <Link
              to="/privacy"
              className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              {t("landing:footer.privacy", "Privacidad")}
            </Link>
            <Link
              to="/terms"
              className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              {t("landing:footer.terms", "Términos")}
            </Link>
            <Link
              to="/cookies"
              className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              {t("landing:footer.cookies", "Cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;

