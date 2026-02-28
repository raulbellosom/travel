import { Search, FileCheck, Key, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { m } from "motion/react";

/**
 * StepCard - Individual step in the process
 */
const StepCard = ({
  number,
  icon: Icon,
  title,
  description,
  isLast = false,
  delay = 0,
}) => {
  return (
    <m.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      {/* Connector Line - Hidden on mobile, shown on lg */}
      {!isLast && (
        <div className="absolute left-1/2 top-24 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-cyan-200 to-transparent lg:block" />
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Step Number Badge */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-bold text-white shadow-lg">
          {number}
        </div>

        {/* Icon */}
        <div className="mb-4 inline-flex rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Icon className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
        </div>

        {/* Content */}
        <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="max-w-xs text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
    </m.div>
  );
};

/**
 * HowItWorksSection - Step-by-step process explanation
 * Mobile-first responsive vertical layout
 */
const HowItWorksSection = ({ className = "" }) => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Search,
      title: t("landing.howItWorks.step1.title"),
      description: t("landing.howItWorks.step1.description"),
    },
    {
      icon: FileCheck,
      title: t("landing.howItWorks.step2.title"),
      description: t("landing.howItWorks.step2.description"),
    },
    {
      icon: Key,
      title: t("landing.howItWorks.step3.title"),
      description: t("landing.howItWorks.step3.description"),
    },
    {
      icon: CheckCircle2,
      title: t("landing.howItWorks.step4.title"),
      description: t("landing.howItWorks.step4.description"),
    },
  ];

  return (
    <section
      className={`bg-slate-50 py-16 dark:bg-slate-900 sm:py-20 lg:py-24 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center lg:mb-20"
        >
          <h2 className="mb-4 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            {t("landing.howItWorks.sectionTitle")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            {t("landing.howItWorks.sectionSubtitle")}
          </p>
        </m.div>

        {/* Steps Grid - Vertical on mobile, 4 columns on desktop */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              number={index + 1}
              icon={step.icon}
              title={step.title}
              description={step.description}
              isLast={index === steps.length - 1}
              delay={index * 0.15}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center lg:mt-16"
        >
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            {t("landing.howItWorks.bottomText")}
          </p>
        </m.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
