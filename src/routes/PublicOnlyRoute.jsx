import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { isInternalRole } from "../utils/roles";
import { INTERNAL_ROUTES } from "../utils/internalRoutes";

const PublicOnlyRoute = ({ children }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen transparent title={t("routeGuards.validatingSession")} />;
  }

  if (user) {
    return <Navigate to={isInternalRole(user.role) ? INTERNAL_ROUTES.dashboard : "/"} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
