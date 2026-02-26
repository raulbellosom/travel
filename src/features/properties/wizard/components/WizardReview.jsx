import React, { useMemo } from "react";

const EMPTY_VALUE = "-";

function getValueByKey(formState, key) {
  if (!key) return undefined;
  if (key.startsWith("attributes.")) {
    const attrKey = key.replace("attributes.", "");
    return formState?.attributes?.[attrKey];
  }
  return formState?.[key];
}

function isEmptyValue(value) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function getOptionLabel(options = [], value) {
  const normalizedValue = String(value ?? "");
  const selected = (Array.isArray(options) ? options : []).find((option) => {
    const optionValue = String(option?.value ?? option?.id ?? "");
    return optionValue === normalizedValue;
  });
  return selected?.label || EMPTY_VALUE;
}

function getCommercialModeLabel(commercialMode, t) {
  const byMode = {
    sale: t("wizard.offerings.property.sell.label", { defaultValue: "Venta" }),
    rent_long_term: t("wizard.offerings.property.rent_long_term.label", {
      defaultValue: "Renta larga",
    }),
    rent_short_term: t("wizard.offerings.service.per_event_or_day.label", {
      defaultValue: "Por fecha / por dia",
    }),
    rent_hourly: t("wizard.offerings.service.per_hour.label", {
      defaultValue: "Por horas",
    }),
  };
  return byMode[String(commercialMode || "").trim()] || EMPTY_VALUE;
}

function getBookingTypeLabel(bookingType, t) {
  const byType = {
    manual_contact: t("wizard.bookingType.manualContact", {
      defaultValue: "Reservacion por contacto",
    }),
    date_range: t("wizard.bookingType.onlineDateRange", {
      defaultValue: "Reserva en linea (fechas)",
    }),
    time_slot: t("wizard.bookingType.onlineTimeSlot", {
      defaultValue: "Reserva en linea (horarios)",
    }),
    fixed_event: t("wizard.bookingType.onlineTimeSlot", {
      defaultValue: "Reserva en linea (horarios)",
    }),
  };
  return byType[String(bookingType || "").trim()] || EMPTY_VALUE;
}

function getPricingModelLabel(pricingModel, t) {
  const byModel = {
    fixed_total: t("wizard.pricing.fixed_total"),
    total: t("wizard.pricing.fixed_total"),
    per_m2: t("wizard.pricing.per_m2"),
    per_month: t("wizard.pricing.per_month"),
    per_night: t("wizard.pricing.per_night"),
    per_day: t("wizard.pricing.per_day"),
    per_hour: t("wizard.pricing.per_hour"),
    per_person: t("wizard.pricing.per_person"),
    per_event: t("wizard.pricing.per_event"),
  };
  return byModel[String(pricingModel || "").trim()] || EMPTY_VALUE;
}

function formatFieldValue(field, rawValue, t) {
  if (isEmptyValue(rawValue)) return EMPTY_VALUE;

  if (field.type === "boolean") {
    return rawValue
      ? t("common.yes", { defaultValue: "Si" })
      : t("common.no", { defaultValue: "No" });
  }

  if (field.type === "select") {
    const value = getOptionLabel(field.options || [], rawValue);
    return value || EMPTY_VALUE;
  }

  if (field.type === "images") {
    const count = Array.isArray(rawValue) ? rawValue.length : 0;
    return t("propertyForm.images.count", {
      count,
      defaultValue: `${count} imagen(es)`,
    });
  }

  if (field.type === "amenities") {
    const count = Array.isArray(rawValue) ? rawValue.length : 0;
    return t("propertyForm.amenities.selected", {
      count,
      defaultValue: `${count} seleccionada(s)`,
    });
  }

  if (Array.isArray(rawValue)) {
    const joined = rawValue
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(", ");
    return joined || EMPTY_VALUE;
  }

  return String(rawValue).trim() || EMPTY_VALUE;
}

function buildStepItems({ profile, step, formState, context, t }) {
  const fields = profile?.getFieldsForStep?.({
    t,
    context,
    stepId: step.id,
  });

  const items = (Array.isArray(fields) ? fields : [])
    .map((field) => {
      const rawValue = getValueByKey(formState, field.key);
      return {
        key: field.key,
        label: field.labelKey ? t(field.labelKey) : field.key,
        value: formatFieldValue(field, rawValue, t),
      };
    })
    .filter((item) => item.value !== EMPTY_VALUE);

  return items;
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value || EMPTY_VALUE}
      </div>
    </div>
  );
}

