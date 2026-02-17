import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  EllipsisVertical,
  Image,
  KeyRound,
  Loader2,
  Mail,
  PencilLine,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Combobox from "../components/common/molecules/Combobox/Combobox";
import { Select } from "../components/common";
import LazyImage from "../components/common/atoms/LazyImage";
import { getErrorMessage } from "../utils/errors";
import {
  formatPhoneForDisplay,
  getOptionalPhonePairValidationCode,
  getCountryDialCodeOptions,
  PHONE_VALIDATION_CODES,
  normalizePhoneDialCode,
  sanitizePhoneLocalNumber,
  splitE164Phone,
} from "../utils/phone";

const PROFILE_TEXT_FIELDS = ["firstName", "lastName"];

const PROFILE_EDIT_KEYS = [
  ...PROFILE_TEXT_FIELDS,
  "phoneCountryCode",
  "phone",
  "whatsappCountryCode",
  "whatsappNumber",
];

const BASE_PREFERENCE_KEYS = ["theme", "locale"];

const MAX_AVATAR_SIZE_MB = 5;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

// Generate initials from name
const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50";

const splitFullName = (value) => {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, " ");
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
      "+52",
  );

  const phone = sanitizePhoneLocalNumber(
    profilePhoneRaw.startsWith("+")
      ? profilePhoneParts.localNumber
      : profile?.phone || authPhoneParts.localNumber || "",
  );

  return {
    firstName: profile?.firstName || parsedName.firstName || "",
    lastName: profile?.lastName || parsedName.lastName || "",
    phoneCountryCode,
    phone,
    whatsappCountryCode: normalizePhoneDialCode(
      profile?.whatsappCountryCode ||
        whatsappParts.dialCode ||
        phoneCountryCode,
    ),
    whatsappNumber: sanitizePhoneLocalNumber(
      whatsappRaw.startsWith("+")
        ? whatsappParts.localNumber
        : profile?.whatsappNumber || "",
    ),
  };
};

const buildPreferencesForm = (preferences) => ({
  theme: preferences?.theme || "system",
  locale: preferences?.locale || "es",
});

const hasChanged = (current, initial, keys) =>
  keys.some((key) => {
    const currentValue = current?.[key];
    const initialValue = initial?.[key];

    if (
      typeof currentValue === "boolean" ||
      typeof initialValue === "boolean"
    ) {
      return Boolean(currentValue) !== Boolean(initialValue);
    }

    return (
      String(currentValue ?? "").trim() !== String(initialValue ?? "").trim()
    );
  });

