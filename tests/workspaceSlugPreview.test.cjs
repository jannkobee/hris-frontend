const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "../src/views/StartTrial.vue"),
  "utf8",
);

test("trial form does not ask customers to enter a workspace slug", () => {
  assert.doesNotMatch(source, /label="Workspace slug"/);
  assert.match(source, /Your workspace address/);
  assert.match(source, /We’ll create a simple workspace address/);
});

test("the trial request no longer sends a client-selected slug", () => {
  assert.doesNotMatch(source, /slug:\s*["']/);
  assert.match(source, /workspacePreview/);
});
