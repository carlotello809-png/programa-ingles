(function () {
  "use strict";

  const { getToday, setActivityItemId, markActivityComplete, getSettings } = App.state;
  const { todayKey } = App.dayIndex;
  const { wordsFromStart, pickRandomWordStart } = App.content;
  const ICONS = App.icons;
  const tts = App.tts;
  const { playClick, playCorrect, playIncorrect, playWordChime, playNavigate } = App.sound;
  const { emitActivityCompleted } = App.events;
  const { flashComplete } = App.animate;

  let session = null;

  function resolveWords(activity) {
    if (activity.itemId) return wordsFromStart(App.data.vocabularyBank, Number(activity.itemId), 10);
    const start = pickRandomWordStart(App.data.vocabularyBank.length);
    setActivityItemId("vocabulary", String(start));
    return wordsFromStart(App.data.vocabularyBank, start, 10);
  }

  function reshuffleWords() {
    const start = pickRandomWordStart(App.data.vocabularyBank.length);
    setActivityItemId("vocabulary", String(start));
    return wordsFromStart(App.data.vocabularyBank, start, 10);
  }

  function freshSession(dateKey) {
    return { dateKey, phase: "learn", quizQuestions: null, answers: {}, retaking: false };
  }

  function ensureSession() {
    const key = todayKey();
    if (!session || session.dateKey !== key) session = freshSession(key);
    return session;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildQuizQuestions(words) {
    return words.map((word) => {
      const pool = App.data.vocabularyBank.filter((w) => w.word !== word.word);
      const distractors = shuffle(pool)
        .slice(0, 3)
        .map((w) => w.word);
      const options = shuffle([word.word, ...distractors]);
      return {
        prompt: `Which word means: "${word.definitionEn}"`,
        options,
        answerIndex: options.indexOf(word.word),
      };
    });
  }

  function wordCard(word, index) {
    return `
      <div class="word-card">
        <div class="word-index">${index + 1}/10</div>
        <div class="word-head">
          <div>
            <div class="word-title">${word.word}</div>
            <div class="word-ipa">${word.ipa}</div>
          </div>
          <button class="btn-icon" data-listen-word="${word.word}" aria-label="Listen to pronunciation">${ICONS.volume}</button>
        </div>
        <div>
          <div class="word-block-label">Definition</div>
          <div class="word-block-text">${word.definitionEn}</div>
        </div>
        <div>
          <div class="word-block-label">Spanish</div>
          <div class="word-block-text">${word.definitionEs}</div>
        </div>
        <div>
          <div class="word-block-label">Example</div>
          <div class="word-example">${word.example}</div>
        </div>
      </div>
    `;
  }

  function selectAnswer(qi, oi) {
    if (session.answers[qi] !== undefined) return;
    const correct = oi === session.quizQuestions[qi].answerIndex;
    session.answers[qi] = oi;
    correct ? playCorrect() : playIncorrect();
    render();
  }

  function computeScore() {
    let correct = 0;
    session.quizQuestions.forEach((q, i) => {
      if (session.answers[i] === q.answerIndex) correct += 1;
    });
    return { correct, total: session.quizQuestions.length };
  }

  function completeActivity(words) {
    const quizScore = computeScore();
    const result = markActivityComplete("vocabulary", quizScore, { wordsReviewed: words.map((w) => w.word) });
    session.retaking = false;
    emitActivityCompleted(result);
    flashComplete(document.getElementById("vocabularyBody"));
    render();
  }

  function retakeActivity() {
    playClick();
    session.phase = "learn";
    session.quizQuestions = null;
    session.answers = {};
    session.retaking = true;
    render();
  }

  function quizBlock() {
    return session.quizQuestions
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

  function attachListenHandlers(container) {
    container.querySelectorAll("[data-listen-word]").forEach((btn) => {
      btn.addEventListener("click", () => {
        playWordChime();
        const settings = getSettings();
        tts.speakWord(btn.getAttribute("data-listen-word"), { voiceURI: settings.ttsVoiceURI });
      });
    });
  }

  function render() {
    ensureSession();
    const container = document.getElementById("vocabularyBody");
    if (!container) return;

    const record = getToday();
    const activity = record.activities.vocabulary;
    const words = resolveWords(activity);

    if (activity.completed && !session.retaking) {
      container.innerHTML = `
        <div class="card card-pad score-panel">
          <div class="score-value">${activity.score.correct}/${activity.score.total}</div>
          <div class="score-label">Vocabulary completed for today</div>
          <button class="btn btn-secondary btn-sm" id="vocabRetakeBtn" style="margin-top:16px;">${ICONS.shuffle}<span style="margin-left:6px;">Retake test</span></button>
        </div>
        <div class="word-grid" style="margin-top:20px;">
          ${words.map((w, i) => wordCard(w, i)).join("")}
        </div>
      `;
      attachListenHandlers(container);
      const retakeBtn = document.getElementById("vocabRetakeBtn");
      if (retakeBtn) retakeBtn.addEventListener("click", retakeActivity);
      return;
    }

    if (session.phase === "learn") {
      container.innerHTML = `
        <div class="quiz-toolbar">
          <span class="reading-hint" style="margin:0;">Review all 10 words, then test yourself.</span>
          <button class="btn btn-ghost btn-sm shuffle-btn" id="vocabShuffleBtn" title="Try a different word set">${ICONS.shuffle}<span>New words</span></button>
        </div>
        <div class="word-grid">${words.map((w, i) => wordCard(w, i)).join("")}</div>
        <div class="complete-row">
          <span class="score-label">Review all 10 words, then test yourself.</span>
          <button class="btn btn-primary" id="vocabStartQuizBtn">Start Quiz</button>
        </div>
      `;
      attachListenHandlers(container);
      const shuffleBtn = document.getElementById("vocabShuffleBtn");
      if (shuffleBtn) {
        shuffleBtn.addEventListener("click", () => {
          playNavigate();
          reshuffleWords();
          render();
        });
      }
      const startBtn = document.getElementById("vocabStartQuizBtn");
      if (startBtn) {
        startBtn.addEventListener("click", () => {
          playClick();
          session.phase = "quiz";
          session.quizQuestions = buildQuizQuestions(words);
          render();
        });
      }
      return;
    }

    const allAnswered = session.quizQuestions.every((_, i) => session.answers[i] !== undefined);
    container.innerHTML = `
      <div class="card card-pad">
        <div class="section-heading"><h2 style="font-size:16px;">Quick Retention Quiz</h2></div>
        ${quizBlock()}
        <div class="complete-row">
          <span class="score-label">${allAnswered ? "All questions answered" : `${Object.keys(session.answers).length}/${session.quizQuestions.length} answered`}</span>
          <button class="btn btn-primary" id="vocabCompleteBtn" ${allAnswered ? "" : "disabled"}>Complete Vocabulary</button>
        </div>
      </div>
    `;

    container.querySelectorAll("[data-q]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectAnswer(Number(btn.getAttribute("data-q")), Number(btn.getAttribute("data-opt")));
      });
    });

    const completeBtn = document.getElementById("vocabCompleteBtn");
    if (completeBtn) completeBtn.addEventListener("click", () => { playClick(); completeActivity(words); });
  }

  App.views.vocabulary = { render };
})();
