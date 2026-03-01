import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import { Sparkles } from "lucide-react";

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

/* ── Quick Idea chips: each has a translated label + search params ── */
const QUICK_IDEAS_CONFIG = [
  {
    i18nKey: "client:homeNew.quickIdeas.items.mariachi",
    fallback: { es: "Mariachi para eventos", en: "Mariachi for events" },
    params: { resourceType: "music", category: "mariachi", q: "" },
  },
  {
    i18nKey: "client:homeNew.quickIdeas.items.djQuinceanera",
    fallback: { es: "DJ para quinceañera", en: "DJ for quinceañera" },
    params: { resourceType: "music", category: "dj", q: "" },
  },
  {
    i18nKey: "client:homeNew.quickIdeas.items.housePool",
    fallback: { es: "Casa con alberca", en: "House with pool" },
    params: {
      resourceType: "property",
      category: "house",
      q: "",
      amenities: "pool",
    },
  },
  {
    i18nKey: "client:homeNew.quickIdeas.items.carRental",
    fallback: { es: "Renta de auto por día", en: "Car rental for a day" },
    params: { resourceType: "vehicle", category: "car", q: "" },
  },
  {
    i18nKey: "client:homeNew.quickIdeas.items.chefPrivate",
    fallback: { es: "Chef privado a domicilio", en: "Private chef at home" },
    params: { resourceType: "service", category: "chef", q: "" },
  },
  {
    i18nKey: "client:homeNew.quickIdeas.items.tourAdventure",
    fallback: { es: "Tour de aventura", en: "Adventure tour" },
    params: { resourceType: "experience", category: "adventure", q: "" },
  },
  {
    i18nKey: "client:homeNew.quickIdeas.items.eventVenue",
    fallback: { es: "Salón para boda", en: "Wedding venue" },
    params: { resourceType: "venue", category: "event_hall", q: "" },
  },
  {
    i18nKey: "client:homeNew.quickIdeas.items.oceanView",
    fallback: { es: "Vista al mar", en: "Ocean view" },
    params: { resourceType: "property", q: "", amenities: "ocean-view" },
  },
  {
    i18nKey: "client:homeNew.quickIdeas.items.photographyService",
    fallback: { es: "Fotógrafo profesional", en: "Professional photographer" },
    params: { resourceType: "service", category: "photography", q: "" },
  },
  {
    i18nKey: "client:homeNew.quickIdeas.items.bandaParty",
    fallback: { es: "Banda para fiesta", en: "Live band for party" },
    params: { resourceType: "music", category: "banda", q: "" },
  },
];

const HomeQuickIdeas = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const langKey = i18n.language?.split("-")[0] || "es";

  const ideas = useMemo(
    () =>
      QUICK_IDEAS_CONFIG.map((idea) => ({
        ...idea,
        label: t(idea.i18nKey, idea.fallback[langKey] || idea.fallback.es),
      })),
    [t, langKey],
  );

  const handleClick = (idea) => {
    const params = new URLSearchParams();
    Object.entries(idea.params).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });
    params.set("page", "1");
    navigate(`/buscar?${params.toString()}`);
  };

  return (
    <section className="bg-white px-4 py-12 dark:bg-slate-950 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <m.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {t("client:homeNew.quickIdeas.title", "Ideas rápidas")}
            </h2>
          </div>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {t(
              "client:homeNew.quickIdeas.subtitle",
              "Un toque y estás buscando. ¿Qué necesitas?",
            )}
          </p>
        </m.div>

        <m.div
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-6 flex flex-wrap gap-2.5"
        >
          {ideas.map((idea, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleClick(idea)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-600 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-300"
            >
              {idea.label}
            </button>
          ))}
        </m.div>
      </div>
    </section>
  );
};

export default HomeQuickIdeas;
