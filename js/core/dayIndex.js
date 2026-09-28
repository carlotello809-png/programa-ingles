// Date utilities. All "today" logic is local-time based (no UTC surprises for the user).
(function () {
  "use strict";

  const EPOCH = new Date(2026, 0, 1); // fixed reference point for deterministic content rotation
  const MS_PER_DAY = 86400000;

  function atMidnight(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function todayDate() {
    return atMidnight(new Date());
  }

  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function todayKey() {
    return dateKey(todayDate());
  }

  function dayIndexFor(date) {
    const diff = atMidnight(date).getTime() - EPOCH.getTime();
    return Math.floor(diff / MS_PER_DAY);
  }

  function todayDayIndex() {
    return dayIndexFor(todayDate());
  }

  function formatLongDate(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function isYesterday(dateKeyStr, referenceDate) {
    const yesterday = addDays(atMidnight(referenceDate), -1);
    return dateKeyStr === dateKey(yesterday);
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  App.dayIndex = {
    todayDate,
    todayKey,
    dateKey,
    dayIndexFor,
    todayDayIndex,
    formatLongDate,
    addDays,
    isYesterday,
    parseDateKey,
  };
})();
