/**
 * Utility functions for user online presence
 */

const ONLINE_WINDOW_SECONDS = 75;

const parseDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

/**
 * Check if a user is currently online based on their lastSeenAt timestamp
 * @param {string} lastSeenAt - ISO 8601 datetime string
 * @returns {boolean} - True if user was seen within the online time window
 */
export const isUserOnline = (lastSeenAt) => {
  if (!lastSeenAt) return false;

  const lastSeen = parseDate(lastSeenAt);
  if (!lastSeen) return false;

  const now = new Date();
  const diffInSeconds = Math.max(0, (now - lastSeen) / 1000);

  // Slightly larger than heartbeat interval to avoid false offline flicker.
  return diffInSeconds <= ONLINE_WINDOW_SECONDS;
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
    return t("chat.presence.active");
  }

  const lastSeen = parseDate(lastSeenAt);
  if (!lastSeen) {
    return "";
  }

  const now = new Date();
  const diffInMinutes = Math.max(1, Math.floor((now - lastSeen) / 60000));

  if (diffInMinutes < 60) {
    return t("chat.presence.inactiveMinutesAgo", { count: diffInMinutes });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t("chat.presence.inactiveHoursAgo", { count: diffInHours });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return t("chat.presence.inactiveDaysAgo", { count: diffInDays });
};
