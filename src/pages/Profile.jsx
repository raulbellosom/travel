import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Camera,
  KeyRound,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
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
import { useInstanceModules } from "../hooks/useInstanceModules";
import { hasScope, isInternalRole } from "../utils/roles";
import { isScopeAllowedByModules } from "../utils/moduleAccess";

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

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
};

const splitFullName = (value) => {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!normalized) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = normalized.split(" ");
  return { firstName, lastName: rest.join(" ") };
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
    const cv = current?.[key];
    const iv = initial?.[key];
    if (typeof cv === "boolean" || typeof iv === "boolean")
      return Boolean(cv) !== Boolean(iv);
    return String(cv ?? "").trim() !== String(iv ?? "").trim();
  });

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50";

/**
 * Formats raw digit string into readable groups for display inside phone inputs.
 * Stores raw digits; displays e.g. "123 456 7890" or "123 456 78901234" for longer.
 */
const formatPhoneDisplay = (digits) => {
  const d = String(digits || "").replace(/\D/g, "");
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)} ${d.slice(10)}`;
};

const InfoField = ({ label, value, icon: Icon, empty }) => (
  <div className="flex flex-col gap-1">
    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {Icon && <Icon size={12} className="shrink-0" />}
      {label}
    </dt>
    <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
      {value ? (
        value
      ) : (
        <span className="italic text-slate-400 dark:text-slate-500">
          {empty}
        </span>
      )}
    </dd>
  </div>
);

const Profile = ({ mode = "client" }) => {
  const { t, i18n } = useTranslation();
  const isInternalPanel = mode === "internal";
  const { isEnabled } = useInstanceModules();
  const { showToast } = useToast();
  const {
    user,
    profile,
    preferences,
    updateProfile,
    updatePreferences,
    updateAvatar,
    removeAvatar,
    requestPasswordRecovery,
  } = useAuth();

  const navigate = useNavigate();
  const role = String(user?.role || "")
    .trim()
    .toLowerCase();
  const isInternalUser = isInternalRole(role);
  const canAccessScope = (scope) =>
    hasScope(user, scope) && isScopeAllowedByModules(scope, isEnabled);
  const canEditProfile =
    !isInternalPanel || !isInternalUser || canAccessScope("profile.write");
  const canEditPreferences =
    !isInternalPanel ||
    !isInternalUser ||
    canAccessScope("preferences.write");

  const [sendingReset, setSendingReset] = useState(false);

  const handleRequestPasswordReset = async () => {
    const email = user?.email || profile?.email;
    if (!email) {
      navigate("/recuperar-password");
      return;
    }
    setSendingReset(true);
    try {
      await requestPasswordRecovery(email);
      showToast({
        type: "success",
        title: t("profilePage.security.resetSentTitle", "Enlace enviado"),
        message: t(
          "profilePage.security.resetSentMessage",
          "Revisa tu correo {{email}} para restablecer tu contraseña.",
          { email },
        ),
      });
    } catch (err) {
      // cooldown (HTTP 429 from the function)
      if (
        err?.code === 429 ||
        String(err?.message || "")
          .toLowerCase()
          .includes("espera")
      ) {
        showToast({
          type: "warning",
          title: t(
            "profilePage.security.resetCooldownTitle",
            "Espera un momento",
          ),
          message:
            err.message ||
            t(
              "profilePage.security.resetCooldown",
              "Ya se envió un enlace recientemente.",
            ),
        });
      } else {
        showToast({
          type: "error",
          title: t(
            "profilePage.security.resetErrorTitle",
            "Error al enviar enlace",
          ),
          message:
            err.message ||
            t("common.errors.unexpected", "Ocurrió un error inesperado."),
        });
      }
    } finally {
      setSendingReset(false);
    }
  };

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
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [avatarMenuPos, setAvatarMenuPos] = useState({ top: 0, left: 0 });

  const avatarMenuRef = useRef(null);
  const avatarDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const countryDialCodeOptions = useMemo(
    () => getCountryDialCodeOptions(i18n.language),
    [i18n.language],
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

  useEffect(() => {
    if (!showAvatarMenu) return;
    const handleOutside = (e) => {
      if (
        !avatarMenuRef.current?.contains(e.target) &&
        !avatarDropdownRef.current?.contains(e.target)
      )
        setShowAvatarMenu(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showAvatarMenu]);

  const fullName = useMemo(() => {
    const v = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    return v || user?.name || t("profilePage.summary.defaultName") || "User";
  }, [profileForm.firstName, profileForm.lastName, t, user?.name]);

  const initials = useMemo(() => getInitials(fullName), [fullName]);

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
    if (phoneValidationCode === PHONE_VALIDATION_CODES.DIAL_CODE_REQUIRED)
      return t("profilePage.errors.phoneCountryCodeRequired");
    return t("profilePage.errors.invalidPhone");
  }, [phoneValidationCode, t]);

  const whatsappValidationMessage = useMemo(() => {
    if (whatsappValidationCode === PHONE_VALIDATION_CODES.NONE) return "";
    if (whatsappValidationCode === PHONE_VALIDATION_CODES.DIAL_CODE_REQUIRED)
      return t("profilePage.errors.whatsappCountryCodeRequired");
    return t("profilePage.errors.invalidWhatsapp");
  }, [t, whatsappValidationCode]);

  const hasProfileContactErrors =
    phoneValidationCode !== PHONE_VALIDATION_CODES.NONE ||
    whatsappValidationCode !== PHONE_VALIDATION_CODES.NONE;

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

  const onSaveProfile = async (e) => {
    e.preventDefault();
    if (!canEditProfile) return;
    if (!hasProfileChanges) return;

    if (phoneValidationCode !== PHONE_VALIDATION_CODES.NONE) {
      showToast({
        type: "error",
        message: phoneValidationMessage || t("profilePage.errors.invalidPhone"),
      });
      return;
    }
    if (whatsappValidationCode !== PHONE_VALIDATION_CODES.NONE) {
      showToast({
        type: "error",
        message:
          whatsappValidationMessage || t("profilePage.errors.invalidWhatsapp"),
      });
      return;
    }

    const phone = sanitizePhoneLocalNumber(profileForm.phone);
    const phoneCountryCode = normalizePhoneDialCode(
      profileForm.phoneCountryCode,
    );
    const whatsappNumber = sanitizePhoneLocalNumber(profileForm.whatsappNumber);
    const whatsappCountryCode = normalizePhoneDialCode(
      profileForm.whatsappCountryCode,
    );
    const nextProfile = {
      firstName: String(profileForm.firstName || "").trim(),
      lastName: String(profileForm.lastName || "").trim(),
      phone,
      phoneCountryCode: phone ? phoneCountryCode : "",
      whatsappNumber,
      whatsappCountryCode: whatsappNumber ? whatsappCountryCode : "",
    };

    setSavingProfile(true);
    try {
      await updateProfile(nextProfile);
      setProfileForm(nextProfile);
      setInitialProfileForm(nextProfile);
      setIsEditingProfile(false);
      showToast({
        type: "success",
        title: t("profilePage.messages.profileSaved"),
      });
    } catch (err) {
      showToast({
        type: "error",
        message: getErrorMessage(err, t("profilePage.errors.profile")),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const onCancelProfileEdit = () => {
    setProfileForm(initialProfileForm);
    setIsEditingProfile(false);
  };

  const onSavePreferences = async (e) => {
    e.preventDefault();
    if (!canEditPreferences) return;
    if (!hasPreferencesChanges) return;
    const nextPreferencesPatch = {
      theme: preferencesForm.theme,
      locale: preferencesForm.locale,
    };
    setSavingPreferences(true);
    try {
      await updatePreferences(nextPreferencesPatch);
      setPreferencesForm((prev) => ({ ...prev, ...nextPreferencesPatch }));
      setInitialPreferencesForm((prev) => ({
        ...prev,
        ...nextPreferencesPatch,
      }));
      showToast({
        type: "success",
        title: t("profilePage.messages.preferencesSaved"),
      });
    } catch (err) {
      showToast({
        type: "error",
        message: getErrorMessage(err, t("profilePage.errors.preferences")),
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  const onAvatarChange = async (e) => {
    if (!canEditProfile) return;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      showToast({
        type: "error",
        message: t("client:profile.errors.avatarSize", {
          max: MAX_AVATAR_SIZE_MB,
        }),
      });
      return;
    }
    setUploadingAvatar(true);
    try {
      await updateAvatar(file);
      showToast({
        type: "success",
        title: t("client:profile.messages.avatarUpdated"),
      });
    } catch (err) {
      showToast({
        type: "error",
        message: getErrorMessage(err, t("client:profile.errors.avatarUpload")),
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onRemoveAvatar = async () => {
    if (!canEditProfile) return;
    setShowAvatarMenu(false);
    setRemovingAvatar(true);
    try {
      await removeAvatar();
      showToast({
        type: "success",
        title: t("client:profile.messages.avatarRemoved"),
      });
    } catch (err) {
      showToast({
        type: "error",
        message: getErrorMessage(err, t("client:profile.errors.avatarRemove")),
      });
    } finally {
      setRemovingAvatar(false);
    }
  };

  const avatarBusy = uploadingAvatar || removingAvatar;

  /* ── Avatar widget ── */
  const AvatarWidget = (
    <div className="relative shrink-0">
      <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg dark:border-slate-800">
        {user?.avatarUrl ? (
          <LazyImage
            src={user.avatarUrl}
            alt={fullName}
            className="absolute inset-0 h-full w-full object-cover"
            eager
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-cyan-500 to-blue-600 text-2xl font-bold text-white">
            {initials}
          </div>
        )}

        {avatarBusy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 backdrop-blur-[2px]">
            <Loader2 size={22} className="animate-spin text-white" />
            <span className="text-[10px] font-semibold leading-tight text-white/90">
              {uploadingAvatar
                ? t("profilePage.actions.uploadingAvatar")
                : t("profilePage.actions.removingAvatar", {
                    defaultValue: "Eliminando…",
                  })}
            </span>
          </div>
        )}
      </div>

      {canEditProfile ? (
        <button
          ref={avatarMenuRef}
          type="button"
          onClick={() => {
            const rect = avatarMenuRef.current?.getBoundingClientRect();
            if (rect) {
              setAvatarMenuPos({ top: rect.bottom + 8, left: rect.left });
            }
            setShowAvatarMenu((v) => !v);
          }}
          disabled={avatarBusy}
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-cyan-500 text-white shadow-md transition hover:bg-cyan-400 disabled:opacity-60 dark:border-slate-800"
          aria-label="Opciones de avatar"
        >
          <Camera size={13} />
        </button>
      ) : null}

      {canEditProfile &&
        showAvatarMenu &&
        createPortal(
          <div
            ref={avatarDropdownRef}
            style={{ top: avatarMenuPos.top, left: avatarMenuPos.left }}
            className="fixed z-9999 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
                setShowAvatarMenu(false);
              }}
              disabled={avatarBusy}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Camera size={15} />
              {t("profilePage.actions.uploadAvatar")}
            </button>
            {user?.avatarUrl && (
              <button
                type="button"
                onClick={onRemoveAvatar}
                disabled={avatarBusy}
                className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-slate-700/60 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                <Trash2 size={15} />
                {t("profilePage.actions.removeAvatar")}
              </button>
            )}
          </div>,
          document.body,
        )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onAvatarChange}
        disabled={avatarBusy || !canEditProfile}
      />
    </div>
  );

  /* ── Page content ── */
  const content = (
    <div className="space-y-6">
      {isInternalPanel && (
        <div className="rounded-2xl border border-cyan-200/70 bg-linear-to-r from-cyan-50 to-sky-50 px-5 py-4 dark:border-cyan-900/40 dark:from-cyan-950/20 dark:to-sky-950/20">
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
        </div>
      )}

      {/* Hero card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="h-24 bg-linear-to-r from-cyan-500 via-sky-500 to-blue-600" />
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-4 px-6 pb-5">
          {AvatarWidget}
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3 pt-14">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-900 dark:text-slate-100">
                {fullName}
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-500 dark:text-slate-400">
                <Mail size={13} />
                {user?.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <ShieldCheck size={12} />
                {user?.emailVerified
                  ? t("profilePage.emailVerified")
                  : t("profilePage.emailNotVerified")}
              </span>
              {!isEditingProfile && canEditProfile && (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Pencil size={13} />
                  {t("profilePage.actions.editProfile")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal info – view or edit */}
      {isEditingProfile && canEditProfile ? (
        <form
          onSubmit={onSaveProfile}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t("profilePage.sections.editingProfile", {
                  defaultValue: "Información personal",
                })}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t("profilePage.sections.editingProfileSubtitle", {
                  defaultValue:
                    "Actualiza tu información personal y de contacto",
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelProfileEdit}
              disabled={savingProfile}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Cancelar edición"
            >
              <X size={17} />
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {PROFILE_TEXT_FIELDS.map((key) => (
              <label key={key} className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {t(`profilePage.fields.${key}`)}
                </span>
                <input
                  value={profileForm[key]}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
            ))}

            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {t("profilePage.fields.phone")}
              </span>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
                <div className="relative">
                  <Combobox
                    options={countryDialCodeOptions}
                    value={profileForm.phoneCountryCode}
                    onChange={(v) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        phoneCountryCode: v || "",
                      }))
                    }
                    placeholder={t("profilePage.placeholders.phoneCountryCode")}
                    noResultsText={t(
                      "profilePage.placeholders.noCountryCodeResults",
                    )}
                    inputClassName={
                      profileForm.phoneCountryCode
                        ? `${inputClass} pr-7`
                        : inputClass
                    }
                  />
                  {profileForm.phoneCountryCode && (
                    <button
                      type="button"
                      onClick={() =>
                        setProfileForm((prev) => ({
                          ...prev,
                          phoneCountryCode: "",
                        }))
                      }
                      className="absolute right-2 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                      aria-label="Limpiar lada"
                      tabIndex={-1}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <input
                  value={formatPhoneDisplay(profileForm.phone)}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      phone: sanitizePhoneLocalNumber(e.target.value),
                    }))
                  }
                  inputMode="numeric"
                  placeholder={t("profilePage.placeholders.phoneNumber")}
                  className={inputClass}
                />
              </div>
              {phoneValidationMessage && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {phoneValidationMessage}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {t("profilePage.fields.whatsappNumber")}
              </span>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
                <div className="relative">
                  <Combobox
                    options={countryDialCodeOptions}
                    value={profileForm.whatsappCountryCode}
                    onChange={(v) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        whatsappCountryCode: v || "",
                      }))
                    }
                    placeholder={t("profilePage.placeholders.phoneCountryCode")}
                    noResultsText={t(
                      "profilePage.placeholders.noCountryCodeResults",
                    )}
                    inputClassName={
                      profileForm.whatsappCountryCode
                        ? `${inputClass} pr-7`
                        : inputClass
                    }
                  />
                  {profileForm.whatsappCountryCode && (
                    <button
                      type="button"
                      onClick={() =>
                        setProfileForm((prev) => ({
                          ...prev,
                          whatsappCountryCode: "",
                        }))
                      }
                      className="absolute right-2 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                      aria-label="Limpiar lada"
                      tabIndex={-1}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <input
                  value={formatPhoneDisplay(profileForm.whatsappNumber)}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      whatsappNumber: sanitizePhoneLocalNumber(e.target.value),
                    }))
                  }
                  inputMode="numeric"
                  placeholder={t("profilePage.placeholders.whatsappNumber")}
                  className={inputClass}
                />
              </div>
              {whatsappValidationMessage && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {whatsappValidationMessage}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onCancelProfileEdit}
              disabled={savingProfile}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("client:profile.actions.cancelEdit")}
            </button>
            <button
              type="submit"
              disabled={
                !hasProfileChanges || savingProfile || hasProfileContactErrors
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-sky-600 px-5 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile && <Loader2 size={15} className="animate-spin" />}
              {savingProfile
                ? t("client:profile.actions.saving")
                : t("client:profile.actions.saveProfile")}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <User size={16} className="text-cyan-500" />
            {t("profilePage.sections.personalInfo", {
              defaultValue: "Información personal",
            })}
          </h2>

          <dl className="grid gap-5 sm:grid-cols-2">
            <InfoField
              label={t("profilePage.fields.firstName")}
              value={profileForm.firstName}
              empty={t("profilePage.view.empty")}
            />
            <InfoField
              label={t("profilePage.fields.lastName")}
              value={profileForm.lastName}
              empty={t("profilePage.view.empty")}
            />
            <InfoField
              label={t("profilePage.fields.phone")}
              icon={Phone}
              value={phoneDisplay}
              empty={t("profilePage.view.empty")}
            />
            <InfoField
              label={t("profilePage.fields.whatsappNumber")}
              icon={MessageCircle}
              value={whatsappDisplay}
              empty={t("profilePage.view.empty")}
            />
          </dl>
        </div>
      )}

      {/* Preferences */}
      <form
        onSubmit={onSavePreferences}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("profilePage.sections.preferences")}
        </h2>
        <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
          {t("profilePage.sections.preferencesSubtitle", {
            defaultValue: "Personaliza tu experiencia en la plataforma",
          })}
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {t("profilePage.preferences.theme")}
            </span>
            <Select
              value={preferencesForm.theme}
              onChange={(v) =>
                setPreferencesForm((prev) => ({ ...prev, theme: v }))
              }
              options={themeOptions}
              disabled={!canEditPreferences}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {t("profilePage.preferences.language")}
            </span>
            <Select
              value={preferencesForm.locale}
              onChange={(v) =>
                setPreferencesForm((prev) => ({ ...prev, locale: v }))
              }
              options={localeOptions}
              disabled={!canEditPreferences}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={
              !canEditPreferences || !hasPreferencesChanges || savingPreferences
            }
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-sky-600 px-5 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingPreferences && (
              <Loader2 size={15} className="animate-spin" />
            )}
            {savingPreferences
              ? t("profilePage.actions.saving")
              : t("profilePage.actions.savePreferences")}
          </button>
        </div>
      </form>

      {/* Security */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("profilePage.security.title")}
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {t("profilePage.security.subtitle")}
        </p>
        <button
          type="button"
          disabled={sendingReset}
          onClick={handleRequestPasswordReset}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {sendingReset ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <KeyRound size={15} />
          )}
          {sendingReset
            ? t("profilePage.security.sending", "Enviando...")
            : t("profilePage.security.action")}
        </button>
      </div>
    </div>
  );

  if (isInternalPanel) {
    return content;
  }

  // Client mode: account for fixed navbar height
  return (
    <div className="min-h-screen pb-16 pt-20 sm:pt-24">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">{content}</div>
    </div>
  );
};

export default Profile;
