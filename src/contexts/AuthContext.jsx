import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../services/authService";
import { profileService } from "../services/profileService";
import { isUnauthorizedError } from "../utils/errors";
import {
  isValidPhoneCombination,
  normalizePhoneDialCode,
  sanitizePhoneLocalNumber,
} from "../utils/phone";
import env from "../env";

const AuthContext = createContext(null);
const BASE_PREFERENCE_FIELDS = new Set(["theme", "locale"]);
const ROOT_ONLY_PREFERENCE_FIELDS = new Set([
  "brandPrimaryColor",
  "brandSecondaryColor",
  "brandFontHeading",
  "brandFontBody",
]);

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase();

const sanitizePreferencesPatch = (patch, role) => {
  const source = patch && typeof patch === "object" ? patch : {};
  const isRoot = normalizeRole(role) === "root";
  const allowedFields = isRoot
    ? new Set([...BASE_PREFERENCE_FIELDS, ...ROOT_ONLY_PREFERENCE_FIELDS])
    : BASE_PREFERENCE_FIELDS;
  const safePatch = {};

  Object.keys(source).forEach((key) => {
    if (!allowedFields.has(key)) return;
    const nextValue = source[key];
    safePatch[key] =
      typeof nextValue === "string" ? nextValue.trim() : nextValue;
  });

  return safePatch;
};

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSessionState = useCallback(() => {
    setAuthUser(null);
    setProfile(null);
    setPreferences(null);
  }, []);

  const loadProfileData = useCallback(
    async (userId) => {
      try {
        const [nextProfile, nextPreferences] = await Promise.all([
          profileService.getProfile(userId),
          profileService.getPreferencesByUserId(userId),
        ]);
        setProfile(nextProfile || null);
        setPreferences(nextPreferences || null);
      } catch (error) {
        // A missing profile must not break session state.
        if (isUnauthorizedError(error)) {
          clearSessionState();
        }
        setProfile(null);
        setPreferences(null);
      }
    },
    [clearSessionState],
  );

  const refreshSession = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setAuthUser(currentUser);
      await loadProfileData(currentUser.$id);
      return currentUser;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearSessionState();
        return null;
      }
      throw error;
    }
  }, [clearSessionState, loadProfileData]);

  useEffect(() => {
    refreshSession()
      .catch(() => {
        clearSessionState();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clearSessionState, refreshSession]);

  const login = useCallback(
    async (email, password) => {
      const nextUser = await authService.login(email, password);
      setAuthUser(nextUser);
      await loadProfileData(nextUser.$id);
      return nextUser;
    },
    [loadProfileData],
  );

  const register = useCallback(
    async ({
      firstName,
      lastName,
      email,
      password,
      phone,
      phoneCountryCode,
    }) => {
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
      const normalizedPhone = sanitizePhoneLocalNumber(phone);
      const normalizedPhoneCountryCode =
        normalizePhoneDialCode(phoneCountryCode);
      const hasValidPhone =
        normalizedPhone &&
        normalizedPhoneCountryCode &&
        isValidPhoneCombination({
          dialCode: normalizedPhoneCountryCode,
          localNumber: normalizedPhone,
        });

      const nextUser = await authService.register({
        firstName,
        lastName,
        fullName,
        email,
        password,
      });
      const isCreateProfileFlowConfigured = Boolean(
        env.appwrite.functions.userCreateProfile &&
        env.appwrite.functions.emailVerification,
      );

      let setupSessionCreated = false;
      try {
        await authService.createSetupSession(email, password);
        setupSessionCreated = true;
      } catch {
        setupSessionCreated = false;
      }

      try {
        if (setupSessionCreated) {
          const registrationPatch = {
            firstName,
            lastName,
          };

          if (hasValidPhone) {
            registrationPatch.phoneCountryCode = normalizedPhoneCountryCode;
            registrationPatch.phone = normalizedPhone;
          }

          if (env.appwrite.functions.syncUserProfile) {
            await profileService
              .syncUserProfile(registrationPatch)
              .catch(() => {});
          } else {
            try {
              await profileService.updateProfile(
                nextUser.$id,
                registrationPatch,
              );
            } catch {
              const fallbackPatch = { ...registrationPatch };
              delete fallbackPatch.phoneCountryCode;
              if (hasValidPhone) {
                fallbackPatch.phone = `${normalizedPhoneCountryCode}${normalizedPhone}`;
              }
              await profileService
                .updateProfile(nextUser.$id, fallbackPatch)
                .catch(() => {});
            }
          }
        }

        // user-create-profile (trigger users.*.create) already dispatches email-verification.
        // Avoid duplicate verification emails when both functions are configured.
        if (!isCreateProfileFlowConfigured) {
          await authService.sendVerificationEmail({
            userId: nextUser.$id,
            email: nextUser.email,
          });
        }
      } catch (error) {
        const code = Number(error?.code);
        // Evita romper el registro si el backend ya envio el correo por trigger.
        if (code !== 409 && code !== 429) {
          throw error;
        }
      } finally {
        if (setupSessionCreated) {
          await authService.logout().catch(() => {});
        }
      }

      return nextUser;
    },
    [],
  );

  const resendVerification = useCallback(
    async ({ email }) => {
      return authService.resendVerificationEmail({
        userId: authUser?.$id,
        email: email || authUser?.email,
      });
    },
    [authUser?.$id, authUser?.email],
  );

  const verifyEmail = useCallback(async ({ token, userId, secret }) => {
    return authService.verifyEmail({ token, userId, secret });
  }, []);

  const requestPasswordRecovery = useCallback(async (email) => {
    return authService.requestPasswordRecovery(email);
  }, []);

  const resetPassword = useCallback(async ({ userId, secret, password }) => {
    return authService.resetPassword({ userId, secret, password });
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    clearSessionState();
  }, [clearSessionState]);

  const updateAvatar = useCallback(
    async (file) => {
      if (!authUser?.$id) throw new Error("No hay sesion activa.");
      if (!file) throw new Error("Debes seleccionar una imagen.");

      const previousFileId = authUser?.prefs?.avatarFileId || "";
      const uploaded = await profileService.uploadAvatar(file);

      try {
        await authService.updatePrefs({
          avatarFileId: uploaded.$id,
          avatarUpdatedAt: new Date().toISOString(),
        });
      } catch (error) {
        await profileService.deleteAvatar(uploaded.$id).catch(() => {});
        throw error;
      }

      if (previousFileId && previousFileId !== uploaded.$id) {
        await profileService.deleteAvatar(previousFileId).catch(() => {});
      }

      await refreshSession();
      return uploaded;
    },
    [authUser?.$id, authUser?.prefs?.avatarFileId, refreshSession],
  );

  const removeAvatar = useCallback(async () => {
    if (!authUser?.$id) throw new Error("No hay sesion activa.");

    const previousFileId = authUser?.prefs?.avatarFileId || "";
    await authService.updatePrefs({
      avatarFileId: "",
      avatarUpdatedAt: "",
    });

    if (previousFileId) {
      await profileService.deleteAvatar(previousFileId).catch(() => {});
    }

    await refreshSession();
  }, [authUser?.$id, authUser?.prefs?.avatarFileId, refreshSession]);

  const updateProfile = useCallback(
    async (patch) => {
      if (!authUser?.$id) throw new Error("No hay sesion activa.");

      const hasSyncFunction = Boolean(env.appwrite.functions.syncUserProfile);
      if (hasSyncFunction) {
        if (Object.keys(patch || {}).length > 0) {
          await profileService.syncUserProfile(patch);
        }
        await refreshSession();
        return;
      }

      const nextProfile = await profileService.updateProfile(
        authUser.$id,
        patch,
      );
      setProfile(nextProfile);
    },
    [authUser?.$id, refreshSession],
  );

  const updatePreferences = useCallback(
    async (patch) => {
      if (!authUser?.$id) throw new Error("No hay sesion activa.");
      const safePatch = sanitizePreferencesPatch(patch, authUser?.role);
      if (Object.keys(safePatch).length === 0) {
        return null;
      }
      const nextPreferences = await profileService.upsertPreferences(
        authUser.$id,
        safePatch,
      );
      setPreferences(nextPreferences);
      return nextPreferences;
    },
    [authUser?.$id, authUser?.role],
  );

  const user = useMemo(() => {
    if (!authUser) return null;

    const fullName = [profile?.firstName, profile?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const avatarFileId = authUser?.prefs?.avatarFileId || "";
    const avatarVersion = authUser?.prefs?.avatarUpdatedAt || "";
    const baseAvatarUrl = profileService.getAvatarViewUrl(avatarFileId);
    const avatarUrl =
      avatarVersion && baseAvatarUrl
        ? `${baseAvatarUrl}${baseAvatarUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(avatarVersion)}`
        : baseAvatarUrl;

    return {
      ...authUser,
      ...profile,
      name: fullName || authUser.name || authUser.email,
      email: authUser.email,
      emailVerified: Boolean(authUser.emailVerification),
      avatarFileId,
      avatarUrl,
    };
  }, [authUser, profile]);

  const value = useMemo(
    () => ({
      user,
      authUser,
      profile,
      preferences,
      loading,
      login,
      logout,
      register,
      refreshSession,
      resendVerification,
      verifyEmail,
      requestPasswordRecovery,
      resetPassword,
      updateProfile,
      updatePreferences,
      updateAvatar,
      removeAvatar,
    }),
    [
      user,
      authUser,
      profile,
      preferences,
      loading,
      refreshSession,
      login,
      logout,
      register,
      resendVerification,
      verifyEmail,
      requestPasswordRecovery,
      resetPassword,
      updateProfile,
      updatePreferences,
      updateAvatar,
      removeAvatar,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
