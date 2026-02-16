import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  EllipsisVertical,
  Eye,
  FileText,
  Image as ImageIcon,
  Landmark,
  Loader2,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";
import { TablePagination } from "../components/common";
import Modal, { ModalFooter } from "../components/common/organisms/Modal";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import ImageViewerModal from "../components/common/organisms/ImageViewerModal";
import { storage } from "../api/appwriteClient";
import env from "../env";
import {
  INTERNAL_ROUTES,
  getInternalEditPropertyRoute,
  getInternalPropertyDetailRoute,
} from "../utils/internalRoutes";

const PROPERTY_STATUS_OPTIONS = ["draft", "published", "inactive", "archived"];

const MyProperties = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchText, setSearchText] = useState(() =>
    String(searchParams.get("search") || "").trim(),
  );
  const [rowActionMenu, setRowActionMenu] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [thumbnailCache, setThumbnailCache] = useState({});
  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });
  const focusId = String(searchParams.get("focus") || "").trim();
  const rowActionMenuRef = useRef(null);
  const rowActionTriggerRefs = useRef({});

  const locale = i18n.language === "es" ? "es-MX" : "en-US";

  const getPropertyThumbnail = useCallback(
    (item) => {
      if (!item) return null;
      if (item.thumbnailUrl) return String(item.thumbnailUrl);
      if (item.mainImageUrl) return String(item.mainImageUrl);
      if (item.coverImageUrl) return String(item.coverImageUrl);
      if (thumbnailCache[item.$id]) return thumbnailCache[item.$id];

      if (!item.galleryImageIds || item.galleryImageIds.length === 0) {
        return null;
      }
      const firstImageId = item.galleryImageIds[0];
      if (!firstImageId || !env.appwrite.buckets.propertyImages) return null;

      return storage.getFileView({
        bucketId: env.appwrite.buckets.propertyImages,
        fileId: firstImageId,
      });
    },
    [thumbnailCache],
  );

  useEffect(() => {
    const nextSearch = String(searchParams.get("search") || "").trim();
    setSearchText((prev) => (prev === nextSearch ? prev : nextSearch));
  }, [searchParams]);

  const loadData = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");
    try {
      const response = await propertiesService.listMine(user.$id);
      setItems(response.documents || []);
    } catch (err) {
      setError(getErrorMessage(err, i18n.t("myPropertiesPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const closeRowActionMenu = useCallback(() => {
    setRowActionMenu(null);
  }, []);

  const openImageViewer = async (item, initialIndex = 0) => {
    const propertyId = String(item?.$id || "").trim();
    if (!propertyId) return;
    const fallbackImage = getPropertyThumbnail(item);

    try {
      const imageDocs = await propertiesService.listImages(propertyId);
      const imageUrls = imageDocs.map((img) => img.url).filter(Boolean);

      if (imageUrls.length === 0 && !fallbackImage) {
        return;
      }

      const viewerImages =
        imageUrls.length > 0 ? imageUrls : fallbackImage ? [fallbackImage] : [];

      setImageViewer({
        isOpen: true,
        images: viewerImages,
        initialIndex: Math.min(
          initialIndex,
          Math.max(0, viewerImages.length - 1),
        ),
      });
    } catch {
      if (fallbackImage) {
        setImageViewer({
          isOpen: true,
          images: [fallbackImage],
          initialIndex: 0,
        });
      }
    }
  };

  const closeImageViewer = useCallback(() => {
    setImageViewer({ isOpen: false, images: [], initialIndex: 0 });
  }, []);

  const handleStatusChange = async (item, nextStatus) => {
    const normalizedStatus = String(nextStatus || "").trim();
    if (!normalizedStatus || normalizedStatus === item.status) return;

    closeRowActionMenu();
    setError("");
    setBusyId(item.$id);

    setItems((current) =>
      current.map((entry) =>
        entry.$id === item.$id ? { ...entry, status: normalizedStatus } : entry,
      ),
    );

    try {
      await propertiesService.update(item.$id, user?.$id, {
        status: normalizedStatus,
      });
    } catch (err) {
      setItems((current) =>
        current.map((entry) =>
          entry.$id === item.$id ? { ...entry, status: item.status } : entry,
        ),
      );
      setError(getErrorMessage(err, t("myPropertiesPage.errors.toggleStatus")));
    } finally {
      setBusyId("");
    }
  };

  const handleStatusToggle = async (item) => {
    await handleStatusChange(
      item,
      item.status === "published" ? "draft" : "published",
    );
  };

  const openDeleteModal = (item) => {
    closeRowActionMenu();
    setDeleteCandidate(item);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteCandidate?.$id || busyId) return;
    setBusyId(deleteCandidate.$id);
    setError("");
    try {
      await propertiesService.softDelete(deleteCandidate.$id);
      setItems((current) =>
        current.filter((entry) => entry.$id !== deleteCandidate.$id),
      );
      setDeleteCandidate(null);
    } catch (err) {
      setError(getErrorMessage(err, t("myPropertiesPage.errors.delete")));
    } finally {
      setBusyId("");
    }
  };

  const activeItems = useMemo(
    () => items.filter((item) => item.enabled !== false),
    [items],
  );
  const normalizedSearch = String(searchText || "")
    .trim()
    .toLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return activeItems;

    return activeItems.filter((item) => {
      const haystack = [
        item.title,
        item.slug,
        item.city,
        item.state,
        item.country,
        item.status,
        item.propertyType,
        item.operationType,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return haystack.includes(normalizedSearch);
    });
  }, [activeItems, normalizedSearch]);

  useEffect(() => {
    setPage(1);
  }, [normalizedSearch]);

  const effectivePageSize = useMemo(() => {
    if (pageSize === "all") return Math.max(1, filteredItems.length);
    return Math.max(1, Number(pageSize) || 5);
  }, [filteredItems.length, pageSize]);

  const totalPages = useMemo(
    () =>
      pageSize === "all"
        ? 1
        : Math.max(1, Math.ceil(filteredItems.length / effectivePageSize)),
    [effectivePageSize, filteredItems.length, pageSize],
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    if (pageSize === "all") return filteredItems;
    const start = (page - 1) * effectivePageSize;
    return filteredItems.slice(start, start + effectivePageSize);
  }, [effectivePageSize, filteredItems, page, pageSize]);

  useEffect(() => {
    if (paginatedItems.length === 0) return;

    const itemsToResolve = paginatedItems.filter((item) => {
      if (!item?.$id) return false;
      if (thumbnailCache[item.$id] !== undefined) return false;
      if (item.thumbnailUrl || item.mainImageUrl || item.coverImageUrl)
        return false;
      if (
        Array.isArray(item.galleryImageIds) &&
        item.galleryImageIds.length > 0
      )
        return false;
      return true;
    });

    if (itemsToResolve.length === 0) return;
    let cancelled = false;

    Promise.all(
      itemsToResolve.map(async (item) => {
        try {
          const images = await propertiesService.listImages(item.$id);
          return [item.$id, images[0]?.url || null];
        } catch {
          return [item.$id, null];
        }
      }),
    ).then((entries) => {
      if (cancelled || entries.length === 0) return;
      setThumbnailCache((current) => {
        const next = { ...current };
        entries.forEach(([propertyId, url]) => {
          if (next[propertyId] === undefined) {
            next[propertyId] = url;
          }
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [paginatedItems, thumbnailCache]);

  const rowActionItem = useMemo(
    () =>
      paginatedItems.find((item) => item.$id === rowActionMenu?.propertyId) ||
      null,
    [paginatedItems, rowActionMenu?.propertyId],
  );

  useEffect(() => {
    if (rowActionMenu && !rowActionItem) {
      closeRowActionMenu();
    }
  }, [closeRowActionMenu, rowActionItem, rowActionMenu]);

  const openRowActionMenu = (event, propertyId, triggerId = propertyId) => {
    if (typeof window === "undefined") return;

    const triggerRect = event.currentTarget.getBoundingClientRect();
    const horizontalPadding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = Math.min(240, viewportWidth - horizontalPadding * 2);
    const estimatedMenuHeight = 188;
    const gap = 6;
    const canOpenDown =
      triggerRect.bottom + gap + estimatedMenuHeight <=
      viewportHeight - horizontalPadding;
    const top = canOpenDown
      ? triggerRect.bottom + gap
      : Math.max(
          horizontalPadding,
          triggerRect.top - estimatedMenuHeight - gap,
        );
    const left = Math.max(
      horizontalPadding,
      Math.min(
        triggerRect.right - menuWidth,
        viewportWidth - menuWidth - horizontalPadding,
      ),
    );

    setRowActionMenu((previous) =>
      previous?.propertyId === propertyId && previous?.triggerId === triggerId
        ? null
        : {
            propertyId,
            triggerId,
            top,
            left,
            width: menuWidth,
          },
    );
  };

  useEffect(() => {
    if (!rowActionMenu) return;

    const closeOnOutsideClick = (event) => {
      const menuElement = rowActionMenuRef.current;
      const triggerElement =
        rowActionTriggerRefs.current[rowActionMenu.triggerId];
      if (
        menuElement?.contains(event.target) ||
        triggerElement?.contains(event.target)
      ) {
        return;
      }
      closeRowActionMenu();
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        closeRowActionMenu();
      }
    };

    const closeOnViewportChange = () => closeRowActionMenu();

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [closeRowActionMenu, rowActionMenu]);

  useEffect(() => {
    if (!focusId || filteredItems.length === 0) return;
    const targetIndex = filteredItems.findIndex((item) => item.$id === focusId);
    if (targetIndex < 0) return;
    setPage(Math.floor(targetIndex / effectivePageSize) + 1);
  }, [effectivePageSize, filteredItems, focusId]);

  useEffect(() => {
    if (loading || !focusId) return;
    const row = document.getElementById(`property-${focusId}`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, loading, page, paginatedItems.length]);

  const formatPrice = useCallback(
    (item) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: item.currency || "MXN",
        maximumFractionDigits: 0,
      }).format(item.price || 0),
    [locale],
  );

  const formatDate = useCallback(
    (value) => {
      if (!value) return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "-";
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        date,
      );
    },
    [locale],
  );

  const renderRowActionTrigger = (item, triggerId) => (
    <button
      ref={(element) => {
        if (element) {
          rowActionTriggerRefs.current[triggerId] = element;
          return;
        }
        delete rowActionTriggerRefs.current[triggerId];
      }}
      type="button"
      onClick={(event) => openRowActionMenu(event, item.$id, triggerId)}
      disabled={busyId === item.$id}
      aria-label={t("myPropertiesPage.actions.openMenu", {
        defaultValue: "Abrir menu de acciones",
      })}
      aria-haspopup="menu"
      aria-expanded={rowActionMenu?.propertyId === item.$id}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <EllipsisVertical size={16} />
    </button>
  );

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {t("myPropertiesPage.title")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("myPropertiesPage.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={INTERNAL_ROUTES.createProperty}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            {t("myPropertiesPage.actions.create")}
          </Link>
        </div>
      </header>

      <div className="max-w-md">
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Search size={14} />
            {t("client:myProperties.filters.search", {
              defaultValue: "Buscar",
            })}
          </span>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={t("client:myProperties.filters.searchPlaceholder", {
              defaultValue: "Titulo, slug, ciudad o estado",
            })}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("client:myProperties.loading")}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && filteredItems.length === 0 ? (
        <EmptyStatePanel
          icon={Building2}
          title={
            normalizedSearch
              ? t("client:myProperties.emptyFiltered", {
                  defaultValue: 'No hay resultados para "{{query}}".',
                  query: searchText.trim(),
                })
              : t("client:myProperties.empty")
          }
          description={t("client:myProperties.subtitle")}
          actionLabel={t("client:myProperties.actions.create")}
          actionTo={INTERNAL_ROUTES.createProperty}
        />
      ) : null}

      {!loading && filteredItems.length > 0 ? (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[1240px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="w-24 px-4 py-3">
                    {t("client:myProperties.table.image", {
                      defaultValue: "Imagen",
                    })}
                  </th>
                  <th className="min-w-[200px] px-4 py-3">
                    {t("client:myProperties.table.title")}
                  </th>
                  <th className="min-w-[160px] px-4 py-3">
                    {t("client:myProperties.table.location")}
                  </th>
                  <th className="min-w-[120px] px-4 py-3">
                    {t("client:myProperties.table.type", {
                      defaultValue: "Tipo",
                    })}
                  </th>
                  <th className="min-w-[120px] px-4 py-3">
                    {t("client:myProperties.table.operation", {
                      defaultValue: "Operacion",
                    })}
                  </th>
                  <th className="min-w-[100px] px-4 py-3">
                    {t("client:myProperties.table.rooms", {
                      defaultValue: "Recamaras/Banos",
                    })}
                  </th>
                  <th className="min-w-[160px] px-4 py-3">
                    {t("client:myProperties.table.status")}
                  </th>
                  <th className="min-w-[140px] px-4 py-3">
                    {t("client:myProperties.table.metrics", {
                      defaultValue: "Metricas",
                    })}
                  </th>
                  <th className="min-w-[120px] px-4 py-3">
                    {t("client:myProperties.table.price")}
                  </th>
                  <th className="min-w-[120px] px-4 py-3">
                    {t("client:myProperties.table.updatedAt", {
                      defaultValue: "Actualizada",
                    })}
                  </th>
                  <th className="min-w-[100px] px-4 py-3">
                    {t("client:myProperties.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => {
                  const isFocused = Boolean(focusId) && item.$id === focusId;

                  return (
                    <tr
                      key={item.$id}
                      id={`property-${item.$id}`}
                      className={`border-t border-slate-200 align-top dark:border-slate-700 ${
                        isFocused ? "bg-cyan-50/70 dark:bg-cyan-900/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        {getPropertyThumbnail(item) ? (
                          <button
                            type="button"
                            onClick={() => openImageViewer(item, 0)}
                            className="group relative h-16 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition hover:border-cyan-500 dark:border-slate-700 dark:bg-slate-800"
                          >
                            <img
                              src={getPropertyThumbnail(item)}
                              alt={item.title}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                              <ImageIcon
                                size={20}
                                className="text-white opacity-0 transition group-hover:opacity-100"
                              />
                            </div>
                          </button>
                        ) : (
                          <div className="flex h-16 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                            <ImageIcon size={20} className="text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={getInternalPropertyDetailRoute(item.$id)}
                          className="font-medium text-slate-900 transition hover:text-cyan-700 hover:underline dark:text-slate-100 dark:hover:text-cyan-300"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                          {item.slug || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <p>
                          {item.city}, {item.state}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {item.country || "-"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {t(`homePage.enums.propertyType.${item.propertyType}`, {
                          defaultValue: item.propertyType,
                        })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {t(`homePage.enums.operation.${item.operationType}`, {
                          defaultValue: item.operationType,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="grid gap-1 text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <BedDouble size={13} /> {Number(item.bedrooms || 0)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Bath size={13} /> {Number(item.bathrooms || 0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={item.status || "draft"}
                            onChange={(event) =>
                              handleStatusChange(item, event.target.value)
                            }
                            disabled={busyId === item.$id}
                            className="min-h-10 min-w-36 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            aria-label={t("myPropertiesPage.table.status")}
                          >
                            {PROPERTY_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {t(`propertyStatus.${status}`, {
                                  defaultValue: status,
                                })}
                              </option>
                            ))}
                          </select>
                          {busyId === item.$id ? (
                            <Loader2
                              size={14}
                              className="animate-spin text-slate-400"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="grid gap-1 text-xs text-slate-600 dark:text-slate-300">
                          <span>
                            {t("myPropertiesPage.table.views", {
                              defaultValue: "Vistas",
                            })}
                            : <strong>{Number(item.views || 0)}</strong>
                          </span>
                          <span>
                            {t("myPropertiesPage.table.leads", {
                              defaultValue: "Leads",
                            })}
                            : <strong>{Number(item.contactCount || 0)}</strong>
                          </span>
                          <span>
                            {t("myPropertiesPage.table.reservations", {
                              defaultValue: "Reservas",
                            })}
                            :{" "}
                            <strong>
                              {Number(item.reservationCount || 0)}
                            </strong>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatPrice(item)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatDate(item.$updatedAt || item.$createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {renderRowActionTrigger(item, `table-${item.$id}`)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        </div>
      ) : null}

      {rowActionMenu && rowActionItem && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={rowActionMenuRef}
              role="menu"
              aria-label={t("client:myProperties.actions.menuLabel", {
                defaultValue: "Acciones de la propiedad",
              })}
              className="fixed z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              style={{
                top: `${rowActionMenu.top}px`,
                left: `${rowActionMenu.left}px`,
                width: `${rowActionMenu.width}px`,
              }}
            >
              <div className="p-1.5">
                <Link
                  role="menuitem"
                  to={getInternalPropertyDetailRoute(rowActionItem.$id)}
                  onClick={closeRowActionMenu}
                  className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Eye size={15} />
                  {t("myPropertiesPage.actions.view", {
                    defaultValue: "Ver detalle",
                  })}
                </Link>

                <Link
                  role="menuitem"
                  to={getInternalEditPropertyRoute(rowActionItem.$id)}
                  onClick={closeRowActionMenu}
                  className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Pencil size={15} />
                  {t("myPropertiesPage.actions.edit")}
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleStatusToggle(rowActionItem)}
                  disabled={busyId === rowActionItem.$id}
                  className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {busyId === rowActionItem.$id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : rowActionItem.status === "published" ? (
                    <FileText size={15} />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {rowActionItem.status === "published"
                    ? t("myPropertiesPage.actions.toDraft")
                    : t("myPropertiesPage.actions.publish")}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => openDeleteModal(rowActionItem)}
                  disabled={busyId === rowActionItem.$id}
                  className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={15} />
                  {t("myPropertiesPage.actions.delete")}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      <Modal
        isOpen={Boolean(deleteCandidate)}
        onClose={() => {
          if (!busyId) setDeleteCandidate(null);
        }}
        closeOnBackdrop={!busyId}
        closeOnEscape={!busyId}
        title={t("myPropertiesPage.deleteModal.title", {
          defaultValue: "Eliminar propiedad",
        })}
        description={
          deleteCandidate
            ? t("myPropertiesPage.deleteModal.description", {
                defaultValue:
                  'Estas seguro de eliminar "{{title}}"? Esta accion la desactiva para que no sea visible.',
                title: deleteCandidate.title,
              })
            : ""
        }
        size="sm"
        footer={
          <ModalFooter>
            <button
              type="button"
              onClick={() => setDeleteCandidate(null)}
              disabled={Boolean(busyId)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirmed}
              disabled={Boolean(busyId)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyId === deleteCandidate?.$id ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              {t("myPropertiesPage.deleteModal.confirm", {
                defaultValue: "Eliminar",
              })}
            </button>
          </ModalFooter>
        }
      >
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {t("myPropertiesPage.deleteModal.warning", {
            defaultValue:
              "Esta acción es reversible. Puedes reactivar la propiedad más tarde.",
          })}
        </div>
      </Modal>

      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        onClose={closeImageViewer}
        images={imageViewer.images}
        initialIndex={imageViewer.initialIndex}
        showDownload
      />
    </section>
  );
};

export default MyProperties;
