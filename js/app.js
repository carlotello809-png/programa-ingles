(function () {
  "use strict";

  const { initNav, setActiveNav, updateChrome } = App.chrome;
  const { onNavigate, onActivityCompleted } = App.events;
  const { getSettings, setSoundOn } = App.state;
  const { playSectionComplete, playAllComplete, playClick, playToggleOn, playToggleOff } = App.sound;
  const { showCelebrationOverlay, hideCelebrationOverlay } = App.animate;
  const VIEWS = App.views;

  let currentView = "dashboard";

  function switchView(id) {
    if (!VIEWS[id]) return;
    currentView = id;
    document.querySelectorAll(".view").forEach((el) => {
      el.classList.toggle("active", el.id === `view-${id}`);
    });
    setActiveNav(id);
    VIEWS[id].render();
    window.scrollTo(0, 0);

    const section = document.getElementById(`view-${id}`);
    const heading = section && section.querySelector("h1, h2");
    if (heading && App.typewriter) App.typewriter.run(heading);
  }

  function init() {
    getSettings(); // hydrates the sound engine's enabled flag from persisted settings
    initNav(switchView);
    updateChrome();
    switchView("dashboard");

    const yearEl = document.getElementById("footerYearMain");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    onNavigate((viewId) => switchView(viewId));

    onActivityCompleted((result) => {
      playSectionComplete();
      updateChrome();
      if (currentView === "dashboard") VIEWS.dashboard.render();

      if (result.justCompletedAll) {
        window.setTimeout(() => {
          playAllComplete();
          showCelebrationOverlay({
            emoji: "\u{1F389}",
            title: "Great job!",
            sub: "You completed today's English practice!",
          });
        }, 450);
      }
    });

    document.getElementById("celebrationCloseBtn").addEventListener("click", () => {
      playClick();
      hideCelebrationOverlay();
    });

    document.getElementById("celebrationOverlay").addEventListener("click", (e) => {
      if (e.target.id === "celebrationOverlay") hideCelebrationOverlay();
    });

    document.getElementById("soundToggle").addEventListener("click", () => {
      const current = getSettings();
      if (!current.soundOn) {
        setSoundOn(true);
        playToggleOn();
      } else {
        playToggleOff();
        setSoundOn(false);
      }
      updateChrome();
    });
  }

  if (App.starfield) {
    App.starfield.mount(document.getElementById("bgField"), {
      density: 0.00012,
      speed: 1,
      mouseRadius: 160,
    });
  }
  if (App.splash) App.splash.init();
  init();
})();
