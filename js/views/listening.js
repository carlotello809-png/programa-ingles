(function () {
  "use strict";

  const { getToday, setActivityItemId, markActivityComplete, getSettings } = App.state;
  const { todayKey } = App.dayIndex;
  const { pickRandom } = App.content;
  const ICONS = App.icons;
  const tts = App.tts;
  const { playClick, playCorrect, playIncorrect, playNavigate } = App.sound;
  const { emitActivityCompleted } = App.events;
  const { flashComplete } = App.animate;

  let session = null;

  function resolveItem(activity) {
    const found = activity.itemId && App.data.listeningBank.find((it) => it.id === activity.itemId);
    if (found) return found;
    const item = pickRandom(App.data.listeningBank);
    setActivityItemId("listening", item.id);
    return item;
  }

  function reshuffleItem(currentId) {
    const item = pickRandom(App.data.listeningBank, currentId);
    setActivityItemId("listening", item.id);
    return item;
  }

  function freshSession(dateKey) {
    return {
      dateKey,
      hasListened: false,
      isPlaying: false,
      showTranscript: false,
      answers: {},
      volume: 1,
      elapsedMs: 0,
      durationMs: 0,
      startedAt: 0,
      timer: null,
      retaking: false,
    };
  }

  function ensureSession() {
    const key = todayKey();
    if (!session || session.dateKey !== key) {
      session = freshSession(key);
    }
    return session;
  }

  function estimateDuration(text, rate) {
    const words = text.trim().split(/\s+/).length;
    const wordsPerMinute = 155 * rate;
    return Math.max(3000, (words / wordsPerMinute) * 60000);
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function stopTimer() {
    if (session.timer) {
      clearInterval(session.timer);
      session.timer = null;
    }
  }

  function updatePlayerDOM() {
    const fill = document.getElementById("listenProgressFill");
    const current = document.getElementById("listenTimeCurrent");
    const total = document.getElementById("listenTimeTotal");
    if (!fill) return;
    const pct = session.durationMs ? Math.min(100, (session.elapsedMs / session.durationMs) * 100) : 0;
    fill.style.width = `${pct}%`;
    if (current) current.textContent = formatTime(session.elapsedMs);
    if (total) total.textContent = formatTime(session.durationMs);
  }

  function tick() {
    session.elapsedMs = Date.now() - session.startedAt;
    if (session.elapsedMs >= session.durationMs) {
      session.elapsedMs = session.durationMs;
      updatePlayerDOM();
      return;
    }
    updatePlayerDOM();
  }

  function togglePlay(item) {
    const settings = getSettings();

    if (session.isPlaying) {
      tts.pause();
      session.isPlaying = false;
      session.elapsedMs = Date.now() - session.startedAt;
      stopTimer();
      render();
      return;
    }

    if (session.elapsedMs > 0 && session.elapsedMs < session.durationMs && !session.hasListened) {
      tts.resume();
      session.startedAt = Date.now() - session.elapsedMs;
    } else {
      session.durationMs = estimateDuration(item.transcript, settings.ttsRate);
      session.elapsedMs = 0;
      session.startedAt = Date.now();
      tts.speak(item.transcript, {
        rate: settings.ttsRate,
        volume: session.volume,
        voiceURI: settings.ttsVoiceURI,
        onEnd: () => {
          session.isPlaying = false;
          session.hasListened = true;
          session.elapsedMs = session.durationMs;
          stopTimer();
          render();
        },
      });
    }

    session.isPlaying = true;
    stopTimer();
    session.timer = setInterval(tick, 200);
    render();
  }

  function selectAnswer(item, qIndex, optIndex) {
    if (session.answers[qIndex] !== undefined) return;
    session.answers[qIndex] = optIndex;
    const isCorrect = optIndex === item.questions[qIndex].answerIndex;
    isCorrect ? playCorrect() : playIncorrect();
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
    const result = markActivityComplete("listening", score);
    session.retaking = false;
    emitActivityCompleted(result);
    flashComplete(document.getElementById("listeningBody"));
    render();
  }

  function retakeActivity() {
    playClick();
    tts.stop();
    stopTimer();
    session.answers = {};
    session.hasListened = false;
    session.isPlaying = false;
    session.showTranscript = false;
    session.elapsedMs = 0;
    session.durationMs = 0;
    session.retaking = true;
    render();
  }

  function playerCard(item) {
    const pct = session.durationMs ? Math.min(100, (session.elapsedMs / session.durationMs) * 100) : 0;
    return `
      <div class="player">
        <div class="player-controls">
          <button class="play-btn" id="listenPlayBtn" aria-label="Play or pause">
            ${session.isPlaying ? ICONS.pause : ICONS.play}
          </button>
          <div class="player-progress">
            <div class="progress-track">
              <div class="progress-fill" id="listenProgressFill" style="width:${pct}%"></div>
            </div>
            <div class="player-time">
              <span id="listenTimeCurrent">${formatTime(session.elapsedMs)}</span>
              <span id="listenTimeTotal">${formatTime(session.durationMs)}</span>
            </div>
          </div>
          <div class="volume-row">
            ${ICONS.volume}
            <input type="range" id="listenVolume" min="0" max="1" step="0.05" value="${session.volume}" />
          </div>
        </div>
        <div>
          <button class="btn btn-ghost btn-sm" id="listenTranscriptToggle">
            ${session.showTranscript ? "Hide transcript" : "Show transcript"}
          </button>
        </div>
        ${session.showTranscript ? `<p class="passage-box">${item.transcript}</p>` : ""}
      </div>
    `;
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

  function render() {
    ensureSession();
    const container = document.getElementById("listeningBody");
    if (!container) return;

    const record = getToday();
    const activity = record.activities.listening;
    const item = resolveItem(activity);

    if (activity.completed && !session.retaking) {
      container.innerHTML = `
        <div class="card card-pad score-panel">
          <div class="score-value">${activity.score.correct}/${activity.score.total}</div>
          <div class="score-label">Listening completed for today</div>
          <button class="btn btn-secondary btn-sm" id="listenRetakeBtn" style="margin-top:16px;">${ICONS.shuffle}<span style="margin-left:6px;">Retake test</span></button>
        </div>
        <div class="card card-pad" style="margin-top:16px;">
          <h3 style="margin-bottom:12px;font-family:var(--font-display);font-size:16px;">${item.title}</h3>
          <p class="passage-box">${item.transcript}</p>
        </div>
      `;
      const retakeBtn = document.getElementById("listenRetakeBtn");
      if (retakeBtn) retakeBtn.addEventListener("click", retakeActivity);
      return;
    }

    const allAnswered = item.questions.every((_, i) => session.answers[i] !== undefined);
    const canShuffle = !session.hasListened && session.elapsedMs === 0 && !session.isPlaying;

    container.innerHTML = `
      <div class="quiz-toolbar">
        <h3 style="font-family:var(--font-display);font-size:16px;">${item.title}</h3>
        <button class="btn btn-ghost btn-sm shuffle-btn" id="listenShuffleBtn" ${canShuffle ? "" : "disabled"} title="Try a different clip">${ICONS.shuffle}<span>New clip</span></button>
      </div>
      ${playerCard(item)}
      <div style="margin-top:24px;">
        ${
          session.hasListened
            ? questionsBlock(item)
            : `<p class="reading-hint">Listen to the audio, then answer the comprehension questions below.
                ${tts.isSupported() ? `Trouble with audio? <a href="#" id="listenSkipLink" style="color:var(--accent-strong);">Continue without audio</a>.` : ""}
              </p>`
        }
      </div>
      ${
        session.hasListened
          ? `<div class="complete-row">
              <span class="score-label">${allAnswered ? "All questions answered" : `${Object.keys(session.answers).length}/${item.questions.length} answered`}</span>
              <button class="btn btn-primary" id="listenCompleteBtn" ${allAnswered ? "" : "disabled"}>Complete Listening</button>
            </div>`
          : ""
      }
    `;

    const shuffleBtn = document.getElementById("listenShuffleBtn");
    if (shuffleBtn) {
      shuffleBtn.addEventListener("click", () => {
        if (!canShuffle) return;
        playNavigate();
        reshuffleItem(item.id);
        render();
      });
    }

    const playBtn = document.getElementById("listenPlayBtn");
    if (playBtn) playBtn.addEventListener("click", () => { playClick(); togglePlay(item); });

    const volumeInput = document.getElementById("listenVolume");
    if (volumeInput) volumeInput.addEventListener("input", (e) => { session.volume = Number(e.target.value); });

    const transcriptBtn = document.getElementById("listenTranscriptToggle");
    if (transcriptBtn) transcriptBtn.addEventListener("click", () => { session.showTranscript = !session.showTranscript; render(); });

    const skipLink = document.getElementById("listenSkipLink");
    if (skipLink) {
      skipLink.addEventListener("click", (e) => {
        e.preventDefault();
        tts.stop();
        stopTimer();
        session.isPlaying = false;
        session.hasListened = true;
        render();
      });
    }

    container.querySelectorAll("[data-q]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectAnswer(item, Number(btn.getAttribute("data-q")), Number(btn.getAttribute("data-opt")));
      });
    });

    const completeBtn = document.getElementById("listenCompleteBtn");
    if (completeBtn) completeBtn.addEventListener("click", () => { playClick(); completeActivity(item); });
  }

  App.views.listening = { render };
})();
