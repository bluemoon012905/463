const state = {
  data: null,
  units: [],
  activeQuestions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  missed: [],
};

const ui = {
  statUnits: document.getElementById("stat-units"),
  statQuestions: document.getElementById("stat-questions"),
  statTopics: document.getElementById("stat-topics"),
  unitSelect: document.getElementById("unit-select"),
  questionCount: document.getElementById("question-count"),
  shuffleToggle: document.getElementById("shuffle-toggle"),
  unitStrip: document.getElementById("unit-strip"),
  startButton: document.getElementById("start-button"),
  allUnitsButton: document.getElementById("all-units-button"),
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

function populateControls() {
  const allOption = new Option("All units", "all");
  ui.unitSelect.add(allOption);

  state.units.forEach((unit) => {
    ui.unitSelect.add(new Option(`Unit ${unit.unit}: ${unit.title}`, String(unit.unit)));
  });

  ui.unitStrip.innerHTML = state.units
    .map(
      (unit) =>
        `<span class="unit-pill">Unit ${unit.unit}: ${unit.title} (${unit.topics.length} topics, ${unit.questions.length} questions)</span>`,
    )
    .join("");
}

function buildQuestionPool() {
  const selection = ui.unitSelect.value;
  const chooseAllUnits = selection === "all";
  const chosenUnits = chooseAllUnits
    ? state.units
    : state.units.filter((unit) => String(unit.unit) === selection);

  const flatQuestions = chosenUnits.flatMap((unit) =>
    unit.questions.map((question) => ({
      ...question,
      unit: unit.unit,
      unitTitle: unit.title,
    })),
  );

  let pool = ui.shuffleToggle.checked ? shuffle(flatQuestions) : [...flatQuestions];
  const requestedCount = ui.questionCount.value;

  if (requestedCount !== "all") {
    pool = pool.slice(0, Number(requestedCount));
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

  ui.statUnits.textContent = String(state.units.length);
  ui.statQuestions.textContent = String(
    state.units.reduce((sum, unit) => sum + unit.questions.length, 0),
  );
  ui.statTopics.textContent = String(
    state.units.reduce((sum, unit) => sum + unit.topics.length, 0),
  );

  populateControls();

  ui.startButton.addEventListener("click", startQuiz);
  ui.allUnitsButton.addEventListener("click", () => {
    ui.unitSelect.value = "all";
  });
  ui.nextButton.addEventListener("click", nextStep);
  ui.restartButton.addEventListener("click", startQuiz);
  ui.tryAgainButton.addEventListener("click", startQuiz);
}

init();
