import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { hasScope, isInternalRole } from "../utils/roles";
import { useInstanceModules } from "../hooks/useInstanceModules";
import { isScopeAllowedByModules } from "../utils/moduleAccess";

const ScopeRoute = ({ children, scope }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { loading: modulesLoading, isEnabled } = useInstanceModules();
  const location = useLocation();

  if (loading || modulesLoading) {
    return <LoadingScreen transparent title={t("routeGuards.validatingSession")} />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isInternalRole(user.role)) {
    return <Navigate to="/error/403" replace />;
  }

  if (!hasScope(user, scope)) {
    return <Navigate to="/error/403" replace />;
  }

  if (!isScopeAllowedByModules(scope, isEnabled)) {
    return <Navigate to="/error/403" replace />;
  }

  return children;
};

export default ScopeRoute;
