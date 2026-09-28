// Owns the app "chrome": the side/mobile nav and the streak pill / sound icon that
// must stay in sync regardless of which view is active. Kept separate from app.js
// so leaf modules (e.g. settings.js) can update the chrome without depending on
// app.js (which wires up the views).
(function () {
  "use strict";

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "listening", label: "Listening", icon: "listening" },
    { id: "grammar", label: "Grammar", icon: "grammar" },
    { id: "reading", label: "Reading", icon: "reading" },
    { id: "vocabulary", label: "Vocabulary", icon: "vocabulary" },
    { id: "progress", label: "Progress", icon: "progress" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  let navigateCallback = null;

  function navItemHtml(item) {
    return `<button class="nav-item" data-nav-id="${item.id}">${App.icons[item.icon]}<span>${item.label}</span></button>`;
  }

  function attachNavHandlers(listEl) {
    listEl.querySelectorAll("[data-nav-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        App.sound.playNavigate();
        if (navigateCallback) navigateCallback(btn.getAttribute("data-nav-id"));
      });
      btn.addEventListener("mouseenter", () => App.sound.playHover());
    });
  }

  function initNav(callback) {
    navigateCallback = callback;
    const navTabs = document.getElementById("navTabs");
    if (!navTabs) return;
    navTabs.innerHTML = NAV_ITEMS.map(navItemHtml).join("");
    attachNavHandlers(navTabs);
  }

  function setActiveNav(activeId) {
    document.querySelectorAll("[data-nav-id]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-nav-id") === activeId);
    });
  }

  function updateChrome() {
    const streak = App.state.getStreak();
    const settings = App.state.getSettings();

    const streakPill = document.getElementById("streakPill");
    if (streakPill) {
      streakPill.innerHTML = `${App.icons.flame}<span>${
        streak.current > 0 ? `<strong>${streak.current}</strong> Day Streak` : "Start your streak today"
      }</span>`;
      streakPill.classList.toggle("is-lit", streak.current > 0);
    }

    const soundBtn = document.getElementById("soundToggle");
    if (soundBtn) {
      soundBtn.innerHTML = settings.soundOn ? App.icons.soundOn : App.icons.soundOff;
    }
  }

  App.chrome = { NAV_ITEMS, initNav, setActiveNav, updateChrome };
})();
