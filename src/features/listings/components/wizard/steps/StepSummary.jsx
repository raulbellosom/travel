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
  CalendarCheck,
  Pencil,
  FileText,
} from "lucide-react";
import LazyImage from "../../../../../components/common/atoms/LazyImage";
import {
  OPERATION_TYPES,
  PRICING_MODEL_OPTIONS,
  FURNISHED_OPTIONS,
  RENT_PERIOD_OPTIONS,
} from "../wizardConfig";
import {
  getCategoryTranslationKey,
  normalizeCategory,
  sanitizeCategory,
} from "../../../../../utils/resourceTaxonomy";
import { normalizeResourceType } from "../../../../../utils/resourceModel";

/**
 * Helper: resolve label from config options array.
 */
const resolveLabel = (options, value, t) => {
  const found = options.find((o) => o.value === value);
  if (!found) return value || "—";
  return found.key ? t(found.key) : found.label || value;
};

/**
 * A single summary section card.
 */
const SummarySection = ({ icon: Icon, title, onEdit, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-cyan-500" />}
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {title}
        </h3>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cyan-600 transition hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
      )}
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

/**
 * A labelled value row.
 */
const SummaryRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-1 text-sm">
    <span className="shrink-0 text-slate-500 dark:text-slate-400">{label}</span>
    <span className="text-right font-medium text-slate-800 dark:text-slate-100">
      {value || "—"}
    </span>
  </div>
);

/**
 * Step: Summary — Read-only review of all entered data before saving as draft.
 */
