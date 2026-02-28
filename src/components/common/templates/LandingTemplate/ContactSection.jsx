import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone, Send, MessageSquare } from "lucide-react";
import { m, useInView } from "framer-motion";
import { marketingService } from "../../../../services/marketingService";

const Reveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </m.div>
  );
};

const ContactSection = () => {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitMessage({ type: "", text: "" });

    const name = String(form.name || "").trim();
    const lastName = String(form.lastName || "").trim();
    const email = String(form.email || "").trim().toLowerCase();
    const phone = String(form.phone || "").trim();
    const message = String(form.message || "").trim();

    if (!name || !email || !message) {
      setSubmitMessage({
        type: "error",
        text: t(
          "landing:contact.form.errors.required",
          "Completa nombre, correo y mensaje para continuar.",
        ),
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await marketingService.submitContact({
        name,
        lastName,
        email,
        phone,
        message,
        locale: i18n.resolvedLanguage || i18n.language || "es",
        source: "crm_landing_contact",
      });
      setForm({ name: "", lastName: "", email: "", phone: "", message: "" });
      setSubmitMessage({
        type: "success",
        text: t(
          "landing:contact.form.success",
          "Gracias. Recibimos tu mensaje y te contactaremos pronto.",
        ),
      });
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text:
          error?.message ||
          t(
            "landing:contact.form.errors.generic",
            "No fue posible enviar tu mensaje. Intenta nuevamente.",
          ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contacto"
      className="relative py-20 sm:py-28 bg-slate-50 dark:bg-slate-950"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8 sm:p-12 md:p-16 shadow-2xl border border-slate-200 dark:border-transparent">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-600/5 dark:bg-blue-600/10 blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/[0.07] backdrop-blur-md border border-slate-200 dark:border-white/10 mb-6">
                  <MessageSquare
                    size={14}
                    className="text-cyan-600 dark:text-cyan-400"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-white/80">
                    {t("landing:contact.badge", "Hablemos de tu proyecto")}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                  {t("landing:contact.title", "Listo para transformar tu")}
                  <br />
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                    {t("landing:contact.highlight", "negocio inmobiliario?")}
                  </span>
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-lg leading-relaxed">
                  {t(
                    "landing:contact.subtitle",
                    "Déjanos tus datos y un experto te contactará en menos de 24 horas para mostrarte cómo Inmobo puede ayudarte a escalar.",
                  )}
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-cyan-600 dark:text-cyan-400">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">
                        {t("landing:contact.emailLabel", "Correo Electrónico")}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400">
                        {t("landing:contact.emailValue", "ventas@inmobo.com")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-cyan-600 dark:text-cyan-400">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">
                        {t("landing:contact.phoneLabel", "Teléfono")}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400">
                        {t("landing:contact.phoneValue", "+52 (55) 1234-5678")}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.2}>
              <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-lg dark:shadow-none">
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                        {t("landing:contact.form.name", "Nombre")}
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={handleChange("name")}
                        placeholder={t(
                          "landing:contact.form.namePlaceholder",
                          "Tu nombre",
                        )}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                        {t("landing:contact.form.lastName", "Apellido")}
                      </label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={handleChange("lastName")}
                        placeholder={t(
                          "landing:contact.form.lastNamePlaceholder",
                          "Tu apellido",
                        )}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      {t("landing:contact.form.email", "Correo Electrónico")}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange("email")}
                      placeholder={t(
                        "landing:contact.form.emailPlaceholder",
                        "nombre@empresa.com",
                      )}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      {t("landing:contact.form.phone", "Teléfono")}
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleChange("phone")}
                      placeholder={t(
                        "landing:contact.form.phonePlaceholder",
                        "+52 123 456 7890",
                      )}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      {t("landing:contact.form.message", "Mensaje")}
                    </label>
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={handleChange("message")}
                      placeholder={t(
                        "landing:contact.form.messagePlaceholder",
                        "Cuéntanos sobre tus necesidades...",
                      )}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium resize-none"
                    />
                  </div>

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

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                    {isSubmitting
                      ? t("landing:contact.form.submitting", "Enviando...")
                      : t("landing:contact.form.submit", "Enviar Mensaje")}
                  </button>

                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                    {t(
                      "landing:contact.disclaimer",
                      "Al enviar este formulario, aceptas nuestra Política de Privacidad.",
                    )}
                  </p>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

