import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  PencilLine,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Combobox from "../components/common/molecules/Combobox/Combobox";
import { getErrorMessage } from "../utils/errors";
import {
  formatPhoneForDisplay,
  getCountryDialCodeOptions,
  isValidPhoneCombination,
  isValidPhoneDialCode,
  isValidPhoneLocalNumber,
  normalizePhoneDialCode,
  sanitizePhoneLocalNumber,
  splitE164Phone,
} from "../utils/phone";

const PROFILE_TEXT_FIELDS = [
  "firstName",
  "lastName",
  "companyName",
  "websiteUrl",
  "facebookUrl",
  "instagramUrl",
];

const PROFILE_EDIT_KEYS = [
  ...PROFILE_TEXT_FIELDS,
  "phoneCountryCode",
  "phone",
  "whatsappCountryCode",
  "whatsappNumber",
  "bio",
];

const PREFERENCE_KEYS = [
  "theme",
  "locale",
  "currency",
  "measurementSystem",
  "notificationsEmail",
];

const MAX_AVATAR_SIZE_MB = 5;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50";

const splitFullName = (value) => {
  const normalized = String(value || "").trim().replace(/\s+/g, " ");
  if (!normalized) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = normalized.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
  };
};

const buildProfileFormFromSources = ({ profile, user }) => {
  const parsedName = splitFullName(user?.name);
  const authPhoneParts = splitE164Phone(user?.phone || "");
  const profilePhoneRaw = String(profile?.phone || "").trim();
  const profilePhoneParts = profilePhoneRaw.startsWith("+")
    ? splitE164Phone(profilePhoneRaw)
    : { dialCode: "", localNumber: "" };

  const whatsappRaw = String(profile?.whatsappNumber || "").trim();
  const whatsappParts = whatsappRaw.startsWith("+")
    ? splitE164Phone(whatsappRaw)
    : { dialCode: "", localNumber: "" };

  const phoneCountryCode = normalizePhoneDialCode(
    profile?.phoneCountryCode ||
      profilePhoneParts.dialCode ||
      authPhoneParts.dialCode ||
      "+52"
  );

  const phone = sanitizePhoneLocalNumber(
    profilePhoneRaw.startsWith("+")
      ? profilePhoneParts.localNumber
      : profile?.phone || authPhoneParts.localNumber || ""
  );

  return {
    firstName: profile?.firstName || parsedName.firstName || "",
    lastName: profile?.lastName || parsedName.lastName || "",
    phoneCountryCode,
    phone,
    whatsappCountryCode: normalizePhoneDialCode(
      profile?.whatsappCountryCode || whatsappParts.dialCode || phoneCountryCode
    ),
    whatsappNumber: sanitizePhoneLocalNumber(
      whatsappRaw.startsWith("+")
        ? whatsappParts.localNumber
        : profile?.whatsappNumber || ""
    ),
    companyName: profile?.companyName || "",
    bio: profile?.bio || "",
    websiteUrl: profile?.websiteUrl || "",
    facebookUrl: profile?.facebookUrl || "",
    instagramUrl: profile?.instagramUrl || "",
  };
};

const buildPreferencesForm = (preferences) => ({
  theme: preferences?.theme || "system",
  locale: preferences?.locale || "es",
  currency: preferences?.currency || "MXN",
  measurementSystem: preferences?.measurementSystem || "metric",
  notificationsEmail: preferences?.notificationsEmail ?? true,
});

const hasChanged = (current, initial, keys) =>
  keys.some((key) => {
    const currentValue = current?.[key];
    const initialValue = initial?.[key];

    if (typeof currentValue === "boolean" || typeof initialValue === "boolean") {
      return Boolean(currentValue) !== Boolean(initialValue);
    }

    return String(currentValue ?? "").trim() !== String(initialValue ?? "").trim();
  });

