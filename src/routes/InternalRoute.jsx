import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { isInternalRole } from "../utils/roles";
import { usePageSeo } from "../hooks/usePageSeo";

const InternalRoute = ({ children }) => {
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

  if (!isInternalRole(user.role)) {
    return <Navigate to="/error/403" replace />;
  }

  return children;
};

export default InternalRoute;
