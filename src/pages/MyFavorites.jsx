import SkeletonLoader from "../components/common/molecules/SkeletonLoader";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { favoritesService } from "../services/favoritesService";
import { propertiesService } from "../services/propertiesService";
import PropertyCard from "../components/common/molecules/PropertyCard";
import { getErrorMessage } from "../utils/errors";

const chunk = (items = [], size = 50) => {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

const MyFavorites = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resources, setResources] = useState([]);

  const loadFavorites = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");

    try {
      const favoriteDocs = await favoritesService.listByUser(user.$id, {
        limit: 200,
      });
      const favoriteResourceIds = favoriteDocs
        .map((doc) => String(doc.resourceId || "").trim())
        .filter(Boolean);

      if (favoriteResourceIds.length === 0) {
        setResources([]);
        return;
      }

      const groups = chunk(favoriteResourceIds, 100);
      const docs = await Promise.all(
        groups.map((group) => propertiesService.listPublicByIds(group)),
      );
      const resolvedDocs = docs.flat();
      const byId = new Map(resolvedDocs.map((doc) => [doc.$id, doc]));

      setResources(
        favoriteResourceIds.map((id) => byId.get(id)).filter(Boolean),
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          t("client:profile.errors.favoritesLoad", {
            defaultValue: "No se pudieron cargar tus favoritos.",
          }),
        ),
      );
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [t, user?.$id]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isEmpty = useMemo(
    () => !loading && !error && resources.length === 0,
    [error, loading, resources.length],
  );

  const handleFavoriteRemoved = useCallback((resourceId) => {
    setResources((prev) => prev.filter((r) => r.$id !== resourceId));
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-24 pb-6 sm:px-6 sm:pt-28 lg:px-8">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          <Heart className="h-6 w-6 text-rose-500" />
          {t("client:profile.sections.favorites", {
            defaultValue: "Mis favoritos",
          })}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("client:profile.sections.favoritesSubtitle", {
            defaultValue: "Aquí verás los recursos que guardaste.",
          })}
        </p>
      </header>

      {loading && <SkeletonLoader variant="cards" count={3} />}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("client:profile.sections.favoritesEmpty", {
            defaultValue: "Aún no tienes favoritos guardados.",
          })}
        </div>
      )}

      {!loading && resources.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((res) => (
            <PropertyCard
              key={res.$id}
              property={res}
              isFavorite={true}
              onFavoriteToggle={handleFavoriteRemoved}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MyFavorites;
