import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../atoms/Button";
import PriceBadge from "../../molecules/PriceBadge";

const ListingCard = ({ listing, onCardClick, className = "", ...props }) => {
  const { t } = useTranslation();

  const handleCardClick = () => {
    onCardClick?.(listing);
  };

  return (
    <article
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
      {...props}
    >
      <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        {listing?.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title || t("listingCard.fallbackTitle")}
            className="h-full w-full object-cover"
          />
        ) : (
          t("listingCard.noImage")
        )}
      </div>
      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-slate-100">
          {listing?.title || t("listingCard.fallbackTitle")}
        </h3>
        <p className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
          <MapPin size={14} />
          {listing?.location || t("listingCard.locationUnavailable")}
        </p>
        <div className="flex items-center justify-between">
          <PriceBadge
            amount={listing?.price || 0}
            currency={listing?.currency || "MXN"}
            period="total"
            variant="highlighted"
          />
          <Button variant="primary" size="sm" onClick={handleCardClick}>
            {t("listingCard.viewDetail")}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ListingCard;

