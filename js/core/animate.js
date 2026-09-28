// Small, reusable DOM animation triggers shared across views.
(function () {
  "use strict";

  function pulseClass(el, className, duration) {
    duration = duration || 700;
    if (!el) return;
    el.classList.remove(className);
    // force reflow so the animation restarts if the class was already present
    void el.offsetWidth;
    el.classList.add(className);
    window.setTimeout(() => el.classList.remove(className), duration);
  }

  function shake(el) {
    pulseClass(el, "shake", 420);
  }

  function flashComplete(el) {
    pulseClass(el, "flash-complete", 700);
  }

  const CONFETTI_COLORS = ["#b026ff", "#00f0ff", "#39ff88", "#ff2fd0", "#ffe600", "#ff8a00"];

  function launchConfetti(count) {
    count = count || 36;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      piece.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
      piece.style.animationDelay = `${Math.random() * 0.4}s`;
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      frag.appendChild(piece);
      window.setTimeout(() => piece.remove(), 3500);
    }
    document.body.appendChild(frag);
  }

  function showCelebrationOverlay(opts) {
    opts = opts || {};
    const overlay = document.getElementById("celebrationOverlay");
    if (!overlay) return;
    overlay.querySelector(".celebration-emoji").textContent = opts.emoji || "\u{1F389}";
    overlay.querySelector(".celebration-title").textContent = opts.title || "Great job!";
    overlay.querySelector(".celebration-sub").textContent = opts.sub || "";
    overlay.classList.add("show");
    launchConfetti();
  }

  function hideCelebrationOverlay() {
    const overlay = document.getElementById("celebrationOverlay");
    if (overlay) overlay.classList.remove("show");
  }

  App.animate = {
    pulseClass,
    shake,
    flashComplete,
    launchConfetti,
    showCelebrationOverlay,
    hideCelebrationOverlay,
  };
})();
