---
name: security-check
description: Check a web or app project for the security problems beginners most often ship, and report them in plain language. Use after changing login, input handling, the database, file uploads or payments, before any deploy, and whenever the user asks whether their project is safe or asks for a security check.
---

# Security check

This is a review of common mistakes, not a guarantee. Never tell the user the project is "secure" or "safe". Say what was checked, what was found, and what could not be checked.

Decisions come from fixed rules first. Your own reading comes second and is always labelled as your judgment.

## Step 1: Look at the project first

Do not assume a language or framework. Read the project folder (package files, folder layout) and tell the user in one or two sentences what it is built with and what this check can cover. The scan script covers JavaScript and TypeScript, with partial Python support. For anything else, the pattern rules do not apply: say so, and do the reading in step 3 with extra care.

## Step 2: Run the scan script

```
node "${CLAUDE_SKILL_DIR}/scan.mjs" <project-folder>
```

It prints JSON with four parts:

- `findings`: problems found by fixed rules. Each has a rule, severity (`danger` or `warning`), file and line.
- `notChecked`: rules that could not run, with the reason.
- `needsReview`: questions the script cannot answer. You answer them in step 3.
- `stack`: what the script detected.

If the script fails or prints something that is not JSON, do not treat that as "no problems". Report every script rule under "Could not check" and continue with step 3.

Before reporting a finding, open the file and line and confirm it is real. If it is a false alarm (for example a test fixture), say so in one line instead of dropping it silently.

## Step 3: Read what a script cannot judge

Answer each `needsReview` question by reading the code. Mark each result as "my judgment".

| # | Question | What to look at |
|---|---|---|
| 3 | Can a page or route that shows or changes private data be opened without logging in? | Every route, API handler, and server action. Is login checked on the server, not only hidden in the screen? |
| 4 | Can one user see or change another user's data? | Wherever a record is loaded by an id from the address or request: is the owner compared with the logged-in user on the server? |
| 6 | Are database commands built from text across several lines? | The script reads one line at a time. Read multi-line queries by hand. |
| 7 | Are uploads limited? | File type and size checked on the server; files not stored where they can run as code. |
| 8 | Can a request be repeated without limit? | Login attempts, sign-up, password reset, and anything that costs money per call (AI, SMS, email). |
| 12 | Is personal information collected that the core feature does not need? | Forms and database columns compared with what the product actually does. Check DEVLOG.md Pinned for the agreed personal-data level. |

The full list this skill covers: (1) secrets in code or git, (2) secrets sent to the browser, (3) pages open without login, (4) access to other people's data, (5) database access rules off, (6) input used without checking, (7) unlimited uploads, (8) unlimited requests, (9) libraries with known vulnerabilities, (10) internal errors shown to visitors, (11) the server opening addresses supplied by visitors, (12) unneeded personal data.

## Step 4: Report

Write in the user's language, in plain words. One short paragraph per item: what it is, what could happen, where it is (file and line). Use this structure every time:

```
## What I checked
<stack, and how many files>

## Problems found
### Danger
### Warning

## Temporary measures
<quick steps that reduce the risk now but do not fix the cause, e.g. "replace the leaked key today">

## Real fixes
<the change that removes the cause, per problem, with the effort it takes>

## Could not check
<every notChecked reason, anything unsupported, and anything you were unsure about>
```

Rules for the report:
- Mark each item as "found by rule" or "my judgment".
- "Could not check" is never empty by omission. If truly nothing was skipped, say so.
- Never print a secret value. Give the file and line only.
- If a secret was ever saved in git, the temporary measure is always: replace that key with a new one at the service that issued it. Removing the file does not remove it from history.

## Step 5: Fix

- **Apply right away** (mechanical, no behavior change): move a hard-coded key to an environment variable, add a secret file to .gitignore, stop tracking a secret file.
- **Show first, then apply after the user agrees** (behavior changes): login checks, ownership checks, database access rules, input validation, upload and rate limits. Show what will change and how you will confirm it still works.
- Fix the cause, not the symptom. Do not rewrite unrelated code.
- Recommended defaults: deny by default and allow specific things; check permissions on the server; use parameterized database queries; for addresses supplied by users, use a fixed list of allowed hosts, because a pattern match alone cannot make an address safe.
- After fixing, run the scan again and say what changed.

## Step 6: Record

Add every unfixed problem to DEVLOG.md under Open issues (danger goes to "Fix now"). Add a Log line with the date and the counts. See `nondev-kit:journal`.

## When to tell the user to get more help

If the project handles payments, health data, ID numbers, or children's data, say plainly that this check is not enough and that an expert review or a real penetration test is needed before release.
