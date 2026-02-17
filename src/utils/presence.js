/**
 * Utility functions for user online presence
 */

/**
 * Check if a user is currently online based on their lastSeenAt timestamp
 * @param {string} lastSeenAt - ISO 8601 datetime string
 * @returns {boolean} - True if user was seen within the last 30 seconds
 */
export const isUserOnline = (lastSeenAt) => {
  if (!lastSeenAt) return false;

  try {
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffInSeconds = (now - lastSeen) / 1000;

    // User is considered online if last seen within 30 seconds
    return diffInSeconds < 30;
  } catch (error) {
    console.warn("Invalid lastSeenAt date:", lastSeenAt);
    return false;
  }
};

/**
 * Get a formatted "last seen" string for display
 * @param {string} lastSeenAt - ISO 8601 datetime string
 * @param {function} t - i18n translation function
 * @returns {string} - Formatted string like "Online", "5m ago", "2h ago", etc.
 */
export const getLastSeenText = (lastSeenAt, t) => {
  if (!lastSeenAt) return "";

  if (isUserOnline(lastSeenAt)) {
    return t("chat.presence.online");
  }

  try {
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now - lastSeen) / 60000);

    if (diffInMinutes < 60) {
      return t("chat.presence.minutesAgo", { count: diffInMinutes });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return t("chat.presence.hoursAgo", { count: diffInHours });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return t("chat.presence.daysAgo", { count: diffInDays });
  } catch (error) {
    console.warn("Invalid lastSeenAt date:", lastSeenAt);
    return "";
  }
};
