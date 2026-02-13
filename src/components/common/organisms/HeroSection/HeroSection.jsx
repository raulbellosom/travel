import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Home as HomeIcon, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import Button from "../../atoms/Button";
import Select from "../../atoms/Select";

/**
 * HeroSection - Main landing page hero with search functionality
 * Mobile-first responsive design
 */
const HeroSection = ({ className = "" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useState({
    city: "",
    operation: "",
    propertyType: "",
  });

  const operationOptions = [
    { value: "", label: t("landing.hero.search.allOperations") },
    { value: "sale", label: t("homePage.enums.operation.sale") },
    { value: "rent", label: t("homePage.enums.operation.rent") },
    {
      value: "vacation_rental",
      label: t("homePage.enums.operation.vacation_rental"),
    },
  ];

  const propertyTypeOptions = [
    { value: "", label: t("landing.hero.search.allTypes") },
    { value: "house", label: t("homePage.enums.propertyType.house") },
    { value: "apartment", label: t("homePage.enums.propertyType.apartment") },
    { value: "land", label: t("homePage.enums.propertyType.land") },
    { value: "commercial", label: t("homePage.enums.propertyType.commercial") },
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchParams.city) params.set("city", searchParams.city);
    if (searchParams.operation) params.set("operation", searchParams.operation);
    if (searchParams.propertyType)
      params.set("type", searchParams.propertyType);
    navigate(`/?${params.toString()}`);
  };

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${className}`}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80"
          alt="Real estate hero"
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-cyan-600/20" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center space-y-6"
          >
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                {t("landing.hero.title")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg leading-relaxed text-slate-200 sm:text-xl"
              >
                {t("landing.hero.subtitle")}
              </motion.p>
            </div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-3 gap-4"
            >
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-2xl font-bold text-white">
                  <HomeIcon className="h-5 w-5 text-cyan-400" />
                  500+
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  {t("landing.hero.stats.properties")}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-2xl font-bold text-white">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  98%
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  {t("landing.hero.stats.satisfaction")}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-2xl font-bold text-white">
                  <MapPin className="h-5 w-5 text-amber-400" />
                  15+
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  {t("landing.hero.stats.cities")}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Search Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center"
          >
            <div className="w-full rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl lg:p-8">
              <h2 className="mb-6 text-2xl font-bold text-white">
                {t("landing.hero.search.title")}
              </h2>

              <div className="space-y-4">
                {/* City Input */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    {t("landing.hero.search.location")}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchParams.city}
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          city: e.target.value,
                        })
                      }
                      placeholder={t("landing.hero.search.locationPlaceholder")}
                      className="w-full rounded-lg border border-white/20 bg-white/90 py-3 pl-10 pr-4 text-slate-900 placeholder-slate-500 backdrop-blur-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    />
                  </div>
                </div>

                {/* Operation Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    {t("landing.hero.search.operationType")}
                  </label>
                  <Select
                    options={operationOptions}
                    value={searchParams.operation}
                    onChange={(value) =>
                      setSearchParams({ ...searchParams, operation: value })
                    }
                    placeholder={t("landing.hero.search.selectOperation")}
                    className="bg-white/90 backdrop-blur-sm"
                  />
                </div>

                {/* Property Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    {t("landing.hero.search.propertyType")}
                  </label>
                  <Select
                    options={propertyTypeOptions}
                    value={searchParams.propertyType}
                    onChange={(value) =>
                      setSearchParams({ ...searchParams, propertyType: value })
                    }
                    placeholder={t("landing.hero.search.selectType")}
                    className="bg-white/90 backdrop-blur-sm"
                  />
                </div>

                {/* Search Button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleSearch}
                  leftIcon={Search}
                >
                  {t("landing.hero.search.searchButton")}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="h-12 w-full fill-current text-white dark:text-slate-950"
          viewBox="0 0 1440 74"
          preserveAspectRatio="none"
        >
          <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,42.7C960,43,1056,53,1152,53.3C1248,53,1344,43,1392,37.3L1440,32L1440,74L1392,74C1344,74,1248,74,1152,74C1056,74,960,74,864,74C768,74,672,74,576,74C480,74,384,74,288,74C192,74,96,74,48,74L0,74Z" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
