/**
 * wizard/wizardValidation.js
 * Step validation utilities for the new wizard engine.
 *
 * Philosophy:
 * - Validate what's visible and relevant for the current step.
 * - Prefer human, actionable error messages (via i18n keys).
 * - Keep validation lightweight; backend still enforces strict rules.
 *
 * Error format:
 * - errors is an object keyed by "<stepId>.<fieldKey>" -> string message
 * - fieldKey is the same key used in profile fields (supports attributes.*)
 */

function isEmpty(value) {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

const MAX_WIZARD_IMAGE_FILES = 50;
const MAX_WIZARD_IMAGE_SIZE_MB = 10;
const MAX_WIZARD_IMAGE_SIZE_BYTES = MAX_WIZARD_IMAGE_SIZE_MB * 1024 * 1024;

function isValidImageFile(file) {
  const mime = String(file?.type || "").trim().toLowerCase();
  if (["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(mime)) {
    return true;
  }

  const filename = String(file?.name || "").trim().toLowerCase();
  return /\.(png|jpe?g|webp)$/.test(filename);
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function addError(errors, stepId, fieldKey, message) {
  errors[`${stepId}.${fieldKey}`] = message;
}

/**
 * Validate a single field.
 * Supported field properties:
 * - required (boolean)
 * - minLength (number) for text/textarea
 * - min/max (number) for number/currencyAmount
 */
function validateField({ field, value, stepId, t, errors }) {
  const required = Boolean(field.required);

  if (required && isEmpty(value)) {
    // If field provides a custom required message key, use it.
    const msg = field.requiredMessageKey ? t(field.requiredMessageKey) : t("wizard.validation.required");
    addError(errors, stepId, field.key, msg);
    return;
  }

  // Text min length
  if ((field.type === "text" || field.type === "textarea") && !isEmpty(value) && field.minLength) {
    const str = String(value);
    if (str.length < field.minLength) {
      addError(errors, stepId, field.key, t("wizard.validation.minLength", { count: field.minLength }));
      return;
    }
  }

  // Numeric bounds
  if ((field.type === "number" || field.type === "currencyAmount") && !isEmpty(value)) {
    const n = toNumber(value);
    if (n === null) {
      addError(errors, stepId, field.key, t("wizard.validation.number"));
      return;
    }
    if (field.min !== undefined && n < field.min) {
      addError(errors, stepId, field.key, t("wizard.validation.min", { value: field.min }));
      return;
    }
    if (field.max !== undefined && n > field.max) {
      addError(errors, stepId, field.key, t("wizard.validation.max", { value: field.max }));
      return;
    }
  }

  // Time basic check (HH:MM)
  if (field.type === "time" && !isEmpty(value)) {
    const str = String(value);
    const ok = /^[0-2][0-9]:[0-5][0-9]$/.test(str);
    if (!ok) {
      addError(errors, stepId, field.key, t("wizard.validation.time"));
      return;
    }
  }

  // URL basic check (lightweight)
  if (field.type === "url" && !isEmpty(value)) {
    try {
      new URL(String(value));
    } catch {
      addError(errors, stepId, field.key, t("wizard.validation.url"));
      return;
    }
  }

  // Images: file array constraints
  if (field.type === "images" && !isEmpty(value)) {
    if (!Array.isArray(value)) {
      addError(errors, stepId, field.key, t("wizard.validation.required"));
      return;
    }

    if (value.length > MAX_WIZARD_IMAGE_FILES) {
      addError(
        errors,
        stepId,
        field.key,
        t("propertyForm.images.errors.maxFiles", {
          maxFiles: MAX_WIZARD_IMAGE_FILES,
        }),
      );
      return;
    }

    let invalidTypeCount = 0;
    let oversizeCount = 0;

    value.forEach((file) => {
      if (!isValidImageFile(file)) {
        invalidTypeCount += 1;
        return;
      }
      if (Number(file?.size || 0) > MAX_WIZARD_IMAGE_SIZE_BYTES) {
        oversizeCount += 1;
      }
    });

    if (invalidTypeCount > 0) {
      addError(
        errors,
        stepId,
        field.key,
        t("propertyForm.images.errors.invalidType", { count: invalidTypeCount }),
      );
      return;
    }

    if (oversizeCount > 0) {
      addError(
        errors,
        stepId,
        field.key,
        t("propertyForm.images.errors.sizeExceeded", {
          count: oversizeCount,
          maxSize: MAX_WIZARD_IMAGE_SIZE_MB,
        }),
      );
    }
  }
}

/**
 * Validate one wizard step.
 *
 * @returns { ok: boolean, errors: object }
 */
export function validateStep({ profile, stepId, fields, formState, context, t }) {
  const errors = {};

  // If profile defines custom validations, allow it
  if (profile?.validateStep) {
    const res = profile.validateStep({ stepId, fields, formState, context, t });
    if (res && res.ok === false) {
      return {
        ok: false,
        errors: res.errors || {},
      };
    }
  }

  // Default field-based validation
  (fields || []).forEach((field) => {
    // visibility guard
    if (typeof field.visibleWhen === "function") {
      const visible = field.visibleWhen(context);
      if (!visible) return;
    }

    // resolve value (supports attributes.*)
    let value;
    if (typeof field.key === "string" && field.key.startsWith("attributes.")) {
      const attrKey = field.key.replace("attributes.", "");
      value = formState?.attributes?.[attrKey];
    } else {
      value = formState?.[field.key];
    }

    validateField({ field, value, stepId, t, errors });
  });

  // Cross-field validations (light)
  // Example: booking min <= max
  if (stepId === "conditions") {
    const minUnits = formState?.attributes?.bookingMinUnits;
    const maxUnits = formState?.attributes?.bookingMaxUnits;
    const minN = toNumber(minUnits);
    const maxN = toNumber(maxUnits);

    if (minN !== null && maxN !== null && minN > maxN) {
      addError(errors, stepId, "attributes.bookingMinUnits", t("wizard.validation.minGreaterThanMax"));
    }
  }

  // Property short-term: minStay <= maxStay
  if (context?.resourceType === "property" && context?.commercialMode === "rent_short_term") {
    const minStay = toNumber(formState?.minStayNights);
    const maxStay = toNumber(formState?.maxStayNights);
    if (minStay !== null && maxStay !== null && minStay > maxStay) {
      addError(errors, stepId, "minStayNights", t("wizard.validation.minGreaterThanMax"));
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}
