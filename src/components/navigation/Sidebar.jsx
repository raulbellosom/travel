import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  Inbox,
  List,
  MessageCircle,
  MessageSquareText,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import BrandLogo from "../common/BrandLogo";
import { INTERNAL_ROUTES } from "../../utils/internalRoutes";
import { hasScope } from "../../utils/roles";

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const MotionAside = motion.aside;
  const MotionButton = motion.button;
  const MotionSpan = motion.span;
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => {
      setIsDesktopViewport(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Lock body scroll on mobile when sidebar is open
  useEffect(() => {
    // Only lock scroll on mobile (< 1024px) when sidebar is open
    if (!isOpen || isDesktopViewport) return;

    // Store original values
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Lock scroll on both html and body
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen, isDesktopViewport]);

  const isDesktopCollapsed = Boolean(isCollapsed);

  const navigation = [
    {
      name: t("sidebar.overview"),
      href: INTERNAL_ROUTES.dashboard,
      icon: Home,
    },
    ...(hasScope(user, "resources.read")
      ? [
          {
            name: t("sidebar.listings"),
            href: INTERNAL_ROUTES.myProperties,
            icon: List,
          },
        ]
      : []),
    ...(hasScope(user, "leads.read")
      ? [{ name: t("sidebar.leads"), href: INTERNAL_ROUTES.leads, icon: Inbox }]
      : []),
    ...(hasScope(user, "messaging.read")
      ? [
          {
            name: t("sidebar.conversations"),
            href: INTERNAL_ROUTES.conversations,
            icon: MessageCircle,
          },
        ]
      : []),
    ...(hasScope(user, "reservations.read")
      ? [
          {
            name: t("sidebar.reservations"),
            href: INTERNAL_ROUTES.reservations,
            icon: CalendarDays,
          },
          {
            name: t("sidebar.calendar"),
            href: INTERNAL_ROUTES.calendar,
            icon: CalendarRange,
          },
        ]
      : []),
    ...(hasScope(user, "payments.read")
      ? [
          {
            name: t("sidebar.payments"),
            href: INTERNAL_ROUTES.payments,
            icon: CreditCard,
          },
        ]
      : []),
    ...(hasScope(user, "reviews.moderate")
      ? [
          {
            name: t("sidebar.reviews"),
            href: INTERNAL_ROUTES.reviews,
            icon: MessageSquareText,
          },
        ]
      : []),
    ...(user?.role === "owner"
      ? [
          {
            name: t("sidebar.clients"),
            href: INTERNAL_ROUTES.clients,
            icon: Users,
          },
        ]
      : []),
    ...(hasScope(user, "staff.manage")
      ? [{ name: t("sidebar.team"), href: INTERNAL_ROUTES.team, icon: Users }]
      : []),
    ...(user?.role === "root"
      ? [
          {
            name: t("sidebar.rootActivity"),
            href: INTERNAL_ROUTES.rootActivity,
            icon: ShieldAlert,
          },
          {
            name: t("sidebar.rootAmenities"),
            href: INTERNAL_ROUTES.rootAmenities,
            icon: Sparkles,
          },
          {
            name: t("sidebar.rootFunctionsDiagnostics"),
            href: INTERNAL_ROUTES.rootFunctionsDiagnostics,
            icon: Wrench,
          },
          {
            name: t("sidebar.rootInstance"),
            href: INTERNAL_ROUTES.rootInstance,
            icon: ShieldAlert,
          },
          {
            name: t("sidebar.rootModules"),
            href: INTERNAL_ROUTES.rootModules,
            icon: SlidersHorizontal,
          },
        ]
      : []),
  ];

  const isActive = (href) => {
    return (
      location.pathname === href || location.pathname.startsWith(`${href}/`)
    );
  };

  const handleItemMouseEnter = (event, name) => {
    if (!isDesktopCollapsed) return;
    const itemRect = event.currentTarget.getBoundingClientRect();
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();
    const sidebarTop = sidebarRect?.top ?? 0;
    const top = itemRect.top - sidebarTop + itemRect.height / 2;
    setHoveredItem({ name, top });
  };

  const handleItemMouseLeave = () => {
    setHoveredItem(null);
  };

  const desktopWidthClass = isDesktopCollapsed ? "lg:w-24" : "lg:w-72";
  const textCollapseClass = isDesktopCollapsed
    ? "lg:max-w-0 lg:opacity-0"
    : "lg:max-w-[220px] lg:opacity-100";

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <MotionButton
            type="button"
            aria-label={t("common.close")}
            className="fixed inset-0 z-[75] bg-slate-950/60 backdrop-blur-[1px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>

      <MotionAside
        ref={sidebarRef}
        initial={false}
        animate={{ x: isDesktopViewport || isOpen ? 0 : "-100%" }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-y-0 left-0 z-[80] flex h-dvh w-72 flex-col overflow-visible border-r border-slate-200 bg-white/95 shadow-2xl backdrop-blur transition-[width] duration-300 dark:border-slate-800/80 dark:bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.08),transparent_38%),linear-gradient(135deg,rgba(2,6,23,0.99)_0%,rgba(7,18,46,0.97)_45%,rgba(2,6,23,0.99)_100%)] lg:z-40 ${desktopWidthClass}`}
      >
        <div className="flex h-[4.5rem] items-center border-b border-slate-200 bg-gradient-to-r from-slate-50 via-cyan-50/70 to-sky-50/80 px-4 dark:border-slate-800/80 dark:bg-none dark:from-transparent dark:via-transparent dark:to-transparent">
          <Link
            to={INTERNAL_ROUTES.dashboard}
            onClick={onClose}
            className="grid min-w-0 flex-1 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2"
          >
            <BrandLogo
              size="sm"
              mode="adaptive"
              alt={t("navbar.brand")}
              className="rounded-lg"
            />
            <div className="overflow-hidden">
              <div
                className={`max-w-[220px] overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ${textCollapseClass}`}
              >
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("navbar.brand")}
                </p>
                <p className="truncate text-xs text-cyan-600 dark:text-cyan-400">
                  {t("sidebar.dashboardTitle")}
                </p>
              </div>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="ml-2 text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden"
            aria-label={t("common.close")}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="mt-3 flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
          <div className="px-2 pb-2">
            <p
              className={`max-w-[220px] overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition-[max-width,opacity] duration-300 dark:text-slate-400 ${textCollapseClass}`}
            >
              {t("sidebar.navigation")}
            </p>
          </div>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  onMouseEnter={(event) =>
                    handleItemMouseEnter(event, item.name)
                  }
                  onMouseLeave={handleItemMouseLeave}
                  onFocus={(event) => handleItemMouseEnter(event, item.name)}
                  onBlur={handleItemMouseLeave}
                  className={`group relative grid min-h-11 grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3 rounded-xl px-3 transition-all duration-200 ${
                    active
                      ? "bg-cyan-50 text-cyan-700 shadow-sm dark:bg-cyan-900/25 dark:text-cyan-200"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      active
                        ? "text-cyan-600 dark:text-cyan-300"
                        : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                    }`}
                  />

                  <span
                    className={`max-w-[200px] overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width,opacity] duration-300 ${textCollapseClass}`}
                  >
                    {item.name}
                  </span>

                  {active ? (
                    <MotionSpan
                      layoutId="sidebar-active-indicator"
                      className="absolute right-2 hidden h-1.5 w-1.5 rounded-full bg-cyan-500 lg:block"
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <button
          onClick={onToggleCollapse}
          className="hidden h-14 w-full grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3 border-t border-slate-200 bg-gradient-to-r from-cyan-50 via-sky-50 to-cyan-100 px-5 text-sm font-semibold text-slate-700 transition hover:from-cyan-100 hover:via-sky-100 hover:to-cyan-200 dark:border-slate-800/80 dark:bg-[radial-gradient(circle_at_0%_100%,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.1),transparent_36%),linear-gradient(135deg,rgba(10,23,53,0.92)_0%,rgba(15,30,63,0.9)_45%,rgba(10,23,53,0.92)_100%)] dark:text-slate-200 dark:hover:bg-[radial-gradient(circle_at_0%_100%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.14),transparent_36%),linear-gradient(135deg,rgba(13,28,62,0.95)_0%,rgba(21,39,78,0.93)_45%,rgba(13,28,62,0.95)_100%)] lg:grid"
          aria-label={
            isDesktopCollapsed ? t("sidebar.expand") : t("sidebar.collapse")
          }
        >
          {isDesktopCollapsed ? (
            <ChevronRight
              size={18}
              className="text-slate-600 dark:text-slate-300"
            />
          ) : (
            <ChevronLeft
              size={18}
              className="text-slate-600 dark:text-slate-300"
            />
          )}
          <span
            className={`max-w-[160px] overflow-hidden whitespace-nowrap text-left transition-[max-width,opacity] duration-300 ${textCollapseClass}`}
          >
            {isDesktopCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          </span>
        </button>

        <AnimatePresence>
          {isDesktopCollapsed && hoveredItem ? (
            <MotionSpan
              initial={{ opacity: 0, x: 6, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-none absolute left-[calc(100%+8px)] z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:block"
              style={{ top: hoveredItem.top }}
            >
              {hoveredItem.name}
            </MotionSpan>
          ) : null}
        </AnimatePresence>
      </MotionAside>
    </>
  );
};

export default Sidebar;
