const STORAGE_KEY = "cse463_quiz_attempts";

const state = {
  data: null,
  hardData: null,
  units: [],
  topics: [],
  selectionMode: "units",
  difficulty: "easy",
  selectedUnits: new Set(),
  selectedTopics: new Set(),
  showUnitNumbersOnly: true,
  maxDopamine: false,
  showQuizAudioControls: true,
  activeQuestions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  missed: [],
  attempts: [],
  speech: {
    supported: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    voices: [],
    voice: null,
    currentUtterance: null,
    mode: "idle",
  },
  listenMode: {
    activeQuestions: [],
    currentIndex: 0,
    phase: "idle",
    section: null,
    isPaused: false,
    rate: 1,
    speakOptions: true,
    answerDelay: 900,
    timerId: null,
    timerDuration: 0,
    timerStartedAt: 0,
    timerCallback: null,
    currentWordIndex: -1,
    titleCardKey: null,
  },
};

const ui = {
  homeView: document.getElementById("home-view"),
  quizView: document.getElementById("quiz-view"),
  statsView: document.getElementById("stats-view"),
  selectionCopy: document.getElementById("selection-copy"),
  difficultyMode: document.getElementById("difficulty-mode"),
  selectionMode: document.getElementById("selection-mode"),
  questionCount: document.getElementById("question-count"),
  questionCountHelp: document.getElementById("question-count-help"),
  shuffleToggle: document.getElementById("shuffle-toggle"),
  unitLabelToggle: document.getElementById("unit-label-toggle"),
  unitStrip: document.getElementById("unit-strip"),
  startButton: document.getElementById("start-button"),
  openStatsButton: document.getElementById("open-stats-button"),
  allUnitsButton: document.getElementById("all-units-button"),
  clearUnitsButton: document.getElementById("clear-units-button"),
  backHomeButton: document.getElementById("back-home-button"),
  openStatsFromQuizButton: document.getElementById("open-stats-from-quiz-button"),
  quizTitle: document.getElementById("quiz-title"),
  topicLine: document.getElementById("topic-line"),
  unitBadge: document.getElementById("unit-badge"),
  progressText: document.getElementById("progress-text"),
  scoreText: document.getElementById("score-text"),
  progressFill: document.getElementById("progress-fill"),
  questionText: document.getElementById("question-text"),
  options: document.getElementById("options"),
  readQuestionButton: document.getElementById("read-question-button"),
  readExplanationButton: document.getElementById("read-explanation-button"),
  pauseAudioButton: document.getElementById("pause-audio-button"),
  feedback: document.getElementById("feedback"),
  feedbackResult: document.getElementById("feedback-result"),
  feedbackExplanation: document.getElementById("feedback-explanation"),
  nextButton: document.getElementById("next-button"),
  restartButton: document.getElementById("restart-button"),
  resultsCard: document.getElementById("results-card"),
  resultsSummary: document.getElementById("results-summary"),
  correctCount: document.getElementById("correct-count"),
  accuracyCount: document.getElementById("accuracy-count"),
  reviewedUnits: document.getElementById("reviewed-units"),
  reviewList: document.getElementById("review-list"),
  tryAgainButton: document.getElementById("try-again-button"),
  resultsHomeButton: document.getElementById("results-home-button"),
  statsPreviewList: document.getElementById("stats-preview-list"),
  statsAttempts: document.getElementById("stats-attempts"),
  statsAverageAccuracy: document.getElementById("stats-average-accuracy"),
  statsTotalQuestions: document.getElementById("stats-total-questions"),
  statsHistoryList: document.getElementById("stats-history-list"),
  statsHomeButton: document.getElementById("stats-home-button"),
  clearStatsButton: document.getElementById("clear-stats-button"),
  dopamineToggle: document.getElementById("dopamine-toggle"),
  quizAudioToggle: document.getElementById("quiz-audio-toggle"),
  listenModeButton: document.getElementById("listen-mode-button"),
  listenView: document.getElementById("listen-view"),
  listenHomeButton: document.getElementById("listen-home-button"),
  listenStatsButton: document.getElementById("listen-stats-button"),
  listenTitle: document.getElementById("listen-title"),
  listenTopicLine: document.getElementById("listen-topic-line"),
  listenUnitBadge: document.getElementById("listen-unit-badge"),
  listenProgressText: document.getElementById("listen-progress-text"),
  listenStatusText: document.getElementById("listen-status-text"),
  listenProgressFill: document.getElementById("listen-progress-fill"),
  listenSpeed: document.getElementById("listen-speed"),
  listenSpeedValue: document.getElementById("listen-speed-value"),
  listenAnswerDelay: document.getElementById("listen-answer-delay"),
  listenAnswerDelayValue: document.getElementById("listen-answer-delay-value"),
  listenReadOptionsToggle: document.getElementById("listen-read-options-toggle"),
  listenTitleCard: document.getElementById("listen-title-card"),
  listenTitleCardEyebrow: document.getElementById("listen-title-card-eyebrow"),
  listenTitleCardTitle: document.getElementById("listen-title-card-title"),
  listenTitleCardSubtitle: document.getElementById("listen-title-card-subtitle"),
  listenQuestionText: document.getElementById("listen-question-text"),
  listenOptionsBlock: document.getElementById("listen-options-block"),
  listenOptionsList: document.getElementById("listen-options-list"),
  listenAnswerBlock: document.getElementById("listen-answer-block"),
  listenAnswerText: document.getElementById("listen-answer-text"),
  listenExplanationBlock: document.getElementById("listen-explanation-block"),
  listenExplanationText: document.getElementById("listen-explanation-text"),
  listenPrevButton: document.getElementById("listen-prev-button"),
  listenToggleButton: document.getElementById("listen-toggle-button"),
  listenNextButton: document.getElementById("listen-next-button"),
};

