// The "Ready for learning?" welcome screen shown once per page load. Purely
// decorative/ritual — dismisses on click, key press, or after a short auto-timeout —
// then fades+scales out and unmounts itself.
(function () {
  "use strict";

  const AUTO_DISMISS_MS = 2600;

  function dismiss(el) {
    if (!el || el.classList.contains("splash-out")) return;
    el.classList.add("splash-out");
    window.setTimeout(() => el.remove(), 700);
  }

  function init() {
    const el = document.getElementById("splashScreen");
    if (!el) return;

    if (App.sound && App.sound.playSplashChime) App.sound.playSplashChime();

    const finish = () => dismiss(el);
    el.addEventListener("click", finish, { once: true });
    document.addEventListener(
      "keydown",
      function onKey() {
        finish();
        document.removeEventListener("keydown", onKey);
      },
      { once: true }
    );
    window.setTimeout(finish, AUTO_DISMISS_MS);
  }

  App.splash = { init };
})();
