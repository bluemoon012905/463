const state = {
  data: null,
  units: [],
  selectedUnits: new Set(),
  showUnitNumbersOnly: false,
  activeQuestions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  missed: [],
};

const ui = {
  questionCount: document.getElementById("question-count"),
  questionCountHelp: document.getElementById("question-count-help"),
  shuffleToggle: document.getElementById("shuffle-toggle"),
  unitLabelToggle: document.getElementById("unit-label-toggle"),
  unitStrip: document.getElementById("unit-strip"),
  startButton: document.getElementById("start-button"),
  allUnitsButton: document.getElementById("all-units-button"),
  clearUnitsButton: document.getElementById("clear-units-button"),
  quizCard: document.getElementById("quiz-card"),
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
};

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatUnitLabel(unit) {
  return state.showUnitNumbersOnly ? `Unit ${unit.unit}` : `Unit ${unit.unit}: ${unit.title}`;
}

function getSelectedUnits() {
  return state.units.filter((unit) => state.selectedUnits.has(unit.unit));
}

function getSelectionStats() {
  const selectedUnits = getSelectedUnits();
  const topicCount = selectedUnits.reduce((sum, unit) => sum + unit.topics.length, 0);
  const questionCount = selectedUnits.reduce((sum, unit) => sum + unit.questions.length, 0);
  return { selectedUnits, topicCount, questionCount };
}

function updateQuestionCountHelp() {
  const { topicCount, questionCount } = getSelectionStats();
  ui.questionCount.max = String(questionCount || 1);

  if (topicCount === 0) {
    ui.questionCountHelp.textContent = "Select at least one unit to enable a question count.";
    return;
  }

  ui.questionCountHelp.textContent = `Type a number from 1 to ${questionCount}. Current selection covers ${topicCount} topics.`;
}

function renderUnitStrip() {
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

function populateControls() {
  renderUnitStrip();
}

function buildQuestionPool() {
  const chosenUnits = getSelectedUnits();

  const flatQuestions = chosenUnits.flatMap((unit) =>
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

function showQuiz() {
  ui.quizCard.classList.remove("hidden");
  ui.resultsCard.classList.add("hidden");
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

  ui.quizTitle.textContent = `${question.unitTitle}`;
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
    button.addEventListener("click", () => handleAnswer(index));
    ui.options.appendChild(button);
  });
}

function handleAnswer(selectedIndex) {
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
  } else {
    state.missed.push({
      question: question.prompt,
      unit: question.unit,
      unitTitle: question.unitTitle,
      correct: question.options[question.answerIndex],
      explanation: question.explanation,
    });
  }

  ui.scoreText.textContent = `Score: ${state.score}`;
  ui.feedback.classList.remove("hidden");
  ui.feedbackResult.textContent = isCorrect ? "Correct." : "Incorrect.";
  ui.feedbackResult.style.color = isCorrect ? "var(--success)" : "var(--danger)";
  ui.feedbackExplanation.textContent = question.explanation;
  ui.nextButton.classList.remove("hidden");
}

function showResults() {
  ui.quizCard.classList.add("hidden");
  ui.resultsCard.classList.remove("hidden");

  const total = state.activeQuestions.length;
  const accuracy = Math.round((state.score / total) * 100);
  const uniqueUnits = new Set(state.activeQuestions.map((question) => question.unit));

  ui.resultsSummary.textContent = `You answered ${state.score} out of ${total} correctly.`;
  ui.correctCount.textContent = String(state.score);
  ui.accuracyCount.textContent = `${accuracy}%`;
  ui.reviewedUnits.textContent = String(uniqueUnits.size);

  if (state.missed.length === 0) {
    ui.reviewList.innerHTML =
      '<div class="review-item"><h3>No missed questions</h3><p>You cleared this set. Run another shuffled round or switch units.</p></div>';
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
  if (state.selectedUnits.size === 0) {
    return;
  }

  state.activeQuestions = buildQuestionPool();
  if (state.activeQuestions.length === 0) {
    return;
  }

  resetQuizState();
  showQuiz();
  renderQuestion();
}

async function init() {
  const response = await fetch("./data/quiz_questions.json");
  state.data = await response.json();
  state.units = state.data.units;
  state.selectedUnits = new Set(state.units.map((unit) => unit.unit));

  populateControls();
  updateQuestionCountHelp();

  ui.startButton.addEventListener("click", startQuiz);
  ui.allUnitsButton.addEventListener("click", () => {
    state.selectedUnits = new Set(state.units.map((unit) => unit.unit));
    renderUnitStrip();
    updateQuestionCountHelp();
  });
  ui.clearUnitsButton.addEventListener("click", () => {
    state.selectedUnits = new Set();
    renderUnitStrip();
    updateQuestionCountHelp();
  });
  ui.unitLabelToggle.addEventListener("change", () => {
    state.showUnitNumbersOnly = ui.unitLabelToggle.checked;
    renderUnitStrip();
  });
  ui.questionCount.addEventListener("input", () => {
    const { questionCount } = getSelectionStats();
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
      ui.questionCountHelp.textContent = `Max is ${questionCount} for the selected units.`;
      return;
    }

    const { topicCount } = getSelectionStats();
    ui.questionCountHelp.textContent = `${rawValue} question${rawValue === 1 ? "" : "s"} requested from ${topicCount} selected topics.`;
  });
  ui.nextButton.addEventListener("click", nextStep);
  ui.restartButton.addEventListener("click", startQuiz);
  ui.tryAgainButton.addEventListener("click", startQuiz);
}

init();