const LISTEN_DELAYS = {
  titleCard: 1800,
  betweenQuestionAndAnswer: 900,
  betweenAnswerAndExplanation: 700,
  betweenQuestions: 1400,
};

function shuffle(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function formatUnitLabel(unit) {
  return state.showUnitNumbersOnly ? `Unit ${unit.unit}` : `Unit ${unit.unit}: ${unit.title}`;
}

function getTopicKey(unitNumber, topic) {
  return `${unitNumber}::${topic}`;
}

function formatTopicLabel(topicEntry) {
  return state.showUnitNumbersOnly
    ? `Unit ${topicEntry.unit} • ${topicEntry.topic}`
    : `Unit ${topicEntry.unit}: ${topicEntry.unitTitle} • ${topicEntry.topic}`;
}

function getSelectedItems() {
  if (state.selectionMode === "topics") {
    return state.topics.filter((topicEntry) => state.selectedTopics.has(topicEntry.key));
  }

  return state.units.filter((unit) => state.selectedUnits.has(unit.unit));
}

function getSelectedUnits() {
  return state.units.filter((unit) => state.selectedUnits.has(unit.unit));
}

function getSelectionStats() {
  const selectedItems = getSelectedItems();

  if (state.selectionMode === "topics") {
    return {
      selectedItems,
      selectionCount: selectedItems.length,
      topicCount: selectedItems.length,
      questionCount: selectedItems.reduce((sum, topicEntry) => sum + topicEntry.questions.length, 0),
    };
  }

  const selectedUnits = selectedItems;
  return {
    selectedUnits,
    selectionCount: selectedUnits.length,
    topicCount: selectedUnits.reduce((sum, unit) => sum + unit.topics.length, 0),
    questionCount: selectedUnits.reduce((sum, unit) => sum + unit.questions.length, 0),
  };
}

function updateQuestionCountHelp() {
  const { selectionCount, topicCount, questionCount } = getSelectionStats();
  const modeLabel = state.selectionMode === "topics" ? "topic" : "unit";
  ui.questionCount.max = String(questionCount || 1);

  if (topicCount === 0) {
    ui.questionCountHelp.textContent = `Select at least one ${modeLabel} to enable a question count.`;
    return;
  }

  ui.questionCountHelp.textContent =
    `Type a number from 1 to ${questionCount}. Current selection covers ${selectionCount} ` +
    `${modeLabel}${selectionCount === 1 ? "" : "s"} and ${topicCount} topic${topicCount === 1 ? "" : "s"}.`;
}

function renderUnitStrip() {
  if (state.selectionMode === "topics") {
    ui.unitStrip.innerHTML = state.topics
      .map(
        (topicEntry) =>
          `<button class="unit-pill selectable ${
            state.selectedTopics.has(topicEntry.key) ? "active" : ""
          }" type="button" data-topic-key="${topicEntry.key}">${formatTopicLabel(topicEntry)}</button>`,
      )
      .join("");

    ui.unitStrip.querySelectorAll("[data-topic-key]").forEach((button) => {
      button.addEventListener("click", () => {
        const { topicKey } = button.dataset;
        if (state.selectedTopics.has(topicKey)) {
          state.selectedTopics.delete(topicKey);
        } else {
          state.selectedTopics.add(topicKey);
        }
        renderUnitStrip();
        updateQuestionCountHelp();
      });
    });
    return;
  }

  ui.unitStrip.innerHTML = state.units
    .map(
      (unit) =>
        `<button class="unit-pill selectable ${
          state.selectedUnits.has(unit.unit) ? "active" : ""
        }" type="button" data-unit="${unit.unit}">${formatUnitLabel(unit)}</button>`,
    )
    .join("");

  ui.unitStrip.querySelectorAll("[data-unit]").forEach((button) => {
    button.addEventListener("click", () => {
      const unitNumber = Number(button.dataset.unit);
      if (state.selectedUnits.has(unitNumber)) {
        state.selectedUnits.delete(unitNumber);
      } else {
        state.selectedUnits.add(unitNumber);
      }
      renderUnitStrip();
      updateQuestionCountHelp();
    });
  });
}

function renderSelectionControls() {
  const isTopicMode = state.selectionMode === "topics";
  ui.selectionCopy.textContent = isTopicMode
    ? "Select the topics you want to practice."
    : "Select the units you want to practice.";
  ui.allUnitsButton.textContent = isTopicMode ? "Select All Topics" : "Select All Units";
  ui.clearUnitsButton.textContent = isTopicMode ? "Clear Topics" : "Clear Units";
}

function getWordRanges(text) {
  return [...text.matchAll(/\S+/g)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
    word: match[0],
  }));
}

function renderSpeechText(container, text, sectionName) {
  container.textContent = "";
  const wordRanges = getWordRanges(text);

  if (wordRanges.length === 0) {
    container.textContent = text;
    return;
  }

  let lastIndex = 0;
  wordRanges.forEach((range, index) => {
    if (range.start > lastIndex) {
      container.append(document.createTextNode(text.slice(lastIndex, range.start)));
    }

    const span = document.createElement("span");
    span.textContent = range.word;
    span.dataset.wordIndex = String(index);
    span.dataset.section = sectionName;
    span.className = "speech-word";
    container.append(span);
    lastIndex = range.end;
  });

  if (lastIndex < text.length) {
    container.append(document.createTextNode(text.slice(lastIndex)));
  }
}

function clearSpeechHighlights() {
  document.querySelectorAll(".speech-word.current").forEach((word) => {
    word.classList.remove("current");
  });
}

