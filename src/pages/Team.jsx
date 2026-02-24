import LoadingState from "../components/common/molecules/LoadingState";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
  Check,
  EllipsisVertical,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  UserCheck,
  UserRound,
  UserX,
  Users,
  X,
} from "lucide-react";
import { Select, TablePagination } from "../components/common";
import LazyImage from "../components/common/atoms/LazyImage";
import Modal, { ModalFooter } from "../components/common/organisms/Modal";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import StatsCardsRow from "../components/common/molecules/StatsCardsRow";
import { authService } from "../services/authService";
import { profileService } from "../services/profileService";
import { staffService, STAFF_ROLES } from "../services/staffService";
import { useToast } from "../hooks/useToast";
import { useInstanceModules } from "../hooks/useInstanceModules";
import { getErrorMessage } from "../utils/errors";
import {
  filterScopesByEnabledModules,
  isScopeAllowedByModules,
} from "../utils/moduleAccess";
import {
  getPasswordChecks,
  getPasswordStrengthScore,
  isStrongPassword,
  isValidEmail,
} from "../utils/validation";

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800";

const MAX_AVATAR_SIZE_MB = 5;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const parseSearchText = (value) => String(value || "").trim();
const parseStatusValue = (value) =>
  value === "enabled" || value === "disabled" ? value : "all";
const parseRoleValue = (value) =>
  STAFF_ROLES.includes(String(value || "")) ? value : "all";

const SCOPE_OPTIONS = [
  "staff.manage",
  "resources.read",
  "resources.write",
  "leads.read",
  "leads.write",
  "reservations.read",
  "reservations.write",
  "payments.read",
  "reviews.moderate",
  "messaging.read",
  "messaging.write",
];

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  role: "staff_support",
  password: "",
  confirmPassword: "",
  scopes: [],
  avatarFile: null,
  avatarFileId: "",
  avatarPreviewUrl: "",
};

