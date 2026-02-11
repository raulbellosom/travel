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

const AuthContext = createContext(null);

// Exportar el contexto como named export
export { AuthContext };

// Exportar AuthProvider como named export
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

  const loadProfileData = useCallback(async (userId) => {
    try {
      const [nextProfile, nextPreferences] = await Promise.all([
        profileService.getProfile(userId),
        profileService.getPreferencesByUserId(userId),
      ]);
      setProfile(nextProfile || null);
      setPreferences(nextPreferences || null);
    } catch (error) {
      // Un perfil aún no creado no debe romper la sesión.
      if (isUnauthorizedError(error)) {
        clearSessionState();
      }
      setProfile(null);
      setPreferences(null);
    }
  }, [clearSessionState]);

  const refreshSession = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      setAuthUser(user);
      await loadProfileData(user.$id);
      return user;
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

  const login = useCallback(async (email, password) => {
    const user = await authService.login(email, password);
    setAuthUser(user);
    await loadProfileData(user.$id);
    return user;
  }, [loadProfileData]);

  const register = useCallback(async ({ fullName, email, password }) => {
    const user = await authService.register({ fullName, email, password });
    await authService.sendVerificationEmail({
      userAuthId: user.$id,
      email: user.email,
    });
    return user;
  }, []);

  const resendVerification = useCallback(async ({ email }) => {
    return authService.resendVerificationEmail({
      userAuthId: authUser?.$id,
      email: email || authUser?.email,
    });
  }, [authUser?.$id, authUser?.email]);

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

  const updateProfile = useCallback(async (patch) => {
    if (!authUser?.$id) throw new Error("No hay sesión activa.");

    const hasSyncFunction = Boolean(
      import.meta.env.VITE_APPWRITE_FUNCTION_SYNC_USER_PROFILE_ID
    );

    if (hasSyncFunction) {
      await profileService.syncUserProfile(patch);
      await refreshSession();
      return;
    }

    const nextProfile = await profileService.updateProfile(authUser.$id, patch);
    setProfile(nextProfile);
  }, [authUser?.$id, refreshSession]);

  const updatePreferences = useCallback(async (patch) => {
    if (!authUser?.$id) throw new Error("No hay sesión activa.");
    const next = await profileService.upsertPreferences(authUser.$id, patch);
    setPreferences(next);
  }, [authUser?.$id]);

  const user = useMemo(() => {
    if (!authUser) return null;
    const fullName = [profile?.firstName, profile?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      ...authUser,
      ...profile,
      name: fullName || authUser.name || authUser.email,
      email: authUser.email,
      emailVerified: Boolean(authUser.emailVerification),
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
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
