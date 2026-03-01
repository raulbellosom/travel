import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import { ShieldCheck, CreditCard, Headphones } from "lucide-react";
import { useInstanceModulesContext } from "../../contexts/InstanceModulesContext";

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

const HomeTrustBar = () => {
  const { t } = useTranslation();
  const { isEnabled } = useInstanceModulesContext();

  const items = [
    {
      icon: ShieldCheck,
      label: t("client:homeNew.trust.verified", "Verificados"),
      description: t(
        "client:homeNew.trust.verifiedDesc",
        "Recursos revisados y validados.",
      ),
      always: true,
    },
    {
      icon: CreditCard,
      label: t("client:homeNew.trust.securePayments", "Pagos seguros"),
      description: t(
        "client:homeNew.trust.securePaymentsDesc",
        "Transacciones protegidas con Stripe.",
      ),
      always: false,
      moduleKey: "module.payments.online",
    },
    {
      icon: Headphones,
      label: t("client:homeNew.trust.support", "Soporte"),
      description: t(
        "client:homeNew.trust.supportDesc",
        "Atención disponible cuando la necesites.",
      ),
      always: true,
    },
  ];

  const visibleItems = items.filter(
    (item) => item.always || (item.moduleKey && isEnabled(item.moduleKey)),
  );

  if (visibleItems.length === 0) return null;

  return (
    <section className="border-y border-slate-100 bg-white px-4 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <m.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35 }}
          className={`grid gap-6 ${
            visibleItems.length === 3
              ? "sm:grid-cols-3"
              : visibleItems.length === 2
                ? "sm:grid-cols-2"
                : ""
          }`}
        >
          {visibleItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 text-center sm:flex-col sm:items-center"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 sm:h-12 sm:w-12">
                  <Icon size={20} />
                </div>
                <div className="sm:text-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </m.div>
      </div>
    </section>
  );
};

export default HomeTrustBar;
