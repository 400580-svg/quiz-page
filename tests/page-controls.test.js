"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const htmlPath = path.join(__dirname, "..", "public", "index.html");
const appPath = path.join(__dirname, "..", "public", "app.js");
const html = readFileSync(htmlPath, "utf8");
const app = readFileSync(appPath, "utf8");

const requiredSelectors = [
  "#start-screen",
  "#quiz-screen",
  "#result-screen",
  "#start-btn",
  "#next-btn",
  "#restart-btn",
  "#question-text",
  "#answers",
  "#feedback",
  "#progress",
  "#score",
  "#result-title",
  "#result-text",
  "#db-form",
  "#message",
  "#db-status",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertRequiredSelector(selector, markup, source) {
  const query = new RegExp(
    `document\\.querySelector\\(["']${escapeRegExp(selector)}["']\\)`,
  );
  assert.match(source, query, `public/app.js must query ${selector}`);

  const id = escapeRegExp(selector.slice(1));
  assert.match(
    markup,
    new RegExp(`\\bid=["']${id}["']`),
    `public/index.html is missing required selector ${selector}`,
  );
}

for (const selector of requiredSelectors) {
  test(`page provides app control ${selector}`, () => {
    assertRequiredSelector(selector, html, app);
  });
}

test("missing required IDs fail with the selector name", () => {
  const htmlWithoutStartButton = html.replace(/\bid="start-btn"/, "");
  assert.throws(
    () => assertRequiredSelector("#start-btn", htmlWithoutStartButton, app),
    /public\/index\.html is missing required selector #start-btn/,
  );
});

test("database result panel supports the intentional fallback", () => {
  assert.match(
    app,
    /document\.querySelector\(["']#db-result["']\)\s*\|\|\s*document\.querySelector\(["']#result["']\)/,
    "public/app.js must keep the #db-result || #result fallback",
  );
  assert.ok(
    /\bid=["']db-result["']/.test(html) || /\bid=["']result["']/.test(html),
    "public/index.html must provide either #db-result or #result",
  );
});
