// Data-access layer. Every read/write to persisted app data goes through this
// module (which itself calls storage.js) — view code never touches localStorage
// directly. This is the seam a future backend/API would replace.
(function () {
  "use strict";

  const { loadJSON, saveJSON } = App.storage;
  const { todayKey, todayDayIndex, dateKey, addDays, parseDateKey } = App.dayIndex;
  const { setSoundEnabled } = App.sound;

  const SETTINGS_KEY = "engprac_settings_v1";
  const STREAK_KEY = "engprac_streak_v1";
  const HISTORY_KEY = "engprac_history_v1";
  const dayKey = (key) => `engprac_day_v1_${key}`;

  const AREAS = ["listening", "grammar", "reading", "vocabulary"];

  const DEFAULT_SETTINGS = { soundOn: true, ttsRate: 1, ttsVoiceURI: null };

  function blankActivity() {
    return { completed: false, score: null, completedAt: null, itemId: null };
  }

  // --- Settings -------------------------------------------------------------

  function getSettings() {
    const settings = { ...DEFAULT_SETTINGS, ...loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS) };
    setSoundEnabled(settings.soundOn);
    return settings;
  }

  function setSoundOn(value) {
    const settings = getSettings();
    settings.soundOn = value;
    saveJSON(SETTINGS_KEY, settings);
    setSoundEnabled(value);
    return settings;
  }

  function setTtsRate(rate) {
    const settings = getSettings();
    settings.ttsRate = rate;
    saveJSON(SETTINGS_KEY, settings);
    return settings;
  }

  function setTtsVoice(voiceURI) {
    const settings = getSettings();
    settings.ttsVoiceURI = voiceURI;
    saveJSON(SETTINGS_KEY, settings);
    return settings;
  }

  // --- Day records ------------------------------------------------------------

  function getDayRecord(key) {
    const record = loadJSON(dayKey(key), null);
    if (record) return record;
    const fresh = {
      date: key,
      dayIndex: key === todayKey() ? todayDayIndex() : null,
      activities: {
        listening: blankActivity(),
        grammar: blankActivity(),
        reading: blankActivity(),
        vocabulary: { ...blankActivity(), wordsReviewed: [] },
      },
      allCompleted: false,
    };
    saveJSON(dayKey(key), fresh);
    return fresh;
  }

  function getToday() {
    return getDayRecord(todayKey());
  }

  function markActivityComplete(area, score, extra) {
    extra = extra || {};
    const key = todayKey();
    const record = getDayRecord(key);
    const wasAllCompleted = record.allCompleted;

    record.activities[area] = {
      ...record.activities[area],
      ...extra,
      completed: true,
      score,
      completedAt: new Date().toISOString(),
    };

    const allCompleted = AREAS.every((a) => record.activities[a].completed);
    record.allCompleted = allCompleted;
    saveJSON(dayKey(key), record);

    updateHistoryEntry(key, record);

    let streak = getStreak();
    if (allCompleted && !wasAllCompleted) {
      const yesterdayKey = dateKey(addDays(parseDateKey(key), -1));
      if (streak.lastCompletedDate === yesterdayKey) {
        streak.current += 1;
      } else if (streak.lastCompletedDate !== key) {
        streak.current = 1;
      }
      streak.best = Math.max(streak.best, streak.current);
      streak.lastCompletedDate = key;
      saveJSON(STREAK_KEY, streak);
    }

    return { record, streak, justCompletedAll: allCompleted && !wasAllCompleted };
  }

  // Persists which bank item was assigned to `area` for today, without marking
  // the activity complete — lets a random pick stay stable across re-renders
  // and page reloads within the same day (see core/content.js pickRandom).
  function setActivityItemId(area, itemId) {
    const key = todayKey();
    const record = getDayRecord(key);
    record.activities[area] = { ...record.activities[area], itemId };
    saveJSON(dayKey(key), record);
    return record;
  }

  function scorePct(score) {
    if (!score || !score.total) return null;
    return Math.round((score.correct / score.total) * 100);
  }

  function updateHistoryEntry(key, record) {
    const history = getHistory();
    const areas = {};
    AREAS.forEach((a) => {
      const act = record.activities[a];
      areas[a] = act.completed ? (act.score ? scorePct(act.score) : 100) : null;
    });
    const presentPcts = Object.values(areas).filter((v) => v !== null);
    const avgScorePct = presentPcts.length
      ? Math.round(presentPcts.reduce((sum, v) => sum + v, 0) / presentPcts.length)
      : null;

    history[key] = { allCompleted: record.allCompleted, avgScorePct, areas };
    saveJSON(HISTORY_KEY, history);
  }

  // --- Streak / history ---------------------------------------------------

  function getStreak() {
    return loadJSON(STREAK_KEY, { current: 0, best: 0, lastCompletedDate: null });
  }

  function getHistory() {
    return loadJSON(HISTORY_KEY, {});
  }

  function computeAreaAverages() {
    const history = getHistory();
    const sums = { listening: [], grammar: [], reading: [], vocabulary: [] };
    Object.values(history).forEach((entry) => {
      AREAS.forEach((a) => {
        const v = entry.areas && entry.areas[a];
        if (v !== null && v !== undefined) sums[a].push(v);
      });
    });
    const result = {};
    AREAS.forEach((a) => {
      result[a] = sums[a].length ? Math.round(sums[a].reduce((s, v) => s + v, 0) / sums[a].length) : 0;
    });
    return result;
  }

  function computeOverallStats() {
    const history = getHistory();
    const entries = Object.entries(history);
    const daysStudied = entries.filter(([, v]) => Object.values(v.areas).some((x) => x !== null)).length;
    const scored = entries.filter(([, v]) => v.avgScorePct !== null);
    const averageScore = scored.length
      ? Math.round(scored.reduce((s, [, v]) => s + v.avgScorePct, 0) / scored.length)
      : 0;
    const completedDays = entries.filter(([, v]) => v.allCompleted).length;
    return { daysStudied, averageScore, completedDays };
  }

  App.state = {
    AREAS,
    getSettings,
    setSoundOn,
    setTtsRate,
    setTtsVoice,
    getDayRecord,
    getToday,
    setActivityItemId,
    markActivityComplete,
    getStreak,
    getHistory,
    computeAreaAverages,
    computeOverallStats,
  };
})();
