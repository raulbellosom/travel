import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../utils/errors";
import {
  getPasswordChecks,
  getPasswordStrengthScore,
  isStrongPassword,
} from "../utils/validation";

const ResetPassword = () => {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordScore = useMemo(
    () => getPasswordStrengthScore(password),
    [password],
  );
  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;

  const canSubmit = useMemo(() => Boolean(token), [token]);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!isStrongPassword(password)) {
      showToast({
        type: "warning",
        message: t(
          "resetPasswordPage.errors.passwordWeak",
          t("registerPage.errors.passwordWeak"),
        ),
      });
      return;
    }

    if (password !== confirmPassword) {
      showToast({
        type: "warning",
        message: t("resetPasswordPage.errors.passwordMismatch"),
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, password });
      showToast({
        type: "success",
        title: t(
          "resetPasswordPage.messages.successTitle",
          "Contraseña actualizada",
        ),
        message: t("resetPasswordPage.messages.success"),
      });
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      showToast({
        type: "error",
        title: t(
          "resetPasswordPage.errors.updateTitle",
          "Error al cambiar contraseña",
        ),
        message: getErrorMessage(err, t("resetPasswordPage.errors.update")),
      });
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
        <Link
          to="/recuperar-password"
          className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
        >
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
          <span className="inline-flex items-center gap-2">
            <Lock size={14} /> {t("resetPasswordPage.fields.password")}
          </span>
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-11 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? t("passwordField.hide") : t("passwordField.show")
              }
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Strength meter — only shown once user starts typing */}
          {password.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 rounded-full ${
                      passwordScore >= step
                        ? passwordScore <= 2
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t(`passwordStrength.levels.${passwordScore}`)}
              </p>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <li>
                  {passwordChecks.hasMinLength ? "✓" : "○"}{" "}
                  {t("passwordStrength.rules.minLength")}
                </li>
                <li>
                  {passwordChecks.hasLower && passwordChecks.hasUpper
                    ? "✓"
                    : "○"}{" "}
                  {t("passwordStrength.rules.upperLower")}
                </li>
                <li>
                  {passwordChecks.hasNumber ? "✓" : "○"}{" "}
                  {t("passwordStrength.rules.number")}
                </li>
                <li>
                  {passwordChecks.hasSymbol ? "✓" : "○"}{" "}
                  {t("passwordStrength.rules.symbol")}
                </li>
              </ul>
            </div>
          )}
        </label>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Lock size={14} /> {t("resetPasswordPage.fields.confirmPassword")}
          </span>
          <div className="relative">
            <input
              required
              type={showConfirmPassword ? "text" : "password"}
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-11 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={
                showConfirmPassword
                  ? t("passwordField.hide")
                  : t("passwordField.show")
              }
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {!passwordsMatch && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {t("resetPasswordPage.errors.passwordMismatch")}
            </p>
          )}
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading
            ? t("resetPasswordPage.actions.updating")
            : t("resetPasswordPage.actions.submit")}
        </button>
      </form>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        <Link
          to="/login"
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
        >
          {t("resetPasswordPage.links.backToLogin")}
        </Link>
      </p>
    </div>
  );
};

export default ResetPassword;
