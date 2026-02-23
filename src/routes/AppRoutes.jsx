import { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { UIProvider } from "../contexts/UIContext";
import { ToastProvider } from "../contexts/ToastContext";
import InternalRoute from "./InternalRoute";
import OwnerRoute from "./OwnerRoute";
import RootRoute from "./RootRoute";
import ScopeRoute from "./ScopeRoute";
import ClientRoute from "./ClientRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  INTERNAL_BASE_PATH,
  INTERNAL_ROUTES,
  getInternalPropertyDetailRoute,
  getInternalEditPropertyRoute,
} from "../utils/internalRoutes";
import env from "../env";
import LoadingScreen from "../components/loaders/LoadingScreen";
import ScrollToTop from "../components/routing/ScrollToTop";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { ChatProvider } from "../contexts/ChatContext";

const Home = lazy(() => import("../pages/Home"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const MapExplorePage = lazy(() => import("../pages/MapExplorePage"));
const PropertyDetail = lazy(() => import("../pages/PropertyDetail"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const MyProperties = lazy(() => import("../pages/MyProperties"));
const AppPropertyDetail = lazy(() => import("../pages/AppPropertyDetail"));
const CreateProperty = lazy(() => import("../pages/CreateProperty"));
const EditProperty = lazy(() => import("../pages/EditProperty"));
const Leads = lazy(() => import("../pages/Leads"));
const Conversations = lazy(() => import("../pages/Conversations"));
const Clients = lazy(() => import("../pages/Clients"));
const Team = lazy(() => import("../pages/Team"));
const AppReservations = lazy(() => import("../pages/AppReservations"));
const AppCalendar = lazy(() => import("../pages/AppCalendar"));
const AppPayments = lazy(() => import("../pages/AppPayments"));
const AppReviews = lazy(() => import("../pages/AppReviews"));
const Profile = lazy(() => import("../pages/Profile"));
const AppProfile = lazy(() => import("../pages/AppProfile"));
const MyReservations = lazy(() => import("../pages/MyReservations"));
const MyReviews = lazy(() => import("../pages/MyReviews"));
const MyConversations = lazy(() => import("../pages/MyConversations"));
const MyFavorites = lazy(() => import("../pages/MyFavorites"));
const ReserveProperty = lazy(() => import("../pages/ReserveProperty"));
const VoucherLookup = lazy(() => import("../pages/VoucherLookup"));
const PrivacyNotice = lazy(() => import("../pages/PrivacyNotice"));
const TermsConditions = lazy(() => import("../pages/TermsConditions"));
const UIDocsPage = lazy(() => import("../pages/UIDocsPage"));
const NotFound = lazy(() => import("../pages/NotFound"));
const BadRequest = lazy(() => import("../pages/BadRequest"));
const Forbidden = lazy(() => import("../pages/Forbidden"));
const ServerError = lazy(() => import("../pages/ServerError"));
const ServiceUnavailable = lazy(() => import("../pages/ServiceUnavailable"));
const ErrorsDemo = lazy(() => import("../pages/ErrorsDemo"));
const RootAmenitiesPanel = lazy(() => import("../pages/RootAmenitiesPanel"));
const RootActivityLog = lazy(() => import("../pages/RootActivityLog"));
const RootFunctionsDiagnostics = lazy(
  () => import("../pages/RootFunctionsDiagnostics"),
);
const RootInstancePage = lazy(() => import("../pages/RootInstancePage"));
const ChatBubble = lazy(() => import("../components/chat/ChatBubble"));

const LegacyEditPropertyRedirect = () => {
  const { id } = useParams();
  return <Navigate to={getInternalEditPropertyRoute(id)} replace />;
};

const LegacyPropertyDetailRedirect = () => {
  const { id } = useParams();
  return <Navigate to={getInternalPropertyDetailRoute(id)} replace />;
};

/** Redirect legacy /propiedades/:slug → /recursos/:slug (and /properties → /resources) */
const LegacyPublicSlugRedirect = ({ base }) => {
  const { slug } = useParams();
  return <Navigate to={`/${base}/${slug}`} replace />;
};

const MarketingEntryRoute = () => {
  const { t } = useTranslation();
  const { loading } = useAuth();

  if (loading) {
    return (
      <LoadingScreen
        transparent={false}
        title={t("routeGuards.validatingSession")}
      />
    );
  }

  // Marketing site enabled → show CRM landing (has its own layout/navbar)
  if (env.features.marketingSite) {
    return <Home />;
  }

  // Marketing site disabled → let it fall through to MainLayout's index route
  return null;
};

const RoutesFallback = () => <LoadingScreen transparent={false} />;

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <UIProvider>
          <ToastProvider>
            <ChatProvider>
              <Suspense fallback={<RoutesFallback />}>
                {env.features.marketingSite ? (
                  <Routes>
                    {/* Marketing Mode: Only Landing + Redirects */}
                    <Route path="/" element={<MarketingEntryRoute />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                ) : (
                  <Routes>
                    {/* Client Mode: Full Application */}
                    <Route element={<MainLayout />}>
                      {!env.features.marketingSite && (
                        <Route index element={<Home />} />
                      )}
                      <Route path="buscar" element={<SearchPage />} />
                      <Route path="search" element={<SearchPage />} />
                      <Route
                        path="explorar-mapa"
                        element={<MapExplorePage />}
                      />
                      <Route path="map-explore" element={<MapExplorePage />} />
                      {/* ── Canonical public detail routes ── */}
                      <Route
                        path="recursos/:slug"
                        element={<PropertyDetail />}
                      />
                      <Route
                        path="resources/:slug"
                        element={<PropertyDetail />}
                      />
                      {/* ── Legacy public detail redirects (backward-compat) ── */}
                      <Route
                        path="propiedades/:slug"
                        element={<LegacyPublicSlugRedirect base="recursos" />}
                      />
                      <Route
                        path="properties/:slug"
                        element={<LegacyPublicSlugRedirect base="resources" />}
                      />
                      <Route
                        path="reservar/:slug"
                        element={<ReserveProperty />}
                      />
                      <Route
                        path="reserve/:slug"
                        element={<ReserveProperty />}
                      />
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
                        path="profile"
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
                        path="my-reservations"
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
                      <Route
                        path="my-reviews"
                        element={
                          <ProtectedRoute>
                            <MyReviews />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="mis-conversaciones"
                        element={
                          <ProtectedRoute>
                            <MyConversations />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="my-conversations"
                        element={
                          <ProtectedRoute>
                            <MyConversations />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="mis-favoritos"
                        element={
                          <ProtectedRoute>
                            <MyFavorites />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="my-favorites"
                        element={
                          <ProtectedRoute>
                            <MyFavorites />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="aviso-privacidad"
                        element={<PrivacyNotice />}
                      />
                      <Route
                        path="privacy-notice"
                        element={<PrivacyNotice />}
                      />
                      <Route
                        path="terminos-condiciones"
                        element={<TermsConditions />}
                      />
                      <Route
                        path="terms-conditions"
                        element={<TermsConditions />}
                      />
                      <Route path="ui-docs" element={<UIDocsPage />} />
                      <Route path="errors-demo" element={<ErrorsDemo />} />
                    </Route>

                    {/* Public Routes */}
                    <Route element={<AuthLayout />}>
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
                      <Route
                        path="recuperar-password"
                        element={<ForgotPassword />}
                      />
                      <Route
                        path="reset-password"
                        element={<ResetPassword />}
                      />
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
                        element={
                          <Navigate to={INTERNAL_ROUTES.dashboard} replace />
                        }
                      />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route
                        path="my-resources"
                        element={
                          <ScopeRoute scope="resources.read">
                            <MyProperties />
                          </ScopeRoute>
                        }
                      />
                      <Route
                        path="resources/new"
                        element={
                          <ScopeRoute scope="resources.write">
                            <CreateProperty />
                          </ScopeRoute>
                        }
                      />
                      <Route
                        path="resources/:id/edit"
                        element={
                          <ScopeRoute scope="resources.write">
                            <EditProperty />
                          </ScopeRoute>
                        }
                      />
                      <Route
                        path="resources/:id"
                        element={
                          <ScopeRoute scope="resources.read">
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
                        path="conversations"
                        element={
                          <ScopeRoute scope="messaging.read">
                            <Conversations />
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
                        path="calendar"
                        element={
                          <ScopeRoute scope="reservations.read">
                            <AppCalendar />
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
                      <Route
                        path="root/instance"
                        element={
                          <RootRoute>
                            <RootInstancePage />
                          </RootRoute>
                        }
                      />
                      <Route
                        path="root/modules"
                        element={<Navigate to="/app/root/instance" replace />}
                      />
                      <Route path="profile" element={<AppProfile />} />
                      <Route
                        path="my-properties"
                        element={
                          <Navigate to={INTERNAL_ROUTES.myProperties} replace />
                        }
                      />
                      <Route
                        path="mis-propiedades"
                        element={
                          <Navigate to={INTERNAL_ROUTES.myProperties} replace />
                        }
                      />
                      <Route
                        path="mis-recursos"
                        element={
                          <Navigate to={INTERNAL_ROUTES.myProperties} replace />
                        }
                      />
                      <Route
                        path="properties/new"
                        element={
                          <Navigate
                            to={INTERNAL_ROUTES.createProperty}
                            replace
                          />
                        }
                      />
                      <Route
                        path="crear-recurso"
                        element={
                          <Navigate
                            to={INTERNAL_ROUTES.createProperty}
                            replace
                          />
                        }
                      />
                      <Route
                        path="properties/:id"
                        element={<LegacyPropertyDetailRedirect />}
                      />
                      <Route
                        path="propiedades/:id"
                        element={<LegacyPropertyDetailRedirect />}
                      />
                      <Route
                        path="crear-propiedad"
                        element={
                          <Navigate
                            to={INTERNAL_ROUTES.createProperty}
                            replace
                          />
                        }
                      />
                      <Route
                        path="properties/:id/edit"
                        element={<LegacyEditPropertyRedirect />}
                      />
                      <Route
                        path="editar-propiedad/:id"
                        element={<LegacyEditPropertyRedirect />}
                      />
                      <Route
                        path="editar-recurso/:id"
                        element={<LegacyEditPropertyRedirect />}
                      />
                      <Route
                        path="reservas"
                        element={
                          <Navigate to={INTERNAL_ROUTES.reservations} replace />
                        }
                      />
                      <Route
                        path="pagos"
                        element={
                          <Navigate to={INTERNAL_ROUTES.payments} replace />
                        }
                      />
                      <Route
                        path="resenas"
                        element={
                          <Navigate to={INTERNAL_ROUTES.reviews} replace />
                        }
                      />
                      <Route
                        path="clientes"
                        element={
                          <Navigate to={INTERNAL_ROUTES.clients} replace />
                        }
                      />
                      <Route
                        path="equipo"
                        element={<Navigate to={INTERNAL_ROUTES.team} replace />}
                      />
                      <Route
                        path="perfil"
                        element={
                          <Navigate to={INTERNAL_ROUTES.profile} replace />
                        }
                      />
                    </Route>

                    <Route
                      path="/dashboard"
                      element={
                        <Navigate to={INTERNAL_ROUTES.dashboard} replace />
                      }
                    />
                    <Route
                      path="/mis-propiedades"
                      element={
                        <Navigate to={INTERNAL_ROUTES.myProperties} replace />
                      }
                    />
                    <Route
                      path="/my-properties"
                      element={
                        <Navigate to={INTERNAL_ROUTES.myProperties} replace />
                      }
                    />
                    <Route
                      path="/mis-recursos"
                      element={
                        <Navigate to={INTERNAL_ROUTES.myProperties} replace />
                      }
                    />
                    <Route
                      path="/my-resources"
                      element={
                        <Navigate to={INTERNAL_ROUTES.myProperties} replace />
                      }
                    />
                    <Route
                      path="/properties/:id"
                      element={<LegacyPropertyDetailRedirect />}
                    />
                    <Route
                      path="/resources/:id"
                      element={<LegacyPropertyDetailRedirect />}
                    />
                    <Route
                      path="/crear-propiedad"
                      element={
                        <Navigate to={INTERNAL_ROUTES.createProperty} replace />
                      }
                    />
                    <Route
                      path="/crear-recurso"
                      element={
                        <Navigate to={INTERNAL_ROUTES.createProperty} replace />
                      }
                    />
                    <Route
                      path="/properties/new"
                      element={
                        <Navigate to={INTERNAL_ROUTES.createProperty} replace />
                      }
                    />
                    <Route
                      path="/resources/new"
                      element={
                        <Navigate to={INTERNAL_ROUTES.createProperty} replace />
                      }
                    />
                    <Route
                      path="/editar-propiedad/:id"
                      element={<LegacyEditPropertyRedirect />}
                    />
                    <Route
                      path="/editar-recurso/:id"
                      element={<LegacyEditPropertyRedirect />}
                    />
                    <Route
                      path="/properties/:id/edit"
                      element={<LegacyEditPropertyRedirect />}
                    />
                    <Route
                      path="/resources/:id/edit"
                      element={<LegacyEditPropertyRedirect />}
                    />
                    <Route
                      path="/leads"
                      element={<Navigate to={INTERNAL_ROUTES.leads} replace />}
                    />
                    <Route
                      path="/reservas"
                      element={
                        <Navigate to={INTERNAL_ROUTES.reservations} replace />
                      }
                    />
                    <Route
                      path="/reservations"
                      element={
                        <Navigate to={INTERNAL_ROUTES.reservations} replace />
                      }
                    />
                    <Route
                      path="/pagos"
                      element={
                        <Navigate to={INTERNAL_ROUTES.payments} replace />
                      }
                    />
                    <Route
                      path="/payments"
                      element={
                        <Navigate to={INTERNAL_ROUTES.payments} replace />
                      }
                    />
                    <Route
                      path="/resenas"
                      element={
                        <Navigate to={INTERNAL_ROUTES.reviews} replace />
                      }
                    />
                    <Route
                      path="/reviews"
                      element={
                        <Navigate to={INTERNAL_ROUTES.reviews} replace />
                      }
                    />
                    <Route
                      path="/clientes"
                      element={
                        <Navigate to={INTERNAL_ROUTES.clients} replace />
                      }
                    />
                    <Route
                      path="/clients"
                      element={
                        <Navigate to={INTERNAL_ROUTES.clients} replace />
                      }
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
                      element={
                        <Navigate to={INTERNAL_ROUTES.profile} replace />
                      }
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
                )}
              </Suspense>
              <Suspense fallback={null}>
                <ChatBubble />
              </Suspense>
            </ChatProvider>
          </ToastProvider>
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
