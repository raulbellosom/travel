import SkeletonLoader from "../components/common/molecules/SkeletonLoader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { resourcesService } from "../services/resourcesService";
import { staffService } from "../services/staffService";
import { getErrorMessage } from "../utils/errors";
import { hasRoleAtLeast, hasScope } from "../utils/roles";
import { TablePagination } from "../components/common";
import Modal, { ModalFooter } from "../components/common/organisms/Modal";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import ImageViewerModal from "../components/common/organisms/ImageViewerModal";
import { getOptimizedImage, getFileViewUrl } from "../utils/imageOptimization";
import { INTERNAL_ROUTES } from "../utils/internalRoutes";
import {
  ResourceTableHeader,
  ResourceTableRow,
  ResourceActionMenu,
  ResourceListFilters,
} from "../features/resources/components";
import { formatMoneyWithDenomination } from "../utils/money";

// ─── Constants ──────────────────────────────────────────────────
const RESOURCE_STATUS_OPTIONS = ["draft", "published", "inactive", "archived"];

// ─── Hook: useResourceSearch ────────────────────────────────────
const useResourceSearch = (
  items,
  searchText,
  resourceTypeFilter,
  responsibleFilter,
  featuredFilter,
) => {
  const normalizedSearch = String(searchText || "")
    .trim()
    .toLowerCase();

  return useMemo(() => {
    let filtered = items.filter((item) => item.enabled !== false);

    if (resourceTypeFilter && resourceTypeFilter !== "all") {
      filtered = filtered.filter(
        (item) =>
          String(item.resourceType || "property").toLowerCase() ===
          resourceTypeFilter,
      );
    }

    if (responsibleFilter && responsibleFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.ownerUserId === responsibleFilter,
      );
    }

    if (featuredFilter === "featured") {
      filtered = filtered.filter((item) => item.featured === true);
    } else if (featuredFilter === "notFeatured") {
      filtered = filtered.filter((item) => item.featured !== true);
    }

    if (normalizedSearch) {
      filtered = filtered.filter((item) => {
        const haystack = [
          item.title,
          item.slug,
          item.city,
          item.state,
          item.country,
          item.status,
          item.resourceType,
          item.category,
          item.commercialMode,
          item.propertyType,
          item.operationType,
        ]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        return haystack.includes(normalizedSearch);
      });
    }

    return filtered;
  }, [
    items,
    normalizedSearch,
    resourceTypeFilter,
    responsibleFilter,
    featuredFilter,
  ]);
};

// ─── Hook: usePagination ────────────────────────────────────────
const usePagination = (items, initialPageSize = 5) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const effectivePageSize = useMemo(() => {
    if (pageSize === "all") return Math.max(1, items.length);
    return Math.max(1, Number(pageSize) || 5);
  }, [items.length, pageSize]);

  const totalPages = useMemo(
    () =>
      pageSize === "all"
        ? 1
        : Math.max(1, Math.ceil(items.length / effectivePageSize)),
    [effectivePageSize, items.length, pageSize],
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    if (pageSize === "all") return items;
    const start = (page - 1) * effectivePageSize;
    return items.slice(start, start + effectivePageSize);
  }, [effectivePageSize, items, page, pageSize]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    effectivePageSize,
    paginatedItems,
  };
};