function setSpeechHighlight(sectionName, wordIndex) {
  clearSpeechHighlights();
  if (!sectionName || wordIndex < 0) {
    return;
  }

  const activeWord = document.querySelector(
    `.speech-word[data-section="${sectionName}"][data-word-index="${wordIndex}"]`,
  );
  if (activeWord) {
    activeWord.classList.add("current");
    activeWord.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

function findWordIndexFromChar(text, charIndex) {
  const wordRanges = getWordRanges(text);
  return wordRanges.findIndex((range) => charIndex >= range.start && charIndex < range.end);
}

function rebuildUnitsFromData() {
  const source = state.difficulty === "hard" && state.hardData ? state.hardData : state.data;
  state.units = source.units;
  state.topics = state.units.flatMap((unit) => {
    const questionsByTopic = new Map();
    unit.questions.forEach((question) => {
      if (!questionsByTopic.has(question.topic)) {
        questionsByTopic.set(question.topic, []);
      }
      questionsByTopic.get(question.topic).push(question);
    });
    return unit.topics.map((topic) => ({
      key: getTopicKey(unit.unit, topic),
      unit: unit.unit,
      unitTitle: unit.title,
      topic,
      questions: questionsByTopic.get(topic) || [],
    }));
  });
}

function buildQuestionPool() {
  const flatQuestions =
    state.selectionMode === "topics"
      ? getSelectedItems().flatMap((topicEntry) =>
          topicEntry.questions.map((question) => ({
            ...question,
            unit: topicEntry.unit,
            unitTitle: topicEntry.unitTitle,
          })),
        )
      : getSelectedUnits().flatMap((unit) =>
          unit.questions.map((question) => ({
            ...question,
            unit: unit.unit,
            unitTitle: unit.title,
          })),
        );

  let pool = ui.shuffleToggle.checked ? shuffle(flatQuestions) : [...flatQuestions];
  const rawRequestedCount = Number.parseInt(ui.questionCount.value, 10);
  const requestedCount = Number.isFinite(rawRequestedCount)
    ? Math.max(1, Math.min(rawRequestedCount, flatQuestions.length))
    : flatQuestions.length;

  if (pool.length > requestedCount) {
    pool = pool.slice(0, requestedCount);
  }

  if (ui.shuffleToggle.checked) {
    pool = pool.map((question) => {
      const optionObjects = question.options.map((label, index) => ({
        label,
        originalIndex: index,
      }));
      const shuffledOptions = shuffle(optionObjects);
      return {
        ...question,
        options: shuffledOptions.map((option) => option.label),
        answerIndex: shuffledOptions.findIndex(
          (option) => option.originalIndex === question.answerIndex,
        ),
      };
    });
  }

  return pool;
}

function resetQuizState() {
  state.currentIndex = 0;
  state.score = 0;
  state.answered = false;
  state.missed = [];
}

function resetListenModeState() {
  state.listenMode.currentIndex = 0;
  state.listenMode.phase = "idle";
  state.listenMode.section = null;
  state.listenMode.isPaused = false;
  state.listenMode.currentWordIndex = -1;
  state.listenMode.titleCardKey = null;
  clearScheduledListenTask();
}

function clearScheduledListenTask() {
  if (state.listenMode.timerId) {
    window.clearTimeout(state.listenMode.timerId);
  }
  state.listenMode.timerId = null;
  state.listenMode.timerDuration = 0;
  state.listenMode.timerStartedAt = 0;
  state.listenMode.timerCallback = null;
}

function scheduleListenTask(callback, delay) {
  clearScheduledListenTask();
  state.listenMode.timerDuration = delay;
  state.listenMode.timerStartedAt = window.performance.now();
  state.listenMode.timerCallback = callback;
  state.listenMode.timerId = window.setTimeout(() => {
    clearScheduledListenTask();
    callback();
  }, delay);
}

function pauseScheduledListenTask() {
  if (!state.listenMode.timerId) {
    return;
  }

  const elapsed = window.performance.now() - state.listenMode.timerStartedAt;
  state.listenMode.timerDuration = Math.max(0, state.listenMode.timerDuration - elapsed);
  window.clearTimeout(state.listenMode.timerId);
  state.listenMode.timerId = null;
}

function resumeScheduledListenTask() {
  if (!state.listenMode.timerCallback || state.listenMode.timerId) {
    return;
  }

  const callback = state.listenMode.timerCallback;
  const delay = state.listenMode.timerDuration;
  state.listenMode.timerStartedAt = window.performance.now();
  state.listenMode.timerId = window.setTimeout(() => {
    clearScheduledListenTask();
    callback();
  }, delay);
}

function cancelSpeechPlayback() {
  if (state.speech.supported) {
    window.speechSynthesis.cancel();
  }
  state.speech.currentUtterance = null;
  state.speech.mode = "idle";
  clearSpeechHighlights();
  updatePauseAudioButton();
}

function stopListenPlayback() {
  clearScheduledListenTask();
  cancelSpeechPlayback();
  state.listenMode.phase = "idle";
  state.listenMode.section = null;
  state.listenMode.currentWordIndex = -1;
  state.listenMode.isPaused = false;
  renderListenTransportState();
}

function formatPlaybackRate(value) {
  return `${Number(value).toFixed(1)}x`;
}

function formatDelayLabel(milliseconds) {
  return `${(milliseconds / 1000).toFixed(1)}s`;
}

function updatePauseAudioButton() {
  if (!state.speech.supported) {
    ui.pauseAudioButton.textContent = "Audio Unavailable";
    ui.pauseAudioButton.disabled = true;
    return;
  }

  ui.pauseAudioButton.disabled = state.speech.mode === "idle";
  ui.pauseAudioButton.textContent = window.speechSynthesis.paused ? "Resume Audio" : "Pause Audio";
}

function renderListenTransportState() {
  if (state.listenMode.phase === "finished") {
    ui.listenToggleButton.textContent = "Replay";
    return;
  }
  ui.listenToggleButton.textContent = state.listenMode.isPaused ? "Resume" : "Pause";
}

function ensureSpeechVoices() {
  if (!state.speech.supported) {
    return;
  }

  state.speech.voices = window.speechSynthesis.getVoices();
  state.speech.voice =
    state.speech.voices.find((voice) => voice.localService && voice.lang.startsWith("en")) ||
    state.speech.voices.find((voice) => voice.lang.startsWith("en")) ||
    state.speech.voices[0] ||
    null;
}

function getSpeechStatusLabel() {
  if (!state.speech.supported) {
    return "Speech synthesis is not available in this browser.";
  }
  if (state.listenMode.isPaused) {
    return "Paused";
  }
  if (!state.speech.voice) {
    return "Using browser voice";
  }
  return `Voice: ${state.speech.voice.name}`;
}

function speakText(text, { mode = "general", sectionName = null, rate = 1, onEnd = null } = {}) {
  if (!state.speech.supported || !text) {
    if (onEnd) {
      onEnd();
    }
    return;
  }

  cancelSpeechPlayback();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.voice = state.speech.voice;
  utterance.onboundary = (event) => {
    if (typeof event.charIndex !== "number") {
      return;
    }
    const wordIndex = findWordIndexFromChar(text, event.charIndex);
    state.listenMode.currentWordIndex = wordIndex;
    setSpeechHighlight(sectionName, wordIndex);
  };
  utterance.onend = () => {
    if (state.speech.currentUtterance !== utterance) {
      return;
    }
    state.speech.currentUtterance = null;
    state.speech.mode = "idle";
    state.listenMode.currentWordIndex = -1;
    clearSpeechHighlights();
    updatePauseAudioButton();
    if (onEnd) {
      onEnd();
    }
  };
  utterance.onerror = () => {
    if (state.speech.currentUtterance === utterance) {
      state.speech.currentUtterance = null;
      state.speech.mode = "idle";
      updatePauseAudioButton();
    }
    if (onEnd) {
      onEnd();
    }
  };

  state.speech.currentUtterance = utterance;
  state.speech.mode = mode;
  updatePauseAudioButton();
  window.speechSynthesis.speak(utterance);
}

function setRoute(route) {
  window.location.hash = route;
}

function renderRoute() {
  const route = window.location.hash || "#home";
  const isHome = route === "#home";
  const isQuiz = route === "#quiz";
  const isStats = route === "#stats";
  const isListen = route === "#listen";

  ui.homeView.classList.toggle("hidden", !isHome);
  ui.quizView.classList.toggle("hidden", !isQuiz);
  ui.statsView.classList.toggle("hidden", !isStats);
  ui.listenView.classList.toggle("hidden", !isListen);

  if (!isListen) {
    stopListenPlayback();
  }

  if (!isStats) {
    renderStatsPreview();
  }
}

function hideFeedback() {
  ui.feedback.classList.add("hidden");
  ui.nextButton.classList.add("hidden");
}

function renderQuizAudioControls() {
  const shouldShowRow = state.showQuizAudioControls;
  ui.readQuestionButton.parentElement.classList.toggle("hidden", !shouldShowRow);
  ui.readExplanationButton.classList.toggle("hidden", !shouldShowRow || !state.answered);
  ui.pauseAudioButton.classList.toggle("hidden", !shouldShowRow);
}

function renderQuestion() {
  const question = state.activeQuestions[state.currentIndex];
  const total = state.activeQuestions.length;

  state.answered = false;
  hideFeedback();
  ui.resultsCard.classList.add("hidden");

  ui.quizTitle.textContent = question.unitTitle;
  ui.topicLine.textContent = `Topic: ${question.topic}`;
  ui.unitBadge.textContent = `Unit ${question.unit}`;
  ui.progressText.textContent = `Question ${state.currentIndex + 1} of ${total}`;
  ui.scoreText.textContent = `Score: ${state.score}`;
  ui.progressFill.style.width = `${((state.currentIndex + 1) / total) * 100}%`;
  ui.questionText.textContent = question.prompt;

  ui.options.innerHTML = "";
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-button neutral";
    button.textContent = option;
    button.addEventListener("click", (e) => handleAnswer(index, e));
    ui.options.appendChild(button);
  });

  renderQuizAudioControls();
  updatePauseAudioButton();
}

