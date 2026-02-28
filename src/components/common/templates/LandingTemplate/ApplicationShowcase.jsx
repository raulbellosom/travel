import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { m, AnimatePresence, useInView } from "framer-motion";
import { LayoutDashboard, Home, Globe, Lock } from "lucide-react";
import { ListingsMockup, CrmMockup, WebsiteMockup } from "./Mockups";

/* ─── Plus Grid Pattern ─── */
const PlusGrid = ({ className = "" }) => (
  <div
    className={`absolute inset-0 pointer-events-none ${className}`}
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    }}
  />
);

/* ─── Animation Helper ─── */
const Reveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
};

const ApplicationShowcase = () => {
  const { t } = useTranslation();

  const tabs = [
    {
      id: "listings",
      label: t("landing:showcase.tabs.listings", "Gestión de Propiedades"),
      icon: Home,
      color: "cyan",
      component: <ListingsMockup />,
    },
    {
      id: "crm",
      label: t("landing:showcase.tabs.crm", "CRM y Leads"),
      icon: LayoutDashboard,
      color: "blue",
      component: <CrmMockup />,
    },
    {
      id: "website",
      label: t("landing:showcase.tabs.site", "Sitio Web Público"),
      icon: Globe,
      color: "violet",
      component: <WebsiteMockup />,
    },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  /* Auto-play tabs */
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((current) => {
        const currentIndex = tabs.findIndex((t) => t.id === current);
        const nextIndex = (currentIndex + 1) % tabs.length;
        return tabs[nextIndex].id;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="plataforma"
      className="py-24 bg-linear-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden"
    >
      {/* Background Decor */}
      <PlusGrid className="opacity-[0.3] dark:opacity-[0.3]" />
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
      <div className="hidden md:block absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="hidden md:block absolute top-40 -left-20 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
              {t("landing:showcase.title", "Poder para cada")}{" "}
              <span className="bg-linear-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                {t("landing:showcase.titleHighlight", "flujo de trabajo")}
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t(
                "landing:showcase.subtitle",
                "Desde la captación de propiedades hasta el cierre de tratos, Inmobo te da las herramientas para gestionar cada paso de tu operación con precisión.",
              )}
            </p>
          </Reveal>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab, i) => (
            <Reveal key={tab.id} delay={0.2 + i * 0.1}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 relative overflow-hidden ${
                  activeTab === tab.id
                    ? "text-white dark:text-slate-900 shadow-lg scale-105"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {activeTab === tab.id && (
                  <m.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-slate-900 dark:bg-white"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon size={18} />
                  {tab.label}
                </span>

                {/* Progress bar for auto-play indicator (optional) */}
                {activeTab === tab.id && (
                  <m.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-0.5 bg-cyan-500 z-20"
                  />
                )}
              </button>
            </Reveal>
          ))}
        </div>

        {/* Browser Mockup Window */}
        <Reveal delay={0.4}>
          <div className="relative max-w-6xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50">
              {/* Browser Header */}
              <div className="h-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="flex-1 max-w-lg mx-4">
                  <div className="h-6 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 gap-2 shadow-xs">
                    <Lock
                      size={10}
                      className={
                        activeTab === "website"
                          ? "text-emerald-500"
                          : "text-slate-400"
                      }
                    />
                    {activeTab === "website"
                      ? "inmobo.com/demo-real-estate"
                      : "app.inmobo.com/dashboard"}
                  </div>
                </div>
                <div className="w-12" /> {/* Spacer */}
              </div>

              {/* Window Content */}
              <div className="h-[280px] sm:h-[350px] md:h-[500px] relative bg-slate-100 dark:bg-slate-900 overflow-hidden pt-0">
                <div className="h-full relative">
                  {/* Mobile Scaling Wrapper */}
                  <div className="absolute inset-0 origin-top-left md:static md:scale-100 transform scale-[0.55] w-[181%] h-[181%] md:w-full md:h-full">
                    <AnimatePresence mode="wait">
                      <m.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="h-full will-change-transform"
                      >
                        {activeTab === "listings" && (
                          <ListingsMockup hideUI={true} />
                        )}
                        {activeTab === "crm" && <CrmMockup />}
                        {activeTab === "website" && (
                          <WebsiteMockup hideUI={true} />
                        )}
                      </m.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ApplicationShowcase;
