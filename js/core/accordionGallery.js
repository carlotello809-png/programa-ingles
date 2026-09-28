// Vanilla port of a React/GSAP "accordion gallery" component: a row of panels
// that expand on hover/focus, revealing a label. No React, no GSAP — flex-grow
// and opacity are plain CSS transitions (see css/accordionGallery.css).
(function () {
  "use strict";

  function panelHtml(item, i) {
    return `
      <button
        type="button"
        class="ag-panel"
        data-ag-index="${i}"
        style="${item.gradient ? `background:${item.gradient};` : ""}"
        aria-label="${item.title}"
      >
        <span class="ag-panel__frame">
          <span class="ag-panel__media">${item.icon || ""}</span>
          ${item.image ? `<img class="ag-panel__image" src="${item.image}" alt="" draggable="false" />` : ""}
          <span class="ag-panel__overlay" aria-hidden="true"></span>
        </span>
        <span class="ag-panel__label">
          <span class="ag-panel__bar"></span>
          <span class="ag-panel__text">
            <strong>${item.title}</strong>
            ${item.subtitle ? `<span>${item.subtitle}</span>` : ""}
          </span>
        </span>
      </button>
    `;
  }

  // Mounts an accordion gallery into `container`. `items` is
  // [{ title, subtitle, icon (svg string), image (url), gradient (css value) }, ...].
  // The icon shows by default; hovering/activating a panel crossfades to its full
  // illustration `image`, if one is given. `opts.trigger` is "hover" (default) or
  // "click"; `opts.onSelect(item, index)` fires on click/Enter regardless of mode.
  function mount(container, items, opts) {
    opts = opts || {};
    const trigger = opts.trigger || "hover";
    let active = Math.min(Math.max(opts.defaultIndex || 0, 0), items.length - 1);

    container.classList.add("accordion-gallery");
    container.innerHTML = items.map(panelHtml).join("");

    const panels = Array.from(container.querySelectorAll(".ag-panel"));

    function render() {
      panels.forEach((p, i) => p.classList.toggle("ag-panel--active", i === active));
    }
    render();

    panels.forEach((panel, i) => {
      if (trigger === "hover") {
        panel.addEventListener("mouseenter", () => {
          if (active !== i && App.sound) App.sound.playHover();
          active = i;
          render();
        });
      }
      panel.addEventListener("focus", () => {
        active = i;
        render();
      });
      panel.addEventListener("click", () => {
        if (opts.onSelect) opts.onSelect(items[i], i);
      });
    });

    return {
      setActive(i) {
        active = i;
        render();
      },
    };
  }

  App.accordionGallery = { mount };
})();
