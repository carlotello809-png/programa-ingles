(function () {
  "use strict";

  const { getStreak, getHistory, computeAreaAverages, computeOverallStats, AREAS } = App.state;
  const { todayDate, dateKey } = App.dayIndex;
  const AREA_META = App.areaMeta;
  const { playClick } = App.sound;

  function statTile(value, label) {
    return `<div class="stat-tile"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
  }

  function areaRow(area, pct) {
    return `
      <div class="area-progress-row">
        <div class="area-progress-label">${AREA_META[area].label}</div>
        <div class="progress-track" style="flex:1;">
          <div class="progress-fill" style="width:${pct}%;"></div>
        </div>
        <div class="area-progress-pct">${pct}%</div>
      </div>
    `;
  }

  function buildCalendar(history) {
    const today = todayDate();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstDay.getDay();
    const todayKeyStr = dateKey(today);
    const monthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      .map((d) => `<div class="cal-weekday">${d}</div>`)
      .join("");

    let cells = "";
    for (let i = 0; i < leadingBlanks; i++) {
      cells += `<div class="cal-cell-blank"></div>`;
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const key = dateKey(new Date(year, month, day));
      const entry = history[key];
      let cls = "cal-cell";
      if (entry) {
        const hasAny = Object.values(entry.areas || {}).some((v) => v !== null && v !== undefined);
        if (entry.allCompleted) cls += " complete";
        else if (hasAny) cls += " studied";
      }
      if (key === todayKeyStr) cls += " today";
      cells += `<button type="button" class="${cls}" data-cal-day="${key}" aria-label="${key}"><span class="cal-cell-num">${day}</span></button>`;
    }

    return `
      <div class="calendar-wrap">
        <div class="calendar-header">${monthLabel}</div>
        <div class="calendar-grid calendar-grid--weekdays">${weekdayHeaders}</div>
        <div class="calendar-grid">${cells}</div>
        <div class="calendar-legend">
          <span class="legend-swatch"><span class="cal-swatch"></span>No activity</span>
          <span class="legend-swatch"><span class="cal-swatch studied"></span>Partial</span>
          <span class="legend-swatch"><span class="cal-swatch complete"></span>All complete</span>
        </div>
      </div>
    `;
  }

  function dayLabel(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function dayPopoverHtml(key, entry) {
    const rows = AREAS.map((a) => {
      const v = entry && entry.areas ? entry.areas[a] : null;
      const done = v !== null && v !== undefined;
      return `
        <div class="cal-popover-row">
          <span>${AREA_META[a].label}</span>
          <span class="${done ? "cal-popover-done" : "cal-popover-pending"}">${done ? `${v}%` : "—"}</span>
        </div>
      `;
    }).join("");
    return `<strong>${dayLabel(key)}</strong>${rows}`;
  }

  function attachCalendarHandlers(container, history) {
    container.querySelectorAll("[data-cal-day]").forEach((cell) => {
      cell.addEventListener("click", (e) => {
        e.stopPropagation();
        playClick();
        const existing = cell.querySelector(".cal-popover");
        document.querySelectorAll(".cal-popover").forEach((p) => p.remove());
        if (existing) return;
        const key = cell.getAttribute("data-cal-day");
        const pop = document.createElement("div");
        pop.className = "cal-popover";
        pop.innerHTML = dayPopoverHtml(key, history[key]);
        cell.appendChild(pop);
      });
    });
    document.addEventListener(
      "click",
      () => document.querySelectorAll(".cal-popover").forEach((p) => p.remove()),
      { once: true }
    );
  }

  function render() {
    const container = document.getElementById("progressBody");
    if (!container) return;

    const streak = getStreak();
    const stats = computeOverallStats();
    const areaAverages = computeAreaAverages();
    const history = getHistory();

    container.innerHTML = `
      <div class="stat-grid">
        ${statTile(stats.daysStudied, "Days Studied")}
        ${statTile(`${stats.averageScore}%`, "Average Score")}
        ${statTile(streak.current, "Current Streak")}
        ${statTile(streak.best, "Best Streak")}
      </div>

      <div class="card card-pad" style="margin-bottom:24px;">
        <div class="section-heading"><h2 style="font-size:16px;">Progress by Area</h2></div>
        ${AREAS.map((a) => areaRow(a, areaAverages[a])).join("")}
      </div>

      <div class="card card-pad">
        <div class="section-heading"><h2 style="font-size:16px;">Study Calendar</h2></div>
        ${buildCalendar(history)}
      </div>
    `;

    attachCalendarHandlers(container, history);
  }

  App.views.progress = { render };
})();
