/**
 * wizard/wizardState.js
 * Reducer-based state for the new wizard engine.
 *
 * State shape:
 * - formState: holds all user answers (root fields + `attributes` object)
 * - context: derived values (resourceType/category/commercialMode/bookingType/pricingModel) used by profiles
 * - stepIndex: active step index within the active steps list (computed in the component)
 * - stepErrors: flat map of errors keyed by "<stepId>.<fieldKey>"
 * - isSaving / saveResult / globalError: operational
 *
 * IMPORTANT:
 * - Do not store attributes as a JSON string in formState. Keep it as an object.
 * - Serialization happens in profile.toSchemaPatch() during save.
 */

export const initialWizardState = {
  formState: {
    resourceType: "property", // default; user can change in the future if you add a resourceType selector
    category: "",
    offeringId: "",
    pricingChoiceId: "",
    title: "",
    slug: "",
    description: "",
    price: "",
    currency: "MXN",
    priceNegotiable: false,
    // location (schema requires at least city/state)
    country: "MX",
    state: "",
    city: "",
    streetAddress: "",
    neighborhood: "",
    postalCode: "",
    latitude: "",
    longitude: "",
    // media placeholders (wizard handles uploads separately)
    imageFiles: [],
    videoUrl: "",
    virtualTourUrl: "",
    // attributes object for dynamic fields
    attributes: {},
  },
  context: {
    resourceType: "property",
    category: "",
    commercialMode: "",
    bookingType: "",
  },
  stepIndex: 0,
  stepErrors: {},
  isSaving: false,
  saveResult: null,
  globalError: null,
};

export function wizardReducer(state, action) {
  switch (action.type) {
    case "HYDRATE": {
      const { formState } = action.payload || {};
      const nextFormState = {
        ...state.formState,
        ...(formState || {}),
        attributes: {
          ...(state.formState.attributes || {}),
          ...((formState && formState.attributes) || {}),
        },
      };
      return {
        ...state,
        formState: nextFormState,
        context: {
          ...state.context,
          resourceType: nextFormState.resourceType || state.context.resourceType,
          category: nextFormState.category || state.context.category,
        },
      };
    }

    case "SET_FIELD": {
      const { key, value } = action.payload || {};
      if (!key) return state;

      // attributes.<key> support
      if (typeof key === "string" && key.startsWith("attributes.")) {
        const attrKey = key.replace("attributes.", "");
        return {
          ...state,
          formState: {
            ...state.formState,
            attributes: {
              ...(state.formState.attributes || {}),
              [attrKey]: value,
            },
          },
        };
      }

      return {
        ...state,
        formState: {
          ...state.formState,
          [key]: value,
        },
        // keep context lightly in sync for category/resourceType
        context:
          key === "resourceType"
            ? { ...state.context, resourceType: value }
            : key === "category"
              ? { ...state.context, category: value }
              : state.context,
      };
    }

    case "SET_CONTEXT": {
      const { context } = action.payload || {};
      return {
        ...state,
        context: {
          ...state.context,
          ...(context || {}),
        },
      };
    }

    case "NEXT_STEP": {
      const max = action.payload?.max ?? 9999;
      return {
        ...state,
        stepIndex: Math.min(state.stepIndex + 1, max - 1),
      };
    }

    case "PREV_STEP": {
      return {
        ...state,
        stepIndex: Math.max(state.stepIndex - 1, 0),
      };
    }

    case "SET_STEP_INDEX": {
      const stepIndex = Number(action.payload?.stepIndex ?? 0);
      return {
        ...state,
        stepIndex: Number.isFinite(stepIndex) ? Math.max(stepIndex, 0) : state.stepIndex,
      };
    }

    case "SET_STEP_ERRORS": {
      return {
        ...state,
        stepErrors: action.payload?.errors || {},
      };
    }

    case "SET_IS_SAVING": {
      return {
        ...state,
        isSaving: Boolean(action.payload?.isSaving),
      };
    }

    case "SET_SAVE_RESULT": {
      return {
        ...state,
        saveResult: action.payload?.result ?? null,
      };
    }

    case "SET_GLOBAL_ERROR": {
      return {
        ...state,
        globalError: action.payload?.error ?? null,
      };
    }

    default:
      return state;
  }
}

export const actions = {
  hydrate: (payload) => ({ type: "HYDRATE", payload }),
  setField: (payload) => ({ type: "SET_FIELD", payload }),
  setContext: (payload) => ({ type: "SET_CONTEXT", payload }),
  nextStep: (payload) => ({ type: "NEXT_STEP", payload }),
  prevStep: () => ({ type: "PREV_STEP" }),
  setStepIndex: (payload) => ({ type: "SET_STEP_INDEX", payload }),
  setStepErrors: (payload) => ({ type: "SET_STEP_ERRORS", payload }),
  setIsSaving: (payload) => ({ type: "SET_IS_SAVING", payload }),
  setSaveResult: (payload) => ({ type: "SET_SAVE_RESULT", payload }),
  setGlobalError: (payload) => ({ type: "SET_GLOBAL_ERROR", payload }),
};

export const selectors = {
  formState: (state) => state.formState || {},
  context: (state) => state.context || {},
  stepIndex: (state) => state.stepIndex || 0,
  stepErrors: (state) => state.stepErrors || {},
  isSaving: (state) => Boolean(state.isSaving),
  globalError: (state) => state.globalError,

  // Get a value by key supporting attributes.*
  getValue: (state, key) => {
    if (!key) return undefined;
    if (typeof key === "string" && key.startsWith("attributes.")) {
      const attrKey = key.replace("attributes.", "");
      return state.formState?.attributes?.[attrKey];
    }
    return state.formState?.[key];
  },

  resourceType: (state) => state.context?.resourceType || state.formState?.resourceType,
};
