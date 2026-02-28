import { ArrowRight, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m } from "motion/react";
import Button from "../../atoms/Button";

/**
 * CTASection - Call-to-Action section to drive conversions
 * Mobile-first responsive design with gradient background
 */
const CTASection = ({ className = "" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/register");
  };

  const handleBrowseProperties = () => {
    navigate("/");
  };

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 py-16 sm:py-20 lg:py-24 ${className}`}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Main CTA */}
          <m.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center space-y-6"
          >
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                {t("landing.cta.title")}
              </h2>
              <p className="text-lg leading-relaxed text-blue-50 sm:text-xl">
                {t("landing.cta.subtitle")}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleGetStarted}
                rightIcon={ArrowRight}
                className="shadow-xl"
              >
                {t("landing.cta.getStarted")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleBrowseProperties}
                className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              >
                {t("landing.cta.browseProperties")}
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-blue-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium">
                  {t("landing.cta.noFees")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium">
                  {t("landing.cta.support24")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium">
                  {t("landing.cta.verified")}
                </span>
              </div>
            </div>
          </m.div>

          {/* Right Column - Contact Info */}
          <m.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center"
          >
            <div className="w-full space-y-6 rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md lg:p-10">
              <div>
                <h3 className="mb-4 text-2xl font-bold text-white">
                  {t("landing.cta.contactTitle")}
                </h3>
                <p className="text-blue-50">
                  {t("landing.cta.contactSubtitle")}
                </p>
              </div>

              <div className="space-y-4">
                {/* Phone */}
                <a
                  href="tel:+525512345678"
                  className="group flex items-center gap-4 rounded-xl border border-white/20 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-white/30">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">
                      {t("landing.cta.phone")}
                    </p>
                    <p className="font-semibold text-white">+52 55 1234 5678</p>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:contacto@inmobo.com"
                  className="group flex items-center gap-4 rounded-xl border border-white/20 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-white/30">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">
                      {t("landing.cta.email")}
                    </p>
                    <p className="font-semibold text-white">
                      contacto@inmobo.com
                    </p>
                  </div>
                </a>
              </div>

              {/* Availability */}
              <div className="rounded-xl border border-white/20 bg-white/5 p-4">
                <p className="text-center text-sm text-blue-100">
                  {t("landing.cta.availability")}
                </p>
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
