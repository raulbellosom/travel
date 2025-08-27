// src/routes/AppRoutes.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { UIProvider } from "../contexts/UIContext";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

// Pages
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <Routes>
            {/* Rutas públicas con MainLayout */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
            </Route>

            {/* Rutas de autenticación con AuthLayout */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            {/* Rutas protegidas con DashboardLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="listings" element={<Dashboard />} />
              <Route path="profile" element={<Dashboard />} />
            </Route>

            {/* Redirects */}
            <Route
              path="/login"
              element={<Navigate to="/auth/login" replace />}
            />
            <Route
              path="/register"
              element={<Navigate to="/auth/register" replace />}
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
