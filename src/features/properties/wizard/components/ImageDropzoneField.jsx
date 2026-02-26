import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { ImageViewerModal } from "../../../../components/common/organisms/ImageViewerModal";

const MAX_IMAGE_FILES = 50;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp";

function toFileSignature(file) {
  return `${String(file?.name || "").trim()}-${Number(file?.size || 0)}-${Number(
    file?.lastModified || 0,
  )}`;
}

function isFileLike(file) {
  if (!file || typeof file !== "object") return false;
  if (typeof file.name !== "string") return false;
  if (!Number.isFinite(Number(file.size))) return false;
  return true;
}

function isValidImageFile(file) {
  const mime = String(file?.type || "").trim().toLowerCase();
  if (["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(mime)) {
    return true;
  }

  const filename = String(file?.name || "").trim().toLowerCase();
  return /\.(png|jpe?g|webp)$/.test(filename);
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeFiles(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(isFileLike);
}

function normalizeExistingImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((image, index) => {
      const url = String(image?.url || image?.previewUrl || "").trim();
      if (!url) return null;

      const fallbackId = image?.fileId || image?.$id || `existing-${index}`;
      return {
        id: String(fallbackId || `existing-${index}`),
        url,
        isMain: Boolean(image?.isMain),
        altText: String(image?.altText || "").trim(),
      };
    })
    .filter(Boolean);
}

export default function ImageDropzoneField({
  value,
  error,
  t,
  onChange,
  existingImages = [],
  existingImagesLoading = false,
}) {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const previewItemsRef = useRef([]);

  const files = useMemo(() => normalizeFiles(value), [value]);
  const normalizedExistingImages = useMemo(
    () => normalizeExistingImages(existingImages),
    [existingImages],
  );
  const [previewItems, setPreviewItems] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  const existingViewerImages = useMemo(
    () => normalizedExistingImages.map((item) => item.url),
    [normalizedExistingImages],
  );
  const pendingViewerImages = useMemo(
    () => previewItems.map((item) => item.previewUrl).filter(Boolean),
    [previewItems],
  );

  useEffect(() => {
    previewItemsRef.current = previewItems;
  }, [previewItems]);

  useEffect(() => {
    setPreviewItems((previous) => {
      const previousBySignature = new Map(
        previous.map((item) => [item.signature, item]),
      );

      const nextItems = [];
      const seen = new Set();

      files.forEach((file) => {
        const signature = toFileSignature(file);
        if (seen.has(signature)) return;
        seen.add(signature);

        const existing = previousBySignature.get(signature);
        if (existing && existing.file === file) {
          nextItems.push(existing);
          previousBySignature.delete(signature);
          return;
        }

        if (existing?.previewUrl) {
          URL.revokeObjectURL(existing.previewUrl);
        }

        nextItems.push({
          signature,
          file,
          previewUrl: URL.createObjectURL(file),
        });
        previousBySignature.delete(signature);
      });

      previousBySignature.forEach((item) => {
        if (item?.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      return nextItems;
    });
  }, [files]);

  useEffect(
    () => () => {
      previewItemsRef.current.forEach((item) => {
        if (item?.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    },
    [],
  );

  const updateFiles = useCallback(
    (nextFiles) => {
      onChange?.(Array.isArray(nextFiles) ? nextFiles : []);
    },
    [onChange],
  );

  const addFiles = useCallback(
    (fileList) => {
      const incoming = Array.from(fileList || []).filter(isFileLike);
      if (incoming.length === 0) return;

      const existingSignatures = new Set(files.map(toFileSignature));
      const availableSlots = Math.max(0, MAX_IMAGE_FILES - files.length);

      if (availableSlots === 0) {
        setUploadError(
          t("propertyForm.images.errors.maxFiles", {
            maxFiles: MAX_IMAGE_FILES,
          }),
        );
        return;
      }

      const accepted = [];
      let invalidTypeCount = 0;
      let oversizeCount = 0;
      let duplicateCount = 0;

      incoming.forEach((file) => {
        const signature = toFileSignature(file);

        if (!isValidImageFile(file)) {
          invalidTypeCount += 1;
          return;
        }

        if (Number(file.size || 0) > MAX_IMAGE_SIZE_BYTES) {
          oversizeCount += 1;
          return;
        }

        if (existingSignatures.has(signature)) {
          duplicateCount += 1;
          return;
        }

        existingSignatures.add(signature);
        accepted.push(file);
      });

      const filesToAppend = accepted.slice(0, availableSlots);
      const skippedByLimitCount = Math.max(0, accepted.length - filesToAppend.length);
      const errorParts = [];

      if (invalidTypeCount > 0) {
        errorParts.push(
          t("propertyForm.images.errors.invalidType", { count: invalidTypeCount }),
        );
      }
      if (oversizeCount > 0) {
        errorParts.push(
          t("propertyForm.images.errors.sizeExceeded", {
            count: oversizeCount,
            maxSize: MAX_IMAGE_SIZE_MB,
          }),
        );
      }
      if (duplicateCount > 0) {
        errorParts.push(
          t("propertyForm.images.errors.duplicates", { count: duplicateCount }),
        );
      }
      if (skippedByLimitCount > 0) {
        errorParts.push(
          t("propertyForm.images.errors.maxFiles", { maxFiles: MAX_IMAGE_FILES }),
        );
      }

      setUploadError(errorParts.join(" "));

      if (filesToAppend.length > 0) {
        updateFiles([...files, ...filesToAppend]);
      }
    },
    [files, t, updateFiles],
  );

  const removeImage = useCallback(
    (signature) => {
      const nextFiles = files.filter((file) => toFileSignature(file) !== signature);
      setUploadError("");
      updateFiles(nextFiles);
    },
    [files, updateFiles],
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const nextTarget = event.relatedTarget;
    if (nextTarget && event.currentTarget.contains(nextTarget)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      addFiles(event.dataTransfer?.files);
    },
    [addFiles],
  );

  const openExistingViewer = useCallback(
    (initialIndex = 0) => {
      if (existingViewerImages.length === 0) return;
      setViewerState({
        isOpen: true,
        images: existingViewerImages,
        initialIndex: Math.max(
          0,
          Math.min(initialIndex, existingViewerImages.length - 1),
        ),
      });
    },
    [existingViewerImages],
  );

  const openPendingViewer = useCallback(
    (initialIndex = 0) => {
      if (pendingViewerImages.length === 0) return;
      setViewerState({
        isOpen: true,
        images: pendingViewerImages,
        initialIndex: Math.max(
          0,
          Math.min(initialIndex, pendingViewerImages.length - 1),
        ),
      });
    },
    [pendingViewerImages],
  );

  return (
    <div className="space-y-4" data-no-swipe="true">
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {t("propertyForm.images.hint", {
          maxSize: MAX_IMAGE_SIZE_MB,
          maxFiles: MAX_IMAGE_FILES,
        })}
      </p>

      <div
        role="button"
        tabIndex={0}
        data-no-swipe="true"
        className={`rounded-2xl border-2 border-dashed p-4 transition sm:p-5 ${
          isDragging
            ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-500/10"
            : "border-slate-300 bg-slate-50/70 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-slate-500"
        }`}
        onClick={() => galleryInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            galleryInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("propertyForm.images.dropzoneTitle")}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t("propertyForm.images.dropzoneSubtitle", {
              maxSize: MAX_IMAGE_SIZE_MB,
              maxFiles: MAX_IMAGE_FILES,
            })}
          </p>

          <div className="flex w-full flex-wrap items-center gap-2">
            <button
              type="button"
              data-no-swipe="true"
              onClick={(event) => {
                event.stopPropagation();
                galleryInputRef.current?.click();
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-200"
            >
              <ImagePlus size={14} />
              {t("propertyForm.images.actions.selectFiles")}
            </button>
            <button
              type="button"
              data-no-swipe="true"
              onClick={(event) => {
                event.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-200"
            >
              <Camera size={14} />
              {t("propertyForm.images.actions.useCamera")}
            </button>
          </div>

          <input
            ref={galleryInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            multiple
            className="hidden"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {uploadError ? (
        <p className="text-xs text-red-600 dark:text-red-300">{uploadError}</p>
      ) : null}

      {existingImagesLoading ? (
        <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Loader2 size={14} className="animate-spin" />
          {t("common.loading", "Cargando...")}
        </div>
      ) : null}

      {!existingImagesLoading && normalizedExistingImages.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {t("propertyForm.images.existingTitle", {
              count: normalizedExistingImages.length,
            })}
          </p>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {normalizedExistingImages.map((image, index) => (
              <article
                key={image.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <button
                  type="button"
                  data-no-swipe="true"
                  onClick={() => openExistingViewer(index)}
                  className="relative block aspect-video w-full bg-slate-100 dark:bg-slate-950/70"
                >
                  <img
                    src={image.url}
                    alt={image.altText || t("propertyForm.images.fallbackAlt")}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>

                <div className="flex flex-wrap items-center gap-1 px-3 py-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {t("propertyForm.images.badges.existing")}
                  </span>
                  {image.isMain ? (
                    <span className="rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-semibold text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-200">
                      {t("propertyForm.images.badges.main")}
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {t("propertyForm.images.pendingTitle", { count: previewItems.length })}
        </p>

        {previewItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {t("propertyForm.images.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {previewItems.map((item, index) => (
              <article
                key={item.signature}
                className="overflow-hidden rounded-xl border border-cyan-200 bg-cyan-50/30 dark:border-cyan-900/50 dark:bg-slate-900/70"
              >
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-950/70">
                  <button
                    type="button"
                    data-no-swipe="true"
                    onClick={() => openPendingViewer(index)}
                    className="absolute inset-0 block h-full w-full"
                  >
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.file?.name || t("propertyForm.images.fallbackAlt")}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-slate-500 dark:text-slate-400">
                        {t("propertyForm.images.emptyPreview")}
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    data-no-swipe="true"
                    onClick={() => removeImage(item.signature)}
                    className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-slate-900/80 text-white transition hover:bg-slate-950"
                    aria-label={t("propertyForm.images.actions.removePending")}
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="space-y-1 px-3 py-2">
                  <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                    {item.file?.name || t("propertyForm.images.fallbackAlt")}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatFileSize(item.file?.size)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}

      <ImageViewerModal
        isOpen={viewerState.isOpen}
        onClose={() =>
          setViewerState((previous) => ({
            ...previous,
            isOpen: false,
          }))
        }
        images={viewerState.images}
        initialIndex={viewerState.initialIndex}
        alt={t("propertyForm.images.fallbackAlt")}
        showDownload={true}
      />
    </div>
  );
}
