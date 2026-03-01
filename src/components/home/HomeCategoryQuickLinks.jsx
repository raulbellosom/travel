import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import {
  Home,
  Building2,
  Palmtree,
  Car,
  Wrench,
  Music,
  Compass,
  CalendarHeart,
  Store,
  Warehouse,
  Bike,
  Ship,
  Camera,
  Ticket,
  GraduationCap,
  Dumbbell,
  TreePine,
  Users,
  UtensilsCrossed,
  ArrowRight,
} from "lucide-react";
import { useInstanceModulesContext } from "../../contexts/InstanceModulesContext";

/* ── Category definitions per resource type ── */
const CATEGORY_ICONS = {
  house: Home,
  apartment: Building2,
  land: TreePine,
  commercial: Store,
  office: Building2,
  warehouse: Warehouse,
  car: Car,
  suv: Car,
  pickup: Car,
  van: Car,
  motorcycle: Bike,
  boat: Ship,
  cleaning: Wrench,
  chef: UtensilsCrossed,
  photography: Camera,
  catering: UtensilsCrossed,
  maintenance: Wrench,
  dj: Music,
  tour: Compass,
  class: GraduationCap,
  workshop: GraduationCap,
  adventure: Compass,
  wellness: Dumbbell,
  gastronomy: UtensilsCrossed,
  event_hall: CalendarHeart,
  commercial_local: Store,
  studio: Camera,
  coworking: Building2,
  meeting_room: Users,
};

/* ── Vertical blocks with premium palette ── */
const VERTICAL_BLOCKS = [
  {
    key: "property",
    moduleKey: "module.resources",
    icon: Home,
    gradient: "from-sky-500 to-blue-600",
    lightBg: "bg-sky-50 dark:bg-sky-950/30",
    accent: "text-sky-600 dark:text-sky-400",
    ring: "ring-sky-200 dark:ring-sky-800",
    categories: ["house", "apartment", "land", "commercial"],
  },
  {
    key: "vacation",
    moduleKey: "module.booking.short_term",
    icon: Palmtree,
    gradient: "from-amber-500 to-orange-600",
    lightBg: "bg-amber-50 dark:bg-amber-950/30",
    accent: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-200 dark:ring-amber-800",
    categories: ["house", "apartment"],
    buildLink: (cat) =>
      `/buscar?resourceType=property&category=${cat}&commercialMode=short_term_rental`,
  },
  {
    key: "vehicle",
    moduleKey: "module.resources",
    icon: Car,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/30",
    accent: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-200 dark:ring-emerald-800",
    categories: ["car", "suv", "motorcycle", "boat"],
  },
  {
    key: "service",
    moduleKey: "module.resources",
    icon: Wrench,
    gradient: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50 dark:bg-violet-950/30",
    accent: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-200 dark:ring-violet-800",
    categories: ["cleaning", "chef", "photography", "catering"],
  },
  {
    key: "experience",
    moduleKey: "module.resources",
    icon: Compass,
    gradient: "from-rose-500 to-pink-600",
    lightBg: "bg-rose-50 dark:bg-rose-950/30",
    accent: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-200 dark:ring-rose-800",
    categories: ["tour", "adventure", "wellness", "gastronomy"],
  },
  {
    key: "music",
    moduleKey: "module.resources",
    icon: Music,
    gradient: "from-fuchsia-500 to-purple-600",
    lightBg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    accent: "text-fuchsia-600 dark:text-fuchsia-400",
    ring: "ring-fuchsia-200 dark:ring-fuchsia-800",
    categories: ["dj", "mariachi", "banda", "cumbia"],
  },
  {
    key: "venue",
    moduleKey: "module.resources",
    icon: CalendarHeart,
    gradient: "from-teal-500 to-cyan-600",
    lightBg: "bg-teal-50 dark:bg-teal-950/30",
    accent: "text-teal-600 dark:text-teal-400",
    ring: "ring-teal-200 dark:ring-teal-800",
    categories: ["event_hall", "coworking", "studio", "meeting_room"],
  },
];

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

const HomeCategoryQuickLinks = () => {
  const { t } = useTranslation();
  const { isEnabled } = useInstanceModulesContext();

  const visibleBlocks = useMemo(
    () => VERTICAL_BLOCKS.filter((b) => isEnabled(b.moduleKey)),
    [isEnabled],
  );

  if (visibleBlocks.length === 0) return null;

  return (
    <section className="bg-white px-4 py-14 dark:bg-slate-950 sm:px-6 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <m.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            {t("client:homeNew.categories.title", "Explora por categoría")}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-slate-500 dark:text-slate-400">
            {t(
              "client:homeNew.categories.subtitle",
              "Encuentra exactamente lo que necesitas.",
            )}
          </p>
        </m.div>

        {/* Horizontally scrollable on mobile, grid on desktop */}
        <div className="mt-10 flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
          {visibleBlocks.map((block, blockIdx) => {
            const BlockIcon = block.icon;
            const resourceTypeForLink =
              block.key === "vacation" ? "property" : block.key;
            const viewAllHref =
              block.key === "vacation"
                ? "/buscar?resourceType=property&commercialMode=short_term_rental"
                : `/buscar?resourceType=${block.key}`;

            return (
              <m.div
                key={block.key}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: blockIdx * 0.05, duration: 0.35 }}
                className="group relative w-64 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white ring-1 ring-transparent transition-all duration-300 hover:ring-2 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:w-auto"
              >
                {/* Gradient accent bar top */}
                <div
                  className={`h-1 w-full bg-linear-to-r ${block.gradient}`}
                />

                <div className="p-5">
                  {/* Icon + title row */}
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${block.gradient} text-white shadow-md`}
                    >
                      <BlockIcon size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {block.key === "vacation"
                          ? t("client:homeNew.verticals.vacation", "Vacacional")
                          : t(
                              `client:common.enums.resourceType.${block.key}`,
                              block.key,
                            )}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {t(
                          `client:homeNew.categories.${block.key}Count`,
                          `${block.categories.length} categorías`,
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Category items */}
                  <div className="space-y-1">
                    {block.categories.map((cat) => {
                      const CatIcon = CATEGORY_ICONS[cat] || Ticket;
                      const href = block.buildLink
                        ? block.buildLink(cat)
                        : `/buscar?resourceType=${resourceTypeForLink}&category=${cat}`;

                      return (
                        <Link
                          key={cat}
                          to={href}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 transition-all duration-200 hover:${block.lightBg} dark:text-slate-300 dark:hover:bg-slate-800`}
                        >
                          <CatIcon
                            size={15}
                            className={`shrink-0 ${block.accent}`}
                          />
                          <span className="truncate font-medium">
                            {t(`client:common.enums.category.${cat}`, cat)}
                          </span>
                          <ArrowRight
                            size={13}
                            className="ml-auto shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100 dark:text-slate-600"
                          />
                        </Link>
                      );
                    })}
                  </div>

                  {/* View All link */}
                  <Link
                    to={viewAllHref}
                    className={`mt-3 flex items-center gap-1.5 rounded-xl ${block.lightBg} px-3 py-2 text-xs font-bold ${block.accent} transition-all duration-200 hover:opacity-80`}
                  >
                    {t("client:homeNew.categories.viewAll", "Ver todo")}
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeCategoryQuickLinks;
