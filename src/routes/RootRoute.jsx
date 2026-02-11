import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { useAuth } from "../hooks/useAuth";

const RootRoute = ({ children }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <LoadingScreen transparent title={t("routeGuards.validatingSession")} />
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== "root") {
    return <Navigate to="/error/403" replace />;
  }

  return children;
};

export default RootRoute;
