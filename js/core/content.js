// Deterministic content selection: the same calendar day always resolves to the
// same content, and each bank cycles once exhausted so it keeps working forever.
(function () {
  "use strict";

  function pickForDay(bank, dayIndex) {
    const i = ((dayIndex % bank.length) + bank.length) % bank.length;
    return bank[i];
  }

  // Vocabulary gets a contiguous 10-word slice per day, wrapping around the bank
  // cleanly (concat + slice) instead of a modulo pick so a day's words never fall short.
  function pickWordsForDay(bank, dayIndex, count) {
    count = count || 10;
    const n = bank.length;
    const start = (((dayIndex * count) % n) + n) % n;
    const doubled = bank.concat(bank);
    return doubled.slice(start, start + count);
  }

  // Picks a random item from the bank, avoiding immediate repeats of `excludeId`
  // when the bank has more than one item — used to keep quiz content feeling
  // fresh across practice sessions instead of a fixed day-by-day rotation.
  function pickRandom(bank, excludeId) {
    if (bank.length <= 1) return bank[0];
    let item;
    do {
      item = bank[Math.floor(Math.random() * bank.length)];
    } while (item.id === excludeId);
    return item;
  }

  // A stable, explicit-start window (used to replay the exact same word set
  // across re-renders once a random start index has been assigned/persisted).
  function wordsFromStart(bank, start, count) {
    count = count || 10;
    const doubled = bank.concat(bank);
    return doubled.slice(start, start + count);
  }

  function pickRandomWordStart(bankLength) {
    return Math.floor(Math.random() * bankLength);
  }

  App.content = { pickForDay, pickWordsForDay, pickRandom, wordsFromStart, pickRandomWordStart };
})();
