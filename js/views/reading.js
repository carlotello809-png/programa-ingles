(function () {
  "use strict";

  const { getToday, setActivityItemId, markActivityComplete } = App.state;
  const { todayKey } = App.dayIndex;
  const { pickRandom } = App.content;
  const { playClick, playCorrect, playIncorrect, playNavigate } = App.sound;
  const { emitActivityCompleted } = App.events;
  const { flashComplete } = App.animate;

  let session = null;

  function resolveItem(activity) {
    const found = activity.itemId && App.data.readingBank.find((it) => it.id === activity.itemId);
    if (found) return found;
    const item = pickRandom(App.data.readingBank);
    setActivityItemId("reading", item.id);
    return item;
  }

  function reshuffleItem(currentId) {
    const item = pickRandom(App.data.readingBank, currentId);
    setActivityItemId("reading", item.id);
    return item;
  }

  function freshSession(dateKey) {
    return { dateKey, answers: {}, retaking: false };
  }

  function ensureSession() {
    const key = todayKey();
    if (!session || session.dateKey !== key) session = freshSession(key);
    return session;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function wrapGlossary(text, glossary) {
    let result = text;
    Object.keys(glossary).forEach((key) => {
      const regex = new RegExp(`\\b(${escapeRegex(key)})\\b`, "gi");
      result = result.replace(regex, (match) => `<span class="gloss-word" data-word="${key}">${match}</span>`);
    });
    return result;
  }

  function selectAnswer(item, qi, oi) {
    if (session.answers[qi] !== undefined) return;
    const correct = oi === item.questions[qi].answerIndex;
    session.answers[qi] = oi;
    correct ? playCorrect() : playIncorrect();
    render();
  }

  function computeScore(item) {
    let correct = 0;
    item.questions.forEach((q, i) => {
      if (session.answers[i] === q.answerIndex) correct += 1;
    });
    return { correct, total: item.questions.length };
  }

  function completeActivity(item) {
    const score = computeScore(item);
    const result = markActivityComplete("reading", score);
    session.retaking = false;
    emitActivityCompleted(result);
    flashComplete(document.getElementById("readingBody"));
    render();
  }

  function retakeActivity() {
    playClick();
    session.answers = {};
    session.retaking = true;
    render();
  }

  function questionsBlock(item) {
    return item.questions
      .map((q, qi) => {
        const answered = session.answers[qi];
        const options = q.options
          .map((opt, oi) => {
            let cls = "option-item";
            if (answered !== undefined) {
              if (oi === q.answerIndex) cls += " correct";
              else if (oi === answered) cls += " incorrect";
            }
            return `<button class="${cls}" data-q="${qi}" data-opt="${oi}" ${answered !== undefined ? "disabled" : ""}>
              <span class="opt-letter">${String.fromCharCode(65 + oi)}</span>${opt}
            </button>`;
          })
          .join("");
        return `
          <div class="exercise-block">
            <div class="exercise-number">Question ${qi + 1}</div>
            <div class="exercise-prompt">${q.prompt}</div>
            <div class="option-list">${options}</div>
          </div>
        `;
      })
      .join("");
  }

  function attachGlossaryHandlers(container, item) {
    container.querySelectorAll(".gloss-word").forEach((span) => {
      span.addEventListener("click", (e) => {
        e.stopPropagation();
        const existing = span.querySelector(".gloss-popover");
        document.querySelectorAll(".gloss-popover").forEach((p) => p.remove());
        if (existing) return;
        const key = span.getAttribute("data-word");
        const entry = item.glossary[key];
        if (!entry) return;
        const pop = document.createElement("div");
        pop.className = "gloss-popover";
        pop.innerHTML = `<strong>${key}</strong>${entry.definition}<div class="gloss-es">${entry.spanish}</div>`;
        span.appendChild(pop);
      });
    });
    document.addEventListener(
      "click",
      () => document.querySelectorAll(".gloss-popover").forEach((p) => p.remove()),
      { once: true }
    );
  }

  function render() {
    ensureSession();
    const container = document.getElementById("readingBody");
    if (!container) return;

    const record = getToday();
    const activity = record.activities.reading;
    const item = resolveItem(activity);

    const passageHtml = item.paragraphs.map((p) => `<p>${wrapGlossary(p, item.glossary)}</p>`).join("");

    if (activity.completed && !session.retaking) {
      container.innerHTML = `
        <div class="card card-pad score-panel">
          <div class="score-value">${activity.score.correct}/${activity.score.total}</div>
          <div class="score-label">Reading completed for today — ${item.title}</div>
          <button class="btn btn-secondary btn-sm" id="readingRetakeBtn" style="margin-top:16px;">${App.icons.shuffle}<span style="margin-left:6px;">Retake test</span></button>
        </div>
        <div class="card card-pad" style="margin-top:16px;">
          <h3 style="margin-bottom:8px;font-family:var(--font-display);font-size:16px;">${item.title}</h3>
          <p class="reading-hint">Click any highlighted word for its definition.</p>
          <div class="passage-box">${passageHtml}</div>
        </div>
      `;
      attachGlossaryHandlers(container, item);
      const retakeBtn = document.getElementById("readingRetakeBtn");
      if (retakeBtn) retakeBtn.addEventListener("click", retakeActivity);
      return;
    }

    const allAnswered = item.questions.every((_, i) => session.answers[i] !== undefined);
    const anyAnswered = Object.keys(session.answers).length > 0;

    container.innerHTML = `
      <div class="card card-pad">
        <div class="quiz-toolbar">
          <h3 style="font-family:var(--font-display);font-size:16px;">${item.title}</h3>
          <button class="btn btn-ghost btn-sm shuffle-btn" id="readingShuffleBtn" ${anyAnswered ? "disabled" : ""} title="Try a different passage">${App.icons.shuffle}<span>New passage</span></button>
        </div>
        <p class="reading-hint">Click any highlighted word for its definition.</p>
        <div class="passage-box">${passageHtml}</div>
      </div>
      <div class="card card-pad" style="margin-top:20px;">
        <div class="section-heading"><h2 style="font-size:16px;">Comprehension Questions</h2></div>
        ${questionsBlock(item)}
        <div class="complete-row">
          <span class="score-label">${allAnswered ? "All questions answered" : `${Object.keys(session.answers).length}/${item.questions.length} answered`}</span>
          <button class="btn btn-primary" id="readingCompleteBtn" ${allAnswered ? "" : "disabled"}>Complete Reading</button>
        </div>
      </div>
    `;

    attachGlossaryHandlers(container, item);

    const shuffleBtn = document.getElementById("readingShuffleBtn");
    if (shuffleBtn) {
      shuffleBtn.addEventListener("click", () => {
        if (anyAnswered) return;
        playNavigate();
        reshuffleItem(item.id);
        session.answers = {};
        render();
      });
    }

    container.querySelectorAll("[data-q]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectAnswer(item, Number(btn.getAttribute("data-q")), Number(btn.getAttribute("data-opt")));
      });
    });

    const completeBtn = document.getElementById("readingCompleteBtn");
    if (completeBtn) completeBtn.addEventListener("click", () => { playClick(); completeActivity(item); });
  }

  App.views.reading = { render };
})();
