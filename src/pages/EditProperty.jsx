import SkeletonLoader from "../components/common/molecules/SkeletonLoader";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Eye, X } from "lucide-react";
import PropertyTabsEditor from "../features/properties/wizard/PropertyTabsEditor";
import { useAuth } from "../hooks/useAuth";
import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";
import { useToast } from "../hooks/useToast";
import {
  INTERNAL_ROUTES,
  getInternalPropertyDetailRoute,
} from "../utils/internalRoutes";

const EditProperty = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [initialResourceDoc, setInitialResourceDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setLoading(true);
    setError("");

    propertiesService
      .getById(id)
      .then((doc) => {
        if (!mounted) return;
        setInitialResourceDoc(doc || null);
      })
      .catch((err) => {
        if (!mounted) return;
        const message = getErrorMessage(err, t("editPropertyPage.errors.load"));
        setError(message);
        showToast({
          type: "error",
          title: t("editPropertyPage.errors.load"),
          message,
          durationMs: 7000,
        });
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, showToast, t]);

  const handleSave = async (patch, _meta) => {
    void _meta;
    if (!id || !user?.$id) return null;

    setError("");
    showToast({
      type: "info",
      title: t("editPropertyPage.title"),
      message: t("editPropertyPage.messages.saving", "Guardando cambios..."),
      durationMs: 1800,
    });

    try {
      const { imageFiles = [], ...resourcePatch } = patch || {};

      const updated = await propertiesService.update(id, user.$id, resourcePatch);

      if (Array.isArray(imageFiles) && imageFiles.length > 0) {
        const existingImages = await propertiesService.listImages(id).catch(() => []);
        const nextSortOrder =
          existingImages.reduce(
            (maxOrder, image) => Math.max(maxOrder, Number(image?.sortOrder || 0)),
            -1,
          ) + 1;

        await propertiesService.uploadPropertyImages(id, imageFiles, {
          title: resourcePatch.title || initialResourceDoc?.title || "",
          startingSortOrder: nextSortOrder,
          existingFileIds: Array.from(
            new Set([
              ...(Array.isArray(initialResourceDoc?.galleryImageIds)
                ? initialResourceDoc.galleryImageIds
                : []),
              ...existingImages.map((image) => image.fileId),
            ]),
          ),
        });
      }

      setInitialResourceDoc(updated);
      showToast({
        type: "success",
        title: t("editPropertyPage.title"),
        message: t("editPropertyPage.messages.saved", "Cambios guardados correctamente."),
      });

      return updated;
    } catch (err) {
      const message = getErrorMessage(err, t("editPropertyPage.errors.save"));
      setError(message);
      showToast({
        type: "error",
        title: t("editPropertyPage.errors.save"),
        message,
        durationMs: 7000,
      });
      throw err;
    }
  };

  if (loading) {
    return <SkeletonLoader variant="detail" className="py-4" />;
  }

  if (!initialResourceDoc) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        {error || t("editPropertyPage.errors.notFound")}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {t("editPropertyPage.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {initialResourceDoc.title}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={INTERNAL_ROUTES.myProperties}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            {t("appPropertyDetailPage.actions.backToList", "Volver al listado")}
          </Link>
          {id ? (
            <Link
              to={getInternalPropertyDetailRoute(id)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-900/50"
            >
              <Eye size={16} />
              {t("propertyForm.editor.viewSummary", "Ver resumen")}
            </Link>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <div className="flex items-start justify-between gap-3">
            <p className="break-words">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-md p-1 opacity-80 transition hover:bg-red-100 hover:opacity-100 dark:hover:bg-red-900/40"
              aria-label={t("common.close", "Cerrar")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <PropertyTabsEditor
        initialResourceDoc={initialResourceDoc}
        onSave={handleSave}
        onCancel={() => {
          if (id) {
            navigate(getInternalPropertyDetailRoute(id));
            return;
          }
          navigate(INTERNAL_ROUTES.myProperties);
        }}
      />
    </section>
  );
};

export default EditProperty;
