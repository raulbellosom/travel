import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Home,
  MapPin,
  Building2,
  DollarSign,
  Sparkles,
  Camera,
  ClipboardList,
  Pencil,
  FileText,
} from "lucide-react";
import LazyImage from "../../../../../components/common/atoms/LazyImage";
import { COMMERCIAL_MODE_OPTIONS, PRICING_MODEL_OPTIONS } from "../wizardConfig";
import {
  getCategoryTranslationKey,
  normalizeCategory,
  sanitizeCategory,
} from "../../../../../utils/resourceTaxonomy";
import { normalizeResourceType } from "../../../../../utils/resourceModel";
import {
  formatResourceFieldValue,
  getResourceFieldLabel,
  getResourceFormProfile,
  parseResourceAttributes,
  toUiFieldValue,
} from "../../../../../utils/resourceFormProfile";
import { formatMoneyWithDenomination } from "../../../../../utils/money";

const resolveLabel = (options, value, t) => {
  const found = options.find((option) => option.value === value);
  if (!found) return value || "-";
  return found.key ? t(found.key) : found.label || value;
};

const SummarySection = ({ icon: Icon, title, onEdit, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-cyan-500" />}
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {title}
        </h3>
      </div>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cyan-600 transition hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20"
        >
          <Pencil className="h-3 w-3" />
          {"Editar"}
        </button>
      ) : null}
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

const SummaryRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-1 text-sm">
    <span className="shrink-0 text-slate-500 dark:text-slate-400">{label}</span>
    <span className="text-right font-medium text-slate-800 dark:text-slate-100">
      {value || "-"}
    </span>
  </div>
);

const DynamicRows = ({ fields, form, attributes, profile, t }) => {
  const rows = fields
    .map((field) => {
      const rawValue =
        field.source === "attributes" ? attributes[field.key] : form[field.key];
      const uiValue = toUiFieldValue(field, rawValue);
      const formattedValue = formatResourceFieldValue(field, uiValue, t);
      if (formattedValue === "-" && field.inputType !== "boolean") {
        return null;
      }

      return {
        key: field.key,
        label: getResourceFieldLabel(field, t, {
          commercialMode: profile.commercialMode,
        }),
        value: formattedValue,
      };
    })
    .filter(Boolean);

  if (rows.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {t("propertyForm.wizard.noDataCaptured", {
          defaultValue: "Aun no hay datos capturados en esta seccion.",
        })}
      </p>
    );
  }

  return rows.map((row) => (
    <SummaryRow key={row.key} label={row.label} value={row.value} />
  ));
};

