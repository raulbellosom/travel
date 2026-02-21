import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EllipsisVertical, Image as ImageIcon, Loader2, Star } from "lucide-react";
import LazyImage from "../../../components/common/atoms/LazyImage";
import { Select } from "../../../components/common";
import ResourceTypeBadge from "./ResourceTypeBadge";
import ResourceDetailsCell from "./ResourceDetailsCell";
import ResourcePriceCell from "./ResourcePriceCell";
import ResourceResponsibleCell from "./ResourceResponsibleCell";
import {
  getResourceTypeLabel,
  getCategoryLabel,
  getCommercialModeLabel,
} from "../../../utils/resourceLabels";
import { getResourceDetails } from "../../../utils/getResourceDetails";
import {
  getInternalEditPropertyRoute,
  getInternalPropertyDetailRoute,
} from "../../../utils/internalRoutes";

/**
 * ResourceTableRow
 *
 * A single row in the resource listing table. Adapts columns and detail cells
 * based on the item's resourceType.
 *
 * @param {Object} item - Resource document
 * @param {boolean} isFocused - Whether this row should have a highlight
 * @param {boolean} isBusy - Whether an operation is running on this row
 * @param {string|null} thumbnailUrl - Resolved thumbnail URL
 * @param {Array} statusOptions - Status select options
 * @param {Array} staffUsers - Staff user list for responsible assignment
 * @param {boolean} loadingStaff - Whether staff data is loading
 * @param {Function} onStatusChange - Status change handler
 * @param {Function} onResponsibleChange - Responsible change handler (resourceId, newOwnerUserId)
 * @param {Function} onFeaturedChange - Featured toggle handler (resourceId, featured)
 * @param {Function} onImageClick - Image click handler
 * @param {Function} onActionMenu - Action menu open handler
 * @param {Function} formatPrice - Price formatter function
 * @param {Function} formatDate - Date formatter function
 * @param {React.Ref} triggerRef - Ref callback for action menu trigger
 */
const ResourceTableRow = ({
  item,
  isFocused,
  isBusy,
  thumbnailUrl,
  statusOptions,
  staffUsers = [],
  loadingStaff = false,
  onStatusChange,
  onResponsibleChange,
  onFeaturedChange,
  onImageClick,
  onActionMenu,
  formatPrice,
  formatDate,
  triggerRef,
}) => {
  const { t } = useTranslation();

  const resourceType = item.resourceType || "property";
  const category = item.category || item.propertyType || "";
  const commercialMode = item.commercialMode || item.operationType || "";
  const details = getResourceDetails(item, t);

  return (
    <tr
      id={`resource-${item.$id}`}
      className={`border-t border-slate-200 align-top dark:border-slate-700 ${
        isFocused ? "bg-cyan-50/70 dark:bg-cyan-900/20" : ""
      }`}
    >
      {/* Image */}
      <td className="px-4 py-3">
        {thumbnailUrl ? (
          <button
            type="button"
            onClick={() => onImageClick(item, 0)}
            className="group relative h-16 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition hover:border-cyan-500 dark:border-slate-700 dark:bg-slate-800"
          >
            <LazyImage
              src={thumbnailUrl}
              alt={item.title}
              className="h-full w-full object-cover transition group-hover:scale-105"
              eager
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

      {/* Title + Slug */}
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

      {/* Location */}
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
        <p>
          {item.city}
          {item.state ? `, ${item.state}` : ""}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {item.country || "-"}
        </p>
      </td>

      {/* Resource Type + Category */}
      <td className="px-4 py-3">
        <ResourceTypeBadge
          resourceType={resourceType}
          label={getResourceTypeLabel(resourceType, t)}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {getCategoryLabel(category, t)}
        </p>
      </td>

      {/* Commercial Mode */}
      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
        {getCommercialModeLabel(commercialMode, t)}
      </td>

      {/* Adaptive Details */}
      <td className="px-4 py-3">
        <ResourceDetailsCell details={details} />
      </td>

      {/* Responsible */}
      <td className="px-4 py-3">
        <ResourceResponsibleCell
          ownerUserId={item.ownerUserId}
          staffUsers={staffUsers}
          loading={loadingStaff}
          disabled={isBusy}
          onChange={(newOwner) => onResponsibleChange?.(item.$id, newOwner)}
          onAvatarClick={(url) => onImageClick?.({ avatarUrl: url }, 0)}
        />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Select
            value={item.status || "draft"}
            onChange={(value) => onStatusChange(item, value)}
            disabled={isBusy}
            options={statusOptions}
            size="sm"
            className="min-w-36"
            aria-label={t("myResourcesPage.table.status")}
          />
          {isBusy ? (
            <Loader2 size={14} className="animate-spin text-slate-400" />
          ) : null}
        </div>
      </td>

      {/* Featured */}
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onFeaturedChange?.(item.$id, !item.featured)}
          disabled={isBusy}
          className={`rounded p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 ${
            item.featured
              ? "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
              : "text-slate-300 hover:text-slate-400 dark:text-slate-600 dark:hover:text-slate-500"
          } ${isBusy ? "cursor-not-allowed opacity-50" : ""}`}
          aria-label={t("myResourcesPage.table.featured")}
        >
          <Star
            size={20}
            className={item.featured ? "fill-current" : ""}
          />
        </button>
      </td>

      {/* Metrics */}
      <td className="px-4 py-3">
        <div className="grid gap-1 text-xs text-slate-600 dark:text-slate-300">
          <span>
            {t("myResourcesPage.table.views")}:{" "}
            <strong>{Number(item.views || 0)}</strong>
          </span>
          <span>
            {t("myResourcesPage.table.leads")}:{" "}
            <strong>{Number(item.contactCount || 0)}</strong>
          </span>
          <span>
            {t("myResourcesPage.table.reservations")}:{" "}
            <strong>{Number(item.reservationCount || 0)}</strong>
          </span>
        </div>
      </td>

      {/* Price */}
      <td className="px-4 py-3">
        <ResourcePriceCell item={item} formattedPrice={formatPrice(item)} />
      </td>

      {/* Updated At */}
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
        {formatDate(item.$updatedAt || item.$createdAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <button
          ref={triggerRef}
          type="button"
          onClick={(event) => onActionMenu(event, item.$id)}
          disabled={isBusy}
          aria-label={t("myResourcesPage.actions.openMenu")}
          aria-haspopup="menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <EllipsisVertical size={16} />
        </button>
      </td>
    </tr>
  );
};

export default ResourceTableRow;