const Profile = ({ mode = "client" }) => {
  const { t, i18n } = useTranslation();
  const isInternalPanel = mode === "internal";
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
    buildProfileFormFromSources({ profile: null, user: null }),
  );
  const [initialProfileForm, setInitialProfileForm] = useState(() =>
    buildProfileFormFromSources({ profile: null, user: null }),
  );
  const [preferencesForm, setPreferencesForm] = useState(() =>
    buildPreferencesForm(null),
  );
  const [initialPreferencesForm, setInitialPreferencesForm] = useState(() =>
    buildPreferencesForm(null),
  );

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [avatarMenuOpenUp, setAvatarMenuOpenUp] = useState(false);
  const avatarMenuRef = useRef(null);
  const avatarDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const countryDialCodeOptions = useMemo(
    () => getCountryDialCodeOptions(i18n.language),
    [i18n.language],
  );

  // Función para abrir/cerrar el menú del avatar
  const handleToggleAvatarMenu = () => {
    if (showAvatarMenu) {
      setShowAvatarMenu(false);
      return;
    }

    // Calcular si debe abrir hacia arriba o abajo
    if (avatarMenuRef.current) {
      const buttonRect = avatarMenuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeight = user?.avatarUrl ? 110 : 56;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      setAvatarMenuOpenUp(spaceBelow < menuHeight + 20);
    }

    setShowAvatarMenu(true);
  };

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

  // Close avatar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideButton = avatarMenuRef.current?.contains(event.target);
      const isInsideDropdown = avatarDropdownRef.current?.contains(event.target);
      
      if (!isInsideButton && !isInsideDropdown) {
        setShowAvatarMenu(false);
      }
    };

    if (showAvatarMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAvatarMenu]);

  const fullName = useMemo(() => {
    const value = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    return (
      value || user?.name || t("profilePage.summary.defaultName") || "User"
    );
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
    [profileForm, initialProfileForm],
  );
  const hasPreferencesChanges = useMemo(
    () =>
      hasChanged(preferencesForm, initialPreferencesForm, BASE_PREFERENCE_KEYS),
    [initialPreferencesForm, preferencesForm],
  );
  const phoneValidationCode = useMemo(
    () =>
      getOptionalPhonePairValidationCode({
        dialCode: profileForm.phoneCountryCode,
        localNumber: profileForm.phone,
      }),
    [profileForm.phone, profileForm.phoneCountryCode],
  );
  const whatsappValidationCode = useMemo(
    () =>
      getOptionalPhonePairValidationCode({
        dialCode: profileForm.whatsappCountryCode,
        localNumber: profileForm.whatsappNumber,
      }),
    [profileForm.whatsappCountryCode, profileForm.whatsappNumber],
  );
  const phoneValidationMessage = useMemo(() => {
    if (phoneValidationCode === PHONE_VALIDATION_CODES.NONE) return "";
    if (phoneValidationCode === PHONE_VALIDATION_CODES.DIAL_CODE_REQUIRED) {
      return t("profilePage.errors.phoneCountryCodeRequired");
    }
    return t("profilePage.errors.invalidPhone");
  }, [phoneValidationCode, t]);
  const whatsappValidationMessage = useMemo(() => {
    if (whatsappValidationCode === PHONE_VALIDATION_CODES.NONE) return "";
    if (whatsappValidationCode === PHONE_VALIDATION_CODES.DIAL_CODE_REQUIRED) {
      return t("profilePage.errors.whatsappCountryCodeRequired");
    }
    return t("profilePage.errors.invalidWhatsapp");
  }, [t, whatsappValidationCode]);
  const hasProfileContactErrors =
    phoneValidationCode !== PHONE_VALIDATION_CODES.NONE ||
    whatsappValidationCode !== PHONE_VALIDATION_CODES.NONE;

  const onSaveProfile = async (event) => {
    event.preventDefault();
    if (!hasProfileChanges) return;

    const phone = sanitizePhoneLocalNumber(profileForm.phone);
    const phoneCountryCode = normalizePhoneDialCode(
      profileForm.phoneCountryCode,
    );
    const whatsappNumber = sanitizePhoneLocalNumber(profileForm.whatsappNumber);
    const whatsappCountryCode = normalizePhoneDialCode(
      profileForm.whatsappCountryCode,
    );

    if (phoneValidationCode !== PHONE_VALIDATION_CODES.NONE) {
      setError(phoneValidationMessage || t("profilePage.errors.invalidPhone"));
      return;
    }

    if (whatsappValidationCode !== PHONE_VALIDATION_CODES.NONE) {
      setError(
        whatsappValidationMessage || t("profilePage.errors.invalidWhatsapp"),
      );
      return;
    }

    const nextProfile = {
      firstName: String(profileForm.firstName || "").trim(),
      lastName: String(profileForm.lastName || "").trim(),
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

    const nextPreferencesPatch = {
      theme: preferencesForm.theme,
      locale: preferencesForm.locale,
    };

    setSavingPreferences(true);
    setError("");
    setMessage("");

    try {
      await updatePreferences(nextPreferencesPatch);
      setPreferencesForm((prev) => ({ ...prev, ...nextPreferencesPatch }));
      setInitialPreferencesForm((prev) => ({
        ...prev,
        ...nextPreferencesPatch,
      }));
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
        t("client:profile.errors.avatarSize", { max: MAX_AVATAR_SIZE_MB }),
      );
      return;
    }

    setUploadingAvatar(true);
    setError("");
    setMessage("");
    try {
      await updateAvatar(file);
      setMessage(t("client:profile.messages.avatarUpdated"));
    } catch (err) {
      setError(getErrorMessage(err, t("client:profile.errors.avatarUpload")));
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
      setMessage(t("client:profile.messages.avatarRemoved"));
    } catch (err) {
      setError(getErrorMessage(err, t("client:profile.errors.avatarRemove")));
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

  const themeOptions = useMemo(
    () => [
      { value: "system", label: t("client:theme.system") },
      { value: "light", label: t("client:theme.light") },
      { value: "dark", label: t("client:theme.dark") },
    ],
    [t],
  );

  const localeOptions = useMemo(
    () => [
      { value: "es", label: t("client:language.spanish") },
      { value: "en", label: t("client:language.english") },
    ],
    [t],
  );

  return (
    <section className="space-y-6">
      {isInternalPanel ? (
        <header className="rounded-2xl border border-cyan-200/80 bg-linear-to-r from-cyan-50/90 to-sky-50/90 px-5 py-4 dark:border-cyan-900/50 dark:from-cyan-950/30 dark:to-sky-950/30">
          <p className="font-semibold text-cyan-900 dark:text-cyan-100">
            {t("client:profile.internal.title", {
              defaultValue: "Perfil del equipo",
            })}
          </p>
          <p className="mt-0.5 text-sm text-cyan-800/80 dark:text-cyan-200/70">
            {t("client:profile.internal.subtitle", {
              defaultValue:
                "Administra tu información dentro del panel administrativo.",
            })}
          </p>
        </header>
      ) : null}

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="relative">
              {user?.avatarUrl ? (
                <div className="relative aspect-square h-24 w-24 overflow-hidden rounded-full border-2 border-slate-200 shadow-lg dark:border-slate-700">
                  <LazyImage
                    src={user.avatarUrl}
                    alt={fullName}
                    className="absolute inset-0 h-full w-full object-cover"
                    eager={true}
                  />
                </div>
              ) : (
                <div className="grid aspect-square h-24 w-24 place-items-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-3xl font-bold text-white shadow-xl shadow-cyan-500/25">
                  {getInitials(
                    user?.name ||
                      t("client:profile.summary.defaultName") ||
                      "User",
                  )}
                </div>
              )}

              {/* Avatar menu button */}
              <div className="absolute -bottom-1 -right-1">
                <button
                  ref={avatarMenuRef}
                  type="button"
                  onClick={handleToggleAvatarMenu}
                  disabled={uploadingAvatar || removingAvatar}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  aria-label="Avatar options"
                >
                  <EllipsisVertical size={16} />
                </button>

                {/* Dropdown menu */}
                {showAvatarMenu && (
                  <div
                    ref={avatarDropdownRef}
                    className={`absolute left-0 ${avatarMenuOpenUp ? "bottom-full mb-2" : "top-full mt-2"} z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowAvatarMenu(false);
                      }}
                      disabled={uploadingAvatar || removingAvatar}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Image size={16} />
                      {uploadingAvatar
                        ? t("profilePage.actions.uploadingAvatar")
                        : t("profilePage.actions.uploadAvatar")}
                    </button>
                    {user?.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          onRemoveAvatar();
                          setShowAvatarMenu(false);
                        }}
                        disabled={uploadingAvatar || removingAvatar}
                        className="flex w-full items-center gap-3 border-t border-slate-200 px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 size={16} />
                        {removingAvatar
                          ? t("profilePage.actions.removingAvatar")
                          : t("profilePage.actions.removeAvatar")}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                disabled={uploadingAvatar || removingAvatar}
                className="hidden"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {fullName}
              </h1>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Mail size={15} /> {user?.email}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <ShieldCheck size={13} />
                {user?.emailVerified
                  ? t("profilePage.emailVerified")
                  : t("profilePage.emailNotVerified")}
              </p>
            </div>
          </div>

          {!isEditingProfile ? (
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile(true);
                setError("");
                setMessage("");
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <PencilLine size={16} />
              {t("profilePage.actions.editProfile")}
            </button>
          ) : null}
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

      {isEditingProfile ? (
        <form
          onSubmit={onSaveProfile}
          className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t("profilePage.sections.editingProfile", {
                defaultValue: "Editando información del perfil",
              })}
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {t("profilePage.sections.editingProfileSubtitle", {
                defaultValue: "Actualiza tu información personal y de contacto",
              })}
            </p>
          </div>

          {PROFILE_TEXT_FIELDS.map((key) => (
            <label key={key} className="grid gap-2 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {t(`profilePage.fields.${key}`)}
              </span>
              <input
                value={profileForm[key]}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    [key]: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>
          ))}

          <div className="grid gap-2 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {t("profilePage.fields.phone")}
            </span>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
              <Combobox
                options={countryDialCodeOptions}
                value={profileForm.phoneCountryCode}
                onChange={(value) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phoneCountryCode: value || "",
                  }))
                }
                placeholder={t("profilePage.placeholders.phoneCountryCode")}
                noResultsText={t(
                  "profilePage.placeholders.noCountryCodeResults",
                )}
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
            {phoneValidationMessage ? (
              <p className="text-xs text-red-600 dark:text-red-300">
                {phoneValidationMessage}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {t("profilePage.fields.whatsappNumber")}
            </span>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
              <Combobox
                options={countryDialCodeOptions}
                value={profileForm.whatsappCountryCode}
                onChange={(value) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    whatsappCountryCode: value || "",
                  }))
                }
                placeholder={t("profilePage.placeholders.phoneCountryCode")}
                noResultsText={t(
                  "profilePage.placeholders.noCountryCodeResults",
                )}
                inputClassName={inputClass}
              />
              <input
                value={profileForm.whatsappNumber}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    whatsappNumber: sanitizePhoneLocalNumber(
                      event.target.value,
                    ),
                  }))
                }
                placeholder={t("profilePage.placeholders.whatsappNumber")}
                className={inputClass}
              />
            </div>
            {whatsappValidationMessage ? (
              <p className="text-xs text-red-600 dark:text-red-300">
                {whatsappValidationMessage}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button
              type="button"
              onClick={onCancelProfileEdit}
              disabled={savingProfile}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("client:profile.actions.cancelEdit")}
            </button>

            <button
              type="submit"
              disabled={
                !hasProfileChanges || savingProfile || hasProfileContactErrors
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-linear-to-r from-cyan-500 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingProfile ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : null}
              {savingProfile
                ? t("client:profile.actions.saving")
                : t("client:profile.actions.saveProfile")}
            </button>
          </div>
        </form>
      ) : (
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("profilePage.sections.personalInfo", {
              defaultValue: "Información personal",
            })}
          </h2>

          <dl className="grid gap-6 md:grid-cols-2">
            {PROFILE_TEXT_FIELDS.map((key) => (
              <div key={key} className="space-y-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t(`profilePage.fields.${key}`)}
                </dt>
                <dd className="text-base font-medium text-slate-900 dark:text-slate-100">
                  {String(profileForm[key] || "").trim() || (
                    <span className="italic text-slate-400 dark:text-slate-500">
                      {t("profilePage.view.empty")}
                    </span>
                  )}
                </dd>
              </div>
            ))}

            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("profilePage.fields.phone")}
              </dt>
              <dd className="text-base font-medium text-slate-900 dark:text-slate-100">
                {phoneDisplay || (
                  <span className="italic text-slate-400 dark:text-slate-500">
                    {t("profilePage.view.empty")}
                  </span>
                )}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("profilePage.fields.whatsappNumber")}
              </dt>
              <dd className="text-base font-medium text-slate-900 dark:text-slate-100">
                {whatsappDisplay || (
                  <span className="italic text-slate-400 dark:text-slate-500">
                    {t("profilePage.view.empty")}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </article>
      )}

      <form
        onSubmit={onSavePreferences}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("profilePage.sections.preferences")}
        </h2>
        <p className="mb-5 text-xs text-slate-600 dark:text-slate-400">
          {t("profilePage.sections.preferencesSubtitle", {
            defaultValue: "Personaliza tu experiencia en la plataforma",
          })}
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {t("profilePage.preferences.theme")}
            </span>
            <Select
              value={preferencesForm.theme}
              onChange={(value) =>
                setPreferencesForm((prev) => ({ ...prev, theme: value }))
              }
              options={themeOptions}
              className={inputClass}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {t("profilePage.preferences.language")}
            </span>
            <Select
              value={preferencesForm.locale}
              onChange={(value) =>
                setPreferencesForm((prev) => ({ ...prev, locale: value }))
              }
              options={localeOptions}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!hasPreferencesChanges || savingPreferences}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-linear-to-r from-cyan-500 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {savingPreferences ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : null}
            {savingPreferences
              ? t("profilePage.actions.saving")
              : t("profilePage.actions.savePreferences")}
          </button>
        </div>
      </form>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("profilePage.security.title")}
        </h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          {t("profilePage.security.subtitle")}
        </p>
        <Link
          to="/recuperar-password"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <KeyRound size={16} />
          {t("profilePage.security.action")}
        </Link>
      </article>
    </section>
  );
};

export default Profile;
