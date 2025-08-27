import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/navigation/Sidebar";
import DashboardNavbar from "../components/navigation/DashboardNavbar";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <div className="flex-1 lg:pl-64">
          <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
