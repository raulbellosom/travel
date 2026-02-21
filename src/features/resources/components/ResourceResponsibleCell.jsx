import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Select } from "../../../components/common";
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
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "-";
};

/**
 * ResourceResponsibleCell
 *
 * Displays the current responsible user (avatar + name + email) inside a table cell.
 * Includes a Combobox to reassign the responsible agent.
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
  disabled = false,
  onChange,
  onAvatarClick,
}) => {
  const { t } = useTranslation();

  // Find the current responsible user from the staff list
  const currentUser = useMemo(() => {
    if (!ownerUserId) return null;
    const found = staffUsers.find((u) => u.$id === ownerUserId);
    // Fallback: if user not found in staffUsers but we have ownerUserId, show placeholder
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
  const fullName = getFullName(currentUser) || (ownerUserId ? `ID: ${ownerUserId.slice(0, 8)}...` : "-");

  // Build Select options
  const options = useMemo(() => {
    return staffUsers.map((u) => ({
      value: u.$id,
      label: getFullName(u),
    }));
  }, [staffUsers]);

  // Handle selection
  const handleChange = (nextValue) => {
    if (nextValue && nextValue !== ownerUserId && onChange) {
      onChange(nextValue);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <span className="animate-pulse">…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Display current responsible */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => avatarUrl && onAvatarClick?.(avatarUrl)}
          disabled={!avatarUrl}
          className="shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 rounded-full disabled:cursor-default"
          aria-label={fullName}
        >
          <Avatar
            src={avatarUrl || undefined}
            name={fullName}
            size="sm"
            variant="circular"
          />
        </button>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
            {fullName || "-"}
          </p>
          {currentUser?.email ? (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {currentUser.email}
            </p>
          ) : null}
        </div>
      </div>

      {/* Select to reassign */}
      <Select
        options={options}
        value={ownerUserId || ""}
        onChange={handleChange}
        placeholder={t("myResourcesPage.filters.responsible")}
        disabled={disabled || options.length === 0}
        size="xs"
      />
    </div>
  );
};

export default ResourceResponsibleCell;