function getListenQuestion() {
  return state.listenMode.activeQuestions[state.listenMode.currentIndex];
}

function formatListenAnswer(question) {
  return `The correct answer is: ${question.options[question.answerIndex]}.`;
}

function formatListenOption(option, index) {
  return `${index + 1}. ${option}`;
}

function formatListenOptionsSpeech(question) {
  return question.options
    .map((option, index) => `Option ${index + 1}. ${option}.`)
    .join(" ");
}

function renderListenTextSections(question) {
  renderSpeechText(ui.listenQuestionText, question.prompt, "question");
  renderSpeechText(ui.listenAnswerText, formatListenAnswer(question), "answer");
  renderSpeechText(ui.listenExplanationText, question.explanation, "explanation");
}

function renderListenOptions(question) {
  ui.listenOptionsList.innerHTML = "";
  question.options.forEach((option, index) => {
    const button = document.createElement("div");
    button.className = "option-button neutral listen-option-card";
    button.textContent = formatListenOption(option, index);
    ui.listenOptionsList.appendChild(button);
  });
}

function renderListenTitleCard(question) {
  ui.listenTitleCardEyebrow.textContent = `Unit ${question.unit}`;
  ui.listenTitleCardTitle.textContent = question.unitTitle;
  ui.listenTitleCardSubtitle.textContent = question.topic;
}

