// Types an element's text back in letter-by-letter, with a soft tick sound per
// character — used on the page heading whenever a new tab/view opens.
(function () {
  "use strict";

  function run(el, opts) {
    if (!el) return;
    opts = opts || {};
    const speed = opts.speed || 65;

    // cache the original text once so repeated runs (switching back to a view)
    // always retype the same string instead of an already-truncated one
    if (!el.hasAttribute("data-typewriter-text")) {
      el.setAttribute("data-typewriter-text", el.textContent);
    }
    const text = el.getAttribute("data-typewriter-text");

    if (el._twTimer) window.clearTimeout(el._twTimer);
    el.textContent = "";
    el.classList.add("typewriter-active");

    let i = 0;
    function step() {
      i++;
      el.textContent = text.slice(0, i);
      const lastChar = text[i - 1];
      if (lastChar && lastChar !== " " && App.sound) App.sound.playType();
      if (i < text.length) {
        el._twTimer = window.setTimeout(step, speed);
      } else {
        el.classList.remove("typewriter-active");
        el._twTimer = null;
      }
    }
    step();
  }

  App.typewriter = { run };
})();
