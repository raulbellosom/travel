import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropertyForm from "../features/listings/components/PropertyForm";
import { useAuth } from "../hooks/useAuth";
import { propertiesService } from "../services/propertiesService";
import { amenitiesService } from "../services/amenitiesService";
import { getErrorMessage } from "../utils/errors";
import { INTERNAL_ROUTES } from "../utils/internalRoutes";

const EditProperty = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState(null);
  const [amenities, setAmenities] = useState([]);
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
      amenitiesService.listPropertyAmenityIds(id).catch(() => []),
    ])
      .then(([doc, amenityOptions, selectedAmenityIds]) => {
        if (!mounted) return;
        if (doc.userId !== user?.$id) {
          navigate(INTERNAL_ROUTES.dashboard, { replace: true });
          return;
        }

        setAmenities(amenityOptions || []);
        setInitialValues({
          ...doc,
          amenityIds: Array.isArray(selectedAmenityIds) ? selectedAmenityIds : [],
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
  }, [id, navigate, t, user?.$id]);

  const handleSubmit = async (values) => {
    if (!id || !user?.$id) return;
    setSaving(true);
    setError("");
    try {
      const { amenityIds = [], ...propertyData } = values;
      await propertiesService.update(id, user.$id, propertyData);
      await amenitiesService.syncPropertyAmenities(id, amenityIds);
      navigate(INTERNAL_ROUTES.myProperties, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t("editPropertyPage.errors.save")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">{t("editPropertyPage.loading")}</p>;
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
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("editPropertyPage.title")}
        </h1>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <PropertyForm
        initialValues={initialValues}
        loading={saving}
        amenitiesOptions={amenities}
        amenitiesLoading={false}
        submitLabel={t("editPropertyPage.submit")}
        onSubmit={handleSubmit}
      />
    </section>
  );
};

export default EditProperty;
