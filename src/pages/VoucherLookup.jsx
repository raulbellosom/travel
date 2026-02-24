import SkeletonLoader from "../components/common/molecules/SkeletonLoader";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { databases, Query } from "../api/appwriteClient";
import env from "../env";
import { getErrorMessage } from "../utils/errors";
import { usePageSeo } from "../hooks/usePageSeo";
import { formatMoneyWithDenomination } from "../utils/money";

const VoucherLookup = () => {
  const { t, i18n } = useTranslation();
  const { code } = useParams();
  const [voucher, setVoucher] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const locale = i18n.language === "en" ? "en-US" : "es-MX";
  usePageSeo({
    title: "Inmobo | Voucher",
    description: "Consulta de voucher de reserva.",
    robots: "noindex, nofollow",
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    const load = async () => {
      try {
        const voucherResponse = await databases.listDocuments({
          databaseId: env.appwrite.databaseId,
          collectionId: env.appwrite.collections.reservationVouchers,
          queries: [
            Query.equal("voucherCode", String(code || "").trim().toUpperCase()),
            Query.equal("enabled", true),
            Query.limit(1),
          ],
        });

        const nextVoucher = voucherResponse.documents?.[0] || null;
        if (!nextVoucher) {
          throw new Error(t("voucherPage.errors.notFound"));
        }

        const nextReservation = await databases.getDocument({
          databaseId: env.appwrite.databaseId,
          collectionId: env.appwrite.collections.reservations,
          documentId: nextVoucher.reservationId,
        });

        let nextProperty = null;
        if (nextReservation?.propertyId) {
          nextProperty = await databases.getDocument({
            databaseId: env.appwrite.databaseId,
            collectionId: env.appwrite.collections.properties,
            documentId: nextReservation.propertyId,
          }).catch(() => null);
        }

        if (!mounted) return;
        setVoucher(nextVoucher);
        setReservation(nextReservation);
        setProperty(nextProperty);
      } catch (err) {
        if (!mounted) return;
        setError(getErrorMessage(err, t("voucherPage.errors.load")));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [code, t]);

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <SkeletonLoader variant="detail" count={4} />
      </section>
    );
  }

  if (error || !voucher || !reservation) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error || t("voucherPage.errors.notFound")}
        </p>
        <Link to="/" className="text-sm font-semibold text-cyan-700 hover:underline dark:text-cyan-300">
          {t("voucherPage.actions.backHome")}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t("voucherPage.title")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("voucherPage.subtitle")}
        </p>
      </header>

      <article className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <p className="text-sm text-emerald-700 dark:text-emerald-200">{t("voucherPage.labels.code")}</p>
        <p className="text-3xl font-bold tracking-widest text-emerald-800 dark:text-emerald-100">
          {voucher.voucherCode}
        </p>
      </article>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm">
          <strong>{t("voucherPage.labels.property")}:</strong> {property?.title || reservation.propertyId}
        </p>
        <p className="text-sm">
          <strong>{t("voucherPage.labels.guest")}:</strong> {reservation.guestName}
        </p>
        <p className="text-sm">
          <strong>{t("voucherPage.labels.dates")}:</strong>{" "}
          {new Date(reservation.checkInDate).toLocaleDateString(locale)} -{" "}
          {new Date(reservation.checkOutDate).toLocaleDateString(locale)}
        </p>
        <p className="text-sm">
          <strong>{t("voucherPage.labels.total")}:</strong>{" "}
          {formatMoneyWithDenomination(Number(reservation.totalAmount || 0), {
            locale,
            currency: reservation.currency || "MXN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-sm">
          <strong>{t("voucherPage.labels.status")}:</strong>{" "}
          {t(`reservationStatus.${reservation.status}`, {
            defaultValue: reservation.status,
          })}
        </p>
      </div>
    </section>
  );
};

export default VoucherLookup;
