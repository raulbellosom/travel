import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import DashboardNavbar from "../components/navigation/DashboardNavbar";
import DashboardBottomTabs from "../components/navigation/DashboardBottomTabs";
import { Footer } from "../components/common/organisms";

const SIDEBAR_COLLAPSE_STORAGE_KEY = "dashboard.sidebar.collapsed";

const DashboardLayout = () => {
  const MotionDiv = m.div;
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const touchStartRef = useRef({ x: 0, y: 0, t: 0 });

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_COLLAPSE_STORAGE_KEY,
        String(sidebarCollapsed),
      );
    } catch {
      // localStorage is optional in restricted environments.
    }
  }, [sidebarCollapsed]);

  const handleToggleDesktopSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const handleTouchStart = (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      t: Date.now(),
    };
  };

  const handleTouchEnd = (event) => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) return;

    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const start = touchStartRef.current;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const elapsed = Date.now() - start.t;

    if (Math.abs(dy) > 60 || Math.abs(dx) < 70 || elapsed > 700) return;

    if (!sidebarOpen && start.x <= 28 && dx > 0) {
      setSidebarOpen(true);
      return;
    }

    if (sidebarOpen && start.x <= 340 && dx < 0) {
      setSidebarOpen(false);
    }
  };

  const shellPadding = sidebarCollapsed ? "lg:pl-24" : "lg:pl-72";
  const navbarDesktopOffset = sidebarCollapsed ? "lg:left-24" : "lg:left-72";

  return (
    <div
      className="relative min-h-dvh overflow-x-clip bg-slate-100 dark:bg-slate-950"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.64),transparent_35%)] dark:bg-[radial-gradient(circle_at_10%_0%,rgba(14,165,233,0.22),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.2),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.72),transparent_40%)]"
      />

      <div className="relative flex min-h-dvh min-w-0">
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={handleToggleDesktopSidebar}
        />

        <div
          className={`flex min-h-dvh min-w-0 flex-1 flex-col transition-[padding-left] duration-300 ${shellPadding}`}
        >
          <DashboardNavbar
            onMenuClick={() => setSidebarOpen(true)}
            desktopOffsetClass={navbarDesktopOffset}
          />

          <main className="min-w-0 flex-1 px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[5.25rem] sm:px-5 lg:px-8 lg:pb-6">
            <MotionDiv
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mx-auto w-full min-w-0 max-w-[1520px] rounded-3xl border border-slate-200/80 bg-white/[0.82] p-4 shadow-sm backdrop-blur-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900/75"
            >
              <Outlet />
            </MotionDiv>
          </main>

          <div className="relative z-[65] mb-[calc(5.5rem+env(safe-area-inset-bottom))] min-w-0 lg:mb-0">
            <Footer variant="admin" />
          </div>

          <DashboardBottomTabs />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
