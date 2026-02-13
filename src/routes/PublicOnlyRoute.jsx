import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { isInternalRole } from "../utils/roles";
import { INTERNAL_BASE_PATH } from "../utils/internalRoutes";

const PublicOnlyRoute = ({ children }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen transparent title={t("routeGuards.validatingSession")} />;
  }

  if (user) {
    return <Navigate to={isInternalRole(user.role) ? INTERNAL_BASE_PATH : "/"} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
