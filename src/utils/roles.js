export const INTERNAL_ROLES = new Set([
  "root",
  "owner",
  "staff_manager",
  "staff_editor",
  "staff_support",
]);

export const PROPERTY_EDITOR_ROLES = new Set([
  "root",
  "owner",
  "staff_manager",
  "staff_editor",
]);

export const isInternalRole = (role) => INTERNAL_ROLES.has(String(role || ""));

export const canPublishProperty = (role) =>
  PROPERTY_EDITOR_ROLES.has(String(role || ""));
