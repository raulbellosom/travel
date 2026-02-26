import { useTranslation } from "react-i18next";
import { Search, Users, Filter, Star } from "lucide-react";
import { Select } from "../../../components/common";
import { getResourceTypeLabel } from "../../../utils/resourceLabels";

const RESOURCE_TYPES = [
  "property",
  "service",
  "music",
  "vehicle",
  "experience",
  "venue",
];

/**
 * ResourceListFilters
 *
 * Redesigned filter bar with search input, resource type dropdown,
 * responsible (agent) filter, and "show all" toggle.
 *
 * @param {string} searchText - Current search text
 * @param {Function} onSearchChange - Callback when search text changes
 * @param {string} resourceTypeFilter - Currently selected resource type ("all" or a type)
 * @param {Function} onResourceTypeChange - Callback when resource type filter changes
 * @param {string} responsibleFilter - Currently selected responsible user ID ("all" or $id)
 * @param {Function} onResponsibleChange - Callback when responsible filter changes
 * @param {Array} staffUsers - Array of staff user objects for the combobox
 * @param {boolean} loadingStaff - Whether staff users are loading
 * @param {string} featuredFilter - Currently selected featured filter ("all" | "featured" | "notFeatured")
 * @param {Function} onFeaturedChange - Callback when featured filter changes
 * @param {boolean} showAll - Whether "show all" checkbox is checked
 * @param {Function} onShowAllChange - Callback when "show all" changes
 * @param {boolean} canViewAll - Whether current user has permission to toggle showAll
 */
const ResourceListFilters = ({
  searchText,
  onSearchChange,
  resourceTypeFilter,
  onResourceTypeChange,
  responsibleFilter = "all",
  onResponsibleChange,
  staffUsers = [],
  loadingStaff = false,
  featuredFilter = "all",
  onFeaturedChange,
  showAll = true,
  onShowAllChange,
  canViewAll = false,
}) => {
  const { t } = useTranslation();

  // Select options for responsible filter
  const responsibleOptions = [
    { value: "all", label: t("myResourcesPage.filters.allResponsibles") },
    ...staffUsers.map((u) => ({
      value: u.$id,
      label: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
    })),
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-6">
        {/* Search input */}
        <div className="min-w-0 flex-1 lg:max-w-md">
          <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Search size={14} />
            {t("myResourcesPage.filters.search")}
          </span>
          <input
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("myResourcesPage.filters.searchPlaceholder")}
            className="w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Resource type */}
        <div className="w-full sm:w-48">
          <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Filter size={14} />
            {t("myResourcesPage.filters.resourceType")}
          </span>
          <Select
            value={resourceTypeFilter}
            onChange={(val) => onResourceTypeChange(val)}
            options={[
              { value: "all", label: t("myResourcesPage.filters.allTypes") },
              ...RESOURCE_TYPES.map((type) => ({
                value: type,
                label: getResourceTypeLabel(type, t),
              })),
            ]}
            size="md"
            variant="outlined"
          />
        </div>

        {/* Responsible filter */}
        <div className="w-full sm:w-56">
          <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Users size={14} />
            {t("myResourcesPage.filters.responsible")}
          </span>
          <Select
            options={responsibleOptions}
            value={responsibleFilter}
            onChange={(val) => onResponsibleChange?.(val || "all")}
            disabled={loadingStaff}
            size="md"
            variant="outlined"
          />
        </div>

        {/* Featured filter */}
        <div className="w-full sm:w-44">
          <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Star size={14} />
            {t("myResourcesPage.filters.featured")}
          </span>
          <Select
            value={featuredFilter}
            onChange={(val) => onFeaturedChange?.(val)}
            options={[
              { value: "all", label: t("myResourcesPage.filters.featuredAll") },
              { value: "featured", label: t("myResourcesPage.filters.featuredOnly") },
              { value: "notFeatured", label: t("myResourcesPage.filters.featuredNone") },
            ]}
            size="md"
            variant="outlined"
          />
        </div>

        {/* Show all toggle */}
        {canViewAll ? (
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-2.5 self-end pb-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => onShowAllChange?.(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 transition focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
            />
            <span>{t("myResourcesPage.filters.showAll")}</span>
          </label>
        ) : null}
      </div>
    </div>
  );
};

export default ResourceListFilters;
