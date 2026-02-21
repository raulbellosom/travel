import { useTranslation } from "react-i18next";
import { getPricingModelLabel } from "../../../utils/resourceLabels";

/**
 * ResourcePriceCell
 *
 * Displays formatted price + pricing model label.
 * e.g. "$1,500 / por noche"
 *
 * @param {Object} item - Resource document
 * @param {string} formattedPrice - Already-formatted price string (e.g. "$1,500")
 */
const ResourcePriceCell = ({ item, formattedPrice }) => {
  const { t } = useTranslation();

  const pricingModel = item.pricingModel || item.pricePerUnit || "total";
  const modelLabel = getPricingModelLabel(pricingModel, t);

  // Don't show model suffix for "total" / "fixed_total" — it's implicit
  const showModel =
    pricingModel && pricingModel !== "total" && pricingModel !== "fixed_total";

  return (
    <div className="text-slate-600 dark:text-slate-300">
      <span className="font-medium">{formattedPrice}</span>
      {showModel ? (
        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
          {modelLabel}
        </span>
      ) : null}
    </div>
  );
};

export default ResourcePriceCell;
