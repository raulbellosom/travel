import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";
import { useAuth } from "../../hooks/useAuth";
import BrandLogo from "../common/BrandLogo";
import LanguageSwitcher from "../common/organisms/Navbar/LanguageSwitcher";
import ThemeToggle from "../common/organisms/Navbar/ThemeToggle";
import UserDropdown from "../common/organisms/Navbar/UserDropdown";

const PublicNavbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    {
      name: t("nav.realEstate", "Bienes Raíces"),
      path: "/propiedades?type=sale",
      hasDropdown: true,
    },
    {
      name: t("nav.vacation", "Rentas Vacacionales"),
      path: "/propiedades?type=vacation_rental",
      hasDropdown: true,
    },
  ];

  const onLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg py-3"
          : "bg-transparent py-5",
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 relative z-50">
            <BrandLogo className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group px-3 py-2">
                <Link
                  to={link.path}
                  className={cn(
                    "flex items-center gap-1 text-sm font-semibold transition-colors",
                    isScrolled
                      ? "text-slate-700 hover:text-cyan-600 dark:text-slate-200 dark:hover:text-cyan-400"
                      : "text-white/90 hover:text-white",
                  )}
                >
                  {link.name}
                  {link.hasDropdown && (
                    <ChevronDown
                      size={14}
                      className="opacity-70 group-hover:rotate-180 transition-transform"
                    />
                  )}
                </Link>
                {/* Dropdown Placeholder */}
                {link.hasDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden py-1">
                      <Link
                        to={link.path}
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        {t("common.viewAll", "Ver todos")}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />

            {user ? (
              <UserDropdown user={user} onLogout={onLogout} />
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all text-sm",
                    isScrolled
                      ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      : "bg-white text-slate-900 hover:bg-slate-100 shadow-md",
                  )}
                >
                  <LogIn size={18} />
                  <span>{t("nav.login", "Iniciar Sesión")}</span>
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg hover:shadow-cyan-500/30 hover:scale-105 transition-all active:scale-95"
                >
                  {t("nav.register", "Registrarse")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              "lg:hidden p-2 relative z-50 rounded-lg transition-colors",
              isScrolled || isMobileMenuOpen
                ? "text-slate-800 dark:text-white"
                : "text-white",
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white dark:bg-slate-900 pt-24 px-6 overflow-y-auto lg:hidden"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-2xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4"
                >
                  {link.name}
                </Link>
              ))}

              {/* Language & Theme in mobile */}
              <div className="flex items-center gap-3 py-2">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>

              <div className="flex flex-col gap-4 mt-4">
                {user ? (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {user?.name ||
                          t("navbar.userMenu.defaultUser", "Usuario")}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      to="/perfil"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white font-bold text-center"
                    >
                      {t("navbar.userMenu.profile", "Editar Perfil")}
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-3 bg-cyan-500 rounded-xl text-white font-bold text-center"
                    >
                      {t("nav.dashboard", "Mi Panel")}
                    </Link>
                    <button
                      onClick={onLogout}
                      className="w-full py-3 border border-rose-300 rounded-xl text-rose-600 font-bold text-center"
                    >
                      {t("nav.logout", "Cerrar Sesión")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white font-bold text-center flex items-center justify-center gap-2"
                    >
                      <LogIn size={20} /> {t("nav.login", "Iniciar Sesión")}
                    </Link>
                    <Link
                      to="/register"
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-bold text-center"
                    >
                      {t("nav.register", "Registrarse")}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default PublicNavbar;