function renderListenView() {
  const question = getListenQuestion();
  if (!question) {
    ui.listenStatusText.textContent = "No questions available.";
    return;
  }

  const total = state.listenMode.activeQuestions.length;
  ui.listenTitle.textContent = question.unitTitle;
  ui.listenTopicLine.textContent = `Topic: ${question.topic}`;
  ui.listenUnitBadge.textContent = `Unit ${question.unit}`;
  ui.listenProgressText.textContent = `Question ${state.listenMode.currentIndex + 1} of ${total}`;
  ui.listenProgressFill.style.width = `${((state.listenMode.currentIndex + 1) / total) * 100}%`;
  ui.listenStatusText.textContent = getSpeechStatusLabel();
  ui.listenSpeedValue.textContent = formatPlaybackRate(state.listenMode.rate);
  ui.listenSpeed.value = String(state.listenMode.rate);
  ui.listenAnswerDelayValue.textContent = formatDelayLabel(state.listenMode.answerDelay);
  ui.listenAnswerDelay.value = String(state.listenMode.answerDelay / 1000);
  ui.listenReadOptionsToggle.checked = state.listenMode.speakOptions;

  ui.listenAnswerBlock.classList.toggle(
    "hidden",
    !["answer", "explanation", "complete", "finished"].includes(state.listenMode.phase),
  );
  ui.listenExplanationBlock.classList.toggle(
    "hidden",
    !["explanation", "complete", "finished"].includes(state.listenMode.phase),
  );

  renderListenTitleCard(question);
  renderListenTextSections(question);
  renderListenOptions(question);
  renderListenTransportState();

  if (state.listenMode.section && state.listenMode.currentWordIndex >= 0) {
    setSpeechHighlight(state.listenMode.section, state.listenMode.currentWordIndex);
  }
}

function maybeShowListenTitleCard(question) {
  const titleCardKey = `${question.unit}::${question.topic}`;
  const previousQuestion = state.listenMode.activeQuestions[state.listenMode.currentIndex - 1];
  const previousKey = previousQuestion ? `${previousQuestion.unit}::${previousQuestion.topic}` : null;

  if (state.listenMode.currentIndex !== 0 && titleCardKey === previousKey) {
    ui.listenTitleCard.classList.add("hidden");
    playListenQuestionSequence();
    return;
  }

  state.listenMode.titleCardKey = titleCardKey;
  ui.listenTitleCard.classList.remove("hidden");
  scheduleListenTask(() => {
    ui.listenTitleCard.classList.add("hidden");
    playListenQuestionSequence();
  }, LISTEN_DELAYS.titleCard);
}

function playListenQuestionSequence() {
  if (state.listenMode.isPaused) {
    return;
  }

  const question = getListenQuestion();
  if (!question) {
    return;
  }

  state.listenMode.phase = "question";
  state.listenMode.section = "question";
  state.listenMode.currentWordIndex = -1;
  renderListenView();
  const spokenQuestion = state.listenMode.speakOptions
    ? `${question.prompt} ${formatListenOptionsSpeech(question)}`
    : question.prompt;
  speakText(spokenQuestion, {
    mode: "listen",
    sectionName: "question",
    rate: state.listenMode.rate,
    onEnd: () => {
      if (window.location.hash !== "#listen") {
        return;
      }
      scheduleListenTask(playListenAnswerSequence, state.listenMode.answerDelay);
    },
  });
}

function playListenAnswerSequence() {
  if (state.listenMode.isPaused) {
    return;
  }

  const question = getListenQuestion();
  state.listenMode.phase = "answer";
  state.listenMode.section = "answer";
  state.listenMode.currentWordIndex = -1;
  renderListenView();
  speakText(formatListenAnswer(question), {
    mode: "listen",
    sectionName: "answer",
    rate: state.listenMode.rate,
    onEnd: () => {
      if (window.location.hash !== "#listen") {
        return;
      }
      scheduleListenTask(playListenExplanationSequence, LISTEN_DELAYS.betweenAnswerAndExplanation);
    },
  });
}

function playListenExplanationSequence() {
  if (state.listenMode.isPaused) {
    return;
  }

  const question = getListenQuestion();
  state.listenMode.phase = "explanation";
  state.listenMode.section = "explanation";
  state.listenMode.currentWordIndex = -1;
  renderListenView();
  speakText(question.explanation, {
    mode: "listen",
    sectionName: "explanation",
    rate: state.listenMode.rate,
    onEnd: () => {
      if (window.location.hash !== "#listen") {
        return;
      }
      state.listenMode.phase = "complete";
      renderListenView();
      scheduleListenTask(() => {
        if (state.listenMode.currentIndex >= state.listenMode.activeQuestions.length - 1) {
          state.listenMode.phase = "finished";
          ui.listenStatusText.textContent = "Listen mode finished.";
          renderListenTransportState();
          return;
        }
        state.listenMode.currentIndex += 1;
        state.listenMode.phase = "idle";
        state.listenMode.section = null;
        state.listenMode.currentWordIndex = -1;
        renderListenView();
        maybeShowListenTitleCard(getListenQuestion());
      }, LISTEN_DELAYS.betweenQuestions);
    },
  });
}

function handleAnswer(selectedIndex, event) {
  if (state.answered) {
    return;
  }

  state.answered = true;
  const question = state.activeQuestions[state.currentIndex];
  const optionButtons = [...ui.options.querySelectorAll("button")];
  const isCorrect = selectedIndex === question.answerIndex;

  optionButtons.forEach((button, index) => {
    button.disabled = true;
    if (index === question.answerIndex) {
      button.className = "option-button correct";
    } else if (index === selectedIndex) {
      button.className = "option-button incorrect";
    } else {
      button.className = "option-button neutral";
    }
  });

  if (isCorrect) {
    state.score += 1;
    if (state.maxDopamine) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      spawnConfetti(x, y);
      spawnTurtles({ clientX: x, clientY: y });
      playSound("correct");
    }
  } else {
    state.missed.push({
      question: question.prompt,
      unit: question.unit,
      unitTitle: question.unitTitle,
      correct: question.options[question.answerIndex],
      explanation: question.explanation,
    });
    if (state.maxDopamine) {
      playSound("incorrect");
    }
  }

  ui.scoreText.textContent = `Score: ${state.score}`;
  ui.feedback.classList.remove("hidden");
  ui.feedbackResult.textContent = isCorrect ? "Correct." : "Incorrect.";
  ui.feedbackResult.style.color = isCorrect ? "var(--success)" : "var(--danger)";
  ui.feedbackExplanation.textContent = question.explanation;
  ui.nextButton.classList.remove("hidden");
  renderQuizAudioControls();
}

