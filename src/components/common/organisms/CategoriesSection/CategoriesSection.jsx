import { useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  Building,
  MapPin,
  Briefcase,
  Building2,
  Warehouse,
  Car,
  Truck,
  Bike,
  Ship,
  Sparkles,
  Music,
  ChefHat,
  Camera,
  UtensilsCrossed,
  Wrench,
  Compass,
  GraduationCap,
  Mountain,
  Heart,
  Grape,
  PartyPopper,
  Store,
  Clapperboard,
  Laptop,
  DoorOpen,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Stock images per category (Unsplash – replace with own assets)
   ═══════════════════════════════════════════════════════════════ */
const IMG = {
  house:
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=400&fit=crop&auto=format&q=75",
  apartment:
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=400&fit=crop&auto=format&q=75",
  land: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=400&fit=crop&auto=format&q=75",
  commercial:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop&auto=format&q=75",
  office:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop&auto=format&q=75",
  warehouse:
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=400&fit=crop&auto=format&q=75",
  car: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop&auto=format&q=75",
  suv: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=400&fit=crop&auto=format&q=75",
  pickup:
    "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400&h=400&fit=crop&auto=format&q=75",
  van: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=400&fit=crop&auto=format&q=75",
  motorcycle:
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=400&fit=crop&auto=format&q=75",
  boat: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&auto=format&q=75",
  cleaning:
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=400&fit=crop&auto=format&q=75",
  dj: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=400&fit=crop&auto=format&q=75",
  chef: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop&auto=format&q=75",
  photography:
    "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=400&fit=crop&auto=format&q=75",
  catering:
    "https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=400&fit=crop&auto=format&q=75",
  maintenance:
    "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=400&fit=crop&auto=format&q=75",
  tour: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=400&fit=crop&auto=format&q=75",
  class:
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=400&fit=crop&auto=format&q=75",
  workshop:
    "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&h=400&fit=crop&auto=format&q=75",
  adventure:
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop&auto=format&q=75",
  wellness:
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop&auto=format&q=75",
  gastronomy:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop&auto=format&q=75",
  event_hall:
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=400&fit=crop&auto=format&q=75",
  commercial_local:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&auto=format&q=75",
  studio:
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=400&fit=crop&auto=format&q=75",
  coworking:
    "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=400&h=400&fit=crop&auto=format&q=75",
  meeting_room:
    "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=400&h=400&fit=crop&auto=format&q=75",
};

/* ═══════════════════════════════════════════
   Category data grouped by resourceType
   ═══════════════════════════════════════════ */
const useCategoryRows = (t) => [
  {
    resourceType: "property",
    label: t("client:common.enums.resourceType.property", "Inmuebles"),
    items: [
      {
        id: "house",
        label: t("client:common.enums.category.house", "Casa"),
        icon: Home,
        image: IMG.house,
        link: "/buscar?resourceType=property&category=house",
      },
      {
        id: "apartment",
        label: t("client:common.enums.category.apartment", "Departamento"),
        icon: Building,
        image: IMG.apartment,
        link: "/buscar?resourceType=property&category=apartment",
      },
      {
        id: "land",
        label: t("client:common.enums.category.land", "Terreno"),
        icon: MapPin,
        image: IMG.land,
        link: "/buscar?resourceType=property&category=land",
      },
      {
        id: "commercial",
        label: t("client:common.enums.category.commercial", "Comercial"),
        icon: Briefcase,
        image: IMG.commercial,
        link: "/buscar?resourceType=property&category=commercial",
      },
      {
        id: "office",
        label: t("client:common.enums.category.office", "Oficina"),
        icon: Building2,
        image: IMG.office,
        link: "/buscar?resourceType=property&category=office",
      },
      {
        id: "warehouse",
        label: t("client:common.enums.category.warehouse", "Bodega"),
        icon: Warehouse,
        image: IMG.warehouse,
        link: "/buscar?resourceType=property&category=warehouse",
      },
    ],
  },
  {
    resourceType: "vehicle",
    label: t("client:common.enums.resourceType.vehicle", "Vehículos"),
    items: [
      {
        id: "car",
        label: t("client:common.enums.category.car", "Auto"),
        icon: Car,
        image: IMG.car,
        link: "/buscar?resourceType=vehicle&category=car",
      },
      {
        id: "suv",
        label: t("client:common.enums.category.suv", "SUV"),
        icon: Car,
        image: IMG.suv,
        link: "/buscar?resourceType=vehicle&category=suv",
      },
      {
        id: "pickup",
        label: t("client:common.enums.category.pickup", "Pickup"),
        icon: Truck,
        image: IMG.pickup,
        link: "/buscar?resourceType=vehicle&category=pickup",
      },
      {
        id: "van",
        label: t("client:common.enums.category.van", "Van"),
        icon: Truck,
        image: IMG.van,
        link: "/buscar?resourceType=vehicle&category=van",
      },
      {
        id: "motorcycle",
        label: t("client:common.enums.category.motorcycle", "Motocicleta"),
        icon: Bike,
        image: IMG.motorcycle,
        link: "/buscar?resourceType=vehicle&category=motorcycle",
      },
      {
        id: "boat",
        label: t("client:common.enums.category.boat", "Lancha"),
        icon: Ship,
        image: IMG.boat,
        link: "/buscar?resourceType=vehicle&category=boat",
      },
    ],
  },
  {
    resourceType: "service",
    label: t("client:common.enums.resourceType.service", "Servicios"),
    items: [
      {
        id: "cleaning",
        label: t("client:common.enums.category.cleaning", "Limpieza"),
        icon: Sparkles,
        image: IMG.cleaning,
        link: "/buscar?resourceType=service&category=cleaning",
      },
      {
        id: "dj",
        label: t("client:common.enums.category.dj", "DJ"),
        icon: Music,
        image: IMG.dj,
        link: "/buscar?resourceType=service&category=dj",
      },
      {
        id: "chef",
        label: t("client:common.enums.category.chef", "Chef"),
        icon: ChefHat,
        image: IMG.chef,
        link: "/buscar?resourceType=service&category=chef",
      },
      {
        id: "photography",
        label: t("client:common.enums.category.photography", "Fotografía"),
        icon: Camera,
        image: IMG.photography,
        link: "/buscar?resourceType=service&category=photography",
      },
      {
        id: "catering",
        label: t("client:common.enums.category.catering", "Catering"),
        icon: UtensilsCrossed,
        image: IMG.catering,
        link: "/buscar?resourceType=service&category=catering",
      },
      {
        id: "maintenance",
        label: t("client:common.enums.category.maintenance", "Mantenimiento"),
        icon: Wrench,
        image: IMG.maintenance,
        link: "/buscar?resourceType=service&category=maintenance",
      },
    ],
  },
  {
    resourceType: "experience",
    label: t("client:common.enums.resourceType.experience", "Experiencias"),
    items: [
      {
        id: "tour",
        label: t("client:common.enums.category.tour", "Tour"),
        icon: Compass,
        image: IMG.tour,
        link: "/buscar?resourceType=experience&category=tour",
      },
      {
        id: "class",
        label: t("client:common.enums.category.class", "Clase"),
        icon: GraduationCap,
        image: IMG.class,
        link: "/buscar?resourceType=experience&category=class",
      },
      {
        id: "workshop",
        label: t("client:common.enums.category.workshop", "Taller"),
        icon: Wrench,
        image: IMG.workshop,
        link: "/buscar?resourceType=experience&category=workshop",
      },
      {
        id: "adventure",
        label: t("client:common.enums.category.adventure", "Aventura"),
        icon: Mountain,
        image: IMG.adventure,
        link: "/buscar?resourceType=experience&category=adventure",
      },
      {
        id: "wellness",
        label: t("client:common.enums.category.wellness", "Bienestar"),
        icon: Heart,
        image: IMG.wellness,
        link: "/buscar?resourceType=experience&category=wellness",
      },
      {
        id: "gastronomy",
        label: t("client:common.enums.category.gastronomy", "Gastronomía"),
        icon: Grape,
        image: IMG.gastronomy,
        link: "/buscar?resourceType=experience&category=gastronomy",
      },
    ],
  },
  {
    resourceType: "venue",
    label: t("client:common.enums.resourceType.venue", "Salones"),
    items: [
      {
        id: "event_hall",
        label: t("client:common.enums.category.event_hall", "Salón de eventos"),
        icon: PartyPopper,
        image: IMG.event_hall,
        link: "/buscar?resourceType=venue&category=event_hall",
      },
      {
        id: "commercial_local",
        label: t(
          "client:common.enums.category.commercial_local",
          "Local comercial",
        ),
        icon: Store,
        image: IMG.commercial_local,
        link: "/buscar?resourceType=venue&category=commercial_local",
      },
      {
        id: "studio",
        label: t("client:common.enums.category.studio", "Estudio"),
        icon: Clapperboard,
        image: IMG.studio,
        link: "/buscar?resourceType=venue&category=studio",
      },
      {
        id: "coworking",
        label: t("client:common.enums.category.coworking", "Coworking"),
        icon: Laptop,
        image: IMG.coworking,
        link: "/buscar?resourceType=venue&category=coworking",
      },
      {
        id: "meeting_room",
        label: t("client:common.enums.category.meeting_room", "Sala de juntas"),
        icon: DoorOpen,
        image: IMG.meeting_room,
        link: "/buscar?resourceType=venue&category=meeting_room",
      },
    ],
  },
];

/* ═══════════════════════════════════════════
   Category tile card
   ═══════════════════════════════════════════ */
const CategoryTile = ({ item }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.link}
      draggable={false}
      className="group relative shrink-0 w-32 aspect-square overflow-hidden rounded-2xl sm:w-36 md:w-44 lg:w-48"
    >
      {/* Background */}
      <img
        src={item.image}
        alt={item.label}
        draggable={false}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-110"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent transition-colors duration-300 group-hover:from-black/60 group-hover:via-black/15" />
      {/* Content */}
      <div className="relative flex h-full flex-col justify-end p-3 sm:p-4">
        <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10">
          <Icon size={18} className="text-white drop-shadow" />
        </div>
        <span className="text-xs font-bold text-white drop-shadow-lg sm:text-sm md:text-base leading-tight">
          {item.label}
        </span>
      </div>
    </Link>
  );
};

