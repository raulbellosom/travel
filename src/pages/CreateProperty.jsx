import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropertyForm from "../features/listings/components/PropertyForm";
import { useAuth } from "../hooks/useAuth";
import { propertiesService } from "../services/propertiesService";
import { amenitiesService } from "../services/amenitiesService";
import { getErrorMessage } from "../utils/errors";
import { INTERNAL_ROUTES } from "../utils/internalRoutes";

const CreateProperty = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [amenitiesLoading, setAmenitiesLoading] = useState(true);
  const [amenities, setAmenities] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setAmenitiesLoading(true);

    amenitiesService
      .listActive()
      .then((items) => {
        if (!mounted) return;
        setAmenities(items || []);
      })
      .catch(() => {
        if (!mounted) return;
        setAmenities([]);
      })
      .finally(() => {
        if (!mounted) return;
        setAmenitiesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (values) => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");
    try {
      const { amenityIds = [], ...propertyData } = values;
      const created = await propertiesService.create(user.$id, propertyData);
      await amenitiesService.syncPropertyAmenities(created.$id, amenityIds);
      navigate(INTERNAL_ROUTES.myProperties, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t("createPropertyPage.errors.create")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("createPropertyPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("createPropertyPage.subtitle")}
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <PropertyForm
        mode="create"
        loading={loading}
        amenitiesOptions={amenities}
        amenitiesLoading={amenitiesLoading}
        submitLabel={t("createPropertyPage.submit")}
        onSubmit={handleSubmit}
      />
    </section>
  );
};

export default CreateProperty;
