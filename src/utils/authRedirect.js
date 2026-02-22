const AUTH_REDIRECT_STORAGE_KEY = "postAuthRedirectPath";
const AUTH_REDIRECT_MAX_AGE_MS = 1000 * 60 * 60 * 24;

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const normalizeInternalPath = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("/")) return "";
  if (trimmed.startsWith("//")) return "";
  if (/^https?:\/\//i.test(trimmed)) return "";
  return trimmed;
};

export const buildPathFromLocation = (locationLike) => {
  if (!locationLike) return "";

  if (typeof locationLike === "string") {
    return normalizeInternalPath(locationLike);
  }

  const pathname = String(locationLike.pathname || "");
  const search = String(locationLike.search || "");
  const hash = String(locationLike.hash || "");
  if (!pathname) return "";

  return normalizeInternalPath(`${pathname}${search}${hash}`);
};

export const getRedirectFromSearchParams = (searchParams) => {
  if (!searchParams) return "";
  const candidate = searchParams.get?.("redirect");
  return normalizeInternalPath(candidate);
};

export const rememberAuthRedirectPath = (path) => {
  const normalizedPath = normalizeInternalPath(path);
  if (!normalizedPath || !canUseStorage()) return "";

  window.localStorage.setItem(
    AUTH_REDIRECT_STORAGE_KEY,
    JSON.stringify({
      path: normalizedPath,
      timestamp: Date.now(),
    }),
  );

  return normalizedPath;
};

export const getRememberedAuthRedirectPath = () => {
  if (!canUseStorage()) return "";
  const raw = window.localStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);
    const path = normalizeInternalPath(parsed?.path);
    const timestamp = Number(parsed?.timestamp || 0);
    const isExpired = !timestamp || Date.now() - timestamp > AUTH_REDIRECT_MAX_AGE_MS;

    if (!path || isExpired) {
      window.localStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
      return "";
    }

    return path;
  } catch {
    window.localStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
    return "";
  }
};

export const resolveAuthRedirectPath = ({ location, searchParams } = {}) => {
  const fromQuery = getRedirectFromSearchParams(searchParams);
  if (fromQuery) return fromQuery;

  const fromState = buildPathFromLocation(location?.state?.from);
  if (fromState) return fromState;

  return getRememberedAuthRedirectPath();
};

export const rememberAuthRedirect = ({ location, searchParams } = {}) => {
  const target = resolveAuthRedirectPath({ location, searchParams });
  if (target) rememberAuthRedirectPath(target);
  return target;
};

export const consumeRememberedAuthRedirectPath = (fallbackPath = "/") => {
  const rememberedPath = getRememberedAuthRedirectPath();
  if (canUseStorage()) {
    window.localStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
  }
  return rememberedPath || normalizeInternalPath(fallbackPath) || "/";
};
