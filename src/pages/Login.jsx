import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const nav = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });

  const onSubmit = async (e) => {
    e.preventDefault();
    await login(form.email, form.password);
    nav(state?.from?.pathname || "/dashboard", { replace: true });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("auth.login.title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t("auth.login.subtitle")}
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("auth.login.email")}
          </label>
          <input
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={t("auth.login.email")}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("auth.login.password")}
          </label>
          <input
            type="password"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={t("auth.login.password")}
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {t("auth.login.submit")}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("auth.login.demo")}
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("auth.login.noAccount")}{" "}
            <Link
              to="/auth/register"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {t("auth.login.createAccount")}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
