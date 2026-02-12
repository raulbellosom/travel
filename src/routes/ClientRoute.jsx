import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { usePageSeo } from "../hooks/usePageSeo";
import { isInternalRole } from "../utils/roles";
import { INTERNAL_ROUTES } from "../utils/internalRoutes";

const ClientRoute = ({ children }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();
  usePageSeo({ robots: "noindex, nofollow" });

  if (loading) {
    return <LoadingScreen transparent title={t("routeGuards.validatingSession")} />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isInternalRole(user.role)) {
    return <Navigate to={INTERNAL_ROUTES.profile} replace />;
  }

  return children;
};

export default ClientRoute;
