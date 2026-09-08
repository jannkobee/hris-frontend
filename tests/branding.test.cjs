const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (file) =>
  fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("branding selects a contrast-safe logo for each surface", () => {
  const sharedLogo = read("src/components/LexisOneLogo.vue");
  assert.match(sharedLogo, /lexisone-logo-transparent\.png/);
  assert.match(sharedLogo, /lexisone-logo\.png/);
  assert.match(sharedLogo, /theme\.global\.current\.value\.dark/);
  for (const file of [
    "src/views/PlatformConsole/Login.vue",
    "src/components/layouts/PlatformConsole/PlatformConsoleLayout.vue",
    "index.html",
  ]) {
    assert.match(read(file), /lexisone-logo\.png/);
    assert.doesNotMatch(read(file), /AppIcon\.appiconset/);
  }
  assert.ok(
    fs.existsSync(
      path.join(__dirname, "../src/assets/lexisone-logo-transparent.png"),
    ),
  );
  assert.ok(
    fs.existsSync(path.join(__dirname, "../src/assets/lexisone-logo.png")),
  );
});

test("customer organization branding remains tenant supplied", () => {
  const layout = read("src/components/layouts/HrisApp/BaseContainer.vue");
  assert.match(layout, /brand_logo_url/);
  assert.doesNotMatch(layout, /lexisone-logo\.png/);
});
