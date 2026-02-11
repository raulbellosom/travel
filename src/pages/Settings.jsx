import { useTranslation } from "react-i18next";

const Settings = () => {
  const { t } = useTranslation();

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {t("settingsPage.title")}
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t("settingsPage.subtitle")}
      </p>
    </section>
  );
};

export default Settings;

