import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { isInternalRole } from "../utils/roles";
import { usePageSeo } from "../hooks/usePageSeo";
import { useInstanceModules } from "../hooks/useInstanceModules";

const InternalRoute = ({ children }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { settings, loading: settingsLoading } = useInstanceModules();
  const location = useLocation();
  usePageSeo({ robots: "noindex, nofollow" });
  const role = String(user?.role || "")
    .trim()
    .toLowerCase();
  const isRootUser = role === "root";
  const isInstanceDisabledForCurrentUser =
    settings.enabled === false && !isRootUser;

  if (loading || settingsLoading) {
    return <LoadingScreen transparent title={t("routeGuards.validatingSession")} />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isInternalRole(user.role)) {
    return <Navigate to="/error/403" replace />;
  }

  if (isInstanceDisabledForCurrentUser) {
    return <Navigate to="/error/503" replace />;
  }

  return children;
};

export default InternalRoute;
