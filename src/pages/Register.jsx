import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserRound,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";
import Combobox from "../components/common/molecules/Combobox/Combobox";
import {
  getPasswordChecks,
  getPasswordStrengthScore,
  isStrongPassword,
  isValidEmail,
} from "../utils/validation";
import {
  getCountryDialCodeOptions,
  getOptionalPhonePairValidationCode,
  PHONE_VALIDATION_CODES,
  normalizePhoneDialCode,
  sanitizePhoneLocalNumber,
} from "../utils/phone";
import {
  rememberAuthRedirect,
  resolveAuthRedirectPath,
} from "../utils/authRedirect";

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800";

const Register = () => {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneCountryCode: "+52",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const authRedirectTarget = useMemo(
    () => resolveAuthRedirectPath({ location, searchParams }),
    [location, searchParams]
  );
  const authRedirectQuery = useMemo(
    () =>
      authRedirectTarget
        ? `?redirect=${encodeURIComponent(authRedirectTarget)}`
        : "",
    [authRedirectTarget]
  );

  useEffect(() => {
    rememberAuthRedirect({ location, searchParams });
  }, [location, searchParams]);

  const passwordChecks = useMemo(
    () => getPasswordChecks(form.password),
    [form.password]
  );
  const passwordScore = useMemo(
    () => getPasswordStrengthScore(form.password),
    [form.password]
  );
  const countryDialCodeOptions = useMemo(
    () => getCountryDialCodeOptions(i18n.language),
    [i18n.language]
  );
  const phoneValidationCode = useMemo(
    () =>
      getOptionalPhonePairValidationCode({
        dialCode: form.phoneCountryCode,
        localNumber: form.phone,
      }),
    [form.phone, form.phoneCountryCode]
  );
  const phoneValidationMessage = useMemo(() => {
    if (phoneValidationCode === PHONE_VALIDATION_CODES.NONE) return "";
    if (phoneValidationCode === PHONE_VALIDATION_CODES.DIAL_CODE_REQUIRED) {
      return t("registerPage.errors.phoneCountryCodeRequired");
    }
    return t("registerPage.errors.invalidPhone");
  }, [phoneValidationCode, t]);

  const onChange = (field, value) => {
    if (error) {
      setError("");
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!String(form.firstName || "").trim()) {
      setError(t("registerPage.errors.firstNameRequired"));
      return;
    }

    if (!String(form.lastName || "").trim()) {
      setError(t("registerPage.errors.lastNameRequired"));
      return;
    }

    if (!isValidEmail(form.email)) {
      setError(t("registerPage.errors.invalidEmail"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("registerPage.errors.passwordMismatch"));
      return;
    }

    if (!isStrongPassword(form.password)) {
      setError(t("registerPage.errors.passwordWeak"));
      return;
    }

    if (!form.termsAccepted) {
      setError(t("registerPage.errors.termsRequired"));
      return;
    }

    const normalizedPhone = sanitizePhoneLocalNumber(form.phone);
    const normalizedPhoneDialCode = normalizePhoneDialCode(form.phoneCountryCode);
    if (phoneValidationCode !== PHONE_VALIDATION_CODES.NONE) {
      setError(phoneValidationMessage || t("registerPage.errors.invalidPhone"));
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email,
        phoneCountryCode: normalizedPhone ? normalizedPhoneDialCode : "",
        phone: normalizedPhone,
        password: form.password,
      });
      const verifyEmailParams = new URLSearchParams({
        email: form.email,
      });
      if (authRedirectTarget) {
        verifyEmailParams.set("redirect", authRedirectTarget);
      }
      navigate(`/verify-email?${verifyEmailParams.toString()}`, {
        replace: true,
        state: { from: location.state?.from || location },
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
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="inline-flex items-center gap-2"><UserRound size={14} /> {t("registerPage.fields.firstName")}</span>
            <input
              required
              minLength={2}
              value={form.firstName}
              autoComplete="given-name"
              onChange={(event) => onChange("firstName", event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="inline-flex items-center gap-2"><UserRound size={14} /> {t("registerPage.fields.lastName")}</span>
            <input
              required
              minLength={2}
              value={form.lastName}
              autoComplete="family-name"
              onChange={(event) => onChange("lastName", event.target.value)}
              className={inputClass}
            />
          </label>
        </div>

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

        <div className="grid gap-2 text-sm">
          <span className="inline-flex items-center gap-2"><Phone size={14} /> {t("registerPage.fields.phoneOptional")}</span>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
            <label className="grid gap-1 text-sm">
              <span>{t("registerPage.fields.phoneCountryCode")}</span>
              <Combobox
                options={countryDialCodeOptions}
                value={form.phoneCountryCode}
                onChange={(value) => onChange("phoneCountryCode", value || "")}
                placeholder={t("registerPage.placeholders.phoneCountryCode")}
                noResultsText={t("registerPage.placeholders.noCountryCodeResults")}
                inputClassName={inputClass}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("registerPage.fields.phoneNumberOptional")}</span>
              <input
                type="tel"
                autoComplete="tel-national"
                inputMode="numeric"
                value={form.phone}
                onChange={(event) =>
                  onChange("phone", sanitizePhoneLocalNumber(event.target.value))
                }
                className={inputClass}
                placeholder={t("registerPage.placeholders.phoneNumber")}
              />
            </label>
          </div>
          {phoneValidationMessage ? (
            <p className="text-xs text-red-600 dark:text-red-300">{phoneValidationMessage}</p>
          ) : null}
        </div>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2"><Lock size={14} /> {t("registerPage.fields.password")}</span>
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
          <span className="inline-flex items-center gap-2"><Lock size={14} /> {t("registerPage.fields.confirmPassword")}</span>
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
              aria-label={showConfirmPassword ? t("passwordField.hide") : t("passwordField.show")}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
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
          disabled={loading || Boolean(phoneValidationMessage)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? t("registerPage.actions.creating") : t("registerPage.actions.submit")}
          <ArrowRight size={14} />
        </button>
      </form>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t("registerPage.links.hasAccount")} {" "}
        <Link
          to={`/login${authRedirectQuery}`}
          state={{ from: location.state?.from || location }}
          className="font-medium text-cyan-700 hover:underline dark:text-cyan-400"
        >
          {t("registerPage.links.login")}
        </Link>
      </p>
    </div>
  );
};

export default Register;

