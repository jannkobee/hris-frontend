const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "../src/views/HrisApp/Modules/Profile/Profile.vue"),
  "utf8",
);

test("profile photo fills its fixed image frame", () => {
  assert.match(source, /class="profile-photo__image"/);
  assert.match(
    source,
    /\.profile-photo__image\s*\{[\s\S]*width: 100%;[\s\S]*height: 100%/,
  );
});

test("profile page always has a visible initials fallback", () => {
  assert.match(source, /profileInitials/);
  assert.match(source, /\|\| "U"/);
});
