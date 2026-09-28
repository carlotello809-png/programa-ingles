(function () {
  "use strict";

  const { getToday, AREAS } = App.state;
  const { todayDate, todayDayIndex, formatLongDate } = App.dayIndex;
  const { pickForDay } = App.content;
  const AREA_META = App.areaMeta;
  const ICONS = App.icons;
  const { emitNavigate } = App.events;
  const { playClick } = App.sound;

  const CIRCUMFERENCE = 2 * Math.PI * 50;

  const AREA_GRADIENT = {
    listening: "linear-gradient(160deg, color-mix(in srgb, var(--area-listening) 38%, var(--surface-solid)), var(--surface-solid))",
    grammar: "linear-gradient(160deg, color-mix(in srgb, var(--area-grammar) 38%, var(--surface-solid)), var(--surface-solid))",
    reading: "linear-gradient(160deg, color-mix(in srgb, var(--area-reading) 38%, var(--surface-solid)), var(--surface-solid))",
    vocabulary: "linear-gradient(160deg, color-mix(in srgb, var(--area-vocabulary) 38%, var(--surface-solid)), var(--surface-solid))",
  };

  const AREA_IMAGE = {
    listening: "assets/gallery-listening.jpg",
    grammar: "assets/gallery-grammar.jpg",
    reading: "assets/gallery-reading.jpg",
    vocabulary: "assets/gallery-vocabulary.jpg",
  };

  function galleryItem(area, activity) {
    const meta = AREA_META[area];
    const completed = activity.completed;
    return {
      title: meta.label,
      subtitle: completed ? `Completed — ${activity.score.correct}/${activity.score.total}` : "Tap to start",
      icon: ICONS[meta.icon],
      image: AREA_IMAGE[area],
      gradient: AREA_GRADIENT[area],
    };
  }

  function render() {
    const dateEl = document.getElementById("dashDate");
    const galleryEl = document.getElementById("dashGallery");
    const tipEl = document.getElementById("tipCard");
    const pctEl = document.getElementById("dashProgressPct");
    const fracEl = document.getElementById("dashProgressFrac");
    const noteEl = document.getElementById("dashProgressNote");
    const ringFill = document.getElementById("dashRingFill");

    dateEl.textContent = formatLongDate(todayDate());

    const record = getToday();
    const doneCount = AREAS.filter((a) => record.activities[a].completed).length;
    const pct = Math.round((doneCount / AREAS.length) * 100);

    const firstIncomplete = AREAS.findIndex((a) => !record.activities[a].completed);
    App.accordionGallery.mount(
      galleryEl,
      AREAS.map((area) => galleryItem(area, record.activities[area])),
      {
        defaultIndex: firstIncomplete === -1 ? 0 : firstIncomplete,
        trigger: "hover",
        onSelect: (_item, i) => {
          playClick();
          emitNavigate(AREAS[i]);
        },
      }
    );

    pctEl.textContent = `${pct}%`;
    fracEl.textContent = `${doneCount}/${AREAS.length}`;
    noteEl.textContent =
      doneCount === 0 ? "Let's get started" : doneCount === AREAS.length ? "All done for today!" : "Keep going";

    ringFill.setAttribute("stroke-dasharray", `${CIRCUMFERENCE}`);
    ringFill.setAttribute("stroke-dashoffset", `${CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE}`);

    const tip = pickForDay(App.data.tipsBank, todayDayIndex());
    tipEl.innerHTML = `
      <div class="tip-icon">${ICONS.lightbulb}</div>
      <div>
        <div class="tip-category">${tip.category}</div>
        <div class="tip-text">${tip.text}</div>
      </div>
    `;
  }

  App.views.dashboard = { render };
})();
