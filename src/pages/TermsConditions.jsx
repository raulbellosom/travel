import { useTranslation } from "react-i18next";

const TermsConditions = () => {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          {t("termsPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("termsPage.updated")}
        </p>
      </header>

      <article className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {t("termsPage.intro")}
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("termsPage.sections.access.title")}
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {t("termsPage.sections.access.body")}
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("termsPage.sections.reservations.title")}
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {t("termsPage.sections.reservations.body")}
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("termsPage.sections.liability.title")}
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {t("termsPage.sections.liability.body")}
        </p>
      </article>
    </section>
  );
};

export default TermsConditions;
