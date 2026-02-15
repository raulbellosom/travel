import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Shield,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Lock,
  ChevronRight,
  ChevronLeft,
  Mail,
  MessageSquare,
} from "lucide-react";
import {
  motion,
  useInView,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import MarketingNavbar from "../../../layout/MarketingNavbar";
import MarketingFooter from "../../../layout/MarketingFooter";
import ContactSection from "./ContactSection";
import ApplicationShowcase from "./ApplicationShowcase";
import {
  CrmMockup,
  WebsiteMockup,
  ReservationsMockup,
  UsersMockup,
} from "./Mockups";
import { cn } from "../../../../utils/cn";

/* ─── Scroll-triggered wrapper ─── */
const Reveal = ({ children, delay = 0, className = "", direction = "up" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const origins = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { y: 0, x: -60 },
    right: { y: 0, x: 60 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...origins[direction] }}
      animate={
        isInView
          ? { opacity: 1, y: 0, x: 0 }
          : { opacity: 0, ...origins[direction] }
      }
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const ScaleIn = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Plus Grid Pattern ─── */

const PlusGrid = ({ className = "" }) => (
  <div
    className={`absolute inset-0 pointer-events-none ${className}`}
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    }}
  />
);

/* ─── Grid Pattern ─── */
const GridPattern = ({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  className,
  ...props
}) => {
  const id = React.useId();
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
};

/* ─── SVG Dividers ─── */
const WaveDividerBottom = ({ fill = "#f8fafc", className = "" }) => (
  <div
    className={`absolute bottom-0 left-0 w-full leading-[0] overflow-hidden ${className}`}
  >
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className="block w-full h-[60px] sm:h-[80px] md:h-[120px]"
    >
      <path
        d="M0,40 C360,120 720,0 1080,80 C1260,110 1380,60 1440,40 L1440,120 L0,120 Z"
        fill={fill}
      />
    </svg>
  </div>
);

const WaveDividerTop = ({ fill = "#f8fafc", className = "" }) => (
  <div
    className={`absolute top-0 left-0 w-full leading-[0] overflow-hidden ${className}`}
  >
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className="block w-full h-[60px] sm:h-[80px] md:h-[120px] rotate-180"
    >
      <path
        d="M0,40 C360,120 720,0 1080,80 C1260,110 1380,60 1440,40 L1440,120 L0,120 Z"
        fill={fill}
      />
    </svg>
  </div>
);