function loadAttempts() {
  try {
    state.attempts = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    state.attempts = [];
  }
}

function saveAttempts() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.attempts));
}

function recordAttempt() {
  const total = state.activeQuestions.length;
  const uniqueUnits = [...new Set(state.activeQuestions.map((question) => question.unit))];
  const attempt = {
    completedAt: new Date().toISOString(),
    score: state.score,
    total,
    accuracy: Math.round((state.score / total) * 100),
    units: uniqueUnits,
  };
  state.attempts.unshift(attempt);
  state.attempts = state.attempts.slice(0, 50);
  saveAttempts();
}

function renderStatsPreview() {
  if (state.attempts.length === 0) {
    ui.statsPreviewList.innerHTML =
      '<div class="review-item"><h3>No saved quizzes yet</h3><p>Complete a quiz and it will show up here.</p></div>';
    return;
  }

  ui.statsPreviewList.innerHTML = state.attempts
    .slice(0, 3)
    .map(
      (attempt) => `
        <article class="review-item">
          <h3>${attempt.score}/${attempt.total} correct</h3>
          <p><strong>Accuracy:</strong> ${attempt.accuracy}%</p>
          <p><strong>Units:</strong> ${attempt.units.join(", ")}</p>
        </article>
      `,
    )
    .join("");
}

function renderStatsPage() {
  const attempts = state.attempts;
  const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const totalAccuracy =
    attempts.length === 0
      ? 0
      : Math.round(attempts.reduce((sum, attempt) => sum + attempt.accuracy, 0) / attempts.length);

  ui.statsAttempts.textContent = String(attempts.length);
  ui.statsAverageAccuracy.textContent = `${totalAccuracy}%`;
  ui.statsTotalQuestions.textContent = String(totalQuestions);

  if (attempts.length === 0) {
    ui.statsHistoryList.innerHTML =
      '<div class="review-item"><h3>No stats yet</h3><p>Completed quizzes will be saved here automatically.</p></div>';
    return;
  }

  ui.statsHistoryList.innerHTML = attempts
    .map(
      (attempt) => `
        <article class="review-item">
          <h3>${new Date(attempt.completedAt).toLocaleString()}</h3>
          <p><strong>Score:</strong> ${attempt.score}/${attempt.total} (${attempt.accuracy}%)</p>
          <p><strong>Units:</strong> ${attempt.units.join(", ")}</p>
        </article>
      `,
    )
    .join("");
}

function showResults() {
  const total = state.activeQuestions.length;
  const accuracy = Math.round((state.score / total) * 100);
  const uniqueUnits = new Set(state.activeQuestions.map((question) => question.unit));

  spawnEndConfetti();
  recordAttempt();
  renderStatsPreview();
  renderStatsPage();

  ui.resultsSummary.textContent = `You answered ${state.score} out of ${total} correctly.`;
  ui.correctCount.textContent = String(state.score);
  ui.accuracyCount.textContent = `${accuracy}%`;
  ui.reviewedUnits.textContent = String(uniqueUnits.size);
  ui.resultsCard.classList.remove("hidden");

  if (state.missed.length === 0) {
    ui.reviewList.innerHTML =
      '<div class="review-item"><h3>No missed questions</h3><p>You cleared this set. Run another round or return home.</p></div>';
    return;
  }

  ui.reviewList.innerHTML = state.missed
    .map(
      (item) => `
        <article class="review-item">
          <h3>Unit ${item.unit}: ${item.unitTitle}</h3>
          <p><strong>Question:</strong> ${item.question}</p>
          <p><strong>Correct answer:</strong> ${item.correct}</p>
          <p>${item.explanation}</p>
        </article>
      `,
    )
    .join("");
}

function nextStep() {
  if (state.currentIndex >= state.activeQuestions.length - 1) {
    showResults();
    return;
  }

  state.currentIndex += 1;
  renderQuestion();
}

function startQuiz() {
  const hasSelection =
    state.selectionMode === "topics" ? state.selectedTopics.size > 0 : state.selectedUnits.size > 0;

  if (!hasSelection) {
    return;
  }

  state.activeQuestions = buildQuestionPool();
  if (state.activeQuestions.length === 0) {
    return;
  }

  stopListenPlayback();
  cancelSpeechPlayback();
  resetQuizState();
  setRoute("#quiz");
  renderQuestion();
}

function startListenMode() {
  const hasSelection =
    state.selectionMode === "topics" ? state.selectedTopics.size > 0 : state.selectedUnits.size > 0;

  if (!hasSelection) {
    return;
  }

  state.listenMode.activeQuestions = buildQuestionPool();
  if (state.listenMode.activeQuestions.length === 0) {
    return;
  }

  cancelSpeechPlayback();
  resetListenModeState();
  setRoute("#listen");
  renderListenView();
  maybeShowListenTitleCard(getListenQuestion());
}

function restartListenAt(index) {
  if (!state.listenMode.activeQuestions.length) {
    return;
  }

  stopListenPlayback();
  state.listenMode.currentIndex = Math.max(0, Math.min(index, state.listenMode.activeQuestions.length - 1));
  state.listenMode.phase = "idle";
  state.listenMode.section = null;
  state.listenMode.currentWordIndex = -1;
  state.listenMode.isPaused = false;
  renderListenView();
  maybeShowListenTitleCard(getListenQuestion());
}

