import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Lock, UserRound, Eye, EyeOff } from "lucide-react";
import { staffService, STAFF_ROLES } from "../services/staffService";
import { getErrorMessage } from "../utils/errors";
import {
  getPasswordChecks,
  getPasswordStrengthScore,
  isStrongPassword,
  isValidEmail,
} from "../utils/validation";

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800";

const Team = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "staff_support",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordChecks = useMemo(
    () => getPasswordChecks(form.password),
    [form.password]
  );
  const passwordScore = useMemo(
    () => getPasswordStrengthScore(form.password),
    [form.password]
  );

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      setError(t("teamPage.errors.fullName"));
      return;
    }

    if (!isValidEmail(form.email)) {
      setError(t("teamPage.errors.invalidEmail"));
      return;
    }

    if (!STAFF_ROLES.includes(form.role)) {
      setError(t("teamPage.errors.invalidRole"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("teamPage.errors.passwordMismatch"));
      return;
    }

    if (!isStrongPassword(form.password)) {
      setError(t("teamPage.errors.passwordWeak"));
      return;
    }

    setLoading(true);
    try {
      await staffService.createStaffUser({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });

      setSuccess(t("teamPage.messages.created"));
      setForm({
        fullName: "",
        email: "",
        role: "staff_support",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(getErrorMessage(err, t("teamPage.errors.create")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("teamPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("teamPage.subtitle")}
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <UserRound size={14} /> {t("teamPage.fields.fullName")}
          </span>
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
          <span className="inline-flex items-center gap-2">
            <Mail size={14} /> {t("teamPage.fields.email")}
          </span>
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
          <span>{t("teamPage.fields.role")}</span>
          <select
            required
            value={form.role}
            onChange={(event) => onChange("role", event.target.value)}
            className={inputClass}
          >
            <option value="staff_manager">{t("teamPage.roles.staff_manager")}</option>
            <option value="staff_editor">{t("teamPage.roles.staff_editor")}</option>
            <option value="staff_support">{t("teamPage.roles.staff_support")}</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Lock size={14} /> {t("teamPage.fields.password")}
          </span>
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
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
                {passwordChecks.hasMinLength ? "✓" : "○"} {t("passwordStrength.rules.minLength")}
              </li>
              <li>
                {passwordChecks.hasLower && passwordChecks.hasUpper ? "✓" : "○"} {t("passwordStrength.rules.upperLower")}
              </li>
              <li>
                {passwordChecks.hasNumber ? "✓" : "○"} {t("passwordStrength.rules.number")}
              </li>
              <li>
                {passwordChecks.hasSymbol ? "✓" : "○"} {t("passwordStrength.rules.symbol")}
              </li>
            </ul>
          </div>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Lock size={14} /> {t("teamPage.fields.confirmPassword")}
          </span>
          <div className="relative">
            <input
              required
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(event) => onChange("confirmPassword", event.target.value)}
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={
                showConfirmPassword ? t("passwordField.hide") : t("passwordField.show")
              }
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? t("teamPage.actions.creating") : t("teamPage.actions.create")}
        </button>
      </form>
    </section>
  );
};

export default Team;
