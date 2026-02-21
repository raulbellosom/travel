import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar } from "../../../components/common";
import { profileService } from "../../../services/profileService";

/**
 * Resolves the avatar URL from a staff user object.
 * @param {Object|null} user - Staff user with $id, firstName, lastName, avatarFileId
 * @returns {string}
 */
const resolveAvatarUrl = (user) => {
  if (!user?.avatarFileId) return "";
  return profileService.getAvatarViewUrl(user.avatarFileId);
};

/**
 * Computes full name from firstName + lastName.
 */
const getFullName = (user) => {
  if (!user) return "";
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "-"
  );
};

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * ResourceResponsibleCell
 *
 * Single combobox component showing the responsible user (avatar + name + email) as trigger.
 * Opens a searchable portal dropdown listing all staff users with their avatar + name + email.
 *
 * @param {string}   ownerUserId    - Current responsible user ID (from resource.ownerUserId)
 * @param {Object[]} staffUsers     - Array of staff user objects { $id, firstName, lastName, email, avatarFileId }
 * @param {boolean}  loading        - Whether staff data is still loading
 * @param {boolean}  disabled       - Whether changes are disabled (e.g. busy operation)
 * @param {Function} onChange       - Callback(newOwnerUserId) when reassigned
 * @param {Function} onAvatarClick  - Callback(avatarUrl) when avatar is clicked
 */
