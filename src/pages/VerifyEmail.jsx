import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";
import {
  rememberAuthRedirect,
  resolveAuthRedirectPath,
} from "../utils/authRedirect";

const VerifyEmail = () => {
  const { t } = useTranslation();
  const { verifyEmail, resendVerification } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const userId = searchParams.get("userId") || "";
  const secret = searchParams.get("secret") || "";
  const email = searchParams.get("email") || "";

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  const authRedirectTarget = resolveAuthRedirectPath({ location, searchParams });

  const authRedirectQuery = authRedirectTarget
    ? `?redirect=${encodeURIComponent(authRedirectTarget)}`
    : "";

  const hasVerificationPayload = Boolean(token || (userId && secret));

  useEffect(() => {
    rememberAuthRedirect({ location, searchParams });
  }, [location, searchParams]);

  useEffect(() => {
    if (!hasVerificationPayload) return;

    let mounted = true;
    setStatus("loading");
    setMessage(t("verifyEmailPage.messages.validating"));

    verifyEmail({ token, userId, secret })
      .then(() => {
        if (!mounted) return;
        setStatus("success");
        setMessage(t("verifyEmailPage.messages.success"));
      })
      .catch((err) => {
        if (!mounted) return;
        setStatus("error");
        setMessage(getErrorMessage(err, t("verifyEmailPage.errors.verify")));
      });

    return () => {
      mounted = false;
    };
  }, [hasVerificationPayload, secret, t, token, userId, verifyEmail]);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification({ email });
      setStatus("success");
      setMessage(t("verifyEmailPage.messages.resendSuccess"));
    } catch (err) {
      setStatus("error");
      setMessage(getErrorMessage(err, t("verifyEmailPage.errors.resend")));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("verifyEmailPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("verifyEmailPage.subtitle")}
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/40">
        {status === "loading" ? (
          <p>{message}</p>
        ) : null}

        {status === "success" ? (
          <p className="text-emerald-700 dark:text-emerald-300">{message}</p>
        ) : null}

        {status === "error" ? (
          <p className="text-red-700 dark:text-red-300">{message}</p>
        ) : null}

        {!hasVerificationPayload && !message ? (
          <p>
            {t("verifyEmailPage.messages.instructions")}
          </p>
        ) : null}
      </div>

      {email ? (
        <button
          type="button"
          disabled={resending}
          onClick={handleResend}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {resending ? t("verifyEmailPage.actions.resending") : t("verifyEmailPage.actions.resend")}
        </button>
      ) : null}

      <p className="text-sm text-slate-600 dark:text-slate-300">
        <Link
          to={`/login${authRedirectQuery}`}
          state={{ from: location.state?.from || location }}
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
        >
          {t("verifyEmailPage.links.toLogin")}
        </Link>
      </p>
    </div>
  );
};

export default VerifyEmail;
