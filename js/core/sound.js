// Programmatic UI sound effects via the Web Audio API — no sound files to manage.
// Everyday interactions (click/hover/navigate/toggle/type) are minimal percussive
// "clicks" — short filtered noise bursts, like a real mechanical key — rather than
// melodic tones; only feedback that needs to feel rewarding (correct/complete/
// celebration) uses a tonal blip. All playback respects the Sound ON/OFF setting.
(function () {
  "use strict";

  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function setSoundEnabled(value) {
    enabled = value;
  }

  // A single soft "blip": sine/triangle oscillator with a quick pitch glide and
  // a low-pass filter, rounded off with a short exponential decay. Used only for
  // feedback tones (correct/incorrect/complete), not everyday clicks.
  function blip(opts) {
    if (!enabled) return;
    const { freq, freqTo, duration, type, startGain, delay, filterFreq } = {
      type: "sine",
      startGain: 0.075,
      delay: 0,
      filterFreq: 3200,
      ...opts,
    };
    const audioCtx = getCtx();
    const t0 = audioCtx.currentTime + delay;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, t0);
    filter.Q.value = 0.7;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqTo) osc.frequency.exponentialRampToValueAtTime(freqTo, t0 + duration * 0.85);

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(startGain, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(filter).connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  // A tiny burst of filtered noise — the minimal "click" building block behind
  // every everyday interaction sound (think a mechanical keyboard/mouse click).
  function noiseTick(opts) {
    if (!enabled) return;
    const { duration, startGain, delay, filterFreq, pitch } = {
      duration: 0.018,
      startGain: 0.05,
      delay: 0,
      filterFreq: 5800,
      pitch: 1,
      ...opts,
    };
    const audioCtx = getCtx();
    const t0 = audioCtx.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) ** 1.5;
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = pitch;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(filterFreq, t0);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(startGain, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter).connect(gain).connect(audioCtx.destination);
    src.start(t0);
  }

  function playHover() {
    noiseTick({ duration: 0.012, startGain: 0.018, filterFreq: 6500, pitch: 1.3 });
  }

  function playClick() {
    noiseTick({ duration: 0.02, startGain: 0.045, filterFreq: 5200, pitch: 1 });
  }

  function playNavigate() {
    noiseTick({ duration: 0.02, startGain: 0.045, filterFreq: 4800, pitch: 1.1 });
  }

  function playToggleOn() {
    noiseTick({ duration: 0.016, startGain: 0.04, filterFreq: 6000, pitch: 1.25 });
  }

  function playToggleOff() {
    noiseTick({ duration: 0.02, startGain: 0.04, filterFreq: 3600, pitch: 0.8 });
  }

  // The per-character tick for the typewriter reveal — extremely short and quiet
  // since it repeats many times in quick succession; a tiny pitch jitter keeps a
  // string of them from sounding robotic/looped.
  function playType() {
    noiseTick({ duration: 0.01, startGain: 0.022, filterFreq: 6800, pitch: 0.95 + Math.random() * 0.3 });
  }

  function playCorrect() {
    blip({ freq: 660, duration: 0.1, type: "sine", startGain: 0.06, filterFreq: 4200 });
    blip({ freq: 990, duration: 0.13, type: "sine", startGain: 0.06, delay: 0.07, filterFreq: 4600 });
  }

  function playIncorrect() {
    blip({ freq: 300, freqTo: 220, duration: 0.14, type: "sine", startGain: 0.05, filterFreq: 1400 });
    noiseTick({ duration: 0.03, startGain: 0.02, delay: 0.02, filterFreq: 900 });
  }

  function playSectionComplete() {
    blip({ freq: 523, duration: 0.14, type: "triangle", startGain: 0.06 });
    blip({ freq: 659, duration: 0.14, type: "triangle", startGain: 0.06, delay: 0.1 });
    blip({ freq: 784, duration: 0.22, type: "triangle", startGain: 0.06, delay: 0.2 });
  }

  function playAllComplete() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      blip({ freq, duration: 0.26, type: "triangle", startGain: 0.065, delay: i * 0.11, filterFreq: 5200 });
    });
  }

  function playWordChime() {
    noiseTick({ duration: 0.016, startGain: 0.035, filterFreq: 6000, pitch: 1.15 });
  }

  function playSplashChime() {
    blip({ freq: 392, duration: 0.5, type: "sine", startGain: 0.05, filterFreq: 2600 });
    blip({ freq: 587, duration: 0.6, type: "sine", startGain: 0.045, delay: 0.09, filterFreq: 3000 });
    blip({ freq: 784, duration: 0.7, type: "sine", startGain: 0.04, delay: 0.18, filterFreq: 3400 });
  }

  App.sound = {
    setSoundEnabled,
    playHover,
    playClick,
    playNavigate,
    playToggleOn,
    playToggleOff,
    playType,
    playCorrect,
    playIncorrect,
    playSectionComplete,
    playAllComplete,
    playWordChime,
    playSplashChime,
  };
})();
