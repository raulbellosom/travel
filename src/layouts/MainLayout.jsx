import { Outlet } from "react-router-dom";
import { Navbar, Footer } from "../components/common/organisms";

const MainLayout = () => {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-100 text-gray-900 dark:bg-slate-950 dark:text-gray-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
