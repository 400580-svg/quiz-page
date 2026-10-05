"use strict";

const form = document.querySelector("#db-form");
const messageField = document.querySelector("#message");
const statusBadge = document.querySelector("#db-status");
const resultPanel = document.querySelector("#result");

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
