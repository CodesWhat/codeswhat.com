import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const workflow = readFileSync(
  new URL("../../.github/workflows/website.yml", import.meta.url),
  "utf8",
);
const condition = workflow.match(/^ {4}if: (.+)$/m)?.[1];
assert.ok(condition, "verify must have an explicit duplicate-run condition");

// This condition uses only boolean operators and same-type comparisons, shared
// by JavaScript and Actions for these lowercase string/numeric fixtures.
function runsVerify(github) {
  return runInNewContext(condition, { github }, { timeout: 100 });
}

function pullRequest(head, base, headRepository = 1) {
  return {
    event_name: "pull_request",
    head_ref: head,
    base_ref: base,
    event: {
      repository: { id: 1 },
      pull_request: { head: { repo: { id: headRepository } } },
    },
  };
}

for (const branch of ["main", "dev"]) {
  test(`a push to ${branch} runs verify without a pull request payload`, () => {
    assert.equal(runsVerify({ event_name: "push", ref: `refs/heads/${branch}` }), true);
  });
}

test("only the internal dev-to-main promotion skips duplicate verification", () => {
  assert.equal(runsVerify(pullRequest("dev", "main")), false);
});

for (const base of ["main", "dev"]) {
  test(`a fork branch named dev targeting ${base} still runs verify`, () => {
    assert.equal(runsVerify(pullRequest("dev", base, 2)), true);
  });

  test(`an ordinary feature PR targeting ${base} runs verify`, () => {
    assert.equal(runsVerify(pullRequest("fix/example", base)), true);
  });
}

test("a dev PR targeting another integration branch is not a production promotion", () => {
  assert.equal(runsVerify(pullRequest("dev", "dev")), true);
});
