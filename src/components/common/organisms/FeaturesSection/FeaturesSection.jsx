import { Shield, Zap, Heart, Award, TrendingUp, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { m } from "motion/react";

/**
 * FeatureCard - Individual feature card component
 */
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 lg:p-8"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-blue-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-cyan-950/20 dark:to-blue-950/20" />

      <div className="relative">
        {/* Icon */}
        <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 shadow-lg">
          <Icon className="h-6 w-6 text-white" />
        </div>

        {/* Content */}
        <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
    </m.div>
  );
};

/**
 * FeaturesSection - Showcase platform features and benefits
 * Mobile-first responsive grid layout
 */
const FeaturesSection = ({ className = "" }) => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Shield,
      title: t("landing.features.trust.title"),
      description: t("landing.features.trust.description"),
    },
    {
      icon: Zap,
      title: t("landing.features.fast.title"),
      description: t("landing.features.fast.description"),
    },
    {
      icon: Heart,
      title: t("landing.features.experience.title"),
      description: t("landing.features.experience.description"),
    },
    {
      icon: Award,
      title: t("landing.features.quality.title"),
      description: t("landing.features.quality.description"),
    },
    {
      icon: TrendingUp,
      title: t("landing.features.investment.title"),
      description: t("landing.features.investment.description"),
    },
    {
      icon: Users,
      title: t("landing.features.support.title"),
      description: t("landing.features.support.description"),
    },
  ];

  return (
    <section
      className={`bg-white py-16 dark:bg-slate-950 sm:py-20 lg:py-24 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center lg:mb-16"
        >
          <h2 className="mb-4 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            {t("landing.features.sectionTitle")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            {t("landing.features.sectionSubtitle")}
          </p>
        </m.div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
