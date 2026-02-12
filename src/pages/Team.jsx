import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Lock,
  Mail,
  Search,
  Shield,
  SlidersHorizontal,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import { Select, TablePagination } from "../components/common";
import Modal from "../components/common/organisms/Modal";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import StatsCardsRow from "../components/common/molecules/StatsCardsRow";
import { profileService } from "../services/profileService";
import { staffService, STAFF_ROLES } from "../services/staffService";
import { getErrorMessage } from "../utils/errors";
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

const TABS = {
  list: "list",
  manage: "manage",
};

const SCOPE_OPTIONS = [
  "staff.manage",
  "properties.read",
  "properties.write",
  "leads.read",
  "leads.write",
  "reservations.read",
  "reservations.write",
  "payments.read",
  "reviews.moderate",
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
    item.avatarUpdatedAt
  )}`;
};

const getFullName = (item, fallback = "") => {
  const fullName = `${item?.firstName || ""} ${item?.lastName || ""}`.trim();
  return fullName || fallback;
};

const Team = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(TABS.list);
  const [form, setForm] = useState(EMPTY_FORM);
  const [staff, setStaff] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [permissionsEditor, setPermissionsEditor] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [busyUserId, setBusyUserId] = useState("");
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordChecks = useMemo(
    () => getPasswordChecks(form.password),
    [form.password]
  );
  const passwordScore = useMemo(
    () => getPasswordStrengthScore(form.password),
    [form.password]
  );

  const roleOptions = useMemo(
    () => [
      { value: "staff_manager", label: t("teamPage.roles.staff_manager") },
      { value: "staff_editor", label: t("teamPage.roles.staff_editor") },
      { value: "staff_support", label: t("teamPage.roles.staff_support") },
    ],
    [t]
  );

  const filterRoleOptions = useMemo(
    () => [
      { value: "all", label: t("teamPage.filters.allRoles") },
      ...roleOptions,
    ],
    [roleOptions, t]
  );

  const filterStatusOptions = useMemo(
    () => [
      { value: "all", label: t("teamPage.filters.allStatuses") },
      { value: "enabled", label: t("teamPage.status.enabled") },
      { value: "disabled", label: t("teamPage.status.disabled") },
    ],
    [t]
  );

  const loadStaff = useCallback(async () => {
    setLoadingList(true);
    setError("");
    try {
      const documents = await staffService.listStaff();
      setStaff(documents);
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
      if (form.avatarPreviewUrl) {
        URL.revokeObjectURL(form.avatarPreviewUrl);
      }
    };
  }, [form.avatarPreviewUrl]);

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
    [summaryStats.active, summaryStats.inactive, summaryStats.total, t]
  );

  const filteredStaff = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return staff.filter((item) => {
      const fullName = getFullName(item).toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const role = String(item.role || "").toLowerCase();
      const enabled = item.enabled !== false;

      const matchesQuery =
        !query || fullName.includes(query) || email.includes(query) || role.includes(query);
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

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredStaff.length / pageSize)),
    [filteredStaff.length, pageSize]
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedStaff = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, page, pageSize]);

  const resetForm = () => {
    if (form.avatarPreviewUrl) {
      URL.revokeObjectURL(form.avatarPreviewUrl);
    }
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const onFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const clearAvatarSelection = () => {
    setForm((prev) => {
      if (prev.avatarPreviewUrl) {
        URL.revokeObjectURL(prev.avatarPreviewUrl);
      }
      return {
        ...prev,
        avatarFile: null,
        avatarPreviewUrl: "",
      };
    });
  };

  const toggleScope = (scope) => {
    setForm((prev) => {
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
        })
      );
      return;
    }

    setError("");

    setForm((prev) => {
      if (prev.avatarPreviewUrl) {
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

    if (!form.firstName.trim() || form.firstName.trim().length < 2) {
      setError(t("teamPage.errors.firstName"));
      return;
    }

    if (!form.lastName.trim() || form.lastName.trim().length < 2) {
      setError(t("teamPage.errors.lastName"));
      return;
    }

    if (!isValidEmail(form.email)) {
      setError(t("teamPage.errors.invalidEmail"));
      return;
    }

    if (!STAFF_ROLES.includes(form.role)) {
      setError(t("teamPage.errors.invalidRole"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("teamPage.errors.passwordMismatch"));
      return;
    }

    if (!isStrongPassword(form.password)) {
      setError(t("teamPage.errors.passwordWeak"));
      return;
    }

    setLoadingCreate(true);
    let uploadedAvatarFileId = "";
    try {
      uploadedAvatarFileId = await uploadAvatarAndGetFileId(form.avatarFile);

      await staffService.createStaffUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        scopes: form.scopes,
        avatarFileId: uploadedAvatarFileId,
      });

      setSuccess(t("teamPage.messages.created"));
      resetForm();
      setActiveTab(TABS.list);
      await loadStaff();
    } catch (err) {
      if (uploadedAvatarFileId) {
        await profileService.deleteAvatar(uploadedAvatarFileId).catch(() => {});
      }
      setError(getErrorMessage(err, t("teamPage.errors.create")));
    } finally {
      setLoadingCreate(false);
    }
  };

  const updateStaffRoleAndScopes = async ({ userId, role, scopes, avatarFileId }) => {
    setBusyUserId(userId);
    setError("");
    setSuccess("");
    try {
      await staffService.updateStaff({
        userId,
        role,
        scopes,
        avatarFileId,
      });
      setSuccess(t("teamPage.messages.updated"));
      await loadStaff();
    } catch (err) {
      setError(getErrorMessage(err, t("teamPage.errors.update")));
    } finally {
      setBusyUserId("");
    }
  };

  const toggleEnabled = async (item) => {
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
          : t("teamPage.messages.enabled")
      );
      await loadStaff();
    } catch (err) {
      setError(getErrorMessage(err, t("teamPage.errors.toggle")));
    } finally {
      setBusyUserId("");
    }
  };

  const onChangeMemberAvatar = async (item, file) => {
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setError(
        t("teamPage.errors.avatarSize", {
          max: MAX_AVATAR_SIZE_MB,
        })
      );
      return;
    }

    const itemScopes = parseScopesJson(item.scopesJson);
    let uploadedAvatarFileId = "";

    setBusyUserId(item.$id);
    setError("");
    setSuccess("");
    try {
      uploadedAvatarFileId = await uploadAvatarAndGetFileId(file);
      await staffService.updateStaff({
        userId: item.$id,
        role: item.role,
        scopes: itemScopes,
        avatarFileId: uploadedAvatarFileId,
      });

      setSuccess(t("teamPage.messages.avatarUpdated"));
      await loadStaff();
    } catch (err) {
      if (uploadedAvatarFileId) {
        await profileService.deleteAvatar(uploadedAvatarFileId).catch(() => {});
      }
      setError(getErrorMessage(err, t("teamPage.errors.avatarUpload")));
    } finally {
      setBusyUserId("");
    }
  };

  const openPermissionsEditor = (item) => {
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
      await staffService.updateStaff({
        userId: permissionsEditor.userId,
        role: permissionsEditor.role,
        scopes: permissionsEditor.scopes,
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
        <img
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

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("teamPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("teamPage.subtitle")}</p>
      </header>

      <StatsCardsRow items={summaryCards} />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {success}
        </p>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab(TABS.list)}
            className={`min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              activeTab === TABS.list
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {t("teamPage.tabs.list")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(TABS.manage)}
            className={`min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              activeTab === TABS.manage
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {t("teamPage.tabs.manage")}
          </button>
        </div>
      </div>

      {activeTab === TABS.list ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
          <div className="grid items-start gap-3 lg:grid-cols-3">
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
                  onChange={(value) => setFilters((prev) => ({ ...prev, role: value }))}
                  options={filterRoleOptions}
                  className={inputClass}
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span>{t("teamPage.fields.status")}</span>
                <Select
                  value={filters.status}
                  onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                  options={filterStatusOptions}
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          <p className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs leading-relaxed text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200">
            <Shield size={14} />
            {t("teamPage.permissionsStorageHint")}
          </p>

          {loadingList ? (
            <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Loader2 size={14} className="animate-spin" />
              {t("teamPage.loading")}
            </p>
          ) : null}

          {!loadingList && filteredStaff.length === 0 ? (
            <EmptyStatePanel
              icon={Users}
              title={t("teamPage.empty")}
              description={t("teamPage.subtitle")}
              compact
            />
          ) : null}

          {!loadingList && filteredStaff.length > 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3">{t("teamPage.table.member")}</th>
                      <th className="px-4 py-3">{t("teamPage.table.role")}</th>
                      <th className="px-4 py-3">{t("teamPage.table.permissions")}</th>
                      <th className="px-4 py-3">{t("teamPage.table.status")}</th>
                      <th className="px-4 py-3">{t("teamPage.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStaff.map((item) => {
                      const itemScopes = parseScopesJson(item.scopesJson);

                      return (
                        <tr key={item.$id} className="border-t border-slate-200 dark:border-slate-700">
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

                          <td className="px-4 py-3">
                            <Select
                              value={item.role}
                              onChange={(value) =>
                                updateStaffRoleAndScopes({
                                  userId: item.$id,
                                  role: value,
                                  scopes: itemScopes,
                                })
                              }
                              disabled={busyUserId === item.$id}
                              options={roleOptions}
                              className={inputClass}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => openPermissionsEditor(item)}
                              disabled={busyUserId === item.$id}
                              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <SlidersHorizontal size={14} />
                              {t("teamPage.actions.permissions")} ({itemScopes.length})
                            </button>
                          </td>

                          <td className="px-4 py-3">
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
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                                <ImagePlus size={14} />
                                {t("teamPage.actions.changePhoto")}
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  className="hidden"
                                  disabled={busyUserId === item.$id}
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    event.target.value = "";
                                    onChangeMemberAvatar(item, file);
                                  }}
                                />
                              </label>

                              <button
                                type="button"
                                disabled={busyUserId === item.$id}
                                onClick={() => toggleEnabled(item)}
                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {item.enabled !== false
                                  ? t("teamPage.actions.disable")
                                  : t("teamPage.actions.enable")}
                              </button>
                            </div>
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
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === TABS.manage ? (
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t("teamPage.createTitle")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t("teamPage.subtitle")}
            </p>
          </header>

          <div className="space-y-4">
            <article className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {form.avatarPreviewUrl ? (
                    <img
                      src={form.avatarPreviewUrl}
                      alt={t("teamPage.fields.avatar")}
                      className="h-20 w-20 rounded-full border border-slate-200 object-cover dark:border-slate-700"
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
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                    <ImagePlus size={14} />
                    {t("teamPage.actions.uploadPhoto")}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
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
                      className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
                    minLength={2}
                    value={form.firstName}
                    autoComplete="given-name"
                    onChange={(event) => onFormChange("firstName", event.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <UserRound size={14} /> {t("teamPage.fields.lastName")}
                  </span>
                  <input
                    required
                    minLength={2}
                    value={form.lastName}
                    autoComplete="family-name"
                    onChange={(event) => onFormChange("lastName", event.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <Mail size={14} /> {t("teamPage.fields.email")}
                  </span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => onFormChange("email", event.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm">
                <span>{t("teamPage.fields.role")}</span>
                <Select
                  required
                  value={form.role}
                  onChange={(value) => onFormChange("role", value)}
                  options={roleOptions}
                  className={inputClass}
                />
              </label>

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
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(event) => onFormChange("password", event.target.value)}
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? t("passwordField.hide") : t("passwordField.show")}
                        className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span>{t("teamPage.fields.confirmPassword")}</span>
                    <div className="relative">
                      <input
                        required
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={(event) => onFormChange("confirmPassword", event.target.value)}
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={
                          showConfirmPassword ? t("passwordField.hide") : t("passwordField.show")
                        }
                        className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
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
                      {passwordChecks.hasMinLength ? "OK" : "NO"} {t("passwordStrength.rules.minLength")}
                    </li>
                    <li>
                      {passwordChecks.hasLower && passwordChecks.hasUpper ? "OK" : "NO"}{" "}
                      {t("passwordStrength.rules.upperLower")}
                    </li>
                    <li>
                      {passwordChecks.hasNumber ? "OK" : "NO"} {t("passwordStrength.rules.number")}
                    </li>
                    <li>
                      {passwordChecks.hasSymbol ? "OK" : "NO"} {t("passwordStrength.rules.symbol")}
                    </li>
                  </ul>
                </div>
              </section>
            </article>
          </div>

          <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Shield size={14} />
              {t("teamPage.fields.scopes")}
            </p>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SCOPE_OPTIONS.map((scope) => (
                <label
                  key={scope}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                >
                  <input
                    type="checkbox"
                    checked={form.scopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                  />
                  <span>{getScopeLabel(scope, t)}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loadingCreate}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingCreate ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              {loadingCreate ? t("teamPage.actions.creating") : t("teamPage.actions.create")}
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={loadingCreate}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("teamPage.actions.reset")}
            </button>
          </div>
        </form>
      ) : null}

      <Modal
        isOpen={Boolean(permissionsEditor)}
        onClose={() => setPermissionsEditor(null)}
        title={t("teamPage.permissionsModal.title")}
        size="md"
      >
        {permissionsEditor ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {permissionsEditor.displayName}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{permissionsEditor.email}</p>
            </div>

            <label className="grid gap-1 text-sm">
              <span>{t("teamPage.fields.role")}</span>
              <Select
                value={permissionsEditor.role}
                onChange={(value) =>
                  setPermissionsEditor((prev) => (prev ? { ...prev, role: value } : prev))
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
                {SCOPE_OPTIONS.map((scope) => (
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

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPermissionsEditor(null)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={savePermissionsEditor}
                disabled={savingPermissions}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-sky-600 px-3 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:opacity-60"
              >
                {savingPermissions ? <Loader2 size={15} className="mr-2 animate-spin" /> : null}
                {t("teamPage.actions.savePermissions")}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
};

export default Team;
