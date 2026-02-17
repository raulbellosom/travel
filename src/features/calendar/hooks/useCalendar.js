import { useState, useMemo, useCallback } from "react";
import { navigateDate, getViewRange, stripTime } from "../utils/calendarUtils";

/**
 * useCalendar – manages calendar navigation state.
 *
 * @param {Object} opts
 * @param {'day'|'week'|'month'|'year'} opts.defaultView
 * @param {Date} opts.initialDate
 * @returns Calendar state + helpers
 */
export default function useCalendar({
  defaultView = "month",
  initialDate = new Date(),
} = {}) {
  const [view, setView] = useState(defaultView);
  const [currentDate, setCurrentDate] = useState(stripTime(initialDate));

  const range = useMemo(
    () => getViewRange(view, currentDate),
    [view, currentDate],
  );

  const goNext = useCallback(() => {
    setCurrentDate((d) => navigateDate(view, d, 1));
  }, [view]);

  const goPrev = useCallback(() => {
    setCurrentDate((d) => navigateDate(view, d, -1));
  }, [view]);

  const goToday = useCallback(() => {
    setCurrentDate(stripTime(new Date()));
  }, []);

  const goToDate = useCallback((d) => {
    setCurrentDate(stripTime(d));
  }, []);

  const changeView = useCallback((newView) => {
    setView(newView);
  }, []);

  return {
    view,
    currentDate,
    range,
    goNext,
    goPrev,
    goToday,
    goToDate,
    changeView,
  };
}
