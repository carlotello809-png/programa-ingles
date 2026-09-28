(function () {
  "use strict";

  const { getSettings, setSoundOn, setTtsRate, setTtsVoice } = App.state;
  const tts = App.tts;
  const { playClick, playToggleOn, playToggleOff } = App.sound;

  function render() {
    const container = document.getElementById("settingsBody");
    if (!container) return;

    const settings = getSettings();
    const voices = tts.getEnglishVoices();

    container.innerHTML = `
      <div class="card card-pad">
        <div class="settings-section">
          <h3>Sound</h3>
          <div class="settings-row">
            <div>
              <div class="settings-row-label">Interaction sounds</div>
              <div class="settings-row-desc">Subtle sounds for clicks, correct/incorrect answers, and completions.</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="settingsSoundToggle" ${settings.soundOn ? "checked" : ""} />
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>

        <div class="settings-section">
          <h3>Text-to-Speech</h3>
          <div class="settings-row">
            <div style="flex:1;">
              <div class="settings-row-label">Speaking rate</div>
              <div class="settings-row-desc">Used for Listening audio and Vocabulary pronunciation.</div>
              <div style="margin-top:10px;max-width:280px;">
                <input type="range" id="settingsRate" min="0.6" max="1.4" step="0.05" value="${settings.ttsRate}" />
              </div>
            </div>
            <span class="pill" id="settingsRateLabel">${settings.ttsRate.toFixed(2)}x</span>
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-row-label">Voice</div>
              <div class="settings-row-desc">${voices.length ? "Choose an available English voice." : "No English voices detected yet — your browser may still be loading them."}</div>
            </div>
            <select id="settingsVoice" class="blank-input" style="min-width:200px;">
              <option value="">System default</option>
              ${voices
                .map((v) => `<option value="${v.voiceURI}" ${settings.ttsVoiceURI === v.voiceURI ? "selected" : ""}>${v.name}</option>`)
                .join("")}
            </select>
          </div>
        </div>
      </div>
    `;

    document.getElementById("settingsSoundToggle").addEventListener("change", (e) => {
      if (e.target.checked) {
        setSoundOn(true);
        playToggleOn();
      } else {
        playToggleOff();
        setSoundOn(false);
      }
      App.chrome.updateChrome();
    });

    document.getElementById("settingsRate").addEventListener("input", (e) => {
      const rate = Number(e.target.value);
      setTtsRate(rate);
      document.getElementById("settingsRateLabel").textContent = `${rate.toFixed(2)}x`;
    });

    document.getElementById("settingsVoice").addEventListener("change", (e) => {
      setTtsVoice(e.target.value || null);
      playClick();
    });
  }

  App.views.settings = { render };
})();
