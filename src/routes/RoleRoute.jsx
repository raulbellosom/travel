import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { hasRoleAtLeast, isInternalRole } from "../utils/roles";

const RoleRoute = ({ children, minimumRole = "staff_support" }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen transparent title={t("routeGuards.validatingSession")} />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isInternalRole(user.role)) {
    return <Navigate to="/error/403" replace />;
  }

  if (!hasRoleAtLeast(user.role, minimumRole)) {
    return <Navigate to="/error/403" replace />;
  }

  return children;
};

export default RoleRoute;