// ─── Hook: useRowActionMenu ─────────────────────────────────────
const useRowActionMenu = (paginatedItems) => {
  const [menuState, setMenuState] = useState(null);
  const menuRef = useRef(null);
  const triggerRefs = useRef({});

  const activeItem = useMemo(
    () =>
      paginatedItems.find((item) => item.$id === menuState?.resourceId) || null,
    [paginatedItems, menuState?.resourceId],
  );

  const close = useCallback(() => setMenuState(null), []);

  const open = useCallback((event, resourceId) => {
    if (typeof window === "undefined") return;

    const rect = event.currentTarget.getBoundingClientRect();
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuWidth = Math.min(240, vw - pad * 2);
    const estimatedHeight = 188;
    const gap = 6;
    const canOpenDown = rect.bottom + gap + estimatedHeight <= vh - pad;
    const top = canOpenDown
      ? rect.bottom + gap
      : Math.max(pad, rect.top - estimatedHeight - gap);
    const left = Math.max(
      pad,
      Math.min(rect.right - menuWidth, vw - menuWidth - pad),
    );

    setMenuState((prev) =>
      prev?.resourceId === resourceId
        ? null
        : { resourceId, top, left, width: menuWidth },
    );
  }, []);

  useEffect(() => {
    if (!menuState) return;

    const onOutsideClick = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (triggerRefs.current[menuState.resourceId]?.contains(e.target)) return;
      close();
    };
    const onEscape = (e) => e.key === "Escape" && close();
    const onViewport = () => close();

    document.addEventListener("mousedown", onOutsideClick);
    document.addEventListener("touchstart", onOutsideClick);
    document.addEventListener("keydown", onEscape);
    window.addEventListener("resize", onViewport);
    window.addEventListener("scroll", onViewport, true);

    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      document.removeEventListener("touchstart", onOutsideClick);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("scroll", onViewport, true);
    };
  }, [close, menuState]);

  useEffect(() => {
    if (menuState && !activeItem) close();
  }, [activeItem, close, menuState]);

  return { menuState, menuRef, triggerRefs, activeItem, open, close };
};