const StepSummary = ({ formHook, onEditStep }) => {
  const { t } = useTranslation();
  const {
    form,
    selectedAmenities,
    pendingImageItems,
    normalizedExistingImages,
    amenityNameField,
  } = formHook;

  const operationLabel = resolveLabel(OPERATION_TYPES, form.operationType, t);
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
    form.pricingModel || form.pricePerUnit,
    t,
  );
  const furnishedLabel = resolveLabel(FURNISHED_OPTIONS, form.furnished, t);
  const rentPeriodLabel = resolveLabel(RENT_PERIOD_OPTIONS, form.rentPeriod, t);

  const totalImages =
    (normalizedExistingImages?.length || 0) + (pendingImageItems?.length || 0);

  const formattedPrice = useMemo(() => {
    if (!form.price) return "—";
    const num = Number(form.price);
    if (!Number.isFinite(num)) return form.price;
    return `$${num.toLocaleString("es-MX", { minimumFractionDigits: 0 })} ${form.currency}`;
  }, [form.price, form.currency]);

  const locationParts = [form.city, form.state, form.country]
    .filter(Boolean)
    .join(", ");

  const goTo = (stepId) => {
    if (typeof onEditStep === "function") onEditStep(stepId);
  };

  return (
    <div className="space-y-4">
      {/* Draft banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {t("propertyForm.wizard.draftNotice", "Se guardará como borrador")}
          </p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
            {t(
              "propertyForm.wizard.draftNoticeBody",
              "Revisa la información antes de guardar. Podrás publicar tu propiedad después desde el panel de edición.",
            )}
          </p>
        </div>
      </div>

      {/* Type & Info */}
      <SummarySection
        icon={Home}
        title={t("propertyForm.wizard.steps.typeAndInfo", "Tipo e información")}
        onEdit={() => goTo("typeAndInfo")}
      >
        <SummaryRow
          label={t("propertyForm.fields.operationType", "Operación")}
          value={operationLabel}
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
          label={t("propertyForm.fields.title", "Título")}
          value={form.title}
        />
        <SummaryRow label="Slug" value={form.slug} />
        {form.description && (
          <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-700/40 dark:text-slate-300">
            {form.description.length > 200
              ? `${form.description.slice(0, 200)}…`
              : form.description}
          </div>
        )}
      </SummarySection>

      {/* Location */}
      <SummarySection
        icon={MapPin}
        title={t("propertyForm.wizard.steps.location", "Ubicación")}
        onEdit={() => goTo("location")}
      >
        <SummaryRow
          label={t("propertyForm.fields.location", "Ubicación")}
          value={locationParts}
        />
        {form.streetAddress && (
          <SummaryRow
            label={t("propertyForm.fields.streetAddress", "Dirección")}
            value={form.streetAddress}
          />
        )}
        {form.neighborhood && (
          <SummaryRow
            label={t("propertyForm.fields.neighborhood", "Colonia")}
            value={form.neighborhood}
          />
        )}
        {form.postalCode && (
          <SummaryRow
            label={t("propertyForm.fields.postalCode", "C.P.")}
            value={form.postalCode}
          />
        )}
      </SummarySection>

      {/* Features */}
      <SummarySection
        icon={Building2}
        title={t("propertyForm.wizard.steps.features", "Características")}
        onEdit={() => goTo("features")}
      >
        <div className="grid grid-cols-2 gap-x-4">
          <SummaryRow
            label={t("propertyForm.fields.bedrooms", "Recámaras")}
            value={form.bedrooms}
          />
          <SummaryRow
            label={t("propertyForm.fields.bathrooms", "Baños")}
            value={form.bathrooms}
          />
          <SummaryRow
            label={t("propertyForm.fields.parkingSpaces", "Estacionamiento")}
            value={form.parkingSpaces}
          />
          <SummaryRow
            label={t("propertyForm.fields.floors", "Pisos")}
            value={form.floors}
          />
          {form.totalArea && (
            <SummaryRow
              label={t("propertyForm.fields.totalArea", "Área total")}
              value={`${form.totalArea} m²`}
            />
          )}
          {form.builtArea && (
            <SummaryRow
              label={t("propertyForm.fields.builtArea", "Área construida")}
              value={`${form.builtArea} m²`}
            />
          )}
          {form.yearBuilt && (
            <SummaryRow
              label={t("propertyForm.fields.yearBuilt", "Año")}
              value={form.yearBuilt}
            />
          )}
        </div>
      </SummarySection>

      {/* Rental Terms (rent only) */}
      {form.commercialMode === "rent_long_term" && (
        <SummarySection
          icon={ClipboardList}
          title={t(
            "propertyForm.wizard.steps.rentalTerms",
            "Términos de renta",
          )}
          onEdit={() => goTo("rentalTerms")}
        >
          <SummaryRow
            label={t("propertyForm.fields.rentPeriod", "Periodo")}
            value={rentPeriodLabel}
          />
          <SummaryRow
            label={t("propertyForm.fields.furnished", "Amueblado")}
            value={furnishedLabel}
          />
          <SummaryRow
            label={t("propertyForm.fields.petsAllowed", "Mascotas")}
            value={
              form.petsAllowed ? t("common.yes", "Sí") : t("common.no", "No")
            }
          />
        </SummarySection>
      )}

      {/* Vacation Rules (vacation_rental only) */}
      {["rent_short_term", "rent_hourly"].includes(form.commercialMode) && (
        <SummarySection
          icon={CalendarCheck}
          title={t(
            "propertyForm.wizard.steps.vacationRules",
            "Reglas vacacionales",
          )}
          onEdit={() => goTo("vacationRules")}
        >
          <SummaryRow
            label={t("propertyForm.fields.maxGuests", "Huéspedes máximo")}
            value={form.maxGuests}
          />
          <SummaryRow
            label={t("propertyForm.fields.minStayNights", "Min. noches")}
            value={form.minStayNights}
          />
          <SummaryRow
            label={t("propertyForm.fields.maxStayNights", "Máx. noches")}
            value={form.maxStayNights}
          />
          <SummaryRow
            label={t("propertyForm.fields.checkInTime", "Check-in")}
            value={form.checkInTime}
          />
          <SummaryRow
            label={t("propertyForm.fields.checkOutTime", "Check-out")}
            value={form.checkOutTime}
          />
          <SummaryRow
            label={t("propertyForm.fields.furnished", "Amueblado")}
            value={furnishedLabel}
          />
          <SummaryRow
            label={t("propertyForm.fields.petsAllowed", "Mascotas")}
            value={
              form.petsAllowed ? t("common.yes", "Sí") : t("common.no", "No")
            }
          />
        </SummarySection>
      )}

      {/* Pricing */}
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
          label={t("propertyForm.fields.pricePer", "Por")}
          value={pricingModelLabel}
        />
        <SummaryRow
          label={t("propertyForm.fields.priceNegotiable", "Negociable")}
          value={
            form.priceNegotiable ? t("common.yes", "Sí") : t("common.no", "No")
          }
        />
      </SummarySection>

      {/* Amenities */}
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
            {t(
              "propertyForm.noAmenitiesSelected",
              "No se han seleccionado amenidades",
            )}
          </p>
        )}
      </SummarySection>

      {/* Images */}
      <SummarySection
        icon={Camera}
        title={t("propertyForm.wizard.steps.images", "Imágenes y medios")}
        onEdit={() => goTo("images")}
      >
        <SummaryRow
          label={t("propertyForm.images.count", "Imágenes")}
          value={totalImages > 0 ? totalImages : "—"}
        />
        {form.videoUrl && (
          <SummaryRow
            label={t("propertyForm.fields.videoUrl", "Video")}
            value={form.videoUrl}
          />
        )}
        {form.virtualTourUrl && (
          <SummaryRow
            label={t("propertyForm.fields.virtualTourUrl", "Tour virtual")}
            value={form.virtualTourUrl}
          />
        )}
        {/* Thumbnail strip */}
        {(pendingImageItems?.length > 0 ||
          normalizedExistingImages?.length > 0) && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {[...normalizedExistingImages, ...pendingImageItems]
              .slice(0, 6)
              .map((img, idx) => (
                <LazyImage
                  key={img.$id || img.id || idx}
                  src={img.url || img.previewUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              ))}
            {totalImages > 6 && (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                +{totalImages - 6}
              </div>
            )}
          </div>
        )}
      </SummarySection>
    </div>
  );
};

export default StepSummary;
