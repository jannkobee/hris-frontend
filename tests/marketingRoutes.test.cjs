const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");
const { createRouter, createMemoryHistory } = require("vue-router");

const source = fs
  .readFileSync(path.join(__dirname, "../src/router/index.ts"), "utf8")
  .replace("import.meta.env.BASE_URL", '"/"');
let afterEach;
const context = {
  exports: {},
  document: {},
  require: () => ({
    createWebHistory: createMemoryHistory,
    createRouter: (options) => {
      const router = createRouter(options);
      router.afterEach = (callback) => {
        afterEach = callback;
      };
      return router;
    },
  }),
};
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  context,
);
const router = context.exports.default;

test("homepage is public and retains the exact product title", () => {
  const home = router.resolve("/");
  assert.equal(home.name, "home");
  assert.equal(home.meta.requiresAuth, false);
  afterEach(home);
  assert.equal(
    context.document.title,
    "LexisOne — Simple HR for Growing Teams",
  );
});
test("old marketing URL preserves queries and section links", () => {
  const route = router.resolve("/saas?source=email#pricing");
  const target = route.matched[0].redirect(route);
  assert.equal(target.name, "home");
  assert.equal(target.query.source, "email");
  assert.equal(target.hash, "#pricing");
});
test("workspace entry and existing module URLs retain authentication", () => {
  assert.equal(router.resolve("/app").matched[1].redirect.name, "dashboard");
  for (const url of ["/dashboard", "/messages", "/notifications"]) {
    const route = router.resolve(url);
    assert.equal(route.path, url);
    assert.equal(route.meta.requiresAuth, true);
    assert.equal(route.matched[0].path, "/app");
  }
});
