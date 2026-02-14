import { useTranslation } from "react-i18next";
import { ImagePlus, Camera, Trash2, Film, Globe } from "lucide-react";
import { formatFileSize } from "../useWizardForm";

/**
 * Step: Images & Media — drag-drop image upload, gallery/camera, video & virtual tour URLs.
 */
const StepImages = ({ formHook, mode = "create" }) => {
  const { t } = useTranslation();

  const {
    form,
    setField,
    pendingImageItems,
    normalizedExistingImages,
    imageUploadError,
    isDraggingImages,
    galleryInputRef,
    cameraInputRef,
    handleGalleryInputChange,
    handleCameraInputChange,
    handleImageDragOver,
    handleImageDragLeave,
    handleImageDrop,
    removePendingImage,
    getFieldClassName,
    renderFieldError,
  } = formHook;

  const totalImages =
    (normalizedExistingImages?.length || 0) + (pendingImageItems?.length || 0);

  return (
    <div className="space-y-6">
      {/* ── Drop zone ─────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t("propertyForm.images.dropHint", "Arrastra imágenes aquí")}
        onDragOver={handleImageDragOver}
        onDragLeave={handleImageDragLeave}
        onDrop={handleImageDrop}
        onClick={() => galleryInputRef?.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            galleryInputRef?.current?.click();
          }
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all ${
          isDraggingImages
            ? "border-cyan-400 bg-cyan-50/60 dark:border-cyan-500 dark:bg-cyan-900/20"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-slate-500"
        }`}
      >
        <ImagePlus
          className={`mb-3 h-10 w-10 ${
            isDraggingImages
              ? "text-cyan-500"
              : "text-slate-400 dark:text-slate-500"
          }`}
        />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {t(
            "propertyForm.images.dropTitle",
            "Arrastra imágenes aquí o haz clic",
          )}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          PNG, JPG, WEBP — máx. 10 MB c/u — máx. 50 imágenes
        </p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleGalleryInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraInputChange}
      />

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => galleryInputRef?.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <ImagePlus className="h-4 w-4" />
          {t("propertyForm.images.gallery", "Galería")}
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef?.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Camera className="h-4 w-4" />
          {t("propertyForm.images.camera", "Cámara")}
        </button>
      </div>

      {/* Upload error */}
      {imageUploadError && (
        <p className="text-xs text-red-600 dark:text-red-300">
          ⚠ {imageUploadError}
        </p>
      )}

      {/* Count */}
      {totalImages > 0 && (
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("propertyForm.images.count", "Imágenes")} ({totalImages})
        </p>
      )}

      {/* ── Existing images (edit mode) ───────── */}
      {normalizedExistingImages.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("propertyForm.images.existing", "Imágenes existentes")}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {normalizedExistingImages.map((img) => (
              <div
                key={img.$id || img.fileId}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <img
                  src={img.url || img.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pending images (new uploads) ──────── */}
      {pendingImageItems.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("propertyForm.images.pending", "Nuevas imágenes")}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {pendingImageItems.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {/* File size badge */}
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {formatFileSize(item.file?.size)}
                </span>
                {/* Remove button */}
                <button
                  type="button"
                  aria-label={t(
                    "propertyForm.images.remove",
                    "Eliminar imagen",
                  )}
                  onClick={() => removePendingImage(item.id)}
                  className="absolute right-1 top-1 rounded-full bg-red-600/80 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Video URL ──────────────────────────── */}
      <label className="grid gap-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
          <Film className="h-4 w-4 text-slate-400" />
          {t("propertyForm.fields.videoUrl")}
        </span>
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={form.videoUrl || ""}
          className={getFieldClassName("videoUrl")}
          onChange={(e) => setField("videoUrl", e.target.value)}
        />
        {renderFieldError("videoUrl")}
      </label>

      {/* ── Virtual tour URL ──────────────────── */}
      <label className="grid gap-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
          <Globe className="h-4 w-4 text-slate-400" />
          {t("propertyForm.fields.virtualTourUrl")}
        </span>
        <input
          type="url"
          placeholder="https://tour.example.com/..."
          value={form.virtualTourUrl || ""}
          className={getFieldClassName("virtualTourUrl")}
          onChange={(e) => setField("virtualTourUrl", e.target.value)}
        />
        {renderFieldError("virtualTourUrl")}
      </label>
    </div>
  );
};

export default StepImages;
