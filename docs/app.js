const STORAGE_KEY = "cse463_quiz_attempts";

const state = {
  data: null,
  units: [],
  topics: [],
  selectionMode: "units",
  selectedUnits: new Set(),
  selectedTopics: new Set(),
  showUnitNumbersOnly: true,
  maxDopamine: false,
  activeQuestions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  missed: [],
  attempts: [],
};

const ui = {
  homeView: document.getElementById("home-view"),
  quizView: document.getElementById("quiz-view"),
  statsView: document.getElementById("stats-view"),
  selectionCopy: document.getElementById("selection-copy"),
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

function setRoute(route) {
  window.location.hash = route;
}

function renderRoute() {
  const route = window.location.hash || "#home";
  const isHome = route === "#home";
  const isQuiz = route === "#quiz";
  const isStats = route === "#stats";

  ui.homeView.classList.toggle("hidden", !isHome);
  ui.quizView.classList.toggle("hidden", !isQuiz);
  ui.statsView.classList.toggle("hidden", !isStats);
}

function hideFeedback() {
  ui.feedback.classList.add("hidden");
  ui.nextButton.classList.add("hidden");
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

  resetQuizState();
  setRoute("#quiz");
  renderQuestion();
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
  ui.openStatsButton.addEventListener("click", () => setRoute("#stats"));
  ui.backHomeButton.addEventListener("click", () => setRoute("#home"));
  ui.openStatsFromQuizButton.addEventListener("click", () => setRoute("#stats"));
  ui.resultsHomeButton.addEventListener("click", () => setRoute("#home"));
  ui.statsHomeButton.addEventListener("click", () => setRoute("#home"));

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
  ui.clearStatsButton.addEventListener("click", () => {
    state.attempts = [];
    saveAttempts();
    renderStatsPreview();
    renderStatsPage();
  });

  window.addEventListener("hashchange", renderRoute);
}

async function init() {
  const response = await fetch("./data/quiz_questions.json");
  state.data = await response.json();
  state.units = state.data.units;
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
  state.selectedUnits = new Set(state.units.map((unit) => unit.unit));
  state.selectedTopics = new Set(state.topics.map((topicEntry) => topicEntry.key));
  ui.selectionMode.value = state.selectionMode;
  ui.unitLabelToggle.checked = true;
  ui.dopamineToggle.checked = false;

  loadAttempts();
  renderSelectionControls();
  renderUnitStrip();
  updateQuestionCountHelp();
  renderStatsPreview();
  renderStatsPage();
  bindEvents();

  if (!window.location.hash) {
    setRoute("#home");
  } else {
    renderRoute();
  }
}

init();