function toggleListenPause() {
  if (!state.listenMode.activeQuestions.length) {
    return;
  }

  if (state.listenMode.phase === "finished") {
    restartListenAt(0);
    return;
  }

  state.listenMode.isPaused = !state.listenMode.isPaused;

  if (state.listenMode.isPaused) {
    pauseScheduledListenTask();
    if (state.speech.currentUtterance) {
      window.speechSynthesis.pause();
    }
  } else if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  } else if (state.listenMode.timerCallback) {
    resumeScheduledListenTask();
  } else if (!state.speech.currentUtterance) {
    if (state.listenMode.phase === "question") {
      playListenQuestionSequence();
    } else if (state.listenMode.phase === "answer") {
      playListenAnswerSequence();
    } else if (state.listenMode.phase === "explanation" || state.listenMode.phase === "complete") {
      playListenExplanationSequence();
    } else {
      maybeShowListenTitleCard(getListenQuestion());
    }
  }

  ui.listenStatusText.textContent = getSpeechStatusLabel();
  renderListenTransportState();
}

let audioCtx = null;

function playSound(type) {
  if (!audioCtx || audioCtx.state === "closed") audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();

  if (type === "correct") {
    [[523.25, 0], [659.25, 0.08], [783.99, 0.16]].forEach(([freq, delay]) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.28, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.35);
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + 0.35);
    });
  } else {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.4);
  }
}

function speakQuizQuestionAndChoices() {
  const question = state.activeQuestions[state.currentIndex];
  if (!question) {
    return;
  }

  const choiceLines = question.options
    .map((option, index) => `Choice ${index + 1}. ${option}.`)
    .join(" ");
  speakText(`${question.prompt} ${choiceLines}`, {
    mode: "quiz",
    rate: state.listenMode.rate,
  });
}

function speakQuizExplanation() {
  const question = state.activeQuestions[state.currentIndex];
  if (!question) {
    return;
  }

  speakText(
    `${formatListenAnswer(question)} Explanation. ${question.explanation}`,
    {
      mode: "quiz",
      rate: state.listenMode.rate,
    },
  );
}

function toggleGeneralSpeechPause() {
  if (!state.speech.supported || state.speech.mode === "idle") {
    return;
  }

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  } else {
    window.speechSynthesis.pause();
  }
  updatePauseAudioButton();
}

const CONFETTI_COLORS = ["#5bc8f5", "#28cda0", "#ffd166", "#ef476f", "#a855f7", "#fb923c", "#f8fafc"];

function spawnConfetti(x, y) {
  const count = 55;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetti-particle";
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 170;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const w = 6 + Math.random() * 9;
    const h = w * (0.35 + Math.random() * 0.7);
    const rot = (Math.random() - 0.5) * 720;
    const dur = 550 + Math.random() * 450;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${color};--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;--dur:${dur}ms`;
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

function spawnEndConfetti() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cannons = [
    { x: vw * 0.15, y: vh * 0.35 },
    { x: vw * 0.5,  y: vh * 0.25 },
    { x: vw * 0.85, y: vh * 0.35 },
  ];
  cannons.forEach(({ x, y }, i) => {
    setTimeout(() => {
      for (let j = 0; j < 75; j++) {
        const el = document.createElement("div");
        el.className = "confetti-particle";
        const angle = Math.random() * Math.PI * 2;
        const speed = 120 + Math.random() * 280;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        const w = 7 + Math.random() * 11;
        const h = w * (0.3 + Math.random() * 0.75);
        const rot = (Math.random() - 0.5) * 900;
        const dur = 900 + Math.random() * 800;
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${color};--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;--dur:${dur}ms`;
        document.body.appendChild(el);
        el.addEventListener("animationend", () => el.remove());
      }
    }, i * 220);
  });
}

function spawnTurtles(event) {
  const count = 16;
  const x = event.clientX;
  const y = event.clientY;

  for (let i = 0; i < count; i++) {
    const img = document.createElement("img");
    img.src = "./turtle_scholar.png";
    img.className = "turtle-particle";

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const speed = 90 + Math.random() * 130;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const size = 30 + Math.random() * 34;
    const rotation = (Math.random() - 0.5) * 600;
    const duration = 650 + Math.random() * 450;

    img.style.cssText = `left:${x}px;top:${y}px;width:${size}px;--dx:${dx}px;--dy:${dy}px;--rot:${rotation}deg;animation-duration:${duration}ms`;

    document.body.appendChild(img);
    img.addEventListener("animationend", () => img.remove());
  }
}

