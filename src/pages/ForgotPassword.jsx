import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { requestPasswordRecovery } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await requestPasswordRecovery(email);
      setSuccess(t("forgotPasswordPage.messages.success"));
    } catch (err) {
      setError(getErrorMessage(err, t("forgotPasswordPage.errors.request")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("forgotPasswordPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("forgotPasswordPage.subtitle")}
        </p>
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm">
          <span>{t("forgotPasswordPage.fields.email")}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
          />
        </label>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? t("forgotPasswordPage.actions.sending") : t("forgotPasswordPage.actions.submit")}
        </button>
      </form>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        <Link to="/login" className="font-medium text-sky-700 hover:underline dark:text-sky-400">
          {t("forgotPasswordPage.links.backToLogin")}
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;

