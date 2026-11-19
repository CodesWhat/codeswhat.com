import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const workflow = readFileSync(
  new URL("../../.github/workflows/website.yml", import.meta.url),
  "utf8",
);

// Comment-only lines, at any indent, can sit inside a block, so drop them before
// the indentation-based captures. Otherwise a "# note" ends the block early and a
// later paths: filter escapes the guards below.
function stripComments(yaml) {
  return yaml.replace(/^[ \t]*#.*\n/gm, "");
}

function extractBlocks(yaml) {
  const text = stripComments(yaml);
  return {
    jobs: text.match(/^jobs:\n((?: {2,}.*\n|\n)*)/m)?.[1],
    verifyJob: text.match(/^ {2}verify:\n((?: {4}.*\n|\n)*)/m)?.[1],
    triggers: text.match(/^on:\n((?: {2}.*\n|\n)*)/m)?.[1],
  };
}

// Each "- name: ..." entry under steps is one step; a step is whatever sits between
// two "      - " list markers.
function extractSteps(verify) {
  return verify
    .split(/^ {6}- /m)
    .slice(1)
    .map((body) => ({
      body,
      run: body.match(/^ {8}run: (.+)$/m)?.[1].trim(),
      bypass: [...body.matchAll(/^(?: {8})?(if|continue-on-error)[ \t]*:/gm)].map((m) => m[1]),
    }));
}

const REQUIRED_RUNS = [
  "npm run test:support",
  "npm run test:subscribe",
  "node --test test/workflow.test.mjs",
  "npm run test:posthog:browser",
  "npm run test:browser:all",
];

function verificationProblems(verify) {
  const steps = extractSteps(verify);
  const problems = [];
  for (const command of REQUIRED_RUNS) {
    const step = steps.find((candidate) => candidate.run === command);
    if (!step) problems.push(`missing step: ${command}`);
    else for (const key of step.bypass) problems.push(`${key}: on step ${command}`);
  }
  return problems;
}

const { jobs, verifyJob, triggers } = extractBlocks(workflow);
const PATH_FILTER = /\bpaths(-ignore)?:/;

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
  assert.doesNotMatch(triggers, PATH_FILTER);
});

test("verify installs and runs all three browser engines", () => {
  assert.match(verifyJob, /install --with-deps chromium firefox webkit/);
  assert.match(verifyJob, /npm run test:browser:all/);
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  for (const engine of ["chromium", "firefox", "webkit"]) {
    assert.match(pkg.scripts["test:browser:all"], new RegExp(`BROWSER_ENGINE=${engine}\\b`));
  }
});

test("a column-zero comment inside on: does not hide a later paths filter", () => {
  const fixture = [
    "name: Website",
    "on:",
    "  push:",
    "    branches: [main]",
    "# a comment at column zero",
    " # an indented comment",
    "  pull_request:",
    "    paths:",
    "      - frontend/**",
    "jobs:",
    "  verify:",
    "    runs-on: ubuntu-latest",
    "",
  ].join("\n");
  const blocks = extractBlocks(fixture);
  assert.match(blocks.triggers, PATH_FILTER);
  assert.match(blocks.triggers, /pull_request:/);
  assert.match(blocks.verifyJob, /runs-on/);
});

test("verify runs the PostHog response contract after the production build", () => {
  assert.match(verifyJob, /npm run test:posthog:browser/);
  assert.ok(verifyJob.indexOf("npm run build") < verifyJob.indexOf("npm run test:posthog:browser"));
});

test("verify keeps every required verification step, unconditional and blocking", () => {
  assert.deepEqual(verificationProblems(verifyJob), []);
});

test("the verification guard rejects a removed step or an if:/continue-on-error: bypass", () => {
  const step = (name, run, extra = []) =>
    [
      `      - name: ${name}`,
      ...extra.map((line) => `        ${line}`),
      `        run: ${run}`,
    ].join("\n");
  const build = (overrides = {}) =>
    `${REQUIRED_RUNS.map((run) => step(run, run, overrides[run])).join("\n")}\n`;

  assert.deepEqual(verificationProblems(build()), []);
  for (const run of REQUIRED_RUNS) {
    const without = build()
      .split("\n")
      .filter((line) => !line.endsWith(`run: ${run}`) && !line.endsWith(`name: ${run}`))
      .join("\n");
    assert.deepEqual(verificationProblems(without), [`missing step: ${run}`], `removed ${run}`);
    assert.deepEqual(
      verificationProblems(build({ [run]: ["if: always()"] })),
      [`if: on step ${run}`],
      `if on ${run}`,
    );
    assert.deepEqual(
      verificationProblems(build({ [run]: ["continue-on-error: true"] })),
      [`continue-on-error: on step ${run}`],
      `continue-on-error on ${run}`,
    );
    assert.deepEqual(
      verificationProblems(build({ [run]: ["if : false"] })),
      [`if: on step ${run}`],
      `if with a space before the colon on ${run}`,
    );
    assert.deepEqual(
      verificationProblems(build({ [run]: ["continue-on-error : true"] })),
      [`continue-on-error: on step ${run}`],
      `continue-on-error with a space before the colon on ${run}`,
    );
  }
});
