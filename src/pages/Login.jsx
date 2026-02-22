import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";
import { isInternalRole } from "../utils/roles";
import { INTERNAL_BASE_PATH } from "../utils/internalRoutes";
import {
  consumeRememberedAuthRedirectPath,
  rememberAuthRedirect,
  resolveAuthRedirectPath,
} from "../utils/authRedirect";

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800";

const Login = () => {
  const { t } = useTranslation();
  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  const authRedirectTarget = useMemo(
    () => resolveAuthRedirectPath({ location, searchParams }),
    [location, searchParams],
  );

  const authRedirectQuery = useMemo(
    () =>
      authRedirectTarget
        ? `?redirect=${encodeURIComponent(authRedirectTarget)}`
        : "",
    [authRedirectTarget],
  );

  useEffect(() => {
    rememberAuthRedirect({ location, searchParams });
  }, [location, searchParams]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setInfo("");
    setEmailNotVerified(false);

    try {
      const nextUser = await login(email, password);
      const target = isInternalRole(nextUser?.role)
        ? INTERNAL_BASE_PATH
        : consumeRememberedAuthRedirectPath("/");
      navigate(target, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, t("loginPage.errors.login"));
      setError(message);
      setEmailNotVerified(err?.code === "EMAIL_NOT_VERIFIED");
    } finally {
      setSubmitting(false);
    }
  };

  const onResendVerification = async () => {
    setResending(true);
    setError("");
    setInfo("");
    try {
      await resendVerification({ email });
      setInfo(t("loginPage.messages.resendSuccess"));
    } catch (err) {
      setError(getErrorMessage(err, t("loginPage.errors.resend")));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("loginPage.title")}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("loginPage.subtitle")}</p>
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2"><Mail size={14} /> {t("loginPage.fields.email")}</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2"><Lock size={14} /> {t("loginPage.fields.password")}</span>
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t("passwordField.hide") : t("passwordField.show")}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {info ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            {info}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? t("loginPage.actions.validating") : t("loginPage.actions.submit")}
          <ArrowRight size={14} />
        </button>
      </form>

      <div className="space-y-2 text-sm">
        {emailNotVerified ? (
          <button
            type="button"
            disabled={resending}
            onClick={onResendVerification}
            className="font-medium text-cyan-700 hover:underline disabled:opacity-70 dark:text-cyan-400"
          >
            {resending
              ? t("loginPage.actions.resending")
              : t("loginPage.actions.resendVerification")}
          </button>
        ) : null}
        <p>
          <Link to="/recuperar-password" className="text-cyan-700 hover:underline dark:text-cyan-400">
            {t("loginPage.links.forgotPassword")}
          </Link>
        </p>
        <p className="text-slate-600 dark:text-slate-300">
          {t("loginPage.links.noAccount")} {" "}
          <Link
            to={`/register${authRedirectQuery}`}
            state={{ from: location.state?.from || location }}
            className="font-medium text-cyan-700 hover:underline dark:text-cyan-400"
          >
            {t("loginPage.links.createAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