const ResourceResponsibleCell = ({
  ownerUserId,
  staffUsers = [],
  loading = false,
  readOnly = false,
  disabled = false,
  onChange,
  onAvatarClick,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const [layout, setLayout] = useState({
    left: 0,
    top: 0,
    width: 220,
    maxHeight: 260,
  });

  // Find the current responsible user from the staff list
  const currentUser = useMemo(() => {
    if (!ownerUserId) return null;
    const found = staffUsers.find((u) => u.$id === ownerUserId);
    if (!found && ownerUserId) {
      return {
        $id: ownerUserId,
        email: "",
        firstName: "",
        lastName: "",
        avatarFileId: "",
      };
    }
    return found || null;
  }, [ownerUserId, staffUsers]);

  const avatarUrl = useMemo(() => resolveAvatarUrl(currentUser), [currentUser]);
  const fullName =
    getFullName(currentUser) ||
    (ownerUserId ? `ID: ${ownerUserId.slice(0, 8)}…` : "-");

  // Filtered staff list based on search query
  const filteredUsers = useMemo(() => {
    const q = normalizeText(search);
    if (!q) return staffUsers;
    return staffUsers.filter((u) => {
      const name = normalizeText(getFullName(u));
      const email = normalizeText(u.email || "");
      return name.includes(q) || email.includes(q);
    });
  }, [staffUsers, search]);

  const updateLayout = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect || typeof window === "undefined") return;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const safeOffset = 8;
    const itemHeight = 52;
    const preferredHeight = Math.min(
      260,
      Math.max(60, filteredUsers.length * itemHeight + 56),
    );
    const spaceBelow = viewportHeight - rect.bottom - safeOffset;
    const spaceAbove = rect.top - safeOffset;
    const openUp = spaceBelow < preferredHeight && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      100,
      (openUp ? spaceAbove : spaceBelow) - 8,
    );
    const maxHeight = Math.min(260, availableHeight);
    const width = Math.max(220, rect.width);
    const left = Math.max(
      safeOffset,
      Math.min(rect.left, viewportWidth - width - safeOffset),
    );
    const top = openUp
      ? Math.max(
          safeOffset,
          rect.top - Math.min(maxHeight, preferredHeight) - 6,
        )
      : Math.min(
          rect.bottom + 6,
          viewportHeight - Math.min(maxHeight, preferredHeight) - safeOffset,
        );
    setLayout({ left, top, width, maxHeight });
  }, [filteredUsers.length]);

  const openDropdown = () => {
    if (disabled) return;
    setSearch("");
    updateLayout();
    setIsOpen(true);
    setTimeout(() => searchRef.current?.focus(), 30);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearch("");
  };

  const handleSelect = (userId) => {
    if (userId !== ownerUserId && onChange) {
      onChange(userId);
    }
    closeDropdown();
  };

  // Recompute layout on search change (list height changes)
  useEffect(() => {
    if (isOpen) updateLayout();
  }, [isOpen, updateLayout]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex flex-col gap-1">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-2.5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  // Read-only: plain display without combobox chrome
  if (readOnly) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="shrink-0"
          onClick={() => avatarUrl && onAvatarClick?.(avatarUrl)}
          role={avatarUrl && onAvatarClick ? "button" : undefined}
          tabIndex={avatarUrl && onAvatarClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (
              (e.key === "Enter" || e.key === " ") &&
              avatarUrl &&
              onAvatarClick
            ) {
              onAvatarClick(avatarUrl);
            }
          }}
        >
          <Avatar
            src={avatarUrl || undefined}
            name={fullName}
            size="sm"
            variant="circular"
          />
        </span>
        <div className="min-w-0 overflow-hidden">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
            {fullName}
          </p>
          {currentUser?.email ? (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {currentUser.email}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Trigger button — shows avatar + name + email */}
      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition
          ${
            isOpen
              ? "border-sky-500 bg-sky-50/60 ring-1 ring-sky-500 dark:bg-sky-900/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          }
          ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        {/* Avatar — clicking it also opens the dropdown; if user wants to view avatar, they do so from the image */}
        <span
          className="shrink-0"
          onClick={(e) => {
            if (avatarUrl && onAvatarClick) {
              e.stopPropagation();
              onAvatarClick(avatarUrl);
            }
          }}
          role={avatarUrl && onAvatarClick ? "button" : undefined}
          tabIndex={avatarUrl && onAvatarClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (
              (e.key === "Enter" || e.key === " ") &&
              avatarUrl &&
              onAvatarClick
            ) {
              e.stopPropagation();
              onAvatarClick(avatarUrl);
            }
          }}
        >
          <Avatar
            src={avatarUrl || undefined}
            name={fullName}
            size="sm"
            variant="circular"
          />
        </span>

        {/* Name + email */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
            {fullName}
          </p>
          {currentUser?.email ? (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {currentUser.email}
            </p>
          ) : null}
        </div>

        {/* Chevron indicator */}
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-150 dark:text-slate-500
            ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Portal dropdown */}
      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[120] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
              style={{
                left: `${layout.left}px`,
                top: `${layout.top}px`,
                width: `${layout.width}px`,
              }}
            >
              {/* Search input */}
              <div className="border-b border-slate-100 p-2 dark:border-slate-800">
                <div className="flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1.5 dark:bg-slate-800">
                  <Search size={13} className="shrink-0 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t(
                      "myResourcesPage.filters.searchResponsible",
                      "Buscar…",
                    )}
                    className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none dark:text-slate-200 dark:placeholder-slate-500"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") closeDropdown();
                    }}
                  />
                </div>
              </div>

              {/* User list */}
              <ul
                role="listbox"
                className="overflow-y-auto py-1"
                style={{ maxHeight: `${layout.maxHeight - 50}px` }}
              >
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const uAvatarUrl = resolveAvatarUrl(u);
                    const uFullName = getFullName(u);
                    const isSelected = u.$id === ownerUserId;
                    return (
                      <li
                        key={u.$id}
                        role="option"
                        aria-selected={isSelected}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(u.$id);
                        }}
                        className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 transition
                          ${
                            isSelected
                              ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200"
                              : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                          }`}
                      >
                        <Avatar
                          src={uAvatarUrl || undefined}
                          name={uFullName}
                          size="sm"
                          variant="circular"
                        />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate text-sm font-medium">
                            {uFullName}
                          </p>
                          {u.email ? (
                            <p className="truncate text-xs opacity-60">
                              {u.email}
                            </p>
                          ) : null}
                        </div>
                        {isSelected ? (
                          <span className="ml-auto text-xs font-semibold text-sky-600 dark:text-sky-400">
                            ✓
                          </span>
                        ) : null}
                      </li>
                    );
                  })
                ) : (
                  <li className="px-3 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
                    {t("common.noResults", "Sin resultados")}
                  </li>
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default ResourceResponsibleCell;
