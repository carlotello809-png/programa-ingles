// A calm, on-theme background: small square "pixel" stars that twinkle and
// drift slowly, brightening a little near the mouse. Plain Canvas 2D — no
// WebGL, no dependencies — sized to fill its container and reactive to
// prefers-reduced-motion / tab visibility for battery/CPU friendliness.
(function () {
  "use strict";

  const STAR_COLORS = ["#f1f1ff", "#b026ff", "#00f0ff", "#ff2fd0", "#39ff88"];

  function mount(container, opts) {
    opts = opts || {};
    if (!container) return null;

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const density = opts.density || 0.00012; // stars per square css-pixel
    const mouseRadius = opts.mouseRadius || 160;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssWidth = 1;
    let cssHeight = 1;
    let stars = [];

    function makeStars() {
      const count = Math.round(cssWidth * cssHeight * density);
      stars = new Array(count).fill(0).map(() => ({
        x: Math.random() * cssWidth,
        y: Math.random() * cssHeight,
        size: Math.random() < 0.15 ? 3 : 2,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.4 + Math.random() * 0.8,
        driftSpeed: 2 + Math.random() * 5, // css px per second, downward
      }));
    }

    function resize() {
      const rect = container.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let mouseX = -9999;
    let mouseY = -9999;
    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }
    window.addEventListener("pointermove", onPointerMove);

    function drawFrame(tSec) {
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (!reducedMotion) {
          s.y += (s.driftSpeed / 60) * (opts.speed || 1);
          if (s.y > cssHeight + 4) {
            s.y = -4;
            s.x = Math.random() * cssWidth;
          }
        }
        const twinkle = reducedMotion ? 0.7 : 0.45 + 0.55 * Math.abs(Math.sin(tSec * s.twinkleSpeed + s.phase));
        const dx = s.x - mouseX;
        const dy = s.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseBoost = dist < mouseRadius ? (1 - dist / mouseRadius) * 0.6 : 0;
        const alpha = Math.min(1, twinkle + mouseBoost);
        const size = s.size + mouseBoost * 2;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.shadowBlur = 6 + mouseBoost * 10;
        ctx.shadowColor = s.color;
        ctx.fillRect(Math.round(s.x - size / 2), Math.round(s.y - size / 2), size, size);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    if (reducedMotion) {
      drawFrame(0);
      return {
        destroy() {
          ro.disconnect();
          window.removeEventListener("pointermove", onPointerMove);
          if (canvas.parentElement === container) container.removeChild(canvas);
        },
      };
    }

    let rafId = null;
    function frame(t) {
      rafId = window.requestAnimationFrame(frame);
      if (document.hidden) return;
      drawFrame(t * 0.001);
    }
    rafId = window.requestAnimationFrame(frame);

    return {
      destroy() {
        if (rafId) window.cancelAnimationFrame(rafId);
        ro.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        if (canvas.parentElement === container) container.removeChild(canvas);
      },
    };
  }

  App.starfield = { mount };
})();
