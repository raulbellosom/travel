import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../atoms/Button";
import PriceBadge from "../../molecules/PriceBadge";
import ProgressiveImage from "../../atoms/ProgressiveImage";

const ListingCard = ({ listing, onCardClick, className = "", ...props }) => {
  const { t } = useTranslation();

  const handleCardClick = () => {
    onCardClick?.(listing);
  };

  // Prefer fileId so ProgressiveImage can generate optimised preview URLs.
  // Fall back to a pre-built URL when only that is available.
  const fileId =
    listing?.galleryImageIds?.[0] || listing?.mainImageFileId || null;
  const fallbackSrc =
    listing?.images?.[0] ||
    listing?.thumbnailUrl ||
    listing?.mainImageUrl ||
    listing?.coverImageUrl ||
    "";

  return (
    <article
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
      {...props}
    >
      {/* aspect-ratio reserves layout space before any image byte arrives → no CLS */}
      <ProgressiveImage
        fileId={fileId}
        src={fallbackSrc}
        preset="card"
        aspectRatio="16/9"
        alt={listing?.title || t("listingCard.fallbackTitle")}
        propertyType={listing?.propertyType || listing?.type}
        className="w-full transition-transform duration-300 hover:scale-105"
      />
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
