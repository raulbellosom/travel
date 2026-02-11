import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { UIProvider } from "../contexts/UIContext";
import InternalRoute from "./InternalRoute";
import OwnerRoute from "./OwnerRoute";
import RootRoute from "./RootRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";
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
import CreateProperty from "../pages/CreateProperty";
import EditProperty from "../pages/EditProperty";
import Leads from "../pages/Leads";
import Clients from "../pages/Clients";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import UIDocsPage from "../pages/UIDocsPage";
import NotFound from "../pages/NotFound";
import BadRequest from "../pages/BadRequest";
import Forbidden from "../pages/Forbidden";
import ServerError from "../pages/ServerError";
import ServiceUnavailable from "../pages/ServiceUnavailable";
import ErrorsDemo from "../pages/ErrorsDemo";
import RootAmenitiesPanel from "../pages/RootAmenitiesPanel";
import env from "../env";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="propiedades/:slug" element={<PropertyDetail />} />
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
              <Route
                path="recuperar-password"
                element={
                  <PublicOnlyRoute>
                    <ForgotPassword />
                  </PublicOnlyRoute>
                }
              />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="verify-email" element={<VerifyEmail />} />
            </Route>

            <Route
              path="/"
              element={
                <InternalRoute>
                  <DashboardLayout />
                </InternalRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="mis-propiedades" element={<MyProperties />} />
              <Route path="crear-propiedad" element={<CreateProperty />} />
              <Route path="editar-propiedad/:id" element={<EditProperty />} />
              <Route path="leads" element={<Leads />} />
              <Route
                path="clientes"
                element={
                  <OwnerRoute>
                    <Clients />
                  </OwnerRoute>
                }
              />
              <Route path="perfil" element={<Profile />} />
              <Route path="configuracion" element={<Settings />} />
            </Route>

            <Route
              path={env.app.rootAmenitiesPath}
              element={
                <RootRoute>
                  <RootAmenitiesPanel />
                </RootRoute>
              }
            />
            {env.app.rootPanelPath !== env.app.rootAmenitiesPath ? (
              <Route
                path={env.app.rootPanelPath}
                element={<Navigate to={env.app.rootAmenitiesPath} replace />}
              />
            ) : null}

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
