import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropertyWizard from "../features/properties/wizard/PropertyWizard";
import { useAuth } from "../hooks/useAuth";
import { resourcesService } from "../services/resourcesService";
import { getErrorMessage } from "../utils/errors";
import {
  INTERNAL_ROUTES,
  getInternalResourceDetailRoute,
} from "../utils/internalRoutes";
import { useToast } from "../hooks/useToast";
import { X } from "lucide-react";

const CreateProperty = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const handleSave = async (patch, _meta) => {
    void _meta;
    if (!user?.$id) return null;

    setError("");
    showToast({
      type: "info",
      title: t("createPropertyPage.title"),
      message: t(
        "createPropertyPage.messages.saving",
        "Guardando publicacion...",
      ),
      durationMs: 1800,
    });

    try {
      const { imageFiles = [], ...resourcePatch } = patch || {};

      const created = await resourcesService.create(user.$id, resourcePatch);

      if (Array.isArray(imageFiles) && imageFiles.length > 0) {
        try {
          await resourcesService.uploadResourceImages(created.$id, imageFiles, {
            title: resourcePatch.title,
            startingSortOrder: 0,
            existingFileIds: created.galleryImageIds || [],
          });
        } catch (uploadError) {
          showToast({
            type: "warning",
            title: t("createPropertyPage.title"),
            message: getErrorMessage(
              uploadError,
              t(
                "createPropertyPage.errors.imagesUpload",
                "La publicacion se creo, pero no se pudieron subir las imagenes.",
              ),
            ),
            durationMs: 8000,
          });
        }
      }

      showToast({
        type: "success",
        title: t("createPropertyPage.title"),
        message: t(
          "createPropertyPage.messages.saved",
          "Publicacion creada correctamente.",
        ),
      });

      navigate(getInternalResourceDetailRoute(created.$id), { replace: true });
      return created;
    } catch (err) {
      const message = getErrorMessage(
        err,
        t("createPropertyPage.errors.create"),
      );
      setError(message);
      showToast({
        type: "error",
        title: t("createPropertyPage.errors.create"),
        message,
        durationMs: 7000,
      });
      throw err;
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

      <PropertyWizard
        mode="create"
        onSave={handleSave}
        onCancel={() => navigate(INTERNAL_ROUTES.myProperties)}
      />
    </section>
  );
};

export default CreateProperty;
