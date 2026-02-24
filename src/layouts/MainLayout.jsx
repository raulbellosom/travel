import { Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Footer } from "../components/common/organisms";
import PublicNavbar from "../components/layout/PublicNavbar";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { useAuth } from "../hooks/useAuth";
import { useInstanceModules } from "../hooks/useInstanceModules";

const MainLayout = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { settings, loading: settingsLoading } = useInstanceModules();
  const role = String(user?.role || "")
    .trim()
    .toLowerCase();
  const isRootUser = role === "root";
  const isInstanceDisabledForCurrentUser =
    settings.enabled === false && !isRootUser;

  if (loading || settingsLoading) {
    return (
      <LoadingScreen
        transparent={false}
        title={t("routeGuards.validatingSession")}
      />
    );
  }

  if (isInstanceDisabledForCurrentUser) {
    return <Navigate to="/error/503" replace />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100 text-gray-900 dark:bg-slate-950 dark:text-gray-100">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