const parseScopesJson = (value) => {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getScopeLabel = (scope, t) =>
  t(`teamPage.scopeOptions.${String(scope || "").replaceAll(".", "_")}`, {
    defaultValue: scope,
  });

const getAvatarUrl = (item) => {
  const base = profileService.getAvatarViewUrl(item.avatarFileId);
  if (!base) return "";
  if (!item.avatarUpdatedAt) return base;
  return `${base}${base.includes("?") ? "&" : "?"}v=${encodeURIComponent(
    item.avatarUpdatedAt,
  )}`;
};

const getFullName = (item, fallback = "") => {
  const fullName = `${item?.firstName || ""} ${item?.lastName || ""}`.trim();
  return fullName || fallback;
};

const isBlobUrl = (value) => String(value || "").startsWith("blob:");
const isTeamListableUser = (item) => {
  const role = String(item?.role || "")
    .trim()
    .toLowerCase();
  return STAFF_ROLES.includes(role) && item?.isHidden !== true;
};

const Team = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isEnabled } = useInstanceModules();
  const [searchParams] = useSearchParams();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [staff, setStaff] = useState([]);
  const [filters, setFilters] = useState(() => ({
    search: parseSearchText(searchParams.get("search")),
    role: parseRoleValue(searchParams.get("role")),
    status: parseStatusValue(searchParams.get("status")),
  }));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [editingUserId, setEditingUserId] = useState("");

  const [loadingList, setLoadingList] = useState(true);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [busyUserId, setBusyUserId] = useState("");
  const [sendingRecoveryUserId, setSendingRecoveryUserId] = useState("");
  const [permissionsEditor, setPermissionsEditor] = useState(null);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [rowActionMenu, setRowActionMenu] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const rowActionMenuRef = useRef(null);
  const rowActionTriggerRefs = useRef({});
  const isEditing = Boolean(editingUserId);
  const focusId = String(searchParams.get("focus") || "").trim();

  useEffect(() => {
    const nextSearch = parseSearchText(searchParams.get("search"));
    const nextRole = parseRoleValue(searchParams.get("role"));
    const nextStatus = parseStatusValue(searchParams.get("status"));

    setFilters((prev) => {
      if (
        prev.search === nextSearch &&
        prev.role === nextRole &&
        prev.status === nextStatus
      ) {
        return prev;
      }
      return {
        ...prev,
        search: nextSearch,
        role: nextRole,
        status: nextStatus,
      };
    });
  }, [searchParams]);

  const passwordChecks = useMemo(
    () => getPasswordChecks(form.password),
    [form.password],
  );
  const passwordScore = useMemo(
    () => getPasswordStrengthScore(form.password),
    [form.password],
  );
  const passwordsMatch = useMemo(
    () =>
      form.confirmPassword.length > 0 && form.password === form.confirmPassword,
    [form.password, form.confirmPassword],
  );
  const showPasswordMismatch = useMemo(
    () =>
      form.confirmPassword.length > 0 && form.password !== form.confirmPassword,
    [form.password, form.confirmPassword],
  );

  const roleOptions = useMemo(
    () => [
      { value: "staff_manager", label: t("teamPage.roles.staff_manager") },
      { value: "staff_editor", label: t("teamPage.roles.staff_editor") },
      { value: "staff_support", label: t("teamPage.roles.staff_support") },
    ],
    [t],
  );

  const filterRoleOptions = useMemo(
    () => [
      { value: "all", label: t("teamPage.filters.allRoles") },
      ...roleOptions,
    ],
    [roleOptions, t],
  );

  const filterStatusOptions = useMemo(
    () => [
      { value: "all", label: t("teamPage.filters.allStatuses") },
      { value: "enabled", label: t("teamPage.status.enabled") },
      { value: "disabled", label: t("teamPage.status.disabled") },
    ],
    [t],
  );

  const availableScopeOptions = useMemo(
    () =>
      SCOPE_OPTIONS.filter((scope) =>
        isScopeAllowedByModules(scope, isEnabled),
      ),
    [isEnabled],
  );

  const sanitizeScopesForInstance = useCallback(
    (scopes) => filterScopesByEnabledModules(scopes, isEnabled),
    [isEnabled],
  );

  const loadStaff = useCallback(async () => {
    setLoadingList(true);
    setError("");
    try {
      const documents = await staffService.listStaff();
      setStaff((documents || []).filter(isTeamListableUser));
    } catch (err) {
      setError(getErrorMessage(err, t("teamPage.errors.load")));
    } finally {
      setLoadingList(false);
    }
  }, [t]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    return () => {
      if (isBlobUrl(form.avatarPreviewUrl)) {
        URL.revokeObjectURL(form.avatarPreviewUrl);
      }
    };
  }, [form.avatarPreviewUrl]);

  useEffect(() => {
    if (!error) return;
    showToast({
      type: "error",
      title: t("teamPage.title"),
      message: error,
      durationMs: 7000,
    });
  }, [error, showToast, t]);

  useEffect(() => {
    if (!success) return;
    showToast({
      type: "success",
      title: t("teamPage.title"),
      message: success,
    });
  }, [showToast, success, t]);

  const summaryStats = useMemo(() => {
    const active = staff.filter((item) => item.enabled !== false).length;
    const inactive = Math.max(0, staff.length - active);
    return {
      total: staff.length,
      active,
      inactive,
    };
  }, [staff]);

  const summaryCards = useMemo(
    () => [
      {
        id: "total",
        label: t("teamPage.metrics.total"),
        value: summaryStats.total,
        icon: Users,
        tone: "info",
      },
      {
        id: "active",
        label: t("teamPage.metrics.active"),
        value: summaryStats.active,
        icon: UserCheck,
        tone: "success",
      },
      {
        id: "inactive",
        label: t("teamPage.metrics.inactive"),
        value: summaryStats.inactive,
        icon: UserX,
        tone: "muted",
      },
    ],
    [summaryStats.active, summaryStats.inactive, summaryStats.total, t],
  );

  const filteredStaff = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return staff.filter((item) => {
      const fullName = getFullName(item).toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const role = String(item.role || "").toLowerCase();
      const enabled = item.enabled !== false;

      const matchesQuery =
        !query ||
        fullName.includes(query) ||
        email.includes(query) ||
        role.includes(query);
      const matchesRole = filters.role === "all" || item.role === filters.role;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "enabled" ? enabled : !enabled);

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [filters.role, filters.search, filters.status, staff]);

  useEffect(() => {
    setPage(1);
  }, [filters.role, filters.search, filters.status]);

  const effectivePageSize = useMemo(() => {
    if (pageSize === "all") return Math.max(1, filteredStaff.length);
    return Math.max(1, Number(pageSize) || 5);
  }, [filteredStaff.length, pageSize]);

  const totalPages = useMemo(
    () =>
      pageSize === "all"
        ? 1
        : Math.max(1, Math.ceil(filteredStaff.length / effectivePageSize)),
    [effectivePageSize, filteredStaff.length, pageSize],
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedStaff = useMemo(() => {
    if (pageSize === "all") return filteredStaff;
    const start = (page - 1) * effectivePageSize;
    return filteredStaff.slice(start, start + effectivePageSize);
  }, [effectivePageSize, filteredStaff, page, pageSize]);

  const rowActionItem = useMemo(() => {
    if (!rowActionMenu?.userId) return null;
    return staff.find((item) => item.$id === rowActionMenu.userId) || null;
  }, [rowActionMenu?.userId, staff]);

  useEffect(() => {
    if (!focusId || filteredStaff.length === 0) return;
    const targetIndex = filteredStaff.findIndex((item) => item.$id === focusId);
    if (targetIndex < 0) return;
    setPage(Math.floor(targetIndex / effectivePageSize) + 1);
  }, [effectivePageSize, filteredStaff, focusId]);

  useEffect(() => {
    if (loadingList || !focusId) return;
    const row = document.getElementById(`team-${focusId}`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, loadingList, page, paginatedStaff.length]);

  useEffect(() => {
    setRowActionMenu(null);
  }, [
    filters.role,
    filters.search,
    filters.status,
    page,
    pageSize,
    loadingList,
  ]);

  const resetForm = () => {
    if (isBlobUrl(form.avatarPreviewUrl)) {
      URL.revokeObjectURL(form.avatarPreviewUrl);
    }
    setForm(EMPTY_FORM);
    setEditingUserId("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setIsFormModalOpen(true);
  };

  const onFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const clearAvatarSelection = () => {
    setForm((prev) => {
      if (isBlobUrl(prev.avatarPreviewUrl)) {
        URL.revokeObjectURL(prev.avatarPreviewUrl);
      }
      return {
        ...prev,
        avatarFile: null,
        avatarFileId: "",
        avatarPreviewUrl: "",
      };
    });
  };

  const toggleScope = (scope) => {
    setForm((prev) => {
      if (!availableScopeOptions.includes(scope)) return prev;
      const exists = prev.scopes.includes(scope);
      return {
        ...prev,
        scopes: exists
          ? prev.scopes.filter((item) => item !== scope)
          : [...prev.scopes, scope],
      };
    });
  };

  const onAvatarSelected = (file) => {
    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setError(
        t("teamPage.errors.avatarSize", {
          max: MAX_AVATAR_SIZE_MB,
        }),
      );
      return;
    }

    setError("");

    setForm((prev) => {
      if (isBlobUrl(prev.avatarPreviewUrl)) {
        URL.revokeObjectURL(prev.avatarPreviewUrl);
      }
      return {
        ...prev,
        avatarFile: file,
        avatarPreviewUrl: URL.createObjectURL(file),
      };
    });
  };

  const uploadAvatarAndGetFileId = async (file) => {
    if (!file) return "";
    const uploaded = await profileService.uploadAvatar(file);
    return uploaded?.$id || "";
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const normalizedFirstName = form.firstName.trim();
    const normalizedLastName = form.lastName.trim();
    const normalizedEmail = form.email.trim().toLowerCase();

    if (!normalizedFirstName || normalizedFirstName.length < 2) {
      setError(t("teamPage.errors.firstName"));
      return;
    }

    if (!normalizedLastName || normalizedLastName.length < 2) {
      setError(t("teamPage.errors.lastName"));
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError(t("teamPage.errors.invalidEmail"));
      return;
    }

    if (!STAFF_ROLES.includes(form.role)) {
      setError(t("teamPage.errors.invalidRole"));
      return;
    }

    const effectiveScopes = sanitizeScopesForInstance(form.scopes);

    setLoadingCreate(true);
    let resolvedAvatarFileId = form.avatarFileId || "";
    let uploadedAvatarWasNew = false;
    try {
      if (form.avatarFile) {
        resolvedAvatarFileId = await uploadAvatarAndGetFileId(form.avatarFile);
        uploadedAvatarWasNew = Boolean(resolvedAvatarFileId);
      }

      if (isEditing && editingUserId) {
        await staffService.updateStaff({
          userId: editingUserId,
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          email: normalizedEmail,
          role: form.role,
          scopes: effectiveScopes,
          avatarFileId: resolvedAvatarFileId,
        });

        setSuccess(t("teamPage.messages.updated"));
        closeFormModal();
        await loadStaff();
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError(t("teamPage.errors.passwordMismatch"));
        setLoadingCreate(false);
        return;
      }

      if (!isStrongPassword(form.password)) {
        setError(t("teamPage.errors.passwordWeak"));
        setLoadingCreate(false);
        return;
      }

      await staffService.createStaffUser({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        password: form.password,
        role: form.role,
        scopes: effectiveScopes,
        avatarFileId: resolvedAvatarFileId,
      });

      setSuccess(t("teamPage.messages.created"));
      closeFormModal();
      await loadStaff();
    } catch (err) {
      if (uploadedAvatarWasNew && resolvedAvatarFileId) {
        await profileService.deleteAvatar(resolvedAvatarFileId).catch(() => {});
      }
      setError(
        getErrorMessage(
          err,
          isEditing ? t("teamPage.errors.update") : t("teamPage.errors.create"),
        ),
      );
    } finally {
      setLoadingCreate(false);
    }
  };

  const openMemberEditor = (item) => {
    closeRowActionMenu();
    if (isBlobUrl(form.avatarPreviewUrl)) {
      URL.revokeObjectURL(form.avatarPreviewUrl);
    }

    setEditingUserId(item.$id);
    setForm({
      ...EMPTY_FORM,
      firstName: String(item.firstName || ""),
      lastName: String(item.lastName || ""),
      email: String(item.email || ""),
      role: STAFF_ROLES.includes(String(item.role || ""))
        ? item.role
        : "staff_support",
      scopes: parseScopesJson(item.scopesJson),
      avatarFileId: String(item.avatarFileId || ""),
      avatarPreviewUrl: getAvatarUrl(item),
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setSuccess("");
    setIsFormModalOpen(true);
  };

  const toggleEnabled = async (item) => {
    closeRowActionMenu();
    setBusyUserId(item.$id);
    setError("");
    setSuccess("");
    try {
      await staffService.setStaffEnabled({
        userId: item.$id,
        enabled: !(item.enabled !== false),
      });
      setSuccess(
        item.enabled !== false
          ? t("teamPage.messages.disabled")
          : t("teamPage.messages.enabled"),
      );
      await loadStaff();
    } catch (err) {
      setError(getErrorMessage(err, t("teamPage.errors.toggle")));
    } finally {
      setBusyUserId("");
    }
  };

  const sendPasswordRecovery = async (item) => {
    closeRowActionMenu();
    const targetEmail = String(item?.email || "")
      .trim()
      .toLowerCase();
    if (!targetEmail) {
      setError(t("teamPage.errors.invalidEmail"));
      return;
    }

    setSendingRecoveryUserId(item.$id);
    setError("");
    setSuccess("");
    try {
      await authService.requestPasswordRecovery(targetEmail);
      setSuccess(
        t("teamPage.messages.passwordRecoverySent", {
          email: targetEmail,
          defaultValue: "Se envio el enlace de recuperacion a {{email}}.",
        }),
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          t("teamPage.errors.passwordRecovery", {
            defaultValue: "No se pudo enviar el enlace de recuperacion.",
          }),
        ),
      );
    } finally {
      setSendingRecoveryUserId("");
    }
  };

  const openPermissionsEditor = (item) => {
    closeRowActionMenu();
    setPermissionsEditor({
      userId: item.$id,
      role: item.role,
      scopes: parseScopesJson(item.scopesJson),
      displayName: getFullName(item, item.email),
      email: item.email,
    });
  };

  const onToggleEditorScope = (scope) => {
    setPermissionsEditor((prev) => {
      if (!prev) return prev;
      if (!availableScopeOptions.includes(scope)) return prev;
      const hasScope = prev.scopes.includes(scope);
      return {
        ...prev,
        scopes: hasScope
          ? prev.scopes.filter((item) => item !== scope)
          : [...prev.scopes, scope],
      };
    });
  };

  const savePermissionsEditor = async () => {
    if (!permissionsEditor) return;

    setSavingPermissions(true);
    setError("");
    setSuccess("");

    try {
      const effectiveScopes = sanitizeScopesForInstance(permissionsEditor.scopes);
      await staffService.updateStaff({
        userId: permissionsEditor.userId,
        role: permissionsEditor.role,
        scopes: effectiveScopes,
      });
      setSuccess(t("teamPage.messages.updated"));
      setPermissionsEditor(null);
      await loadStaff();
    } catch (err) {
      setError(getErrorMessage(err, t("teamPage.errors.update")));
    } finally {
      setSavingPermissions(false);
    }
  };

  const closeRowActionMenu = useCallback(() => {
    setRowActionMenu(null);
  }, []);

  const openRowActionMenu = (event, userId, triggerId = userId) => {
    if (typeof window === "undefined") return;

    const triggerRect = event.currentTarget.getBoundingClientRect();
    const horizontalPadding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = Math.min(240, viewportWidth - horizontalPadding * 2);
    const estimatedMenuHeight = 156;
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

    setRowActionMenu((prev) =>
      prev?.userId === userId && prev?.triggerId === triggerId
        ? null
        : {
            userId,
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

  const renderMemberAvatar = (item) => {
    const fullName = getFullName(item, item.email);
    const initials = fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
    const avatarUrl = getAvatarUrl(item);

    if (avatarUrl) {
      return (
        <LazyImage
          src={avatarUrl}
          alt={fullName}
          className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
        />
      );
    }

    return (
      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-xs font-bold text-white">
        {initials || "TM"}
      </div>
    );
  };

  const renderRowActionTrigger = (item, triggerId, compact = false) => (
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
      disabled={busyUserId === item.$id || sendingRecoveryUserId === item.$id}
      aria-label={t("teamPage.actions.openMenu", {
        defaultValue: "Abrir menu de acciones",
      })}
      aria-haspopup="menu"
      aria-expanded={rowActionMenu?.userId === item.$id}
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 ${
        compact ? "h-9 w-9" : "h-10 w-10"
      }`}
    >
      <EllipsisVertical size={16} />
    </button>
  );

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {t("teamPage.title")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("teamPage.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500"
          >
            <Plus size={16} />
            {t("teamPage.actions.create")}
          </button>
        </div>
      </header>

      <StatsCardsRow items={summaryCards} />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
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

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-start justify-between gap-3">
            <p className="break-words">{success}</p>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="rounded-md p-1 opacity-80 transition hover:bg-emerald-100 hover:opacity-100 dark:hover:bg-emerald-900/40"
              aria-label={t("common.close", "Cerrar")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-cyan-50/40 p-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/70 sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/20" />
        <div className="relative grid items-start gap-3 lg:grid-cols-3">
          <label className="grid min-w-0 self-start gap-1 text-sm lg:col-span-2">
            <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Search size={14} />
              {t("teamPage.fields.search")}
            </span>
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder={t("teamPage.placeholders.search")}
              className={inputClass}
            />
          </label>

          <div className="grid self-start gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>{t("teamPage.fields.role")}</span>
              <Select
                value={filters.role}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, role: value }))
                }
                options={filterRoleOptions}
                className={inputClass}
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span>{t("teamPage.fields.status")}</span>
              <Select
                value={filters.status}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
                options={filterStatusOptions}
                className={inputClass}
              />
            </label>
          </div>
        </div>

      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        {loadingList ? (
          <div className="space-y-3 p-4 sm:p-5">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Loader2 size={14} className="animate-spin" />
              <LoadingState text={t("teamPage.loading")} />
            </p>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((row) => (
                <div
                  key={`team-loading-row-${row}`}
                  className="h-11 w-full animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/70"
                />
              ))}
            </div>
          </div>
        ) : null}

        {!loadingList && filteredStaff.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyStatePanel
              icon={Users}
              title={t("teamPage.empty")}
              description={t("teamPage.subtitle")}
              compact
            />
          </div>
        ) : null}

        {!loadingList && filteredStaff.length > 0 ? (
          <>
            <div className="divide-y divide-slate-200 dark:divide-slate-700 lg:hidden">
              {paginatedStaff.map((item) => {
                const itemScopes = parseScopesJson(item.scopesJson);
                const isFocused = Boolean(focusId) && item.$id === focusId;
                const roleLabel =
                  roleOptions.find((option) => option.value === item.role)
                    ?.label || item.role;

                return (
                  <article
                    key={`team-mobile-${item.$id}`}
                    id={`team-${item.$id}`}
                    className={`space-y-3 px-4 py-3 ${
                      isFocused ? "bg-cyan-50/70 dark:bg-cyan-900/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {renderMemberAvatar(item)}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                            {getFullName(item, item.email)}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                            {item.email}
                          </p>
                        </div>
                      </div>
                      {renderRowActionTrigger(item, `mobile-${item.$id}`, true)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100">
                        {roleLabel}
                      </span>

                      <button
                        type="button"
                        onClick={() => openPermissionsEditor(item)}
                        disabled={busyUserId === item.$id}
                        className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <SlidersHorizontal size={14} />
                        {`${t("teamPage.table.permissions")} (${itemScopes.length})`}
                      </button>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.enabled !== false
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {item.enabled !== false
                          ? t("teamPage.status.enabled")
                          : t("teamPage.status.disabled")}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden w-full max-w-full overflow-x-auto lg:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50/90 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                  <tr>
                    <th className="min-w-[220px] px-4 py-3">
                      {t("teamPage.table.member")}
                    </th>
                    <th className="min-w-[140px] px-4 py-3">
                      {t("teamPage.table.role")}
                    </th>
                    <th className="min-w-[160px] px-4 py-3">
                      {t("teamPage.table.permissions")}
                    </th>
                    <th className="min-w-[120px] px-4 py-3">
                      {t("teamPage.table.status")}
                    </th>
                    <th className="min-w-[100px] px-4 py-3">
                      {t("teamPage.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStaff.map((item) => {
                    const itemScopes = parseScopesJson(item.scopesJson);
                    const isFocused = Boolean(focusId) && item.$id === focusId;
                    const roleLabel =
                      roleOptions.find((option) => option.value === item.role)
                        ?.label || item.role;

                    return (
                      <tr
                        key={item.$id}
                        id={`team-${item.$id}`}
                        className={`border-t border-slate-200 transition-colors hover:bg-slate-50/80 dark:border-slate-700 dark:hover:bg-slate-800/60 ${
                          isFocused ? "bg-cyan-50/70 dark:bg-cyan-900/20" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {renderMemberAvatar(item)}
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                                {getFullName(item, item.email)}
                              </p>
                              <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                                {item.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100">
                            {roleLabel}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openPermissionsEditor(item)}
                            disabled={busyUserId === item.$id}
                            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <SlidersHorizontal size={14} />
                            {`${t("teamPage.table.permissions")} (${itemScopes.length})`}
                          </button>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.enabled !== false
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {item.enabled !== false
                              ? t("teamPage.status.enabled")
                              : t("teamPage.status.disabled")}
                          </span>
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
              totalItems={filteredStaff.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(value) => {
                setPageSize(value);
                setPage(1);
              }}
            />
          </>
        ) : null}
      </section>

      {rowActionMenu && rowActionItem && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={rowActionMenuRef}
              role="menu"
              aria-label={t("teamPage.actions.menuLabel", {
                defaultValue: "Acciones del usuario",
              })}
              className="fixed z-[130] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              style={{
                top: `${rowActionMenu.top}px`,
                left: `${rowActionMenu.left}px`,
                width: `${rowActionMenu.width}px`,
              }}
            >
              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => openMemberEditor(rowActionItem)}
                  disabled={
                    busyUserId === rowActionItem.$id ||
                    sendingRecoveryUserId === rowActionItem.$id
                  }
                  className="inline-flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Pencil size={15} />
                  {t("teamPage.actions.edit", { defaultValue: "Editar" })}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => sendPasswordRecovery(rowActionItem)}
                  disabled={
                    busyUserId === rowActionItem.$id ||
                    sendingRecoveryUserId === rowActionItem.$id
                  }
                  className="inline-flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {sendingRecoveryUserId === rowActionItem.$id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <KeyRound size={15} />
                  )}
                  {sendingRecoveryUserId === rowActionItem.$id
                    ? t("teamPage.actions.sendingRecovery", {
                        defaultValue: "Enviando...",
                      })
                    : t("teamPage.actions.sendRecovery", {
                        defaultValue: "Enviar recuperacion",
                      })}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => toggleEnabled(rowActionItem)}
                  disabled={
                    busyUserId === rowActionItem.$id ||
                    sendingRecoveryUserId === rowActionItem.$id
                  }
                  className="inline-flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {rowActionItem.enabled !== false ? (
                    <UserX size={15} />
                  ) : (
                    <UserCheck size={15} />
                  )}
                  {rowActionItem.enabled !== false
                    ? t("teamPage.actions.disable")
                    : t("teamPage.actions.enable")}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      <Modal
        isOpen={Boolean(permissionsEditor)}
        onClose={() => setPermissionsEditor(null)}
        title={t("teamPage.permissionsModal.title")}
        size="md"
        footer={
          <ModalFooter>
            <button
              type="button"
              onClick={() => setPermissionsEditor(null)}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={savePermissionsEditor}
              disabled={savingPermissions}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-sky-600 px-3 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPermissions ? (
                <Loader2 size={15} className="mr-2 animate-spin" />
              ) : null}
              {t("teamPage.actions.savePermissions")}
            </button>
          </ModalFooter>
        }
      >
        {permissionsEditor ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {permissionsEditor.displayName}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {permissionsEditor.email}
              </p>
            </div>

            <label className="grid gap-1 text-sm">
              <span>{t("teamPage.fields.role")}</span>
              <Select
                value={permissionsEditor.role}
                onChange={(value) =>
                  setPermissionsEditor((prev) =>
                    prev ? { ...prev, role: value } : prev,
                  )
                }
                options={roleOptions}
                className={inputClass}
              />
            </label>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("teamPage.fields.scopes")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {availableScopeOptions.map((scope) => (
                  <label
                    key={`modal-${scope}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={permissionsEditor.scopes.includes(scope)}
                      onChange={() => onToggleEditorScope(scope)}
                    />
                    <span>{getScopeLabel(scope, t)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        closeOnBackdrop={!loadingCreate}
        closeOnEscape={!loadingCreate}
        title={
          isEditing
            ? t("teamPage.editTitle", { defaultValue: "Editar miembro" })
            : t("teamPage.createTitle")
        }
        description={t("teamPage.subtitle")}
        size="lg"
        footer={
          <ModalFooter>
            <button
              type="button"
              onClick={closeFormModal}
              disabled={loadingCreate}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isEditing
                ? t("teamPage.actions.cancelEdit", {
                    defaultValue: "Cancelar edicion",
                  })
                : t("teamPage.actions.reset")}
            </button>
            <button
              type="submit"
              form="team-form"
              disabled={loadingCreate}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingCreate ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : null}
              {loadingCreate
                ? isEditing
                  ? t("teamPage.actions.saving", {
                      defaultValue: "Guardando...",
                    })
                  : t("teamPage.actions.creating")
                : isEditing
                  ? t("teamPage.actions.save", {
                      defaultValue: "Guardar cambios",
                    })
                  : t("teamPage.actions.create")}
            </button>
          </ModalFooter>
        }
      >
        <form id="team-form" onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-4">
            <article className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {form.avatarPreviewUrl ? (
                    <LazyImage
                      src={form.avatarPreviewUrl}
                      alt={t("teamPage.fields.avatar")}
                      className="h-20 w-20 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                      eager={true}
                    />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-xl font-bold text-white">
                      <UserRound size={24} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {t("teamPage.fields.avatar")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {t("teamPage.hints.avatar", {
                        max: MAX_AVATAR_SIZE_MB,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition dark:border-slate-700 dark:text-slate-200 ${loadingCreate ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                  >
                    <ImagePlus size={14} />
                    {t("teamPage.actions.uploadPhoto")}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={loadingCreate}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        onAvatarSelected(file);
                      }}
                    />
                  </label>
                  {form.avatarPreviewUrl ? (
                    <button
                      type="button"
                      onClick={clearAvatarSelection}
                      disabled={loadingCreate}
                      className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {t("teamPage.actions.removePhoto")}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>

            <article className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="grid gap-1 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <UserRound size={14} /> {t("teamPage.fields.firstName")}
                  </span>
                  <input
                    required
                    disabled={loadingCreate}
                    minLength={2}
                    value={form.firstName}
                    autoComplete="given-name"
                    onChange={(event) =>
                      onFormChange("firstName", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <UserRound size={14} /> {t("teamPage.fields.lastName")}
                  </span>
                  <input
                    required
                    disabled={loadingCreate}
                    minLength={2}
                    value={form.lastName}
                    autoComplete="family-name"
                    onChange={(event) =>
                      onFormChange("lastName", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-2">
                  <span className="inline-flex items-center gap-2">
                    <Mail size={14} /> {t("teamPage.fields.email")}
                  </span>
                  <input
                    required
                    disabled={loadingCreate}
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) =>
                      onFormChange("email", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-1">
                  <span>{t("teamPage.fields.role")}</span>
                  <Select
                    required
                    disabled={loadingCreate}
                    value={form.role}
                    onChange={(value) => onFormChange("role", value)}
                    options={roleOptions}
                    className={inputClass}
                  />
                </label>
              </div>

              {!isEditing ? (
                <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Lock size={14} />
                    {t("teamPage.fields.passwordSection")}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm">
                      <span>{t("teamPage.fields.password")}</span>
                      <div className="relative">
                        <input
                          required
                          disabled={loadingCreate}
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(event) =>
                            onFormChange("password", event.target.value)
                          }
                          className={`${inputClass} pr-11`}
                        />
                        <button
                          type="button"
                          disabled={loadingCreate}
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword
                              ? t("passwordField.hide")
                              : t("passwordField.show")
                          }
                          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </label>

                    <label className="grid gap-1 text-sm">
                      <span>{t("teamPage.fields.confirmPassword")}</span>
                      <div className="relative">
                        <input
                          required
                          disabled={loadingCreate}
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={form.confirmPassword}
                          onChange={(event) =>
                            onFormChange("confirmPassword", event.target.value)
                          }
                          className={`${inputClass} pr-20 ${
                            showPasswordMismatch
                              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                              : passwordsMatch
                                ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                                : ""
                          }`}
                        />
                        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                          {form.confirmPassword.length > 0 && (
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                passwordsMatch
                                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                                  : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                              }`}
                            >
                              {passwordsMatch ? (
                                <Check size={12} />
                              ) : (
                                <X size={12} />
                              )}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                            disabled={loadingCreate}
                            aria-label={
                              showConfirmPassword
                                ? t("passwordField.hide")
                                : t("passwordField.show")
                            }
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                      {showPasswordMismatch && (
                        <p className="text-xs text-red-500 dark:text-red-400">
                          {t("teamPage.errors.passwordMismatch")}
                        </p>
                      )}
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <span
                          key={step}
                          className={`h-1.5 rounded-full ${
                            passwordScore >= step
                              ? passwordScore <= 2
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {t(`passwordStrength.levels.${passwordScore}`)}
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <li>
                        {passwordChecks.hasMinLength ? "OK" : "NO"}{" "}
                        {t("passwordStrength.rules.minLength")}
                      </li>
                      <li>
                        {passwordChecks.hasLower && passwordChecks.hasUpper
                          ? "OK"
                          : "NO"}{" "}
                        {t("passwordStrength.rules.upperLower")}
                      </li>
                      <li>
                        {passwordChecks.hasNumber ? "OK" : "NO"}{" "}
                        {t("passwordStrength.rules.number")}
                      </li>
                      <li>
                        {passwordChecks.hasSymbol ? "OK" : "NO"}{" "}
                        {t("passwordStrength.rules.symbol")}
                      </li>
                    </ul>
                  </div>
                </section>
              ) : null}
            </article>
          </div>

          <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Shield size={14} />
              {t("teamPage.fields.scopes")}
            </p>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availableScopeOptions.map((scope) => (
                <label
                  key={scope}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 ${loadingCreate ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    disabled={loadingCreate}
                    checked={form.scopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                  />
                  <span>{getScopeLabel(scope, t)}</span>
                </label>
              ))}
            </div>
          </section>
        </form>
      </Modal>
    </section>
  );
};

export default Team;
