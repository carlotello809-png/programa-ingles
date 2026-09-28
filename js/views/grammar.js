(function () {
  "use strict";

  const { getToday, setActivityItemId, markActivityComplete } = App.state;
  const { todayKey } = App.dayIndex;
  const { pickRandom } = App.content;
  const { playClick, playCorrect, playIncorrect, playNavigate } = App.sound;
  const { emitActivityCompleted } = App.events;
  const { flashComplete, shake } = App.animate;

  let session = null;

  // A random quiz is assigned per day and stays stable across reloads (persisted
  // as itemId on the day record); the shuffle button lets the learner request a
  // fresh one on demand instead of waiting for the next day.
  function resolveQuiz(activity) {
    const found = activity.itemId && App.data.grammarBank.find((q) => q.id === activity.itemId);
    if (found) return found;
    const quiz = pickRandom(App.data.grammarBank);
    setActivityItemId("grammar", quiz.id);
    return quiz;
  }

  function reshuffleQuiz(currentId) {
    const quiz = pickRandom(App.data.grammarBank, currentId);
    setActivityItemId("grammar", quiz.id);
    return quiz;
  }

  const TYPE_LABELS = {
    mcq: "Multiple Choice",
    "fill-blank": "Fill in the Blank",
    correction: "Sentence Correction",
    "complete-sentence": "Complete the Sentence",
  };

  function freshSession(dateKey) {
    return { dateKey, answers: {}, retaking: false };
  }

  function ensureSession() {
    const key = todayKey();
    if (!session || session.dateKey !== key) session = freshSession(key);
    return session;
  }

  function normalize(str) {
    return str
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:'"]/g, "")
      .replace(/\s+/g, " ");
  }

  function isTextCorrect(q, value) {
    const accepted = q.acceptedAnswers || [q.answer];
    return accepted.some((a) => normalize(a) === normalize(value));
  }

  function selectMcq(quiz, qi, oi) {
    if (session.answers[qi] !== undefined) return;
    const q = quiz.questions[qi];
    const correct = oi === q.answerIndex;
    session.answers[qi] = { value: oi, correct };
    correct ? playCorrect() : playIncorrect();
    render();
  }

  function submitText(quiz, qi, value) {
    if (session.answers[qi] !== undefined) return;
    if (!value.trim()) return;
    const q = quiz.questions[qi];
    const correct = isTextCorrect(q, value);
    session.answers[qi] = { value, correct };
    if (correct) {
      playCorrect();
    } else {
      playIncorrect();
      const el = document.querySelector(`[data-text-input="${qi}"]`);
      if (el) shake(el.closest(".exercise-block"));
    }
    render();
  }

  function computeScore(quiz) {
    let correct = 0;
    quiz.questions.forEach((_, i) => {
      if (session.answers[i] && session.answers[i].correct) correct += 1;
    });
    return { correct, total: quiz.questions.length };
  }

  function completeActivity(quiz) {
    const score = computeScore(quiz);
    const result = markActivityComplete("grammar", score);
    session.retaking = false;
    emitActivityCompleted(result);
    flashComplete(document.getElementById("grammarBody"));
    render();
  }

  function retakeActivity() {
    playClick();
    session.answers = {};
    session.retaking = true;
    render();
  }

  function renderQuestion(quiz, q, qi) {
    const answer = session.answers[qi];

    if (q.type === "mcq") {
      const options = q.options
        .map((opt, oi) => {
          let cls = "option-item";
          if (answer) {
            if (oi === q.answerIndex) cls += " correct";
            else if (oi === answer.value) cls += " incorrect";
          }
          return `<button class="${cls}" data-mcq-q="${qi}" data-mcq-opt="${oi}" ${answer ? "disabled" : ""}>
            <span class="opt-letter">${String.fromCharCode(65 + oi)}</span>${opt}
          </button>`;
        })
        .join("");
      return `
        <div class="exercise-block">
          <div class="exercise-number">Question ${qi + 1} · ${TYPE_LABELS[q.type]}</div>
          <div class="exercise-prompt">${q.prompt}</div>
          <div class="option-list">${options}</div>
          ${answer ? `<div class="explain-box">${q.explanation}</div>` : ""}
        </div>
      `;
    }

    return `
      <div class="exercise-block">
        <div class="exercise-number">Question ${qi + 1} · ${TYPE_LABELS[q.type]}</div>
        <div class="exercise-prompt">${q.prompt}</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input
            type="text"
            class="blank-input${answer ? (answer.correct ? " correct" : " incorrect") : ""}"
            data-text-input="${qi}"
            placeholder="Type your answer"
            value="${answer ? String(answer.value).replace(/"/g, "&quot;") : ""}"
            ${answer ? "disabled" : ""}
            style="min-width:220px;"
          />
          ${!answer ? `<button class="btn btn-secondary btn-sm" data-text-submit="${qi}">Check</button>` : ""}
        </div>
        ${answer ? `<div class="explain-box"><strong>${answer.correct ? "Correct." : `Correct answer: "${q.answer}".`}</strong> ${q.explanation}</div>` : ""}
      </div>
    `;
  }

  function render() {
    ensureSession();
    const container = document.getElementById("grammarBody");
    if (!container) return;

    const record = getToday();
    const activity = record.activities.grammar;
    const quiz = resolveQuiz(activity);

    if (activity.completed && !session.retaking) {
      container.innerHTML = `
        <div class="card card-pad score-panel">
          <div class="score-value">${activity.score.correct}/${activity.score.total}</div>
          <div class="score-label">Grammar completed for today — ${quiz.title}</div>
          <button class="btn btn-secondary btn-sm" id="grammarRetakeBtn" style="margin-top:16px;">${App.icons.shuffle}<span style="margin-left:6px;">Retake test</span></button>
        </div>
      `;
      const retakeBtn = document.getElementById("grammarRetakeBtn");
      if (retakeBtn) retakeBtn.addEventListener("click", retakeActivity);
      return;
    }

    const allAnswered = quiz.questions.every((_, i) => session.answers[i] !== undefined);
    const anyAnswered = Object.keys(session.answers).length > 0;

    container.innerHTML = `
      <div class="card card-pad">
        <div class="quiz-toolbar">
          <h3 style="font-family:var(--font-display);font-size:16px;">${quiz.title}</h3>
          <button class="btn btn-ghost btn-sm shuffle-btn" id="grammarShuffleBtn" ${anyAnswered ? "disabled" : ""} title="Try a different quiz">${App.icons.shuffle}<span>New set</span></button>
        </div>
        <p class="reading-hint">A short quiz mixing different exercise types.</p>
        ${quiz.questions.map((q, qi) => renderQuestion(quiz, q, qi)).join("")}
        <div class="complete-row">
          <span class="score-label">${allAnswered ? "All questions answered" : `${Object.keys(session.answers).length}/${quiz.questions.length} answered`}</span>
          <button class="btn btn-primary" id="grammarCompleteBtn" ${allAnswered ? "" : "disabled"}>Complete Grammar</button>
        </div>
      </div>
    `;

    const shuffleBtn = document.getElementById("grammarShuffleBtn");
    if (shuffleBtn) {
      shuffleBtn.addEventListener("click", () => {
        if (anyAnswered) return;
        playNavigate();
        reshuffleQuiz(quiz.id);
        session.answers = {};
        render();
      });
    }

    container.querySelectorAll("[data-mcq-q]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectMcq(quiz, Number(btn.getAttribute("data-mcq-q")), Number(btn.getAttribute("data-mcq-opt")));
      });
    });

    container.querySelectorAll("[data-text-submit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const qi = Number(btn.getAttribute("data-text-submit"));
        const input = container.querySelector(`[data-text-input="${qi}"]`);
        submitText(quiz, qi, input.value);
      });
    });

    container.querySelectorAll("[data-text-input]").forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const qi = Number(input.getAttribute("data-text-input"));
          submitText(quiz, qi, input.value);
        }
      });
    });

    const completeBtn = document.getElementById("grammarCompleteBtn");
    if (completeBtn) completeBtn.addEventListener("click", () => { playClick(); completeActivity(quiz); });
  }

  App.views.grammar = { render };
})();
