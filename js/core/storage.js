// Thin localStorage wrapper. This is the only file that touches window.localStorage
// directly — everything else goes through core/state.js, which is the seam a future
// backend swap would replace.
(function () {
  "use strict";

  function loadJSON(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[storage] failed to read "${key}"`, err);
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[storage] failed to write "${key}"`, err);
      return false;
    }
  }

  function removeKey(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[storage] failed to remove "${key}"`, err);
    }
  }

  App.storage = { loadJSON, saveJSON, removeKey };
})();
