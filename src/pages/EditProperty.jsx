import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Eye } from "lucide-react";
import PropertyEditor from "../features/listings/components/editor/PropertyEditor";
import { useAuth } from "../hooks/useAuth";
import { propertiesService } from "../services/propertiesService";
import { amenitiesService } from "../services/amenitiesService";
import { getErrorMessage } from "../utils/errors";
import {
  INTERNAL_ROUTES,
  getInternalPropertyDetailRoute,
} from "../utils/internalRoutes";

const EditProperty = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([
      propertiesService.getById(id),
      amenitiesService.listActive().catch(() => []),
      propertiesService.listImages(id).catch(() => []),
    ])
      .then(([doc, amenityOptions, imageDocs]) => {
        if (!mounted) return;

        // Get amenity IDs from the amenities slugs in the property document
        const amenitySlugs = Array.isArray(doc.amenities) ? doc.amenities : [];
        const selectedAmenityIds = amenityOptions
          .filter((amenity) => amenitySlugs.includes(amenity.slug))
          .map((amenity) => amenity.$id);

        setAmenities(amenityOptions || []);
        setExistingImages(Array.isArray(imageDocs) ? imageDocs : []);
        setInitialValues({
          ...doc,
          amenityIds: selectedAmenityIds,
        });
      })
      .catch((err) => {
        if (!mounted) return;
        setError(getErrorMessage(err, t("editPropertyPage.errors.load")));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, t]);

  const handleSubmit = async (values) => {
    if (!id || !user?.$id) return;
    setSaving(true);
    setError("");
    try {
      const { amenityIds = [], imageFiles = [], ...propertyData } = values;

      // Convert amenity IDs to slugs
      const amenitySlugs = await amenitiesService.convertIdsToSlugs(amenityIds);

      // Update property with amenities array included
      await propertiesService.update(id, user.$id, {
        ...propertyData,
        amenities: amenitySlugs,
      });

      // Upload new images if any
      if (Array.isArray(imageFiles) && imageFiles.length > 0) {
        const nextSortOrder =
          existingImages.reduce(
            (maxOrder, image) =>
              Math.max(maxOrder, Number(image?.sortOrder || 0)),
            -1,
          ) + 1;
        await propertiesService.uploadPropertyImages(id, imageFiles, {
          title: propertyData.title || initialValues?.title || "",
          startingSortOrder: nextSortOrder,
          existingFileIds: Array.from(
            new Set([
              ...(Array.isArray(initialValues?.galleryImageIds)
                ? initialValues.galleryImageIds
                : []),
              ...existingImages.map((image) => image.fileId),
            ]),
          ),
        });
      }

      navigate(INTERNAL_ROUTES.myProperties, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t("editPropertyPage.errors.save")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t("editPropertyPage.loading")}
      </p>
    );
  }

  if (!initialValues) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        {error || t("editPropertyPage.errors.notFound")}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {t("editPropertyPage.title")}
          </h1>
          {initialValues && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {initialValues.title}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={INTERNAL_ROUTES.myProperties}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            {t("appPropertyDetailPage.actions.backToList", "Volver al listado")}
          </Link>
          {id && (
            <Link
              to={getInternalPropertyDetailRoute(id)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-900/50"
            >
              <Eye size={16} />
              {t("propertyForm.editor.viewSummary", "Ver resumen")}
            </Link>
          )}
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <PropertyEditor
        propertyId={id}
        initialValues={initialValues}
        loading={saving}
        amenitiesOptions={amenities}
        amenitiesLoading={false}
        existingImages={existingImages}
        onSubmit={handleSubmit}
      />
    </section>
  );
};

export default EditProperty;
