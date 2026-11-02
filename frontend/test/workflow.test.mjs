import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const workflow = readFileSync(
  new URL("../../.github/workflows/website.yml", import.meta.url),
  "utf8",
);

const jobs = workflow.match(/^jobs:\n((?: {2,}.*\n|\n)*)/m)?.[1];
const verifyJob = workflow.match(/^ {2}verify:\n((?: {4}.*\n|\n)*)/m)?.[1];
const triggers = workflow.match(/^on:\n((?: {2}.*\n|\n)*)/m)?.[1];

test("the workflow defines triggers and a verify job", () => {
  assert.ok(triggers, "on: must exist");
  assert.ok(jobs, "jobs: must exist");
  assert.ok(verifyJob, "jobs.verify must exist");
});

test("verify has no job-level condition, so it can never be skipped", () => {
  assert.doesNotMatch(verifyJob, /^ {4}if:/m);
});

test("verify is the only job, keeps its key as the check name, and has no matrix", () => {
  assert.deepEqual(
    [...jobs.matchAll(/^ {2}([\w-]+):/gm)].map((m) => m[1]),
    ["verify"],
  );
  assert.doesNotMatch(verifyJob, /^ {4}name:/m, "a name: would change the check context");
  assert.doesNotMatch(verifyJob, /\bmatrix\b/);
});

test("triggers have no paths or paths-ignore filters", () => {
  assert.doesNotMatch(triggers, /\bpaths(-ignore)?:/);
});

test("verify installs and runs all three browser engines", () => {
  assert.match(verifyJob, /install --with-deps chromium firefox webkit/);
  assert.match(verifyJob, /npm run test:browser:all/);
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  for (const engine of ["chromium", "firefox", "webkit"]) {
    assert.match(pkg.scripts["test:browser:all"], new RegExp(`BROWSER_ENGINE=${engine}\\b`));
  }
});
