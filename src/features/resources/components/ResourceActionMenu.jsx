import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  getInternalEditPropertyRoute,
  getInternalPropertyDetailRoute,
} from "../../../utils/internalRoutes";

/**
 * ResourceActionMenu
 *
 * Portal-rendered context menu for resource row actions.
 *
 * @param {Object} item - The resource document being acted upon
 * @param {boolean} isBusy - Whether an action is in-progress
 * @param {Object} position - { top, left, width } for absolute positioning
 * @param {Function} onClose - Callback to close the menu
 * @param {Function} onStatusToggle - Toggle published/draft
 * @param {Function} onDelete - Open delete confirmation
 */
const ResourceActionMenu = forwardRef(
  ({ item, isBusy, position, onClose, onDelete }, ref) => {
    const { t } = useTranslation();

    if (!item || !position) return null;

    const menuItemBase =
      "inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition";
    const menuItemNormal = `${menuItemBase} text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800`;
    const menuItemDanger = `${menuItemBase} text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40`;
    const menuItemDisabled = "disabled:cursor-not-allowed disabled:opacity-60";

    return (
      <div
        ref={ref}
        role="menu"
        aria-label={t("myResourcesPage.actions.menuLabel")}
        className="fixed z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
        }}
      >
        <div className="p-1.5">
          <Link
            role="menuitem"
            to={getInternalPropertyDetailRoute(item.$id)}
            onClick={onClose}
            className={menuItemNormal}
          >
            <Eye size={15} />
            {t("myResourcesPage.actions.view")}
          </Link>

          <Link
            role="menuitem"
            to={getInternalEditPropertyRoute(item.$id)}
            onClick={onClose}
            className={menuItemNormal}
          >
            <Pencil size={15} />
            {t("myResourcesPage.actions.edit")}
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => onDelete(item)}
            disabled={isBusy}
            className={`${menuItemDanger} ${menuItemDisabled}`}
          >
            <Trash2 size={15} />
            {t("myResourcesPage.actions.delete")}
          </button>
        </div>
      </div>
    );
  },
);

ResourceActionMenu.displayName = "ResourceActionMenu";
export default ResourceActionMenu;