/* ─── Animated counter ─── */
const Counter = ({ value, suffix = "", label }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Parse numeric value. E.g. "99.9" -> 99.9, "500" -> 500
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
  const isFloat = value.includes(".");

  const springValue = useSpring(0, {
    mass: 1,
    stiffness: 75,
    damping: 15, // Softer ease out
  });

  const displayValue = useTransform(springValue, (current) => {
    if (isFloat) {
      return current.toFixed(1);
    }
    return Math.round(current);
  });

  React.useEffect(() => {
    if (isInView) {
      springValue.set(numericValue);
    }
  }, [isInView, numericValue, springValue]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex justify-center items-center">
        <motion.span>{displayValue}</motion.span>
        <span>{suffix}</span>
      </div>
      <span className="mt-2 block text-sm sm:text-base text-white/70 font-medium">
        {label}
      </span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
const LandingTemplate = () => {
  const { t } = useTranslation(); // Use translation hook

  const mockups = [
    { id: "crm", component: <CrmMockup />, title: "CRM Inmobiliario" },
    {
      id: "website",
      component: <WebsiteMockup />,
      title: "Sitio Web y Landing Pages",
    },
    {
      id: "reservations",
      component: <ReservationsMockup />,
      title: "Motor de Reservas",
    },
    { id: "users", component: <UsersMockup />, title: "Gestión de Equipo" },
  ];

  /* ─── Hero Carousel State ─── */
  const [activeMockup, setActiveMockup] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMockup((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    setActiveMockup((prev) => (prev + 1) % 4);
  };

  const handlePrev = () => {
    setActiveMockup((prev) => (prev - 1 + 4) % 4);
  };

  /* ─── Feature data ─── */
  const features = [
    {
      icon: Building2,
      title: t("landing:grid.feature1.title", "Gestión de Propiedades"),
      desc: t(
        "landing:grid.feature1.desc",
        "Registra, edita y organiza todas tus propiedades",
      ),
      color: "from-cyan-500 to-blue-600",
      bg: "bg-cyan-50 dark:bg-cyan-900/20",
    },
    {
      icon: Users,
      title: t("landing:grid.feature2.title", "CRM de Leads"),
      desc: t(
        "landing:grid.feature2.desc",
        "Captura leads automáticamente desde tu sitio público",
      ),
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
      icon: CalendarCheck,
      title: t("landing:grid.feature3.title", "Reservaciones"),
      desc: t(
        "landing:grid.feature3.desc",
        "Sistema completo de reservaciones con calendario",
      ),
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      icon: CreditCard,
      title: t("landing:grid.feature4.title", "Pagos Integrados"),
      desc: t(
        "landing:grid.feature4.desc",
        "Acepta pagos con Stripe y MercadoPago",
      ),
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      icon: BarChart3,
      title: t("landing:grid.feature5.title", "Analíticas en Tiempo Real"),
      desc: t(
        "landing:grid.feature5.desc",
        "Dashboard con métricas de visitas",
      ),
      color: "from-rose-500 to-pink-600",
      bg: "bg-rose-50 dark:bg-rose-900/20",
    },
    {
      icon: Shield,
      title: t("landing:grid.feature6.title", "Equipo & Permisos"),
      desc: t("landing:grid.feature6.desc", "Invita a tu equipo con roles"),
      color: "from-sky-500 to-indigo-600",
      bg: "bg-sky-50 dark:bg-sky-900/20",
    },
  ];

  /* ─── How it works steps ─── */
  const steps = [
    {
      num: "01",
      title: t("landing:howItWorks.step1.title", "Registra tu cuenta"),
      desc: t("landing:howItWorks.step1.desc", "Crea tu cuenta gratis"),
      icon: Sparkles,
    },
    {
      num: "02",
      title: t("landing:howItWorks.step2.title", "Agrega tus propiedades"),
      desc: t("landing:howItWorks.step2.desc", "Sube fotos y describe"),
      icon: Zap,
    },
    {
      num: "03",
      title: t("landing:howItWorks.step3.title", "Gestiona y crece"),
      desc: t("landing:howItWorks.step3.desc", "Recibe leads y reservaciones"),
      icon: Globe,
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <MarketingNavbar />

      {/* ──────────────────────────────────────────
          HERO
      ────────────────────────────────────────── */}
      <section className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 pt-32 pb-20">
        {/* Grid Pattern */}
        <GridPattern
          width={60}
          height={60}
          x={-1}
          y={-1}
          className={cn(
            "mask-[radial-gradient(ellipse_at_center,white,transparent)] opacity-[0.65] dark:opacity-[0.3] text-slate-300 dark:text-slate-500",
          )}
        />

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="marketing-orb absolute -top-40 -left-40 w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-cyan-500/20 blur-[60px] md:blur-[100px] opacity-30 md:opacity-50 dark:opacity-100" />
          <div className="marketing-orb marketing-orb-reverse absolute -bottom-40 -right-40 w-[350px] h-[350px] md:w-[600px] md:h-[600px] rounded-full bg-blue-600/15 blur-[60px] md:blur-[120px] opacity-30 md:opacity-50 dark:opacity-100" />
          <div className="marketing-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[400px] md:h-[400px] rounded-full bg-violet-500/10 blur-[60px] md:blur-[100px] opacity-30 md:opacity-50 dark:opacity-100" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
          {/* Badge */}
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/50 dark:bg-white/[0.07] backdrop-blur-md border border-slate-300/50 dark:border-white/10 mb-8 shadow-2xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400" />
              </span>
              <span className="text-sm font-medium text-slate-700 dark:text-white/90 tracking-wide">
                {t("landing:hero.badge", "Plataforma dual")}
              </span>
            </div>
          </Reveal>

          {/* Heading */}
          <Reveal delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight max-w-5xl mx-auto mb-8">
              Tu{" "}
              <span className="bg-linear-to-r from-cyan-500 via-blue-600 to-violet-600 dark:from-cyan-400 dark:via-blue-500 dark:to-violet-500 bg-clip-text text-transparent">
                CRM Inmobiliario
              </span>{" "}
              <br className="hidden sm:block" />y Sitio Web en uno
            </h1>
          </Reveal>

          {/* Connective Subtitle */}
          <Reveal delay={0.2}>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
              {t("landing:hero.subtitle", "Gestiona propiedades...")}
            </p>
          </Reveal>

          {/* CTA */}
          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 mb-20">
              <a
                href="#contacto"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("contacto")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-cyan-500 to-blue-600 text-white rounded-full font-bold text-base sm:text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300 active:scale-95"
              >
                {t("landing:hero.contact", "Comenzar Ahora")}
                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
            </div>
          </Reveal>

          {/* FLOATING MOCKUPS - CAROUSEL */}
          <div className="w-full max-w-5xl flex flex-col items-center gap-8">
            {/* Dynamic Title */}
            <div className="h-8 flex items-center justify-center overflow-hidden relative w-full">
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeMockup}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute text-lg sm:text-2xl font-bold bg-linear-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent"
                >
                  {mockups[activeMockup].title}
                </motion.span>
              </AnimatePresence>
            </div>

            <div className="relative w-full h-[250px] sm:h-[350px] md:h-[500px] perspective-[2000px] flex items-center justify-center touch-pan-y">
              {/* Navigation Buttons (Desktop: Side, Mobile: Bottom/Overlay maybe?) */}
              <button
                onClick={handlePrev}
                className="absolute left-0 md:-left-12 z-50 p-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all hidden md:flex"
              >
                <ArrowLeft size={24} />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-0 md:-right-12 z-50 p-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all hidden md:flex"
              >
                <ArrowRight size={24} />
              </button>

              <AnimatePresence mode="popLayout">
                {mockups.map((item, index) => {
                  // Calculate position relative to active
                  const offset = (index - activeMockup + 4) % 4;

                  // We show active (0) and next 2 (1, 2). 3 is hidden.
                  if (offset === 3) return null;

                  const zIndex = 30 - offset * 10;
                  const scale = 1 - offset * 0.05;
                  const y = offset * 40;
                  const opacity = 1 - offset * 0.2;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9, y: 100 }}
                      animate={{
                        opacity,
                        scale,
                        y,
                        zIndex,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 1.1,
                        y: -50,
                        zIndex: 40,
                      }}
                      transition={{
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="absolute top-0 w-[90%] md:w-[70%] max-w-[800px] aspect-video bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden will-change-transform"
                      style={{
                        boxShadow:
                          offset === 0
                            ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                            : "none",
                      }}
                    >
                      {/* Header bar specific to the frame */}
                      <div className="h-4 sm:h-6 w-full bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-1.5">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-400" />
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      {/* Content */}
                      <div className="w-full h-[calc(100%-16px)] sm:h-[calc(100%-24px)] overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
                        {/* Mobile: Scale content down to fit "as is" without scroll */}
                        <div className="absolute inset-0 origin-top-left md:static md:scale-100 transform scale-[0.55] w-[181%] h-[181%] md:w-full md:h-full">
                          {offset === 0 ? item.component : null}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Mobile Controls */}
            <div className="flex md:hidden gap-4 mt-4">
              <button
                onClick={handlePrev}
                className="p-3 rounded-full bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="p-3 rounded-full bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <WaveDividerBottom
          fill="currentColor"
          className="text-slate-50 dark:text-slate-950 z-30 translate-y-1"
        />
      </section>

      {/* ──────────────────────────────────────────
          ¿QUÉ ES INMOBO?
      ────────────────────────────────────────── */}
      <section
        id="que-es"
        className="relative py-20 sm:py-28 bg-linear-to-b from-blue-50 via-indigo-50/60 to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="hidden md:block absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-200/30 dark:bg-blue-900/10 blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="hidden md:block absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-200/30 dark:bg-indigo-900/10 blur-[100px] translate-x-1/4 translate-y-1/4 pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block text-sm font-bold text-cyan-600 dark:text-cyan-400 tracking-widest uppercase mb-4">
                {t("landing:features.sectionTitle", "¿Qué es Inmobo?")}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                {t(
                  "landing:features.sectionSubtitle",
                  "La plataforma que transforma...",
                )}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                {t(
                  "landing:features.description",
                  "Inmobo es un CRM inmobiliario completo...",
                )}
              </p>
            </div>
          </Reveal>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              {
                value: "100%",
                label: t("landing:stats.cloud", "Cloud Native"),
              },
              {
                value: "24/7",
                label: t("landing:stats.leads", "Soporte Dedicado"),
              },
              {
                value: "API",
                label: t("landing:stats.gateways", "Integración Total"),
              },
              {
                value: "∞",
                label: t("landing:stats.unlimited", "Escalabilidad"),
              },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 text-center border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <span className="block text-2xl sm:text-3xl font-black bg-linear-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {stat.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Diagonal clip bottom */}
        <div
          className="absolute bottom-0 left-0 w-full h-[60px] sm:h-[80px] bg-linear-to-r from-sky-100 to-blue-100 dark:from-slate-900 dark:to-slate-900"
          style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }}
        />
      </section>

      {/* ──────────────────────────────────────────
          FEATURES GRID
      ────────────────────────────────────────── */}
      <section
        id="caracteristicas"
        className="relative py-20 sm:py-28 bg-linear-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 overflow-hidden"
      >
        <PlusGrid className="opacity-[0.08] dark:opacity-[0.05]" />
        {/* Decorative background elements */}
        <div className="hidden md:block absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-sky-200/40 dark:bg-transparent blur-[100px] pointer-events-none" />
        <div className="hidden md:block absolute bottom-20 left-0 w-[350px] h-[350px] rounded-full bg-indigo-200/30 dark:bg-transparent blur-[100px] pointer-events-none" />
        {/* Diagonal clip top */}
        <div
          className="absolute top-0 left-0 w-full h-[60px] sm:h-[80px] bg-linear-to-r from-indigo-50/60 to-slate-50 dark:from-slate-950 dark:to-slate-950"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />

        <div className="container mx-auto px-4 sm:px-6 pt-10">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block text-sm font-bold text-cyan-600 dark:text-cyan-400 tracking-widest uppercase mb-4">
                {t("landing:grid.sectionTitle", "Características")}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                {t(
                  "landing:grid.sectionSubtitle",
                  "Todo lo que necesitas para",
                )}{" "}
                <span className="bg-linear-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  {t("landing:grid.subtitleHighlight", "vender más")}
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={i * 0.1} className="h-full">
                  <div className="group relative bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/50 hover:border-cyan-300 dark:hover:border-cyan-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
                    {/* Gradient glow on hover */}
                    <div
                      className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`}
                    />

                    <div
                      className={`relative z-10 w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-5`}
                    >
                      <Icon
                        size={28}
                        className={`bg-linear-to-r ${f.color} bg-clip-text`}
                        style={{ color: "var(--tw-gradient-from)" }}
                      />
                    </div>

                    <h3 className="relative z-10 text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3">
                      {f.title}
                    </h3>
                    <p className="relative z-10 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed grow">
                      {f.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          APPLICATION SHOWCASE
      ────────────────────────────────────────── */}
      <ApplicationShowcase />

      {/* ──────────────────────────────────────────
          DIAGONAL SPLIT — "TODO EN UN SOLO LUGAR"
      ────────────────────────────────────────── */}
      <section
        id="plataforma"
        className="relative py-20 sm:py-28 overflow-hidden -mt-px"
      >
        {/* Diagonal background - Light: soft blue gradient, Dark: dark slate */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
        <PlusGrid className="opacity-10" />

        <div
          className="absolute -top-px left-0 w-full h-[62px] sm:h-[102px] bg-white dark:bg-slate-950"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
        />

        {/* Decorative orbs */}
        <div className="hidden md:block absolute top-20 left-10 w-72 h-72 rounded-full bg-cyan-500/10 blur-[80px]" />
        <div className="hidden md:block absolute bottom-20 right-10 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px]" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text side */}
            <div>
              <Reveal direction="left">
                <span className="inline-block text-sm font-bold text-cyan-400 tracking-widest uppercase mb-4">
                  {t("landing:allInOne.eyebrow", "Todo en un solo lugar")}
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                  {t("landing:allInOne.title", "Deja de usar")}{" "}
                  <span className="line-through opacity-50">
                    {t(
                      "landing:allInOne.strikethrough",
                      "Excel, WhatsApp, notas",
                    )}
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
                  {t(
                    "landing:allInOne.description",
                    "Con Inmobo centralizas toda la información...",
                  )}
                </p>

                <ul className="space-y-4">
                  {[
                    {
                      icon: Lock,
                      text: t(
                        "landing:allInOne.list1",
                        "Datos seguros en la nube",
                      ),
                    },
                    {
                      icon: Globe,
                      text: t("landing:allInOne.list2", "Sitio público..."),
                    },
                    {
                      icon: Zap,
                      text: t("landing:allInOne.list3", "Automatiza cobros..."),
                    },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <Reveal key={item.text} delay={0.1 + i * 0.1}>
                        <li className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                            <Icon size={20} className="text-cyan-400" />
                          </div>
                          <span className="text-slate-200 font-medium">
                            {item.text}
                          </span>
                        </li>
                      </Reveal>
                    );
                  })}
                </ul>
              </Reveal>
            </div>

            {/* Mockup side */}
            <Reveal direction="right" delay={0.2}>
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/10">
                  {/* Fake browser chrome */}
                  <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 ml-3 bg-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 text-center">
                      app.inmobo.com/dashboard
                    </div>
                  </div>
                  {/* Dashboard mockup content */}
                  <div className="bg-slate-900 p-4 sm:p-6">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        {
                          l: t("landing:mockup.properties", "Propiedades"),
                          v: "24",
                          c: "text-cyan-400",
                        },
                        {
                          l: t("landing:mockup.leadsToday", "Leads hoy"),
                          v: "12",
                          c: "text-emerald-400",
                        },
                        {
                          l: t("landing:mockup.income", "Ingresos"),
                          v: "$48K",
                          c: "text-amber-400",
                        },
                      ].map((m) => (
                        <div
                          key={m.l}
                          className="bg-slate-800 rounded-xl p-3 text-center"
                        >
                          <span
                            className={`block text-xl sm:text-2xl font-black ${m.c}`}
                          >
                            {m.v}
                          </span>
                          <span className="text-slate-500 text-[10px] sm:text-xs">
                            {m.l}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Chart bars */}
                    <div className="bg-slate-800 rounded-xl p-4">
                      <div className="text-xs text-slate-500 mb-3">
                        {t("landing:mockup.weeklyVisits", "Visitas semanales")}
                      </div>
                      <div className="flex items-end gap-2 h-20">
                        {[40, 65, 50, 80, 70, 90, 60].map((h, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-md"
                            initial={{ height: 0 }}
                            whileInView={{ height: `${h}%` }}
                            viewport={{ once: true }}
                            transition={{
                              delay: 0.3 + i * 0.08,
                              duration: 0.5,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification card */}
                <motion.div
                  className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl border border-slate-200 dark:border-slate-700 max-w-[200px] sm:max-w-[240px]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CalendarCheck
                        size={16}
                        className="text-emerald-600 sm:w-5 sm:h-5"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {t(
                          "landing:mockup.newReservation",
                          "Nueva reservación",
                        )}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500">
                        {t("landing:mockup.timeAgo", "hace 2 minutos")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Wave bottom */}
        <WaveDividerBottom
          fill="currentColor"
          className="text-white dark:text-slate-950"
        />
      </section>

      {/* ──────────────────────────────────────────
          HOW IT WORKS
      ────────────────────────────────────────── */}
      <section
        id="como-funciona"
        className="relative py-20 sm:py-28 bg-white dark:bg-slate-950"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block text-sm font-bold text-cyan-600 dark:text-cyan-400 tracking-widest uppercase mb-4">
                {t("landing:howItWorks.sectionTitle", "Cómo funciona")}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                {t("landing:howItWorks.sectionSubtitle", "Empieza en")}{" "}
                <span className="bg-linear-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  {t("landing:howItWorks.subtitleHighlight", "3 simples pasos")}
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="relative max-w-4xl mx-auto">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-24 left-[16.66%] right-[16.66%] h-0.5 bg-linear-to-r from-cyan-500/30 via-blue-500/30 to-violet-500/30" />

            <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.num} delay={i * 0.15}>
                    <div className="relative text-center">
                      {/* Step number circle */}
                      <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 mb-6">
                        <span className="text-xl sm:text-2xl font-black text-white">
                          {step.num}
                        </span>
                        {/* Icon badge */}
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center">
                          <Icon
                            size={14}
                            className="text-cyan-600 dark:text-cyan-400"
                          />
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          METRICS / SOCIAL PROOF
      ────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Wavy top */}
        <WaveDividerTop
          fill="currentColor"
          className="text-slate-50 dark:text-slate-950"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-blue-600 to-violet-700" />
        <PlusGrid className="opacity-10 text-white" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center mb-4">
              {t("landing:socialProof.title", "Diseñado para escalar")}
            </h2>
            <p className="text-center text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-14">
              {t(
                "landing:socialProof.subtitle",
                "Herramientas pensadas para el profesional...",
              )}
            </p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <Counter
              value="99.9"
              suffix="%"
              label={t("landing:socialProof.stat1.label", "Uptime garantizado")}
            />
            <Counter
              value="500"
              suffix="+"
              label={t(
                "landing:socialProof.stat2.label",
                "Propiedades gestionadas",
              )}
            />
            <Counter
              value="3"
              suffix="s"
              label={t("landing.socialProof.stat3.label", "Tiempo de carga")}
            />
            <Counter
              value="10"
              suffix="x"
              label={t("landing.socialProof.stat4.label", "Más productividad")}
            />
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          CONTACT FORM
      ────────────────────────────────────────── */}
      <ContactSection />

      {/* ──────────────────────────────────────────
          FOOTER
      ────────────────────────────────────────── */}
      <MarketingFooter />
    </div>
  );
};

export default LandingTemplate;
