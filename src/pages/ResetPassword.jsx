import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";

const ResetPassword = () => {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const secret = searchParams.get("secret") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => Boolean(userId && secret), [secret, userId]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError(t("resetPasswordPage.errors.passwordLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("resetPasswordPage.errors.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ userId, secret, password });
      setSuccess(t("resetPasswordPage.messages.success"));
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(getErrorMessage(err, t("resetPasswordPage.errors.update")));
    } finally {
      setLoading(false);
    }
  };

  if (!canSubmit) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("resetPasswordPage.invalid.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("resetPasswordPage.invalid.subtitle")}
        </p>
        <Link to="/recuperar-password" className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400">
          {t("resetPasswordPage.invalid.action")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("resetPasswordPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("resetPasswordPage.subtitle")}
        </p>
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm">
          <span>{t("resetPasswordPage.fields.password")}</span>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>{t("resetPasswordPage.fields.confirmPassword")}</span>
          <input
            required
            type="password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
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
          {loading ? t("resetPasswordPage.actions.updating") : t("resetPasswordPage.actions.submit")}
        </button>
      </form>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        <Link to="/login" className="font-medium text-sky-700 hover:underline dark:text-sky-400">
          {t("resetPasswordPage.links.backToLogin")}
        </Link>
      </p>
    </div>
  );
};

export default ResetPassword;

