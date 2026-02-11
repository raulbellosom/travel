import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../services/authService";
import { profileService } from "../services/profileService";
import { isUnauthorizedError } from "../utils/errors";
import env from "../env";

const AuthContext = createContext(null);

export { AuthContext };

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
    [clearSessionState]
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
    [loadProfileData]
  );

  const register = useCallback(async ({ fullName, email, password }) => {
    const nextUser = await authService.register({ fullName, email, password });
    await authService.sendVerificationEmail({
      userAuthId: nextUser.$id,
      email: nextUser.email,
    });
    return nextUser;
  }, []);

  const resendVerification = useCallback(
    async ({ email }) => {
      return authService.resendVerificationEmail({
        userAuthId: authUser?.$id,
        email: email || authUser?.email,
      });
    },
    [authUser?.$id, authUser?.email]
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
    [authUser?.$id, authUser?.prefs?.avatarFileId, refreshSession]
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
      const syncAllowedFields = new Set(["firstName", "lastName", "email", "phone"]);
      const syncPatch = {};
      const profilePatch = {};

      Object.entries(patch || {}).forEach(([key, value]) => {
        if (syncAllowedFields.has(key)) {
          syncPatch[key] = value;
        } else {
          profilePatch[key] = value;
        }
      });

      if (hasSyncFunction) {
        if (Object.keys(syncPatch).length > 0) {
          await profileService.syncUserProfile(syncPatch);
        }
        if (Object.keys(profilePatch).length > 0) {
          await profileService.updateProfile(authUser.$id, profilePatch);
        }
        await refreshSession();
        return;
      }

      const nextProfile = await profileService.updateProfile(authUser.$id, patch);
      setProfile(nextProfile);
    },
    [authUser?.$id, refreshSession]
  );

  const updatePreferences = useCallback(
    async (patch) => {
      if (!authUser?.$id) throw new Error("No hay sesion activa.");
      const nextPreferences = await profileService.upsertPreferences(authUser.$id, patch);
      setPreferences(nextPreferences);
    },
    [authUser?.$id]
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
    const avatarUrl = avatarVersion && baseAvatarUrl
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
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
