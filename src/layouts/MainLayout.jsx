import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navbar, Footer } from "../components/common/organisms";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { useAuth } from "../hooks/useAuth";

const MainLayout = () => {
  const { t } = useTranslation();
  const { loading } = useAuth();

  if (loading) {
    return (
      <LoadingScreen
        transparent={false}
        title={t("routeGuards.validatingSession")}
      />
    );
  }

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
