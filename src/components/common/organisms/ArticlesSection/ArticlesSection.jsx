import React from "react";
import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import Button from "../../atoms/Button";
import LazyImage from "../../atoms/LazyImage";

const ArticlesSection = () => {
  const { t } = useTranslation();

  const articles = [
    {
      id: 1,
      title: t("client:articles.1.title", "Guía para comprar tu primera casa"),
      excerpt: t(
        "client:articles.1.excerpt",
        "Descubre los pasos esenciales y consejos financieros para hacer tu sueño realidad sin estrés.",
      ),
      image:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "Oct 15, 2023",
      category: t("client:articles.categories.buying", "Comprar"),
    },
    {
      id: 2,
      title: t("client:articles.2.title", "Invertir en bienes raíces en 2024"),
      excerpt: t(
        "client:articles.2.excerpt",
        "Análisis de mercado y las mejores zonas para obtener plusvalía en el próximo año.",
      ),
      image:
        "https://images.unsplash.com/photo-1554469384-e58fac16e23a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "Nov 02, 2023",
      category: t("client:articles.categories.investment", "Inversión"),
    },
    {
      id: 3,
      title: t(
        "client:articles.3.title",
        "Tips para vender tu propiedad más rápido",
      ),
      excerpt: t(
        "client:articles.3.excerpt",
        "Pequeñas mejoras y estrategias de staging que aumentan el valor y atractivo de tu hogar.",
      ),
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "Nov 20, 2023",
      category: t("client:articles.categories.selling", "Vender"),
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-2 block">
              {t("client:articles.badge", "Blog Inmobo")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {t("client:articles.title", "Noticias y Consejos Inmobiliarios")}
            </h2>
          </div>
          <Button variant="outline" rightIcon={ArrowRight}>
            {t("client:articles.viewAll", "Ver todos los artículos")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <m.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group flex flex-col h-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <LazyImage
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  {article.category}
                </div>
              </div>

              <div className="p-6 flex flex-col grow">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  <Calendar size={14} />
                  <span>{article.date}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {article.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 grow">
                  {article.excerpt}
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:gap-3 transition-all"
                >
                  {t("client:articles.readMore", "Leer artículo")}{" "}
                  <ArrowRight size={16} />
                </button>
              </div>
            </m.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArticlesSection;
