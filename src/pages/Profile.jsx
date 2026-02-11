import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Camera,
  KeyRound,
  Mail,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";

const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "whatsappNumber",
  "companyName",
  "websiteUrl",
  "facebookUrl",
  "instagramUrl",
];

const PROFILE_NAV_KEYS = [
  "personalInfo",
  "address",
  "preferences",
  "emergencyContact",
  "identity",
  "privacyNotifications",
];

const MAX_AVATAR_SIZE_MB = 5;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const Profile = () => {
  const { t } = useTranslation();
  const {
    user,
    profile,
    preferences,
    updateProfile,
    updatePreferences,
    updateAvatar,
    removeAvatar,
  } = useAuth();
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    whatsappNumber: "",
    companyName: "",
    bio: "",
    websiteUrl: "",
    facebookUrl: "",
    instagramUrl: "",
  });
  const [preferencesForm, setPreferencesForm] = useState({
    theme: "system",
    locale: "es",
    currency: "MXN",
    measurementSystem: "metric",
    notificationsEmail: true,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setProfileForm({
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      phone: profile?.phone || "",
      whatsappNumber: profile?.whatsappNumber || "",
      companyName: profile?.companyName || "",
      bio: profile?.bio || "",
      websiteUrl: profile?.websiteUrl || "",
      facebookUrl: profile?.facebookUrl || "",
      instagramUrl: profile?.instagramUrl || "",
    });

    setPreferencesForm({
      theme: preferences?.theme || "system",
      locale: preferences?.locale || "es",
      currency: preferences?.currency || "MXN",
      measurementSystem: preferences?.measurementSystem || "metric",
      notificationsEmail: preferences?.notificationsEmail ?? true,
    });
  }, [preferences, profile]);

  const fullName = useMemo(() => {
    const value = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    return value || user?.name || t("profilePage.summary.defaultName");
  }, [profileForm.firstName, profileForm.lastName, t, user?.name]);

  const initials = useMemo(() => {
    const base = fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
    return base || "RE";
  }, [fullName]);

  const completeness = useMemo(() => {
    const values = [
      profileForm.firstName,
      profileForm.lastName,
      profileForm.phone,
      profileForm.companyName,
      profileForm.bio,
      profileForm.websiteUrl,
    ];
    const filled = values.filter((item) => String(item || "").trim().length > 0).length;
    return Math.round((filled / values.length) * 100);
  }, [profileForm]);

  const onSaveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setError("");
    setMessage("");
    try {
      await updateProfile(profileForm);
      setMessage(t("profilePage.messages.profileSaved"));
    } catch (err) {
      setError(getErrorMessage(err, t("profilePage.errors.profile")));
    } finally {
      setSavingProfile(false);
    }
  };

  const onSavePreferences = async (event) => {
    event.preventDefault();
    setSavingPreferences(true);
    setError("");
    setMessage("");
    try {
      await updatePreferences(preferencesForm);
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
      setError(
        t("profilePage.errors.avatarSize", {
          max: MAX_AVATAR_SIZE_MB,
        })
      );
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

  return (
    <section className="space-y-6">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2 text-center">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={fullName}
                  className="h-20 w-20 rounded-full border border-slate-200 object-cover shadow-md dark:border-slate-700"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-xl font-black text-white shadow-md">
                  {initials}
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-1 rounded-xl border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Camera size={12} />
                  {uploadingAvatar
                    ? t("profilePage.actions.uploadingAvatar")
                    : t("profilePage.actions.uploadAvatar")}
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
                    className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 size={12} />
                    {removingAvatar
                      ? t("profilePage.actions.removingAvatar")
                      : t("profilePage.actions.removeAvatar")}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{fullName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <ShieldCheck size={12} /> {user?.emailVerified ? t("profilePage.emailVerified") : t("profilePage.emailNotVerified")}
                </span>
              </div>

              <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Mail size={14} /> {user?.email}
              </p>
              <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <MapPin size={14} /> {t("profilePage.summary.location")}
              </p>
            </div>
          </div>

          <div className="min-w-[220px] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              <span>{t("profilePage.summary.profileProgress")}</span>
              <span>{completeness}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-600" style={{ width: `${completeness}%` }} />
            </div>
          </div>
        </div>
      </article>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">{t("profilePage.sidebar.title")}</h2>
          <ul className="space-y-2">
            {PROFILE_NAV_KEYS.map((item, index) => (
              <li key={item}>
                <button
                  type="button"
                  className={`inline-flex min-h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    index === 0
                      ? "bg-cyan-500 text-white"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <SlidersHorizontal size={14} /> {t(`profilePage.sidebar.items.${item}`)}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-2xl border border-slate-200 p-3 text-sm dark:border-slate-700">
            <p className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
              {t("profilePage.security.title")}
            </p>
            <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">
              {t("profilePage.security.subtitle")}
            </p>
            <Link
              to="/recuperar-password"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <KeyRound size={14} />
              {t("profilePage.security.action")}
            </Link>
          </div>
        </aside>

        <div className="space-y-5">
          <form
            onSubmit={onSaveProfile}
            className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 md:col-span-2">
              {t("profilePage.sections.personal")}
            </h2>

            {PROFILE_FIELDS.map((key) => (
              <label key={key} className="grid gap-1 text-sm">
                <span>{t(`profilePage.fields.${key}`)}</span>
                <input
                  value={profileForm[key]}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, [key]: event.target.value }))
                  }
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>
            ))}

            <label className="grid gap-1 text-sm md:col-span-2">
              <span>{t("profilePage.fields.bio")}</span>
              <textarea
                rows={4}
                value={profileForm.bio}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, bio: event.target.value }))
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingProfile ? t("profilePage.actions.saving") : t("profilePage.actions.saveProfile")}
            </button>
          </form>

          <form
            onSubmit={onSavePreferences}
            className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2"
          >
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
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
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
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="es">{t("language.spanish")}</option>
                <option value="en">{t("language.english")}</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span>{t("profilePage.preferences.currency")}</span>
              <select
                value={preferencesForm.currency}
                onChange={(event) =>
                  setPreferencesForm((prev) => ({ ...prev, currency: event.target.value }))
                }
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span>{t("profilePage.preferences.measurement")}</span>
              <select
                value={preferencesForm.measurementSystem}
                onChange={(event) =>
                  setPreferencesForm((prev) => ({
                    ...prev,
                    measurementSystem: event.target.value,
                  }))
                }
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="metric">{t("profilePage.preferences.metric")}</option>
                <option value="imperial">{t("profilePage.preferences.imperial")}</option>
              </select>
            </label>

            <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={preferencesForm.notificationsEmail}
                onChange={(event) =>
                  setPreferencesForm((prev) => ({
                    ...prev,
                    notificationsEmail: event.target.checked,
                  }))
                }
              />
              {t("profilePage.preferences.notificationsEmail")}
            </label>

            <button
              type="submit"
              disabled={savingPreferences}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingPreferences ? t("profilePage.actions.saving") : t("profilePage.actions.savePreferences")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Profile;
