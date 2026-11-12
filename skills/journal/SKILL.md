---
name: journal
description: Create or update the project journal (DEVLOG.md), or roll it over to a new version. Use when DEVLOG.md needs to be created, when a decision, signup, cost, workaround or open problem must be recorded, when the user asks what was decided or what is next, or when the user says the project is moving to a new version.
---

# Project journal (DEVLOG.md)

The journal is the project's memory. You forget everything between sessions; this file is how the work continues. It is also written for the user, so keep every line in plain words, in the user's language. Keep the four section headings below in English exactly as written, because the session-start hook looks for them.

## File format

`DEVLOG.md` in the project root:

```markdown
# Journal: <project name>

## Now
Stage: <idea | plan | design | build | test | release | upkeep>
Next: <the next one or two things to do>

## Pinned
<never summarized; see below>

## Open issues
### Fix now
### Later
### Can ignore

## Log
### <YYYY-MM-DD>
- <what was done, one line each>
```

Everything above `## Log` is loaded into every session automatically. The Log is not.

## What goes in Pinned

Only things that would cause real trouble if forgotten:

- Decisions and the reason for each ("Website, not an app: no store review, lowest cost").
- Services signed up for, what each costs, and when to review the cost.
- Where secret keys are kept (the location, never the key itself).
- Things that must not be done ("Do not make the repository public: early history contains test data").
- Things only the user can do (renew a domain, enter payment details).

One line per item, with the date. Never write a secret value in the journal.

## When to write

Write right away, not at the end of the session, when:

- a decision is made, including a technical choice you made for the user;
- a service is signed up for or a cost appears;
- a workaround is used instead of a real fix;
- a problem is found and left open;
- the stage or the next step changes (update Now);
- a task is finished (one Log line).

## Rules

1. **Never shorten, merge, or reword Pinned on your own.** Add to it freely. Remove or change an item only when the user says so.
2. **Pinned limit: 50 lines.** When it would go over, do not trim it. Show the user the list and ask which items can move to the Log. Recommend the ones that are settled and no longer affect anything.
3. Open issues: each has a plain description and the evidence (file and line, or the error). When fixed, move it to the Log as one line.
4. Log entries are short: what changed, not how.
5. If DEVLOG.md already exists in another shape, keep its content and add the missing sections. Do not overwrite it.

## Rolling over to a new version

Do this only when the user says the project is moving to a new version (for example "this is v2 now" or "let's start the next version").

1. Commit the current state to git first, so nothing is lost.
2. Replace the whole Log with one block:
   ```markdown
   ## Log
   ### Summary of <old version> (<first date> to <last date>)
   - <5 to 10 lines: what was built, what was removed, what was learned>
   ```
3. Leave **Pinned exactly as it is**, character for character.
4. Leave Open issues as they are. Do not drop unresolved ones.
5. Update Now for the new version.
6. Tell the user: how many Log lines became how many, and that Pinned was not touched.
