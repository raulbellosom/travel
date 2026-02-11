export const parseBody = (req) => {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

export const json = (res, status, body) => res.json(body, status);

export const getAuthenticatedUserId = (req) =>
  req.headers?.["x-appwrite-user-id"] || req.headers?.["x-appwrite-userid"] || "";

export const isMethodAllowed = (req, allowedMethods) => {
  const method = String(req.method || "POST").toUpperCase();
  return allowedMethods.includes(method);
};
