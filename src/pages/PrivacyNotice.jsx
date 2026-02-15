import { useTranslation } from "react-i18next";

const PrivacyNotice = () => {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          {t("client:privacy.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("client:privacy.updated")}
        </p>
      </header>

      <article className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {t("client:privacy.intro")}
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("client:privacy.sections.data.title")}
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {t("client:privacy.sections.data.body")}
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("client:privacy.sections.usage.title")}
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {t("client:privacy.sections.usage.body")}
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("client:privacy.sections.rights.title")}
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {t("client:privacy.sections.rights.body")}
        </p>
      </article>
    </section>
  );
};

export default PrivacyNotice;
