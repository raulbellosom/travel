import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CalendarRange } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AdminCalendar } from "../features/calendar";
import { propertiesService } from "../services/propertiesService";
import { usePageSeo } from "../hooks/usePageSeo";

/**
 * AppCalendar – Admin calendar page at /app/calendar.
 * Shows all reservations in calendar view with multi-view support
 * and property filtering.
 */
const AppCalendar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);

  usePageSeo({
    title: t("calendarPage.title"),
    noIndex: true,
  });

  // Load properties list for filter dropdown
  const loadProperties = useCallback(async () => {
    if (!user?.$id) return;
    try {
      const res = await propertiesService.listMine(user.$id);
      setProperties(res.documents || []);
    } catch {
      // Silent fail – filter will just be empty
    }
  }, [user?.$id]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <CalendarRange className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("calendarPage.title")}
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-9">
          {t("calendarPage.subtitle")}
        </p>
      </div>

      {/* Calendar */}
      <AdminCalendar properties={properties} />
    </div>
  );
};

export default AppCalendar;