function StepSummaryCard({ title, description, items, t }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <header>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </header>

      {items.length > 0 ? (
        <dl className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={item.key} className="grid gap-1 md:grid-cols-[220px_minmax(0,1fr)]">
              <dt className="text-xs text-slate-500 dark:text-slate-400">{item.label}</dt>
              <dd className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {t("wizard.review.noData", {
            defaultValue: "Sin datos capturados en esta etapa.",
          })}
        </p>
      )}
    </section>
  );
}

/**
 * WizardReview
 * Detailed, stage-based summary before save.
 */
export default function WizardReview({ profile, formState, context, t }) {
  const categoryLabel = useMemo(() => {
    const options = profile?.getCategoryOptions?.({ t });
    const selected = (Array.isArray(options) ? options : []).find(
      (item) => item.id === context?.category,
    );
    return selected?.label || context?.category || EMPTY_VALUE;
  }, [profile, t, context?.category]);

  const resourceTypeLabel = context?.resourceType
    ? t(`propertyForm.options.resourceType.${context.resourceType}`)
    : EMPTY_VALUE;

  const summaryPatch = useMemo(() => {
    try {
      return profile.toSchemaPatch({ formState, context });
    } catch {
      return null;
    }
  }, [profile, formState, context]);

  const stageSummaries = useMemo(() => {
    const steps = profile?.getNarrativeSteps?.({ t, context }) || [];
    return steps
      .filter((step) => step.id !== "review")
      .map((step) => {
        const items = buildStepItems({
          profile,
          step,
          formState,
          context,
          t,
        });

        if (step.id === "publishWhat") {
          items.unshift(
            {
              key: "resourceType",
              label: t("propertyForm.fields.resourceType"),
              value: resourceTypeLabel,
            },
            {
              key: "category",
              label: t("propertyForm.fields.category"),
              value: categoryLabel,
            },
          );
        }

        if (step.id === "howOffer") {
          items.push(
            {
              key: "commercialMode",
              label: t("propertyForm.fields.commercialMode"),
              value: getCommercialModeLabel(
                summaryPatch?.commercialMode || context?.commercialMode,
                t,
              ),
            },
            {
              key: "bookingType",
              label: t("propertyForm.fields.bookingType"),
              value: getBookingTypeLabel(
                summaryPatch?.bookingType || context?.bookingType,
                t,
              ),
            },
          );
        }

        if (step.id === "price") {
          items.push({
            key: "pricingModel",
            label: t("propertyForm.fields.pricingModel"),
            value: getPricingModelLabel(summaryPatch?.pricingModel, t),
          });
        }

        const deduped = Array.from(
          new Map(items.map((item) => [item.key, item])).values(),
        );

        return {
          id: step.id,
          title: step.title,
          description: step.description,
          items: deduped,
        };
      });
  }, [
    profile,
    t,
    context,
    formState,
    resourceTypeLabel,
    categoryLabel,
    summaryPatch?.commercialMode,
    summaryPatch?.bookingType,
    summaryPatch?.pricingModel,
  ]);

  if (!summaryPatch) {
    return (
      <div className="text-sm text-slate-600 dark:text-slate-300">
        {t("wizard.errors.missingProfile")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("wizard.steps.review.title")}
        </div>
        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          {t("wizard.steps.review.description")}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <InfoCard
          label={t("propertyForm.fields.resourceType")}
          value={resourceTypeLabel}
        />
        <InfoCard label={t("propertyForm.fields.category")} value={categoryLabel} />
        <InfoCard
          label={t("propertyForm.fields.commercialMode")}
          value={getCommercialModeLabel(summaryPatch.commercialMode, t)}
        />
        <InfoCard
          label={t("propertyForm.fields.bookingType")}
          value={getBookingTypeLabel(summaryPatch.bookingType, t)}
        />
        <InfoCard
          label={t("propertyForm.fields.pricingModel")}
          value={getPricingModelLabel(summaryPatch.pricingModel, t)}
        />
        <InfoCard
          label={t("wizard.fields.price.label")}
          value={
            summaryPatch.price != null && summaryPatch.price !== ""
              ? `${summaryPatch.price} ${summaryPatch.currency || ""}`.trim()
              : EMPTY_VALUE
          }
        />
      </div>

      <div className="space-y-3">
        {stageSummaries.map((stage) => (
          <StepSummaryCard
            key={stage.id}
            title={stage.title}
            description={stage.description}
            items={stage.items}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
