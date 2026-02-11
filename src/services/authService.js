import env from "../env";
import {
  account,
  ensureAppwriteConfigured,
  ID,
} from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

const getVerifyRedirectUrl = () => {
  const base = env.app.url?.replace(/\/$/, "") || window.location.origin;
  return `${base}/verify-email`;
};

const callEmailVerificationFunction = async (payload) => {
  const functionId = env.appwrite.functions.emailVerification;
  if (!functionId) {
    throw new Error(
      "No está configurada VITE_APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID."
    );
  }

  return executeJsonFunction(functionId, payload);
};

export const authService = {
  async getCurrentUser() {
    ensureAppwriteConfigured();
    return account.get();
  },

  async register({ fullName, email, password }) {
    ensureAppwriteConfigured();
    return account.create({
      userId: ID.unique(),
      name: fullName?.trim(),
      email: email?.trim().toLowerCase(),
      password,
    });
  },

  async login(email, password) {
    ensureAppwriteConfigured();
    await account.createEmailPasswordSession({
      email: email.trim().toLowerCase(),
      password,
    });

    const user = await account.get();
    if (!user.emailVerification) {
      await account.deleteSession({
        sessionId: "current",
      });
      const error = new Error(
        "Tu correo no está verificado. Revisa tu email antes de iniciar sesión."
      );
      error.code = "EMAIL_NOT_VERIFIED";
      throw error;
    }

    return user;
  },

  async logout() {
    ensureAppwriteConfigured();
    return account.deleteSession({
      sessionId: "current",
    });
  },

  async sendVerificationEmail({ userAuthId, email }) {
    ensureAppwriteConfigured();

    if (env.appwrite.functions.emailVerification) {
      return callEmailVerificationFunction({
        action: "send",
        userAuthId,
        email,
      });
    }

    return account.createEmailVerification({
      url: getVerifyRedirectUrl(),
    });
  },

  async resendVerificationEmail({ userAuthId, email }) {
    ensureAppwriteConfigured();

    if (env.appwrite.functions.emailVerification) {
      return callEmailVerificationFunction({
        action: "resend",
        userAuthId,
        email,
      });
    }

    return account.createEmailVerification({
      url: getVerifyRedirectUrl(),
    });
  },

  async verifyEmail({ token, userId, secret }) {
    ensureAppwriteConfigured();

    if (token && env.appwrite.functions.emailVerification) {
      return callEmailVerificationFunction({
        action: "verify",
        token,
      });
    }

    if (!userId || !secret) {
      throw new Error("Faltan parámetros de verificación.");
    }

    return account.updateVerification({
      userId,
      secret,
    });
  },

  async requestPasswordRecovery(email) {
    ensureAppwriteConfigured();
    const base = env.app.url?.replace(/\/$/, "") || window.location.origin;
    const redirectUrl = `${base}/reset-password`;
    return account.createRecovery({
      email: email.trim().toLowerCase(),
      url: redirectUrl,
    });
  },

  async resetPassword({ userId, secret, password }) {
    ensureAppwriteConfigured();
    return account.updateRecovery({
      userId,
      secret,
      password,
    });
  },
};
