import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
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
    reuseJob: text.match(/^ {2}reuse:\n((?: {4}.*\n|\n)*)/m)?.[1],
    testsJob: text.match(/^ {2}tests:\n((?: {4}.*\n|\n)*)/m)?.[1],
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

const { jobs, reuseJob, testsJob, verifyJob, triggers } = extractBlocks(workflow);
const PATH_FILTER = /\bpaths(-ignore)?:/;

test("the workflow defines triggers, a tests job and a verify gate", () => {
  assert.ok(triggers, "on: must exist");
  assert.ok(jobs, "jobs: must exist");
  assert.ok(testsJob, "jobs.tests must exist");
  assert.ok(verifyJob, "jobs.verify must exist");
});

test("tests' only job-level condition is the reuse skip, and a cancelled run does not skip it", () => {
  assert.deepEqual(
    [...testsJob.matchAll(/^ {4}if:.*$/gm)].map((m) => m[0]),
    ["    if: $" + "{{ !cancelled() && needs.reuse.outputs.reuse != 'true' }}"],
  );
  assert.match(testsJob, /^ {4}needs: reuse$/m);
  assert.match(testsJob, /^ {4}name: tests$/m);
});

test("jobs are reuse, tests and verify, and verify is the always-run gate that keeps the check name", () => {
  assert.deepEqual(
    [...jobs.matchAll(/^ {2}([\w-]+):/gm)].map((m) => m[1]),
    ["reuse", "tests", "verify"],
  );
  assert.match(verifyJob, /^ {4}name: verify$/m);
  assert.doesNotMatch(testsJob, /\bmatrix\b/);
  assert.doesNotMatch(verifyJob, /\bmatrix\b/);
  assert.deepEqual(
    [...verifyJob.matchAll(/^ {4}if:.*$/gm)].map((m) => m[0]),
    ["    if: always()"],
  );
  assert.match(verifyJob, /^ {4}needs: \[reuse, tests\]$/m);
  assert.match(verifyJob, /^ {4}runs-on: ubuntu-latest$/m);
  assert.match(verifyJob, /^ {4}timeout-minutes: 2$/m);
  assert.match(verifyJob, /^ {4}permissions: \{\}$/m);
  assert.doesNotMatch(verifyJob, /^ {4}container:/m);
  assert.doesNotMatch(verifyJob, /actions\/checkout/);
  assert.doesNotMatch(verifyJob, /continue-on-error/);
});

test("the verify gate passes only on tests success or a confirmed reuse with tests skipped", () => {
  assert.match(verifyJob, /^ {10}REUSE: \$\{\{ needs\.reuse\.outputs\.reuse \}\}$/m);
  assert.match(verifyJob, /^ {10}TESTS_RESULT: \$\{\{ needs\.tests\.result \}\}$/m);
  const script = verifyJob.match(/^ {8}run: \|\n((?: {10}.*\n|\n)*)/m)?.[1];
  assert.ok(script, "verify must have a gate script");
  const lines = script
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  assert.deepEqual(lines, [
    'if [ "$REUSE" = "true" ] && [ "$TESTS_RESULT" = "skipped" ]; then',
    'echo "tests skipped: a green dev run covers this tree"',
    "exit 0",
    "fi",
    'if [ "$TESTS_RESULT" = "success" ]; then',
    'echo "tests passed"',
    "exit 0",
    "fi",
    "echo \"verify failed: reuse='$REUSE' tests='$TESTS_RESULT'\"",
    "exit 1",
  ]);
});

test("triggers have no paths or paths-ignore filters", () => {
  assert.doesNotMatch(triggers, PATH_FILTER);
});

