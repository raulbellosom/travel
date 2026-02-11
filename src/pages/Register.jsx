import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserRound, Mail, Lock, Phone, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800";

const Register = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError(t("registerPage.errors.passwordMismatch"));
      return;
    }

    if (form.password.length < 8) {
      setError(t("registerPage.errors.passwordLength"));
      return;
    }

    if (!form.termsAccepted) {
      setError(t("registerPage.errors.termsRequired"));
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, {
        replace: true,
      });
    } catch (err) {
      setError(getErrorMessage(err, t("registerPage.errors.create")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("registerPage.title")}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("registerPage.subtitle")}
        </p>
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2"><UserRound size={14} /> {t("registerPage.fields.fullName")}</span>
          <input
            required
            minLength={3}
            value={form.fullName}
            autoComplete="name"
            onChange={(event) => onChange("fullName", event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2"><Mail size={14} /> {t("registerPage.fields.email")}</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => onChange("email", event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2"><Phone size={14} /> {t("registerPage.fields.phoneOptional")}</span>
          <input
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2"><Lock size={14} /> {t("registerPage.fields.password")}</span>
          <input
            required
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => onChange("password", event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2"><Lock size={14} /> {t("registerPage.fields.confirmPassword")}</span>
          <input
            required
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) => onChange("confirmPassword", event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.termsAccepted}
            onChange={(event) => onChange("termsAccepted", event.target.checked)}
          />
          {t("registerPage.fields.terms")}
        </label>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? t("registerPage.actions.creating") : t("registerPage.actions.submit")}
          <ArrowRight size={14} />
        </button>
      </form>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t("registerPage.links.hasAccount")} {" "}
        <Link to="/login" className="font-medium text-cyan-700 hover:underline dark:text-cyan-400">
          {t("registerPage.links.login")}
        </Link>
      </p>
    </div>
  );
};

export default Register;
