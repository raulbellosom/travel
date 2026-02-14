import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Inbox } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { propertiesService } from "../services/propertiesService";
import { leadsService } from "../services/leadsService";
import { getErrorMessage } from "../utils/errors";
import { INTERNAL_ROUTES } from "../utils/internalRoutes";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import { hasScope } from "../utils/roles";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const canReadProperties = hasScope(user, "properties.read");
  const canReadLeads = hasScope(user, "leads.read");
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.$id) return;
    let mounted = true;
    setLoading(true);
    setError("");

    const propertiesPromise = canReadProperties
      ? propertiesService.listMine(user.$id)
      : Promise.resolve({ documents: [] });
    const leadsPromise = canReadLeads
      ? leadsService.listMine(user.$id)
      : Promise.resolve({ documents: [] });

    Promise.all([propertiesPromise, leadsPromise])
      .then(([propertiesResponse, leadsResponse]) => {
        if (!mounted) return;
        setProperties(propertiesResponse.documents || []);
        setLeads(leadsResponse.documents || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(getErrorMessage(err, i18n.t("dashboardPage.errors.load")));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [canReadLeads, canReadProperties, user?.$id]);

  const stats = useMemo(() => {
    const published = properties.filter(
      (item) => item.status === "published",
    ).length;
    const drafts = properties.filter((item) => item.status === "draft").length;
    const views = properties.reduce(
      (acc, item) => acc + Number(item.views || 0),
      0,
    );
    const newLeads = leads.filter((item) => item.status === "new").length;
    return {
      totalProperties: properties.length,
      published,
      drafts,
      views,
      leads: leads.length,
      newLeads,
    };
  }, [leads, properties]);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("dashboardPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("dashboardPage.subtitle")}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("dashboardPage.loading")}
        </p>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("dashboardPage.stats.properties")}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.totalProperties}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("dashboardPage.stats.published")}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.published}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("dashboardPage.stats.drafts")}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.drafts}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("dashboardPage.stats.leads")}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.leads}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("dashboardPage.stats.newLeads")}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.newLeads}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("dashboardPage.stats.views")}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.views}
              </p>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t("dashboardPage.recentProperties.title")}
                </h2>
                <Link
                  to={INTERNAL_ROUTES.myProperties}
                  className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
                >
                  {t("dashboardPage.recentProperties.viewAll")}
                </Link>
              </div>
              {properties.length > 0 ? (
                <ul className="space-y-2">
                  {properties.slice(0, 5).map((item) => (
                    <li
                      key={item.$id}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                    >
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">
                        {item.city}, {item.state} -{" "}
                        {t(`propertyStatus.${item.status}`, {
                          defaultValue: item.status,
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyStatePanel
                  icon={Building2}
                  title={t("dashboardPage.recentProperties.empty")}
                  compact
                  className="border-dashed"
                />
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t("dashboardPage.recentLeads.title")}
                </h2>
                <Link
                  to={INTERNAL_ROUTES.leads}
                  className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
                >
                  {t("dashboardPage.recentLeads.viewAll")}
                </Link>
              </div>
              {leads.length > 0 ? (
                <ul className="space-y-2">
                  {leads.slice(0, 5).map((lead) => (
                    <li
                      key={lead.$id}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                    >
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {lead.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">
                        {lead.email} -{" "}
                        {t(`leadStatus.${lead.status}`, {
                          defaultValue: lead.status,
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyStatePanel
                  icon={Inbox}
                  title={t("dashboardPage.recentLeads.empty")}
                  compact
                  className="border-dashed"
                />
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
};

export default Dashboard;
