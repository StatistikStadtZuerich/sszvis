---
name: Bug report
about: A defect in a component, helper or axis, with the tests that pin it
title: "`scope`: symptom in lower-case present tense"
labels: bug
---

<!---
TITLE
  `scope`: symptom in lower-case present tense

  - `scope` is the exported symbol a consumer would recognise, backticked:
    `pie`, `dot`, `pyramid`, `roundTransformString`, `setOrdinalTicks`.
  - Two scopes when the defect is genuinely shared: `dot`, `bar`: …
  - Name the observable failure, not the cause and not the fix.
  - No trailing period. Aim for 80 characters or fewer.

BODY
  Keep the four sections below, in this order, and open with a short lead
  paragraph above them. Describe the problem and the tests it touches — the fix
  belongs in the PR, not here.

  Severity is recorded with a `severity: low|medium|high` label, not in the body.
--->

<!--- Lead: one or two sentences. What a consumer observes, in plain terms. --->

## Symptom

<!---
A minimal repro, 3-8 lines, annotated with `// got:` and `// want:`.
Then one `Expected:` line stating the contract that is being broken.
--->

```js

```

Expected:

## Source

<!---
One bullet per contributing line, as plain `path:line` — NOT a markdown link.
Relative links such as `../src/foo.ts` resolve against `/issues/` and 404, and
blob URLs go stale whenever a file is renamed or ported. Note that line numbers
drift, so say what the line does, not just where it is.

Mention sibling files that carry the same defect (`stackedPyramid.js` shares
several with `pyramid.ts`), so a fix does not land on only one of them.
--->

- `src/component/example.ts:00` —

## Impact

<!---
Who hits this, and how loudly it fails: crash, silent misrender, or cosmetic.
Say whether anything in `docs/` or `src/` triggers it today — "no in-repo caller"
is useful information. Note if fixing it changes rendered output or the public
API.
--->

## Tests

<!---
Mandatory. For each test: file, `Lnn`, the test name, and the action —
invert / rewrite / delete / move out of `known quirks` / leave as-is.

Tests that pin current broken behaviour live in a `known quirks` describe block
with a `// BUG:` comment, so fixing the defect means flipping them and moving
them out. Say so explicitly.

If nothing covers it, write "No test pins this today" and list `Add:` entries.
Add an `Add:` line for any gap the existing tests leave, even when coverage
exists.
--->

`test/component/example.test.ts`:

-