function bindEvents() {
  ui.startButton.addEventListener("click", (e) => {
    spawnTurtles(e);
    startQuiz();
  });
  ui.listenModeButton.addEventListener("click", startListenMode);
  ui.openStatsButton.addEventListener("click", () => setRoute("#stats"));
  ui.backHomeButton.addEventListener("click", () => setRoute("#home"));
  ui.openStatsFromQuizButton.addEventListener("click", () => setRoute("#stats"));
  ui.resultsHomeButton.addEventListener("click", () => setRoute("#home"));
  ui.statsHomeButton.addEventListener("click", () => setRoute("#home"));
  ui.listenHomeButton.addEventListener("click", () => setRoute("#home"));
  ui.listenStatsButton.addEventListener("click", () => setRoute("#stats"));

  ui.allUnitsButton.addEventListener("click", () => {
    if (state.selectionMode === "topics") {
      state.selectedTopics = new Set(state.topics.map((topicEntry) => topicEntry.key));
    } else {
      state.selectedUnits = new Set(state.units.map((unit) => unit.unit));
    }
    renderUnitStrip();
    updateQuestionCountHelp();
  });

  ui.clearUnitsButton.addEventListener("click", () => {
    if (state.selectionMode === "topics") {
      state.selectedTopics = new Set();
    } else {
      state.selectedUnits = new Set();
    }
    renderUnitStrip();
    updateQuestionCountHelp();
  });

  ui.difficultyMode.addEventListener("change", () => {
    state.difficulty = ui.difficultyMode.value;
    rebuildUnitsFromData();
    renderUnitStrip();
    updateQuestionCountHelp();
  });

  ui.selectionMode.addEventListener("change", () => {
    state.selectionMode = ui.selectionMode.value;
    renderSelectionControls();
    renderUnitStrip();
    updateQuestionCountHelp();
  });

  ui.unitLabelToggle.addEventListener("change", () => {
    state.showUnitNumbersOnly = ui.unitLabelToggle.checked;
    renderUnitStrip();
  });

  ui.dopamineToggle.addEventListener("change", () => {
    state.maxDopamine = ui.dopamineToggle.checked;
  });

  ui.quizAudioToggle.addEventListener("change", () => {
    state.showQuizAudioControls = ui.quizAudioToggle.checked;
    renderQuizAudioControls();
  });

  ui.questionCount.addEventListener("input", () => {
    const { questionCount, topicCount } = getSelectionStats();
    const rawValue = Number.parseInt(ui.questionCount.value, 10);

    if (!ui.questionCount.value) {
      updateQuestionCountHelp();
      return;
    }

    if (!Number.isFinite(rawValue) || rawValue < 1) {
      ui.questionCountHelp.textContent = "Enter a whole number greater than or equal to 1.";
      return;
    }

    if (rawValue > questionCount) {
      ui.questionCountHelp.textContent =
        `Max is ${questionCount} for the selected ${state.selectionMode}.`;
      return;
    }

    ui.questionCountHelp.textContent =
      `${rawValue} question${rawValue === 1 ? "" : "s"} requested from ${topicCount} selected ` +
      `topic${topicCount === 1 ? "" : "s"}.`;
  });

  ui.nextButton.addEventListener("click", nextStep);
  ui.restartButton.addEventListener("click", startQuiz);
  ui.tryAgainButton.addEventListener("click", startQuiz);
  ui.readQuestionButton.addEventListener("click", speakQuizQuestionAndChoices);
  ui.readExplanationButton.addEventListener("click", speakQuizExplanation);
  ui.pauseAudioButton.addEventListener("click", toggleGeneralSpeechPause);
  ui.listenPrevButton.addEventListener("click", () => {
    restartListenAt(state.listenMode.currentIndex - 1);
  });
  ui.listenNextButton.addEventListener("click", () => {
    restartListenAt(state.listenMode.currentIndex + 1);
  });
  ui.listenToggleButton.addEventListener("click", toggleListenPause);
  ui.listenSpeed.addEventListener("input", () => {
    state.listenMode.rate = Number(ui.listenSpeed.value);
    ui.listenSpeedValue.textContent = formatPlaybackRate(state.listenMode.rate);
    ui.listenStatusText.textContent = getSpeechStatusLabel();

    if (window.location.hash === "#listen" && !state.listenMode.isPaused) {
      restartListenAt(state.listenMode.currentIndex);
    }
  });
  ui.listenAnswerDelay.addEventListener("input", () => {
    state.listenMode.answerDelay = Math.round(Number(ui.listenAnswerDelay.value) * 1000);
    ui.listenAnswerDelayValue.textContent = formatDelayLabel(state.listenMode.answerDelay);

    if (window.location.hash === "#listen" && !state.listenMode.isPaused) {
      restartListenAt(state.listenMode.currentIndex);
    }
  });
  ui.listenReadOptionsToggle.addEventListener("change", () => {
    state.listenMode.speakOptions = ui.listenReadOptionsToggle.checked;

    if (window.location.hash === "#listen") {
      renderListenView();
      if (!state.listenMode.isPaused) {
        restartListenAt(state.listenMode.currentIndex);
      }
    }
  });
  ui.clearStatsButton.addEventListener("click", () => {
    state.attempts = [];
    saveAttempts();
    renderStatsPreview();
    renderStatsPage();
  });

  window.addEventListener("hashchange", () => {
    cancelSpeechPlayback();
    renderRoute();
  });
}

async function init() {
  const [easyResponse, hardResponse] = await Promise.all([
    fetch("./data/quiz_questions.json"),
    fetch("./data/quiz_questions_hard.json"),
  ]);
  state.data = await easyResponse.json();
  state.hardData = await hardResponse.json();
  rebuildUnitsFromData();
  state.selectedUnits = new Set(state.units.map((unit) => unit.unit));
  state.selectedTopics = new Set(state.topics.map((topicEntry) => topicEntry.key));
  ui.selectionMode.value = state.selectionMode;
  ui.difficultyMode.value = state.difficulty;
  ui.unitLabelToggle.checked = true;
  ui.dopamineToggle.checked = false;
  ui.quizAudioToggle.checked = state.showQuizAudioControls;
  ui.listenSpeed.value = String(state.listenMode.rate);
  ui.listenSpeedValue.textContent = formatPlaybackRate(state.listenMode.rate);
  ui.listenAnswerDelay.value = String(state.listenMode.answerDelay / 1000);
  ui.listenAnswerDelayValue.textContent = formatDelayLabel(state.listenMode.answerDelay);
  ui.listenReadOptionsToggle.checked = state.listenMode.speakOptions;

  ensureSpeechVoices();
  if (state.speech.supported) {
    window.speechSynthesis.onvoiceschanged = () => {
      ensureSpeechVoices();
      if (window.location.hash === "#listen") {
        ui.listenStatusText.textContent = getSpeechStatusLabel();
      }
    };
  }

  loadAttempts();
  renderSelectionControls();
  renderUnitStrip();
  updateQuestionCountHelp();
  renderStatsPreview();
  renderStatsPage();
  renderListenTransportState();
  updatePauseAudioButton();
  bindEvents();

  if (!window.location.hash) {
    setRoute("#home");
  } else {
    renderRoute();
  }
}

init();
