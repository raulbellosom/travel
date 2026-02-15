import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { UIProvider } from "../contexts/UIContext";
import InternalRoute from "./InternalRoute";
import OwnerRoute from "./OwnerRoute";
import RootRoute from "./RootRoute";
import RoleRoute from "./RoleRoute";
import ScopeRoute from "./ScopeRoute";
import ClientRoute from "./ClientRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import Home from "../pages/Home";
import PropertyDetail from "../pages/PropertyDetail";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import VerifyEmail from "../pages/VerifyEmail";
import Dashboard from "../pages/Dashboard";
import MyProperties from "../pages/MyProperties";
import AppPropertyDetail from "../pages/AppPropertyDetail";
import CreateProperty from "../pages/CreateProperty";
import EditProperty from "../pages/EditProperty";
import Leads from "../pages/Leads";
import Clients from "../pages/Clients";
import Team from "../pages/Team";
import AppReservations from "../pages/AppReservations";
import AppPayments from "../pages/AppPayments";
import AppReviews from "../pages/AppReviews";
import Profile from "../pages/Profile";
import AppProfile from "../pages/AppProfile";
import Settings from "../pages/Settings";
import MyReservations from "../pages/MyReservations";
import MyReviews from "../pages/MyReviews";
import ReserveProperty from "../pages/ReserveProperty";
import VoucherLookup from "../pages/VoucherLookup";
import PrivacyNotice from "../pages/PrivacyNotice";
import TermsConditions from "../pages/TermsConditions";
import UIDocsPage from "../pages/UIDocsPage";
import NotFound from "../pages/NotFound";
import BadRequest from "../pages/BadRequest";
import Forbidden from "../pages/Forbidden";
import ServerError from "../pages/ServerError";
import ServiceUnavailable from "../pages/ServiceUnavailable";
import ErrorsDemo from "../pages/ErrorsDemo";
import RootAmenitiesPanel from "../pages/RootAmenitiesPanel";
import RootActivityLog from "../pages/RootActivityLog";
import RootFunctionsDiagnostics from "../pages/RootFunctionsDiagnostics";
import {
  INTERNAL_BASE_PATH,
  INTERNAL_ROUTES,
  getInternalPropertyDetailRoute,
  getInternalEditPropertyRoute,
} from "../utils/internalRoutes";
import env from "../env";
import LoadingScreen from "../components/loaders/LoadingScreen";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";

const LegacyEditPropertyRedirect = () => {
  const { id } = useParams();
  return <Navigate to={getInternalEditPropertyRoute(id)} replace />;
};

const LegacyPropertyDetailRedirect = () => {
  const { id } = useParams();
  return <Navigate to={getInternalPropertyDetailRoute(id)} replace />;
};

