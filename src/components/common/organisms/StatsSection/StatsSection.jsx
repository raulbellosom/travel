import { Building2, Users, MapPinned, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { m } from "motion/react";
import { useState, useEffect, useRef } from "react";

/**
 * CountUpAnimation - Animated counter component
 */
const CountUpAnimation = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime;
          const startCount = 0;

          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
            setCount(
              Math.floor(startCount + (end - startCount) * easeOutQuart),
            );

            if (percentage < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 },
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => {
      if (countRef.current) {
        observer.unobserve(countRef.current);
      }
    };
  }, [end, duration, hasAnimated]);

  return (
    <span ref={countRef}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

/**
 * StatCard - Individual stat display component
 */
const StatCard = ({ icon: Icon, value, suffix = "", label, delay = 0 }) => {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition hover:bg-white/20 lg:p-8"
    >
      <div className="flex flex-col items-center space-y-3 text-center">
        {/* Icon */}
        <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
          <Icon className="h-8 w-8 text-white" />
        </div>

        {/* Value */}
        <div className="text-4xl font-extrabold text-white lg:text-5xl">
          <CountUpAnimation end={value} suffix={suffix} />
        </div>

        {/* Label */}
        <p className="text-sm font-medium text-slate-200 lg:text-base">
          {label}
        </p>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
    </m.div>
  );
};

/**
 * StatsSection - Display impressive platform statistics
 * Mobile-first responsive design with animated counters
 */
const StatsSection = ({ className = "" }) => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Building2,
      value: 500,
      suffix: "+",
      label: t("landing.stats.properties"),
    },
    {
      icon: Users,
      value: 1200,
      suffix: "+",
      label: t("landing.stats.clients"),
    },
    {
      icon: MapPinned,
      value: 15,
      suffix: "+",
      label: t("landing.stats.cities"),
    },
    {
      icon: Star,
      value: 98,
      suffix: "%",
      label: t("landing.stats.satisfaction"),
    },
  ];

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16 sm:py-20 lg:py-24 ${className}`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center lg:mb-16"
        >
          <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            {t("landing.stats.sectionTitle")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-200">
            {t("landing.stats.sectionSubtitle")}
          </p>
        </m.div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