// ═══════════════════════════════════════════════════════════════
// MyProperties (Resource Listing Page)
// ═══════════════════════════════════════════════════════════════
const MyProperties = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [searchText, setSearchText] = useState(() =>
    String(searchParams.get("search") || "").trim(),
  );
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all");
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [staffUsers, setStaffUsers] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showAll, setShowAll] = useState(true);
  const [sortKey, setSortKey] = useState("updatedAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [thumbnailCache, setThumbnailCache] = useState({});
  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  const focusId = String(searchParams.get("focus") || "").trim();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const canViewAll = useMemo(
    () =>
      hasRoleAtLeast(user?.role, "owner") ||
      hasScope(user, "resources.read.all"),
    [user],
  );

  // ─── Data loading ───────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");
    try {
      const response =
        canViewAll && showAll
          ? await resourcesService.listMine(user.$id)
          : await resourcesService.listByResponsible(user.$id);
      setItems(response.documents || []);
    } catch (err) {
      setError(getErrorMessage(err, t("myResourcesPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [user?.$id, canViewAll, showAll, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Staff loading ──────────────────────────────────────────
  // Always seed at least the current user so responsible cells can display
  // their own name/avatar regardless of role. Full staff list only loads for
  // users with canViewAll (owner+).
  useEffect(() => {
    if (!user?.$id) return;

    const currentUserEntry = {
      $id: user.$id,
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role || "",
      avatarFileId: user.avatarFileId || "",
    };

    if (!canViewAll) {
      // Non-admin: just show the current user (enough to resolve their own resources)
      setStaffUsers([currentUserEntry]);
      return;
    }

    let cancelled = false;
    setLoadingStaff(true);
    staffService
      .listStaff()
      .then((docs) => {
        if (cancelled) return;
        let staffList = docs || [];
        // Ensure current user is always present in the list
        if (!staffList.some((s) => s.$id === user.$id)) {
          staffList = [currentUserEntry, ...staffList];
        }
        setStaffUsers(staffList);
      })
      .catch(() => {
        if (cancelled) return;
        setStaffUsers([currentUserEntry]);
      })
      .finally(() => {
        if (!cancelled) setLoadingStaff(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canViewAll, user]);

  useEffect(() => {
    const next = String(searchParams.get("search") || "").trim();
    setSearchText((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  // ─── Search & pagination ────────────────────────────────────
  const filteredItems = useResourceSearch(
    items,
    searchText,
    resourceTypeFilter,
    responsibleFilter,
    featuredFilter,
  );

  // ─── Sort ───────────────────────────────────────────────────
  const handleSort = useCallback((key) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortDirection("desc");
      }
      return key;
    });
  }, []);

  const sortedItems = useMemo(() => {
    if (!sortKey) return filteredItems;
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...filteredItems].sort((a, b) => {
      let va, vb;
      switch (sortKey) {
        case "price":
          va = Number(a.price) || 0;
          vb = Number(b.price) || 0;
          return (va - vb) * dir;
        case "updatedAt":
          va = new Date(a.$updatedAt || a.$createdAt || 0).getTime();
          vb = new Date(b.$updatedAt || b.$createdAt || 0).getTime();
          return (va - vb) * dir;
        case "metrics":
          va = Number(a.views) || 0;
          vb = Number(b.views) || 0;
          return (va - vb) * dir;
        case "status":
          return (
            String(a.status || "").localeCompare(String(b.status || "")) * dir
          );
        case "resourceType":
          return (
            String(a.resourceType || "property").localeCompare(
              String(b.resourceType || "property"),
            ) * dir
          );
        case "featured":
          va = a.featured ? 1 : 0;
          vb = b.featured ? 1 : 0;
          return (va - vb) * dir;
        default:
          return 0;
      }
    });
  }, [filteredItems, sortKey, sortDirection]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    effectivePageSize,
    paginatedItems,
  } = usePagination(sortedItems);

  useEffect(() => {
    setPage(1);
  }, [searchText, resourceTypeFilter, setPage]);

  // ─── Thumbnail resolution ───────────────────────────────────
  const getResourceThumbnail = useCallback(
    (item) => {
      if (!item) return null;
      if (item.thumbnailUrl) return String(item.thumbnailUrl);
      if (item.mainImageUrl) return String(item.mainImageUrl);
      if (item.coverImageUrl) return String(item.coverImageUrl);
      if (thumbnailCache[item.$id]) return thumbnailCache[item.$id];

      if (!item.galleryImageIds || item.galleryImageIds.length === 0)
        return null;
      const firstImageId = item.galleryImageIds[0];
      if (!firstImageId) return null;

      return (
        getOptimizedImage(firstImageId, "thumb") ||
        getFileViewUrl(firstImageId) ||
        null
      );
    },
    [thumbnailCache],
  );

  useEffect(() => {
    if (paginatedItems.length === 0) return;
    const toResolve = paginatedItems.filter((item) => {
      if (!item?.$id || thumbnailCache[item.$id] !== undefined) return false;
      if (item.thumbnailUrl || item.mainImageUrl || item.coverImageUrl)
        return false;
      if (
        Array.isArray(item.galleryImageIds) &&
        item.galleryImageIds.length > 0
      )
        return false;
      return true;
    });
    if (toResolve.length === 0) return;

    let cancelled = false;
    Promise.all(
      toResolve.map(async (item) => {
        try {
          const images = await resourcesService.listImages(item.$id);
          return [item.$id, images[0]?.url || null];
        } catch {
          return [item.$id, null];
        }
      }),
    ).then((entries) => {
      if (cancelled || entries.length === 0) return;
      setThumbnailCache((current) => {
        const next = { ...current };
        entries.forEach(([id, url]) => {
          if (next[id] === undefined) next[id] = url;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [paginatedItems, thumbnailCache]);

  // ─── Row action menu ────────────────────────────────────────
  const actionMenu = useRowActionMenu(paginatedItems);

  // ─── Image viewer ───────────────────────────────────────────
  const openImageViewer = async (item, initialIndex = 0) => {
    // Handle direct avatar URL
    if (item?.avatarUrl) {
      setImageViewer({
        isOpen: true,
        images: [item.avatarUrl],
        initialIndex: 0,
      });
      return;
    }

    const id = String(item?.$id || "").trim();
    if (!id) return;
    const fallback = getResourceThumbnail(item);

    try {
      const imageDocs = await resourcesService.listImages(id);
      // Use original /view URLs for the modal so images are full-resolution, not
      // the card-preset (600px/q50) thumbnails stored in img.url.
      const urls = imageDocs
        .map((img) => (img.fileId ? getFileViewUrl(img.fileId) : img.url))
        .filter(Boolean);
      const images = urls.length > 0 ? urls : fallback ? [fallback] : [];
      if (images.length === 0) return;

      setImageViewer({
        isOpen: true,
        images,
        initialIndex: Math.min(initialIndex, Math.max(0, images.length - 1)),
      });
    } catch {
      if (fallback) {
        setImageViewer({ isOpen: true, images: [fallback], initialIndex: 0 });
      }
    }
  };

  const closeImageViewer = useCallback(() => {
    setImageViewer({ isOpen: false, images: [], initialIndex: 0 });
  }, []);

  // ─── Status change ──────────────────────────────────────────
  const handleStatusChange = async (item, nextStatus) => {
    const status = String(nextStatus || "").trim();
    if (!status || status === item.status) return;

    actionMenu.close();
    setError("");
    setBusyId(item.$id);

    setItems((current) =>
      current.map((entry) =>
        entry.$id === item.$id ? { ...entry, status } : entry,
      ),
    );

    try {
      await resourcesService.update(item.$id, user?.$id, { status });
    } catch (err) {
      setItems((current) =>
        current.map((entry) =>
          entry.$id === item.$id ? { ...entry, status: item.status } : entry,
        ),
      );
      setError(getErrorMessage(err, t("myResourcesPage.errors.toggleStatus")));
    } finally {
      setBusyId("");
    }
  };

  // ─── Responsible change ─────────────────────────────────────
  const handleResponsibleChange = async (resourceId, newOwnerUserId) => {
    const item = items.find((i) => i.$id === resourceId);
    if (!item || !newOwnerUserId || newOwnerUserId === item.ownerUserId) return;

    setError("");
    setBusyId(resourceId);

    // Optimistic update
    setItems((current) =>
      current.map((entry) =>
        entry.$id === resourceId
          ? { ...entry, ownerUserId: newOwnerUserId }
          : entry,
      ),
    );

    try {
      await resourcesService.updateResponsibleAgent(resourceId, newOwnerUserId);
    } catch (err) {
      // Rollback on error
      setItems((current) =>
        current.map((entry) =>
          entry.$id === resourceId
            ? { ...entry, ownerUserId: item.ownerUserId }
            : entry,
        ),
      );
      setError(
        getErrorMessage(err, t("myResourcesPage.errors.updateResponsible")),
      );
    } finally {
      setBusyId("");
    }
  };

  // ─── Featured change ────────────────────────────────────────
  const handleFeaturedChange = async (resourceId, featured) => {
    const item = items.find((i) => i.$id === resourceId);
    if (!item) return;

    setError("");
    setBusyId(resourceId);

    // Optimistic update
    setItems((current) =>
      current.map((entry) =>
        entry.$id === resourceId ? { ...entry, featured } : entry,
      ),
    );

    try {
      await resourcesService.update(resourceId, user?.$id, { featured });
    } catch (err) {
      // Rollback on error
      setItems((current) =>
        current.map((entry) =>
          entry.$id === resourceId
            ? { ...entry, featured: item.featured }
            : entry,
        ),
      );
      setError(
        getErrorMessage(err, t("myResourcesPage.errors.updateFeatured")),
      );
    } finally {
      setBusyId("");
    }
  };

  // ─── Delete ─────────────────────────────────────────────────
  const openDeleteModal = (item) => {
    actionMenu.close();
    setDeleteCandidate(item);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteCandidate?.$id || busyId) return;
    setBusyId(deleteCandidate.$id);
    setError("");
    try {
      await resourcesService.softDelete(deleteCandidate.$id);
      setItems((current) =>
        current.filter((entry) => entry.$id !== deleteCandidate.$id),
      );
      setDeleteCandidate(null);
    } catch (err) {
      setError(getErrorMessage(err, t("myResourcesPage.errors.delete")));
    } finally {
      setBusyId("");
    }
  };

  // ─── Focus handling ─────────────────────────────────────────
  useEffect(() => {
    if (!focusId || filteredItems.length === 0) return;
    const idx = filteredItems.findIndex((item) => item.$id === focusId);
    if (idx < 0) return;
    setPage(Math.floor(idx / effectivePageSize) + 1);
  }, [effectivePageSize, filteredItems, focusId, setPage]);

  useEffect(() => {
    if (loading || !focusId) return;
    const row = document.getElementById(`resource-${focusId}`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, loading, page, paginatedItems.length]);

  // ─── Formatters ─────────────────────────────────────────────
  const formatPrice = useCallback(
    (item) =>
      formatMoneyWithDenomination(item.price || 0, {
        locale,
        currency: item.currency || "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
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

  const statusSelectOptions = useMemo(
    () =>
      RESOURCE_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: t(`propertyStatus.${status}`, { defaultValue: status }),
      })),
    [t],
  );

  // ─── Render ─────────────────────────────────────────────────
  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {t("myResourcesPage.title")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("myResourcesPage.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={INTERNAL_ROUTES.createProperty}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            {t("myResourcesPage.actions.create")}
          </Link>
        </div>
      </header>

      {/* Filters */}
      <ResourceListFilters
        searchText={searchText}
        onSearchChange={setSearchText}
        resourceTypeFilter={resourceTypeFilter}
        onResourceTypeChange={setResourceTypeFilter}
        responsibleFilter={responsibleFilter}
        onResponsibleChange={setResponsibleFilter}
        staffUsers={staffUsers}
        loadingStaff={loadingStaff}
        featuredFilter={featuredFilter}
        onFeaturedChange={setFeaturedFilter}
        showAll={showAll}
        onShowAllChange={setShowAll}
        canViewAll={canViewAll}
      />

      {/* Loading */}
      {loading ? <SkeletonLoader variant="list" /> : null}

      {/* Error */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {/* Empty */}
      {!loading && filteredItems.length === 0 ? (
        <EmptyStatePanel
          icon={Building2}
          title={
            searchText.trim() || resourceTypeFilter !== "all"
              ? t("myResourcesPage.emptyFiltered", {
                  query: searchText.trim(),
                })
              : t("myResourcesPage.empty")
          }
          description={t("myResourcesPage.subtitle")}
          actionLabel={t("myResourcesPage.actions.create")}
          actionTo={INTERNAL_ROUTES.createProperty}
        />
      ) : null}

      {/* Table */}
      {!loading && filteredItems.length > 0 ? (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[1340px] text-left text-sm">
              <ResourceTableHeader
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <tbody>
                {paginatedItems.map((item) => (
                  <ResourceTableRow
                    key={item.$id}
                    item={item}
                    isFocused={Boolean(focusId) && item.$id === focusId}
                    isBusy={busyId === item.$id}
                    thumbnailUrl={getResourceThumbnail(item)}
                    fileId={item.galleryImageIds?.[0] || null}
                    statusOptions={statusSelectOptions}
                    onStatusChange={handleStatusChange}
                    staffUsers={staffUsers}
                    loadingStaff={loadingStaff}
                    canEditResponsible={canViewAll}
                    onResponsibleChange={handleResponsibleChange}
                    onFeaturedChange={handleFeaturedChange}
                    onImageClick={openImageViewer}
                    onAvatarClick={openImageViewer}
                    onActionMenu={actionMenu.open}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                    triggerRef={(el) => {
                      if (el) {
                        actionMenu.triggerRefs.current[item.$id] = el;
                      } else {
                        delete actionMenu.triggerRefs.current[item.$id];
                      }
                    }}
                  />
                ))}
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

      {/* Action menu portal */}
      {actionMenu.menuState &&
      actionMenu.activeItem &&
      typeof document !== "undefined"
        ? createPortal(
            <ResourceActionMenu
              ref={actionMenu.menuRef}
              item={actionMenu.activeItem}
              isBusy={busyId === actionMenu.activeItem.$id}
              position={actionMenu.menuState}
              onClose={actionMenu.close}
              onDelete={openDeleteModal}
            />,
            document.body,
          )
        : null}

      {/* Delete modal */}
      <Modal
        isOpen={Boolean(deleteCandidate)}
        onClose={() => {
          if (!busyId) setDeleteCandidate(null);
        }}
        closeOnBackdrop={!busyId}
        closeOnEscape={!busyId}
        title={t("myResourcesPage.deleteModal.title")}
        description={
          deleteCandidate
            ? t("myResourcesPage.deleteModal.description", {
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
              {t("myResourcesPage.deleteModal.confirm")}
            </button>
          </ModalFooter>
        }
      >
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {t("myResourcesPage.deleteModal.warning")}
        </div>
      </Modal>

      {/* Image viewer */}
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
