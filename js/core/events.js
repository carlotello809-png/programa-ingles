// Tiny pub/sub over window events so practice-module views can announce completion
// without depending on app.js directly (which wires up the views) — keeps load
// order flexible and avoids tangled references between files.
(function () {
  "use strict";

  function emitActivityCompleted(result) {
    window.dispatchEvent(new CustomEvent("activity-completed", { detail: result }));
  }

  function onActivityCompleted(handler) {
    window.addEventListener("activity-completed", (e) => handler(e.detail));
  }

  function emitNavigate(viewId) {
    window.dispatchEvent(new CustomEvent("navigate", { detail: viewId }));
  }

  function onNavigate(handler) {
    window.addEventListener("navigate", (e) => handler(e.detail));
  }

  App.events = { emitActivityCompleted, onActivityCompleted, emitNavigate, onNavigate };
})();