const StepSummary = ({ formHook, onEditStep }) => {
  const { t } = useTranslation();
  const {
    form,
    selectedAmenities,
    pendingImageItems,
    normalizedExistingImages,
    amenityNameField,
  } = formHook;

  const commercialModeLabel = resolveLabel(
    COMMERCIAL_MODE_OPTIONS,
    form.commercialMode,
    t,
  );
  const resourceType = normalizeResourceType(form.resourceType);
  const categoryValue = sanitizeCategory(
    resourceType,
    normalizeCategory(form.category || form.propertyType),
  );
  const resourceTypeLabel = t(`propertyForm.options.resourceType.${resourceType}`, {
    defaultValue: resourceType,
  });
  const categoryLabel = t(getCategoryTranslationKey(categoryValue), {
    defaultValue: categoryValue,
  });
  const pricingModelLabel = resolveLabel(
    PRICING_MODEL_OPTIONS,
    form.pricingModel === "total" ? "fixed_total" : form.pricingModel,
    t,
  );

  const profile = useMemo(
    () =>
      getResourceFormProfile({
        resourceType: form.resourceType,
        category: form.category || form.propertyType,
        commercialMode: form.commercialMode,
      }),
    [form.category, form.commercialMode, form.propertyType, form.resourceType],
  );

  const attributes = useMemo(
    () => parseResourceAttributes(form.attributes),
    [form.attributes],
  );

  const totalImages =
    (normalizedExistingImages?.length || 0) + (pendingImageItems?.length || 0);

  const formattedPrice = useMemo(() => {
    if (!form.price) return "-";
    const num = Number(form.price);
    if (!Number.isFinite(num)) return form.price;
    return formatMoneyWithDenomination(num, {
      locale: "es-MX",
      currency: form.currency || "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [form.price, form.currency]);

  const locationParts = [form.city, form.state, form.country]
    .filter(Boolean)
    .join(", ");

  const goTo = (stepId) => {
    if (typeof onEditStep === "function") onEditStep(stepId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {t("propertyForm.wizard.draftNotice", "Se guardara como borrador")}
          </p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
            {t(
              "propertyForm.wizard.draftNoticeBody",
              "Revisa la informacion antes de guardar. Podras publicar despues desde el panel de edicion.",
            )}
          </p>
        </div>
      </div>

      <SummarySection
        icon={Home}
        title={t("propertyForm.wizard.steps.typeAndInfo", "Tipo e informacion")}
        onEdit={() => goTo("typeAndInfo")}
      >
        <SummaryRow
          label={t("propertyForm.fields.commercialMode", "Modo comercial")}
          value={commercialModeLabel}
        />
        <SummaryRow
          label={t("propertyForm.fields.resourceType", {
            defaultValue: "Resource type",
          })}
          value={resourceTypeLabel}
        />
        <SummaryRow
          label={t("propertyForm.fields.category", { defaultValue: "Categoria" })}
          value={categoryLabel}
        />
        <SummaryRow
          label={t("propertyForm.fields.title", "Titulo")}
          value={form.title}
        />
        <SummaryRow label="Slug" value={form.slug} />
        {form.description ? (
          <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-700/40 dark:text-slate-300">
            {form.description.length > 200
              ? `${form.description.slice(0, 200)}...`
              : form.description}
          </div>
        ) : null}
      </SummarySection>

      <SummarySection
        icon={MapPin}
        title={t("propertyForm.wizard.steps.location", "Ubicacion")}
        onEdit={() => goTo("location")}
      >
        <SummaryRow
          label={t("propertyForm.fields.location", "Ubicacion")}
          value={locationParts}
        />
        {form.streetAddress ? (
          <SummaryRow
            label={t("propertyForm.fields.streetAddress", "Direccion")}
            value={form.streetAddress}
          />
        ) : null}
        {form.neighborhood ? (
          <SummaryRow
            label={t("propertyForm.fields.neighborhood", "Colonia")}
            value={form.neighborhood}
          />
        ) : null}
        {form.postalCode ? (
          <SummaryRow
            label={t("propertyForm.fields.postalCode", "CP")}
            value={form.postalCode}
          />
        ) : null}
      </SummarySection>

      {profile.features.length > 0 ? (
        <SummarySection
          icon={Building2}
          title={t("propertyForm.wizard.steps.features", "Caracteristicas")}
          onEdit={() => goTo("features")}
        >
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <DynamicRows
              fields={profile.features}
              form={form}
              attributes={attributes}
              profile={profile}
              t={t}
            />
          </div>
        </SummarySection>
      ) : null}

      {profile.commercialConditions.length > 0 ? (
        <SummarySection
          icon={ClipboardList}
          title={t(
            "propertyForm.wizard.steps.commercialConditions",
            "Condiciones comerciales",
          )}
          onEdit={() => goTo("commercialConditions")}
        >
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <DynamicRows
              fields={profile.commercialConditions}
              form={form}
              attributes={attributes}
              profile={profile}
              t={t}
            />
          </div>
        </SummarySection>
      ) : null}

      <SummarySection
        icon={DollarSign}
        title={t("propertyForm.wizard.steps.pricing", "Precio")}
        onEdit={() => goTo("pricing")}
      >
        <SummaryRow
          label={t("propertyForm.fields.price", "Precio")}
          value={formattedPrice}
        />
        <SummaryRow
          label={t("propertyForm.fields.pricingModel", "Modelo de precio")}
          value={pricingModelLabel}
        />
        <SummaryRow
          label={t("propertyForm.fields.priceNegotiable", "Negociable")}
          value={
            form.priceNegotiable ? t("common.yes", "Si") : t("common.no", "No")
          }
        />
      </SummarySection>

      <SummarySection
        icon={Sparkles}
        title={t("propertyForm.wizard.steps.amenities", "Amenidades")}
        onEdit={() => goTo("amenities")}
      >
        {selectedAmenities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {selectedAmenities.map((amenity) => {
              const label =
                amenity[amenityNameField] ||
                amenity.name_es ||
                amenity.name_en ||
                amenity.slug ||
                amenity.$id;
              return (
                <span
                  key={amenity.$id}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                >
                  {label}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t("propertyForm.noAmenitiesSelected", "No se han seleccionado amenidades")}
          </p>
        )}
      </SummarySection>

      <SummarySection
        icon={Camera}
        title={t("propertyForm.wizard.steps.images", "Imagenes y medios")}
        onEdit={() => goTo("images")}
      >
        <SummaryRow
          label={t("propertyForm.images.count", "Imagenes")}
          value={totalImages > 0 ? totalImages : "-"}
        />
        {form.videoUrl ? (
          <SummaryRow
            label={t("propertyForm.fields.videoUrl", "Video")}
            value={form.videoUrl}
          />
        ) : null}
        {form.virtualTourUrl ? (
          <SummaryRow
            label={t("propertyForm.fields.virtualTourUrl", "Tour virtual")}
            value={form.virtualTourUrl}
          />
        ) : null}

        {(pendingImageItems?.length > 0 ||
          normalizedExistingImages?.length > 0) ? (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {[...normalizedExistingImages, ...pendingImageItems]
              .slice(0, 6)
              .map((image, index) => (
                <LazyImage
                  key={image.$id || image.id || index}
                  src={image.url || image.previewUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              ))}
            {totalImages > 6 ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                +{totalImages - 6}
              </div>
            ) : null}
          </div>
        ) : null}
      </SummarySection>
    </div>
  );
};

export default StepSummary;