const Profile = () => {
  const { t, i18n } = useTranslation();
  const {
    user,
    profile,
    preferences,
    updateProfile,
    updatePreferences,
    updateAvatar,
    removeAvatar,
  } = useAuth();

  const [profileForm, setProfileForm] = useState(() =>
    buildProfileFormFromSources({ profile: null, user: null })
  );
  const [initialProfileForm, setInitialProfileForm] = useState(() =>
    buildProfileFormFromSources({ profile: null, user: null })
  );
  const [preferencesForm, setPreferencesForm] = useState(() => buildPreferencesForm(null));
  const [initialPreferencesForm, setInitialPreferencesForm] = useState(() =>
    buildPreferencesForm(null)
  );

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const countryDialCodeOptions = useMemo(
    () => getCountryDialCodeOptions(i18n.language),
    [i18n.language]
  );

  useEffect(() => {
    const nextProfileForm = buildProfileFormFromSources({
      profile,
      user: { name: user?.name || "", phone: user?.phone || "" },
    });
    const nextPreferencesForm = buildPreferencesForm(preferences);

    setProfileForm(nextProfileForm);
    setInitialProfileForm(nextProfileForm);
    setPreferencesForm(nextPreferencesForm);
    setInitialPreferencesForm(nextPreferencesForm);
    setIsEditingProfile(false);
  }, [preferences, profile, user?.name, user?.phone]);

  const fullName = useMemo(() => {
    const value = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    return value || user?.name || t("profilePage.summary.defaultName") || "User";
  }, [profileForm.firstName, profileForm.lastName, t, user?.name]);

  const initials = useMemo(() => {
    const base = fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
    return base || "IM";
  }, [fullName]);

  const hasProfileChanges = useMemo(
    () => hasChanged(profileForm, initialProfileForm, PROFILE_EDIT_KEYS),
    [profileForm, initialProfileForm]
  );
  const hasPreferencesChanges = useMemo(
    () => hasChanged(preferencesForm, initialPreferencesForm, PREFERENCE_KEYS),
    [preferencesForm, initialPreferencesForm]
  );

  const onSaveProfile = async (event) => {
    event.preventDefault();
    if (!hasProfileChanges) return;

    const phone = sanitizePhoneLocalNumber(profileForm.phone);
    const phoneCountryCode = normalizePhoneDialCode(profileForm.phoneCountryCode);
    const whatsappNumber = sanitizePhoneLocalNumber(profileForm.whatsappNumber);
    const whatsappCountryCode = normalizePhoneDialCode(profileForm.whatsappCountryCode);

    if (phone) {
      if (
        !isValidPhoneLocalNumber(phone) ||
        !isValidPhoneDialCode(phoneCountryCode) ||
        !isValidPhoneCombination({ dialCode: phoneCountryCode, localNumber: phone })
      ) {
        setError(t("profilePage.errors.invalidPhone"));
        return;
      }
    }

    if (whatsappNumber) {
      if (
        !isValidPhoneLocalNumber(whatsappNumber) ||
        !isValidPhoneDialCode(whatsappCountryCode) ||
        !isValidPhoneCombination({
          dialCode: whatsappCountryCode,
          localNumber: whatsappNumber,
        })
      ) {
        setError(t("profilePage.errors.invalidWhatsapp"));
        return;
      }
    }

    const nextProfile = {
      ...profileForm,
      phone,
      phoneCountryCode: phone ? phoneCountryCode : "",
      whatsappNumber,
      whatsappCountryCode: whatsappNumber ? whatsappCountryCode : "",
    };

    setSavingProfile(true);
    setError("");
    setMessage("");

    try {
      await updateProfile(nextProfile);
      setProfileForm(nextProfile);
      setInitialProfileForm(nextProfile);
      setIsEditingProfile(false);
      setMessage(t("profilePage.messages.profileSaved"));
    } catch (err) {
      setError(getErrorMessage(err, t("profilePage.errors.profile")));
    } finally {
      setSavingProfile(false);
    }
  };

  const onCancelProfileEdit = () => {
    setProfileForm(initialProfileForm);
    setIsEditingProfile(false);
    setError("");
    setMessage("");
  };

  const onSavePreferences = async (event) => {
    event.preventDefault();
    if (!hasPreferencesChanges) return;

    setSavingPreferences(true);
    setError("");
    setMessage("");

    try {
      await updatePreferences(preferencesForm);
      setInitialPreferencesForm(preferencesForm);
      setMessage(t("profilePage.messages.preferencesSaved"));
    } catch (err) {
      setError(getErrorMessage(err, t("profilePage.errors.preferences")));
    } finally {
      setSavingPreferences(false);
    }
  };

  const onAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setError(t("profilePage.errors.avatarSize", { max: MAX_AVATAR_SIZE_MB }));
      return;
    }

    setUploadingAvatar(true);
    setError("");
    setMessage("");
    try {
      await updateAvatar(file);
      setMessage(t("profilePage.messages.avatarUpdated"));
    } catch (err) {
      setError(getErrorMessage(err, t("profilePage.errors.avatarUpload")));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onRemoveAvatar = async () => {
    setRemovingAvatar(true);
    setError("");
    setMessage("");
    try {
      await removeAvatar();
      setMessage(t("profilePage.messages.avatarRemoved"));
    } catch (err) {
      setError(getErrorMessage(err, t("profilePage.errors.avatarRemove")));
    } finally {
      setRemovingAvatar(false);
    }
  };

  const phoneDisplay = formatPhoneForDisplay({
    dialCode: profileForm.phoneCountryCode,
    localNumber: profileForm.phone,
  });

  const whatsappDisplay = formatPhoneForDisplay({
    dialCode: profileForm.whatsappCountryCode,
    localNumber: profileForm.whatsappNumber,
  });

  return (
    <section className="space-y-6">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={fullName}
                  className="h-20 w-20 rounded-full border border-slate-200 object-cover shadow-md dark:border-slate-700"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-xl font-black text-white shadow-md">
                  {initials}
                </div>
              )}

              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-slate-600 shadow dark:bg-slate-800 dark:text-slate-200">
                  <Camera size={14} />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={onAvatarChange}
                    disabled={uploadingAvatar || removingAvatar}
                    className="hidden"
                  />
                </label>
                {user?.avatarUrl ? (
                  <button
                    type="button"
                    onClick={onRemoveAvatar}
                    disabled={uploadingAvatar || removingAvatar}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-600 shadow hover:bg-rose-50 dark:bg-slate-800"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{fullName}</h1>
              <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Mail size={14} /> {user?.email}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <ShieldCheck size={12} />
                {user?.emailVerified ? t("profilePage.emailVerified") : t("profilePage.emailNotVerified")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEditingProfile(true);
              setError("");
              setMessage("");
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <PencilLine size={14} />
            {t("profilePage.actions.editProfile")}
          </button>
        </div>
      </article>

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 size={14} className="mr-2 inline" />
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle size={14} className="mr-2 inline" />
          {error}
        </p>
      ) : null}

      <form onSubmit={onSaveProfile} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
        {PROFILE_TEXT_FIELDS.map((key) => (
          <label key={key} className="grid gap-1 text-sm">
            <span>{t(`profilePage.fields.${key}`)}</span>
            {isEditingProfile ? (
              <input
                value={profileForm[key]}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, [key]: event.target.value }))
                }
                className={inputClass}
              />
            ) : (
              <span className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                {String(profileForm[key] || "").trim() || t("profilePage.view.empty")}
              </span>
            )}
          </label>
        ))}

        <div className="grid gap-1 text-sm">
          <span>{t("profilePage.fields.phone")}</span>
          {isEditingProfile ? (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
              <Combobox
                options={countryDialCodeOptions}
                value={profileForm.phoneCountryCode}
                onChange={(value) =>
                  setProfileForm((prev) => ({ ...prev, phoneCountryCode: value || "" }))
                }
                placeholder={t("profilePage.placeholders.phoneCountryCode")}
                noResultsText={t("profilePage.placeholders.noCountryCodeResults")}
                inputClassName={inputClass}
              />
              <input
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phone: sanitizePhoneLocalNumber(event.target.value),
                  }))
                }
                placeholder={t("profilePage.placeholders.phoneNumber")}
                className={inputClass}
              />
            </div>
          ) : (
            <span className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
              {phoneDisplay || t("profilePage.view.empty")}
            </span>
          )}
        </div>

        <div className="grid gap-1 text-sm">
          <span>{t("profilePage.fields.whatsappNumber")}</span>
          {isEditingProfile ? (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
              <Combobox
                options={countryDialCodeOptions}
                value={profileForm.whatsappCountryCode}
                onChange={(value) =>
                  setProfileForm((prev) => ({ ...prev, whatsappCountryCode: value || "" }))
                }
                placeholder={t("profilePage.placeholders.phoneCountryCode")}
                noResultsText={t("profilePage.placeholders.noCountryCodeResults")}
                inputClassName={inputClass}
              />
              <input
                value={profileForm.whatsappNumber}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    whatsappNumber: sanitizePhoneLocalNumber(event.target.value),
                  }))
                }
                placeholder={t("profilePage.placeholders.whatsappNumber")}
                className={inputClass}
              />
            </div>
          ) : (
            <span className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
              {whatsappDisplay || t("profilePage.view.empty")}
            </span>
          )}
        </div>

        <label className="grid gap-1 text-sm md:col-span-2">
          <span>{t("profilePage.fields.bio")}</span>
          {isEditingProfile ? (
            <textarea
              rows={4}
              value={profileForm.bio}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, bio: event.target.value }))
              }
              className={inputClass}
            />
          ) : (
            <span className="min-h-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
              {String(profileForm.bio || "").trim() || t("profilePage.view.empty")}
            </span>
          )}
        </label>

        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button
            type="button"
            onClick={onCancelProfileEdit}
            disabled={!isEditingProfile || savingProfile}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t("profilePage.actions.cancelEdit")}
          </button>

          <button
            type="submit"
            disabled={!isEditingProfile || !hasProfileChanges || savingProfile}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {savingProfile ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
            {savingProfile ? t("profilePage.actions.saving") : t("profilePage.actions.saveProfile")}
          </button>
        </div>
      </form>

      <form onSubmit={onSavePreferences} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 md:col-span-2">
          {t("profilePage.sections.preferences")}
        </h2>

        <label className="grid gap-1 text-sm">
          <span>{t("profilePage.preferences.theme")}</span>
          <select
            value={preferencesForm.theme}
            onChange={(event) =>
              setPreferencesForm((prev) => ({ ...prev, theme: event.target.value }))
            }
            className={inputClass}
          >
            <option value="system">{t("theme.system")}</option>
            <option value="light">{t("theme.light")}</option>
            <option value="dark">{t("theme.dark")}</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span>{t("profilePage.preferences.language")}</span>
          <select
            value={preferencesForm.locale}
            onChange={(event) =>
              setPreferencesForm((prev) => ({ ...prev, locale: event.target.value }))
            }
            className={inputClass}
          >
            <option value="es">{t("language.spanish")}</option>
            <option value="en">{t("language.english")}</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={!hasPreferencesChanges || savingPreferences}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
        >
          {savingPreferences ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
          {savingPreferences ? t("profilePage.actions.saving") : t("profilePage.actions.savePreferences")}
        </button>
      </form>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 font-semibold text-slate-900 dark:text-slate-100">{t("profilePage.security.title")}</p>
        <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">{t("profilePage.security.subtitle")}</p>
        <Link
          to="/recuperar-password"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <KeyRound size={14} />
          {t("profilePage.security.action")}
        </Link>
      </article>
    </section>
  );
};

export default Profile;
