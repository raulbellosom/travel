import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ErrorsDemo() {
  const { t } = useTranslation();

  const errorTypes = [
    {
      code: "404",
      name: t("errorsDemo.cards.404.name"),
      description: t("errorsDemo.cards.404.description"),
      path: "/error/404",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      code: "400",
      name: t("errorsDemo.cards.400.name"),
      description: t("errorsDemo.cards.400.description"),
      path: "/error/400",
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      code: "403",
      name: t("errorsDemo.cards.403.name"),
      description: t("errorsDemo.cards.403.description"),
      path: "/error/403",
      color: "bg-red-500 hover:bg-red-600",
    },
    {
      code: "500",
      name: t("errorsDemo.cards.500.name"),
      description: t("errorsDemo.cards.500.description"),
      path: "/error/500",
      color: "bg-red-600 hover:bg-red-700",
    },
    {
      code: "503",
      name: t("errorsDemo.cards.503.name"),
      description: t("errorsDemo.cards.503.description"),
      path: "/error/503",
      color: "bg-yellow-500 hover:bg-yellow-600",
    },
  ];

  const features = [
    {
      title: t("errorsDemo.features.uniqueAnimations.title"),
      description: t("errorsDemo.features.uniqueAnimations.description"),
    },
    {
      title: t("errorsDemo.features.multilanguage.title"),
      description: t("errorsDemo.features.multilanguage.description"),
    },
    {
      title: t("errorsDemo.features.theme.title"),
      description: t("errorsDemo.features.theme.description"),
    },
    {
      title: t("errorsDemo.features.responsive.title"),
      description: t("errorsDemo.features.responsive.description"),
    },
    {
      title: t("errorsDemo.features.tips.title"),
      description: t("errorsDemo.features.tips.description"),
    },
    {
      title: t("errorsDemo.features.quickActions.title"),
      description: t("errorsDemo.features.quickActions.description"),
    },
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t("errorsDemo.title")}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            {t("errorsDemo.subtitle")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {t("errorsDemo.instructions")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {errorTypes.map((error) => (
            <Link key={error.code} to={error.path} className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className={`${error.color} text-white p-6 text-center`}>
                  <div className="text-6xl font-bold mb-2">{error.code}</div>
                  <div className="text-xl font-semibold">{error.name}</div>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 text-center mb-4">
                    {error.description}
                  </p>
                  <div className="flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium group-hover:translate-x-2 transition-transform duration-200">
                    <span>{t("errorsDemo.viewDemo")}</span>
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {t("errorsDemo.featuresTitle")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-200 mb-2">
                {t("errorsDemo.docs.title")}
              </h3>
              <p className="text-primary-700 dark:text-primary-300 text-sm">
                {t("errorsDemo.docs.description")}
              </p>
            </div>
            <a
              href="https://github.com/yourusername/yourproject/blob/main/docs/ERROR_COMPONENTS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 whitespace-nowrap"
            >
              {t("errorsDemo.docs.action")}
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t("errorsDemo.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