test("tests runs all three browser engines from the Playwright image, with no install step", () => {
  assert.doesNotMatch(testsJob, /playwright(-core)?\/cli\.js install|playwright install/);
  assert.match(testsJob, /npm run test:browser:all/);
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

test("tests runs the PostHog response contract after the production build", () => {
  assert.match(testsJob, /npm run test:posthog:browser/);
  assert.ok(testsJob.indexOf("npm run build") < testsJob.indexOf("npm run test:posthog:browser"));
});

test("tests keeps every required verification step, unconditional and blocking", () => {
  assert.deepEqual(verificationProblems(testsJob), []);
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

// Every workflow in the repo, including the security scanners, shares the same
// supply-chain invariants.
const WORKFLOW_DIR = new URL("../../.github/workflows/", import.meta.url);
const workflowFiles = readdirSync(WORKFLOW_DIR).filter((name) => /\.ya?ml$/.test(name));
const readWorkflow = (name) => readFileSync(new URL(name, WORKFLOW_DIR), "utf8");

test("the security scanning workflows exist alongside website.yml", () => {
  for (const name of ["website.yml", "codeql.yml", "scorecard.yml"]) {
    assert.ok(workflowFiles.includes(name), `${name} must exist`);
  }
});

test("every workflow pins each action to a full commit SHA with a version comment", () => {
  for (const name of workflowFiles) {
    const lines = stripComments(readWorkflow(name))
      .split("\n")
      .filter((line) => /^\s*(?:- )?uses:/.test(line));
    assert.ok(lines.length > 0, `${name} uses at least one action`);
  }
  for (const name of workflowFiles) {
    // Read the raw file: the version comment is a trailing comment, not a comment-only line.
    for (const line of readWorkflow(name).split("\n")) {
      if (!/^\s*(?:- )?uses:/.test(line)) continue;
      assert.match(
        line,
        /uses:\s*[\w.-]+\/[\w./-]+@[0-9a-f]{40}\s+# v\d+\.\d+\.\d+\s*$/,
        `${name}: ${line.trim()}`,
      );
    }
  }
});

test("no workflow uses pull_request_target or persists checkout credentials", () => {
  for (const name of workflowFiles) {
    const text = stripComments(readWorkflow(name));
    assert.doesNotMatch(text, /pull_request_target/, `${name} must not use pull_request_target`);
    const checkouts = [...text.matchAll(/uses: actions\/checkout@[^\n]*\n((?: {8,}.*\n)*)/g)];
    assert.ok(checkouts.length > 0, `${name} checks out the repository`);
    for (const [, withBlock] of checkouts) {
      assert.match(withBlock, /persist-credentials: false/, `${name} checkout`);
    }
  }
});

test("every workflow declares least-privilege top-level permissions", () => {
  for (const name of workflowFiles) {
    const text = stripComments(readWorkflow(name));
    const top = text.match(/^permissions:[ \t]*(\S*)\n((?: {2}.*\n)*)/m);
    assert.ok(top, `${name} must declare top-level permissions`);
    const granted = top[1] || top[2];
    assert.doesNotMatch(granted, /write/, `${name} top-level permissions must not grant write`);
  }
});

test("codeql.yml scans javascript-typescript and actions on push, PR and a schedule", () => {
  const text = stripComments(readWorkflow("codeql.yml"));
  const on = extractBlocks(text).triggers;
  assert.match(on, /^ {2}push:\n {4}branches:\n {6}- main$/m);
  assert.match(on, /^ {2}pull_request:\n {4}branches:\n {6}- main\n {6}- dev$/m);
  assert.match(on, /^ {2}schedule:\n {4}- cron:/m);
  // Scorecard's SAST check looks for a scan on each merged PR, and dev PRs are most of them.
  assert.match(
    text,
    /^concurrency:\n {2}group: codeql-.*\n {2}cancel-in-progress: .*pull_request/m,
  );
  assert.match(text, /^ {10}- javascript-typescript$/m);
  assert.match(text, /^ {10}- actions$/m);
  assert.match(text, /^permissions:\n {2}contents: read$/m);
  assert.match(text, /^ {6}security-events: write$/m);
  assert.match(text, /^ {6}actions: read$/m);
});

test("scorecard.yml follows the OpenSSF template and publishes results", () => {
  const text = stripComments(readWorkflow("scorecard.yml"));
  const on = extractBlocks(text).triggers;
  assert.match(on, /^ {2}push:\n {4}branches:\n {6}- main$/m);
  assert.match(on, /^ {2}schedule:\n {4}- cron:/m);
  assert.match(on, /^ {2}branch_protection_rule:/m);
  assert.match(text, /^permissions: read-all$/m);
  assert.match(text, /^ {6}security-events: write$/m);
  assert.match(text, /^ {6}id-token: write$/m);
  assert.match(text, /uses: ossf\/scorecard-action@/);
  assert.match(text, /publish_results: true/);
  assert.match(text, /uses: github\/codeql-action\/upload-sarif@/);
});

test("tests downloads a pinned gitleaks binary, checks its sha256 and scans history", () => {
  const step = extractSteps(testsJob).find((candidate) => /gitleaks/.test(candidate.body));
  assert.ok(step, "tests must have a gitleaks step");
  assert.deepEqual(step.bypass, [], "the gitleaks step must be unconditional and blocking");
  assert.match(step.body, /GITLEAKS_VERSION: \d+\.\d+\.\d+/);
  assert.match(step.body, /GITLEAKS_SHA256: [0-9a-f]{64}\b/);
  assert.match(step.body, /sha256sum --check --strict/);
  assert.match(step.body, /gitleaks" git --redact/);
  assert.doesNotMatch(workflow, /gitleaks\/gitleaks-action/);
  assert.match(testsJob, /fetch-depth: 0/);
  assert.ok(
    testsJob.indexOf("sha256sum --check") < testsJob.indexOf('gitleaks" git'),
    "the checksum must be verified before the binary runs",
  );
});

test("the Playwright container image tag matches playwright-core in package-lock.json", () => {
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
  const locked = lock.packages["node_modules/playwright-core"].version;
  const image = testsJob.match(
    /^ {4}container:\n {6}image: (mcr\.microsoft\.com\/playwright:v([\d.]+)-[\w.-]+@sha256:[0-9a-f]{64})$/m,
  );
  assert.ok(image, "tests must run in a digest-pinned mcr.microsoft.com/playwright container");
  assert.equal(
    image[2],
    locked,
    `Playwright image is v${image[2]} but package-lock.json locks playwright-core ${locked}. ` +
      "Bump the image tag and digest in website.yml together with playwright-core.",
  );
  assert.match(testsJob, /^ {6}HOME: \/root$/m, "Firefox in the Playwright image needs HOME=/root");
});

test("reuse only considers dev-to-main promotion and fails closed", () => {
  assert.ok(reuseJob, "jobs.reuse must exist");
  assert.match(reuseJob, /^ {4}continue-on-error: true$/m, "a reuse failure must not skip verify");
  assert.match(reuseJob, /^ {6}contents: read$/m);
  assert.match(reuseJob, /^ {6}actions: read$/m);
  assert.doesNotMatch(reuseJob, /^ {4}container:/m);
  assert.doesNotMatch(reuseJob, /write/);
  assert.match(reuseJob, /persist-credentials: false/);
  assert.match(
    reuseJob,
    /^ {10}echo "reuse=false" >> "\$GITHUB_OUTPUT"$/m,
    "default must be false",
  );
  const script = reuseJob.match(/^ {8}run: \|\n((?: {10}.*\n|\n)*)/m)?.[1];
  assert.ok(script, "reuse must have a decide script");
  assert.match(script, /\[ "\$PR_BASE_REF" = "main" \]/);
  assert.match(script, /\[ "\$PR_HEAD_REF" = "dev" \]/);
  assert.match(script, /\[ "\$PR_HEAD_REPO" = "\$GH_REPO" \]/);
  assert.match(script, /\[ "\$REF_NAME" = "main" \]/);
  assert.match(script, /HEAD\^2/);
  assert.match(script, /\[ "\$head_tree" = "\$source_tree" \]/);
  assert.match(script, /branch=dev&event=push&head_sha=\$source_sha&status=success/);
});

test("run scripts take every GitHub expression through env, never inline", () => {
  for (const name of workflowFiles) {
    const text = stripComments(readWorkflow(name));
    // Walk each run: block (single-line or literal block) and reject ${{ }} inside it.
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const start = lines[i].match(/^(\s*)(?:- )?run:\s*(.*)$/);
      if (!start) continue;
      const indent = start[1].length;
      const body = [start[2]];
      if (/^[|>]/.test(start[2])) {
        body.length = 0;
        for (let j = i + 1; j < lines.length; j++) {
          const lead = lines[j].match(/^\s*/)[0].length;
          if (lines[j].trim() !== "" && lead <= indent) break;
          body.push(lines[j]);
        }
      }
      assert.doesNotMatch(
        body.join("\n"),
        /\$\{\{/,
        `${name}: run script at line ${i + 1} interpolates an expression`,
      );
    }
  }
});
