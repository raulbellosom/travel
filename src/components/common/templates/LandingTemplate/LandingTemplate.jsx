import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, ShieldCheck, Map } from "lucide-react";
import { useTranslation } from "react-i18next";
import PublicNavbar from "../../../layout/PublicNavbar";
import SearchBar from "../../molecules/SearchBar";
import PropertyCard from "../../molecules/PropertyCard";

const LandingTemplate = ({ featuredProperties = [] }) => {
  const { t } = useTranslation();

  const quickCategories = [
    {
      key: "beachfront",
      link: "/propiedades?tag=beachfront",
    },
    {
      key: "luxuryVillas",
      link: "/propiedades?type=villa",
    },
    {
      key: "apartments",
      link: "/propiedades?type=apartment",
    },
    {
      key: "newDevelopments",
      link: "/propiedades?status=new",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <PublicNavbar />

      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt={t("landing.hero.imageAlt")}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-slate-900/30" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white mt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium tracking-wide">
              {t("landing.hero.badge")}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight tracking-tight drop-shadow-lg max-w-5xl mx-auto">
            {t("landing.hero.title")}
          </h1>

          <p className="text-lg md:text-xl text-slate-200 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            {t("landing.hero.subtitle")}
          </p>

          <div className="animate-slide-up animation-delay-300">
            <SearchBar />
          </div>
        </div>
      </section>

      <section className="py-8 -mt-20 relative z-20 container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickCategories.map((category) => (
            <Link
              key={category.key}
              to={category.link}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center justify-center gap-3 text-center group border border-slate-100 dark:border-slate-700"
            >
              <span className="font-bold text-slate-800 dark:text-white">
                {t(`landing.quickCategories.${category.key}`)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-20 container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-cyan-600 font-bold tracking-wider uppercase text-sm mb-2 block">
              {t("landing.propertyShowcase.eyebrow")}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
              {t("landing.propertyShowcase.sectionTitle")}
            </h2>
          </div>
          <Link
            to="/propiedades"
            className="hidden md:flex items-center gap-2 text-slate-600 hover:text-cyan-600 font-bold transition-colors"
          >
            {t("landing.propertyShowcase.viewAll")} <ArrowRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProperties.length > 0
            ? featuredProperties
                .slice(0, 3)
                .map((prop) => (
                  <PropertyCard key={prop.$id || prop.id} property={prop} />
                ))
            : [1, 2, 3].map((value) => (
                <PropertyCard
                  key={value}
                  property={{
                    id: value,
                    title: t("listingCard.fallbackTitle"),
                    price: 450000 + value * 50000,
                    currency: "USD",
                    location: { address: "Conchas Chinas, Puerto Vallarta" },
                    bedrooms: 4,
                    bathrooms: 3,
                    totalArea: 350,
                    rating: 4.9,
                    propertyType: "villa",
                    operationType: "sale",
                    slug: "villa-example",
                    images: [
                      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
                    ],
                  }}
                />
              ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link
            to="/propiedades"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-bold"
          >
            {t("landing.propertyShowcase.viewAll")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="py-20 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">
                {t("landing.features.trust.title")}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t("landing.features.trust.description")}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Star size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">
                {t("landing.features.experience.title")}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t("landing.features.experience.description")}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mb-6">
                <Map size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">
                {t("landing.features.quality.title")}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t("landing.features.quality.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyan-600" />
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            {t("landing.cta.title")}
          </h2>
          <p className="text-xl text-cyan-100 mb-10 max-w-2xl mx-auto">
            {t("landing.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/propiedades"
              className="px-8 py-4 bg-white text-cyan-600 rounded-full font-bold text-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              {t("landing.cta.browseProperties")}
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-cyan-700 text-white rounded-full font-bold text-lg hover:shadow-xl hover:-translate-y-1 transition-all border border-cyan-500"
            >
              {t("landing.cta.contactButton")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingTemplate;
