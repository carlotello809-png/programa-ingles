// Bank of practical, non-beginner English tips. One is shown per day (deterministic
// pick by day index), cycling once exhausted.

(function () {
  "use strict";
  App.data.tipsBank = [
  { category: "Speaking", text: "Don't translate every sentence from Spanish to English. Try to think in complete English phrases instead — start with simple ones like \"I'm about to...\" or \"I used to...\" until they become automatic." },
  { category: "Listening", text: "When you can't understand a word, resist pausing immediately. Let the sentence finish first — context often reveals the meaning without you needing the exact word." },
  { category: "Grammar", text: "The present perfect isn't about \"the past\" — it's about a past action that matters right now. \"I've lost my keys\" means you still don't have them. \"I lost my keys\" just states a past fact." },
  { category: "Vocabulary", text: "Learn words in pairs of collocations, not in isolation. Don't just learn \"decision\" — learn \"make a decision.\" Native speakers notice wrong collocations more than wrong grammar." },
  { category: "Pronunciation", text: "English is stress-timed, not syllable-timed like Spanish. Try exaggerating the stressed syllable in long words (comFORtable, necESSary) — it does more for being understood than perfect vowel sounds." },
  { category: "Common mistakes", text: "\"Actually\" doesn't mean \"actualmente.\" It means \"in fact\" or \"to correct something.\" For \"currently,\" use \"currently\" or \"right now.\"" },
  { category: "Writing", text: "In formal writing, avoid starting sentences with \"And\" or \"But.\" Use \"Additionally,\" \"However,\" or \"Furthermore\" instead — but only in formal contexts; in speech and casual writing, starting with them is completely natural." },
  { category: "Natural English", text: "Native speakers use \"gonna,\" \"wanna,\" and \"gotta\" constantly in speech but almost never in writing. Recognize them when listening, but stick to full forms in anything formal." },
  { category: "Learning techniques", text: "Instead of reviewing vocabulary lists passively, try active recall: cover the definition and force yourself to produce it from memory. It feels harder but builds retention far faster than re-reading." },
  { category: "Grammar", text: "\"Few\" and \"a few\" aren't the same. \"Few people came\" sounds almost negative (not many, disappointing). \"A few people came\" is neutral — some people came, which is fine." },
  { category: "Speaking", text: "Filler words like \"well,\" \"so,\" \"I mean,\" and \"you know\" aren't a sign of bad English — native speakers use them constantly to buy thinking time. Using a few makes you sound more natural, not less fluent." },
  { category: "Reading", text: "When reading, don't stop at every unknown word. Underline it and keep going — you'll often infer the meaning from the next two sentences, and it trains you to read at a natural pace." },
  { category: "Vocabulary", text: "Learn the difference between \"say,\" \"tell,\" and \"talk.\" You \"tell someone something,\" you \"say something,\" and you \"talk to/with someone.\" Mixing these up is one of the most common Spanish-speaker errors." },
  { category: "Pronunciation", text: "The \"th\" sound isn't one sound — it's two. \"Think\" uses a voiceless th (like a soft \"f\" with your tongue between your teeth), while \"this\" uses a voiced th (more like a buzzing \"d\"). Practice them separately." },
  { category: "Common mistakes", text: "\"People\" is always plural in English (\"people are,\" never \"people is\"), even though it looks singular. There's no singular \"a people\" for one person." },
  { category: "Writing", text: "Vary your sentence openers. If every sentence starts with \"I,\" your writing reads as flat. Try starting with a time phrase, a dependent clause, or a transition word instead." },
  { category: "Natural English", text: "\"Used to\" describes a past habit that's over (\"I used to smoke\"). \"I'm used to\" means you're accustomed to something now (\"I'm used to the cold\"). They look similar but mean opposite things about time." },
  { category: "Learning techniques", text: "Shadow short audio clips: play a sentence, pause, and repeat it out loud trying to match rhythm and intonation exactly, not just the words. This trains your mouth and ear together." },
  { category: "Grammar", text: "Conditionals aren't about \"if = present, then = future.\" The second conditional (\"If I had time, I would...\") talks about unreal or unlikely present situations — it's about probability, not tense." },
  { category: "Speaking", text: "If you don't know a word mid-sentence, describe it instead of switching to Spanish or stopping. \"The thing you use to...\" keeps the conversation flowing and is exactly what native speakers do too." },
  { category: "Vocabulary", text: "Learn synonyms in bands of formality, not as interchangeable words. \"Buy\" is neutral, \"purchase\" is formal, \"pick up\" is casual — using the wrong register can sound odd even with perfect grammar." },
  { category: "Pronunciation", text: "Word stress can change meaning entirely: \"REcord\" (noun) vs. \"reCORD\" (verb), \"PREsent\" (noun) vs. \"preSENT\" (verb). When in doubt about a two-syllable noun/verb pair, the noun is usually stressed first." },
  { category: "Common mistakes", text: "\"Discuss\" is never followed by \"about.\" You \"discuss a topic,\" not \"discuss about a topic.\" The same goes for \"explain\" — you \"explain something to someone,\" not \"explain someone something.\"" },
  { category: "Writing", text: "Cut \"very\" whenever you can and use a stronger word instead: not \"very tired\" but \"exhausted,\" not \"very good\" but \"excellent.\" It's an easy way to make writing sound more advanced instantly." },
  { category: "Natural English", text: "\"I could care less\" and \"I couldn't care less\" are both used informally in English to mean the same thing (total indifference), even though logically only one makes sense. Don't overthink native speaker inconsistencies like this." },
  { category: "Learning techniques", text: "Keep an \"error log\" instead of a vocabulary list — write down mistakes you actually made in conversation or writing, with the correction. You'll remember your own errors far better than a random word list." },
  { category: "Grammar", text: "\"Since\" is for a starting point in time (\"since Monday,\" \"since 2020\"), while \"for\" is for a duration (\"for three days,\" \"for a year\"). Both often pair with the present perfect." },
  { category: "Reading", text: "Try predicting what a paragraph will say next before you finish reading it. Being right builds confidence; being wrong teaches you something about how English text is structured." },
  { category: "Speaking", text: "Rising intonation at the end of a statement (not a question) can make you sound unsure even when you're not. Practice letting your voice fall at the end of confident statements." },
  { category: "Vocabulary", text: "\"Make\" and \"do\" aren't interchangeable: you \"make a mistake,\" \"make money,\" \"make a decision,\" but you \"do homework,\" \"do a favor,\" \"do the dishes.\" There's no perfect rule — these are best learned as fixed phrases." },
  { category: "Common mistakes", text: "\"I have 25 years\" is a direct translation of \"tengo 25 años\" and is incorrect in English. Say \"I am 25 years old\" or simply \"I'm 25.\"" },
  { category: "Pronunciation", text: "Unstressed vowels in English often reduce to a neutral \"schwa\" sound (like the \"a\" in \"about\"). Native speakers don't pronounce every vowel fully — trying to do so is a common giveaway of a non-native accent." },
  { category: "Writing", text: "In emails, \"I would appreciate it if you could...\" is more natural and polite than \"I want that you...\" (a common direct translation from Spanish). Match your request phrasing to the level of formality you intend." },
  { category: "Natural English", text: "\"Literally\" is now used by native speakers to mean \"figuratively\" for emphasis (\"I literally died laughing\"). It's informal and technically contradictory, but extremely common in casual speech." },
  { category: "Learning techniques", text: "Set a rule: consume at least one piece of real English media a day (a video, article, or podcast segment) with no subtitles first, then check anything you missed. Comprehensible input outside of exercises is what builds real fluency." },
  ];
})();
