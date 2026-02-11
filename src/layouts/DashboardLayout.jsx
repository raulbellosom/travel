import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/navigation/Sidebar";
import DashboardNavbar from "../components/navigation/DashboardNavbar";
import { Footer } from "../components/common/organisms";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-slate-100 dark:bg-slate-900">
      <div className="flex min-h-dvh">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-h-dvh flex-1 flex-col lg:pl-64">
          <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
