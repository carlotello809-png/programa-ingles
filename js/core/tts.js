// Wrapper around the browser's speechSynthesis API. Used both for the Listening
// module's "audio" (read a transcript aloud) and for single-word pronunciation
// in Vocabulary — no pre-recorded audio files anywhere in the app.
(function () {
  "use strict";

  const synth = window.speechSynthesis;
  let voicesCache = [];

  function refreshVoices() {
    voicesCache = synth ? synth.getVoices() : [];
    return voicesCache;
  }

  if (synth) {
    refreshVoices();
    synth.onvoiceschanged = refreshVoices;
  }

  function isSupported() {
    return !!synth;
  }

  function getEnglishVoices() {
    const voices = voicesCache.length ? voicesCache : refreshVoices();
    return voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
  }

  function stop() {
    if (synth) synth.cancel();
  }

  function pause() {
    if (synth && synth.speaking) synth.pause();
  }

  function resume() {
    if (synth && synth.paused) synth.resume();
  }

  // Speaks text and reports progress via onBoundary (word position) and onEnd.
  // Returns the SpeechSynthesisUtterance so callers can hold a reference if needed.
  function speak(text, opts) {
    opts = opts || {};
    const rate = opts.rate !== undefined ? opts.rate : 1;
    const volume = opts.volume !== undefined ? opts.volume : 1;
    const voiceURI = opts.voiceURI || null;

    if (!synth) {
      if (opts.onEnd) opts.onEnd();
      return null;
    }
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.volume = volume;
    utter.lang = "en-US";

    if (voiceURI) {
      const match = getEnglishVoices().find((v) => v.voiceURI === voiceURI);
      if (match) utter.voice = match;
    }

    if (opts.onStart) utter.onstart = opts.onStart;
    if (opts.onEnd) utter.onend = opts.onEnd;
    if (opts.onBoundary) utter.onboundary = opts.onBoundary;
    utter.onerror = () => {
      if (opts.onEnd) opts.onEnd();
    };

    synth.speak(utter);
    return utter;
  }

  function speakWord(word, opts) {
    return speak(word, Object.assign({ rate: 0.9 }, opts || {}));
  }

  App.tts = { isSupported, getEnglishVoices, stop, pause, resume, speak, speakWord };
})();
