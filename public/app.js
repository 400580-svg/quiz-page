"use strict";

const questions = [
  {
    q: "What is Vibe?",
    answers: ["A music streaming app", "An AI coding agent by Mistral AI", "A game console", "A web browser"],
    correct: 1,
  },
  {
    q: "Which company built Vibe?",
    answers: ["OpenAI", "Google", "Mistral AI", "Meta"],
    correct: 2,
  },
  {
    q: "What can Vibe help you build?",
    answers: ["Apps and websites", "Code and scripts", "Documents and reports", "All of the above"],
    correct: 3,
  },
  {
    q: "What does 'vibe coding' mean?",
    answers: [
      "Writing code in a recording studio",
      "Building software by describing what you want in plain language",
      "Programming with music playing",
      "Typing code very fast",
    ],
    correct: 1,
  },
  {
    q: "What is Vibe Work?",
    answers: [
      "Vibe's team mode for getting tasks done across files, tools, and services",
      "A gym membership",
      "Vibe's mobile app",
      "A coding competition",
    ],
    correct: 0,
  },
  {
    q: "Which of these is a Mistral AI model family?",
    answers: ["Mistral Large", "GLM", "Claude", "Sonnet"],
    correct: 0,
  },
];

const startScreen = document.querySelector("#start-screen");
const quizScreen = document.querySelector("#quiz-screen");
const resultScreen = document.querySelector("#result-screen");
const startBtn = document.querySelector("#start-btn");
const nextBtn = document.querySelector("#next-btn");
const restartBtn = document.querySelector("#restart-btn");
const questionText = document.querySelector("#question-text");
const answersBox = document.querySelector("#answers");
const feedback = document.querySelector("#feedback");
const progress = document.querySelector("#progress");
const scoreEl = document.querySelector("#score");
const resultText = document.querySelector("#result-text");

let index = 0;
let score = 0;

function show(screen) {
  startScreen.hidden = screen !== startScreen;
  quizScreen.hidden = screen !== quizScreen;
  resultScreen.hidden = screen !== resultScreen;
}

function renderQuestion() {
  const item = questions[index];
  progress.textContent = `Question ${index + 1} of ${questions.length}`;
  scoreEl.textContent = `Score: ${score}`;
  questionText.textContent = item.q;
  feedback.textContent = "";
  nextBtn.hidden = true;
  answersBox.innerHTML = "";

  item.answers.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    btn.textContent = text;
    btn.addEventListener("click", () => answer(i, btn));
    answersBox.appendChild(btn);
  });
}

function answer(choice, btn) {
  const item = questions[index];
  const buttons = [...answersBox.children];
  buttons.forEach((b) => (b.disabled = true));
  buttons[item.correct].classList.add("correct");

  if (choice === item.correct) {
    score += 1;
    feedback.textContent = "Correct! ✨";
  } else {
    btn.classList.add("wrong");
    feedback.textContent = "Not quite — the answer is highlighted.";
  }

  scoreEl.textContent = `Score: ${score}`;
  nextBtn.hidden = false;
  nextBtn.textContent =
    index === questions.length - 1 ? "See results →" : "Next question →";
}

function finish() {
  const total = questions.length;
  const pct = Math.round((score / total) * 100);
  let verdict;
  if (pct === 100) verdict = "Perfect score — total Vibe energy! 🔥";
  else if (pct >= 60) verdict = "Nice work — you've got the Vibe.";
  else verdict = "Good try — run it again to level up.";
  document.querySelector("#result-title").textContent =
    `You scored ${score}/${total} (${pct}%)`;
  resultText.textContent = verdict;
  show(resultScreen);
}

startBtn.addEventListener("click", () => {
  index = 0;
  score = 0;
  show(quizScreen);
  renderQuestion();
});

nextBtn.addEventListener("click", () => {
  index += 1;
  if (index < questions.length) renderQuestion();
  else finish();
});

restartBtn.addEventListener("click", () => {
  index = 0;
  score = 0;
  show(quizScreen);
  renderQuestion();
});

const form = document.querySelector("#db-form");
const messageField = document.querySelector("#message");
const statusBadge = document.querySelector("#db-status");
const resultPanel = document.querySelector("#db-result");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusBadge.textContent = "Checking…";
  statusBadge.dataset.state = "";
  resultPanel.textContent = "Connecting to PostgreSQL…";

  try {
    const query = new URLSearchParams({ message: messageField.value });
    const response = await fetch(`/api/db-check?${query}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Database check failed.");
    }

    statusBadge.textContent = "Connected";
    statusBadge.dataset.state = "success";
    resultPanel.textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    statusBadge.textContent = "Unavailable";
    statusBadge.dataset.state = "error";
    resultPanel.textContent = error.message;
  }
});