/* ═══════════════════════════════════════════
   Infinite auto-scrolling row
   ─ auto-scrolls via rAF
   ─ pauses on hover (desktop) & touch
   ─ click-drag on desktop, native touch scroll
   ─ seamless loop via tripled content
   ═══════════════════════════════════════════ */
const EDGE_FADE =
  "linear-gradient(to right, transparent, black 48px, black calc(100% - 48px), transparent)";

const InfiniteRow = ({ items, direction = "left", speed = 0.4 }) => {
  const scrollRef = useRef(null);
  const rafId = useRef(null);
  const paused = useRef(false);
  const dragging = useRef(false);
  const wasDrag = useRef(false);
  const dragOrigin = useRef({ x: 0, scrollLeft: 0 });
  const resumeTimer = useRef(null);
  // Float accumulator — avoids sub-pixel truncation in scrollLeft
  const posRef = useRef(0);

  // Triple items for seamless loop buffer
  const tripled = [...items, ...items, ...items];

  /* ── Auto-scroll loop ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Wait for layout, then set initial scroll to middle segment
    const init = requestAnimationFrame(() => {
      const seg = el.scrollWidth / 3;
      el.scrollLeft = seg;
      posRef.current = seg;

      const tick = () => {
        if (!paused.current && !dragging.current) {
          if (direction === "left") {
            posRef.current += speed;
            if (posRef.current >= seg * 2) posRef.current -= seg;
          } else {
            posRef.current -= speed;
            if (posRef.current <= 0) posRef.current += seg;
          }
          el.scrollLeft = Math.round(posRef.current);
        }
        rafId.current = requestAnimationFrame(tick);
      };

      rafId.current = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(init);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [direction, speed, items.length]);

  /* ── Mouse drag (desktop) ── */
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragging.current = true;
    wasDrag.current = false;
    paused.current = true;
    dragOrigin.current = {
      x: e.pageX,
      scrollLeft: scrollRef.current.scrollLeft,
    };
    clearTimeout(resumeTimer.current);

    const onMove = (ev) => {
      const dx = ev.pageX - dragOrigin.current.x;
      if (Math.abs(dx) > 4) wasDrag.current = true;
      scrollRef.current.scrollLeft = dragOrigin.current.scrollLeft - dx;
      // Sync float accumulator after drag
      posRef.current = scrollRef.current.scrollLeft;
    };
    const onUp = () => {
      dragging.current = false;
      posRef.current = scrollRef.current.scrollLeft;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  /* ── Prevent link navigation after drag ── */
  const onClickCapture = useCallback((e) => {
    if (wasDrag.current) {
      e.preventDefault();
      e.stopPropagation();
      wasDrag.current = false;
    }
  }, []);

  /* ── Hover pause ── */
  const onMouseEnter = useCallback(() => {
    clearTimeout(resumeTimer.current);
    paused.current = true;
  }, []);
  const onMouseLeave = useCallback(() => {
    if (!dragging.current) paused.current = false;
  }, []);

  /* ── Touch pause (native scroll handles movement) ── */
  const onTouchStart = useCallback(() => {
    clearTimeout(resumeTimer.current);
    paused.current = true;
  }, []);
  const onTouchEnd = useCallback(() => {
    resumeTimer.current = setTimeout(() => {
      posRef.current = scrollRef.current.scrollLeft;
      paused.current = false;
    }, 2500);
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto cursor-grab select-none scrollbar-hide active:cursor-grabbing md:gap-4"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
        maskImage: EDGE_FADE,
        WebkitMaskImage: EDGE_FADE,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
    >
      {tripled.map((item, i) => (
        <CategoryTile key={`${item.id}-${i}`} item={item} />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Main section
   ═══════════════════════════════════════════ */
const CategoriesSection = () => {
  const { t } = useTranslation();
  const rows = useCategoryRows(t);

  return (
    <section className="py-16 overflow-hidden">
      {/* Header (contained) */}
      <div className="mx-auto max-w-3xl px-4 text-center mb-10 sm:px-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
          {t("client:categories.title", "Explora por Categoría")}
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          {t(
            "client:categories.subtitle",
            "Encuentra el recurso que se adapta a lo que necesitas.",
          )}
        </p>
      </div>

      {/* Infinite rows – full viewport width, alternating directions */}
      <div className="space-y-5">
        {rows.map((row, i) => (
          <div key={row.resourceType}>
            {/* Row label (contained) */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {row.label}
              </span>
            </div>
            {/* Carousel */}
            <InfiniteRow
              items={row.items}
              direction={i % 2 === 0 ? "left" : "right"}
              speed={0.4 + i * 0.08}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;