const MarketingEntryRoute = () => {
  const { t } = useTranslation();
  const { loading } = useAuth();

  if (!env.features.marketingSite) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <LoadingScreen
        transparent={false}
        title={t("routeGuards.validatingSession")}
      />
    );
  }

  return <Home />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <Routes>
            <Route path="/" element={<MarketingEntryRoute />} />
            <Route element={<MainLayout />}>
              <Route path="propiedades/:slug" element={<PropertyDetail />} />
              <Route path="reservar/:slug" element={<ReserveProperty />} />
              <Route path="voucher/:code" element={<VoucherLookup />} />
              <Route
                path="perfil"
                element={
                  <ClientRoute>
                    <Profile mode="client" />
                  </ClientRoute>
                }
              />
              <Route
                path="mis-reservas"
                element={
                  <ProtectedRoute>
                    <MyReservations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="mis-resenas"
                element={
                  <ProtectedRoute>
                    <MyReviews />
                  </ProtectedRoute>
                }
              />
              <Route path="aviso-privacidad" element={<PrivacyNotice />} />
              <Route
                path="terminos-condiciones"
                element={<TermsConditions />}
              />
              <Route path="ui-docs" element={<UIDocsPage />} />
              <Route path="errors-demo" element={<ErrorsDemo />} />
            </Route>

            <Route path="/" element={<AuthLayout />}>
              <Route
                path="login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="register"
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />
              <Route path="recuperar-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="verify-email" element={<VerifyEmail />} />
            </Route>

            <Route
              path={INTERNAL_BASE_PATH}
              element={
                <InternalRoute>
                  <DashboardLayout />
                </InternalRoute>
              }
            >
              <Route
                index
                element={<Navigate to={INTERNAL_ROUTES.dashboard} replace />}
              />
              <Route path="dashboard" element={<Dashboard />} />
              <Route
                path="my-properties"
                element={
                  <ScopeRoute scope="properties.read">
                    <MyProperties />
                  </ScopeRoute>
                }
              />
              <Route
                path="properties/new"
                element={
                  <ScopeRoute scope="properties.write">
                    <CreateProperty />
                  </ScopeRoute>
                }
              />
              <Route
                path="properties/:id/edit"
                element={
                  <ScopeRoute scope="properties.write">
                    <EditProperty />
                  </ScopeRoute>
                }
              />
              <Route
                path="properties/:id"
                element={
                  <ScopeRoute scope="properties.read">
                    <AppPropertyDetail />
                  </ScopeRoute>
                }
              />
              <Route
                path="leads"
                element={
                  <ScopeRoute scope="leads.read">
                    <Leads />
                  </ScopeRoute>
                }
              />
              <Route
                path="reservations"
                element={
                  <ScopeRoute scope="reservations.read">
                    <AppReservations />
                  </ScopeRoute>
                }
              />
              <Route
                path="payments"
                element={
                  <ScopeRoute scope="payments.read">
                    <AppPayments />
                  </ScopeRoute>
                }
              />
              <Route
                path="reviews"
                element={
                  <ScopeRoute scope="reviews.moderate">
                    <AppReviews />
                  </ScopeRoute>
                }
              />
              <Route
                path="clients"
                element={
                  <OwnerRoute>
                    <Clients />
                  </OwnerRoute>
                }
              />
              <Route
                path="team"
                element={
                  <ScopeRoute scope="staff.manage">
                    <Team />
                  </ScopeRoute>
                }
              />
              <Route
                path="activity"
                element={
                  <RootRoute>
                    <RootActivityLog />
                  </RootRoute>
                }
              />
              <Route
                path="amenities"
                element={
                  <RootRoute>
                    <RootAmenitiesPanel />
                  </RootRoute>
                }
              />
              <Route
                path="functions-health"
                element={
                  <RootRoute>
                    <RootFunctionsDiagnostics />
                  </RootRoute>
                }
              />
              <Route path="profile" element={<AppProfile />} />
              <Route
                path="settings"
                element={
                  <RoleRoute minimumRole="owner">
                    <Settings />
                  </RoleRoute>
                }
              />
              <Route
                path="mis-propiedades"
                element={<Navigate to={INTERNAL_ROUTES.myProperties} replace />}
              />
              <Route
                path="propiedades/:id"
                element={<LegacyPropertyDetailRedirect />}
              />
              <Route
                path="crear-propiedad"
                element={
                  <Navigate to={INTERNAL_ROUTES.createProperty} replace />
                }
              />
              <Route
                path="editar-propiedad/:id"
                element={<LegacyEditPropertyRedirect />}
              />
              <Route
                path="reservas"
                element={<Navigate to={INTERNAL_ROUTES.reservations} replace />}
              />
              <Route
                path="pagos"
                element={<Navigate to={INTERNAL_ROUTES.payments} replace />}
              />
              <Route
                path="resenas"
                element={<Navigate to={INTERNAL_ROUTES.reviews} replace />}
              />
              <Route
                path="clientes"
                element={<Navigate to={INTERNAL_ROUTES.clients} replace />}
              />
              <Route
                path="equipo"
                element={<Navigate to={INTERNAL_ROUTES.team} replace />}
              />
              <Route
                path="perfil"
                element={<Navigate to={INTERNAL_ROUTES.profile} replace />}
              />
              <Route
                path="configuracion"
                element={<Navigate to={INTERNAL_ROUTES.settings} replace />}
              />
            </Route>

            <Route
              path="/dashboard"
              element={<Navigate to={INTERNAL_ROUTES.dashboard} replace />}
            />
            <Route
              path="/mis-propiedades"
              element={<Navigate to={INTERNAL_ROUTES.myProperties} replace />}
            />
            <Route
              path="/my-properties"
              element={<Navigate to={INTERNAL_ROUTES.myProperties} replace />}
            />
            <Route
              path="/properties/:id"
              element={<LegacyPropertyDetailRedirect />}
            />
            <Route
              path="/crear-propiedad"
              element={<Navigate to={INTERNAL_ROUTES.createProperty} replace />}
            />
            <Route
              path="/properties/new"
              element={<Navigate to={INTERNAL_ROUTES.createProperty} replace />}
            />
            <Route
              path="/editar-propiedad/:id"
              element={<LegacyEditPropertyRedirect />}
            />
            <Route
              path="/properties/:id/edit"
              element={<LegacyEditPropertyRedirect />}
            />
            <Route
              path="/leads"
              element={<Navigate to={INTERNAL_ROUTES.leads} replace />}
            />
            <Route
              path="/reservas"
              element={<Navigate to={INTERNAL_ROUTES.reservations} replace />}
            />
            <Route
              path="/reservations"
              element={<Navigate to={INTERNAL_ROUTES.reservations} replace />}
            />
            <Route
              path="/pagos"
              element={<Navigate to={INTERNAL_ROUTES.payments} replace />}
            />
            <Route
              path="/payments"
              element={<Navigate to={INTERNAL_ROUTES.payments} replace />}
            />
            <Route
              path="/resenas"
              element={<Navigate to={INTERNAL_ROUTES.reviews} replace />}
            />
            <Route
              path="/reviews"
              element={<Navigate to={INTERNAL_ROUTES.reviews} replace />}
            />
            <Route
              path="/clientes"
              element={<Navigate to={INTERNAL_ROUTES.clients} replace />}
            />
            <Route
              path="/clients"
              element={<Navigate to={INTERNAL_ROUTES.clients} replace />}
            />
            <Route
              path="/equipo"
              element={<Navigate to={INTERNAL_ROUTES.team} replace />}
            />
            <Route
              path="/team"
              element={<Navigate to={INTERNAL_ROUTES.team} replace />}
            />
            <Route
              path="/app/profile"
              element={<Navigate to={INTERNAL_ROUTES.profile} replace />}
            />
            <Route
              path="/configuracion"
              element={<Navigate to={INTERNAL_ROUTES.settings} replace />}
            />
            <Route
              path="/settings"
              element={<Navigate to={INTERNAL_ROUTES.settings} replace />}
            />

            <Route
              path="/auth/login"
              element={<Navigate to="/login" replace />}
            />
            <Route
              path="/auth/register"
              element={<Navigate to="/register" replace />}
            />

            <Route path="/error/400" element={<BadRequest />} />
            <Route path="/error/403" element={<Forbidden />} />
            <Route path="/error/404" element={<NotFound />} />
            <Route path="/error/500" element={<ServerError />} />
            <Route path="/error/503" element={<ServiceUnavailable />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
