import env from "../env";
import { account, ensureAppwriteConfigured, ID } from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

const getVerifyRedirectUrl = () => {
  const base = env.app.url?.replace(/\/$/, "") || window.location.origin;
  return `${base}/verify-email`;
};

const callEmailVerificationFunction = async (payload) => {
  const functionId = env.appwrite.functions.emailVerification;
  if (!functionId) {
    throw new Error(
      "No esta configurada APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID.",
    );
  }

  return executeJsonFunction(functionId, payload);
};

export const authService = {
  async getCurrentUser() {
    ensureAppwriteConfigured();
    return account.get();
  },

  async register({ firstName, lastName, fullName, email, password }) {
    ensureAppwriteConfigured();
    const resolvedName =
      String(fullName || "").trim() ||
      [firstName, lastName].filter(Boolean).join(" ").trim();

    return account.create({
      userId: ID.unique(),
      name: resolvedName,
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
        "Tu correo no esta verificado. Revisa tu email antes de iniciar sesion.",
      );
      error.code = "EMAIL_NOT_VERIFIED";
      throw error;
    }

    return user;
  },

  async createSetupSession(email, password) {
    ensureAppwriteConfigured();
    return account.createEmailPasswordSession({
      email: String(email || "")
        .trim()
        .toLowerCase(),
      password,
    });
  },

  async logout() {
    ensureAppwriteConfigured();
    return account.deleteSession({
      sessionId: "current",
    });
  },

  async sendVerificationEmail({ userId, email }) {
    ensureAppwriteConfigured();

    if (env.appwrite.functions.emailVerification) {
      return callEmailVerificationFunction({
        action: "send",
        userId,
        email,
      });
    }

    return account.createEmailVerification({
      url: getVerifyRedirectUrl(),
    });
  },

  async resendVerificationEmail({ userId, email }) {
    ensureAppwriteConfigured();

    if (env.appwrite.functions.emailVerification) {
      return callEmailVerificationFunction({
        action: "resend",
        userId,
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
      throw new Error("Faltan parametros de verificacion.");
    }

    return account.updateVerification({
      userId,
      secret,
    });
  },

  async requestPasswordRecovery(email) {
    const functionId = env.appwrite.functions.sendPasswordReset;
    if (!functionId) {
      throw new Error(
        "No está configurada APPWRITE_FUNCTION_SEND_PASSWORD_RESET_ID.",
      );
    }
    return executeJsonFunction(functionId, {
      action: "send",
      email: String(email || "")
        .trim()
        .toLowerCase(),
    });
  },

  async resetPassword({ token, password }) {
    const functionId = env.appwrite.functions.sendPasswordReset;
    if (!functionId) {
      throw new Error(
        "No está configurada APPWRITE_FUNCTION_SEND_PASSWORD_RESET_ID.",
      );
    }
    const result = await executeJsonFunction(functionId, {
      action: "reset",
      token,
      password,
    });
    if (!result?.ok) {
      throw new Error(
        result?.message || "No se pudo restablecer la contraseña.",
      );
    }
    return result;
  },

  async updatePrefs(patch) {
    ensureAppwriteConfigured();
    const current = await account.get();
    const nextPrefs = {
      ...(current?.prefs || {}),
      ...(patch || {}),
    };

    return account.updatePrefs({
      prefs: nextPrefs,
    });
  },
};
